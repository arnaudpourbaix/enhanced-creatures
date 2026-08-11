import childProcess from "child_process";
import * as path from "path";
import changelogService from "../doc/changelog.service";
import logService from "../log.service";
import mainService from "../main.service";
import { extractStderr } from "../utils/process.utils";
import { isGreater, parseVersion } from "../utils/version.utils";
import releaseChangelogService from "./release-changelog.service";
import releaseGitService from "./release-git.service";
import releaseGithubService from "./release-github.service";
import releasePackageService from "./release-package.service";
import releaseVersionFilesService from "./release-version-files.service";

const BRANCH = "master";

// How much of a previous, partially-completed release run is already on disk:
// - "none": nothing to resume, run the whole flow.
// - "resume-push": the commit and tag exist locally but never reached origin (the push itself is
//   what failed), so everything up to the tag is done and only the push still has to happen.
// - "resume-packaging": commit, tag and push all landed, only packaging/publishing is left.
type ResumeState = "none" | "resume-push" | "resume-packaging";

class ReleaseService {
  repoRoot = path.resolve(__dirname, "..", "..", "..", "..");
  packageJsonPath = path.join(this.repoRoot, "package.json");
  tp2Path = path.join(this.repoRoot, "mod", "enhanced_creatures.tp2");
  changelogPath = path.join(this.repoRoot, "mod", "CHANGELOG.md");

  async release(version: string): Promise<void> {
    const target = parseVersion(version);
    logService.init();

    this.checkBranch();
    this.checkCleanTree();
    releaseGithubService.checkAuth();

    const tag = `v${version}`;
    // The remote-sync check has to come after the resume state is known: when the previous run's
    // push is what failed, local "master" is legitimately ahead of origin and rejecting that here
    // would make the failure permanently unrecoverable by re-running.
    const resume = this.resumeState(tag);

    if (resume === "none") {
      this.checkUpToDate();
      this.checkVersionsMatch();
      const currentVersion = releaseVersionFilesService.readPackageVersion(this.packageJsonPath);
      if (!isGreater(target, parseVersion(currentVersion))) {
        throw new Error(`${version} must be greater than the current version ${currentVersion}`);
      }

      this.checkTestsPass();

      await mainService.generateAll();

      releaseVersionFilesService.writePackageVersion(this.packageJsonPath, version);
      this.syncPackageLock();
      releaseVersionFilesService.writeTp2Version(this.tp2Path, version);
      const today = new Date().toISOString().slice(0, 10);
      releaseChangelogService.rollover(this.changelogPath, version, today);
      changelogService.generate();

      logService.log(`Committing release ${tag}`);
      releaseGitService.stageReleaseFiles();
      releaseGitService.commit(`chore: release ${tag}`);
      releaseGitService.tagRelease(tag, `Release ${tag}`);
    } else if (resume === "resume-push") {
      logService.log(
        `Tag ${tag} exists at HEAD but not on origin - the previous run's push did not land, ` +
          `resuming from push`,
      );
      this.checkPushable(tag);
    } else {
      logService.log(`Tag ${tag} already exists at HEAD and on origin, resuming from packaging`);
      this.checkUpToDate();
    }

    // Both the fresh flow and the push-resume flow end with the same push; only the
    // already-pushed case skips it.
    if (resume !== "resume-packaging") {
      releaseGitService.push(BRANCH);
    }

    const notes = releaseChangelogService.extractNotes(this.changelogPath, version);
    try {
      const zipPath = releasePackageService.createZip(version);
      logService.log(`Publishing GitHub release ${tag}`);
      releaseGithubService.publishRelease(tag, zipPath, notes);
    } catch (e: unknown) {
      throw new Error(
        `Packaging/publishing failed for ${tag}, but the commit, tag, and push to "${BRANCH}" ` +
          `already succeeded - that state is already public. Fix the underlying issue and re-run ` +
          `\`npm run release -- ${version}\`; it will detect the existing tag and resume from ` +
          `packaging, skipping the commit/tag/push.`,
        { cause: e },
      );
    }
  }

  private resumeState(tag: string): ResumeState {
    if (!releaseGitService.tagExistsAtHead(tag)) return "none";
    return releaseGitService.tagExistsOnRemote(tag) ? "resume-packaging" : "resume-push";
  }

  private checkBranch(): void {
    const branch = releaseGitService.currentBranch();
    if (branch !== BRANCH) {
      throw new Error(`Releases must be cut from "${BRANCH}", but current branch is "${branch}"`);
    }
  }

