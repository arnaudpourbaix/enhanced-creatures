import { describe, expect, it } from "vitest";
import { Creature } from "../model/creature/creature";
import { CreatureData } from "../model/creature/data";
import { ItemFlagEnum } from "../model/spell-item/effect.enums";
import { Weapon } from "../model/spell-item/spell-item";
import weaponService from "./weapon.service";

function fakeCreature(p: {
  data: Partial<CreatureData>;
  autoGenerate?: Partial<Creature["autoGenerate"]>;
}): Creature {
  return {
    data: { immunities: [], ...p.data },
    autoGenerate: {
      thac0: true,
      hitPoints: true,
      enchantment: true,
      meleeRange: true,
      ...p.autoGenerate,
    },
  } as unknown as Creature;
}

describe("checkWeaponSpeed", () => {
  it("assigns a default speed of 3 when the weapon has none", () => {
    const weapon = { file: "w1", header: {} } as Weapon;
    weaponService.checkWeaponSpeed(weapon);
    expect(weapon.header.speed).toBe(3);
  });

  it("leaves an already-set speed untouched", () => {
    const weapon = { file: "w1", header: { speed: 5 } } as Weapon;
    weaponService.checkWeaponSpeed(weapon);
    expect(weapon.header.speed).toBe(5);
  });
});

describe("checkEnchantment", () => {
  it("computes weapon enchantment from level via EnchantmentTable and flags it Magical", () => {
    const weapon = { file: "w1", header: { speed: 3 } } as Weapon;
    const creature = fakeCreature({
      data: { level1: { pnpValue: 10, value: 10, type: "none" } },
    });
    weaponService.checkEnchantment(creature, weapon);
    expect(weapon.enchantment).toBe(3); // level 10 exceeds the level:8/enchant:3 entry
    expect(weapon.flags).toContain(ItemFlagEnum.Magical);
  });

  it("matches the top enchantment entry exactly when level and bonusHp both match it", () => {
    const weapon = { file: "w1", header: { speed: 3 } } as Weapon;
    const creature = fakeCreature({
      data: {
        level1: { pnpValue: 10, value: 10, type: "none" },
        bonusHp: 4,
      },
    });
    weaponService.checkEnchantment(creature, weapon);
    expect(weapon.enchantment).toBe(4);
  });

  it("throws when no enchantment entry matches the level/bonusHp", () => {
    const weapon = { file: "w1", header: { speed: 3 } } as Weapon;
    const creature = fakeCreature({
      data: { level1: { pnpValue: 0, value: 0, type: "none" } },
    });
    expect(() => { weaponService.checkEnchantment(creature, weapon); }).toThrow(
      /enchantment not found in table/,
    );
  });

  it("does not compute enchantment when creature.autoGenerate.enchantment is false", () => {
    const weapon = { file: "w1", header: { speed: 3 } } as Weapon;
    const creature = fakeCreature({
      data: { level1: { pnpValue: 10, value: 10, type: "none" } },
      autoGenerate: { enchantment: false },
    });
    weaponService.checkEnchantment(creature, weapon);
    expect(weapon.enchantment).toBeUndefined();
  });

  it("does not recompute enchantment when the weapon already has one", () => {
    const weapon = {
      file: "w1",
      header: { speed: 3 },
      enchantment: 1,
    } as Weapon;
    const creature = fakeCreature({
      data: { level1: { pnpValue: 10, value: 10, type: "none" } },
    });
    weaponService.checkEnchantment(creature, weapon);
    expect(weapon.enchantment).toBe(1);
  });

  it("does not push a duplicate Magical flag when the weapon already has one", () => {
    const weapon = {
      file: "w1",
      header: { speed: 3 },
      flags: [ItemFlagEnum.Magical],
    } as Weapon;
    const creature = fakeCreature({
      data: { level1: { pnpValue: 10, value: 10, type: "none" } },
    });
    weaponService.checkEnchantment(creature, weapon);
    expect(weapon.flags).toEqual([ItemFlagEnum.Magical]);
  });

  it("uses the given level override instead of the creature's own level1 when provided", () => {
    const weapon = { file: "w1", header: { speed: 3 } } as Weapon;
    const creature = fakeCreature({
      data: { level1: { pnpValue: 10, value: 10, type: "none" } },
    });
    weaponService.checkEnchantment(creature, weapon, 5);
    expect(weapon.enchantment).toBe(1); // level 5 -> level:4/enchant:1, not the creature's own level:8/enchant:3
  });
});

describe("checkRange", () => {
  it("assigns melee range from CreatureSizeTable based on creature size", () => {
    const weapon = { file: "w1", header: { speed: 3 } } as Weapon;
    const creature = fakeCreature({ data: { size: "Large" } });
    weaponService.checkRange(creature, weapon);
    expect(weapon.header.range).toBe(2);
  });

  it("does nothing when creature.autoGenerate.meleeRange is false", () => {
    const weapon = { file: "w1", header: { speed: 3 } } as Weapon;
    const creature = fakeCreature({
      data: { size: "Large" },
      autoGenerate: { meleeRange: false },
    });
    weaponService.checkRange(creature, weapon);
    expect(weapon.header.range).toBeUndefined();
  });

  it("does not override an already-set range", () => {
    const weapon = { file: "w1", header: { speed: 3, range: 5 } } as Weapon;
    const creature = fakeCreature({ data: { size: "Large" } });
    weaponService.checkRange(creature, weapon);
    expect(weapon.header.range).toBe(5);
  });

  it("does not set a range when the weapon already has a projectile", () => {
    const weapon = {
      file: "w1",
      header: { speed: 3, projectile: "arrow01" },
    } as unknown as Weapon;
    const creature = fakeCreature({ data: { size: "Large" } });
    weaponService.checkRange(creature, weapon);
    expect(weapon.header.range).toBeUndefined();
  });
});

describe("checkWeapon", () => {
  it("runs the speed, enchantment, and range checks together", () => {
    const weapon = { file: "w1", header: {} } as Weapon;
    const creature = fakeCreature({
      data: {
        level1: { pnpValue: 10, value: 10, type: "none" },
        size: "Large",
      },
    });
    weaponService.checkWeapon(creature, weapon);
    expect(weapon.header.speed).toBe(3);
    expect(weapon.enchantment).toBe(3);
    expect(weapon.header.range).toBe(2);
  });
});
