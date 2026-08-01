import { describe, expect, it } from "vitest";
import { MonsterFamilyEnum, MonsterEnum } from "../../creatures/monster";
import { Creature } from "../model/creature/creature";
import { CreatureData } from "../model/creature/data";
import { ImmunityName } from "../model/final/immunity";
import { HitDiceTable } from "../model/game-data/hp";
import hitPointService from "./hit-point.service";

function fakeCreature(
  p: {
    id?: MonsterEnum;
    family?: MonsterFamilyEnum;
    immunities?: ImmunityName[];
  } = {},
): Creature {
  return {
    id: p.id ?? MonsterEnum.WildDog,
    family: p.family ?? MonsterFamilyEnum.Dog,
    data: { immunities: p.immunities ?? [] },
  } as unknown as Creature;
}

describe("hitPointService.getHitPoints", () => {
  it("throws when level1 is unknown and there is no parent", () => {
    expect(() =>
      hitPointService.getHitPoints({ data: {}, creature: fakeCreature() }),
    ).toThrow(/level1 is unknown/);
  });

  it("returns 0 without throwing when level1 is unknown but a parent is provided (adjustment doesn't override level)", () => {
    const value = hitPointService.getHitPoints({
      data: {},
      creature: fakeCreature(),
      parent: {} as CreatureData,
    });
    expect(value).toBe(0);
  });

  it("computes base hit points as level x hit dice, defaulting to 8 HD when nothing matches", () => {
    const value = hitPointService.getHitPoints({
      data: { level1: { pnpValue: 5, value: 5, type: "none" } },
      creature: fakeCreature(),
    });
    expect(value).toBe(40); // 5 * 8
  });

  it("resolves hit dice from the creature's family via HitDiceTable (Undead -> 12 HD)", () => {
    const value = hitPointService.getHitPoints({
      data: { level1: { pnpValue: 3, value: 3, type: "none" } },
      creature: fakeCreature({ family: MonsterFamilyEnum.Undead }),
    });
    expect(value).toBe(36); // 3 * 12
  });

  it("resolves hit dice from an immunity type via HitDiceTable when family/monster don't match (construct -> 10 HD)", () => {
    const value = hitPointService.getHitPoints({
      data: { level1: { pnpValue: 4, value: 4, type: "none" } },
      creature: fakeCreature({ immunities: ["construct"] }),
    });
    expect(value).toBe(40); // 4 * 10
  });

  it("adds a constitution bonus based on the creature's constitution score when not a player class", () => {
    const value = hitPointService.getHitPoints({
      data: {
        level1: { pnpValue: 5, value: 5, type: "none" },
        constitution: 18,
      },
      creature: fakeCreature(),
    });
    expect(value).toBe(60); // 40 (base) + 5*4 (con 18 -> warriorHp 4)
  });

  it("does not apply a constitution bonus for player classes", () => {
    const value = hitPointService.getHitPoints({
      data: {
        level1: { pnpValue: 5, value: 5, type: "none" },
        constitution: 18,
        class: "FIGHTER",
      },
      creature: fakeCreature(),
    });
    expect(value).toBe(40); // constitution bonus skipped
  });

  it("adds specialBonusHp directly on top of the base", () => {
    const value = hitPointService.getHitPoints({
      data: {
        level1: { pnpValue: 2, value: 2, type: "none" },
        specialBonusHp: 5,
      },
      creature: fakeCreature(),
    });
    expect(value).toBe(21); // 2*8 + 5
  });

  it("adds a flat bonusHp when the creature has no matching size immunity", () => {
    const value = hitPointService.getHitPoints({
      data: {
        level1: { pnpValue: 2, value: 2, type: "none" },
        bonusHp: 3,
      },
      creature: fakeCreature(),
    });
    expect(value).toBe(19); // 2*8 + 3
  });

  it("prefers the size-based bonus over bonusHp when the creature has a matching size immunity (construct/Large -> +30)", () => {
    const value = hitPointService.getHitPoints({
      data: {
        level1: { pnpValue: 1, value: 1, type: "none" },
        size: "Large",
        bonusHp: 3,
      },
      creature: fakeCreature({ immunities: ["construct"] }),
    });
    expect(value).toBe(40); // 1*10 (construct HD) + 30 (size bonus), bonusHp ignored
  });

  it("throws when constitution is outside the known table range", () => {
    expect(() =>
      hitPointService.getHitPoints({
        data: {
          level1: { pnpValue: 1, value: 1, type: "none" },
          constitution: 999,
        },
        creature: fakeCreature(),
      }),
    ).toThrow(/constitution not found in table: 999/);
  });

  it("resolves hit dice via a monsterId-keyed HitDiceTable entry (documented but currently unused by real config)", () => {
    HitDiceTable.push({ monsterId: MonsterEnum.WildDog, hd: 20 });
    try {
      const value = hitPointService.getHitPoints({
        data: { level1: { pnpValue: 2, value: 2, type: "none" } },
        creature: fakeCreature({ id: MonsterEnum.WildDog }),
      });
      expect(value).toBe(40); // 2 * 20
    } finally {
      HitDiceTable.pop();
    }
  });

  it("falls back to the parent's constitution/bonusHp/class when the adjustment data doesn't override them", () => {
    const parent: CreatureData = {
      constitution: 18,
      bonusHp: 3,
      class: "FIGHTER",
    } as CreatureData;
    const value = hitPointService.getHitPoints({
      data: { level1: { pnpValue: 2, value: 2, type: "none" } },
      creature: fakeCreature(),
      parent,
    });
    expect(value).toBe(19); // 2*8 (base) + 0 (con bonus skipped, parent is a player class) + 3 (parent bonusHp)
  });
});