  private checkCleanTree(): void {
    if (!releaseGitService.isTreeClean()) {
      throw new Error(
        "Working tree is not clean, commit or stash changes before releasing. If this is " +
          "left over from a release attempt that failed partway through (before the commit " +
          "step), discard the partial changes instead of committing them, e.g. " +
          "`git checkout -- package.json mod`",
      );
    }
  }

  // Only reached when there is no unpushed release commit to explain the divergence: either
  // nothing is being resumed, or the release commit is already on origin. "ahead" caused by a
  // failed push is handled by checkPushable() instead, and needs no operator action at all.
  private checkUpToDate(): void {
    const status = releaseGitService.isUpToDateWithRemote(BRANCH);
    if (status === "up-to-date") return;
    if (status === "ahead") {
      throw new Error(
        `Local "${BRANCH}" is ahead of "origin/${BRANCH}" with commits that are not part of a ` +
          `pending release - push or discard them before releasing`,
      );
    }
    throw new Error(`Local "${BRANCH}" is not up to date with "origin/${BRANCH}", pull first`);
  }

  // Resuming a release whose push failed: local is expected to be ahead by exactly the release
  // commit, so "ahead" is the normal state here rather than an error ("up-to-date" is fine too -
  // the commit landed and only the tag still has to go up). "behind"/"diverged" mean origin moved
  // on since the release commit was made, which needs a manual rebase/merge - re-pushing over
  // that would either be rejected or bury someone else's work.
  private checkPushable(tag: string): void {
    const status = releaseGitService.isUpToDateWithRemote(BRANCH);
    if (status === "up-to-date" || status === "ahead") return;
    throw new Error(
      `Release ${tag} is committed and tagged locally but never reached origin, and local ` +
        `"${BRANCH}" is now ${status} relative to "origin/${BRANCH}" - reconcile the two ` +
        `histories by hand (keeping the release commit at HEAD) before re-running the release`,
    );
  }

  private checkTestsPass(): void {
    logService.log("Running tests");
    try {
      // "npm" is resolved from PATH deliberately - same rationale as syncPackageLock() below
      // (npm.cmd on Windows needs shell:true). stdio: "inherit" streams the run live rather than
      // buffering it, since a full suite can take a while and a silent hang would look identical
      // to a bug.
      // eslint-disable-next-line sonarjs/no-os-command-from-path
      childProcess.execFileSync("npm", ["test"], {
        cwd: this.repoRoot,
        stdio: "inherit",
        shell: true,
      });
    } catch (e: unknown) {
      throw new Error("Tests are failing - fix them before releasing (see output above)", {
        cause: e,
      });
    }
  }

  private syncPackageLock(): void {
    try {
      // "npm" is resolved from PATH deliberately - this wraps the user's own npm installation
      // for a local release CLI, not an untrusted/attacker-controlled PATH scenario (same
      // reasoning as the git/gh wrappers). Unlike those, npm on Windows is npm.cmd, not a native
      // executable - execFileSync refuses to run .cmd/.bat files without shell:true (Node blocks
      // it outright as of the fix for GHSA-hxrc-f9gm-xrxp/nodejs#52554), so this needs shell:true.
      // Args are still passed array-form (not string-concatenated), so this isn't
      // shell-injection-prone.
      // eslint-disable-next-line sonarjs/no-os-command-from-path
      childProcess.execFileSync("npm", ["install", "--package-lock-only"], {
        cwd: this.repoRoot,
        stdio: "pipe",
        shell: true,
      });
    } catch (e: unknown) {
      // stdio: "pipe" means npm's own diagnostics land on the error's `.stderr` instead of the
      // terminal - without folding them in, every lockfile failure reads as "Command failed".
      const message = e instanceof Error ? e.message : String(e);
      const stderr = extractStderr(e);
      const detail = stderr ? `${message}: ${stderr}` : message;
      throw new Error(`Failed to update package-lock.json: ${detail}`, { cause: e });
    }
  }

  private checkVersionsMatch(): void {
    const pkgVersion = releaseVersionFilesService.readPackageVersion(this.packageJsonPath);
    const tp2Version = releaseVersionFilesService.readTp2Version(this.tp2Path);
    if (pkgVersion !== tp2Version) {
      throw new Error(
        `package.json version (${pkgVersion}) and tp2 VERSION (${tp2Version}) do not match`,
      );
    }
  }
}

const releaseService = new ReleaseService();
export default releaseService;
