import { SPELLS } from "../../config/spells/spell-database";
import { NEW_SPELLS } from "../../config/spells/spells";
import { createFearAura } from "../../spells/fear_aura";
import { CommonProjectileFiles } from "../../spells/projectiles";
import actionFactory from "../../src/factories/action.factory";
import { Durations } from "../../src/model/game-data/durations";
import { BaseEffect } from "../../src/model/spell-item/effect";
import {
  EffectDamageTypeEnum,
  EffectDispelResistanceEnum,
  EffectFlagsEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityCastingAnimationEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  ModifyGlobalVariableTypeEnum,
  SaveTypeEnum,
  SpellExclusionFlagEnum,
  SpellFlagEnum,
  SpellTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { ProjectileBehaviorEnum } from "../../src/model/spell-item/projectile";
import { MonsterEnum } from "../monster";
import type { UndeadFamily } from "./family";
import { Ids } from "./ids";
import { Undead } from "./undead-creature";

function fearAura(cre: Undead) {
  return cre.addSpell(
    createFearAura({
      id: Ids.DeathKnightFearAura,
      description: "monster.undead.ability.deathKnightFearAura.description",
      duration: 5 * Durations.round,
      projectile: {
        copyFromFile: CommonProjectileFiles.AreaOfSightNonParty,
        name: "Death Knight Aura of Fear",
        areaEffectInfo: {
          triggerRadius: 64,
          areaOfEffect: 64, // 5 feet
        },
      },
    }),
  );
}

function wallOfIce(cre: Undead) {
  const base: BaseEffect = {
    timing: EffectTimingEnum.InstantPermanentUntilDeath,
    saveTypes: [SaveTypeEnum.BypassMirrorImage],
    power: 4,
    dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
  };
  return cre.addSpell({
    name: "monster.undead.ability.iceWall.name",
    description: "monster.undead.ability.iceWall.description",
    id: Ids.WallOfIce,
    memorizedCount: 30,
    icon: "jaICEW",
    primaryType: ItemAbilityPrimaryTypeEnum.Invoker,
    secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
    castingSound: "CAS_M06",
    castingAnimation: ItemAbilityCastingAnimationEnum.Invocation,
    exclusionFlags: [SpellExclusionFlagEnum.Enchanter],
    flags: [SpellFlagEnum.Hostile],
    type: SpellTypeEnum.Wizard,
    level: 4,
    keywords: ["cold"],
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
            diceThrown: 3,
            diceSize: 10,
            ...base,
          },
        ],
      },
    ],
    ability: {
      preset: SPELLS.Wizard.IceStorm.file,
      spell: {
        type: "noDec",
      },
      timer: {
        name: "WallOfIce",
        value: 3 * Durations.round,
      },
    },
  });
}

function fireball(cre: Undead) {
  return cre.addSpell({
    name: "monster.undead.ability.fireball.name",
    description: "monster.undead.ability.fireball.description",
    id: Ids.Fireball,
    memorizedCount: 1,
    icon: SPELLS.Wizard.Fireball.file,
    primaryType: ItemAbilityPrimaryTypeEnum.Invoker,
    secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
    castingSound: "CAS_M06",
    castingAnimation: ItemAbilityCastingAnimationEnum.Invocation,
    flags: [SpellFlagEnum.Hostile],
    type: SpellTypeEnum.Wizard,
    level: 3,
    keywords: ["fire"],
    headers: [
      {
        type: ItemAbilityTypeEnum.Ranged,
        location: ItemAbilityLocationEnum.Spell,
        target: ItemAbilityTargetEnum.AnyPointWithinRange,
        speed: 3,
        projectile: "FIREBALL",
        range: 30,
        effects: [
          {
            opcode: EffectTypeEnum.Damage,
            type: EffectDamageTypeEnum.Fire,
            diceThrown: 20,
            diceSize: 6,
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
            saveTypes: [SaveTypeEnum.BypassMirrorImage, SaveTypeEnum.Breath],
            flags: [EffectFlagsEnum.SaveForHalf],
            dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
            power: 3,
          },
          {
            opcode: EffectTypeEnum.ModifyGlobalVariable,
            target: EffectTargetEnum.Self,
            type: ModifyGlobalVariableTypeEnum.Set,
            value: 0,
            resource: "mgArea1",
            timing: EffectTimingEnum.DelayPermanent,
            duration: 2,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            power: 3,
          },
        ],
      },
    ],
    ability: {
      preset: SPELLS.Wizard.Fireball.file,
      spell: {},
    },
  });
}

