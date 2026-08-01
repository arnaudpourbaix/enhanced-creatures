import { describe, expect, it } from "vitest";
import { MonsterEnum } from "../../../creatures/monster";
import { Item, Spell } from "../spell-item/spell-item";
import { Projectile } from "../spell-item/projectile";
import { CreatureFamily } from "./family";
import { Creature } from "./creature";

class TestFamily extends CreatureFamily<Creature> {
  createCreature(id: MonsterEnum): Creature {
    return new Creature(id);
  }
}

function fakeFamily(): TestFamily {
  return new TestFamily(1);
}

describe("creature", () => {
  it("throws when no creature in the family has the given id", () => {
    const family = fakeFamily();
    expect(() => family.creature(99 as MonsterEnum)).toThrow(/No creature found with id 99/);
  });

  it("returns the creature with the matching id", () => {
    const family = fakeFamily();
    const cre = new Creature(5);
    family.creatures.push(cre);
    expect(family.creature(5)).toBe(cre);
  });
});

describe("sequencer", () => {
  it("delegates to abilityService.getSequencer", () => {
    const family = fakeFamily();
    const result = family.sequencer(["SPWI219", "SPWI219", "SPWI219"] as string[] & { length: 3 });
    expect(result).toBeDefined();
  });
});

describe("item (override, family-wide fallback)", () => {
  // Same descriptions reused across item/spell/projectile describe blocks below for analogous
  // family-wide-fallback behavior - a shared constant would hurt searchability in test output.
  // eslint-disable-next-line sonarjs/no-duplicate-string
  it("falls back to searching creatures in the family when not found directly", () => {
    const family = fakeFamily();
    const cre = new Creature(1);
    const item = { id: 7, file: "itm01" } as unknown as Item;
    cre.items.push(item);
    family.creatures.push(cre);
    expect(family.item(7)).toBe(item);
  });

  // eslint-disable-next-line sonarjs/no-duplicate-string
  it("re-throws the original error when not found anywhere in the family", () => {
    const family = fakeFamily();
    expect(() => family.item(99)).toThrow(/No item found with id 99/);
  });
});

describe("spell (override, family-wide fallback)", () => {
  it("falls back to searching creatures in the family when not found directly", () => {
    const family = fakeFamily();
    const cre = new Creature(1);
    const spell = { id: 7, file: "spl01" } as unknown as Spell;
    cre.spells.push(spell);
    family.creatures.push(cre);
    expect(family.spell(7)).toBe(spell);
  });

  it("re-throws the original error when not found anywhere in the family", () => {
    const family = fakeFamily();
    expect(() => family.spell(99)).toThrow(/No spell found with id 99/);
  });
});

describe("projectile (override, family-wide fallback)", () => {
  it("falls back to searching creatures in the family when not found directly", () => {
    const family = fakeFamily();
    const cre = new Creature(1);
    const proj = { id: 7, file: "pro01" } as unknown as Projectile;
    cre.projectiles.push(proj);
    family.creatures.push(cre);
    expect(family.projectile(7)).toBe(proj);
  });

  it("keeps checking later creatures when an earlier one doesn't have it", () => {
    const family = fakeFamily();
    const first = new Creature(1);
    const second = new Creature(2);
    const proj = { id: 7, file: "pro01" } as unknown as Projectile;
    second.projectiles.push(proj);
    family.creatures.push(first, second);
    expect(family.projectile(7)).toBe(proj);
  });

  it("re-throws the original error when not found anywhere in the family", () => {
    const family = fakeFamily();
    expect(() => family.projectile(99)).toThrow(/No projectile found with id 99/);
  });
});
