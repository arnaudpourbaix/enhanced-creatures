import { describe, expect, it } from "vitest";
import { poisonImmediateDeathDuration } from "../../../config/poison";
import { Effect, PoisonEffect } from "../../model/spell-item/effect";
import { PoisonTypeEnum } from "../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import poisonService from "./poison.service";

function getEffects(
  poisonType: Parameters<typeof poisonService.getSpell>[0]["poisonType"],
  saveBonus?: number,
): Effect[] {
  const { spell } = poisonService.getSpell({ poisonType, saveBonus });
  if (typeof spell === "string") throw new Error("expected a PartialSpell, got a string");
  const header = spell.headers?.[0];
  if (!header) throw new Error("expected the spell to have at least one header");
  return header.effects ?? [];
}

function poisonOpcodeEffects(effects: Effect[]): PoisonEffect[] {
  return effects.filter((e): e is PoisonEffect => e.opcode === EffectTypeEnum.Poison);
}

describe("getSpell", () => {
  it("does not set saveTypes/saveBonus on the result for a simple (non-complex) poison type", () => {
    const result = poisonService.getSpell({ poisonType: "A", saveBonus: -2 });
    expect(result.saveTypes).toBeUndefined();
    expect(result.saveBonus).toBeUndefined();
  });

  it("sets saveTypes/saveBonus on the result for a complex poison type (letter >= 'O')", () => {
    const result = poisonService.getSpell({ poisonType: "O", saveBonus: -2 });
    expect(result.saveTypes).toBeDefined();
    expect(result.saveBonus).toBe(-2);
  });
});

describe("getEffects (via getSpell, per poison type)", () => {
  it("type A (damage <= duration): a single OneDamagePerAmountSecond effect, no save effect (saveDamage is 0)", () => {
    const effects = poisonOpcodeEffects(getEffects("A"));
    expect(effects).toHaveLength(1);
    expect(effects[0].type).toBe(PoisonTypeEnum.OneDamagePerAmountSecond);
  });

  it("type N (damage > duration for both save and normal damage): a save effect and a time effect, both AmountDamagePerSecond", () => {
    const effects = poisonOpcodeEffects(getEffects("N"));
    expect(effects).toHaveLength(2);
    expect(effects.every((e) => e.type === PoisonTypeEnum.AmountDamagePerSecond)).toBe(true);
    expect(effects[0].amount).toBe(1); // save: floor(25/17), rounds up to exact multiple
    expect(effects[1].amount).toBe(13); // normal: floor(225/17), rounds up to exact multiple
  });

  it("type O: paralytic effects from effectFactory.paralyze (no Poison-opcode effect)", () => {
    const effects = getEffects("O");
    expect(effects).toHaveLength(6);
    expect(poisonOpcodeEffects(effects)).toHaveLength(0);
    expect(effects.some((e) => e.opcode === EffectTypeEnum.Hold)).toBe(true);
  });

  it("type Q: a non-damage Sleep effect plus lighting/color-pulse dressing", () => {
    const effects = getEffects("Q");
    expect(effects).toHaveLength(3);
    const sleep = effects.find((e) => e.opcode === EffectTypeEnum.Sleep);
    expect(sleep).toMatchObject({ wakeOnDamage: false });
  });

  it("type P: six ability-score drains plus a movement penalty and an icon", () => {
    const effects = getEffects("P");
    expect(effects).toHaveLength(8);
    expect(effects.some((e) => e.opcode === EffectTypeEnum.StrengthBonus)).toBe(true);
    expect(effects.some((e) => e.opcode === EffectTypeEnum.MovementRateBonus2)).toBe(true);
  });

  it("type R: AC/THAC0/dexterity penalties plus an icon", () => {
    const effects = getEffects("R");
    expect(effects).toHaveLength(4);
    expect(effects.some((e) => e.opcode === EffectTypeEnum.ArmorClassBonus)).toBe(true);
    expect(effects.some((e) => e.opcode === EffectTypeEnum.DexterityBonus)).toBe(true);
  });

  it("type S: a constitution drain plus an icon and a protection-from-spell", () => {
    const effects = getEffects("S");
    expect(effects).toHaveLength(3);
    expect(effects.some((e) => e.opcode === EffectTypeEnum.ConstitutionBonus)).toBe(true);
  });

  it("immediate-death duration (type E): a save effect plus one Poison effect per level band", () => {
    const effects = poisonOpcodeEffects(getEffects("E", -1));
    const deathBands = effects.filter((e) => e.diceSize !== undefined);
    expect(effects).toHaveLength(8); // 1 save + 7 level bands
    expect(deathBands).toHaveLength(7);
    expect(deathBands.map((e) => [e.diceSize, e.diceThrown])).toEqual([
      [1, 2],
      [3, 4],
      [5, 6],
      [7, 8],
      [9, 10],
      [11, 15],
      [16, 40],
    ]);
    // getEffect()'s rounding loop only ever grows the duration, never shrinks it
    expect(deathBands.every((e) => (e.duration ?? 0) >= poisonImmediateDeathDuration)).toBe(true);
    expect(deathBands.every((e) => e.saveBonus === -1)).toBe(true);
  });
});
