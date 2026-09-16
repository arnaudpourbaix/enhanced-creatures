import { SPELLS } from "../../config/spells/spell-names";
import { CommonProjectileFiles } from "../../spells/projectiles";
import effectFactory from "../../src/factories/effect.factory";
import { Durations } from "../../src/model/game-data/durations";
import {
  EffectStatisticModifierEnum,
  EffectTimingEnum,
  ItemAbilityLocationEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum } from "../monster";
import type { UndeadFamily } from "./family";
import { Ids } from "./ids";
import { Undead } from "./undead-creature";

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
        type: EffectStatisticModifierEnum.Increment,
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
