import { describe, expect, it } from "vitest";
import { MainCreatureData } from "./data";
import { Creature } from "./creature";

function fakeCreature(): Creature {
  const creature = new Creature(1);
  creature.data = {
    spells: { memorized: [] },
    items: { equipped: [] },
    intelligence: 10,
  } as unknown as MainCreatureData;
  return creature;
}

describe("addSpell", () => {
  it("pushes a memorized entry when memorizedCount is a positive number", () => {
    const creature = fakeCreature();
    const spell = creature.addSpell({
      name: 12345,
      memorizedCount: 2,
    });
    expect(creature.data.spells.memorized).toEqual([{ file: spell.file, memorizedCount: 2 }]);
  });

  it("adds no memorized entry when memorizedCount is unset", () => {
    const creature = fakeCreature();
    creature.addSpell({ name: 12345 });
    expect(creature.data.spells.memorized).toEqual([]);
  });

  it("pushes a memorized entry with memorizedCount: 0 (the 'remove memorized spell' sentinel)", () => {
    const creature = fakeCreature();
    const spell = creature.addSpell({
      name: 12345,
      memorizedCount: 0,
    });
    expect(creature.data.spells.memorized).toEqual([{ file: spell.file, memorizedCount: 0 }]);
  });
});

describe("setAttack", () => {
  it("falls back to a single default action when no actions are given", () => {
    const creature = fakeCreature();
    creature.setAttack({});
    expect(creature.attack.actions).toEqual([{ disableInterrupt: false, responseWeight: 100 }]);
  });

  it("uses the given actions, defaulting missing per-action fields", () => {
    const creature = fakeCreature();
    creature.setAttack({
      actions: [{ responseWeight: 50 }, { disableInterrupt: true }],
    });
    expect(creature.attack.actions).toEqual([
      { disableInterrupt: false, responseWeight: 50, weaponSlot: undefined },
      { disableInterrupt: true, responseWeight: 100, weaponSlot: undefined },
    ]);
  });

  it("defaults melee to true and ranged to false", () => {
    const creature = fakeCreature();
    creature.setAttack({});
    expect(creature.attack.melee).toBe(true);
    expect(creature.attack.ranged).toBe(false);
  });

  it("honors explicit melee/ranged overrides", () => {
    const creature = fakeCreature();
    creature.setAttack({ melee: false, ranged: true });
    expect(creature.attack.melee).toBe(false);
    expect(creature.attack.ranged).toBe(true);
  });
});

describe("addItem (override)", () => {
  it("adds the item to equipped when equippedSlot is given", () => {
    const creature = fakeCreature();
    const item = creature.addItem({ equippedSlot: ["LRING"] });
    expect(creature.data.items.equipped).toEqual([{ file: item.file, slot: ["LRING"] }]);
  });

  it("does not touch equipped items when equippedSlot is omitted", () => {
    const creature = fakeCreature();
    creature.addItem({});
    expect(creature.data.items.equipped).toEqual([]);
  });

  it("replaces an existing single-slot item already occupying the same slot", () => {
    const creature = fakeCreature();
    const first = creature.addItem({ equippedSlot: ["LRING"] });
    creature.data.items.equipped = [{ file: first.file, slot: ["LRING"] }];
    const second = creature.addItem({ equippedSlot: ["LRING"] });
    expect(creature.data.items.equipped).toEqual([{ file: second.file, slot: ["LRING"] }]);
  });
});
