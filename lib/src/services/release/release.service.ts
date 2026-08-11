import childProcess from "child_process";
import * as path from "path";
import changelogService from "../doc/changelog.service";
import logService from "../log.service";
import mainService from "../main.service";
import { isGreater, parseVersion } from "../utils/version.utils";
import releaseChangelogService from "./release-changelog.service";
import releaseGitService from "./release-git.service";
import releaseGithubService from "./release-github.service";
import releasePackageService from "./release-package.service";
import releaseVersionFilesService from "./release-version-files.service";

const BRANCH = "master";

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
    this.checkUpToDate();
    releaseGithubService.checkAuth();

    const tag = `v${version}`;
    const resuming = releaseGitService.tagExistsAtHead(tag);

    if (!resuming) {
      this.checkVersionsMatch();
      const currentVersion = releaseVersionFilesService.readPackageVersion(this.packageJsonPath);
      if (!isGreater(target, parseVersion(currentVersion))) {
        throw new Error(`${version} must be greater than the current version ${currentVersion}`);
      }

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
      releaseGitService.push(BRANCH);
    } else {
      logService.log(`Tag ${tag} already exists at HEAD, resuming from packaging`);
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

  private checkUpToDate(): void {
    const status = releaseGitService.isUpToDateWithRemote(BRANCH);
    if (status === "up-to-date") return;
    if (status === "ahead") {
      throw new Error(
        `Local "${BRANCH}" is ahead of "origin/${BRANCH}" - a previous release may have ` +
          `pushed successfully already. Try re-running the release command; it will detect ` +
          `the existing tag and resume from packaging.`,
      );
    }
    throw new Error(`Local "${BRANCH}" is not up to date with "origin/${BRANCH}", pull first`);
  }

  private syncPackageLock(): void {
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
