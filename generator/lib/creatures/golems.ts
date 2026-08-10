import { MonsterItemIconEnum } from "../config/item";
import { SPELLS } from "../config/spells/spell-names";
import { createConeOfCold } from "../spells/cone_of_cold";
import { CommonProjectileFiles } from "../spells/projectiles";
import effectFactory from "../src/factories/effect.factory";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import { Durations } from "../src/model/game-data/durations";
import {
  AbilityDamageTypeEnum,
  EffectDamageTypeEnum,
  EffectHasteTypeEnum,
  EffectIDSFileEnum,
  EffectStatisticModifierEnum,
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
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { AreaProjectileEnum, ParticleColorEnum } from "../src/model/spell-item/projectile";
import { WeaponCastSpell } from "../src/model/spell-item/spell-item";
import { StringRefUtils } from "../src/services/utils/string-ref.utils";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {
  Charge,
  CloudOfPoisonousGas,
  ConeOfCold,
  Haste,
  HideousLaugh,
}

class Golem extends Creature {
  createFists(
    diceThrown: number,
    diceSize: number,
    damageType: AbilityDamageTypeEnum,
    castSpell?: WeaponCastSpell,
  ) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.golem.weapon.fists",
        icon: MonsterItemIconEnum.Fist,
        equippedSlot: ["WEAPON1"],
        header: {
          diceThrown,
          diceSize,
          damageType,
          type: ItemAbilityTypeEnum.Melee,
          speed: 4,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
      castSpells: castSpell ? [castSpell] : undefined,
    });
  }

  /**
   * Haste
   */
  createHaste() {
    return this.addSpell({
      name: "monster.golem.ability.haste",
      id: Ids.Haste,
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
          selfTarget: true,
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
      id: Ids.HideousLaugh,
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
    //TODO: this is a very basic idea of charge, many improvements can be done but since this golem is only used once by a mod, it is a low priority.
    // Anyone caught in the path of a juggernaut charge is run over by the thundering behemoth, though the juggernaut must make a normal attack roll if the victim can avoid the charge.
    // A hit indicates that the victim is crushed, suffering 10d10 points of damage
    // Should be like this:
    // 1. Choose a target, activate charge
    // 2. Run to target (no attack)
    // 3. Once within 5 range, switch to a new weapon that does 10d10 crushing damage then end charge
    // If target can't be reached within a reasonable amount of time, it can end charge and pick another target.
    // To make a better movement implementation: create several boots items and create/remove them (this is especially important for ending charge)
    return this.addSpell({
      name: "monster.golem.ability.charge.name",
      description: "monster.golem.ability.charge.description",
      id: Ids.Charge,
      memorizedCount: 1,
      icon: SPELLS.Wizard.Haste.file,
      options: { renew: 5 },
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
              ...effectFactory.naturalMovementSpeed(12),
              timing: EffectTimingEnum.DelayLimited,
              duration: 2 * Durations.round,
            },
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: "monster.golem.ability.charge.end",
              timing: EffectTimingEnum.DelayPermanent,
              duration: 4 * Durations.round,
            },
          ],
        },
      ],
      ability: {
        spell: {
          type: "reallyForce",
          selfTarget: true,
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
      id: Ids.CloudOfPoisonousGas,
      memorizedCount: 1,
      icon: SPELLS.Wizard.Cloudkill.file,
      options: { renew: 7 },
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
          selfTarget: true,
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
        id: Ids.ConeOfCold,
        description: "monster.golem.ability.coneOfCold",
        memorizedCount: 1,
        options: { renew: 5 },
        damage: {
          diceThrown: 10,
          diceSize: 4,
          amount: 10,
        },
      }),
    );
  }
}

class GolemFamily extends CreatureFamily<Golem> {
  constructor() {
    super(MonsterFamilyEnum.Golem);
    this.addCreature(() => this.flesh());
    this.addCreature(() => this.clay());
    this.addCreature(() => this.stone());
    this.addCreature(() => this.iron());
    this.addCreature(() => this.bone());
    this.addCreature(() => this.juggernaut());
    this.addCreature(() => this.snow());
  }

  createCreature(id: MonsterEnum): Golem {
    return new Golem(id);
  }

