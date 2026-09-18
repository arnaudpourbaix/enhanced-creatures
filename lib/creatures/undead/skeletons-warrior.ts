import { SPELLS } from "../../config/spells/spell-names";
import { CommonProjectileFiles } from "../../spells/projectiles";
import effectFactory from "../../src/factories/effect.factory";
import { Variant } from "../../src/model/creature/variant";
import { Durations } from "../../src/model/game-data/durations";
import {
  EffectStatisticModifierEnum,
  EffectTimingEnum,
  ItemAbilityLocationEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  ProficiencyTypeEnum,
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
      bonusHp: 7, // +2 to +12
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
  warrior.setAdjustments([{ files: ["C0DESUM4"], data: { class: "FIGHTER" } }]);
  greaterSkeletonWarriorVariant(warrior);
  return warrior;
}

function greaterSkeletonWarriorVariant(base: Undead): Variant {
  const proficiencies = [
    { type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 5 },
    { type: ProficiencyTypeEnum.PROFICIENCYFLAILMORNINGSTAR, value: 5 },
    { type: ProficiencyTypeEnum.PROFICIENCYLONGBOW, value: 5 },
  ];
  return base.variant("Greater Skeleton Warrior", {
    data: {
      level1: 13,
      bonusHp: 12,
      class: "FIGHTER",
      xpv: 6000,
    },
    files: [
      "ICHARY",
      "HGSKL04",
      "ANSCELET",
      "C0DESUM5",
      "SKELWA03",
      "FIRMON02",
      "GOLBON01",
      "D9SKL04",
      "D9SKL09",
    ],
    adjust: [
      {
        files: ["ANSCELET"],
        data: { proficiencies },
      },
      {
        files: ["GOLBON01"],
        data: {
          level1: 14,
          ac: -3,
        },
      },
      {
        files: ["ICHARY", "C0DESUM5"],
        data: {
          proficiencies,
          level1: 15,
        },
      },
      {
        files: ["HGSKL04", "D9SKL04", "D9SKL09"],
        data: {
          proficiencies,
          level1: 20,
          ac: -6,
          xpv: 8000,
        },
      },
    ],
  });
}
