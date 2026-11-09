import { describe, expect, it, vi } from "vitest";
import { MonsterEnum } from "../../../creatures/monster";
import { GRAB_IMMUNE_CREATURES, HUGE_CREATURES, LARGE_CREATURES } from "../../../config/creatures";
import { Creature } from "../../model/creature/creature";
import { CreatureGrabConfig } from "../../model/creature/grab";
import { CastSpellEffect, Effect, ProtectionFromResourceEffect } from "../../model/spell-item/effect";
import {
  EffectCastSpellTypeEnum,
  EffectDamageTypeEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  SaveTypeEnum,
} from "../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { Spell, Weapon } from "../../model/spell-item/spell-item";
import logService from "../log.service";
import translationService from "../translation.service";
import grabService from "./grab.service";

interface GrabServicePrivate {
  getGrabImmuneEffects(creature: Creature): Effect[];
}
const service = grabService as unknown as GrabServicePrivate;

function fakeCreature(
  p: {
    strength?: number;
    size?: "Large" | "Huge" | "Medium";
  } = {},
): Creature & { traits: Effect[] } {
  const traits: Effect[] = [];
  return {
    id: MonsterEnum.WildDog,
    spells: [],
    effectFiles: [],
    traits,
    addTraitEffects: (effects: Effect[]) => traits.push(...effects),
    data: {
      immunities: [],
      strength: p.strength,
      size: p.size ? { value: p.size, tall: false, long: true } : undefined,
    },
  } as unknown as Creature & { traits: Effect[] };
}

function fakeWeapon(): Weapon {
  return { file: "w1", header: { effects: [] } } as unknown as Weapon;
}

function attach(
  grab: CreatureGrabConfig = {},
  p: Parameters<typeof fakeCreature>[0] = { strength: 10, size: "Medium" },
) {
  const weapon = fakeWeapon();
  const creature = fakeCreature(p);
  grabService.attachGrabToWeapon(creature, weapon, grab);
  const [check, hold, release, grip, letGo] = creature.spells;
  return { weapon, creature, check, hold, release, grip, letGo };
}

const effectsOf = (spell: Spell) => spell.headers[0].effects;
/** The race and class entries protected from the hold (op 318 against the hold itself). */
const immuneEntries = (spell: Spell) =>
  effectsOf(spell)
    .filter(
      (e): e is ProtectionFromResourceEffect =>
        e.opcode === EffectTypeEnum.ProtectionFromResource && typeof e.type === "object",
    )
    .map((e) => e.value);
const casts = (spell: Spell) =>
  effectsOf(spell).filter((e): e is CastSpellEffect => e.opcode === EffectTypeEnum.CastSpell);

