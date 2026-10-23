import { CommonProjectileFiles } from "../spells/projectiles";
import effectFactory from "../src/factories/effect.factory";
import { Durations } from "../src/model/game-data/durations";
import { BaseEffect } from "../src/model/spell-item/effect";
import {
  DiseaseTypeEnum,
  EffectDispelResistanceEnum,
  EffectIDSFileEnum,
  EffectStatisticModifierEnum,
  EffectTimingEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  PortraitIconEnum,
  RemoveEffectsByResourceTypeEnum,
  SaveTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import {
  SpellProtectionRelation,
  SpellProtectionStat,
} from "../src/model/spell-item/spell-protection";
import { MonsterEnum } from "./monster";
import { Creature } from "../src/model/creature/creature";
import type { CreatureEntry } from "../src/model/creature/entry";
import { EntryEnum } from "./entry";
import { SimpleEntry } from "../src/model/creature/simple-entry";
import { createClaws, createJaws } from "./types/undead";

enum Ids {
  AuraOfEvil,
  GhoulTouch,
  GhoulLordTouch,
  GhoulRottingDisease,
}

function ghoulTouch(cre: Creature) {
  return cre.addSpell({
    name: "monster.ghoul.ability.touch.name",
    description: "monster.ghoul.ability.touch.description",
    id: Ids.GhoulTouch,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    keywords: ["hold"],
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

function ghoulLordTouch(cre: Creature) {
  return cre.addSpell({
    name: "monster.ghoul.ability.lordTouch.name",
    description: "monster.ghoul.ability.lordTouch.description",
    id: Ids.GhoulLordTouch,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    keywords: ["hold"],
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

function ghoulRottingDisease(cre: Creature) {
  // PnP: Loose 10 hit points and 1 point from their Constitution and Charisma scores each day
  // Disease can be cured and thus, we can't reapply disease each day
  // Also, time is a bit different in game and I have replaced days by 8 hours (a rest)
  // Instead of gradually loosing con and cha, I have set a one time disease with -4
  return cre.addSpell({
    name: "monster.ghoul.ability.rottingDisease.name",
    description: "monster.ghoul.ability.rottingDisease.description",
    id: Ids.GhoulRottingDisease,
    secondaryType: "Disease",
    keywords: ["disease"],
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

function auraOfEvil(cre: Creature) {
  // Ghoul lords do radiate an aura of evil. In fact, this effect is so potent that those of good alignment suffer a -4 on all attack rolls when within 30 feet of these creatures.
  // In addition, all persons who are forced to make a fear or horror check because of an encounter with a ghoul lord must do so with a -2 penalty.
  const base: BaseEffect = {
    timing: EffectTimingEnum.InstantLimited,
    duration: Durations.round,
    dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
  };
  return cre.addSpell({
    name: "monster.ghoul.ability.auraOfEvil.name",
    keywords: ["area"],
    description: "monster.ghoul.ability.auraOfEvil.description",
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
            stringRef: "monster.ghoul.ability.auraOfEvil.message",
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
        type: EffectStatisticModifierEnum.Increment,
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
        castOnSelf: true,
      },
    },
  });
}

export function ghoul(entry: CreatureEntry<Creature>): Creature {
  const ghoul = entry.create({
    monster: MonsterEnum.Ghoul,
    name: "monster.ghoul.name.ghoul",
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
      size: { value: "Medium", tall: true, long: false },
      movement: 9,
      immunities: ["undead"],
      items: {
        remove: ["ring95", "ghoul1", "ringkora", "LACEDO"],
      },
      script: {
        remove: ["ghoul"],
      },
    },
  });
  ghoulTouch(ghoul);
  createClaws(ghoul, {
    diceThrown: 1,
    diceSize: 3,
    castSpell: {
      spell: entry.spell(Ids.GhoulTouch).file,
    },
  });
  createJaws(ghoul, 1, 6, [
    {
      spell: entry.spell(Ids.GhoulTouch).file,
    },
  ]);
  ghoul.setBehavior({
    restHeal: true,
  });
  ghoul.setAdjustments([{ files: ["KORAX"], data: { level1: 4 } }]);
  return ghoul;
}

export function ghoulLord(entry: CreatureEntry<Creature>): Creature {
  const lord = entry.create({
    monster: MonsterEnum.GhoulLord,
    name: "monster.ghoul.name.lord",
    files: [],
    data: {
      level1: 6,
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
      size: { value: "Medium", tall: true, long: false },
      movement: 15,
      immunities: ["undead"],
      items: {
        remove: ["ring95", "ghast1", "BDGHASTG", "ghoul1", "GHOULLOR", "IMMUNE1"],
      },
      script: {
        remove: ["ghoul", "ghast", "BDGHASTG", "gholor01", "riftcr01"],
      },
    },
  });
  lord.addTrait({ immunities: ["nonSilverNonMagicalWeapons"] });
  ghoulLordTouch(lord);
  ghoulRottingDisease(lord);
  auraOfEvil(lord);
  createClaws(lord, {
    diceThrown: 1,
    diceSize: 6,
    castSpell: {
      spell: entry.spell(Ids.GhoulLordTouch).file,
    },
  });
  createJaws(lord, 1, 10, [
    {
      spell: entry.spell(Ids.GhoulLordTouch).file,
    },
    {
      spell: entry.spell(Ids.GhoulRottingDisease).file,
      saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
    },
  ]);
  lord.setBehavior({
    restHeal: true,
    abilities: [entry.ability(Ids.AuraOfEvil)],
  });
  lord.setAdjustments([]);
  lord.turnAs = "mummy"; // PHB: turned as a 7 HD monster (the mummy row)
  return lord;
}

export const createGhoulEntry = () => new SimpleEntry(EntryEnum.Ghoul, [ghoul, ghoulLord]);
