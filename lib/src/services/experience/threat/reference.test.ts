import { describe, expect, it } from "vitest";
import { SaveTypeEnum } from "../../../model/spell-item/effect.enums";
import { referenceArcher, referenceEnchantment, referenceFighter, saveOf } from "./reference";

describe("reference fighter", () => {
  it("level 1", () => {
    expect(referenceFighter(1)).toMatchObject({
      ac: 10,
      hp: 13,
      thac0: 18,
      apr: 2.5,
      damage: 9.5,
      saveDeath: 14,
      movement: 12,
    });
  });
  it("level 9", () => {
    expect(referenceFighter(9)).toMatchObject({ ac: 0, hp: 117, thac0: 8, apr: 3 });
  });
  it("clamps the level to 1..20", () => {
    expect(referenceFighter(25)).toEqual(referenceFighter(20));
    expect(referenceFighter(0)).toEqual(referenceFighter(1));
  });
  it("wand saves follow the warrior table", () => {
    const levels = [1, 3, 5, 7, 9, 11, 13, 15, 17];
    expect(levels.map((l) => referenceFighter(l).saveWand)).toEqual([
      16, 15, 13, 12, 10, 9, 7, 6, 5,
    ]);
  });
});

describe("reference archer", () => {
  it("level 4", () => {
    const archer = referenceArcher(4);
    expect(archer).toMatchObject({ ac: -1, hp: 52, apr: 2, damage: 5.5, movement: 12 });
    // 21 - 4 - (2 Dex + 1 specialization + 0 enchantment)
    expect(archer.thac0).toBe(14);
  });
  it("shares the fighter's saves", () => {
    expect(referenceArcher(7).saveSpell).toBe(referenceFighter(7).saveSpell);
  });
});

describe("referenceEnchantment", () => {
  it("steps up every four levels to +3", () => {
    expect([1, 4, 5, 8, 9, 12, 13, 20, 25].map(referenceEnchantment)).toEqual([
      0, 0, 1, 1, 2, 2, 3, 3, 3,
    ]);
  });
});

describe("saveOf", () => {
  it("maps each save type", () => {
    const ref = referenceFighter(2);
    expect(saveOf(ref, SaveTypeEnum.ParalyzePoisonDeath)).toBe(14);
    expect(saveOf(ref, SaveTypeEnum.PetrifyPolymorph)).toBe(15);
    expect(saveOf(ref, SaveTypeEnum.Breath)).toBe(17);
    expect(saveOf(ref, SaveTypeEnum.Spell)).toBe(17);
    expect(saveOf(ref, SaveTypeEnum.RodStaffWand)).toBe(16);
  });
  it("takes the best (lowest) of several types", () => {
    expect(saveOf(referenceFighter(2), SaveTypeEnum.Spell, SaveTypeEnum.ParalyzePoisonDeath)).toBe(
      14,
    );
  });
});
