import childProcess from "child_process";
import { afterEach, describe, expect, it, vi } from "vitest";
import releaseGitService from "./release-git.service";

const ORIGIN_MASTER = "origin/master";

describe("ReleaseGitService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the current branch name", () => {
    vi.spyOn(childProcess, "execFileSync").mockReturnValue("master\n");

    expect(releaseGitService.currentBranch()).toBe("master");
  });

  it("reports a clean tree when git status has no output", () => {
    vi.spyOn(childProcess, "execFileSync").mockReturnValue("");

    expect(releaseGitService.isTreeClean()).toBe(true);
  });

  it("reports a dirty tree when git status has output", () => {
    vi.spyOn(childProcess, "execFileSync").mockReturnValue(" M package.json\n");

    expect(releaseGitService.isTreeClean()).toBe(false);
  });

  it("reports up-to-date when local and origin match", () => {
    vi.spyOn(childProcess, "execFileSync").mockImplementation((_cmd, args) => {
      const argv = args as string[];
      if (argv[0] === "fetch") return "";
      if (argv.includes(ORIGIN_MASTER)) return "abc123\n";
      return "abc123\n";
    });

    expect(releaseGitService.isUpToDateWithRemote("master")).toBe("up-to-date");
  });

  it("reports ahead when local has commits origin does not", () => {
    vi.spyOn(childProcess, "execFileSync").mockImplementation((_cmd, args) => {
      const argv = args as string[];
      if (argv[0] === "fetch") return "";
      if (argv[0] === "rev-parse" && argv.includes(ORIGIN_MASTER)) return "remote123\n";
      if (argv[0] === "rev-parse") return "local456\n";
      // rev-list --count origin/master..master (ahead) vs master..origin/master (behind)
      if (argv[0] === "rev-list" && argv[2] === "origin/master..master") return "2\n";
      return "0\n";
    });

    expect(releaseGitService.isUpToDateWithRemote("master")).toBe("ahead");
  });

  it("reports behind when origin has commits local does not", () => {
    vi.spyOn(childProcess, "execFileSync").mockImplementation((_cmd, args) => {
      const argv = args as string[];
      if (argv[0] === "fetch") return "";
      if (argv[0] === "rev-parse" && argv.includes(ORIGIN_MASTER)) return "remote123\n";
      if (argv[0] === "rev-parse") return "local456\n";
      if (argv[0] === "rev-list" && argv[2] === "master..origin/master") return "3\n";
      return "0\n";
    });

    expect(releaseGitService.isUpToDateWithRemote("master")).toBe("behind");
  });

  it("reports diverged when both local and origin have commits the other lacks", () => {
    vi.spyOn(childProcess, "execFileSync").mockImplementation((_cmd, args) => {
      const argv = args as string[];
      if (argv[0] === "fetch") return "";
      if (argv[0] === "rev-parse" && argv.includes(ORIGIN_MASTER)) return "remote123\n";
      if (argv[0] === "rev-parse") return "local456\n";
      if (argv[0] === "rev-list") return "1\n";
      return "0\n";
    });

    expect(releaseGitService.isUpToDateWithRemote("master")).toBe("diverged");
  });

  it("returns false when the tag does not exist", () => {
    vi.spyOn(childProcess, "execFileSync").mockImplementation(() => {
      throw new Error("unknown revision");
    });

    expect(releaseGitService.tagExistsAtHead("v0.2.0")).toBe(false);
  });

  it("returns true when the tag exists and points at HEAD", () => {
    // Both branches intentionally return the same commit - the tag lookup and the HEAD lookup
    // are simulated as agreeing, which is exactly what "tag exists at HEAD" means.
    // eslint-disable-next-line sonarjs/no-invariant-returns
    vi.spyOn(childProcess, "execFileSync").mockImplementation((_cmd, args) => {
      const argv = args as string[];
      if (argv.includes("HEAD")) return "abc123\n";
      return "abc123\n";
    });

    expect(releaseGitService.tagExistsAtHead("v0.2.0")).toBe(true);
  });

  it("returns false when the tag exists but points elsewhere", () => {
    vi.spyOn(childProcess, "execFileSync").mockImplementation((_cmd, args) => {
      const argv = args as string[];
      if (argv.includes("HEAD")) return "abc123\n";
      return "different456\n";
    });

    expect(releaseGitService.tagExistsAtHead("v0.2.0")).toBe(false);
  });

  it("reports a tag as present on origin when ls-remote finds it", () => {
    const exec = vi
      .spyOn(childProcess, "execFileSync")
      .mockReturnValue("abc123\trefs/tags/v0.2.0\n");

    expect(releaseGitService.tagExistsOnRemote("v0.2.0")).toBe(true);
    expect(exec).toHaveBeenCalledWith(
      "git",
      ["ls-remote", "--tags", "origin", "refs/tags/v0.2.0"],
      expect.objectContaining({}),
    );
  });

  it("reports a tag as absent from origin when ls-remote matches nothing", () => {
    vi.spyOn(childProcess, "execFileSync").mockReturnValue("\n");

    expect(releaseGitService.tagExistsOnRemote("v0.2.0")).toBe(false);
  });

  it("propagates an ls-remote failure instead of reporting the tag as absent", () => {
    vi.spyOn(childProcess, "execFileSync").mockImplementation(() => {
      throw new Error("could not read from remote repository");
    });

    expect(() => releaseGitService.tagExistsOnRemote("v0.2.0")).toThrow(/remote repository/);
  });

  it("stages package.json, package-lock.json, and mod/", () => {
    const exec = vi.spyOn(childProcess, "execFileSync").mockReturnValue("");

    releaseGitService.stageReleaseFiles();

    expect(exec).toHaveBeenCalledWith(
      "git",
      ["add", "package.json", "package-lock.json", "mod"],
      expect.objectContaining({}),
    );
  });

  it("discards working-tree changes under mod/ when restoring the mod tree", () => {
    const exec = vi.spyOn(childProcess, "execFileSync").mockReturnValue("");

    releaseGitService.restoreModTree();

    expect(exec).toHaveBeenCalledWith(
      "git",
      ["checkout", "--", "mod"],
      expect.objectContaining({}),
    );
  });

  it("commits with the given message", () => {
    const exec = vi.spyOn(childProcess, "execFileSync").mockReturnValue("");

    releaseGitService.commit("chore: release v0.2.0");

    expect(exec).toHaveBeenCalledWith(
      "git",
      ["commit", "-m", "chore: release v0.2.0"],
      expect.objectContaining({}),
    );
  });

  it("creates an annotated tag", () => {
    const exec = vi.spyOn(childProcess, "execFileSync").mockReturnValue("");

    releaseGitService.tagRelease("v0.2.0", "Release v0.2.0");

    expect(exec).toHaveBeenCalledWith(
      "git",
      ["tag", "-a", "v0.2.0", "-m", "Release v0.2.0"],
      expect.objectContaining({}),
    );
  });

  it("pushes the branch with tags", () => {
    const exec = vi.spyOn(childProcess, "execFileSync").mockReturnValue("");

    releaseGitService.push("master");

    expect(exec).toHaveBeenCalledWith(
      "git",
      ["push", "origin", "master", "--follow-tags"],
      expect.objectContaining({}),
    );
  });
});
