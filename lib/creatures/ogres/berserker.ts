import { Variant } from "../../src/model/creature/variant";
import { ProficiencyTypeEnum } from "../../src/model/spell-item/effect.enums";
import { MonsterEnum } from "../monster";
import type { OgreFamily } from "./family";
import { Ogre } from "./ogre-creature";

export function berserker(family: OgreFamily): Ogre {
  const berserker = family.create({
    monster: MonsterEnum.OgreBerserker,
    name: "monster.ogre.name.berserker",
    files: [],
    data: {
      level1: 4,
      bonusHp: 1,
      strength: 18,
      exceptionalStrength: 100,
      dexterity: 8,
      constitution: 17,
      intelligence: 8,
      wisdom: 7,
      charisma: 7,
      ac: 3,
      apr: 1,
      xpv: 650,
      alignment: "CHAOTIC_EVIL",
      morale: 12,
      general: "GIANTHUMANOID",
      race: "OGRE",
      class: "FIGHTER",
      kit: "BERSERKER",
      size: { value: "Large", tall: true, long: false },
      movement: 9,
      immunities: ["giant"],
      proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYFLAILMORNINGSTAR, value: 3 }],
      items: {
        remove: [
          "BDOGRE02",
          "BDOGRE06",
          "BLUN06",
          "BLUN07",
          "LEAT04",
          "SW2H01",
          "OGREGRSU",
          "OGRE1",
          "BDSLUG",
          "HELMNOAN",
          "SPER02",
        ],
      },
      script: {
        remove: ["DVBRSKER"],
      },
    },
  });
  berserker.createGiantFlail();
  berserker.setBehavior({
    restHeal: true,
    usePotions: true,
    useKitAbilities: true,
  });
  berserker.setAttack({
    targetPriorities: [
      {
        // The ogres fight more wisely when led by a half-ogre that concentrates assaults on characters it recognizes as spellcasters and teaming up against skilled fighters.
        targets: ["PCSpellcasters", "PCsPreferringStrong"],
      },
    ],
  });
  chieftainVariant(family, berserker);
  return berserker;
}

function chieftainVariant(_family: OgreFamily, base: Ogre): Variant {
  const variant = base.variant("Chieftain", {
    // chieftain
    files: [
      "BDOGREDS",
      "D9OGRGA2",
      "X3HOGREC",
      "X3HOGREL",
      "BDOGRE06",
      "BDARBING",
      "BDCHESKI",
      "BDSLUG",
      "BDSLUG2",
      "BDBERTOR",
      "BDEINER",
      "BDWAVE13",
      "BDYAROK",
      "GPFIGHT1",
      "ZILFGT01",
    ],
    data: {
      level1: 7,
      xpv: 1400,
      strength: 19,
      exceptionalStrength: 0,
      proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYFLAILMORNINGSTAR, value: 4 }],
    },
    adjust: [
      {
        files: ["BDSLUG", "BDSLUG2"],
        data: {
          level1: 9,
          xpv: 2000,
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYFLAILMORNINGSTAR, value: 5 }],
        },
      },
      {
        files: ["BDBERTOR", "BDEINER", "BDYAROK"],
        data: {
          level1: 11,
          xpv: 2000,
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYFLAILMORNINGSTAR, value: 5 }],
        },
      },
      {
        files: ["GPFIGHT1", "ZILFGT01"],
        data: {
          level1: 16,
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYHALBERD, value: 5 }],
        },
      },
      {
        files: ["X3HOGREL"],
        data: {
          level1: 8,
        },
      },
      {
        files: ["BDYAROK"],
        data: {
          ac: 10,
        },
      },
    ],
  });
  barbarianVariant(variant);
  return variant;
}

function barbarianVariant(base: Variant): Variant {
  return base.variant("Barbarian", {
    data: {
      kit: "BARBARIAN",
    },
    files: ["BDOGRE06", "D9OGRGA2"],
  });
}
