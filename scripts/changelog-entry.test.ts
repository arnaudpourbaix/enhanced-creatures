import { describe, expect, it } from "vitest";
import { addEntry, parseSubject } from "./changelog-entry";

describe("parseSubject", () => {
  it.each([
    "wip: vampires",
    "WIP: vampires",
    "wip(ai): vampires",
    "feat: wip",
    "feat: wip vampires",
    "feat(ai): WIP vampires",
  ])("leaves %s out", (subject) => {
    expect(parseSubject(subject)).toBeNull();
  });

  it.each([
    ["feat: zombies", "Added", "Zombies"],
    ["feat(docs): list sequencers", "Added", "Docs: list sequencers"],
    ["fix(ai): contingencies fire once", "Fixed", "AI: contingencies fire once"],
    ["fix!: breaking", "Fixed", "Breaking"],
    ["chore: regenerate mod", "Changed", "Regenerate mod"],
    ["docs: plan", "Changed", "Plan"],
    ["no prefix at all", "Changed", "No prefix at all"],
    ["feat: undead table, wip vampires", "Added", "Undead table, wip vampires"],
  ])("maps %s", (subject, section, text) => {
    expect(parseSubject(subject)).toEqual({ section, text });
  });
});

describe("addEntry", () => {
  const changelog = [
    "# Changelog",
    "",
    "## [Unreleased]",
    "",
    "### Added",
    "",
    "- One",
    "",
    "### Fixed",
    "",
    "- Two",
    "",
    "## [0.4.0] - 2026-10-09",
    "",
    "### Added",
    "",
    "- Old",
    "",
  ].join("\n");

  it("appends to the end of an existing section", () => {
    expect(addEntry(changelog, { section: "Added", text: "New" })).toContain(
      "### Added\n\n- One\n- New\n\n### Fixed",
    );
  });

  it("appends to the last section, before the next version", () => {
    expect(addEntry(changelog, { section: "Fixed", text: "New" })).toContain(
      "- Two\n- New\n\n## [0.4.0]",
    );
  });

  it("creates a missing section in the standard order", () => {
    expect(addEntry(changelog, { section: "Changed", text: "New" })).toContain(
      "- One\n\n### Changed\n\n- New\n\n### Fixed\n\n- Two",
    );
  });

  it("fills a blank [Unreleased] section", () => {
    const blank = "## [Unreleased]\n\n## [0.4.0] - 2026-10-09\n";
    expect(addEntry(blank, { section: "Fixed", text: "New" })).toBe(
      "## [Unreleased]\n\n### Fixed\n\n- New\n\n## [0.4.0] - 2026-10-09\n",
    );
  });

  it("fills a heading without bullets", () => {
    const empty = "## [Unreleased]\n\n### Added\n\n## [0.4.0] - 2026-10-09\n";
    expect(addEntry(empty, { section: "Added", text: "New" })).toBe(
      "## [Unreleased]\n\n### Added\n\n- New\n\n## [0.4.0] - 2026-10-09\n",
    );
  });

  it("keeps CRLF line endings", () => {
    const crlf = changelog.replace(/\n/g, "\r\n");
    expect(addEntry(crlf, { section: "Added", text: "New" })).toContain("- One\r\n- New\r\n\r\n");
  });

  it("refuses a changelog without [Unreleased]", () => {
    expect(() => addEntry("# Changelog\n", { section: "Added", text: "New" })).toThrow(
      /Unreleased/,
    );
  });
});