  /**
   * Flesh Golem
   */
  private flesh() {
    const flesh = this.create({
      monster: MonsterEnum.FleshGolem,
      name: "monster.golem.name.flesh",
      files: [],
      data: {
        level1: 9,
        bonusHp: 0,
        strength: 19,
        dexterity: 9,
        constitution: 18,
        intelligence: 3,
        wisdom: 10,
        charisma: 5,
        ac: 9,
        apr: 2,
        xpv: 2000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_FLESH",
        gender: "NIETHER",
        size: "Large",
        modAnimation: "A7!GOLEM_FLESH_PST",
        movement: 8,
        immunities: ["construct"],
        items: {
          remove: ["GOLFLE"],
        },
      },
    });
    flesh.addTrait({
      immunities: ["magic", "fire", "cold"],
      effects: [
        {
          opcode: EffectTypeEnum.ElectricityResistanceModifier,
          value: 125,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    flesh.createFists(2, 8, AbilityDamageTypeEnum.Crushing);
    flesh.setBehavior({
      restHeal: true,
    });
    return flesh;
  }

  /**
   * Clay Golem
   */
  private clay() {
    const clay = this.create({
      monster: MonsterEnum.ClayGolem,
      name: "monster.golem.name.clay",
      files: [],
      data: {
        level1: 11,
        bonusHp: 0,
        strength: 20,
        dexterity: 9,
        constitution: 18,
        intelligence: 3,
        wisdom: 8,
        charisma: 1,
        ac: 7,
        apr: 1,
        xpv: 5000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_CLAY",
        gender: "NIETHER",
        size: "Large",
        movement: 7,
        immunities: ["construct"],
        items: {
          remove: ["GOLCLA", "RING95", "IMMUNE1"],
        },
        script: {
          remove: ["GOLCLY01", "BPFHT"],
        },
      },
    });
    clay.addTrait({
      immunities: [
        "magic",
        "nonMagicalWeapons",
        "slashingDamage",
        "piercingDamage",
        "missileDamage",
      ],
    });
    clay.createHaste();
    clay.createFists(3, 10, AbilityDamageTypeEnum.Crushing);
    clay.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.Haste)],
    });
    return clay;
  }

  /**
   * Stone Golem
   */
  private stone() {
    const stone = this.create({
      monster: MonsterEnum.StoneGolem,
      name: "monster.golem.name.stone",
      files: [],
      data: {
        level1: 14,
        bonusHp: 0,
        strength: 22,
        dexterity: 9,
        constitution: 20,
        intelligence: 3,
        wisdom: 11,
        charisma: 1,
        ac: 5,
        apr: 1,
        xpv: 8000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_STONE",
        gender: "NIETHER",
        size: "Large",
        movement: 6,
        immunities: ["construct"],
        items: {
          remove: ["GOLSTO", "GOLSTONE", "IMMUNE2"],
        },
        script: {
          remove: ["GOLSTO01"],
        },
        spells: {
          memorized: [{ file: SPELLS.Wizard.Slow.file, memorizedCount: 1 }],
        },
      },
    });
    stone.addTrait({
      immunities: ["magic", "plusOneWeapons"],
    });
    stone.createFists(3, 8, AbilityDamageTypeEnum.Crushing);
    stone.setBehavior({
      restHeal: true,
      abilities: [
        {
          preset: SPELLS.Wizard.Slow.file,
          spell: {
            type: "reallyForce",
            selfTarget: true,
            remove: true,
          },
          requireVocal: false,
          range: 10,
          timer: { name: "Slow", value: 12 },
        },
      ],
    });
    return stone;
  }

