import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import changelogService from "../doc/changelog.service";
import logService from "../log.service";
import mainService from "../main.service";
import releaseChangelogService from "./release-changelog.service";
import releaseGitService from "./release-git.service";
import releaseGithubService from "./release-github.service";
import releasePackageService from "./release-package.service";
import releaseService from "./release.service";
import releaseVersionFilesService from "./release-version-files.service";

describe("ReleaseService", () => {
  beforeEach(() => {
    vi.spyOn(logService, "init").mockImplementation(() => {});
    vi.spyOn(logService, "log").mockImplementation(() => {});
    vi.spyOn(releaseGitService, "currentBranch").mockReturnValue("master");
    vi.spyOn(releaseGitService, "isTreeClean").mockReturnValue(true);
    vi.spyOn(releaseGitService, "isUpToDateWithRemote").mockReturnValue(true);
    vi.spyOn(releaseGitService, "tagExistsAtHead").mockReturnValue(false);
    vi.spyOn(releaseGitService, "stageReleaseFiles").mockImplementation(() => {});
    vi.spyOn(releaseGitService, "commit").mockImplementation(() => {});
    vi.spyOn(releaseGitService, "tagRelease").mockImplementation(() => {});
    vi.spyOn(releaseGitService, "push").mockImplementation(() => {});
    vi.spyOn(releaseGithubService, "checkAuth").mockImplementation(() => {});
    vi.spyOn(releaseGithubService, "publishRelease").mockImplementation(() => {});
    vi.spyOn(releaseVersionFilesService, "readPackageVersion").mockReturnValue("0.1.0");
    vi.spyOn(releaseVersionFilesService, "readTp2Version").mockReturnValue("0.1.0");
    vi.spyOn(releaseVersionFilesService, "writePackageVersion").mockImplementation(() => {});
    vi.spyOn(releaseVersionFilesService, "writeTp2Version").mockImplementation(() => {});
    vi.spyOn(releaseChangelogService, "rollover").mockImplementation(() => {});
    vi.spyOn(releaseChangelogService, "extractNotes").mockReturnValue("release notes");
    vi.spyOn(changelogService, "generate").mockImplementation(() => {});
    vi.spyOn(mainService, "generateAll").mockResolvedValue(undefined);
    vi.spyOn(releasePackageService, "createZip").mockReturnValue("dist/enhanced_creatures-v0.2.0.zip");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs the full flow for a fresh release", async () => {
    await releaseService.release("0.2.0");

    expect(releaseGitService.currentBranch).toHaveBeenCalled();
    expect(releaseGitService.isTreeClean).toHaveBeenCalled();
    expect(releaseGitService.isUpToDateWithRemote).toHaveBeenCalledWith("master");
    expect(releaseGithubService.checkAuth).toHaveBeenCalled();
    expect(mainService.generateAll).toHaveBeenCalled();
    expect(releaseVersionFilesService.writePackageVersion).toHaveBeenCalledWith(
      expect.any(String),
      "0.2.0",
    );
    expect(releaseVersionFilesService.writeTp2Version).toHaveBeenCalledWith(
      expect.any(String),
      "0.2.0",
    );
    expect(releaseChangelogService.rollover).toHaveBeenCalledWith(
      expect.any(String),
      "0.2.0",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
    expect(changelogService.generate).toHaveBeenCalled();
    expect(releaseGitService.stageReleaseFiles).toHaveBeenCalled();
    expect(releaseGitService.commit).toHaveBeenCalledWith(expect.stringContaining("v0.2.0"));
    expect(releaseGitService.tagRelease).toHaveBeenCalledWith("v0.2.0", expect.any(String));
    expect(releaseGitService.push).toHaveBeenCalledWith("master");
    expect(releasePackageService.createZip).toHaveBeenCalledWith("0.2.0");
    expect(releaseGithubService.publishRelease).toHaveBeenCalledWith(
      "v0.2.0",
      "dist/enhanced_creatures-v0.2.0.zip",
      "release notes",
    );
  });

  it("rejects an invalid version format before any side effects", async () => {
    await expect(releaseService.release("1.2")).rejects.toThrow(/not a valid version/);
    expect(releaseGitService.currentBranch).not.toHaveBeenCalled();
  });

  it("rejects a version that is not greater than the current one", async () => {
    await expect(releaseService.release("0.1.0")).rejects.toThrow(/greater than/);
    expect(mainService.generateAll).not.toHaveBeenCalled();
  });

  it("rejects when the current branch is not master", async () => {
    vi.spyOn(releaseGitService, "currentBranch").mockReturnValue("dev");

    await expect(releaseService.release("0.2.0")).rejects.toThrow(/must be cut from "master"/);
  });

  it("rejects when the working tree is not clean", async () => {
    vi.spyOn(releaseGitService, "isTreeClean").mockReturnValue(false);

    await expect(releaseService.release("0.2.0")).rejects.toThrow(/not clean/);
  });

  it("rejects when local master is behind origin", async () => {
    vi.spyOn(releaseGitService, "isUpToDateWithRemote").mockReturnValue(false);

    await expect(releaseService.release("0.2.0")).rejects.toThrow(/not up to date/);
  });

  it("rejects when package.json and tp2 versions disagree", async () => {
    vi.spyOn(releaseVersionFilesService, "readTp2Version").mockReturnValue("0.0.9");

    await expect(releaseService.release("0.2.0")).rejects.toThrow(/do not match/);
  });

  it("resumes from packaging when the tag already exists at HEAD, skipping generate/commit/push", async () => {
    vi.spyOn(releaseGitService, "tagExistsAtHead").mockReturnValue(true);

    await releaseService.release("0.2.0");

    expect(mainService.generateAll).not.toHaveBeenCalled();
    expect(releaseGitService.commit).not.toHaveBeenCalled();
    expect(releaseGitService.push).not.toHaveBeenCalled();
    expect(releasePackageService.createZip).toHaveBeenCalledWith("0.2.0");
    expect(releaseGithubService.publishRelease).toHaveBeenCalledWith(
      "v0.2.0",
      "dist/enhanced_creatures-v0.2.0.zip",
      "release notes",
    );
  });
});
