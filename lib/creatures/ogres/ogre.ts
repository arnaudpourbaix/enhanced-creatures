import { InputCreatureData } from "../../src/model/creature/data-input";
import { Variant } from "../../src/model/creature/variant";
import { ProficiencyTypeEnum } from "../../src/model/spell-item/effect.enums";
import { MonsterEnum } from "../monster";
import type { OgreFamily } from "./family";
import { Ids } from "./ids";
import { Ogre } from "./ogre-creature";

export function ogre(family: OgreFamily): Ogre {
  const ogre = family.create({
    monster: MonsterEnum.Ogre,
    name: "monster.ogre.name.ogre",
    files: [],
    data: {
      level1: 4,
      bonusHp: 1,
      strength: 19,
      dexterity: 8,
      constitution: 16,
      intelligence: 8,
      wisdom: 7,
      charisma: 7,
      ac: 5,
      apr: 1,
      xpv: 270,
      alignment: "CHAOTIC_EVIL",
      morale: 12,
      general: "GIANTHUMANOID",
      race: "OGRE",
      class: "OGRE",
      size: { value: "Large", tall: true, long: false },
      movement: 9,
      immunities: ["giant"],
      proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 2 }],
      items: {
        remove: [
          "OGRE1",
          "B1-2",
          "B3-12",
          "B2-16",
          "BLUN02",
          "BLUN06",
          "BLUN07",
          "SHLD03",
          "SW2H01",
          "B1-12M3",
          "HELMNOAN",
          "HELM01",
          "LEAT04",
        ],
      },
      script: {
        remove: ["OGRE"],
      },
    },
  });
  ogre.createFists({ diceSize: 1, diceThrown: 10, id: Ids.Ogre });
  ogre.createFists({ diceThrown: 2, diceSize: 6, id: Ids.OgreLeader, equipped: false });
  ogre.setBehavior({
    restHeal: true,
    usePotions: true,
  });
  ogre.setAttack({
    ranged: true,
    targetPriorities: [
      {
        // The ogres fight more wisely when led by a half-ogre that concentrates assaults on characters it recognizes as spellcasters and teaming up against skilled fighters.
        targets: ["PCSpellcasters", "PCsPreferringStrong"],
      },
    ],
  });
  ogre.setAdjustments([
    {
      files: ["X3HOGRE", "X3HOGRE2", "X3HOGRED"],
      data: { script: { location: "None" } },
    },
    { files: ["OOPAH", "WELT"], data: { class: "INNOCENT" } },
    { files: ["OOPAH", "OOPAH2"], data: { level1: 5 } },
    {
      // will have morning star +1
      files: ["AC#FP2OT"],
      noWeapon: true,
      data: {
        items: { equipped: [{ file: "BLUN07", slot: "WEAPON1" }] },
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYFLAILMORNINGSTAR, value: 2 }],
      },
    },
    {
      files: ["UHOGRE02"],
      noWeapon: true,
    },
  ]);
  leaderVariant(family, ogre);
  chieftainVariant(family, ogre);
  return ogre;
}

function leaderVariant(family: OgreFamily, base: Ogre): Variant {
  return base.variant("Leader", {
    // leader is a 7 Hit Dice monster with Armor Class 3, Strenth 18/50, XP 650
    // He inflicts 2d6 points of damage per attack.
    files: ["SEWERF4", "BDOGREM", "NTOGREDA", "BOGRE1", "OHNOGREB"],
    data: {
      level1: 7,
      ac: 3,
      xpv: 650,
      items: {
        equipped: [{ file: family.item(Ids.OgreLeader).file, slot: "WEAPON1" }],
      },
    },
    adjust: [
      {
        files: ["NTOGREDA"],
        noWeapon: true,
        data: {
          class: "FIGHTER",
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 4 }],
        },
      },
    ],
  });
}

function chieftainVariant(family: OgreFamily, base: Ogre): Variant {
  const chieftain: InputCreatureData = {
    level1: 9,
    morale: 18,
    class: "FIGHTER",
    xpv: 2000,
    proficiencies: [
      { type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 5 },
      { type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD, value: 5 },
    ],
  };
  return base.variant("Chieftain", {
    // chieftain is a 7+4 Hit Dice monster with Armor Class 2, Strenth 18/100, XP 975
    // He inflicts 2d6+6 points of damage per attack.
    files: [
      "AC#WRIM1",
      "AC#FP2O1",
      "BDSOGR1",
      "BDSOGR2",
      "ACQ13002",
      "HACK",
      "LARZE",
      "GORF",
      "UDOGRE",
      "CBELHOE",
      "WIOGRE02",
      "SHTHASS3",
      "BDCCOGR1",
    ],
    data: {
      level1: 7,
      bonusHp: 4,
      ac: 2,
      xpv: 975,
      items: {
        equipped: [{ file: family.item(Ids.OgreLeader).file, slot: "WEAPON1" }],
      },
    },
    adjust: [
      {
        files: ["GORF"],
        data: chieftain,
      },
      {
        files: ["BDSOGR1", "BDSOGR2"],
        noWeapon: true,
        data: {
          // will have morning star +1
          items: { equipped: [{ file: "BLUN07", slot: "WEAPON1" }] },
          class: "FIGHTER",
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYFLAILMORNINGSTAR, value: 4 }],
        },
      },
      {
        files: ["SHTHASS3"],
        data: { level1: 8 },
      },
      {
        files: ["AC#WRIM1"],
        data: { ...chieftain, level1: 10 },
      },
      {
        files: ["HACK", "WIOGRE02"],
        data: { ...chieftain, level1: 11 },
      },
      {
        files: ["CBELHOE"],
        data: { ...chieftain, level1: 11, apr: 2 },
      },
      {
        files: ["LARZE"],
        data: { ...chieftain, level1: 13 },
      },
      {
        files: ["UDOGRE"],
        data: { level1: 15, ac: -3, xpv: 3000 },
      },
    ],
  });
}
