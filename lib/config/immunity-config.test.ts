import { describe, expect, it } from "vitest";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import {
  CHECKED_IMMUNITY_STATES,
  IMMUNITIES,
  IMMUNITY_STATES,
  RESISTANCES,
  TRAITS,
} from "./immunity-config";

describe("immunity configs", () => {
  // Each itemSlot.file is created as its own ITM: two configs sharing one would overwrite each
  // other at install (the later CREATE ITM wins).
  it("doesn't reuse the same trait item file across configs", () => {
    const files = [...IMMUNITIES, ...RESISTANCES, ...TRAITS]
      .map((i) => i.itemSlot?.file)
      .filter((f): f is string => f !== undefined)
      .map((f) => f.toLowerCase());
    const duplicates = files.filter((f, i) => files.indexOf(f) !== i);
    expect(duplicates).toEqual([]);
  });
});

describe("IMMUNITY_STATES", () => {
  it("gives each immunity's state the first opcode it prevents", () => {
    expect(IMMUNITY_STATES).toContainEqual({
      state: "CHARM_IMMUNITY",
      opcode: EffectTypeEnum.CharmCreature,
    });
    expect(IMMUNITY_STATES).toContainEqual({
      state: "HOLD_IMMUNITY",
      opcode: EffectTypeEnum.Paralyze,
    });
  });

  it("gives every state of an immunity the same opcode (fear sets two)", () => {
    expect(IMMUNITY_STATES.filter(({ opcode }) => opcode === EffectTypeEnum.Panic)).toEqual([
      { state: "RESIST_FEAR", opcode: EffectTypeEnum.Panic },
      { state: "PANIC_IMMUNITY", opcode: EffectTypeEnum.Panic },
    ]);
  });

  it("leaves out immunities without a state", () => {
    expect(IMMUNITY_STATES.every(({ state }) => !!state)).toBe(true);
    expect(IMMUNITY_STATES.map(({ opcode }) => opcode)).not.toContain(EffectTypeEnum.Disease);
  });
});

describe("CHECKED_IMMUNITY_STATES", () => {
  const states = () => CHECKED_IMMUNITY_STATES.map(({ state }) => state);

  it("keeps the states the AI checks", () => {
    expect(states()).toEqual(
      expect.arrayContaining([
        "CHARM_IMMUNITY",
        "HOLD_IMMUNITY",
        "PANIC_IMMUNITY",
        "ITEM_LEVELDRAIN",
      ]),
    );
  });

  it("leaves out those it doesn't (poison is checked by resistance)", () => {
    expect(IMMUNITY_STATES.map(({ state }) => state)).toContain("ITEM_POISON");
    expect(states()).not.toContain("ITEM_POISON");
  });
});
