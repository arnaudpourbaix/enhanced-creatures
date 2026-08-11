import { describe, expect, it } from "vitest";
import { Item, Spell, Weapon, WeaponCastSpell } from "../spell-item/spell-item";
import { PartialProjectile } from "../spell-item/projectile";
import { Creature } from "./creature";

interface CreatureProtectedMethods {
  spells: Spell[];
  attachSpellToWeapon(weapon: Weapon, cast: WeaponCastSpell): void;
}

function fakeCreature(): Creature {
  return new Creature(1);
}

describe("projectile", () => {
  it("throws when no projectile has the given id", () => {
    const creature = fakeCreature();
    expect(() => creature.projectile(99)).toThrow(/No projectile found with id 99/);
  });

  it("returns the projectile with the matching id", () => {
    const creature = fakeCreature();
    const proj = creature.addProjectile({ id: 1 } as unknown as PartialProjectile, "p1");
    expect(creature.projectile(1)).toBe(proj);
  });
});

describe("ability", () => {
  it("throws when the spell has no ability", () => {
    const creature = fakeCreature();
    creature.spells.push({ id: 5, file: "spl01" } as unknown as Spell);
    expect(() => creature.ability(5)).toThrow(/No ability found for spell id 5/);
  });

  it("returns the spell's ability when present", () => {
    const creature = fakeCreature();
    const ability = { name: "ability.test" };
    creature.spells.push({ id: 5, file: "spl01", ability } as unknown as Spell);
    expect(creature.ability(5)).toBe(ability);
  });
});

describe("addSpell", () => {
  it("throws when a spell with the same id is already defined", () => {
    const creature = fakeCreature();
    creature.spells.push({ id: 7, file: "spl01" } as unknown as Spell);
    expect(() => creature.addSpell({ id: 7, name: 12345 })).toThrow(/Spell id 7 already defined/);
  });
});

describe("addItem", () => {
  it("throws when an item with the same id is already defined", () => {
    const creature = fakeCreature();
    creature.items.push({ id: 3, file: "itm01" } as unknown as Item);
    expect(() => creature.addItem({ id: 3 })).toThrow(/Item id 3 already defined/);
  });
});

describe("attachSpellToWeapon (protected)", () => {
  function fakeWeapon(): Weapon {
    return {
      file: "wpn01",
      header: { effects: [] },
    } as unknown as Weapon;
  }

  it("attaches a CastSpell effect referencing an existing spell by file", () => {
    const creature = fakeCreature() as unknown as CreatureProtectedMethods;
    creature.spells.push({ file: "spl01" } as unknown as Spell);
    const weapon = fakeWeapon();
    creature.attachSpellToWeapon(weapon, { spell: "spl01" });
    expect(weapon.header.effects).toHaveLength(1);
    expect(weapon.header.effects[0].resource).toBe("spl01");
  });

  it("also attaches a RemoveSpell effect when remove is set", () => {
    const creature = fakeCreature() as unknown as CreatureProtectedMethods;
    creature.spells.push({ file: "spl01" } as unknown as Spell);
    const weapon = fakeWeapon();
    creature.attachSpellToWeapon(weapon, { spell: "spl01", remove: true });
    expect(weapon.header.effects).toHaveLength(2);
  });
});
