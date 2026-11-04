import { describe, expect, it } from "vitest";
import { CreatureAdjustment } from "../../src/model/creature/adjustment";
import { CreatureData, Level } from "../../src/model/creature/data";
import { Creature } from "../../src/model/creature/creature";
import { ImmunityName } from "../../src/model/final/immunity";
import { applyTurnLevel, TurnUndeadType } from "./turn-level";

const level = (pnpValue: number, type: Level["type"] = "none"): Level => ({
  pnpValue,
  value: pnpValue,
  type,
});

function fakeUndead(p: {
  level1: Level;
  bonusHp?: number;
  turnAs?: TurnUndeadType;
  immunities?: ImmunityName[];
  traitImmunities?: ImmunityName[];
  adjustments?: Partial<CreatureData>[];
}): Creature {
  return {
    turnAs: p.turnAs,
    data: { level1: p.level1, bonusHp: p.bonusHp, immunities: p.immunities ?? ["undead"] },
    items: p.traitImmunities ? [{ trait: true, immunities: p.traitImmunities }] : [],
    adjustments: (p.adjustments ?? []).map((data) => ({ data }) as CreatureAdjustment),
  } as unknown as Creature;
}

describe("applyTurnLevel", () => {
  it("leaves a plain undead at its Hit Dice", () => {
    const undead = fakeUndead({ level1: level(2) });
    applyTurnLevel(undead);
    expect(undead.data.level1).toEqual({ pnpValue: 2, value: 2, type: "none" });
  });

  it("rounds +3 Hit Dice up to the next row (4+3 HD wight is in the 5 HD row)", () => {
    const undead = fakeUndead({ level1: level(4), bonusHp: 3 });
    applyTurnLevel(undead);
    expect(undead.data.level1).toEqual({ pnpValue: 4, value: 5, type: "turn" });
  });

  it("does not round +1/+2 Hit Dice up", () => {
    const undead = fakeUndead({ level1: level(10), bonusHp: 2 });
    applyTurnLevel(undead);
    expect(undead.data.level1.value).toBe(10);
  });

  it("raises the level to the turnAs row when it is harder than the Hit Dice", () => {
    const undead = fakeUndead({ level1: level(3), turnAs: "spectre" });
    applyTurnLevel(undead);
    expect(undead.data.level1).toEqual({ pnpValue: 3, value: 8, type: "turn" });
  });

  it("keeps the Hit Dice when they are harder than the turnAs row (no cap)", () => {
    const undead = fakeUndead({ level1: level(14), turnAs: "lich" });
    applyTurnLevel(undead);
    expect(undead.data.level1).toEqual({ pnpValue: 14, value: 14, type: "none" });
  });

  it("rounds rows without Hit Dice up (ghast, between 5 and 6 HD)", () => {
    const undead = fakeUndead({ level1: level(4), turnAs: "ghast" });
    applyTurnLevel(undead);
    expect(undead.data.level1.value).toBe(6);
  });

  it("puts special undead one step above liches", () => {
    const undead = fakeUndead({ level1: level(7), turnAs: "special" });
    applyTurnLevel(undead);
    expect(undead.data.level1.value).toBe(12);
  });

  it("keeps a caster level untouched", () => {
    const caster: Level = { pnpValue: 12, value: 20, type: "caster" };
    const undead = fakeUndead({ level1: caster, turnAs: "special" });
    applyTurnLevel(undead);
    expect(undead.data.level1).toEqual(caster);
  });

  it.each([
    ["data", { immunities: ["undead", "turnUndead"] as ImmunityName[] }],
    ["trait", { traitImmunities: ["turnUndead"] as ImmunityName[] }],
  ])("skips creatures immune to turning (%s immunity)", (_, immunity) => {
    const undead = fakeUndead({ level1: level(6), turnAs: "vampire", ...immunity });
    applyTurnLevel(undead);
    expect(undead.data.level1.value).toBe(6);
  });

  it("applies the rule to adjustments, inheriting the base bonusHp", () => {
    const undead = fakeUndead({
      level1: level(7),
      bonusHp: 3,
      turnAs: "spectre",
      adjustments: [{ level1: level(10) }, { level1: level(5) }],
    });
    applyTurnLevel(undead);
    expect(undead.adjustments.map((a) => a.data.level1?.value)).toEqual([11, 8]);
  });

  it("uses the adjustment's own bonusHp over the base one", () => {
    const undead = fakeUndead({
      level1: level(7),
      bonusHp: 3,
      adjustments: [{ level1: level(10), bonusHp: 0 }],
    });
    applyTurnLevel(undead);
    expect(undead.adjustments[0].data.level1?.value).toBe(10);
  });

  it("only gives a level to an adjustment without one when its bonusHp changes the result", () => {
    const undead = fakeUndead({
      level1: level(4),
      adjustments: [{ bonusHp: 1 }, { bonusHp: 3 }, { strength: 18 }],
    });
    applyTurnLevel(undead);
    expect(undead.adjustments.map((a) => a.data.level1)).toEqual([
      undefined,
      { pnpValue: 4, value: 5, type: "turn" },
      undefined,
    ]);
  });

  it("leaves a creature without the undead type alone", () => {
    const creature = fakeUndead({
      level1: level(4),
      bonusHp: 3,
      immunities: ["magicalBeast"],
      adjustments: [{ level1: level(10), bonusHp: 3 }],
    });
    applyTurnLevel(creature);
    expect(creature.data.level1).toEqual(level(4));
    expect(creature.adjustments[0].data.level1).toEqual(level(10));
  });

  it("gives a turn level to an adjustment adding the undead type to a non-undead creature", () => {
    const ankheg = fakeUndead({
      level1: level(8),
      immunities: ["magicalBeast"],
      adjustments: [
        { level1: level(10) },
        { level1: level(15), bonusHp: 3, immunities: ["undead"] },
        { bonusHp: 3, immunities: ["undead"] },
      ],
    });
    applyTurnLevel(ankheg);
    expect(ankheg.data.level1).toEqual(level(8));
    expect(ankheg.adjustments.map((a) => a.data.level1)).toEqual([
      level(10),
      { pnpValue: 15, value: 16, type: "turn" },
      { pnpValue: 8, value: 9, type: "turn" },
    ]);
  });

  it("uses the creature's turnAs row for an adjustment adding the undead type", () => {
    const creature = fakeUndead({
      level1: level(3),
      turnAs: "wight",
      immunities: ["animal"],
      adjustments: [{ immunities: ["undead"] }],
    });
    applyTurnLevel(creature);
    expect(creature.adjustments[0].data.level1).toEqual({ pnpValue: 3, value: 5, type: "turn" });
  });

  it("skips an adjustment adding the undead type to a creature immune to turning", () => {
    const creature = fakeUndead({
      level1: level(4),
      immunities: ["animal", "turnUndead"],
      adjustments: [{ bonusHp: 3, immunities: ["undead"] }],
    });
    applyTurnLevel(creature);
    expect(creature.adjustments[0].data.level1).toBeUndefined();
  });
});