export function deathKnight(family: UndeadFamily): Undead {
  const knight = family.create({
    monster: MonsterEnum.DeathKnight,
    name: "monster.undead.name.deathKnight",
    files: [],
    data: {
      level1: 9,
      level2: 20,
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
      class: "CLERIC_MAGE", //"DEATHKNIGHT",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
      immunities: ["undead", "skeletal"],
      items: {
        remove: ["SHLD06", "RINGDEMN", "UNDTYPE", "IMMUNE1", "DVDEATHK", "SHLD06", "SW2H05"],
      },
      script: {
        remove: ["AC#DTDKN", "DVDEATHK"],
      },
      spells: {
        memorized: [
          { file: SPELLS.Wizard.DetectInvisibility.file, memorizedCount: 20 },
          { file: SPELLS.Wizard.DispelMagic.file, memorizedCount: 2 },
          { file: SPELLS.Wizard.PowerWordBlind.file, memorizedCount: 1 },
          { file: SPELLS.Wizard.PowerWordKill.file, memorizedCount: 1 },
          { file: SPELLS.Wizard.PowerWordStun.file, memorizedCount: 1 },
          { file: SPELLS.Wizard.SymbolFear.file, memorizedCount: 1 },
          { file: NEW_SPELLS.WizardSymbolOfPain, memorizedCount: 1 },
        ],
      },
    },
  });
  //
  fearAura(knight);
  wallOfIce(knight);
  fireball(knight);
  knight.addTrait({
    immunities: ["turnUndead"],
    effects: [
      {
        // Its magic resistance is 75%,
        // and if an 11 or lower is rolled on the percentile roll, the spell is reflected back at the caster
        opcode: EffectTypeEnum.MagicResistanceModifier,
        value: 75,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
  });
  // Weapon choices:
  // 1  Long sword +2
  // 2  Two-handed sword +3
  // 3  Two-handed sword +4
  // 4  Short sword of quickness
  // 5  Short sword of dancing
  // 6  Short sword of life stealing
  knight.setBehavior({
    restHeal: true,
    dialog: ["AC#DTDKN"],
    abilities: [
      family.ability(Ids.DeathKnightFearAura),
      family.preset(SPELLS.Wizard.DetectInvisibility.file),
      {
        preset: SPELLS.Wizard.PowerWordKill.file,
        actionsAfter: actionFactory.removeSpell([
          SPELLS.Wizard.PowerWordBlind,
          SPELLS.Wizard.PowerWordStun,
        ]),
      },
      {
        preset: SPELLS.Wizard.PowerWordStun.file,
        actionsAfter: actionFactory.removeSpell([
          SPELLS.Wizard.PowerWordKill,
          SPELLS.Wizard.PowerWordBlind,
        ]),
        probability: 5,
      },
      {
        preset: SPELLS.Wizard.PowerWordBlind.file,
        actionsAfter: actionFactory.removeSpell([
          SPELLS.Wizard.PowerWordKill,
          SPELLS.Wizard.PowerWordStun,
        ]),
        probability: 1,
      },
      family.preset(SPELLS.Wizard.DispelMagic.file),
      family.ability(Ids.Fireball),
      {
        preset: NEW_SPELLS.WizardSymbolOfPain,
        actionsAfter: actionFactory.removeSpell([SPELLS.Wizard.SymbolFear]),
        probability: 70,
      },
      {
        preset: SPELLS.Wizard.SymbolFear.file,
        actionsAfter: actionFactory.removeSpellRES([NEW_SPELLS.WizardSymbolOfPain]),
        probability: 15,
      },
      family.ability(Ids.WallOfIce),
    ],
  });
  knight.setAdjustments([
    {
      files: ["dvdeathk"],
      game: "bg1",
      data: {
        items: {
          equipped: [{ file: "sw2h11", slot: "WEAPON1" }], // two handed sword +2
        },
      },
    },
    {
      files: ["dvdeathk"],
      game: "bg2",
      data: {
        items: {
          equipped: [{ file: "sw2h08", slot: "WEAPON1" }], // soul reaver +4
        },
      },
    },
    {
      files: ["AC#DTDKN"],
      data: {
        level1: 15,
        xpv: 10000,
        items: {
          equipped: [{ file: "sw2h08", slot: "WEAPON1" }], // soul reaver +4
        },
      },
    },
  ]);
  return knight;
}
