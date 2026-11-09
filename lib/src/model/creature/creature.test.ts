import { afterEach, describe, expect, it, onTestFinished, vi } from "vitest";
import { MonsterItemIconEnum } from "../../../config/item";
import poisonService from "../../services/effects/poison.service";
import {
  AbilityDamageTypeEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
} from "../spell-item/effect.enums";
import { EffectTypeEnum } from "../spell-item/effect.type";
import { Weapon, WeaponCastSpell } from "../spell-item/spell-item";
import { MainCreatureData } from "./data";
import { Creature } from "./creature";
import { CreatureGrabConfig } from "./grab";
import { JEWEL_SLOTS } from "./item";
import { CreatureKin } from "./kin";
import { KinEnum } from "../../../creatures/kin";
import { State } from "../../state";
import type { ImmunityConfig } from "../final/immunity";

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

  it("names the weapon after its kind unless a name key is given", () => {
    const creature = fakeCreature();
    expect(creature.addNaturalWeapon("jaws", jaws).stringRef).toBe("common.naturalWeapon.jaws");
    expect(creature.addNaturalWeapon("fists", jaws).stringRef).toBe("common.naturalWeapon.fists");
    const paws = creature.addNaturalWeapon("claws", {
      ...jaws,
      stringRef: "common.naturalWeapon.paws",
    });
    expect(paws.stringRef).toBe("common.naturalWeapon.paws");
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

  it("passes the creature-specific options through to the weapon and its header", () => {
    const creature = fakeCreature();
    const addWeapon = vi.spyOn(creature, "addWeapon").mockReturnValue({} as Weapon);
    const animationSwing = { overhand: 10, backhand: 20, thrust: 70 };
    creature.addNaturalWeapon("stinger", {
      ...jaws,
      id: 7,
      range: 2,
      projectile: "JAPROJ",
      animationSwing,
      damageBonus: 4,
      immunities: ["poison"],
      doc: false,
    });
    const { weapon } = addWeapon.mock.calls[0][0];
    expect(weapon).toMatchObject({ id: 7, immunities: ["poison"], doc: false });
    expect(weapon.header).toMatchObject({
      range: 2,
      projectile: "JAPROJ",
      animationSwing,
      damageBonus: 4,
    });
  });
});

describe("addTraitEffects", () => {
  const regeneration = {
    opcode: EffectTypeEnum.Regeneration,
    amount: 1,
  } as const;
  const contingency = { opcode: EffectTypeEnum.PlaySound, resource: "EFF_P11" } as const;
  const traitOf = (creature: Creature) => creature.items.find((i) => i.trait);
  const named = () => Object.assign(fakeCreature(), { name: "monster.ankheg.name" as const });

  it("adds to an existing trait", () => {
    const creature = named();
    creature.addTrait({ effects: [regeneration] });
    creature.addTraitEffects([contingency]);
    expect(traitOf(creature)?.effects.map((e) => e.opcode)).toEqual([
      EffectTypeEnum.Regeneration,
      EffectTypeEnum.PlaySound,
    ]);
    expect(traitOf(creature)?.effects[1]).toMatchObject({
      timing: EffectTimingEnum.InstantWhileEquipped,
      target: EffectTargetEnum.Self,
    });
  });

  it("keeps them for a trait added later", () => {
    const creature = named();
    creature.addTraitEffects([contingency]);
    expect(traitOf(creature)).toBeUndefined();
    creature.addTrait({ effects: [regeneration] });
    expect(traitOf(creature)?.effects.map((e) => e.opcode)).toEqual([
      EffectTypeEnum.PlaySound,
      EffectTypeEnum.Regeneration,
    ]);
    creature.finalizeTrait();
    expect(creature.items.filter((i) => i.trait)).toHaveLength(1);
  });

  it("creates the trait at the end of the build when the entry adds none", () => {
    const creature = named();
    creature.finalizeTrait();
    expect(traitOf(creature)).toBeUndefined();
    creature.addTraitEffects([contingency]);
    creature.finalizeTrait();
    expect(traitOf(creature)?.effects.map((e) => e.opcode)).toEqual([EffectTypeEnum.PlaySound]);
  });
});

describe("shared traits", () => {
  class TestKin extends CreatureKin {}
  const named = () => Object.assign(fakeCreature(), { name: "monster.ankheg.name" as const });

  it("counts a shared trait it equips, and its own trait never overrides it", () => {
    const saved = State.immunities;
    State.immunities = [
      { name: "acid", immunities: [] },
      { name: "cloudSpells", immunities: [] },
    ] as unknown as ImmunityConfig[];
    onTestFinished(() => {
      State.immunities = saved;
    });
    const shared = new TestKin(KinEnum.Fey).addSharedTrait({
      name: "monster.ankheg.name",
      immunities: ["cloudSpells"],
    });
    const creature = named();
    creature.data.immunities = [];
    creature.data.items.equipped.push({ file: shared.file, slot: JEWEL_SLOTS });
    creature.addTrait({ immunities: ["acid"] });
    expect(creature.data.items.equipped.map((e) => e.file)).toContain(shared.file);
    expect(creature.traits).toContain(shared);
    expect(creature.hasImmunity("cloudSpells")).toBe(true);
    expect(creature.hasImmunity("acid")).toBe(true);
  });
});

describe("wieldsGrab", () => {
  const grabber = () => {
    const creature = fakeCreature();
    creature.adjustments = [];
    const weapon = creature.addWeapon({
      weapon: { equippedSlot: [], header: { type: ItemAbilityTypeEnum.Melee, effects: [] } },
    });
    weapon.grab = true;
    return { creature, weapon };
  };

  it("is false when the grabbing weapon isn't equipped", () => {
    expect(grabber().creature.wieldsGrab()).toBe(false);
  });

  it("is true when the base or one of its adjustments equips it", () => {
    const base = grabber();
    base.weapon.equippedSlot = ["WEAPON1"];
    expect(base.creature.wieldsGrab()).toBe(true);
    const adjusted = grabber();
    adjusted.creature.adjustments = [
      {
        files: ["X"],
        data: { items: { equipped: [{ file: adjusted.weapon.file, slot: "SHIELD" }] } },
      },
    ] as unknown as Creature["adjustments"];
    expect(adjusted.creature.wieldsGrab()).toBe(true);
  });
});