describe("attachGrabToWeapon", () => {
  it("makes the weapon's hit cast the check, without a save of its own", () => {
    const { weapon, check } = attach();
    expect(weapon.header.effects).toHaveLength(1);
    const effect = weapon.header.effects[0] as CastSpellEffect;
    expect(effect.type).toBe(EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel);
    expect(effect.resource).toBe(check.file);
    expect(effect.saveTypes ?? []).toEqual([]);
    expect(check.xpAbility).toBe("specialAttack");
  });

  it("describes the grip's damage and what the grabber can still do", () => {
    const described = (grab: CreatureGrabConfig) =>
      translationService.from(attach(grab).check.description ?? 0);
    const strangle = {
      damagePerRound: { type: EffectDamageTypeEnum.Crushing, diceThrown: 2, diceSize: 8 },
    };
    expect(described({})).toContain(translationService.from("spell.grab.grabber"));
    expect(described({})).not.toContain("2d8");
    expect(described(strangle)).toContain(
      translationService.interpolate("spell.grab.damage", { damage: "2d8 crushing" }),
    );
    expect(described(strangle)).toContain(translationService.from("spell.grab.grabberNoAttack"));
    expect(described({ ...strangle, freeHand: true })).toContain(
      translationService.from("spell.grab.grabberFreeHand"),
    );
  });

  it("describes several grip damages, from the next round when the hit holds at once", () => {
    const { hold } = attach(
      {
        trigger: "probability",
        damagePerRound: [
          { type: EffectDamageTypeEnum.Crushing, diceThrown: 3, diceSize: 6 },
          { type: EffectDamageTypeEnum.Acid, diceThrown: 1, diceSize: 4 },
        ],
        addStrengthBonus: true,
      },
      { strength: 17, size: "Huge" },
    );
    expect(translationService.from(hold.description ?? 0)).toContain(
      translationService.interpolate("spell.grab.damageNextRound", {
        damage: "3d6+1 crushing + 1d4 acid",
      }),
    );
  });

  it("marks the weapon as grabbing", () => {
    expect(attach().weapon.grab).toBe(true);
  });

  it("creates the check, hold, release, grip and let-go spells", () => {
    const { creature, check, hold, release, grip, letGo } = attach();
    expect(creature.spells).toHaveLength(5);
    expect(casts(check)[0].resource).toBe(hold.file);
    // cast at the victim, so the hold's protections block it; its effects land on the grabber
    expect(casts(hold)).toContainEqual(
      expect.objectContaining({ resource: grip.file, target: EffectTargetEnum.PresetTarget }),
    );
    expect(effectsOf(grip).map((e) => e.target)).toEqual(
      effectsOf(grip).map(() => EffectTargetEnum.OriginalCaster),
    );
    expect(release.headers[0].effects[0]).toMatchObject({
      opcode: EffectTypeEnum.RemoveEffectsByResource,
      resource: hold.file,
    });
    expect(letGo.headers[0].effects[0]).toMatchObject({
      opcode: EffectTypeEnum.RemoveEffectsByResource,
      resource: grip.file,
    });
  });

  it("hides every grab spell's name from the combat log", () => {
    const { creature } = attach();
    expect(creature.spells.map((s) => s.hideName)).toEqual([true, true, true, true, true]);
  });

  it("never holds a held victim: every attack hits it already", () => {
    expect(effectsOf(attach().hold)).toContainEqual(
      expect.objectContaining({ opcode: EffectTypeEnum.ProtectionFromResource, type: "HELD" }),
    );
  });

  it("never holds a victim the grabbing hit killed: its grip would bind the grabber to a corpse", () => {
    expect(immuneEntries(attach().hold)).toContain("STATE_DEAD");
  });

  it("lets the grabber go when it kills, from its trait, never from the renewed hold", () => {
    const { creature, hold, letGo } = attach();
    expect(creature.traits).toContainEqual(
      expect.objectContaining({
        opcode: EffectTypeEnum.CastSpellOnCondition,
        condition: "Killed([ANYONE])",
        resource: letGo.file,
      }),
    );
    expect(effectsOf(hold).map((e) => e.opcode)).not.toContain(
      EffectTypeEnum.CastSpellOnCondition,
    );
  });

  it("computes the check's save from strength + size grab modifiers", () => {
    const { check } = attach({}, { strength: 19, size: "Large" });
    const cast = casts(check)[0];
    expect(cast.saveBonus).toBe(-7); // -(str hit:3 + size grabModifier:4)
    expect(cast.saveTypes).toEqual([SaveTypeEnum.ParalyzePoisonDeath]);
  });

  it("adds +4 to the negative save bonus when onlyGrabProneTarget is set", () => {
    const { check } = attach({ onlyGrabProneTarget: true }, { strength: 19, size: "Large" });
    expect(casts(check)[0].saveBonus).toBe(-11); // -(3 + 4 + 4)
  });

  it("uses an explicit grab.saveBonus and saveType instead of the computed ones", () => {
    const { check } = attach({ saveBonus: -2, saveType: SaveTypeEnum.Breath });
    expect(casts(check)[0].saveBonus).toBe(-2);
    expect(casts(check)[0].saveTypes).toEqual([SaveTypeEnum.Breath]);
  });

  it("holds at once on a probability-only trigger, but the check still saves", () => {
    const { weapon, check, hold } = attach({ trigger: "probability", probability: 5 });
    expect(weapon.header.effects[1]).toMatchObject({ resource: hold.file, probability1: 5 });
    expect(hold.xpAbility).toBe("specialAttack");
    expect(check.xpAbility).toBeUndefined();
    expect(casts(check)[0].saveTypes).toHaveLength(1);
  });

  it("says Grabbed once, before the hold on the same roll, never on a victim held or grabbed", () => {
    const { weapon, creature } = attach({ trigger: "probability", probability: 5 });
    const seize = creature.spells[5];
    expect(weapon.header.effects[0]).toMatchObject({ resource: seize.file, probability1: 5 });
    expect(seize.hideName).toBe(true);
    const effects = effectsOf(seize);
    expect(effects.at(-1)?.opcode).toBe(EffectTypeEnum.DisplayString);
    expect(effects).toContainEqual(
      expect.objectContaining({ opcode: EffectTypeEnum.ProtectionFromResource, type: "HELD" }),
    );
    expect(immuneEntries(seize)).toContain("JA_GRAPPLED");
    expect(immuneEntries(seize)).toEqual(expect.arrayContaining(immuneEntries(attach().hold)));
    // a check's save could still fail the grab: nothing said on its hit
    expect(attach().creature.spells).toHaveLength(5);
  });

  it("holds past the next check, removing the previous round first, then casts the check a round later", () => {
    const { hold, check } = attach();
    const effects = effectsOf(hold);
    expect(effects[0]).toMatchObject({
      opcode: EffectTypeEnum.RemoveEffectsByResource,
      resource: hold.file,
    });
    expect(effects.every((e) => !e.saveTypes?.length)).toBe(true);
    const next = casts(hold).find((e) => e.resource === check.file);
    expect(next).toMatchObject({
      timing: EffectTimingEnum.DelayPermanent,
      duration: 6,
    });
    // the round's hold overlaps the next check's, so the victim can't walk free in between
    expect(effects).toContainEqual(
      expect.objectContaining({ opcode: EffectTypeEnum.MovementRateBonus2, duration: 7 }),
    );
    expect(effects.map((e) => e.opcode)).not.toContain(EffectTypeEnum.ProtectionFromSpell);
  });

  it("stops the grabber from moving, and from attacking only when the grip deals damage", () => {
    const onGrabber = (spell: Spell) => effectsOf(spell).map((e) => e.opcode);
    const plain = attach().grip;
    expect(onGrabber(plain)).toContain(EffectTypeEnum.MovementRateBonus2);
    expect(onGrabber(plain)).not.toContain(EffectTypeEnum.ModifyAttacksPerRound);

    const strangle = attach({
      damagePerRound: { type: EffectDamageTypeEnum.Crushing, diceThrown: 2, diceSize: 8 },
    }).grip;
    expect(onGrabber(strangle)).toContain(EffectTypeEnum.ModifyAttacksPerRound);

    const oneHand = attach({
      damagePerRound: { type: EffectDamageTypeEnum.Crushing, diceThrown: 2, diceSize: 8 },
      freeHand: true,
    }).grip;
    expect(onGrabber(oneHand)).toContain(EffectTypeEnum.MovementRateBonus2);
    expect(onGrabber(oneHand)).not.toContain(EffectTypeEnum.ModifyAttacksPerRound);
  });

  it("deals the grip's damage in the check, sharing the hold's save, never in the hold", () => {
    const damages = (spell: Spell) =>
      effectsOf(spell).filter((e) => e.opcode === EffectTypeEnum.Damage);
    const plain = attach();
    expect(damages(plain.check)).toEqual([]);

    const { check, hold } = attach(
      {
        damagePerRound: [
          { type: EffectDamageTypeEnum.Crushing, diceThrown: 3, diceSize: 6 },
          { type: EffectDamageTypeEnum.Acid, diceThrown: 1, diceSize: 4 },
        ],
      },
      { strength: 17, size: "Huge" },
    );
    expect(damages(hold)).toEqual([]);
    const save = { saveTypes: casts(check)[0].saveTypes, saveBonus: casts(check)[0].saveBonus };
    expect(damages(check)).toEqual([
      expect.objectContaining({
        type: EffectDamageTypeEnum.Crushing,
        diceThrown: 3,
        diceSize: 6,
        ...save,
      }),
      expect.objectContaining({ type: EffectDamageTypeEnum.Acid, diceThrown: 1, ...save }),
    ]);
    expect(damages(check)[0].amount ?? 0).toBe(0);
  });

  it("adds the grabber's Strength damage bonus to the grip's first damage when asked", () => {
    const { check } = attach(
      {
        damagePerRound: [
          { type: EffectDamageTypeEnum.Crushing, diceThrown: 3, diceSize: 6 },
          { type: EffectDamageTypeEnum.Acid, diceThrown: 1, diceSize: 4 },
        ],
        addStrengthBonus: true,
      },
      { strength: 17, size: "Huge" },
    );
    const damages = effectsOf(check).filter((e) => e.opcode === EffectTypeEnum.Damage);
    expect(damages.map((e) => e.amount ?? 0)).toEqual([1, 0]);
  });

  it("releases on the grabber's death", () => {
    const { creature, release } = attach();
    expect(creature.traits).toContainEqual(
      expect.objectContaining({
        opcode: EffectTypeEnum.CastSpellOnCondition,
        condition: "Die()",
        resource: release.file,
      }),
    );
  });

  it("always includes the base grab-immune creature list regardless of size", () => {
    const { hold } = attach();
    const entries = immuneEntries(hold);
    for (const [, entry] of GRAB_IMMUNE_CREATURES) {
      expect(entries).toContain(entry);
    }
    expect(entries).not.toContain("GIANT"); // HUGE_CREATURES, not added without a size
    // protected from the hold itself, no EFF file
    expect(hold.effectFiles).toEqual([]);
  });

  it("adds HUGE_CREATURES immunities for a Huge creature but not LARGE_CREATURES", () => {
    const { hold } = attach({}, { strength: 10, size: "Huge" });
    const entries = immuneEntries(hold);
    for (const [, entry] of HUGE_CREATURES) {
      expect(entries).toContain(entry);
    }
    for (const [, entry] of LARGE_CREATURES) {
      expect(entries).not.toContain(entry);
    }
  });

  it("adds both HUGE_CREATURES and LARGE_CREATURES immunities for a Large creature", () => {
    const { hold } = attach({}, { strength: 10, size: "Large" });
    const entries = immuneEntries(hold);
    for (const [, entry] of [...HUGE_CREATURES, ...LARGE_CREATURES]) {
      expect(entries).toContain(entry);
    }
  });

  it("getGrabImmuneEffects (private) skips the size-based extras and warns when the creature has no size", () => {
    const creature = fakeCreature({ strength: 10 });
    const consoleSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    const effects = service.getGrabImmuneEffects(creature);
    expect(consoleSpy).toHaveBeenCalled();
    expect(effects).toHaveLength(GRAB_IMMUNE_CREATURES.length);
    consoleSpy.mockRestore();
  });
});
