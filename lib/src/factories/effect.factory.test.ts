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
import { StringRefUtils } from "../services/utils/string-ref.utils";

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
    expect(effectFactory.regeneration(hpPerRound)).toEqual([
      {
        opcode: EffectTypeEnum.Regeneration,
        type,
        amount,
        icon: PortraitIconEnum.Regenerate,
      },
    ]);
  });

  const perSecond = (amount: number) => ({
    type: RegenerationTypeEnum.AmountHPperSecond,
    amount,
  });
  const oneEvery = (amount: number) => ({
    type: RegenerationTypeEnum.OneHPperAmountSeconds,
    amount,
  });

  it.each([
    // 4 hp/round = 1 hp/2s (3) + 1 hp/6s (1)
    [4, [oneEvery(2), oneEvery(6)]],
    // 5 hp/round = 1 hp/2s (3) + 1 hp/3s (2)
    [5, [oneEvery(2), oneEvery(3)]],
    // 9 hp/round = 1 hp/s (6) + 1 hp/2s (3)
    [9, [perSecond(1), oneEvery(2)]],
    // 16 hp/round = 2 hp/s (12) + 1 hp/2s (3) + 1 hp/6s (1)
    [16, [perSecond(2), oneEvery(2), oneEvery(6)]],
  ])("stacks effects for %d hp/round, which no single effect expresses", (hpPerRound, expected) => {
    expect(effectFactory.regeneration(hpPerRound)).toMatchObject(expected);
  });

  it("rejects non-positive values", () => {
    expect(() => effectFactory.regeneration(0)).toThrow();
  });
});

describe("levelDrain", () => {
  it.each([
    [4, "Four Levels Drained"],
    [5, "Five Levels Drained"],
  ])("drains %i levels and says so", (levels, text) => {
    const effects = effectFactory.levelDrain({ levels });
    expect(effects.find((e) => e.opcode === EffectTypeEnum.LevelDrain)).toMatchObject({
      amount: levels,
    });
    expect(effects.find((e) => e.opcode === EffectTypeEnum.DisplayString)).toMatchObject({
      stringRef: StringRefUtils.getString(text),
    });
  });
});

describe("diceOutcomes", () => {
  const build = (total: number): Effect[] => [
    { opcode: EffectTypeEnum.DisplayPortraitIcon, icon: PortraitIconEnum.Held, duration: total },
  ];

  it("weights each total like the dice and covers the whole 0-99 roll", () => {
    const effects = effectFactory.diceOutcomes(2, 4, build);
    expect(effects.map((e) => [e.duration, e.probability2, e.probability1])).toEqual([
      [2, 0, 5],
      [3, 6, 18],
      [4, 19, 37],
      [5, 38, 62],
      [6, 63, 80],
      [7, 81, 93],
      [8, 94, 99],
    ]);
  });

  it("gives every effect of an outcome the same range", () => {
    const effects = effectFactory.diceOutcomes(1, 2, (total) => [...build(total), ...build(total)]);
    expect(effects.map((e) => [e.probability2, e.probability1])).toEqual([
      [0, 49],
      [0, 49],
      [50, 99],
      [50, 99],
    ]);
  });

  it("refuses dice that aren't positive", () => {
    expect(() => effectFactory.diceOutcomes(0, 4, build)).toThrow();
  });
});
