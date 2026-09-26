import { describe, expect, it } from "vitest";
import {
  keywordsForFile,
  levelForFile,
  rangeForFile,
  resolveForMod,
  spellFiles,
  type SpellCollection,
  type SpellReference,
} from "./spell-reference";

// Shared across keywordsForFile/levelForFile/rangeForFile below - they exercise the identical
// file-matching logic each helper inherits from getAllSpells/spellFiles, so their test titles
// (and the fixture file names they describe) are intentionally the same.
const MATCHES_CASE_INSENSITIVELY = "matches case-insensitively";
const MATCHES_VARIANT_NOT_BASE_FILE = "matches a variant's file, not just the base file";
const RETURNS_UNDEFINED_NO_MATCH = "returns undefined when no entry matches at all";

describe("spellFiles", () => {
  it("returns just the base file when there are no variants", () => {
    const spell: SpellReference = { file: "SPWI001" };
    expect(spellFiles(spell)).toEqual(["SPWI001"]);
  });

  it("appends every variant's file after the base file, in listed order", () => {
    const spell: SpellReference = {
      file: "SPWI402",
      variants: [
        { mod: "SpellRevisions", file: "SPWI127", id: "WIZARD_DIMENSION_JUMP" },
        { mod: "StratagemsIWD", file: "SPWI999" },
      ],
    };
    expect(spellFiles(spell)).toEqual(["SPWI402", "SPWI127", "SPWI999"]);
  });
});

describe("resolveForMod", () => {
  it("returns the spell itself when it's available under the target mod", () => {
    const spell: SpellReference = { file: "SPWI001" };
    expect(resolveForMod(spell, "Vanilla")).toBe(spell);
  });

  it("returns a merged reference using the matching variant's file/id when one applies", () => {
    const spell: SpellReference = {
      file: "SPWI402",
      id: "WIZARD_DIMENSION_DOOR",
      variants: [{ mod: "AllSpellMods", file: "SPWI127", id: "WIZARD_DIMENSION_JUMP" }],
    };
    expect(resolveForMod(spell, "AllSpellMods")).toEqual({
      file: "SPWI127",
      id: "WIZARD_DIMENSION_JUMP",
      variants: spell.variants,
    });
  });

  it("walks to fallback when the spell isn't available under the target mod", () => {
    const deafness: SpellReference = { file: "SPWI223", id: "WIZARD_DEAFNESS" };
    const soundBurst: SpellReference = {
      file: "SPWI223",
      id: "WIZARD_SOUND_BURST",
      requiresMod: "AllSpellMods",
      fallback: deafness,
    };
    expect(resolveForMod(soundBurst, "Vanilla")).toBe(deafness);
    expect(resolveForMod(soundBurst, "AllSpellMods")).toBe(soundBurst);
  });

  it("throws when unavailable and no fallback is defined, naming the spell and the mod it requires", () => {
    const spell: SpellReference = {
      file: "SPPR121",
      id: "CLERIC_EXAMPLE",
      requiresMod: "AllSpellMods",
    };
    expect(() => resolveForMod(spell, "Vanilla")).toThrow(
      /No spell available for Vanilla: SPPR121 \(CLERIC_EXAMPLE\) requires AllSpellMods, and no fallback is defined for it\./,
    );
  });

  it("names both the original spell and the dead-end fallback when the chain runs out partway through", () => {
    // Reproduces the real bug this message was too vague to diagnose: a spell's fallback points
    // to another mod-gated spell that itself has no further fallback.
    const deadEnd: SpellReference = {
      file: "SPWI423",
      id: "WIZARD_SPIDER_SPAWN",
      requiresMod: "AllSpellMods",
    };
    const shadowMonsters: SpellReference = {
      file: "SPWI433",
      id: "WIZARD_SHADOW_MONSTERS",
      requiresMod: "AllSpellMods",
      fallback: deadEnd,
    };
    expect(() => resolveForMod(shadowMonsters, "Vanilla")).toThrow(
      /No spell available for Vanilla: SPWI423 \(WIZARD_SPIDER_SPAWN\) requires AllSpellMods, and no fallback is defined for it \(its fallback chain from SPWI433 \(WIZARD_SHADOW_MONSTERS\) reached this point\)\./,
    );
  });

  it("throws on a fallback cycle instead of looping forever, naming both spells", () => {
    const a: SpellReference = { file: "A", id: "SPELL_A", requiresMod: "AllSpellMods" };
    const b: SpellReference = { file: "B", requiresMod: "AllSpellMods", fallback: a };
    a.fallback = b;
    expect(() => resolveForMod(a, "Vanilla")).toThrow(
      /Fallback cycle detected while resolving A \(SPELL_A\) for Vanilla \(loops back to A \(SPELL_A\)\)\./,
    );
  });
});

