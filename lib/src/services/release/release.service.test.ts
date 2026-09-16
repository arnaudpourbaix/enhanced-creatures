import childProcess from "child_process";
import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
import { GLOBAL_CONFIG } from "../../../config/generate";
import changelogService from "../doc/changelog.service";
import logService from "../log.service";
import mainService from "../main.service";
import releaseChangelogService from "./release-changelog.service";
import releaseGitService from "./release-git.service";
import releaseGithubService from "./release-github.service";
import releasePackageService from "./release-package.service";
import releaseService from "./release.service";
import releaseVersionFilesService from "./release-version-files.service";

const MASTER = "master";
const VERSION = "0.2.0";
const TAG = `v${VERSION}`;
const RELEASE_NOTES = "release notes";

describe("ReleaseService", () => {
  let currentBranch: MockInstance<typeof releaseGitService.currentBranch>;
  let isTreeClean: MockInstance<typeof releaseGitService.isTreeClean>;
  let isUpToDateWithRemote: MockInstance<typeof releaseGitService.isUpToDateWithRemote>;
  let tagExistsAtHead: MockInstance<typeof releaseGitService.tagExistsAtHead>;
  let tagExistsOnRemote: MockInstance<typeof releaseGitService.tagExistsOnRemote>;
  let stageReleaseFiles: MockInstance<typeof releaseGitService.stageReleaseFiles>;
  let restoreModTree: MockInstance<typeof releaseGitService.restoreModTree>;
  let commit: MockInstance<typeof releaseGitService.commit>;
  let tagRelease: MockInstance<typeof releaseGitService.tagRelease>;
  let push: MockInstance<typeof releaseGitService.push>;
  let checkAuth: MockInstance<typeof releaseGithubService.checkAuth>;
  let publishRelease: MockInstance<typeof releaseGithubService.publishRelease>;
  let readTp2Version: MockInstance<typeof releaseVersionFilesService.readTp2Version>;
  let writePackageVersion: MockInstance<typeof releaseVersionFilesService.writePackageVersion>;
  let writeTp2Version: MockInstance<typeof releaseVersionFilesService.writeTp2Version>;
  let rollover: MockInstance<typeof releaseChangelogService.rollover>;
  let hasUnreleasedNotes: MockInstance<typeof releaseChangelogService.hasUnreleasedNotes>;
  let generateChangelog: MockInstance<typeof changelogService.generate>;
  let generateAll: MockInstance<typeof mainService.generateAll>;
  let createZip: MockInstance<typeof releasePackageService.createZip>;
  let execFileSync: MockInstance<typeof childProcess.execFileSync>;

  beforeEach(() => {
    vi.spyOn(logService, "init").mockImplementation(() => {});
    vi.spyOn(logService, "log").mockImplementation(() => {});
    execFileSync = vi.spyOn(childProcess, "execFileSync").mockReturnValue("");
    currentBranch = vi.spyOn(releaseGitService, "currentBranch").mockReturnValue(MASTER);
    isTreeClean = vi.spyOn(releaseGitService, "isTreeClean").mockReturnValue(true);
    isUpToDateWithRemote = vi
      .spyOn(releaseGitService, "isUpToDateWithRemote")
      .mockReturnValue("up-to-date");
    tagExistsAtHead = vi.spyOn(releaseGitService, "tagExistsAtHead").mockReturnValue(false);
    tagExistsOnRemote = vi.spyOn(releaseGitService, "tagExistsOnRemote").mockReturnValue(false);
    stageReleaseFiles = vi
      .spyOn(releaseGitService, "stageReleaseFiles")
      .mockImplementation(() => {});
    restoreModTree = vi.spyOn(releaseGitService, "restoreModTree").mockImplementation(() => {});
    commit = vi.spyOn(releaseGitService, "commit").mockImplementation(() => {});
    tagRelease = vi.spyOn(releaseGitService, "tagRelease").mockImplementation(() => {});
    push = vi.spyOn(releaseGitService, "push").mockImplementation(() => {});
    checkAuth = vi.spyOn(releaseGithubService, "checkAuth").mockImplementation(() => {});
    publishRelease = vi.spyOn(releaseGithubService, "publishRelease").mockImplementation(() => {});
    vi.spyOn(releaseVersionFilesService, "readPackageVersion").mockReturnValue("0.1.0");
    readTp2Version = vi
      .spyOn(releaseVersionFilesService, "readTp2Version")
      .mockReturnValue("0.1.0");
    writePackageVersion = vi
      .spyOn(releaseVersionFilesService, "writePackageVersion")
      .mockImplementation(() => {});
    writeTp2Version = vi
      .spyOn(releaseVersionFilesService, "writeTp2Version")
      .mockImplementation(() => {});
    rollover = vi.spyOn(releaseChangelogService, "rollover").mockImplementation(() => {});
    hasUnreleasedNotes = vi
      .spyOn(releaseChangelogService, "hasUnreleasedNotes")
      .mockReturnValue(true);
    vi.spyOn(releaseChangelogService, "extractNotes").mockReturnValue(RELEASE_NOTES);
    generateChangelog = vi.spyOn(changelogService, "generate").mockImplementation(() => {});
    generateAll = vi.spyOn(mainService, "generateAll").mockResolvedValue(undefined);
    createZip = vi
      .spyOn(releasePackageService, "createZip")
      .mockReturnValue(`dist/enhanced_creatures-${TAG}.zip`);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    GLOBAL_CONFIG.enableRandomTargetOrder = false;
    GLOBAL_CONFIG.enableSecondaryTypes = false;
  });

  it("runs the full flow for a fresh release", async () => {
    await releaseService.release(VERSION);

    expect(currentBranch).toHaveBeenCalled();
    expect(isTreeClean).toHaveBeenCalled();
    expect(isUpToDateWithRemote).toHaveBeenCalledWith(MASTER);
    expect(checkAuth).toHaveBeenCalled();
    expect(execFileSync).toHaveBeenCalledWith("npm", ["test"], expect.objectContaining({}));
    expect(generateAll).toHaveBeenCalled();
    expect(writePackageVersion).toHaveBeenCalledWith(expect.any(String), VERSION);
    expect(execFileSync).toHaveBeenCalledWith(
      "npm",
      ["install", "--package-lock-only"],
      expect.objectContaining({}),
    );
    // tests must run before generate, not just at some point during the release
    const testCallOrder = execFileSync.mock.calls.findIndex((call) => call[1]?.[0] === "test");
    expect(testCallOrder).toBeGreaterThanOrEqual(0);
    expect(generateAll.mock.invocationCallOrder[0]).toBeGreaterThan(
      execFileSync.mock.invocationCallOrder[testCallOrder],
    );
    expect(writeTp2Version).toHaveBeenCalledWith(expect.any(String), VERSION);
    expect(rollover).toHaveBeenCalledWith(
      expect.any(String),
      VERSION,
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
    expect(generateChangelog).toHaveBeenCalled();
    expect(stageReleaseFiles).toHaveBeenCalled();
    expect(commit).toHaveBeenCalledWith(expect.stringContaining(TAG));
    expect(tagRelease).toHaveBeenCalledWith(TAG, expect.any(String));
    expect(push).toHaveBeenCalledWith(MASTER);
    expect(createZip).toHaveBeenCalledWith(VERSION);
    expect(publishRelease).toHaveBeenCalledWith(
      TAG,
      `dist/enhanced_creatures-${TAG}.zip`,
      RELEASE_NOTES,
    );
  });

  it("builds the release zip from a regeneration with random target order and secondary types on", async () => {
    let flagsWhenZipped: [boolean, boolean] | undefined;
    createZip.mockImplementation(() => {
      flagsWhenZipped = [
        GLOBAL_CONFIG.enableRandomTargetOrder,
        GLOBAL_CONFIG.enableSecondaryTypes,
      ];
      return `dist/enhanced_creatures-${TAG}.zip`;
    });

    await releaseService.release(VERSION);

    expect(flagsWhenZipped).toEqual([true, true]);
    // a regeneration feeds the zip - the last generateAll runs right before createZip
    const lastGenerate = Math.max(...generateAll.mock.invocationCallOrder);
    expect(lastGenerate).toBeLessThan(createZip.mock.invocationCallOrder[0]);
  });

  it("restores the flags and the mod working tree after the zip is built", async () => {
    await releaseService.release(VERSION);

    expect(GLOBAL_CONFIG.enableRandomTargetOrder).toBe(false);
    expect(GLOBAL_CONFIG.enableSecondaryTypes).toBe(false);
    expect(restoreModTree.mock.invocationCallOrder[0]).toBeGreaterThan(
      createZip.mock.invocationCallOrder[0],
    );
  });

  it("restores the flags and the mod working tree even when the zip build throws", async () => {
    createZip.mockImplementation(() => {
      throw new Error("zip failed");
    });

    await releaseService.release(VERSION).catch(() => undefined);

    expect(GLOBAL_CONFIG.enableRandomTargetOrder).toBe(false);
    expect(GLOBAL_CONFIG.enableSecondaryTypes).toBe(false);
    expect(restoreModTree).toHaveBeenCalled();
  });

  it("rejects an invalid version format before any side effects", async () => {
    await expect(releaseService.release("1.2")).rejects.toThrow(/not a valid version/);
    expect(currentBranch).not.toHaveBeenCalled();
  });

  it("rejects a version that is not greater than the current one", async () => {
    await expect(releaseService.release("0.1.0")).rejects.toThrow(/greater than/);
    expect(generateAll).not.toHaveBeenCalled();
  });

  it("rejects when the current branch is not master", async () => {
    currentBranch.mockReturnValue("dev");

    await expect(releaseService.release(VERSION)).rejects.toThrow(/must be cut from "master"/);
  });

  it("rejects when the working tree is not clean", async () => {
    isTreeClean.mockReturnValue(false);

    await expect(releaseService.release(VERSION)).rejects.toThrow(/not clean/);
  });

  it("rejects when local master is behind origin", async () => {
    isUpToDateWithRemote.mockReturnValue("behind");

    await expect(releaseService.release(VERSION)).rejects.toThrow(/not up to date/);
  });

  it("rejects when local master is ahead of origin without a release tag at HEAD to resume", async () => {
    isUpToDateWithRemote.mockReturnValue("ahead");

    await expect(releaseService.release(VERSION)).rejects.toThrow(/ahead of "origin\/master"/);
    await expect(releaseService.release(VERSION)).rejects.toThrow(/push or discard them/);
    expect(currentBranch).toHaveBeenCalled();
    expect(generateAll).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("rejects when package.json and tp2 versions disagree", async () => {
    readTp2Version.mockReturnValue("0.0.9");

    await expect(releaseService.release(VERSION)).rejects.toThrow(/do not match/);
  });

  it("rejects when the changelog's Unreleased section is empty", async () => {
    hasUnreleasedNotes.mockReturnValue(false);

    await expect(releaseService.release(VERSION)).rejects.toThrow(/Unreleased.*section is empty/);
    expect(generateAll).not.toHaveBeenCalled();
  });

  it("resumes from packaging when the tag exists at HEAD and on origin, skipping commit/tag/push", async () => {
    tagExistsAtHead.mockReturnValue(true);
    tagExistsOnRemote.mockReturnValue(true);

    await releaseService.release(VERSION);

    expect(writePackageVersion).not.toHaveBeenCalled();
    expect(rollover).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    expect(tagRelease).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    // the artifact is still rebuilt fresh from a flag-on regeneration
    expect(generateAll).toHaveBeenCalled();
    expect(restoreModTree).toHaveBeenCalled();
    expect(createZip).toHaveBeenCalledWith(VERSION);
    expect(publishRelease).toHaveBeenCalledWith(
      TAG,
      `dist/enhanced_creatures-${TAG}.zip`,
      RELEASE_NOTES,
    );
  });

  it("retries the push when the tag exists at HEAD but not on origin, skipping commit/tag", async () => {
    tagExistsAtHead.mockReturnValue(true);
    tagExistsOnRemote.mockReturnValue(false);
    // a failed push leaves local master legitimately ahead - that must not block the re-run
    isUpToDateWithRemote.mockReturnValue("ahead");

    await releaseService.release(VERSION);

    expect(writePackageVersion).not.toHaveBeenCalled();
    expect(rollover).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    expect(tagRelease).not.toHaveBeenCalled();
    // the commit-flow's npm steps (test run, package-lock sync) are skipped; the only generate is
    // the flag-on one that feeds the zip
    expect(execFileSync).not.toHaveBeenCalled();
    expect(generateAll).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith(MASTER);
    expect(createZip).toHaveBeenCalledWith(VERSION);
    expect(publishRelease).toHaveBeenCalledWith(
      TAG,
      `dist/enhanced_creatures-${TAG}.zip`,
      RELEASE_NOTES,
    );
  });

  it("retries the push when the commit reached origin but the tag did not", async () => {
    tagExistsAtHead.mockReturnValue(true);
    tagExistsOnRemote.mockReturnValue(false);
    isUpToDateWithRemote.mockReturnValue("up-to-date");

    await releaseService.release(VERSION);

    expect(push).toHaveBeenCalledWith(MASTER);
    expect(publishRelease).toHaveBeenCalled();
  });

  it.each(["behind", "diverged"] as const)(
    "refuses to re-push an unpushed release when origin is %s",
    async (status) => {
      tagExistsAtHead.mockReturnValue(true);
      tagExistsOnRemote.mockReturnValue(false);
      isUpToDateWithRemote.mockReturnValue(status);

      await expect(releaseService.release(VERSION)).rejects.toThrow(/reconcile the two/);
      expect(push).not.toHaveBeenCalled();
      expect(createZip).not.toHaveBeenCalled();
    },
  );

  it("surfaces npm's stderr when the package-lock sync fails", async () => {
    const npmError = Object.assign(new Error("Command failed: npm install"), {
      stderr: Buffer.from("npm ERR! code EACCES\n"),
    });
    execFileSync.mockImplementation((_command, args) => {
      if (Array.isArray(args) && args[0] === "install") throw npmError;
      return "";
    });

    const failure: unknown = await releaseService.release(VERSION).catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(Error);
    const error = failure as Error;
    expect(error.message).toMatch(/Failed to update package-lock\.json/);
    expect(error.message).toContain("npm ERR! code EACCES");
    expect(error.cause).toBe(npmError);
    // the lockfile sync happens before any git side effect - nothing must have been committed
    expect(commit).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("aborts before generating when tests are failing", async () => {
    const testError = new Error("Command failed: npm test");
    execFileSync.mockImplementation((_command, args) => {
      if (Array.isArray(args) && args[0] === "test") throw testError;
      return "";
    });

    const failure: unknown = await releaseService.release(VERSION).catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(Error);
    const error = failure as Error;
    expect(error.message).toMatch(/Tests are failing/);
    expect(error.cause).toBe(testError);
    // generate/commit/push must not run when tests are red
    expect(generateAll).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
  });

  it("wraps a packaging/publishing failure with a resume-guidance message, chaining the original error", async () => {
    const publishError = new Error("gh release create failed: release already exists");
    publishRelease.mockImplementation(() => {
      throw publishError;
    });

    const failure: unknown = await releaseService.release(VERSION).catch((e: unknown) => e);

    expect(failure).toBeInstanceOf(Error);
    const error = failure as Error;
    expect(error.message).toMatch(/commit, tag, and push/i);
    expect(error.message).toMatch(/already succeeded/i);
    expect(error.message).toMatch(new RegExp(`npm run release -- ${VERSION}`));
    expect(error.cause).toBe(publishError);
    // the commit/tag/push already happened before packaging runs - a packaging failure must not
    // be reported as if nothing happened yet
    expect(commit).toHaveBeenCalled();
    expect(push).toHaveBeenCalled();
  });
});
