import childProcess from "child_process";
import fs from "fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import releaseGithubService from "./release-github.service";

const ZIP_PATH = "dist/x.zip";
const NOTES = "notes";
const GH_FAILURE_MESSAGE = "Command failed: gh release create v0.2.0";

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
        releaseGithubService.publishRelease("v0.2.0", ZIP_PATH, NOTES);
      }).toThrow("gh failed");
      expect(rmSpy).toHaveBeenCalled();
    });

    it("surfaces gh's captured stderr in the thrown error message", () => {
      const originalError = Object.assign(new Error(GH_FAILURE_MESSAGE), {
        stderr: Buffer.from("HTTP 422: Release already exists\n"),
      });
      vi.spyOn(childProcess, "execFileSync").mockImplementation(() => {
        throw originalError;
      });
      vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
      vi.spyOn(fs, "rmSync").mockImplementation(() => {});

      let caught: unknown;
      try {
        releaseGithubService.publishRelease("v0.2.0", ZIP_PATH, NOTES);
      } catch (e: unknown) {
        caught = e;
      }

      expect(caught).toBeInstanceOf(Error);
      const error = caught as Error;
      expect(error.message).toContain("Release already exists");
      expect(error.cause).toBe(originalError);
    });

    it("falls back to the plain error message when stderr was not captured", () => {
      const originalError = new Error(GH_FAILURE_MESSAGE);
      vi.spyOn(childProcess, "execFileSync").mockImplementation(() => {
        throw originalError;
      });
      vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
      vi.spyOn(fs, "rmSync").mockImplementation(() => {});

      expect(() => {
        releaseGithubService.publishRelease("v0.2.0", ZIP_PATH, NOTES);
      }).toThrow(GH_FAILURE_MESSAGE);
    });
  });
});