describe("keywordsForFile", () => {
  const spells: SpellCollection = {
    Wizard: {
      Horror: { file: "SPWI205", keywords: ["fear"] },
      DimensionDoor: {
        file: "SPWI402",
        variants: [{ mod: "AllSpellMods", file: "SPWI127" }],
        keywords: ["movement"],
      },
    },
    Priest: {
      Bless: { file: "SPPR101" },
    },
  };

  it("returns the keywords of the entry whose own file matches", () => {
    expect(keywordsForFile(spells, "SPWI205")).toEqual(["fear"]);
  });

  it(MATCHES_CASE_INSENSITIVELY, () => {
    expect(keywordsForFile(spells, "spwi205")).toEqual(["fear"]);
  });

  it(MATCHES_VARIANT_NOT_BASE_FILE, () => {
    expect(keywordsForFile(spells, "SPWI127")).toEqual(["movement"]);
  });

  it("returns undefined for an entry with no keywords field", () => {
    expect(keywordsForFile(spells, "SPPR101")).toBeUndefined();
  });

  it(RETURNS_UNDEFINED_NO_MATCH, () => {
    expect(keywordsForFile(spells, "NOT_A_REAL_FILE")).toBeUndefined();
  });
});

describe("levelForFile", () => {
  const spells: SpellCollection = {
    Wizard: {
      Horror: { file: "SPWI205", level: 3 },
      DimensionDoor: {
        file: "SPWI402",
        variants: [{ mod: "AllSpellMods", file: "SPWI127" }],
        level: 4,
      },
    },
    Priest: {
      Bless: { file: "SPPR101" },
    },
  };

  it("returns the level of the entry whose own file matches", () => {
    expect(levelForFile(spells, "SPWI205")).toBe(3);
  });

  it(MATCHES_CASE_INSENSITIVELY, () => {
    expect(levelForFile(spells, "spwi205")).toBe(3);
  });

  it(MATCHES_VARIANT_NOT_BASE_FILE, () => {
    expect(levelForFile(spells, "SPWI127")).toBe(4);
  });

  it("returns undefined for an entry with no level field", () => {
    expect(levelForFile(spells, "SPPR101")).toBeUndefined();
  });

  it(RETURNS_UNDEFINED_NO_MATCH, () => {
    expect(levelForFile(spells, "NOT_A_REAL_FILE")).toBeUndefined();
  });
});

describe("rangeForFile", () => {
  const spells: SpellCollection = {
    Wizard: {
      Horror: { file: "SPWI205", range: 10 },
      DimensionDoor: {
        file: "SPWI402",
        variants: [{ mod: "AllSpellMods", file: "SPWI127" }],
        range: 5,
      },
    },
    Priest: {
      Bless: { file: "SPPR101" },
    },
  };

  it("returns the range of the entry whose own file matches", () => {
    expect(rangeForFile(spells, "SPWI205")).toBe(10);
  });

  it(MATCHES_CASE_INSENSITIVELY, () => {
    expect(rangeForFile(spells, "spwi205")).toBe(10);
  });

  it(MATCHES_VARIANT_NOT_BASE_FILE, () => {
    expect(rangeForFile(spells, "SPWI127")).toBe(5);
  });

  it("returns undefined for an entry with no range field", () => {
    expect(rangeForFile(spells, "SPPR101")).toBeUndefined();
  });

  it(RETURNS_UNDEFINED_NO_MATCH, () => {
    expect(rangeForFile(spells, "NOT_A_REAL_FILE")).toBeUndefined();
  });
});
