import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import releaseChangelogService from "./release-changelog.service";

const VERSION = "0.2.0";
const ADDED_HEADING = "### Added";
const UNRELEASED_HEADING = "## [Unreleased]";
const FIRST_RELEASE_LINE = "- First release.";
const PRIOR_VERSION_HEADING = "## [0.1.0] - 2026-01-01";

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
          UNRELEASED_HEADING,
          "",
          ADDED_HEADING,
          "",
          "- Initial public documentation website.",
          "",
        ].join("\n"),
      );

      releaseChangelogService.rollover(changelogPath, VERSION, "2026-08-11");

      const result = fs.readFileSync(changelogPath, "utf-8");
      expect(result).toContain(`${UNRELEASED_HEADING}\n\n## [${VERSION}] - 2026-08-11`);
      expect(result).toContain(`${ADDED_HEADING}\n\n- Initial public documentation website.`);
    });

    it("throws when there is no [Unreleased] section", () => {
      writeChangelog(`# Changelog\n\n${PRIOR_VERSION_HEADING}\n`);

      expect(() => {
        releaseChangelogService.rollover(changelogPath, VERSION, "2026-08-11");
      }).toThrow(/no "## \[Unreleased\]" section/);
    });
  });

  describe("extractNotes", () => {
    it("returns the body between the version heading and the next heading", () => {
      writeChangelog(
        [
          "# Changelog",
          "",
          UNRELEASED_HEADING,
          "",
          `## [${VERSION}] - 2026-08-11`,
          "",
          ADDED_HEADING,
          "",
          "- Something new.",
          "",
          PRIOR_VERSION_HEADING,
          "",
          ADDED_HEADING,
          "",
          FIRST_RELEASE_LINE,
          "",
        ].join("\n"),
      );

      expect(releaseChangelogService.extractNotes(changelogPath, VERSION)).toBe(
        `${ADDED_HEADING}\n\n- Something new.`,
      );
    });

    it("returns the body through EOF when the version section is last", () => {
      writeChangelog(
        [UNRELEASED_HEADING, "", PRIOR_VERSION_HEADING, "", FIRST_RELEASE_LINE].join("\n"),
      );

      expect(releaseChangelogService.extractNotes(changelogPath, "0.1.0")).toBe(FIRST_RELEASE_LINE);
    });

    it("throws when the version section is not found", () => {
      writeChangelog(`${UNRELEASED_HEADING}\n`);

      expect(() => {
        releaseChangelogService.extractNotes(changelogPath, VERSION);
      }).toThrow(/no "## \[0\.2\.0\]" section/);
    });
  });

  describe("hasUnreleasedNotes", () => {
    it("returns false when the [Unreleased] section is empty", () => {
      writeChangelog(
        [UNRELEASED_HEADING, "", PRIOR_VERSION_HEADING, "", FIRST_RELEASE_LINE].join("\n"),
      );

      expect(releaseChangelogService.hasUnreleasedNotes(changelogPath)).toBe(false);
    });

    it("returns true when the [Unreleased] section has content", () => {
      writeChangelog(
        [
          UNRELEASED_HEADING,
          "",
          ADDED_HEADING,
          "",
          "- Something new.",
          "",
          PRIOR_VERSION_HEADING,
          "",
          FIRST_RELEASE_LINE,
        ].join("\n"),
      );

      expect(releaseChangelogService.hasUnreleasedNotes(changelogPath)).toBe(true);
    });

    it("returns true when the [Unreleased] section is last and has content", () => {
      writeChangelog([UNRELEASED_HEADING, "", FIRST_RELEASE_LINE].join("\n"));

      expect(releaseChangelogService.hasUnreleasedNotes(changelogPath)).toBe(true);
    });

    it("throws when there is no [Unreleased] section", () => {
      writeChangelog(`# Changelog\n\n${PRIOR_VERSION_HEADING}\n`);

      expect(() => {
        releaseChangelogService.hasUnreleasedNotes(changelogPath);
      }).toThrow(/no "## \[Unreleased\]" section/);
    });
  });
});
