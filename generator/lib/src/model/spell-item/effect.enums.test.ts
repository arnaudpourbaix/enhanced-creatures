import { describe, expect, it } from "vitest";
import { CastSpellOnConditionType, getCastSpellOnConditionValue } from "./effect.enums";

describe("getCastSpellOnConditionValue", () => {
  it.each([
    ["HitBy([ANYONE])", 0],
    ["See([EVILCUTOFF])", 1],
    ["HPPercentLT(Myself,50)", 2],
    ["HPPercentLT(Myself,25)", 3],
    ["HPPercentLT(Myself,10)", 4],
    ["StateCheck(Myself,STATE_HELPLESS)", 5],
    ["StateCheck(Myself,STATE_POISONED)", 6],
    ["AttackedBy([ANYONE])", 7],
    ["PersonalSpaceDistance([ANYONE],4)", 8],
    ["PersonalSpaceDistance([ANYONE],10)", 9],
    ["Delay(Extra)", 10],
    ["TookDamage()", 11],
    ["Killed([ANYONE])", 12],
    ["TimeOfDay(Extra)", 13],
    ["PersonalSpaceDistance([ANYONE],Extra)", 14],
    ["StateCheck([ANYONE],Extra)", 15],
    ["Die()", 16],
    ["Died([ANYONE])", 17],
    ["TurnedBy([ANYONE])", 18],
    ["HPLT(Myself,Extra)", 19],
    ["HPPercentLT(Myself,Extra)", 20],
    ["CheckSpellState(Myself,Extra)", 21],
  ] as const)("maps %s to %i", (text, expected) => {
    expect(getCastSpellOnConditionValue(text)).toBe(expected);
  });

  it("returns 0 for an unrecognized condition text", () => {
    expect(getCastSpellOnConditionValue("not-a-real-condition" as CastSpellOnConditionType)).toBe(
      0,
    );
  });
});