  /**
   * Iron Golem
   */
  private iron() {
    const iron = this.create({
      monster: MonsterEnum.IronGolem,
      name: "monster.golem.name.iron",
      files: [],
      data: {
        level1: 18,
        strength: 24,
        dexterity: 9,
        constitution: 20,
        intelligence: 3,
        wisdom: 11,
        charisma: 1,
        ac: 3,
        apr: 1,
        xpv: 13000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_IRON",
        gender: "NIETHER",
        size: "Large",
        movement: 6,
        immunities: ["construct"],
        items: {
          remove: ["GOLIRO", "IRONGOL", "IMMUNE3"],
        },
      },
    });
    iron.addTrait({
      immunities: ["magic", "plusTwoWeapons", "lightning"],
      effects: [
        {
          opcode: EffectTypeEnum.FireResistanceModifier,
          value: 125,
          type: EffectStatisticModifierEnum.Set,
        },
        {
          opcode: EffectTypeEnum.MagicalFireResistanceModifier,
          value: 125,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    iron.createCloudOfPoisonousGas();
    iron.createFists(4, 10, AbilityDamageTypeEnum.Crushing);
    iron.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.CloudOfPoisonousGas)],
    });
    return iron;
  }

  /**
   * Bone Golem
   */
  private bone() {
    const bone = this.create({
      monster: MonsterEnum.BoneGolem,
      name: "monster.golem.name.bone",
      files: [],
      data: {
        level1: 14,
        bonusHp: 0,
        strength: 17,
        dexterity: 13,
        constitution: 16,
        intelligence: 3,
        wisdom: 8,
        charisma: 1,
        ac: 0,
        apr: 1,
        xpv: 18000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_STONE",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
        immunities: ["construct", "skeletal"],
        items: {
          remove: ["S3-8M3", "GOLCLA", "IMMUNE2", "HELMNOAN"],
        },
      },
    });
    bone.addTrait({
      immunities: ["magic", "fire", "cold"],
      effects: [
        {
          opcode: EffectTypeEnum.ElectricityResistanceModifier,
          value: 125,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    bone.createHideousLaugh();
    bone.createFists(3, 8, AbilityDamageTypeEnum.Slashing);
    bone.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.HideousLaugh)],
    });
    return bone;
  }

  /**
   * Juggernaut Golem
   */
  private juggernaut() {
    const juggernaut = this.create({
      monster: MonsterEnum.JuggernautGolem,
      name: "monster.golem.name.juggernaut",
      files: [],
      data: {
        level1: 18,
        strength: 22,
        dexterity: 9,
        constitution: 20,
        intelligence: 3,
        wisdom: 11,
        charisma: 1,
        ac: 2,
        apr: 2,
        xpv: 11000,
        alignment: "NEUTRAL",
        morale: 16,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_STONE",
        gender: "NIETHER",
        size: "Large",
        animation: "GOLEM_CLAY",
        movement: 3,
        immunities: ["construct"],
        items: {
          remove: ["IRONGOL"],
        },
        script: {
          remove: ["GOLSTO01", "GOLIRO01", "TOMEGOL4"],
        },
      },
    });
    juggernaut.addTrait({ immunities: ["magic", "fire"] });
    juggernaut.createCharge();
    juggernaut.createFists(2, 6, AbilityDamageTypeEnum.Crushing);
    juggernaut.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.Charge)],
    });
    return juggernaut;
  }

  /**
   * Snow Golem
   */
  private snow() {
    const snow = this.create({
      monster: MonsterEnum.SnowGolem,
      name: "monster.golem.name.snow",
      files: [],
      data: {
        level1: 12,
        strength: 19,
        dexterity: 6,
        constitution: 14,
        intelligence: 3,
        wisdom: 6,
        charisma: 1,
        ac: 1,
        apr: 2,
        xpv: 7000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "GIANTHUMANOID",
        race: "GOLEM",
        class: "GOLEM_STONE",
        gender: "NIETHER",
        size: "Large",
        movement: 9,
        immunities: ["construct"],
        items: {
          remove: ["UBSNORNG", "UBSNOFST"],
        },
      },
    });
    snow.addTrait({
      immunities: ["plusOneWeapons", "lightning"],
      effects: [
        {
          opcode: EffectTypeEnum.ColdResistanceModifier,
          value: 125,
          type: EffectStatisticModifierEnum.Set,
        },
        {
          opcode: EffectTypeEnum.MagicalColdResistanceModifier,
          value: 125,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    snow.createConeOfCold();
    snow.createFists(2, 12, AbilityDamageTypeEnum.Crushing);
    snow.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.ConeOfCold)],
    });
    return snow;
  }
}

export const createGolems = () => new GolemFamily();
