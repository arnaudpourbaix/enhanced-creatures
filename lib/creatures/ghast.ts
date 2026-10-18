import effectFactory from "../src/factories/effect.factory";
import { Variant } from "../src/model/creature/variant";
import { Durations } from "../src/model/game-data/durations";
import { BaseEffect } from "../src/model/spell-item/effect";
import {
  EffectDispelResistanceEnum,
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
  CarrionStench,
  GhastTouch,
}

function ghastTouch(cre: Creature) {
  return cre.addSpell({
    name: "monster.undead.ability.ghastTouch.name",
    description: "monster.undead.ability.ghastTouch.description",
    id: Ids.GhastTouch,
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
            duration: 7 * Durations.round,
            saveType: SaveTypeEnum.ParalyzePoisonDeath,
          }),
        ],
      },
    ],
  });
}

function carrionStench(cre: Creature) {
  const base: BaseEffect = {
    saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
    saveBonus: -2,
    timing: EffectTimingEnum.InstantLimited,
    duration: 2 * Durations.round,
    dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
  };
  return cre.addSpell({
    name: "monster.undead.ability.carrionStench.name",
    keywords: ["area"],
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
            type: EffectStatisticModifierEnum.Increment,
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
        castOnSelf: true,
      },
      range: 5,
    },
  });
}

export function ghast(entry: CreatureEntry<Creature>): Creature {
  const ghast = entry.create({
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
      animation: "GHAST",
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
  createClaws(ghast, {
    diceThrown: 1,
    diceSize: 4,
    castSpell: {
      spell: entry.spell(Ids.GhastTouch).file,
    },
  });
  createJaws(ghast, 1, 8, [
    {
      spell: entry.spell(Ids.GhastTouch).file,
    },
  ]);
  carrionStench(ghast);
  ghast.setBehavior({
    restHeal: true,
    abilities: [entry.ability(Ids.CarrionStench)],
  });
  greaterGhastVariant(ghast);
  lacedonVariant(ghast);
  ghast.turnAs = "ghast";
  return ghast;
}

function greaterGhastVariant(base: Creature): Variant {
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

function lacedonVariant(base: Creature): Variant {
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

export const createGhastEntry = () => new SimpleEntry(EntryEnum.Ghast, [ghast]);
