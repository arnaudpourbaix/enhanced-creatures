import { describe, expect, it } from "vitest";
import { insertEntries, spellKey } from "./spell-import";

describe("spellKey", () => {
  it("turns a game name into a database key", () => {
    expect(spellKey("Absorb Health")).toBe("AbsorbHealth");
    expect(spellKey("Mordenkainen's Sword")).toBe("MordenkainensSword");
    expect(spellKey("Cure Light Wounds (Class)")).toBe("CureLightWoundsClass");
  });

  it("keeps a key valid when the name starts with a digit", () => {
    expect(spellKey("10th Level Strike")).toBe("Spell10thLevelStrike");
  });
});

describe("insertEntries", () => {
  const database = [
    "const WIZARD_SPELLS = {",
    "  Blur: {",
    '    file: "SPWI201",',
    "  },",
    "  Web: {",
    '    file: "SPWI215",',
    "  },",
    "} satisfies Record<string, SpellReference>;",
    "",
    "const PRIEST_SPELLS = {",
    "  Bless: {",
    '    file: "SPPR101",',
    "  },",
    "};",
  ].join("\n");

  it("inserts each entry in alphabetical order, in its own category", () => {
    const result = insertEntries(database, "WIZARD_SPELLS", [
      { key: "Haste", lines: ['file: "SPWI305"', "level: 3"] },
      { key: "Armor", lines: ['file: "SPWI102"'] },
      { key: "Zap", lines: ['file: "SPWI999"'] },
    ]);
    expect(result.split("\n").filter((l) => /^ {2}\w+: \{$/.test(l))).toEqual([
      "  Armor: {",
      "  Blur: {",
      "  Haste: {",
      "  Web: {",
      "  Zap: {",
      "  Bless: {",
    ]);
    expect(result).toContain('  Haste: {\n    file: "SPWI305",\n    level: 3,\n  },');
  });

  it("ends a category at its closing brace, whatever follows it", () => {
    const result = insertEntries(database, "WIZARD_SPELLS", [
      { key: "Zap", lines: ['file: "SPWI999"'] },
    ]);
    const lines = result.split("\n");
    expect(lines.indexOf("  Zap: {")).toBeLessThan(
      lines.indexOf("} satisfies Record<string, SpellReference>;"),
    );
    // a key of the next category isn't one of this category's
    expect(() =>
      insertEntries(database, "WIZARD_SPELLS", [{ key: "Bless", lines: ['file: "SPWI998"'] }]),
    ).not.toThrow();
  });

  it("throws on a key the category already has", () => {
    expect(() =>
      insertEntries(database, "WIZARD_SPELLS", [{ key: "Web", lines: ['file: "SPWI999"'] }]),
    ).toThrow(/Web is already in WIZARD_SPELLS/);
  });
});
