import { describe, expect, it } from "vitest";
import { Effect } from "../model/spell-item/effect";
import {
  EffectIDSFileEnum,
  EffectTimingEnum,
  PortraitIconEnum,
  RegenerationTypeEnum,
} from "../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../model/spell-item/effect.type";
import effectFactory from "./effect.factory";

describe("repeatEffect", () => {
  it("returns each effect once, InstantPermanent, for a single round", () => {
    const effects: Effect[] = [{ opcode: EffectTypeEnum.Regeneration, amount: 1 }];
    const result = effectFactory.repeatEffect(1, effects);
    expect(result).toEqual([
      { opcode: EffectTypeEnum.Regeneration, amount: 1, timing: EffectTimingEnum.InstantPermanent },
    ]);
  });

  it("repeats a single effect once per round, delaying each subsequent round by 6 seconds", () => {
    const effects: Effect[] = [{ opcode: EffectTypeEnum.Regeneration, amount: 1 }];
    const result = effectFactory.repeatEffect(3, effects);
    expect(result).toEqual([
      { opcode: EffectTypeEnum.Regeneration, amount: 1, timing: EffectTimingEnum.InstantPermanent },
      {
        opcode: EffectTypeEnum.Regeneration,
        amount: 1,
        timing: EffectTimingEnum.DelayPermanent,
        duration: 6,
      },
      {
        opcode: EffectTypeEnum.Regeneration,
        amount: 1,
        timing: EffectTimingEnum.DelayPermanent,
        duration: 12,
      },
    ]);
  });

  it("repeats every effect in a multi-effect group together each round, preserving group order", () => {
    const effects: Effect[] = [
      { opcode: EffectTypeEnum.Regeneration, amount: 1 },
      { opcode: EffectTypeEnum.PlaySound, resource: "EFF_M08" },
    ];
    const result = effectFactory.repeatEffect(2, effects);
    expect(result).toEqual([
      { opcode: EffectTypeEnum.Regeneration, amount: 1, timing: EffectTimingEnum.InstantPermanent },
      {
        opcode: EffectTypeEnum.PlaySound,
        resource: "EFF_M08",
        timing: EffectTimingEnum.InstantPermanent,
      },
      {
        opcode: EffectTypeEnum.Regeneration,
        amount: 1,
        timing: EffectTimingEnum.DelayPermanent,
        duration: 6,
      },
      {
        opcode: EffectTypeEnum.PlaySound,
        resource: "EFF_M08",
        timing: EffectTimingEnum.DelayPermanent,
        duration: 6,
      },
    ]);
  });

  it("does not mutate the input effects array", () => {
    const effects: Effect[] = [{ opcode: EffectTypeEnum.Regeneration, amount: 1 }];
    effectFactory.repeatEffect(2, effects);
    expect(effects).toEqual([{ opcode: EffectTypeEnum.Regeneration, amount: 1 }]);
  });
});

describe("paralyze", () => {
  it("adds a generic ANYONE Hold effect when races is omitted", () => {
    const effects = effectFactory.paralyze({ duration: 6 });
    expect(effects).toContainEqual(
      expect.objectContaining({
        opcode: EffectTypeEnum.Hold,
        idsFile: EffectIDSFileEnum.EA,
        idsEntry: "ANYONE",
      }),
    );
  });

  it("adds a Hold effect per race when races is a non-empty list, instead of the generic fallback", () => {
    const effects = effectFactory.paralyze({
      duration: 6,
      races: ["HUMAN", "GNOLL"],
    });
    expect(effects).toContainEqual(
      expect.objectContaining({
        opcode: EffectTypeEnum.Hold,
        idsFile: EffectIDSFileEnum.RACE,
        idsEntry: "HUMAN",
      }),
    );
    expect(effects).toContainEqual(
      expect.objectContaining({
        opcode: EffectTypeEnum.Hold,
        idsFile: EffectIDSFileEnum.RACE,
        idsEntry: "GNOLL",
      }),
    );
    expect(effects).not.toContainEqual(expect.objectContaining({ idsEntry: "ANYONE" }));
  });

  it("falls back to the generic ANYONE Hold effect when races is an empty array, instead of adding no Hold effect at all", () => {
    const effects = effectFactory.paralyze({ duration: 6, races: [] });
    expect(effects).toContainEqual(
      expect.objectContaining({
        opcode: EffectTypeEnum.Hold,
        idsFile: EffectIDSFileEnum.EA,
        idsEntry: "ANYONE",
      }),
    );
  });
});

describe("regeneration", () => {
  it.each([
    [6, RegenerationTypeEnum.AmountHPperSecond, 1],
    [12, RegenerationTypeEnum.AmountHPperSecond, 2],
    [1, RegenerationTypeEnum.OneHPperAmountSeconds, 6],
    [2, RegenerationTypeEnum.OneHPperAmountSeconds, 3],
    [3, RegenerationTypeEnum.OneHPperAmountSeconds, 2],
    [0.5, RegenerationTypeEnum.OneHPperAmountSeconds, 12],
  ])("%d hp/round -> type %d, amount %d", (hpPerRound, type, amount) => {
    expect(effectFactory.regeneration(hpPerRound)).toEqual({
      opcode: EffectTypeEnum.Regeneration,
      type,
      amount,
      icon: PortraitIconEnum.Regenerate,
    });
  });

  it("rounds rates the engine can't express exactly", () => {
    // 4 hp/round = 1 hp/1.5s -> 1 hp/2s (3 hp/round)
    expect(effectFactory.regeneration(4)).toMatchObject({
      type: RegenerationTypeEnum.OneHPperAmountSeconds,
      amount: 2,
    });
    // 9 hp/round = 1.5 hp/s -> 2 hp/s
    expect(effectFactory.regeneration(9)).toMatchObject({
      type: RegenerationTypeEnum.AmountHPperSecond,
      amount: 2,
    });
  });

  it("rejects non-positive values", () => {
    expect(() => effectFactory.regeneration(0)).toThrow();
  });
});
