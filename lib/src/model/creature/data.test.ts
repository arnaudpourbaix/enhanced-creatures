import { describe, expect, it } from "vitest";
import { Effect } from "../spell-item/effect";
import { EffectTypeEnum } from "../spell-item/effect.type";
import { CREATURE_DATA_FIELDS, CreatureData, DATA_DEFAULT, Level } from "./data";
import { Movement } from "./movement";

function field(key: keyof CreatureData) {
  const entry = CREATURE_DATA_FIELDS.find((f) => f.key === key);
  if (!entry) throw new Error(`No CREATURE_DATA_FIELDS entry for ${key}`);
  return entry;
}

function fieldValue(key: keyof CreatureData) {
  const value = field(key).value;
  if (!value) throw new Error(`No value getter for ${key}`);
  return value;
}

function fieldSetter(key: keyof CreatureData) {
  const setter = field(key).setter;
  if (!setter) throw new Error(`No setter for ${key}`);
  return setter;
}

function baseData(overrides: Partial<CreatureData>): CreatureData {
  return { ...DATA_DEFAULT, ...overrides } as CreatureData;
}

describe("CREATURE_DATA_FIELDS 'movement'", () => {
  it("emits the converted engine value when not attached to an item", () => {
    const data = baseData({ movement: new Movement(12) });
    expect(fieldValue("movement")(data)).toBe("10");
  });

  it("emits nothing when the movement is instead carried by an item (0x28 slot conflict avoided)", () => {
    const movement = new Movement(12);
    movement.bindItem("SOME_ITEM");
    const data = baseData({ movement });
    expect(fieldValue("movement")(data)).toBeUndefined();
  });

  it("the setter wraps a plain number into a Movement instance", () => {
    const data = baseData({});
    fieldSetter("movement")(data, 12);
    expect(data.movement).toBeInstanceOf(Movement);
    if (!data.movement) throw new Error("expected movement to be set");
    expect(data.movement.pnpValue).toBe(12);
  });
});

describe("CREATURE_DATA_FIELDS 'level1'/'level2'/'level3'", () => {
  it("the setter wraps a plain number shorthand into a Level object with type 'none'", () => {
    const data = baseData({});
    fieldSetter("level1")(data, 8);
    expect(data.level1).toEqual({ pnpValue: 8, value: 8, type: "none" });
  });

  it("the setter passes through an already-built Level object unchanged", () => {
    const data = baseData({});
    const level: Level = { pnpValue: 8, value: 6, type: "caster" };
    fieldSetter("level1")(data, level);
    expect(data.level1).toBe(level);
  });

  it("the value getter reads the resolved (engine) value, not the pnp value", () => {
    const data = baseData({
      level1: { pnpValue: 8, value: 6, type: "caster" },
    });
    expect(fieldValue("level1")(data)).toBe("6");
  });

  it("level2's setter also passes through an already-built Level object unchanged", () => {
    const data = baseData({});
    const level: Level = { pnpValue: 9, value: 7, type: "caster" };
    fieldSetter("level2")(data, level);
    expect(data.level2).toBe(level);
  });
});

describe("CREATURE_DATA_FIELDS 'spells'", () => {
  it("a boolean removeMemorized always overwrites the current value", () => {
    const data = baseData({
      spells: { removeKnown: undefined, removeMemorized: ["OLD"], memorized: [] },
    });
    fieldSetter("spells")(data, { removeMemorized: false });
    expect(data.spells.removeMemorized).toBe(false);
  });

  it("merges an array removeMemorized into an existing array", () => {
    const data = baseData({
      spells: { removeKnown: undefined, removeMemorized: ["OLD"], memorized: [] },
    });
    fieldSetter("spells")(data, { removeMemorized: ["NEW"] });
    expect(data.spells.removeMemorized).toEqual(["OLD", "NEW"]);
  });

  it("replaces a non-array removeMemorized (e.g. still the boolean default) with the new array", () => {
    const data = baseData({
      spells: { removeKnown: undefined, removeMemorized: true, memorized: [] },
    });
    fieldSetter("spells")(data, { removeMemorized: ["NEW"] });
    expect(data.spells.removeMemorized).toEqual(["NEW"]);
  });

  it("leaves removeMemorized untouched when not provided", () => {
    const data = baseData({
      spells: { removeKnown: undefined, removeMemorized: true, memorized: [] },
    });
    fieldSetter("spells")(data, {});
    expect(data.spells.removeMemorized).toBe(true);
  });

  it("initializes spellbooks when none exist yet", () => {
    const data = baseData({
      spells: { removeKnown: undefined, removeMemorized: undefined, memorized: [] },
    });
    fieldSetter("spells")(data, {
      spellbooks: [{ mod: "SpellRevisions", memorized: [{ file: "SPWI002", memorizedCount: 2 }] }],
    });
    expect(data.spells.spellbooks).toEqual([
      { mod: "SpellRevisions", memorized: [{ file: "SPWI002", memorizedCount: 2 }] },
    ]);
  });

  it("appends onto an existing spellbooks list rather than replacing it", () => {
    const data = baseData({
      spells: {
        removeKnown: undefined,
        removeMemorized: undefined,
        memorized: [],
        spellbooks: [
          { mod: "SpellRevisions", memorized: [{ file: "SPWI002", memorizedCount: 2 }] },
        ],
      },
    });
    fieldSetter("spells")(data, {
      spellbooks: [{ mod: "FaithsAndPowers", memorized: [{ file: "SPWI003", memorizedCount: 3 }] }],
    });
    expect(data.spells.spellbooks).toEqual([
      { mod: "SpellRevisions", memorized: [{ file: "SPWI002", memorizedCount: 2 }] },
      { mod: "FaithsAndPowers", memorized: [{ file: "SPWI003", memorizedCount: 3 }] },
    ]);
  });
});

describe("CREATURE_DATA_FIELDS 'effects'", () => {
  it("pushes provided effects onto the list", () => {
    const data = baseData({ effects: { remove: undefined, list: [] } });
    const effect = { opcode: 1 } as unknown as Effect;
    fieldSetter("effects")(data, { list: [effect] });
    expect(data.effects.list).toEqual([effect]);
  });

  it("a boolean remove always overwrites the current value", () => {
    const data = baseData({ effects: { remove: [1], list: [] } });
    fieldSetter("effects")(data, { remove: false });
    expect(data.effects.remove).toBe(false);
  });

  it("merges an array remove into an existing array", () => {
    const data = baseData({ effects: { remove: [1], list: [] } });
    fieldSetter("effects")(data, { remove: [2 as EffectTypeEnum] });
    expect(data.effects.remove).toEqual([1, 2]);
  });

  it("replaces a non-array remove with the new array", () => {
    const data = baseData({ effects: { remove: undefined, list: [] } });
    fieldSetter("effects")(data, { remove: [1 as EffectTypeEnum] });
    expect(data.effects.remove).toEqual([1]);
  });

  it("leaves remove untouched when not provided", () => {
    const data = baseData({ effects: { remove: [1], list: [] } });
    fieldSetter("effects")(data, {});
    expect(data.effects.remove).toEqual([1]);
  });
});
