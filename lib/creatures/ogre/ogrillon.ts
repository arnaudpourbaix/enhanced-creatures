import { Variant } from "../../src/model/creature/variant";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Ogre, OgreKin } from "./kin";

function ogrillon(entry: CreatureEntry<Ogre>): Ogre {
  const ogrillon = entry.create({
    monster: MonsterEnum.Ogrillon,
    name: "monster.ogre.name.ogrillon",
    files: [],
    data: {
      level1: 2,
      bonusHp: 4,
      strength: 17,
      dexterity: 9,
      constitution: 14,
      intelligence: 6,
      wisdom: 7,
      charisma: 7,
      ac: 6,
      apr: 2,
      xpv: 175,
      alignment: "CHAOTIC_EVIL",
      morale: 10,
      general: "GIANTHUMANOID",
      race: "OGRE",
      class: "OGRE_OGRILLON",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
      immunities: ["giant"],
      items: {
        remove: ["B1-8", "SW1H01"],
      },
      script: {
        remove: ["OGRILLON"],
      },
    },
  });
  ogrillon.createFists({ diceThrown: 1, diceSize: 6 });
  ogrillon.setBehavior({
    restHeal: true,
    usePotions: true,
  });
  ogrillon.setAttack({
    targetPriorities: [
      {
        targets: ["Fighters", "PreferringStrong"],
      },
    ],
  });
  ogrillon.setAdjustments([{ files: ["OGRELESU"], data: { level1: 3 } }]);
  veteranVariant(ogrillon);
  return ogrillon;
}

function veteranVariant(base: Ogre): Variant {
  return base.variant("Veteran", {
    data: {
      // veteran with 5+3 Hit Dice
      level1: 5,
      bonusHp: 3,
      strength: 18,
      exceptionalStrength: 95,
      constitution: 15,
      xpv: 420,
    },
    files: ["GNARL", "HAIRTO"],
  });
}

class OgrillonEntry extends CreatureEntry<Ogre> {
  constructor(kin?: OgreKin) {
    super(EntryEnum.Ogrillon, kin);
    this.addCreature(() => ogrillon(this));
  }

  createCreature(id: MonsterEnum): Ogre {
    return new Ogre(id);
  }
}

export const createOgrillonEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new OgrillonEntry(kins.get(KinEnum.Ogre));
