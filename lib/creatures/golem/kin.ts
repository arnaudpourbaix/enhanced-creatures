import { MonsterItemIconEnum } from "../../config/item";
import { SPELLS } from "../../config/spells/spell-database";
import { createConeOfCold } from "../../spells/cone_of_cold";
import { CommonProjectileFiles } from "../../spells/projectiles";
import effectFactory from "../../src/factories/effect.factory";
import { Creature } from "../../src/model/creature/creature";
import { Durations } from "../../src/model/game-data/durations";
import { Effect } from "../../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  EffectCastSpellTypeEnum,
  EffectDamageTypeEnum,
  EffectHasteTypeEnum,
  EffectIDSFileEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityFlagEnum,
  ItemAbilityLocationEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  LightingEffectTargetEnum,
  PortraitIconEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { AreaProjectileEnum, ParticleColorEnum } from "../../src/model/spell-item/projectile";
import { WeaponCastSpell } from "../../src/model/spell-item/spell-item";
import { StringRefUtils } from "../../src/services/utils/string-ref.utils";
import { CreatureKin } from "../../src/model/creature/kin";
import { KinEnum } from "../kin";

export enum GolemIds {
  Charge,
  CloudOfPoisonousGas,
  ConeOfCold,
  Haste,
  HideousLaugh,
  WildMagicFlare,
}

export const BAF_CONTINUE = "Continue()";

export class Golem extends Creature {
  createFists({
    diceThrown,
    diceSize,
    damageType,
    castSpell,
    effects,
  }: {
    diceThrown: number;
    diceSize: number;
    damageType?: AbilityDamageTypeEnum;
    castSpell?: WeaponCastSpell;
    effects?: Effect[];
  }) {
    return this.addNaturalWeapon("fists", {
      diceThrown,
      diceSize,
      damageType,
      effects,
      stringRef: "monster.golem.weapon.fists",
      speed: 4,
      castSpells: castSpell ? [castSpell] : undefined,
    });
  }

