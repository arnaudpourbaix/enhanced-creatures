import { describe, expect, it } from "vitest";
import { Effect } from "../model/spell-item/effect";
import { EffectIDSFileEnum, EffectTimingEnum } from "../model/spell-item/effect.enums";
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
      { opcode: EffectTypeEnum.PlaySound, resource: "EFF_M08", timing: EffectTimingEnum.InstantPermanent },
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
