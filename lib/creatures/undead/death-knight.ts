import { SPELLS } from "../../config/spells/spell-names";
import { NEW_SPELLS } from "../../config/spells/spells";
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

function wallOfIce(cre: Undead) {
  return cre.addSpell({
    name: "monster.undead.ability.iceWall.name",
    description: "monster.undead.ability.iceWall.description",
    id: Ids.WallOfIce,
    memorizedCount: 1,
    icon: "jaICEW",
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
      immunities: ["undead", "skeletal", "turnUndead"],
      items: {
        remove: ["SHLD06", "RINGDEMN", "UNDTYPE", "IMMUNE1", "DVDEATHK"],
      },
      spells: {
        memorized: [
          { file: SPELLS.Wizard.DetectInvisibility.file, memorizedCount: 15 },
          { file: SPELLS.Wizard.DispelMagic.file, memorizedCount: 2 },
          { file: SPELLS.Wizard.PowerWordBlind.file, memorizedCount: 1 },
          { file: SPELLS.Wizard.PowerWordKill.file, memorizedCount: 1 },
          { file: SPELLS.Wizard.PowerWordStun.file, memorizedCount: 1 },
          { file: NEW_SPELLS.WizardSymbolOfPain, memorizedCount: 1 },
          { file: SPELLS.Wizard.PowerWordStun.file, memorizedCount: 1 },
        ],
      },
    },
  });
  //TODO: 20-dice fireball once per day
  wallOfIce(knight);
  // 1	Long sword +2
  // 2	Two-handed sword +3
  // 3	Two-handed sword +4
  // 4	Short sword of quickness
  // 5	Short sword of dancing
  // 6	Short sword of life stealing
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
  knight.setBehavior({
    restHeal: true,
    abilities: [
      {
        preset: SPELLS.Wizard.DetectInvisibility.file,
        spell: { type: "noDec" },
      },
      {
        preset: SPELLS.Wizard.DetectInvisibility.file,
        spell: { type: "noDec" },
      },
      family.ability(Ids.WallOfIce),
    ],
  });
  return knight;
}