  createMagicalBlast() {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.golem.weapon.magicalBlast",
        icon: MonsterItemIconEnum.FireElemental,
        equippedSlot: ["WEAPON1"],
        header: {
          range: 50,
          diceThrown: 0,
          diceSize: 0,
          damageType: AbilityDamageTypeEnum.Missile,
          type: ItemAbilityTypeEnum.Ranged,
          speed: 4,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
          projectile: "SPBEHBLA",
          effects: [
            {
              opcode: EffectTypeEnum.Damage,
              type: EffectDamageTypeEnum.Magic,
              diceThrown: 3,
              diceSize: 10,
            },
            {
              opcode: EffectTypeEnum.LightingEffects,
              effect: LightingEffectEnum.AlterationAir,
              lightingTarget: LightingEffectTargetEnum.SpellTarget,
            },
          ],
        },
      },
    });
  }

  /**
   * Wild Magic Flare
   */
  createWildMagicFlare() {
    // TODO:
    // cast as a 16th level
    // 20% Magical blast
    // 10% Chain lightning
    // 10% Dispel magic
    // 10% Fire shield
    // 10% Color spray in a 360' radius
    // 20% Fireball centered on golem
    // 10% Time stop
    // 10% Earthquake
    return this.addSpell({
      name: "monster.golem.ability.wildMagicFlare.name",
      description: "monster.golem.ability.wildMagicFlare.description",
      id: GolemIds.WildMagicFlare,
      memorizedCount: 1,
      icon: SPELLS.Wizard.NahalRecklessDweomer.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          projectile: {
            copyFromFile: "GOLCLOUD",
            name: "Golem poison cloud",
            particleColor: ParticleColorEnum.Green,
            areaEffectInfo: {
              areaProjectileFlags: [AreaProjectileEnum.AffectOnlyEnemies],
              explosionDelay: 12,
              triggerCount: 10, // 6 or 10
              triggerRadius: 128,
              areaOfEffect: 128, //  10-foot cube
            },
          },
          speed: 1,
          effects: [],
        },
      ],
      ability: {
        targets: [{ name: "NearestEnemies", limit: 3 }],
        range: 10,
        spell: {
          type: "reallyForce",
          castOnSelf: true,
          remove: true,
        },
      },
    });
  }

  /**
   * Haste
   */
  createHaste() {
    return this.addSpell({
      name: "monster.golem.ability.haste",
      id: GolemIds.Haste,
      memorizedCount: 1,
      castingSound: "CAS_P04",
      icon: SPELLS.Wizard.Haste.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.RemoveSpellTypeProtections,
              maximumLevel: 9,
              type: "K1#SLOW",
              timing: EffectTimingEnum.InstantLimited,
              duration: 3 * Durations.round,
            },
            {
              opcode: EffectTypeEnum.Haste,
              type: EffectHasteTypeEnum.NormalHaste,
              timing: EffectTimingEnum.InstantLimited,
              duration: 3 * Durations.round,
            },
            {
              opcode: EffectTypeEnum.DisplayPortraitIcon,
              icon: PortraitIconEnum.Haste,
              timing: EffectTimingEnum.InstantLimited,
              duration: 3 * Durations.round,
            },
            {
              opcode: EffectTypeEnum.LightingEffects,
              effect: LightingEffectEnum.AlterationAir,
              lightingTarget: LightingEffectTargetEnum.SpellTarget,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.CreatureRGBColorFade,
              color: {
                red: 60,
                green: 60,
                blue: 120,
              },
              fadeSpeed: 25,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: StringRefUtils.getStringId("Hasted"),
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              resource: "EFF_M28",
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              timing: EffectTimingEnum.DelayPermanent,
              duration: 3 * Durations.round,
              resource: "EFF_M29",
            },
          ],
        },
      ],
      ability: {
        spell: {
          type: "reallyForce",
          excludeStateChecks: ["STATE_HASTED"],
          castOnSelf: true,
          remove: true,
        },
        triggers: [{ name: "Delay", params: [6] }],
      },
    });
  }

  /**
   * Hideous Laugh
   */
  createHideousLaugh() {
    return this.addSpell({
      name: "monster.golem.ability.hideousLaugh",
      id: GolemIds.HideousLaugh,
      memorizedCount: 1,
      icon: SPELLS.Priest.CloakOfFear.file,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      options: { renew: 3 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          speed: 1,
          projectile: CommonProjectileFiles.AreaOfSightNonParty,
          range: 30,
          effects: effectFactory.fear({
            duration: 7 * Durations.round,
            saveType: SaveTypeEnum.Spell,
          }),
        },
      ],
      ability: {
        preset: SPELLS.Priest.CloakOfFear.file,
        spell: {
          type: "force",
          remove: true,
        },
      },
    });
  }

  /**
   * Charge
   */
  createCharge() {
    //TODO: this is a poor implementation of a charge
    // Anyone caught in the path of a juggernaut charge is run over by the thundering behemoth,
    // though the juggernaut must make a normal attack roll if the victim can avoid the charge.
    // A hit indicates that the victim is crushed, suffering 10d10 points of damage
    const attack = this.createFists({
      diceSize: 10,
      diceThrown: 10,
      damageType: AbilityDamageTypeEnum.Crushing,
    });
    const duration = 3 * Durations.round;
    const peakCharge = this.addSpell({
      name: "monster.golem.ability.charge.peakSpeed",
      icon: SPELLS.Wizard.Haste.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          speed: 1,
          effects: [
            {
              ...effectFactory.naturalMovementSpeed(12),
              duration,
            },
            {
              opcode: EffectTypeEnum.CreateWeapon,
              amount: 1,
              resource: attack.file,
              target: EffectTargetEnum.Self,
              duration,
            },
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: "monster.golem.ability.charge.end",
              timing: EffectTimingEnum.DelayPermanent,
              duration,
            },
          ],
        },
      ],
    });
    return this.addSpell({
      name: "monster.golem.ability.charge.name",
      description: "monster.golem.ability.charge.description",
      id: GolemIds.Charge,
      memorizedCount: 1,
      icon: SPELLS.Wizard.Haste.file,
      options: { renew: 6 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          speed: 1,
          effects: [
            {
              ...effectFactory.naturalMovementSpeed(6),
              timing: EffectTimingEnum.InstantLimited,
              duration: Durations.round,
            },
            {
              ...effectFactory.naturalMovementSpeed(9),
              timing: EffectTimingEnum.DelayLimited,
              duration: Durations.round,
            },
            {
              opcode: EffectTypeEnum.CastSpell,
              type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
              timing: EffectTimingEnum.DelayPermanent,
              duration: 2 * Durations.round,
              resource: peakCharge.file,
            },
          ],
        },
      ],
      ability: {
        spell: {
          type: "force",
          castOnSelf: true,
          remove: true,
        },
        triggers: [{ name: "Range", params: ["NearestEnemyOf", 5], negation: true }],
      },
    });
  }

  /**
   * Cloud of poisonous gas
   */
  createCloudOfPoisonousGas() {
    return this.addSpell({
      name: "monster.golem.ability.cloudOfPoisonousGas.name",
      description: "monster.golem.ability.cloudOfPoisonousGas.description",
      id: GolemIds.CloudOfPoisonousGas,
      memorizedCount: 1,
      icon: SPELLS.Wizard.Cloudkill.file,
      options: { renew: 7 },
      keywords: ["cloud", "poison", "area"],
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.Caster,
          projectile: {
            copyFromFile: "GOLCLOUD",
            name: "Golem poison cloud",
            particleColor: ParticleColorEnum.Green,
            areaEffectInfo: {
              areaProjectileFlags: [AreaProjectileEnum.AffectOnlyEnemies],
              explosionDelay: 12,
              triggerCount: 10, // 6 or 10
              triggerRadius: 128,
              areaOfEffect: 128, //  10-foot cube
            },
          },
          speed: 1,
          effects: [
            {
              opcode: EffectTypeEnum.UseEFFFile,
              idsFile: EffectIDSFileEnum.GENERAL,
              idsEntry: "UNDEAD",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
              type: "POISON_IMMUNITY",
              timing: EffectTimingEnum.InstantLimited,
              duration: 1,
            },
            {
              opcode: EffectTypeEnum.Damage,
              type: EffectDamageTypeEnum.Poison,
              diceThrown: 1,
              diceSize: 10,
              saveTypes: [SaveTypeEnum.BypassMirrorImage],
            },
            {
              opcode: EffectTypeEnum.Slay,
              idsFile: EffectIDSFileEnum.EA,
              idsEntry: "ANYONE",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              maxLevel: 4,
            },
            {
              opcode: EffectTypeEnum.Slay,
              idsFile: EffectIDSFileEnum.EA,
              idsEntry: "ANYONE",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              minLevel: 5,
              maxLevel: 6,
              saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
              saveBonus: -4,
            },
          ],
        },
      ],
      ability: {
        targets: [{ name: "NearestEnemies", limit: 3 }],
        range: 10,
        spell: {
          type: "reallyForce",
          castOnSelf: true,
          remove: true,
        },
      },
    });
  }

  /**
   * Cone of cold
   */
  createConeOfCold() {
    // Snow golems are able to breathe a cone of cold once every five rounds.
    // This functions as if the spell of that name were being cast by a 10th level wizard.
    return this.addSpell(
      createConeOfCold({
        id: GolemIds.ConeOfCold,
        description: "monster.golem.ability.coneOfCold",
        memorizedCount: 1,
        options: { renew: 5 },
        headers: [
          {
            minLevel: 1,
            damage: {
              diceThrown: 10,
              diceSize: 4,
              amount: 10,
            },
          },
          {
            minLevel: 18,
            damage: {
              diceThrown: 15,
              diceSize: 4,
              amount: 15,
            },
          },
        ],
      }),
    );
  }
}

export class GolemKin extends CreatureKin {
  constructor() {
    super(KinEnum.Golem);
  }
}

export const createGolemKin = () => new GolemKin();
