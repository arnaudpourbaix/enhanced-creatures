import { SPELLS } from "../../config/spells/spell-database";
import { InputCreatureData } from "../../src/model/creature/data-input";
import { Variant } from "../../src/model/creature/variant";
import { ProficiencyTypeEnum, RegenerationTypeEnum } from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum } from "../monster";
import type { OgreFamily } from "./family";
import { Ids } from "./ids";
import { Ogre } from "./ogre-creature";

export function ogreMage(family: OgreFamily): Ogre {
  const ogreMage = family.create({
    monster: MonsterEnum.OgreMage,
    name: "monster.ogre.name.mage",
    files: [],
    data: {
      level1: 5,
      level2: 5,
      bonusHp: 2,
      strength: 18,
      exceptionalStrength: 100,
      dexterity: 10,
      constitution: 17,
      intelligence: 16,
      wisdom: 14,
      charisma: 17,
      ac: 4,
      apr: 1,
      xpv: 650,
      alignment: "LAWFUL_EVIL",
      morale: 14,
      general: "GIANTHUMANOID",
      race: "OGRE",
      class: "OGRE_MAGE",
      kit: "TRUECLASS",
      gender: "MALE",
      size: { value: "Large", tall: true, long: false },
      movement: 9,
      immunities: ["giant"],
      proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYHALBERD, value: 2 }],
      items: {
        remove: [
          "REGHP1",
          "BDOGRE03",
          "HELMNOAN",
          "SW1H43",
          "SW1H01",
          "SW2H01",
          "SW1H20",
          "COMPS01",
          "COMPS02",
          "OGREMASU",
          "BLUN06",
          "BLUN15",
          "PLAT01",
          "SHLD03",
          "HELM01",
          "PALRING",
        ],
      },
      script: {
        remove: ["BDOGRE03", "OGREMASU", "BDFMAG01", "BDFMAG23", "MAGE3", "YSOGMAGE"],
      },
      spells: {
        memorized: [
          { file: SPELLS.Wizard.Invisibility.file, memorizedCount: 1 },
          { file: SPELLS.Wizard.Darkness15Radius.file, memorizedCount: 1 },
          { file: SPELLS.Wizard.CharmPerson.file, memorizedCount: 1 },
          { file: SPELLS.Wizard.Sleep.file, memorizedCount: 1 },
        ],
      },
    },
  });
  ogreMage.createNaginata();
  ogreMage.data.movement.bindItem(family.item(Ids.Naginata).file);
  ogreMage.createConeOfCold();
  ogreMage.createFly();
  ogreMage.createGaseousForm();
  ogreMage.addTrait({
    effects: [
      {
        opcode: EffectTypeEnum.Regeneration,
        type: RegenerationTypeEnum.OneHPperAmountSeconds,
        amount: 6,
      },
    ],
  });
  ogreMage.setBehavior({
    restHeal: true,
    usePotions: true,
    abilities: [
      {
        preset: SPELLS.Wizard.Invisibility.file,
        spell: {
          type: "noDec",
        },
        timer: {
          name: "invisible",
          value: 12,
        },
      },
      family.ability(Ids.Fly),
      family.preset(SPELLS.Wizard.Domination.file),
      family.ability(Ids.ConeOfCold),
      family.preset(SPELLS.Wizard.DireCharm.file),
      {
        preset: SPELLS.Wizard.Darkness15Radius.file,
        spell: {
          type: "noDec",
        },
        timer: { name: "darkness", value: 60 },
      },
      family.preset(SPELLS.Wizard.PowerWordSleep.file),
      family.preset(SPELLS.Wizard.Sleep.file),
      family.preset(SPELLS.Wizard.CharmPerson.file),
      family.ability(Ids.GaseousForm),
    ],
  });
  ogreMage.setAttack({
    targetPriorities: [
      {
        // The ogres fight more wisely when led by a half-ogre that concentrates assaults on characters it recognizes as spellcasters and teaming up against skilled fighters.
        targets: ["PCSpellcasters", "PCsPreferringStrong"],
      },
    ],
  });
  chieftainVariant(family, ogreMage);
  return ogreMage;
}

