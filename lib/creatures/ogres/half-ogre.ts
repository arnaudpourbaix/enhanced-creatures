import { QUICK_SLOTS } from "../../src/model/creature/item";
import { ProficiencyTypeEnum } from "../../src/model/spell-item/effect.enums";
import { MonsterEnum } from "../monster";
import type { OgreFamily } from "./family";
import { Ids } from "./ids";
import { Ogre } from "./ogre-creature";

export function halfOgre(family: OgreFamily): Ogre {
  const halfOgre = family.create({
    monster: MonsterEnum.HalfOgre,
    name: "monster.ogre.name.half",
    files: [],
    data: {
      level1: 2,
      bonusHp: 6,
      strength: 17,
      dexterity: 10,
      constitution: 14,
      intelligence: 9,
      wisdom: 9,
      charisma: 10,
      ac: 5,
      apr: 1,
      xpv: 175,
      alignment: "CHAOTIC_EVIL",
      morale: 12,
      general: "GIANTHUMANOID",
      race: "OGRE",
      class: "OGRE_HALFOGRE",
      kit: "TRUECLASS",
      size: { value: "Large", tall: true, long: false },
      movement: 12,
      immunities: ["giant"],
      proficiencies: [
        { type: ProficiencyTypeEnum.PROFICIENCYBASTARDSWORD, value: 2 },
        { type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 2 },
      ],
      items: {
        remove: ["B1-2", "HELMNOAN"],
      },
      script: {
        remove: ["HALFOGRE"],
      },
    },
  });
  halfOgre.createFists({ diceThrown: 2, diceSize: 4, id: Ids.HalfOgre, equipped: false });
  halfOgre.setBehavior({
    restHeal: true,
    usePotions: true,
  });
  halfOgre.setAttack({
    targetPriorities: [
      {
        // The ogres fight more wisely when led by a half-ogre that concentrates assaults on characters it recognizes as spellcasters and teaming up against skilled fighters.
        targets: ["PCSpellcasters", "PCsPreferringStrong"],
      },
    ],
  });
  halfOgre.setAdjustments([
    {
      // Veteran with 5+3 Hit Dice.
      files: ["BDOGRE04", "ARGHAI", "GORF", "GORF03"],
      data: {
        level1: 5,
        bonusHp: 3,
        strength: 18,
        ac: 3,
        xpv: 520,
      },
    },
    {
      files: ["GORF", "GORF03"],
      data: {
        exceptionalStrength: 50,
      },
    },
    {
      files: ["GORF03"],
      data: {
        level1: 8,
      },
    },
    {
      files: ["ARGHAI"],
      data: {
        exceptionalStrength: 100,
      },
    },
    {
      files: ["BDOGRE04"],
      data: {
        exceptionalStrength: 83,
      },
    },
    {
      // Level 9 fighter
      files: ["TAZOK", "TAZOK2", "D9TAZOK", "D9TAZOKX", "L#CHIEN"],
      data: {
        level1: 9,
        strength: 18,
        ac: 10,
        class: "FIGHTER",
        morale: 20,
        xpv: 4000,
      },
    },
    {
      // Tazok gets the Berserker kit; the per-game level blocks below then each add their own
      // rage-count increment on top of this (kit.service resolves the inherited kit).
      files: ["TAZOK", "TAZOK2", "D9TAZOK", "D9TAZOKX"],
      data: {
        kit: "BERSERKER",
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 5 }],
      },
    },
    {
      // Tazok, level 19
      files: ["TAZOK", "D9TAZOK", "D9TAZOKX"],
      game: "bg2",
      data: {
        level1: 19,
        xpv: 8000,
      },
    },
    {
      // Tazok, level 11
      files: ["TAZOK2"],
      data: {
        level1: 11,
        items: {
          equipped: [{ file: "POTN02", quantity: 1, slot: QUICK_SLOTS }],
        },
      },
    },
    {
      // Eglarh, level 9 fighter
      files: ["L#CHIEN"],
      data: {
        immunities: ["fireResistance", "coldResistance", "missileDamage"],
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD, value: 5 }],
      },
    },
  ]);
  return halfOgre;
}
