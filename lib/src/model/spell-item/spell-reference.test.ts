import { describe, expect, it } from "vitest";
import { resolveForMod, spellFiles, type SpellReference } from "./spell-reference";

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

  it("throws when unavailable and no fallback is defined", () => {
    const spell: SpellReference = { file: "SPPR121", requiresMod: "AllSpellMods" };
    expect(() => resolveForMod(spell, "Vanilla")).toThrow(/no fallback is defined/);
  });

  it("throws on a fallback cycle instead of looping forever", () => {
    const a: SpellReference = { file: "A", requiresMod: "AllSpellMods" };
    const b: SpellReference = { file: "B", requiresMod: "AllSpellMods", fallback: a };
    a.fallback = b;
    expect(() => resolveForMod(a, "Vanilla")).toThrow(/cycle/);
  });
});
