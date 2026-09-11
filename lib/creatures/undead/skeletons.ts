/**
 * Skeletal undead: skeleton, skeleton warrior, baneguard, bonebat, death knight, death shade.
 *
 * Shared weapon primitives live on `Undead` (undead-creature.ts); ability ids in ids.ts.
 */
import effectFactory from "../../src/factories/effect.factory";
import { SPELLS } from "../../config/spells/spell-names";
import { CommonProjectileFiles } from "../../spells/projectiles";
import { Durations } from "../../src/model/game-data/durations";
import {
  EffectDamageTypeEnum,
  EffectModifierTypeEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityCastingAnimationEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  LightingEffectTargetEnum,
  SaveTypeEnum,
  SpellExclusionFlagEnum,
  SpellFlagEnum,
  SpellTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { ProjectileBehaviorEnum } from "../../src/model/spell-item/projectile";
import {
  SpellProtectionRelation,
  SpellProtectionStat,
} from "../../src/model/spell-item/spell-protection";
import abilityOrderService from "../../src/services/baf/ability-order.service";
import { MonsterEnum } from "../monster";
import { Ids } from "./ids";
import type { UndeadFamily } from "./family";
import { Undead } from "./undead-creature";
import { Variant } from "../../src/model/creature/variant";

function skeletonWarriorFearAura(cre: Undead) {
  return cre.addSpell({
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

function bonebatTouch(cre: Undead) {
  return cre.addSpell({
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

function blink(cre: Undead) {
  return cre.addSpell({
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

export function skeleton(family: UndeadFamily): Undead {
  const skeleton = family.create({
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
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
      immunities: ["undead"],
      items: {
        remove: ["ring95", "ring99", "undtype"],
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
    abilities: abilityOrderService.sortByPriority([
      family.preset(SPELLS.Wizard.Vocalize.file),
      family.preset(SPELLS.Wizard.MirrorImages.file),
      family.preset(SPELLS.Wizard.GreaterMalison.file),
      family.preset(SPELLS.Wizard.Emotion.file),
      family.preset(SPELLS.Wizard.MinorSpellDeflection.file),
      family.preset(SPELLS.Wizard.Shield.file),
      family.preset(SPELLS.Wizard.Haste.file),
      family.preset(SPELLS.Wizard.Slow.file),
      family.preset(SPELLS.Wizard.SpellThrust.file),
      family.preset(SPELLS.Wizard.Spook.file),
      family.preset(SPELLS.Wizard.StinkingCloud.file),
      family.preset(SPELLS.Wizard.MelfAcidArrow.file),
      family.preset(SPELLS.Wizard.MagicMissiles.file),
      family.preset(SPELLS.Wizard.ChromaticOrb.file),
      family.preset(SPELLS.Wizard.Glitterdust.file),
    ]),
  });
  skeleton.setAdjustments([
    {
      files: ["GHASTSU"],
      data: { level1: 3 },
    },
    {
      files: ["KRYSKEL"],
      data: { level1: 2 },
    },
    {
      files: ["SKELLESU"],
      data: { level1: 3 },
    },
    {
      files: ["BDSKGR05"],
      data: { level1: 4, xpv: 175 },
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
  ]);
  greaterSkeleton(skeleton);
  mageSkeleton(skeleton);
  return skeleton;
}

export function archerSkeleton(family: UndeadFamily): Undead {
  const archer = family.create({
    monster: MonsterEnum.ArcherSkeleton,
    name: "monster.undead.name.archerSkeleton",
    files: [],
    data: {
      level1: 2,
      strength: 10,
      dexterity: 14,
      constitution: 9,
      intelligence: 1,
      wisdom: 8,
      charisma: 5,
      ac: 7,
      apr: 1,
      thac0: 19,
      xpv: 175,
      alignment: "NEUTRAL",
      morale: 20,
      general: "UNDEAD",
      race: "SKELETON",
      class: "SKELETON",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
      immunities: ["undead"],
      items: {
        remove: ["ring95", "ring99"],
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
  archer.addTrait({
    immunities: ["skeletal"],
  });
  archer.setBehavior({
    restHeal: true,
  });
  archer.setAttack({
    ranged: true,
  });
  archer.setAdjustments([
    {
      files: ["SKELACI", "SKELICE", "SKELFIRE"],
      // original thac0: 14-15
      data: { level1: 2, xpv: 120 },
    },
    {
      files: ["SKELDIS"],
      // original thac0: 12
      data: { level1: 3, xpv: 120 },
    },
    {
      files: ["BDSKGR06"],
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
  ]);
  return archer;
}

function greaterSkeleton(base: Undead): Variant {
  return base.variant("Greater Skeleton", {
    data: { level1: 6, strength: 12, dexterity: 16, constitution: 11, ac: 6 },
    files: ["SKELGRSU"],
  });
}

function mageSkeleton(base: Undead): Variant {
  return base.variant("Mage Skeleton", {
    data: {},
    files: ["BDSKGR07", "BDTEAM60"],
    adjust: [
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
    ],
  });
}

export function skeletonWarrior(family: UndeadFamily): Undead {
  const warrior = family.create({
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
      size: { value: "Medium", tall: true, long: false },
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
  skeletonWarriorFearAura(warrior);
  warrior.setBehavior({
    restHeal: true,
    abilities: [family.ability(Ids.SkeletonWarriorFearAura)],
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

export function baneguard(family: UndeadFamily): Undead {
  const baneguard = family.create({
    monster: MonsterEnum.Baneguard,
    name: "monster.undead.name.baneguard",
    files: [],
    data: {
      level1: 4,
      bonusHp: 4,
      level2: 3, // for magic missiles as a level 3 wizard
      strength: 16, // 19 in vanilla
      dexterity: 11,
      constitution: 9,
      intelligence: 1,
      wisdom: 8,
      charisma: 5,
      ac: 7,
      apr: 1, // 3 in vanilla
      xpv: 975,
      alignment: "NEUTRAL_EVIL",
      morale: 12,
      general: "UNDEAD",
      race: "SKELETON",
      class: "FIGHTER_MAGE", // SKELETON_BANEGUARD
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
      immunities: ["undead"],
      items: {
        remove: ["ring95", "ring99"],
      },
      spells: {
        memorized: [{ file: SPELLS.Wizard.MagicMissiles.file, memorizedCount: 1 }],
      },
    },
  });
  baneguard.addTrait({
    immunities: ["skeletal"],
  });
  blink(baneguard);
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
      family.ability(Ids.Blink),
    ],
  });
  baneguard.setAttack({
    ranged: true,
  });
  return baneguard;
}

export function bonebat(family: UndeadFamily): Undead {
  const bonebat = family.create({
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
      size: { value: "Medium", tall: false, long: true },
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
  bonebatTouch(bonebat);
  bonebat.createJaws(
    2,
    4,
    [
      {
        spell: family.spell(Ids.BonebatTouch).file,
      },
    ],
    "WEAPON1",
  );
  bonebat.setBehavior({
    restHeal: true,
  });
  return bonebat;
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

export function deathShade(family: UndeadFamily): Undead {
  const shade = family.create({
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
      size: { value: "Medium", tall: true, long: false },
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
  bonebatTouch(shade);
  shade.createJaws(
    2,
    4,
    [
      {
        spell: family.spell(Ids.BonebatTouch).file,
      },
    ],
    "WEAPON1",
  );
  shade.setBehavior({
    restHeal: true,
  });
  return shade;
}
