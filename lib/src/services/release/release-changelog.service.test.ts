import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import releaseChangelogService from "./release-changelog.service";

describe("ReleaseChangelogService", () => {
  let dir: string;
  let changelogPath: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-changelog-"));
    changelogPath = path.join(dir, "CHANGELOG.md");
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function writeChangelog(content: string): void {
    fs.writeFileSync(changelogPath, content);
  }

  describe("rollover", () => {
    it("renames [Unreleased] to the new version section and inserts a fresh blank [Unreleased] above it", () => {
      writeChangelog(
        [
          "# Changelog",
          "",
          "## [Unreleased]",
          "",
          "### Added",
          "",
          "- Initial public documentation website.",
          "",
        ].join("\n"),
      );

      releaseChangelogService.rollover(changelogPath, "0.2.0", "2026-08-11");

      const result = fs.readFileSync(changelogPath, "utf-8");
      expect(result).toContain("## [Unreleased]\n\n## [0.2.0] - 2026-08-11");
      expect(result).toContain("### Added\n\n- Initial public documentation website.");
    });

    it("throws when there is no [Unreleased] section", () => {
      writeChangelog("# Changelog\n\n## [0.1.0] - 2026-01-01\n");

      expect(() => releaseChangelogService.rollover(changelogPath, "0.2.0", "2026-08-11")).toThrow(
        /no "## \[Unreleased\]" section/,
      );
    });
  });

  describe("extractNotes", () => {
    it("returns the body between the version heading and the next heading", () => {
      writeChangelog(
        [
          "# Changelog",
          "",
          "## [Unreleased]",
          "",
          "## [0.2.0] - 2026-08-11",
          "",
          "### Added",
          "",
          "- Something new.",
          "",
          "## [0.1.0] - 2026-01-01",
          "",
          "### Added",
          "",
          "- First release.",
          "",
        ].join("\n"),
      );

      expect(releaseChangelogService.extractNotes(changelogPath, "0.2.0")).toBe(
        "### Added\n\n- Something new.",
      );
    });

    it("returns the body through EOF when the version section is last", () => {
      writeChangelog(["## [Unreleased]", "", "## [0.1.0] - 2026-01-01", "", "- First release."].join("\n"));

      expect(releaseChangelogService.extractNotes(changelogPath, "0.1.0")).toBe("- First release.");
    });

    it("throws when the version section is not found", () => {
      writeChangelog("## [Unreleased]\n");

      expect(() => releaseChangelogService.extractNotes(changelogPath, "0.2.0")).toThrow(
        /no "## \[0\.2\.0\]" section/,
      );
    });
  });
});
