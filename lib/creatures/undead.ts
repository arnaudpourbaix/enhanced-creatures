import { MonsterItemIconEnum } from "../config/item";
import { FNP_SPELLS } from "../config/spells/fnp-spell-names";
import { SPELLS } from "../config/spells/spell-names";
import { CommonProjectileFiles } from "../spells/projectiles";
import effectFactory from "../src/factories/effect.factory";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import { ItemSlot, WeaponSlot } from "../src/model/creature/item";
import { StringReference } from "../src/model/final/stringref";
import { Durations } from "../src/model/game-data/durations";
import { BaseEffect, Effect } from "../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  DiseaseTypeEnum,
  EffectCastSpellTypeEnum,
  EffectColorLocationEnum,
  EffectDamageTypeEnum,
  EffectDispelResistanceEnum,
  EffectIDSFileEnum,
  EffectModifierTypeEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityCastingAnimationEnum,
  ItemAbilityFlagEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  KillTargetDeathTypeEnum,
  LightingEffectEnum,
  LightingEffectTargetEnum,
  PortraitIconEnum,
  RemoveEffectsByResourceTypeEnum,
  SaveTypeEnum,
  SpellExclusionFlagEnum,
  SpellFlagEnum,
  SpellTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { ProjectileBehaviorEnum } from "../src/model/spell-item/projectile";
import { PartialSpell, WeaponCastSpell } from "../src/model/spell-item/spell-item";
import {
  SpellProtectionRelation,
  SpellProtectionStat,
} from "../src/model/spell-item/spell-protection";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {
  AuraOfEvil,
  BansheeFearAura,
  Blink,
  BonebatTouch,
  CarrionStench,
  DeathWail,
  GhoulTouch,
  GhoulLordTouch,
  GhastTouch,
  GhostFearAura,
  GhostTouch,
  GhoulRottingDisease,
  GreaterMummyRottingDisease,
  GreaterMummyFearAura,
  MummyFearAura,
  MummyRottingDisease,
  SkeletonWarriorFearAura,
  SpecterTouch,
  WallOfIce,
}

