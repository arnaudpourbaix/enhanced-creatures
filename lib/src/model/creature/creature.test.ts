import { afterEach, describe, expect, it, vi } from "vitest";
import { MonsterItemIconEnum } from "../../../config/item";
import poisonService from "../../services/effects/poison.service";
import {
  AbilityDamageTypeEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
} from "../spell-item/effect.enums";
import { Weapon, WeaponCastSpell } from "../spell-item/spell-item";
import { MainCreatureData } from "./data";
import { Creature } from "./creature";
import { CreatureGrabConfig } from "./grab";

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

describe("addNaturalWeapon", () => {
  const jaws = {
    stringRef: "monster.bear.weapon.jaws",
    diceThrown: 1,
    diceSize: 6,
    speed: 3,
  } as const;

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("applies the kind defaults", () => {
    const weapon = fakeCreature().addNaturalWeapon("jaws", jaws);
    expect(weapon.icon).toBe(MonsterItemIconEnum.Jaws);
    expect(weapon.header.damageType).toBe(AbilityDamageTypeEnum.Piercing);
    expect(weapon.header.type).toBe(ItemAbilityTypeEnum.Melee);
    expect(weapon.header.abilityflags).toContain(ItemAbilityFlagEnum.AddStrengthBonus);
    expect(weapon.header.speed).toBe(3);
    expect(weapon.header.diceThrown).toBe(1);
    expect(weapon.header.diceSize).toBe(6);
  });

  it("lets options override icon and damage type", () => {
    const weapon = fakeCreature().addNaturalWeapon("claws", {
      ...jaws,
      icon: MonsterItemIconEnum.Ghoul,
      damageType: AbilityDamageTypeEnum.Crushing,
    });
    expect(weapon.icon).toBe(MonsterItemIconEnum.Ghoul);
    expect(weapon.header.damageType).toBe(AbilityDamageTypeEnum.Crushing);
  });

  it("equips WEAPON1 by default, the given slot, or nothing with slot null", () => {
    const creature = fakeCreature();
    expect(creature.addNaturalWeapon("jaws", jaws).equippedSlot).toEqual(["WEAPON1"]);
    expect(creature.addNaturalWeapon("jaws", { ...jaws, slot: "SHIELD" }).equippedSlot).toEqual([
      "SHIELD",
    ]);
    expect(creature.addNaturalWeapon("jaws", { ...jaws, slot: null }).equippedSlot).toEqual([]);
  });

  it("casts the poison spell before the explicit cast spells", () => {
    const creature = fakeCreature();
    const getSpell = vi
      .spyOn(poisonService, "getSpell")
      .mockReturnValue({ spell: "POISON" } as WeaponCastSpell);
    const addWeapon = vi.spyOn(creature, "addWeapon").mockReturnValue({} as Weapon);
    creature.addNaturalWeapon("jaws", {
      ...jaws,
      poison: { poisonType: "A", saveBonus: 2 },
      castSpells: [{ spell: "OTHER" } as WeaponCastSpell],
    });
    expect(getSpell).toHaveBeenCalledWith({ poisonType: "A", saveBonus: 2 });
    expect(addWeapon.mock.calls[0][0].castSpells?.map((c) => c.spell)).toEqual(["POISON", "OTHER"]);
  });

  it("passes grab through and sets no undefined keys", () => {
    const creature = fakeCreature();
    const addWeapon = vi.spyOn(creature, "addWeapon").mockReturnValue({} as Weapon);
    const grab: CreatureGrabConfig = { onlyGrabProneTarget: true };
    creature.addNaturalWeapon("jaws", { ...jaws, grab });
    const arg = addWeapon.mock.calls[0][0];
    expect(arg.grab).toBe(grab);
    expect(Object.values(arg.weapon)).not.toContain(undefined);
    expect(Object.values(arg.weapon.header)).not.toContain(undefined);
  });
});
