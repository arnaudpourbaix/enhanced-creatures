import { describe, expect, it, vi } from "vitest";
import { MonsterEnum } from "../../../creatures/monster";
import { GRAB_IMMUNE_CREATURES, HUGE_CREATURES, LARGE_CREATURES } from "../../../config/creatures";
import { Creature } from "../../model/creature/creature";
import { CreatureGrabConfig } from "../../model/creature/grab";
import { CastSpellEffect, Effect, IdsEffect } from "../../model/spell-item/effect";
import { EffectCastSpellTypeEnum, SaveTypeEnum } from "../../model/spell-item/effect.enums";
import { Weapon } from "../../model/spell-item/spell-item";
import logService from "../log.service";
import grabService from "./grab.service";

interface GrabServicePrivate {
  getGrabbedEffects(creature: Creature, grab: CreatureGrabConfig, file: string): Effect[];
  getGrabImmuneEffects(creature: Creature, file: string): Effect[];
}
const service = grabService as unknown as GrabServicePrivate;

function fakeCreature(
  p: {
    strength?: number;
    size?: "Large" | "Huge" | "Medium";
  } = {},
): Creature {
  return {
    id: MonsterEnum.WildDog,
    spells: [],
    effectFiles: [],
    data: { immunities: [], strength: p.strength, size: p.size },
  } as unknown as Creature;
}

function fakeWeapon(): Weapon {
  return { file: "w1", header: { effects: [] } } as unknown as Weapon;
}

describe("attachGrabToWeapon", () => {
  it("computes saveBonus from strength + size grab modifiers and attaches a CastSpell effect", () => {
    const weapon = fakeWeapon();
    const creature = fakeCreature({ strength: 19, size: "Large" });
    grabService.attachGrabToWeapon(creature, weapon, {});
    expect(weapon.header.effects).toHaveLength(1);
    const effect = weapon.header.effects[0] as CastSpellEffect;
    expect(effect.type).toBe(EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel);
    expect(effect.saveBonus).toBe(-7); // -(str hit:3 + size grabModifier:4)
    expect(effect.saveTypes).toEqual([SaveTypeEnum.ParalyzePoisonDeath]);
  });

  it("adds +4 to the negative save bonus when onlyGrabProneTarget is set", () => {
    const weapon = fakeWeapon();
    const creature = fakeCreature({ strength: 19, size: "Large" });
    grabService.attachGrabToWeapon(creature, weapon, {
      onlyGrabProneTarget: true,
    });
    expect(weapon.header.effects[0].saveBonus).toBe(-11); // -(3 + 4 + 4)
  });

  it("uses an explicit grab.saveBonus instead of the computed one", () => {
    const weapon = fakeWeapon();
    const creature = fakeCreature({ strength: 19, size: "Large" });
    grabService.attachGrabToWeapon(creature, weapon, { saveBonus: -2 });
    expect(weapon.header.effects[0].saveBonus).toBe(-2);
  });

  it("creates a spell on the creature and an effect file protecting it", () => {
    const weapon = fakeWeapon();
    const creature = fakeCreature({ strength: 10, size: "Medium" });
    grabService.attachGrabToWeapon(creature, weapon, {});
    expect(creature.spells).toHaveLength(1);
    expect(creature.effectFiles).toHaveLength(1);
    expect(weapon.header.effects[0].resource).toBe(creature.spells[0].file);
  });

  it("always includes the base grab-immune creature list regardless of size", () => {
    const weapon = fakeWeapon();
    const creature = fakeCreature({ strength: 10, size: "Medium" });
    grabService.attachGrabToWeapon(creature, weapon, {});
    const spell = creature.spells[0];
    const idsEffects = spell.headers[0].effects.filter((e): e is IdsEffect => "idsEntry" in e);
    const entries = idsEffects.map((e) => e.idsEntry);
    for (const [, entry] of GRAB_IMMUNE_CREATURES) {
      expect(entries).toContain(entry);
    }
    expect(entries).not.toContain("GIANT"); // HUGE_CREATURES, not added without a size
  });

  it("adds HUGE_CREATURES immunities for a Huge creature but not LARGE_CREATURES", () => {
    const weapon = fakeWeapon();
    const creature = fakeCreature({ strength: 10, size: "Huge" });
    grabService.attachGrabToWeapon(creature, weapon, {});
    const spell = creature.spells[0];
    const idsEffects = spell.headers[0].effects.filter((e): e is IdsEffect => "idsEntry" in e);
    const entries = idsEffects.map((e) => e.idsEntry);
    for (const [, entry] of HUGE_CREATURES) {
      expect(entries).toContain(entry);
    }
    for (const [, entry] of LARGE_CREATURES) {
      expect(entries).not.toContain(entry);
    }
  });

  it("adds both HUGE_CREATURES and LARGE_CREATURES immunities for a Large creature", () => {
    const weapon = fakeWeapon();
    const creature = fakeCreature({ strength: 10, size: "Large" });
    grabService.attachGrabToWeapon(creature, weapon, {});
    const spell = creature.spells[0];
    const idsEffects = spell.headers[0].effects.filter((e): e is IdsEffect => "idsEntry" in e);
    const entries = idsEffects.map((e) => e.idsEntry);
    for (const [, entry] of [...HUGE_CREATURES, ...LARGE_CREATURES]) {
      expect(entries).toContain(entry);
    }
  });

  it("uses an explicit grab.saveType instead of the default", () => {
    const weapon = fakeWeapon();
    const creature = fakeCreature({ strength: 10, size: "Medium" });
    grabService.attachGrabToWeapon(creature, weapon, {
      saveType: SaveTypeEnum.Breath,
    });
    expect(weapon.header.effects[0].saveTypes).toEqual([SaveTypeEnum.Breath]);
  });

  it("getGrabbedEffects (private) falls back to GRAB_DEFAULT_CONFIG.rounds when grab.rounds is unset", () => {
    const creature = fakeCreature({ strength: 10, size: "Medium" });
    const effects = service.getGrabbedEffects(creature, {}, "spellfile");
    const setState = effects.find((e) => "state" in e && "duration" in e);
    if (!setState || !("duration" in setState)) throw new Error("no SetState effect found");
    expect(setState.duration).toBeGreaterThan(0);
  });

  it("getGrabImmuneEffects (private) skips the size-based extras and warns when the creature has no size", () => {
    const creature = fakeCreature({ strength: 10 });
    const consoleSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    const effects = service.getGrabImmuneEffects(creature, "spellfile");
    expect(consoleSpy).toHaveBeenCalled();
    expect(effects).toHaveLength(GRAB_IMMUNE_CREATURES.length);
    consoleSpy.mockRestore();
  });
});
