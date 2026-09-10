/**
 * Ghouls: ghoul, ghast, ghoul lord.
 *
 * Shared weapon primitives live on `Undead` (undead-creature.ts); ability ids in ids.ts.
 */
import effectFactory from "../../src/factories/effect.factory";
import { CommonProjectileFiles } from "../../spells/projectiles";
import { Durations } from "../../src/model/game-data/durations";
import { BaseEffect } from "../../src/model/spell-item/effect";
import {
  DiseaseTypeEnum,
  EffectDispelResistanceEnum,
  EffectIDSFileEnum,
  EffectModifierTypeEnum,
  EffectTimingEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  PortraitIconEnum,
  RemoveEffectsByResourceTypeEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import {
  SpellProtectionRelation,
  SpellProtectionStat,
} from "../../src/model/spell-item/spell-protection";
import { MonsterEnum } from "../monster";
import { Ids } from "./ids";
import type { UndeadFamily } from "./family";
import { Undead } from "./undead-creature";
import { Variant } from "../../src/model/creature/variant";

function ghoulTouch(cre: Undead) {
  return cre.addSpell({
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

function ghastTouch(cre: Undead) {
  return cre.addSpell({
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

function ghoulLordTouch(cre: Undead) {
  return cre.addSpell({
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

function carrionStench(cre: Undead) {
  const base: BaseEffect = {
    saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
    saveBonus: -2,
    timing: EffectTimingEnum.InstantLimited,
    duration: 2 * Durations.round,
    dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
  };
  return cre.addSpell({
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

function ghoulRottingDisease(cre: Undead) {
  // PnP: Loose 10 hit points and 1 point from their Constitution and Charisma scores each day
  // Disease can be cured and thus, we can't reapply disease each day
  // Also, time is a bit different in game and I have replaced days by 8 hours (a rest)
  // Instead of gradually loosing con and cha, I have set a one time disease with -4
  return cre.addSpell({
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

function auraOfEvil(cre: Undead) {
  // Ghoul lords do radiate an aura of evil. In fact, this effect is so potent that those of good alignment suffer a -4 on all attack rolls when within 30 feet of these creatures.
  // In addition, all persons who are forced to make a fear or horror check because of an encounter with a ghoul lord must do so with a -2 penalty.
  const base: BaseEffect = {
    timing: EffectTimingEnum.InstantLimited,
    duration: Durations.round,
    dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
  };
  return cre.addSpell({
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

export function ghoul(family: UndeadFamily): Undead {
  const ghoul = family.create({
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
  ghoul.createClaws({
    diceThrown: 1,
    diceSize: 3,
    castSpell: {
      spell: family.spell(Ids.GhoulTouch).file,
    },
  });
  ghoul.createJaws(1, 6, [
    {
      spell: family.spell(Ids.GhoulTouch).file,
    },
  ]);
  ghoul.setBehavior({
    restHeal: true,
  });
  ghoul.setAdjustments([{ files: ["KORAX"], data: { level1: 4 } }]);
  return ghoul;
}

export function ghast(family: UndeadFamily): Undead {
  const ghast = family.create({
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
      size: { value: "Medium", tall: true, long: false },
      movement: 15,
      immunities: ["undead"],
      items: {
        remove: ["ring95", "ghast1", "LACEDO", "LACEDO02", "BDGHASTG"],
      },
      script: {
        remove: ["movep1", "ghast", "ghastd", "bpundead"],
      },
    },
  });
  ghastTouch(ghast);
  ghast.createClaws({
    diceThrown: 1,
    diceSize: 4,
    castSpell: {
      spell: family.spell(Ids.GhastTouch).file,
    },
  });
  ghast.createJaws(1, 8, [
    {
      spell: family.spell(Ids.GhastTouch).file,
    },
  ]);
  carrionStench(ghast);
  ghast.setBehavior({
    restHeal: true,
    abilities: [family.ability(Ids.CarrionStench)],
  });
  greaterGhastVariant(ghast);
  lacedonVariant(ghast);
  return ghast;
}

function greaterGhastVariant(base: Undead): Variant {
  return base.variant("Greater Ghast", {
    data: { level1: 8, strength: 18, exceptionalStrength: 100, xpv: 975 },
    files: ["CD41COR", "BDJUNIA2", "GRAEL", "GRON", "GMAYOR", "THESHAL", "GHASTGSU", "WICULT1"],
    adjust: [
      {
        files: ["GRAEL"],
        data: {
          level1: 15,
          xpv: 5000,
          ac: -4,
        },
      },
      { files: ["BDJUNIA2"], noWeapon: true },
      { files: ["CD41COR"], data: { level1: 10 } },
    ],
  });
}

function lacedonVariant(base: Undead): Variant {
  const lacedon = base.variant("Lacedon", {
    data: { level1: 5, strength: 18 },
    files: ["AC#DTLAC", "LACEDO01", "SAHLACE"],
  });
  greaterLacedonVariant(lacedon);
  return lacedon;
}

function greaterLacedonVariant(lacedon: Variant): Variant {
  return lacedon.variant("Greater Lacedon", {
    data: { level1: 9, strength: 19, xpv: 1800 },
    files: ["AC#DT01L", "LACEDO02"],
  });
}

export function ghoulLord(family: UndeadFamily): Undead {
  const lord = family.create({
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
  lord.createClaws({
    diceThrown: 1,
    diceSize: 6,
    castSpell: {
      spell: family.spell(Ids.GhoulLordTouch).file,
    },
  });
  lord.createJaws(1, 10, [
    {
      spell: family.spell(Ids.GhoulLordTouch).file,
    },
    {
      spell: family.spell(Ids.GhoulRottingDisease).file,
      saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
    },
  ]);
  lord.setBehavior({
    restHeal: true,
    abilities: [family.ability(Ids.AuraOfEvil)],
  });
  lord.setAdjustments([]);
  return lord;
}