class Undead extends Creature {
  createTouch(p: {
    diceThrown: number;
    diceSize: number;
    damageBonus?: number;
    effects?: Effect[];
    slot?: ItemSlot;
  }) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.undead.weapon.touch",
        icon: MonsterItemIconEnum.Fist,
        equippedSlot: p.slot ? [p.slot] : [],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: p.diceThrown,
          diceSize: p.diceSize,
          damageBonus: p.damageBonus,
          damageType: AbilityDamageTypeEnum.Crushing,
          speed: 3,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
          effects: p.effects,
        },
      },
    });
  }

  createClaws(p: {
    diceThrown: number;
    diceSize: number;
    damageBonus?: number;
    effects?: Effect[];
    castSpell?: WeaponCastSpell;
    equipped?: boolean;
  }) {
    const equipped = p.equipped ?? true;
    return this.addWeapon({
      weapon: {
        stringRef: "monster.undead.weapon.claws",
        icon: MonsterItemIconEnum.Ghoul,
        equippedSlot: equipped ? ["WEAPON1"] : [],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: p.diceThrown,
          diceSize: p.diceSize,
          damageBonus: p.damageBonus,
          damageType: AbilityDamageTypeEnum.Slashing,
          speed: 5,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
          effects: p.effects,
        },
      },
      castSpells: p.castSpell ? [p.castSpell] : undefined,
    });
  }

  createShadowWeapon(p: {
    diceThrown: number;
    diceSize: number;
    damageBonus: number;
    opcode: EffectTypeEnum.StrengthBonus | EffectTypeEnum.WisdomBonus;
    drainValue: number;
    equipped?: boolean;
  }) {
    const baseEffect: BaseEffect = {
      dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
      duration: 5 * Durations.turn,
    };
    return this.createClaws({
      diceThrown: p.diceThrown,
      diceSize: p.diceSize,
      damageBonus: p.damageBonus,
      equipped: p.equipped,
      effects: [
        {
          opcode: p.opcode,
          type: EffectStatisticModifierEnum.Increment,
          value: p.drainValue,
          ...baseEffect,
        },
        {
          opcode: EffectTypeEnum.DisplayPortraitIcon,
          icon: PortraitIconEnum.AbilityScoreDrained,
          ...baseEffect,
        },
      ],
    });
  }

  createJaws(
    diceThrown: number,
    diceSize: number,
    castSpells?: WeaponCastSpell[],
    slot: WeaponSlot = "SHIELD",
  ) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.undead.weapon.jaws",
        icon: MonsterItemIconEnum.Jaws,
        equippedSlot: [slot],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: diceThrown,
          diceSize: diceSize,
          damageType: AbilityDamageTypeEnum.Piercing,
          speed: 3,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
      castSpells,
    });
  }

  /**
   * Banshee Fear Aura
   */
  createBansheeFearAura() {
    return this.addSpell({
      name: "monster.undead.ability.bansheeFearAura.name",
      description: "monster.undead.ability.bansheeFearAura.description",
      id: Ids.BansheeFearAura,
      memorizedCount: 1,
      icon: SPELLS.Priest.CloakOfFear.file,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      options: { renew: 1 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          speed: 1,
          projectile: CommonProjectileFiles.AreaOfSightNonParty,
          range: 30,
          effects: effectFactory.fear({
            duration: Durations.turn,
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
   * Skeleton Warrior Fear Aura
   */
  createSkeletonWarriorFearAura() {
    return this.addSpell({
      name: "monster.undead.ability.skeletonWarriorFearAura.name",
      description: "monster.undead.ability.skeletonWarriorFearAura.description",
      id: Ids.SkeletonWarriorFearAura,
      memorizedCount: 1,
      icon: SPELLS.Priest.CloakOfFear.file,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      options: { renew: 1 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          speed: 1,
          projectile: CommonProjectileFiles.AreaOfSightNonParty,
          range: 30,
          effects: [
            ...effectFactory.fear({
              duration: Durations.turn,
              saveType: SaveTypeEnum.Spell,
              maxLevel: 5,
            }),
            {
              opcode: EffectTypeEnum.ProtectionFromSpell,
              timing: EffectTimingEnum.InstantLimited,
              duration: Durations.turn,
            },
          ],
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
   * Death wail
   */
  createDeathWail() {
    return this.addSpell({
      name: "monster.undead.ability.deathWail.name",
      description: "monster.undead.ability.deathWail.description",
      id: Ids.DeathWail,
      memorizedCount: 1,
      icon: SPELLS.Wizard.WailOfTheBanshee.file,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          speed: 1,
          projectile: CommonProjectileFiles.AreaOfSightNonParty,
          range: 30,
          effects: [
            {
              opcode: EffectTypeEnum.Slay,
              idsFile: EffectIDSFileEnum.EA,
              idsEntry: "ANYONE",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              saveTypes: [SaveTypeEnum.Spell],
            },
            {
              opcode: EffectTypeEnum.LightingEffects,
              effect: LightingEffectEnum.HitFingerOfDeath,
              lightingTarget: LightingEffectTargetEnum.SpellTarget,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              saveTypes: [SaveTypeEnum.Spell],
            },
            {
              opcode: EffectTypeEnum.PlaySound,
              resource: "CAS_M07",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              saveTypes: [SaveTypeEnum.Spell],
            },
          ],
        },
      ],
      ability: {
        preset: SPELLS.Wizard.WailOfTheBanshee.file,
        spell: {
          type: "force",
          remove: true,
        },
      },
    });
  }

  /**
   * Wall of Ice
   */
  createWallOfIce() {
    return this.addSpell({
      name: "monster.undead.ability.iceWall.name",
      description: "monster.undead.ability.iceWall.description",
      id: Ids.WallOfIce,
      memorizedCount: 1,
      icon: "RR#ICEW",
      primaryType: ItemAbilityPrimaryTypeEnum.Invoker,
      secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
      castingSound: "CAS_M06",
      castingAnimation: ItemAbilityCastingAnimationEnum.Invocation,
      exclusionFlags: [SpellExclusionFlagEnum.Enchanter],
      flags: [SpellFlagEnum.Hostile],
      type: SpellTypeEnum.Wizard,
      level: 4,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Spell,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          speed: 4,
          projectile: {
            name: "Wall of Ice",
            copyFromFile: "ICESTORM",
            speed: 20,
            behaviorFlags: [ProjectileBehaviorEnum.UseHeight],
            impactSound: "EFF_M34",
            areaEffectInfo: {
              areaOfEffect: 341,
              triggerCount: 1,
              explosionDelay: 10,
            },
          },
          range: 40,
          effects: [
            {
              opcode: EffectTypeEnum.Damage,
              type: EffectDamageTypeEnum.Cold,
              diceThrown: 2,
              diceSize: 10,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              saveTypes: [SaveTypeEnum.BypassMirrorImage],
            },
            {
              opcode: EffectTypeEnum.Damage,
              type: EffectDamageTypeEnum.Crushing,
              diceThrown: 1,
              diceSize: 10,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              saveTypes: [SaveTypeEnum.BypassMirrorImage],
            },
          ],
        },
        //TODO: level 24 header with 6d10 cold and 3d10 crushing, who is using this one??
      ],
      ability: {
        preset: SPELLS.Wizard.IceStorm.file,
        spell: {
          type: "noDec",
        },
      },
    });
  }

  /**
   * Ghoul Touch
   */
  createGhoulTouch() {
    return this.addSpell({
      name: "monster.undead.ability.ghoulTouch.name",
      description: "monster.undead.ability.ghoulTouch.description",
      id: Ids.GhoulTouch,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          range: 5,
          effects: [
            {
              opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
              type: {
                stat: SpellProtectionStat.General,
                relation: SpellProtectionRelation.NotEqual,
              },
              value: "HUMANOID",
            },
            {
              opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
              type: {
                stat: SpellProtectionStat.Race,
                relation: SpellProtectionRelation.Equal,
              },
              value: "ELF",
            },
            ...effectFactory.paralyze({
              duration: 5 * Durations.round,
              saveType: SaveTypeEnum.ParalyzePoisonDeath,
            }),
          ],
        },
      ],
    });
  }

  /**
   * Ghast Touch
   */
  createGhastTouch() {
    return this.addSpell({
      name: "monster.undead.ability.ghastTouch.name",
      description: "monster.undead.ability.ghastTouch.description",
      id: Ids.GhastTouch,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          range: 5,
          effects: [
            {
              opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
              type: {
                stat: SpellProtectionStat.General,
                relation: SpellProtectionRelation.NotEqual,
              },
              value: "HUMANOID",
            },
            ...effectFactory.paralyze({
              duration: 7 * Durations.round,
              saveType: SaveTypeEnum.ParalyzePoisonDeath,
            }),
          ],
        },
      ],
    });
  }

  /**
   * Ghoul Lord Touch
   */
  createGhoulLordTouch() {
    return this.addSpell({
      name: "monster.undead.ability.ghoulLordTouch.name",
      description: "monster.undead.ability.ghoulLordTouch.description",
      id: Ids.GhoulLordTouch,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          range: 5,
          effects: [
            {
              opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
              type: {
                stat: SpellProtectionStat.General,
                relation: SpellProtectionRelation.NotEqual,
              },
              value: "HUMANOID",
            },
            ...effectFactory.paralyze({
              duration: Durations.turn,
              saveType: SaveTypeEnum.ParalyzePoisonDeath,
            }),
          ],
        },
      ],
    });
  }

  /**
   * Bonebat Touch
   */
  createBonebatTouch() {
    return this.addSpell({
      name: "monster.undead.ability.bonebatTouch.name",
      description: "monster.undead.ability.bonebatTouch.description",
      id: Ids.BonebatTouch,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          range: 5,
          effects: [
            {
              opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
              type: {
                stat: SpellProtectionStat.Race,
                relation: SpellProtectionRelation.Equal,
              },
              value: "ELF",
            },
            ...effectFactory.paralyze({
              duration: 6 * Durations.round,
              saveType: SaveTypeEnum.ParalyzePoisonDeath,
            }),
          ],
        },
      ],
    });
  }

  /**
   * Carrion Stench
   */
  createCarrionStench() {
    const base: BaseEffect = {
      saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
      saveBonus: -2,
      timing: EffectTimingEnum.InstantLimited,
      duration: 2 * Durations.round,
      dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
    };
    return this.addSpell({
      name: "monster.undead.ability.carrionStench.name",
      description: "monster.undead.ability.carrionStench.description",
      id: Ids.CarrionStench,
      options: { renew: 1 },
      memorizedCount: 1,
      headers: [
        {
          type: ItemAbilityTypeEnum.Ranged,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          projectile: "IDPRO282",
          range: 5,
          effects: [
            {
              opcode: EffectTypeEnum.RemoveEffectsByResource,
              type: RemoveEffectsByResourceTypeEnum.Default,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
            {
              opcode: EffectTypeEnum.Thac0Bonus,
              type: EffectModifierTypeEnum.Increment,
              value: -2,
              ...base,
            },
            {
              opcode: EffectTypeEnum.DisplayPortraitIcon,
              icon: PortraitIconEnum.Nauseated,
              ...base,
            },
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: "monster.undead.ability.carrionStench.message",
              ...base,
            },
          ],
        },
      ],
      ability: {
        targets: [
          {
            name: "NearestEnemies",
            limit: 3,
          },
        ],
        spell: {
          type: "reallyForce",
          selfTarget: true,
        },
        range: 5,
      },
    });
  }

  /**
   * Ghoul Lord Rotting Disease
   */
  createGhoulRottingDisease() {
    // PnP: Loose 10 hit points and 1 point from their Constitution and Charisma scores each day
    // Disease can be cured and thus, we can't reapply disease each day
    // Also, time is a bit different in game and I have replaced days by 8 hours (a rest)
    // Instead of gradually loosing con and cha, I have set a one time disease with -4
    return this.addSpell({
      name: "monster.undead.ability.ghoulRottingDisease.name",
      description: "monster.undead.ability.ghoulRottingDisease.description",
      id: Ids.GhoulRottingDisease,
      secondaryType: "Disease",
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          range: 5,
          effects: [
            {
              opcode: EffectTypeEnum.RemoveEffectsByResource,
              type: RemoveEffectsByResourceTypeEnum.Default,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
            {
              opcode: EffectTypeEnum.Disease,
              type: DiseaseTypeEnum.OneDamagePerAmountSeconds,
              amount: 100, // 10 every 8 hours
              icon: PortraitIconEnum.Diseased,
              timing: EffectTimingEnum.InstantLimited,
              duration: 100 * Durations.day,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
            {
              opcode: EffectTypeEnum.Disease,
              type: DiseaseTypeEnum.ReduceConstitutionByAmount,
              amount: 4,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
            {
              opcode: EffectTypeEnum.Disease,
              type: DiseaseTypeEnum.ReduceCharismaByAmount,
              amount: 4,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
          ],
        },
      ],
    });
  }

  /**
   * Mummy Rotting Disease
   */
  createMummyRottingDisease(greater: boolean) {
    // Mummy: PnP is 1-6 months, replaced by 6 days in the game
    // Greater Mummy: PnP is 1-6 days, replaced by 48 hours in the game
    const count = 6;
    const interval = greater ? Durations.eightHours : Durations.day;
    const description: StringReference = greater
      ? "monster.undead.ability.mummyRottingDisease.greaterDescription"
      : "monster.undead.ability.mummyRottingDisease.description";
    const disease: { type: DiseaseTypeEnum; amount: number }[] = [
      { type: DiseaseTypeEnum.ReduceCharismaByAmount, amount: 2 },
    ];
    if (greater) {
      disease.push(
        { type: DiseaseTypeEnum.ReduceStrengthByAmount, amount: 1 },
        { type: DiseaseTypeEnum.ReduceConstitutionByAmount, amount: 1 },
      );
    }
    const diseaseEffects: Effect[] = Array.from(Array(count), (_e, i) =>
      disease.map(
        (e) =>
          // no-unnecessary-type-assertion is wrong here (verified against tsc directly): without
          // this cast, the object literal's `opcode` widens to `EffectTypeEnum` instead of
          // narrowing to the `EffectTypeEnum.Disease` literal DiseaseEffect needs - the nested
          // arrow-in-.map()-in-.flat() chain breaks the contextual typing that would otherwise
          // narrow it from the outer `Effect[]` annotation.
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
          ({
            opcode: EffectTypeEnum.Disease,
            type: e.type,
            amount: e.amount,
            icon: PortraitIconEnum.Diseased,
            timing: EffectTimingEnum.DelayPermanent,
            duration: (i + 1) * interval,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
          }) as Effect,
      ),
    ).flat();
    return this.addSpell({
      description,
      name: "monster.undead.ability.mummyRottingDisease.name",
      id: greater ? Ids.GreaterMummyRottingDisease : Ids.MummyRottingDisease,
      secondaryType: "Disease",
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          range: 5,
          effects: [
            {
              opcode: EffectTypeEnum.CharacterColorPulse,
              color: { red: 43, green: 79, blue: 0 },
              cycleSpeed: 0,
              location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
              timing: EffectTimingEnum.InstantLimited,
              duration: 2,
            },
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: "monster.undead.ability.mummyRottingDisease.diseased",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.DisplayPortraitIcon,
              icon: PortraitIconEnum.Diseased,
              timing: EffectTimingEnum.InstantLimited,
              duration: count * interval,
            },
            ...diseaseEffects,
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: "monster.undead.ability.mummyRottingDisease.warning",
              timing: EffectTimingEnum.DelayPermanent,
              duration: (count - 1) * interval,
            },
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: "monster.undead.ability.mummyRottingDisease.death",
              timing: EffectTimingEnum.DelayPermanent,
              duration: count * interval - 1,
            },
            {
              opcode: EffectTypeEnum.KillTarget,
              type: KillTargetDeathTypeEnum.Normal,
              displayText: true,
              timing: EffectTimingEnum.DelayPermanent,
              duration: count * interval,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
            {
              opcode: EffectTypeEnum.ProtectionFromSpell,
              timing: EffectTimingEnum.InstantLimited,
              duration: count * interval,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            },
          ],
          immunityEffect: {
            names: ["cureWoundSpells"],
            duration: count * interval,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
          },
        },
      ],
    });
  }

  /**
   * Mummy Fear Aura
   */
  createMummyFearAura(greater: boolean) {
    const humanBonus = greater ? -1 : 2;
    const othersBonus = greater ? -3 : 0;
    const description: StringReference = greater
      ? "monster.undead.ability.mummyFearAura.greaterDescription"
      : "monster.undead.ability.mummyFearAura.description";
    const humans = this.createMummyFearAuraTechnical(humanBonus, false);
    const others = this.createMummyFearAuraTechnical(othersBonus, true);
    return this.addSpell({
      description,
      name: "monster.undead.ability.mummyFearAura.name",
      id: greater ? Ids.GreaterMummyFearAura : Ids.MummyFearAura,
      memorizedCount: 1,
      icon: SPELLS.Priest.CloakOfFear.file,
      options: { renew: 2 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          speed: 1,
          projectile: CommonProjectileFiles.AreaOfSightNonParty,
          range: 30,
          effects: [
            {
              opcode: EffectTypeEnum.CastSpell,
              type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
              resource: others.file,
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
            {
              opcode: EffectTypeEnum.UseEFFFile,
              idsFile: EffectIDSFileEnum.RACE,
              idsEntry: "HUMAN",
              timing: EffectTimingEnum.InstantPermanentUntilDeath,
            },
          ],
        },
      ],
      effectFiles: [
        {
          opcode: EffectTypeEnum.CastSpell,
          type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
          resource: humans.file,
          timing: EffectTimingEnum.InstantPermanentUntilDeath,
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
  createMummyFearAuraTechnical(saveBonus: number, excludeHumans: boolean) {
    const duration = 3 * Durations.round;
    const saveType = SaveTypeEnum.Spell;
    const effects: Effect[] = [
      ...effectFactory.paralyze({
        duration,
        saveType,
        saveBonus,
        pulse: {
          red: 128,
          green: 64,
          blue: 0,
          speed: 20,
        },
      }),
      ...effectFactory.fear({
        duration,
        saveType,
        saveBonus,
        startSound: "",
        endSound: "",
      }),
      {
        opcode: EffectTypeEnum.DisplayString,
        stringRef: "monster.undead.ability.mummyFearAura.frightened",
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
        saveTypes: [saveType],
        saveBonus,
      },
      {
        opcode: EffectTypeEnum.ProtectionFromSpell,
        timing: EffectTimingEnum.InstantLimited,
        duration: Durations.turn,
      },
    ];
    const spell: PartialSpell = {
      name: "monster.undead.ability.mummyFearAura.name",
      secondaryType: "Fear",
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Spell,
          target: ItemAbilityTargetEnum.LivingActor,
          effects,
        },
      ],
      effectFiles: [],
    };
    if (excludeHumans) {
      effects.unshift({
        opcode: EffectTypeEnum.UseEFFFile,
        idsFile: EffectIDSFileEnum.RACE,
        idsEntry: "HUMAN",
        timing: EffectTimingEnum.InstantLimited,
        duration: 1,
      });
    }
    return this.addSpell(spell);
  }

  /**
   * Ghost Fear Aura
   */
  createGhostFearAura() {
    // causes any humanoid being to age 10 years and flee in panic for 8 turns unless a saving throw versus spell is made.
    // all humanoids above 8th level may add +2 to their saving throws.
    // Priests above 6th level are immune to this effect,
    const saveType = SaveTypeEnum.Spell;
    return this.addSpell({
      name: "monster.undead.ability.ghostFearAura.name",
      description: "monster.undead.ability.ghostFearAura.description",
      id: Ids.GhostFearAura,
      memorizedCount: 1,
      icon: SPELLS.Priest.CloakOfFear.file,
      options: { renew: 2 },
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          location: ItemAbilityLocationEnum.Ability,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          speed: 0,
          projectile: CommonProjectileFiles.AreaOfSightNonParty,
          range: 30,
          effects: [
            {
              opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
              type: {
                stat: SpellProtectionStat.General,
                relation: SpellProtectionRelation.NotEqual,
              },
              value: "HUMANOID",
              timing: EffectTimingEnum.InstantLimited,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
              duration: 1,
            },
            {
              opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
              type: "CLERIC",
              timing: EffectTimingEnum.InstantLimited,
              dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
              minLevel: 7,
              duration: 1,
            },
            ...effectFactory.fear({
              saveType,
              duration: 8 * Durations.turn,
              saveBonus: 0,
              minLevel: 1,
              maxLevel: 7,
              stringRef: "monster.undead.ability.ghostFearAura.frightened",
            }),
            ...effectFactory.fear({
              saveType,
              duration: 8 * Durations.turn,
              saveBonus: 2,
              minLevel: 8,
              stringRef: "monster.undead.ability.ghostFearAura.frightened",
            }),
            {
              opcode: EffectTypeEnum.ProtectionFromSpell,
              timing: EffectTimingEnum.InstantLimited,
              duration: Durations.turn,
            },
          ],
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
   * Aura of Evil
   */
  createAuraOfEvil() {
    // Ghoul lords do radiate an aura of evil. In fact, this effect is so potent that those of good alignment suffer a -4 on all attack rolls when within 30 feet of these creatures.
    // In addition, all persons who are forced to make a fear or horror check because of an encounter with a ghoul lord must do so with a -2 penalty.
    const base: BaseEffect = {
      timing: EffectTimingEnum.InstantLimited,
      duration: Durations.round,
      dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
    };
    return this.addSpell({
      name: "monster.undead.ability.auraOfEvil.name",
      description: "monster.undead.ability.auraOfEvil.description",
      id: Ids.AuraOfEvil,
      options: { renew: 1 },
      memorizedCount: 1,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          target: ItemAbilityTargetEnum.AnyPointWithinRange,
          projectile: CommonProjectileFiles.AreaOfSightNonParty,
          range: 1,
          effects: [
            {
              opcode: EffectTypeEnum.UseEFFFile,
              idsFile: EffectIDSFileEnum.ALIGN,
              idsEntry: "MASK_GOOD",
              ...base,
            },
            {
              opcode: EffectTypeEnum.DisplayPortraitIcon,
              icon: PortraitIconEnum.Nauseated,
              ...base,
            },
            {
              opcode: EffectTypeEnum.DisplayString,
              stringRef: "monster.undead.ability.auraOfEvil.message",
              ...base,
            },
            {
              opcode: EffectTypeEnum.ProtectionFromSpell,
              ...base,
            },
          ],
        },
      ],
      effectFiles: [
        {
          opcode: EffectTypeEnum.Thac0Bonus,
          type: EffectModifierTypeEnum.Increment,
          value: -4,
          ...base,
        },
      ],
      ability: {
        targets: [
          {
            name: "NearestEnemies",
            limit: 3,
          },
        ],
        spell: {
          type: "reallyForce",
          selfTarget: true,
        },
      },
    });
  }

  /**
   * Specter Touch
   */
  createSpecterTouch() {
    return this.addSpell({
      name: "monster.undead.ability.specterTouch.name",
      description: "monster.undead.ability.specterTouch.description",
      id: Ids.SpecterTouch,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          range: 5,
          effects: [
            ...effectFactory.levelDrain({
              levels: 2,
            }),
          ],
        },
      ],
    });
  }

  /**
   * Ghost Touch
   */
  createGhostTouch() {
    return this.addSpell({
      name: "monster.undead.ability.ghostTouch.name",
      description: "monster.undead.ability.ghostTouch.description",
      id: Ids.GhostTouch,
      secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
      headers: [
        {
          type: ItemAbilityTypeEnum.Melee,
          range: 5,
          effects: [
            // TODO: If they strike an opponent it ages him 10-40 (1d4x10) years.
            ...effectFactory.levelDrain({
              levels: 2,
            }),
            {
              opcode: EffectTypeEnum.Damage,
              type: EffectDamageTypeEnum.Magic,
              amount: 10,
              dispelResistance: EffectDispelResistanceEnum.NotDispelBypassResistance,
            },
          ],
        },
      ],
    });
  }

  createBlink() {
    return this.addSpell({
      icon: SPELLS.Wizard.TeleportField.file,
      options: { renew: 14 },
      name: "monster.undead.ability.blink",
      id: Ids.Blink,
      memorizedCount: 1,
      headers: [
        {
          type: ItemAbilityTypeEnum.Magical,
          speed: 1,
          target: ItemAbilityTargetEnum.Caster,
          effects: [
            ...effectFactory.repeatEffect(4, [
              {
                opcode: EffectTypeEnum.TeleportField,
                target: EffectTargetEnum.Self,
                maxRange: 100,
              },
              {
                opcode: EffectTypeEnum.LightingEffects,
                target: EffectTargetEnum.Self,
                effect: LightingEffectEnum.AlterationWater,
                lightingTarget: LightingEffectTargetEnum.SpellTarget,
              },
              {
                opcode: EffectTypeEnum.PlaySound,
                target: EffectTargetEnum.Self,
                resource: "EFF_M08",
              },
            ]),
          ],
        },
      ],
      ability: {
        spell: {
          selfTarget: true,
        },
        requireVocal: false,
        triggers: [{ name: "Range", params: ["NearestEnemyOf", 5] }],
      },
    });
  }
}

class UndeadFamily extends CreatureFamily<Undead> {
  constructor() {
    super(MonsterFamilyEnum.Undead);
    this.addCreature(() => this.banshee());
    // this.addCreature(this.deathKnight());
    // this.addCreature(this.deathShade());
    this.addCreature(() => this.ghoul());
    this.addCreature(() => this.ghast());
    this.addCreature(() => this.ghoulLord());
    this.addCreature(() => this.mummy());
    this.addCreature(() => this.greaterMummy());
    this.addCreature(() => this.shadow());
    this.addCreature(() => this.greaterShadow());
    this.addCreature(() => this.baneguard());
    this.addCreature(() => this.bonebat());
    this.addCreature(() => this.skeleton());
    this.addCreature(() => this.skeletonWarrior());
    this.addCreature(() => this.spectre());
    this.addCreature(() => this.ghost());
    // this.addCreature(this.wight());
    // this.addCreature(this.wraith());
    // this.addCreature(this.zombie());
    // this.addCreature(this.zombieJuju());
    // this.addCreature(this.zombieSea());
  }
  createCreature(id: MonsterEnum): Undead {
    return new Undead(id);
  }
  /**
   * Banshee
   */
  private banshee() {
    const banshee = this.create({
      monster: MonsterEnum.Banshee,
      name: "monster.undead.name.banshee",
      files: [],
      data: {
        level1: { pnpValue: 7, value: 17, type: "turn" }, // to approximate their "turned as special undead" from PnP
        strength: 9,
        dexterity: 14,
        constitution: 9,
        intelligence: 16,
        wisdom: 11,
        charisma: 17,
        ac: 0,
        apr: 1,
        xpv: 4000,
        alignment: "CHAOTIC_EVIL",
        morale: 13,
        general: "UNDEAD",
        race: "WRAITH",
        class: "SPECTRE",
        gender: "NIETHER",
        size: "Medium",
        movement: 15,
        immunities: ["undead"],
        items: {
          remove: ["IMMUNE1", "B1-8M2", "IMMCHS"],
        },
        script: {
          remove: ["BDBANSH", "banshe01", "f_wailin"],
        },
      },
    });
    banshee.createBansheeFearAura();
    banshee.createDeathWail();
    banshee.addTrait({
      immunities: ["nonMagicalWeapons", "magicResistance", "incorporeal", "cold", "lightning"],
    });
    banshee.createTouch({
      diceThrown: 1,
      diceSize: 8,
      slot: "WEAPON1",
    });
    banshee.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.DeathWail), this.ability(Ids.BansheeFearAura)],
    });
    return banshee;
  }
  /**
   * Death Knight
   */
  private deathKnight() {
    const knight = this.create({
      monster: MonsterEnum.DeathKnight,
      name: "monster.undead.name.deathKnight",
      files: [],
      data: {
        level1: 9,
        strength: 18,
        exceptionalStrength: 100,
        dexterity: 11,
        constitution: 9,
        intelligence: 18,
        wisdom: 16,
        charisma: 10,
        ac: 0,
        apr: 1,
        xpv: 6000,
        alignment: "CHAOTIC_EVIL",
        morale: 17,
        general: "UNDEAD",
        race: "SKELETON",
        class: "DEATHKNIGHT",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
        immunities: ["undead", "skeletal", "turnUndead"],
        items: {
          remove: ["HELM15", "SHLD06", "RINGDEMN"],
        },
        spells: {
          memorized: [
            { file: SPELLS.Wizard.DetectInvisibility.file, memorizedCount: 1 },
            { file: SPELLS.Wizard.DispelMagic.file, memorizedCount: 2 },
            { file: SPELLS.Wizard.PowerWordBlind.file, memorizedCount: 1 },
            { file: SPELLS.Wizard.PowerWordKill.file, memorizedCount: 1 },
            { file: SPELLS.Wizard.PowerWordStun.file, memorizedCount: 1 },
            // Symbol of Pain: rr#spain.spl
          ],
        },
      },
    });
    knight.createWallOfIce();
    knight.addTrait({
      immunities: ["turnUndead"],
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 75,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    knight.setBehavior({
      restHeal: true,
      abilities: [
        {
          preset: SPELLS.Wizard.DetectInvisibility.file,
          spell: { type: "noDec" },
        },
        this.ability(Ids.WallOfIce),
      ],
    });
    return knight;
  }

  /**
   * Ghast
   */
  private ghast() {
    const ghast = this.create({
      monster: MonsterEnum.Ghast,
      name: "monster.undead.name.ghast",
      files: [],
      data: {
        level1: 4,
        strength: 16,
        dexterity: 17,
        constitution: 9,
        intelligence: 12,
        wisdom: 10,
        charisma: 6,
        ac: 4,
        apr: 3,
        xpv: 650,
        alignment: "CHAOTIC_EVIL",
        morale: 14,
        general: "UNDEAD",
        race: "GHOUL",
        class: "GHOUL_GHAST",
        gender: "NIETHER",
        size: "Medium",
        movement: 15,
        immunities: ["undead"],
        items: {
          remove: ["ring95", "ghast1"],
        },
        script: {
          remove: ["movep1", "ghast", "ghastd", "bpundead"],
        },
        effects: {
          remove: [EffectTypeEnum.ProtectionFromBackstab],
        },
      },
    });
    ghast.createGhastTouch();
    ghast.createClaws({
      diceThrown: 1,
      diceSize: 4,
      castSpell: {
        spell: this.spell(Ids.GhastTouch).file,
      },
    });
    ghast.createJaws(1, 8, [
      {
        spell: this.spell(Ids.GhastTouch).file,
      },
    ]);
    ghast.createCarrionStench();
    ghast.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.CarrionStench)],
    });
    ghast.setAdjustments([
      {
        files: ["GHASTS", "ghastgsu"],
        data: { script: { location: "None" } },
      },
      {
        files: ["GRAEL"],
        data: {
          // he starts dialog with shoutdlg (can't configure in behavior/dialog because it has no script name)
          level1: 11,
          xpv: 5000,
          strength: 18,
          exceptionalStrength: 100,
          ac: -4,
        },
      },
    ]);
    return ghast;
  }

  /**
   * Ghoul
   */
  private ghoul() {
    const ghoul = this.create({
      monster: MonsterEnum.Ghoul,
      name: "monster.undead.name.ghoul",
      files: [],
      data: {
        level1: 2,
        strength: 13,
        dexterity: 15,
        constitution: 9,
        intelligence: 7,
        wisdom: 10,
        charisma: 6,
        ac: 6,
        apr: 3,
        xpv: 175,
        alignment: "CHAOTIC_EVIL",
        morale: 12,
        general: "UNDEAD",
        race: "GHOUL",
        class: "GHOUL",
        gender: "NIETHER",
        size: "Medium",
        movement: 9,
        immunities: ["undead"],
        items: {
          remove: ["ring95", "ghoul1", "ringkora"],
        },
        script: {
          remove: ["ghoul"],
        },
        effects: {
          remove: [EffectTypeEnum.ProtectionFromBackstab],
        },
      },
    });
    ghoul.createGhoulTouch();
    ghoul.createClaws({
      diceThrown: 1,
      diceSize: 3,
      castSpell: {
        spell: this.spell(Ids.GhoulTouch).file,
      },
    });
    ghoul.createJaws(1, 6, [
      {
        spell: this.spell(Ids.GhoulTouch).file,
      },
    ]);
    ghoul.setBehavior({
      restHeal: true,
    });
    ghoul.setAdjustments([{ files: ["KORAX"], data: { level1: 4 } }]);
    return ghoul;
  }

  /**
   * Ghoul Lord
   */
  private ghoulLord() {
    const lord = this.create({
      monster: MonsterEnum.GhoulLord,
      name: "monster.undead.name.ghoulLord",
      files: [],
      data: {
        level1: { pnpValue: 6, value: 7, type: "turn" },
        strength: 18,
        dexterity: 17,
        constitution: 9,
        intelligence: 14,
        wisdom: 11,
        charisma: 13,
        ac: 4,
        apr: 3,
        xpv: 3000,
        alignment: "CHAOTIC_EVIL",
        morale: 14,
        general: "UNDEAD",
        race: "GHOUL",
        class: "GHOUL_GHAST",
        gender: "NIETHER",
        animation: "GHOUL_GREATER",
        size: "Medium",
        movement: 15,
        immunities: ["undead"],
        items: {
          remove: ["ring95", "ghast1", "BDGHASTG", "ghoul1"],
        },
        script: {
          remove: ["ghoul", "ghast", "BDGHASTG", "gholor01", "riftcr01"],
        },
        effects: {
          remove: [EffectTypeEnum.ProtectionFromBackstab],
        },
      },
    });
    lord.addTrait({ immunities: ["nonSilverNonMagicalWeapons"] });
    lord.createGhoulLordTouch();
    lord.createGhoulRottingDisease();
    lord.createAuraOfEvil();
    lord.createClaws({
      diceThrown: 1,
      diceSize: 6,
      castSpell: {
        spell: this.spell(Ids.GhoulLordTouch).file,
      },
    });
    lord.createJaws(1, 10, [
      {
        spell: this.spell(Ids.GhoulLordTouch).file,
      },
      {
        spell: this.spell(Ids.GhoulRottingDisease).file,
        saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
      },
    ]);
    lord.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.AuraOfEvil)],
    });
    lord.setAdjustments([
      {
        files: [
          "MALKAL", // Mal-Kalen
        ],
        data: { class: "GHOUL_REVEANT" },
      },
    ]);
    return lord;
  }

  /**
   * Mummy
   */
  private mummy() {
    const mummy = this.create({
      monster: MonsterEnum.Mummy,
      name: "monster.undead.name.mummy",
      files: [],
      data: {
        level1: 6,
        bonusHp: 3,
        strength: 16,
        dexterity: 8,
        constitution: 9,
        intelligence: 7,
        wisdom: 10,
        charisma: 12,
        ac: 3,
        apr: 1,
        xpv: 3000,
        alignment: "LAWFUL_EVIL",
        morale: 15,
        general: "UNDEAD",
        race: "GHOUL",
        class: "GHOUL_REVEANT",
        animation: "MUMMY",
        gender: "NIETHER",
        size: "Medium",
        movement: 6,
        immunities: ["undead"],
        items: {
          remove: ["ring95", "immune1", "bdmumm01", "mummyw"],
        },
        script: {
          remove: ["bdmumm01"],
        },
        effects: {
          remove: [EffectTypeEnum.ProtectionFromBackstab],
        },
      },
    });
    mummy.addTrait({
      immunities: ["physicalDamageResistance", "cold", "nonMagicalWeapons"],
      effects: effectFactory.fireResistance(-33),
    });
    mummy.createMummyFearAura(false);
    mummy.createMummyRottingDisease(false);
    mummy.createClaws({
      diceThrown: 1,
      diceSize: 12,
      castSpell: {
        spell: this.spell(Ids.MummyRottingDisease).file,
      },
    });
    mummy.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.MummyFearAura)],
    });
    return mummy;
  }

  /**
   * Greater Mummy
   */
  private greaterMummy() {
    // Age: 400-499
    const greater = this.create({
      monster: MonsterEnum.GreaterMummy,
      name: "monster.undead.name.greaterMummy",
      files: [],
      data: {
        level1: { pnpValue: 12, value: 20, type: "caster" },
        bonusHp: 3,
        strength: 15,
        dexterity: 16,
        constitution: 9,
        intelligence: 18,
        wisdom: 22,
        charisma: 20,
        ac: -2,
        apr: 1,
        xpv: 16000,
        alignment: "LAWFUL_EVIL",
        morale: 18,
        general: "UNDEAD",
        race: "GHOUL",
        class: "CLERIC",
        animation: "MUMMY",
        gender: "NIETHER",
        size: "Medium",
        movement: 9,
        immunities: ["undead"],
        items: {
          remove: ["ring95", "immune2", "immune3", "mumgrew"],
        },
        script: {
          remove: ["bdmumm01", "d0mummy", "mummy01"],
        },
        effects: {
          remove: [EffectTypeEnum.ProtectionFromBackstab],
        },
        spells: {
          spellbooks: [
            {
              mod: "FaithsAndPowers",
              memorized: [
                // level 1 (12):
                { file: FNP_SPELLS.Priest.CauseDisease.file, memorizedCount: 3 },
                { file: FNP_SPELLS.Priest.Doom.file, memorizedCount: 3 },
                { file: SPELLS.Priest.Command.file, memorizedCount: 6 },
                // { file: FNP_SPELLS.Priest.FrostFingers.file, memorizedCount: 6 },
                // level 2 (12):
                { file: FNP_SPELLS.Priest.Forbiddance.file, memorizedCount: 5 },
                { file: FNP_SPELLS.Priest.RigidThinking.file, memorizedCount: 4 },
                { file: FNP_SPELLS.Priest.Shatter.file, memorizedCount: 2 },
                { file: FNP_SPELLS.Priest.Shield.file, memorizedCount: 1 },
                // level 3 (12):
                { file: FNP_SPELLS.Priest.CircleOfBones.file, memorizedCount: 3 },
                { file: FNP_SPELLS.Priest.ShadowMonsters.file, memorizedCount: 3 },
                { file: FNP_SPELLS.Priest.CauseSeriousWounds.file, memorizedCount: 6 },
                // level 4 (11):
                { file: FNP_SPELLS.Priest.AnimateDead.file, memorizedCount: 2 },
                { file: FNP_SPELLS.Priest.CauseCriticalWounds.file, memorizedCount: 2 },
                { file: FNP_SPELLS.Priest.DemiShadowMonsters.file, memorizedCount: 2 },
                { file: FNP_SPELLS.Priest.Emotion.file, memorizedCount: 1 },
                { file: FNP_SPELLS.Priest.GreaterMalison.file, memorizedCount: 1 },
                { file: SPELLS.Priest.Poison.file, memorizedCount: 2 },
                { file: FNP_SPELLS.Priest.WavesOfFatigue.file, memorizedCount: 1 },
                // level 5 (9):
                { file: FNP_SPELLS.Priest.Chaos.file, memorizedCount: 1 },
                { file: FNP_SPELLS.Priest.CloudOfPestilence.file, memorizedCount: 1 },
                {
                  file: SPELLS.Priest.MassCauseLightWounds.file,
                  memorizedCount: 1,
                },
                { file: FNP_SPELLS.Priest.Shades.file, memorizedCount: 1 },
                { file: SPELLS.Priest.SlayLiving.file, memorizedCount: 2 },
                { file: SPELLS.Priest.WavesOfAgony.file, memorizedCount: 1 },
                { file: SPELLS.Priest.GreaterCommand.file, memorizedCount: 1 },
                { file: SPELLS.Priest.MagicResistance.file, memorizedCount: 1 },
                // level 6 (5):
                { file: SPELLS.Priest.DolorousDecay.file, memorizedCount: 3 },
                { file: SPELLS.Priest.Harm.file, memorizedCount: 1 },
                { file: FNP_SPELLS.Priest.SummonShadows.file, memorizedCount: 1 },
                // level 7 (2):
                { file: SPELLS.Priest.FingerOfDeath.file, memorizedCount: 1 },
                { file: SPELLS.Priest.Wither.file, memorizedCount: 1 },
              ],
            },
            {
              mod: "SpellRevisions",
              memorized: [
                // TODO: use SR spells
                // level 1 (12):
                { file: SPELLS.Priest.Doom.file, memorizedCount: 5 },
                { file: SPELLS.Priest.Command.file, memorizedCount: 5 },
                { file: SPELLS.Priest.Bless.file, memorizedCount: 1 },
                { file: SPELLS.Priest.Sanctuary.file, memorizedCount: 1 },
                // level 2 (12):
                { file: SPELLS.Priest.Silence.file, memorizedCount: 3 },
                { file: SPELLS.Priest.HoldPerson.file, memorizedCount: 5 },
                { file: SPELLS.Priest.Chant.file, memorizedCount: 1 },
                { file: SPELLS.Priest.DrawUponHolyMight.file, memorizedCount: 3 },
                // level 3 (12):
                { file: SPELLS.Priest.AnimateDead.file, memorizedCount: 4 },
                { file: SPELLS.Priest.GlyphOfWarding.file, memorizedCount: 3 },
                { file: SPELLS.Priest.DispelMagic.file, memorizedCount: 2 },
                { file: SPELLS.Priest.UnholyBlight.file, memorizedCount: 3 },
                // level 4 (11):
                { file: SPELLS.Priest.MentalDomination.file, memorizedCount: 3 },
                { file: SPELLS.Priest.CauseSeriousWounds.file, memorizedCount: 2 },
                { file: SPELLS.Priest.Poison.file, memorizedCount: 3 },
                { file: SPELLS.Priest.ProtectionFromLightning.file, memorizedCount: 1 },
                { file: SPELLS.Priest.HolyPower.file, memorizedCount: 2 },
                // level 5 (9):
                { file: SPELLS.Priest.FlameStrike.file, memorizedCount: 3 },
                { file: SPELLS.Priest.RighteousMagic.file, memorizedCount: 1 },
                { file: SPELLS.Priest.SlayLiving.file, memorizedCount: 2 },
                { file: SPELLS.Priest.TrueSeeing.file, memorizedCount: 1 },
                { file: SPELLS.Priest.GreaterCommand.file, memorizedCount: 1 },
                { file: SPELLS.Priest.MagicResistance.file, memorizedCount: 1 },
                // level 6 (5):
                { file: SPELLS.Priest.DolorousDecay.file, memorizedCount: 2 },
                { file: SPELLS.Priest.Harm.file, memorizedCount: 1 },
                { file: SPELLS.Priest.BladeBarrier.file, memorizedCount: 1 },
                { file: SPELLS.Priest.AerialServant.file, memorizedCount: 1 },
                // level 7 (2):
                { file: SPELLS.Priest.FingerOfDeath.file, memorizedCount: 1 },
                { file: SPELLS.Priest.SymbolDeath.file, memorizedCount: 1 },
              ],
            },
            {
              mod: "Vanilla",
              memorized: [
                // level 1 (12):
                { file: SPELLS.Priest.Doom.file, memorizedCount: 5 },
                { file: SPELLS.Priest.Command.file, memorizedCount: 5 },
                { file: SPELLS.Priest.Bless.file, memorizedCount: 1 },
                { file: SPELLS.Priest.Sanctuary.file, memorizedCount: 1 },
                // level 2 (12):
                { file: SPELLS.Priest.Silence.file, memorizedCount: 3 },
                { file: SPELLS.Priest.HoldPerson.file, memorizedCount: 5 },
                { file: SPELLS.Priest.Chant.file, memorizedCount: 1 },
                { file: SPELLS.Priest.DrawUponHolyMight.file, memorizedCount: 3 },
                // level 3 (12):
                { file: SPELLS.Priest.AnimateDead.file, memorizedCount: 4 },
                { file: SPELLS.Priest.GlyphOfWarding.file, memorizedCount: 3 },
                { file: SPELLS.Priest.DispelMagic.file, memorizedCount: 2 },
                { file: SPELLS.Priest.UnholyBlight.file, memorizedCount: 3 },
                // level 4 (11):
                { file: SPELLS.Priest.MentalDomination.file, memorizedCount: 3 },
                { file: SPELLS.Priest.CauseSeriousWounds.file, memorizedCount: 2 },
                { file: SPELLS.Priest.Poison.file, memorizedCount: 3 },
                { file: SPELLS.Priest.ProtectionFromLightning.file, memorizedCount: 1 },
                { file: SPELLS.Priest.HolyPower.file, memorizedCount: 2 },
                // level 5 (9):
                { file: SPELLS.Priest.FlameStrike.file, memorizedCount: 3 },
                { file: SPELLS.Priest.RighteousMagic.file, memorizedCount: 1 },
                { file: SPELLS.Priest.SlayLiving.file, memorizedCount: 2 },
                { file: SPELLS.Priest.TrueSeeing.file, memorizedCount: 1 },
                { file: SPELLS.Priest.GreaterCommand.file, memorizedCount: 1 },
                { file: SPELLS.Priest.MagicResistance.file, memorizedCount: 1 },
                // level 6 (5):
                { file: SPELLS.Priest.DolorousDecay.file, memorizedCount: 2 },
                { file: SPELLS.Priest.Harm.file, memorizedCount: 1 },
                { file: SPELLS.Priest.BladeBarrier.file, memorizedCount: 1 },
                { file: SPELLS.Priest.AerialServant.file, memorizedCount: 1 },
                // level 7 (2):
                { file: SPELLS.Priest.FingerOfDeath.file, memorizedCount: 1 },
                { file: SPELLS.Priest.SymbolDeath.file, memorizedCount: 1 },
              ],
            },
          ],
        },
      },
    });
    greater.addTrait({
      immunities: ["physicalDamageResistance", "cold", "plusTwoWeapons"],
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          type: EffectStatisticModifierEnum.Set,
          value: 20,
        },
        {
          opcode: EffectTypeEnum.FireResistanceModifier,
          type: EffectStatisticModifierEnum.Set,
          value: 100,
        },
        {
          opcode: EffectTypeEnum.ElectricityResistanceModifier,
          type: EffectStatisticModifierEnum.Set,
          value: -50,
        },
      ],
    });
    greater.createMummyFearAura(true);
    greater.createMummyRottingDisease(true);
    greater.createClaws({
      diceThrown: 3,
      diceSize: 6,
      castSpell: {
        spell: this.spell(Ids.GreaterMummyRottingDisease).file,
      },
    });
    greater.setBehavior({
      restHeal: true,
      abilities: {
        entries: [{ abilityId: Ids.GreaterMummyFearAura, insertFirst: true }],
      },
      dialog: ["mumgre01"],
    });
    return greater;
  }

  /**
   * Shadow
   */
  private shadow() {
    const shadow = this.create({
      monster: MonsterEnum.Shadow,
      name: "monster.undead.name.shadow",
      files: [],
      data: {
        level1: 3,
        bonusHp: 3,
        strength: 6,
        dexterity: 14,
        constitution: 9,
        intelligence: 7,
        wisdom: 10,
        charisma: 8,
        ac: 7,
        apr: 1,
        xpv: 420,
        alignment: "CHAOTIC_EVIL",
        morale: 20,
        general: "MONSTER",
        race: "SHADOW",
        class: "SHADOW",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
        immunities: ["undead"],
        items: {
          remove: ["immune1", "undtype", "ring95", "shadowwp", "s1-8", "s1-12m2"],
        },
        script: {
          remove: [],
        },
      },
    });
    shadow.addTrait({ immunities: ["cold", "incorporeal"] });
    shadow.createShadowWeapon({
      diceThrown: 1,
      diceSize: 4,
      damageBonus: 1,
      opcode: EffectTypeEnum.StrengthBonus,
      drainValue: -1,
    });
    const mindWeapon = shadow.createShadowWeapon({
      diceThrown: 1,
      diceSize: 4,
      damageBonus: 1,
      opcode: EffectTypeEnum.WisdomBonus,
      drainValue: -2,
      equipped: false,
    });
    const soulWeapon = shadow.createShadowWeapon({
      diceThrown: 1,
      diceSize: 12,
      damageBonus: 1,
      opcode: EffectTypeEnum.StrengthBonus,
      drainValue: -2,
      equipped: false,
    });
    shadow.setAdjustments([
      {
        files: ["va#shdgl"],
        data: {
          script: { location: "None" },
        },
      },
      {
        files: ["AC#FPMDS"],
        data: {
          items: { equipped: [{ file: mindWeapon.file, slot: "WEAPON1" }] },
        },
      },
      {
        files: ["BDSHAD02", "L#GNOAL", "L#GNOEN"],
        data: { level1: 5, xpv: 650, strength: 18 },
      },
      {
        files: ["BDSHSOUL"],
        data: {
          level1: 7,
          xpv: 1100,
          items: { equipped: [{ file: soulWeapon.file, slot: "WEAPON1" }] },
        },
      },
    ]);
    shadow.setBehavior({
      restHeal: true,
    });
    return shadow;
  }

  /**
   * Greater Shadow
   */
  private greaterShadow() {
    const shadow = this.create({
      monster: MonsterEnum.GreaterShadow,
      name: "monster.undead.name.greaterShadow",
      files: [],
      data: {
        level1: 8,
        bonusHp: 8,
        strength: 10,
        dexterity: 16,
        constitution: 9,
        intelligence: 11,
        wisdom: 14,
        charisma: 12,
        ac: 5,
        apr: 1,
        xpv: 3000,
        alignment: "CHAOTIC_EVIL",
        morale: 20,
        general: "MONSTER",
        race: "SHADOW",
        class: "SHADOW",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
        immunities: ["undead"],
        items: {
          remove: ["BDSHADGR", "immune1", "ring95"],
        },
        script: {
          location: "None",
        },
      },
    });
    shadow.addTrait({ immunities: ["cold", "incorporeal"] });
    shadow.createShadowWeapon({
      diceThrown: 2,
      diceSize: 6,
      damageBonus: 2,
      opcode: EffectTypeEnum.StrengthBonus,
      drainValue: -3,
    });
    shadow.setBehavior({
      restHeal: true,
    });
    return shadow;
  }

  /**
   * Baneguard
   */
  private baneguard() {
    const baneguard = this.create({
      monster: MonsterEnum.Baneguard,
      name: "monster.undead.name.baneguard",
      files: [],
      data: {
        level1: 9,
        level2: 3, // for magic missiles as a level 3 wizard
        strength: 16, // 19 in vanilla
        dexterity: 11,
        constitution: 9,
        intelligence: 1,
        wisdom: 8,
        charisma: 5,
        ac: 7,
        apr: 1, // 3 in vanilla
        thac0: 19,
        xpv: 975,
        alignment: "NEUTRAL_EVIL",
        morale: 12,
        general: "UNDEAD",
        race: "SKELETON",
        class: "FIGHTER_MAGE", // SKELETON_BANEGUARD
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
        immunities: ["undead"],
        items: {
          remove: ["ring95", "ring99"],
        },
        spells: {
          memorized: [{ file: SPELLS.Wizard.MagicMissiles.file, memorizedCount: 1 }],
        },
        // Enforce proper skeleton colours for all processed creatures (colours courtesy of rskel01)
        metalColor: 20,
        minorColor: 67,
        majorColor: 66,
        skinColor: 105,
        leatherColor: 14,
        armorColor: 20,
        hairColor: 0,
      },
    });
    baneguard.addTrait({
      immunities: ["skeletal"],
    });
    baneguard.createBlink();
    baneguard.setBehavior({
      restHeal: true,
      abilities: [
        {
          preset: SPELLS.Wizard.MagicMissiles.file,
          spell: {
            type: "noDec",
          },
          requireVocal: false,
          timer: { name: "MagicMissiles", value: 18 },
        },
        this.ability(Ids.Blink),
      ],
    });
    baneguard.setAttack({
      ranged: true,
    });
    return baneguard;
  }

  /**
   * Bonebat
   */
  private bonebat() {
    const bonebat = this.create({
      monster: MonsterEnum.Bonebat,
      name: "monster.undead.name.bonebat",
      files: [],
      data: {
        level1: 4,
        strength: 12,
        dexterity: 13,
        constitution: 9,
        intelligence: 7,
        wisdom: 10,
        charisma: 14,
        ac: 7,
        apr: 1,
        xpv: 975,
        alignment: "NEUTRAL_EVIL",
        morale: 12,
        general: "UNDEAD",
        race: "SKELETON",
        class: "SKELETON",
        gender: "NIETHER",
        size: "Medium",
        movement: 18,
        immunities: ["undead"],
        items: {
          remove: ["ring95", "bdbonbat"],
        },
      },
    });
    bonebat.addTrait({
      immunities: ["skeletal"],
    });
    bonebat.createBonebatTouch();
    bonebat.createJaws(
      2,
      4,
      [
        {
          spell: this.spell(Ids.BonebatTouch).file,
        },
      ],
      "WEAPON1",
    );
    bonebat.setBehavior({
      restHeal: true,
    });
    return bonebat;
  }

  /**
   * Skeleton
   */
  private skeleton() {
    const skeleton = this.create({
      monster: MonsterEnum.Skeleton,
      name: "monster.undead.name.skeleton",
      files: [],
      data: {
        level1: 1,
        strength: 10,
        dexterity: 14,
        constitution: 9,
        intelligence: 1,
        wisdom: 8,
        charisma: 5,
        ac: 7,
        apr: 1,
        thac0: 19,
        xpv: 65,
        alignment: "NEUTRAL",
        morale: 12,
        general: "UNDEAD",
        race: "SKELETON",
        class: "SKELETON",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
        immunities: ["undead"],
        items: {
          remove: ["ring95", "ring99"],
        },
        spells: {
          removeMemorized: false,
          removeKnown: false,
        },
        // Enforce proper skeleton colours for all processed creatures (colours courtesy of rskel01)
        metalColor: 20,
        minorColor: 67,
        majorColor: 66,
        skinColor: 105,
        leatherColor: 14,
        armorColor: 20,
        hairColor: 0,
      },
    });
    skeleton.addTrait({
      immunities: ["skeletal"],
    });
    skeleton.setBehavior({
      restHeal: true,
      abilities: [
        this.preset(SPELLS.Wizard.Vocalize.file),
        this.preset(SPELLS.Wizard.MirrorImages.file),
        this.preset(SPELLS.Wizard.GreaterMalison.file),
        this.preset(SPELLS.Wizard.Emotion.file),
        this.preset(SPELLS.Wizard.MinorSpellDeflection.file),
        this.preset(SPELLS.Wizard.Shield.file),
        this.preset(SPELLS.Wizard.Haste.file),
        this.preset(SPELLS.Wizard.Slow.file),
        this.preset(SPELLS.Wizard.SpellThrust.file),
        this.preset(SPELLS.Wizard.Spook.file),
        this.preset(SPELLS.Wizard.StinkingCloud.file),
        this.preset(SPELLS.Wizard.MelfAcidArrow.file),
        this.preset(SPELLS.Wizard.MagicMissiles.file),
        this.preset(SPELLS.Wizard.ChromaticOrb.file),
        this.preset(SPELLS.Wizard.Glitterdust.file),
      ],
    });
    skeleton.setAttack({
      ranged: true,
    });
    skeleton.setAdjustments([
      {
        files: ["KRYSKEL"],
        data: { level1: 2 },
      },
      {
        files: ["SKELLESU"],
        data: { level1: 3 },
      },
      {
        // greater skeleton
        files: ["SKELGRSU"],
        data: { level1: 5, strength: 16, ac: 4 },
      },
      {
        files: ["L#HAUSK"],
        data: {
          level1: 13,
          strength: 19,
          ac: -1,
          apr: 3,
          xpv: 3000,
        },
      },
      {
        files: ["SKELPETR"],
        data: { script: { location: "None" } },
      },
      {
        // Tattered
        files: ["BDSKGR02"],
        data: { level1: 6, xpv: 400, strength: 17 },
      },
      {
        files: ["KNIGHTSK"],
        data: {
          level1: 9,
          xpv: 900,
          strength: 18,
          exceptionalStrength: 9,
          apr: 2,
        },
        scriptName: true,
      },
      {
        files: ["KRYSKEL1", "KRYSKEL2", "KRYSKEL3", "KRYSKEL4", "KRYSKEL5", "KRYSKEL6"],
        data: { level1: 2, xpv: 90 },
      },
      {
        // Restless Dead
        files: ["YSRSTDD1", "YSRSTDD2", "YSRSTDD3"],
        data: { script: { location: "None" } },
      },
      {
        // Restless Dead
        files: ["YSRSDEAD"],
        data: { level1: 2, xpv: 100, script: { location: "None" } },
      },
      {
        files: ["SKELACI", "SKELICE", "SKELFIRE"],
        // original thac0: 14-15
        data: { level1: 2, xpv: 120 },
      },
      {
        files: ["BDSKGR05", "BDSKGR06"],
        data: { level1: 4, xpv: 175 },
      },
      {
        files: ["BDSKGR04", "BDTEAM63"],
        data: { level1: 5, xpv: 420 },
      },
      {
        files: ["SKELAR01", "SKELAR02"],
        data: { level1: 6, xpv: 500 },
      },
      {
        files: ["BDSKGR07"],
        data: {
          level1: { pnpValue: 2, value: 5, type: "caster" },
          xpv: 900,
        },
      },
      {
        files: ["BDTEAM60"],
        data: {
          level1: { pnpValue: 4, value: 8, type: "caster" },
          xpv: 2000,
        },
      },
      {
        files: ["SKELDIS"],
        // original thac0: 12
        data: { level1: 3, xpv: 120 },
      },
      {
        files: ["GHASTSU"],
        data: { level1: 4, strength: 18 },
      },
    ]);
    return skeleton;
  }

  /**
   * Skeleton Warrior
   */
  private skeletonWarrior() {
    const warrior = this.create({
      monster: MonsterEnum.SkeletonWarrior,
      name: "monster.undead.name.skeletonWarrior",
      files: [],
      data: {
        level1: 9,
        bonusHp: 8, // +2 to +12
        strength: 18,
        exceptionalStrength: 40,
        dexterity: 14,
        constitution: 9,
        intelligence: 16,
        wisdom: 12,
        charisma: 4,
        ac: 2,
        apr: 1, // for some reason, they have 2 in vanilla, maybe to emulate apr of a lvl 9 fighter
        xpv: 4000,
        alignment: "NEUTRAL",
        morale: 15,
        general: "UNDEAD",
        race: "SKELETON",
        class: "SKELETON_WARRIOR",
        gender: "NIETHER",
        size: "Medium",
        movement: 6,
        immunities: ["undead"],
        effects: {
          remove: [EffectTypeEnum.Thac0Bonus],
        },
        items: {
          remove: ["ring95", "ring99", "immune1", "helmnoan", "undtype"],
        },
      },
    });
    warrior.addTrait({
      immunities: ["skeletal", "nonMagicalWeapons", "turnUndead"],
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 90,
          type: EffectStatisticModifierEnum.Set,
        },
        {
          // Skeleton warriors make all weapon attacks with a +3 bonus to their attack roll
          opcode: EffectTypeEnum.Thac0Bonus,
          type: EffectModifierTypeEnum.Increment,
          value: 3,
        },
      ],
    });
    // The mere sight of a skeleton warrior causes any creature with fewer than 5 Hit Dice to flee in panic.
    warrior.createSkeletonWarriorFearAura();
    warrior.setBehavior({
      restHeal: true,
      abilities: [this.ability(Ids.SkeletonWarriorFearAura)],
    });
    warrior.setAttack({
      ranged: true,
    });
    warrior.setAdjustments([
      {
        files: ["C0DESUM1", "SKELSU01"],
        data: {
          level1: 3,
          strength: 16,
          exceptionalStrength: 0,
          ac: 6,
        },
      },
      {
        files: ["C0DESUM2", "SKELSU07"],
        data: {
          level1: 5,
          strength: 17,
          exceptionalStrength: 0,
          ac: 4,
        },
      },
      {
        files: ["C0DESUM3", "SKELSU11"],
        data: {
          level1: 7,
          strength: 18,
          exceptionalStrength: 0,
          ac: 3,
        },
      },
      {
        files: ["BDUNSEN"],
        data: {
          level1: 7,
          xpv: 3000,
        },
      },
      {
        files: ["BDSKGR01", "BDTEAM62"],
        data: {
          level1: 7,
          xpv: 3000,
        },
      },
      {
        files: ["C0DESUM4"],
        data: {
          level1: 9,
          ea: "CONTROLLED",
        },
      },
      {
        files: ["SKELWA03"],
        data: {
          level1: 13,
        },
      },
      {
        files: ["C0DESUM5"],
        data: {
          level1: 15,
          strength: 19,
          exceptionalStrength: 0,
        },
      },
      {
        files: ["ICHARY"],
        data: {
          level1: 15,
          apr: 3,
        },
      },
    ]);
    return warrior;
  }

  /**
   * Spectre
   */
  private spectre() {
    const spectre = this.create({
      monster: MonsterEnum.Spectre,
      name: "monster.undead.name.spectre",
      files: [],
      data: {
        level1: 7,
        bonusHp: 3,
        strength: 1,
        dexterity: 14,
        constitution: 9,
        intelligence: 14,
        wisdom: 10,
        charisma: 11,
        ac: 2,
        apr: 1,
        xpv: 3000,
        alignment: "LAWFUL_EVIL",
        morale: 15,
        general: "UNDEAD",
        race: "SPECTRE",
        class: "SPECTRE",
        gender: "NIETHER",
        size: "Medium",
        movement: 15, // flying 30
        immunities: ["undead"],
      },
    });
    spectre.addTrait({
      immunities: ["cold", "incorporeal"],
    });
    spectre.createSpecterTouch();
    spectre.createClaws({
      diceThrown: 1,
      diceSize: 8,
      castSpell: {
        spell: this.spell(Ids.SpecterTouch).file,
      },
    });
    spectre.setBehavior({
      dialog: [],
    });
    return spectre;
  }

  /**
   * Ghost
   */
  private ghost() {
    const ghost = this.create({
      monster: MonsterEnum.Ghost,
      name: "monster.undead.name.ghost",
      files: [],
      data: {
        level1: 10,
        strength: 7,
        dexterity: 13,
        constitution: 9,
        intelligence: 14,
        wisdom: 12,
        charisma: 17,
        ac: 0,
        apr: 1,
        xpv: 7000,
        alignment: "LAWFUL_EVIL",
        morale: 15,
        general: "UNDEAD",
        race: "SPECTRE",
        class: "SPECTRE",
        gender: "NIETHER",
        size: "Medium",
        movement: 9,
        immunities: ["undead"],
        items: {
          remove: ["bdringgh", "bdghost", "immune1", "ring94", "ghost", "helm15"],
        },
        script: {
          remove: ["bdghost", "shoutdl2"],
        },
      },
    });
    ghost.addTrait({
      immunities: ["cold", "incorporeal"],
    });
    ghost.createGhostFearAura();
    ghost.createGhostTouch();
    ghost.createClaws({
      diceThrown: 0,
      diceSize: 0,
      castSpell: {
        spell: this.spell(Ids.GhostTouch).file,
      },
    });
    ghost.setBehavior({
      dialog: ["daitel"],
      abilities: [
        this.ability(Ids.GhostFearAura),
        this.preset(SPELLS.Wizard.Vocalize.file),
        this.preset(SPELLS.Wizard.ShadowDoor.file),
        this.preset(SPELLS.Wizard.ProtectionFromMagicalWeapons.file),
        this.preset(SPELLS.Wizard.Stoneskin.file),
        this.preset(SPELLS.Wizard.MinorGlobeOfInvulnerability.file),
        this.preset(SPELLS.Wizard.ProtectionFromMissiles.file),
        this.preset(SPELLS.Wizard.MinorSpellDeflection.file),
        this.preset(SPELLS.Wizard.MirrorImages.file),
        this.preset(SPELLS.Wizard.Shield.file),
        this.preset(SPELLS.Wizard.FireShield.file),
        this.preset(SPELLS.Wizard.Breach.file),
        this.preset(SPELLS.Wizard.SpellThrust.file),
        this.preset(SPELLS.Wizard.DispelMagic.file),
        this.preset(SPELLS.Wizard.RemoveMagic.file),
        this.preset(SPELLS.Wizard.ChainLightning.file),
        this.preset(SPELLS.Wizard.Cloudkill.file),
        this.preset(SPELLS.Wizard.Fireburst.file),
        this.preset(SPELLS.Wizard.ConeOfCold.file),
        this.preset(SPELLS.Wizard.GreaterMalison.file),
        this.preset(SPELLS.Wizard.Confusion.file),
        this.preset(SPELLS.Wizard.TeleportField.file),
        this.preset(SPELLS.Wizard.VitriolicSphere.file),
        this.preset(SPELLS.Wizard.MordenkainenForceMissiles.file),
        this.preset(SPELLS.Wizard.Slow.file),
        this.preset(SPELLS.Wizard.FlameArrow.file),
        this.preset(SPELLS.Wizard.LightningBolt.file),
        this.preset(SPELLS.Wizard.HoldPerson.file),
        this.minorSequencer([SPELLS.Wizard.MirrorImages.file, SPELLS.Wizard.Blur.file]),
        this.minorSequencer([SPELLS.Wizard.Web.file, SPELLS.Wizard.Combust.file]),
        this.preset(SPELLS.Wizard.Combust.file),
        this.preset(SPELLS.Wizard.MelfAcidArrow.file),
        this.preset(SPELLS.Wizard.AgannazarScorcher.file),
        this.preset(SPELLS.Wizard.ObscuringMist.file),
        this.preset(SPELLS.Wizard.Spook.file),
        this.preset(SPELLS.Wizard.MagicMissiles.file),
        this.preset(SPELLS.Wizard.BurningHands.file),
      ],
      spellcaster: {},
    });
    ghost.setAdjustments([
      {
        files: ["BDLITLA"],
        data: {},
      },
    ]);
    return ghost;
  }

  /**
   * Wight
   */
  private wight() {
    const wight = this.create({
      monster: MonsterEnum.Wight,
      name: "monster.undead.name.wight",
      files: [],
      data: {
        level1: 3,
        bonusHp: 2,
        strength: 17,
        dexterity: 15,
        constitution: 9,
        intelligence: 10,
        wisdom: 10,
        charisma: 1,
        ac: 5,
        apr: 1,
        xpv: 1400,
        alignment: "LAWFUL_EVIL",
        morale: 15,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_WRAITH",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
      },
    });
    wight.addTrait({
      immunities: ["cold", "nonSilverNonMagicalWeapons"],
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 15,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    wight.setBehavior({
      dialog: ["C#Q04009", "ttspid"],
    });
    return wight;
  }
  /**
   * Wraith
   */
  private wraith() {
    const wraith = this.create({
      monster: MonsterEnum.Wraith,
      name: "monster.undead.name.wraith",
      files: [],
      data: {
        level1: 3,
        bonusHp: 2,
        strength: 17,
        dexterity: 15,
        constitution: 9,
        intelligence: 10,
        wisdom: 10,
        charisma: 1,
        ac: 5,
        apr: 1,
        xpv: 1400,
        alignment: "LAWFUL_EVIL",
        morale: 15,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_WRAITH",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
      },
    });
    wraith.addTrait({
      immunities: ["cold", "nonSilverNonMagicalWeapons"],
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 15,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    wraith.setBehavior({
      dialog: ["C#Q04009", "ttspid"],
    });
    return wraith;
  }
  /**
   * Zombie
   */
  private zombie() {
    const zombie = this.create({
      monster: MonsterEnum.Zombie,
      name: "monster.undead.name.zombie",
      files: [],
      data: {
        level1: 3,
        bonusHp: 2,
        strength: 17,
        dexterity: 15,
        constitution: 9,
        intelligence: 10,
        wisdom: 10,
        charisma: 1,
        ac: 5,
        apr: 1,
        xpv: 1400,
        alignment: "LAWFUL_EVIL",
        morale: 15,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_WRAITH",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
      },
    });
    zombie.addTrait({
      immunities: ["cold", "nonSilverNonMagicalWeapons"],
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 15,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    zombie.setBehavior({
      dialog: ["C#Q04009", "ttspid"],
    });
    return zombie;
  }
  /**
   * Zombie juju
   */
  private zombieJuju() {
    const wraith = this.create({
      monster: MonsterEnum.ZombieJuju,
      name: "monster.undead.name.zombieJuju",
      files: [],
      data: {
        level1: 3,
        bonusHp: 2,
        strength: 17,
        dexterity: 15,
        constitution: 9,
        intelligence: 10,
        wisdom: 10,
        charisma: 1,
        ac: 5,
        apr: 1,
        xpv: 1400,
        alignment: "LAWFUL_EVIL",
        morale: 15,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_WRAITH",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
      },
    });
    wraith.addTrait({
      immunities: ["cold", "nonSilverNonMagicalWeapons"],
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 15,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    wraith.setBehavior({
      dialog: ["C#Q04009", "ttspid"],
    });
    return wraith;
  }
  /**
   * Zombie Sea
   */
  private zombieSea() {
    const wraith = this.create({
      monster: MonsterEnum.ZombieSea,
      name: "monster.undead.name.zombieSea",
      files: [],
      data: {
        level1: 3,
        bonusHp: 2,
        strength: 17,
        dexterity: 15,
        constitution: 9,
        intelligence: 10,
        wisdom: 10,
        charisma: 1,
        ac: 5,
        apr: 1,
        xpv: 1400,
        alignment: "LAWFUL_EVIL",
        morale: 15,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_WRAITH",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
      },
    });
    wraith.addTrait({
      immunities: ["cold", "nonSilverNonMagicalWeapons"],
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 15,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    wraith.setBehavior({
      dialog: ["C#Q04009", "ttspid"],
    });
    return wraith;
  }

  /**
   * Death Shade
   */
  private deathShade() {
    const shade = this.create({
      monster: MonsterEnum.DeathShade,
      name: "monster.undead.name.deathShade",
      files: [],
      data: {
        level1: 4,
        strength: 12,
        dexterity: 13,
        constitution: 9,
        intelligence: 7,
        wisdom: 10,
        charisma: 14,
        ac: 7,
        apr: 1,
        xpv: 975,
        alignment: "NEUTRAL_EVIL",
        morale: 12,
        general: "UNDEAD",
        race: "SKELETON",
        class: "SKELETON",
        gender: "NIETHER",
        size: "Medium",
        movement: 18,
        immunities: ["undead"],
        items: {
          remove: ["ring95", "bdbonbat"],
        },
      },
    });
    shade.addTrait({
      immunities: ["skeletal"],
    });
    shade.createBonebatTouch();
    shade.createJaws(
      2,
      4,
      [
        {
          spell: this.spell(Ids.BonebatTouch).file,
        },
      ],
      "WEAPON1",
    );
    shade.setBehavior({
      restHeal: true,
    });
    return shade;
  }
}

export const createUndeads = () => new UndeadFamily();
