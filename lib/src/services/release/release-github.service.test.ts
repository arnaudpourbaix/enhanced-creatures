import childProcess from "child_process";
import fs from "fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import releaseGithubService from "./release-github.service";

describe("ReleaseGithubService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkAuth", () => {
    it("does not throw when gh reports it is authenticated", () => {
      vi.spyOn(childProcess, "execFileSync").mockReturnValue("");

      expect(() => {
        releaseGithubService.checkAuth();
      }).not.toThrow();
    });

    it("throws a clear error when gh is missing or unauthenticated", () => {
      vi.spyOn(childProcess, "execFileSync").mockImplementation(() => {
        throw new Error("command not found: gh");
      });

      expect(() => {
        releaseGithubService.checkAuth();
      }).toThrow(/gh auth login/);
    });
  });

  describe("publishRelease", () => {
    it("writes the notes to a temp file and calls gh release create", () => {
      const exec = vi.spyOn(childProcess, "execFileSync").mockReturnValue("");
      const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
      vi.spyOn(fs, "rmSync").mockImplementation(() => {});

      releaseGithubService.publishRelease("v0.2.0", "dist/enhanced_creatures-v0.2.0.zip", "notes body");

      expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("v0.2.0"), "notes body");
      expect(exec).toHaveBeenCalledWith(
        "gh",
        [
          "release",
          "create",
          "v0.2.0",
          "dist/enhanced_creatures-v0.2.0.zip",
          "--title",
          "v0.2.0",
          "--notes-file",
          expect.stringContaining("v0.2.0") as unknown as string,
        ],
        expect.objectContaining({}),
      );
    });

    it("removes the temp notes file even if gh release create fails", () => {
      vi.spyOn(childProcess, "execFileSync").mockImplementation(() => {
        throw new Error("gh failed");
      });
      vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
      const rmSpy = vi.spyOn(fs, "rmSync").mockImplementation(() => {});

      expect(() => {
        releaseGithubService.publishRelease("v0.2.0", "dist/x.zip", "notes");
      }).toThrow("gh failed");
      expect(rmSpy).toHaveBeenCalled();
    });
  });
});
