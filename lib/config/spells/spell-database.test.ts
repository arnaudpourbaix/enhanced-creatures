import { describe, expect, it } from "vitest";
import { resolveForMod, spellsByKeyword } from "../../src/model/spell-item/spell-reference";
import { SPELLS } from "./spell-database";

describe("spellsByKeyword", () => {
  it("returns only the base file for a spell with no variants", () => {
    const files = spellsByKeyword(SPELLS, "poison");
    expect(files.filter((f) => f === "SPPR411")).toEqual(["SPPR411"]);
  });
});

describe("resolveForMod (real data)", () => {
  it("resolves the real SoundBurst/Deafness fallback pair end to end", () => {
    expect(resolveForMod(SPELLS.Wizard.SoundBurst, "AllSpellMods")).toBe(SPELLS.Wizard.SoundBurst);
    expect(resolveForMod(SPELLS.Wizard.SoundBurst, "Vanilla")).toBe(SPELLS.Wizard.Deafness);
  });
});
