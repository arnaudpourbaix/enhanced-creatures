import { SPELLS } from "../../config/spells/spell-names";
import {
  EffectDamageTypeEnum,
  EffectStatisticModifierEnum,
  EffectTimingEnum,
  ItemAbilityCastingAnimationEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
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

export function deathKnight(family: UndeadFamily): Undead {
  const knight = family.create({
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
      size: { value: "Medium", tall: true, long: false },
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
  wallOfIce(knight);
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
      family.ability(Ids.WallOfIce),
    ],
  });
  return knight;
}
