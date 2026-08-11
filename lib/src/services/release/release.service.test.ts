import { afterEach, beforeEach, describe, expect, it, vi, type MockInstance } from "vitest";
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
  let stageReleaseFiles: MockInstance<typeof releaseGitService.stageReleaseFiles>;
  let commit: MockInstance<typeof releaseGitService.commit>;
  let tagRelease: MockInstance<typeof releaseGitService.tagRelease>;
  let push: MockInstance<typeof releaseGitService.push>;
  let checkAuth: MockInstance<typeof releaseGithubService.checkAuth>;
  let publishRelease: MockInstance<typeof releaseGithubService.publishRelease>;
  let readTp2Version: MockInstance<typeof releaseVersionFilesService.readTp2Version>;
  let writePackageVersion: MockInstance<typeof releaseVersionFilesService.writePackageVersion>;
  let writeTp2Version: MockInstance<typeof releaseVersionFilesService.writeTp2Version>;
  let rollover: MockInstance<typeof releaseChangelogService.rollover>;
  let generateChangelog: MockInstance<typeof changelogService.generate>;
  let generateAll: MockInstance<typeof mainService.generateAll>;
  let createZip: MockInstance<typeof releasePackageService.createZip>;

  beforeEach(() => {
    vi.spyOn(logService, "init").mockImplementation(() => {});
    vi.spyOn(logService, "log").mockImplementation(() => {});
    currentBranch = vi.spyOn(releaseGitService, "currentBranch").mockReturnValue(MASTER);
    isTreeClean = vi.spyOn(releaseGitService, "isTreeClean").mockReturnValue(true);
    isUpToDateWithRemote = vi
      .spyOn(releaseGitService, "isUpToDateWithRemote")
      .mockReturnValue(true);
    tagExistsAtHead = vi.spyOn(releaseGitService, "tagExistsAtHead").mockReturnValue(false);
    stageReleaseFiles = vi
      .spyOn(releaseGitService, "stageReleaseFiles")
      .mockImplementation(() => {});
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
    vi.spyOn(releaseChangelogService, "extractNotes").mockReturnValue(RELEASE_NOTES);
    generateChangelog = vi.spyOn(changelogService, "generate").mockImplementation(() => {});
    generateAll = vi.spyOn(mainService, "generateAll").mockResolvedValue(undefined);
    createZip = vi
      .spyOn(releasePackageService, "createZip")
      .mockReturnValue(`dist/enhanced_creatures-${TAG}.zip`);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs the full flow for a fresh release", async () => {
    await releaseService.release(VERSION);

    expect(currentBranch).toHaveBeenCalled();
    expect(isTreeClean).toHaveBeenCalled();
    expect(isUpToDateWithRemote).toHaveBeenCalledWith(MASTER);
    expect(checkAuth).toHaveBeenCalled();
    expect(generateAll).toHaveBeenCalled();
    expect(writePackageVersion).toHaveBeenCalledWith(expect.any(String), VERSION);
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
    isUpToDateWithRemote.mockReturnValue(false);

    await expect(releaseService.release(VERSION)).rejects.toThrow(/not up to date/);
  });

  it("rejects when package.json and tp2 versions disagree", async () => {
    readTp2Version.mockReturnValue("0.0.9");

    await expect(releaseService.release(VERSION)).rejects.toThrow(/do not match/);
  });

  it("resumes from packaging when the tag already exists at HEAD, skipping generate/commit/push", async () => {
    tagExistsAtHead.mockReturnValue(true);

    await releaseService.release(VERSION);

    expect(generateAll).not.toHaveBeenCalled();
    expect(commit).not.toHaveBeenCalled();
    expect(push).not.toHaveBeenCalled();
    expect(createZip).toHaveBeenCalledWith(VERSION);
    expect(publishRelease).toHaveBeenCalledWith(
      TAG,
      `dist/enhanced_creatures-${TAG}.zip`,
      RELEASE_NOTES,
    );
  });
});