function chieftainVariant(family: OgreFamily, base: Ogre): Variant {
  // Shared profile for Krotan/Ntkrotan/Kahrk before their own level/proficiency bump.
  const krotanChief: InputCreatureData = {
    level1: 12,
    level2: 12,
    strength: 19,
    class: "FIGHTER_MAGE",
    xpv: 3500,
    proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYHALBERD, value: 5 }],
    spells: {
      memorized: [
        { file: SPELLS.Wizard.Domination.file, memorizedCount: 1 },
        { file: family.spell(Ids.ConeOfCold).file, memorizedCount: 2 },
        { file: SPELLS.Wizard.DireCharm.file, memorizedCount: 4 },
        { file: SPELLS.Wizard.PowerWordSleep.file, memorizedCount: 4 },
        { file: SPELLS.Wizard.CharmPerson.file, memorizedCount: 3 },
        { file: SPELLS.Wizard.Sleep.file, memorizedCount: 3 },
      ],
    },
  };
  // ogre magi will be led by a chief of great strength (+2 on each Hit Die, attacking and saving as a 9 Hit Dice monster)
  return base.variant("Chieftain", {
    files: [
      "BDWAVE16",
      "WIOGMA01",
      "WIGENTLE",
      "DROTH",
      "BDMURS",
      "BDMURS2",
      "UHOGRE01",
      "KROTAN",
      "NTKROTAN",
      "KAHRK",
      "PLSHOM01",
      "PALKNI01",
    ],
    data: {
      bonusHpPerHitDie: 2,
      xpv: 975,
    },
    autoGenerate: {
      thac0: { level: 9 },
      savingThrows: { level: 9 },
    },
    adjust: [
      {
        files: ["BDWAVE16", "WIOGMA01", "WIGENTLE", "DROTH"],
        data: {
          level1: 7,
          level2: 7,
          xpv: 1400,
          class: "FIGHTER_MAGE",
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYHALBERD, value: 4 }],
          spells: {
            memorized: [
              { file: SPELLS.Wizard.DireCharm.file, memorizedCount: 1 },
              { file: SPELLS.Wizard.PowerWordSleep.file, memorizedCount: 2 },
              { file: SPELLS.Wizard.CharmPerson.file, memorizedCount: 1 },
              { file: SPELLS.Wizard.Sleep.file, memorizedCount: 1 },
            ],
          },
        },
      },
      {
        files: ["BDMURS", "BDMURS2", "UHOGRE01"],
        data: {
          level1: 9,
          level2: 9,
          xpv: 2000,
          class: "FIGHTER_MAGE",
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYHALBERD, value: 5 }],
          spells: {
            memorized: [
              { file: family.spell(Ids.ConeOfCold).file, memorizedCount: 1 },
              { file: SPELLS.Wizard.DireCharm.file, memorizedCount: 2 },
              { file: SPELLS.Wizard.PowerWordSleep.file, memorizedCount: 2 },
              { file: SPELLS.Wizard.CharmPerson.file, memorizedCount: 2 },
              { file: SPELLS.Wizard.Sleep.file, memorizedCount: 2 },
            ],
          },
        },
      },
      {
        files: ["PALKNI01"],
        data: { level1: 10, level2: 10 },
      },
      {
        files: ["KAHRK"],
        noWeapon: true,
        data: {
          ...krotanChief,
          proficiencies: [
            ...(krotanChief.proficiencies ?? []),
            { type: ProficiencyTypeEnum.PROFICIENCYKATANA, value: 5 },
          ],
        },
      },
      {
        files: ["KROTAN", "NTKROTAN"],
        data: { ...krotanChief, level1: 15, level2: 15, xpv: 4000 },
      },
    ],
  });
}
