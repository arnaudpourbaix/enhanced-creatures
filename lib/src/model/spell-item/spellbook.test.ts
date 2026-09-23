import { describe, expect, it } from "vitest";
import { SpellReference } from "../../../config/spells/spell-names";
import {
  resolveSpellBookSpellsForMod,
  SpellBook,
  SpellBookSpells,
  spellBookVariants,
} from "./spellbook";

const DEAFNESS: SpellReference = { file: "SPWI223", id: "WIZARD_DEAFNESS" };
const SOUND_BURST: SpellReference = {
  file: "SPWI223",
  id: "WIZARD_SOUND_BURST",
  requiresMod: "AllSpellMods",
  fallback: DEAFNESS,
};
const SANCTUARY: SpellReference = { file: "SPPR109" };

describe("resolveSpellBookSpellsForMod", () => {
  it("resolves every list (base/additionnals/repeat) at every level for the target mod", () => {
    const values: SpellBookSpells[] = [
      {
        level: 1,
        base: [SANCTUARY, SOUND_BURST],
        additionnals: [SOUND_BURST],
        repeat: [SANCTUARY],
      },
    ];

    const vanilla = resolveSpellBookSpellsForMod(values, "Vanilla");

    expect(vanilla).toEqual([
      { level: 1, base: [SANCTUARY, DEAFNESS], additionnals: [DEAFNESS], repeat: [SANCTUARY] },
    ]);
  });

  it("leaves an AllSpellMods-authored list unchanged when resolved for AllSpellMods", () => {
    const values: SpellBookSpells[] = [
      { level: 1, base: [SOUND_BURST], additionnals: [], repeat: [] },
    ];

    const resolved = resolveSpellBookSpellsForMod(values, "AllSpellMods");

    expect(resolved[0].base[0]).toBe(SOUND_BURST);
  });

  it("preserves level numbers and list order across multiple levels", () => {
    const values: SpellBookSpells[] = [
      { level: 1, base: [SANCTUARY], additionnals: [], repeat: [] },
      { level: 2, base: [SOUND_BURST], additionnals: [], repeat: [] },
    ];

    const vanilla = resolveSpellBookSpellsForMod(values, "Vanilla");

    expect(vanilla.map((l) => l.level)).toEqual([1, 2]);
    expect(vanilla[1].base).toEqual([DEAFNESS]);
  });

  it("throws when a listed spell has no fallback reaching the target mod", () => {
    const noFallback: SpellReference = { file: "SPPR121", requiresMod: "AllSpellMods" };
    const values: SpellBookSpells[] = [
      { level: 1, base: [noFallback], additionnals: [], repeat: [] },
    ];

    expect(() => resolveSpellBookSpellsForMod(values, "Vanilla")).toThrow(/no fallback is defined/);
  });
});

describe("spellBookVariants", () => {
  it("derives AllSpellMods (richest-first) and Vanilla from the book's canonical values", () => {
    const book: SpellBook = {
      name: "EvilUndeadCleric",
      values: [{ level: 1, base: [SOUND_BURST], additionnals: [], repeat: [] }],
    };

    const variants = spellBookVariants(book);

    expect(variants).toEqual([
      {
        mod: "AllSpellMods",
        values: [{ level: 1, base: [SOUND_BURST], additionnals: [], repeat: [] }],
      },
      { mod: "Vanilla", values: [{ level: 1, base: [DEAFNESS], additionnals: [], repeat: [] }] },
    ]);
  });

  it("appends the book's own genuinely distinct variants after the derived ones", () => {
    const book: SpellBook = {
      name: "EvilUndeadCleric",
      values: [{ level: 1, base: [SANCTUARY], additionnals: [], repeat: [] }],
      variants: [
        {
          mod: "FaithsAndPowers",
          values: [{ level: 1, base: [SOUND_BURST], additionnals: [], repeat: [] }],
        },
      ],
    };

    const variants = spellBookVariants(book);

    expect(variants.map((v) => v.mod)).toEqual(["AllSpellMods", "Vanilla", "FaithsAndPowers"]);
    expect(variants[2].values[0].base).toEqual([SOUND_BURST]);
  });
});
