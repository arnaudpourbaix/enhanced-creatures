import { SPELLS } from "../../config/spells/spell-database";
import { ProficiencyTypeEnum } from "../../src/model/spell-item/effect.enums";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Ogre, OgreKin } from "./kin";

function shaman(family: CreatureEntry<Ogre>, kin?: OgreKin): Ogre {
  const shaman = family.create({
    monster: MonsterEnum.OgreShaman,
    name: "monster.ogre.name.shaman",
    files: [],
    data: {
      level1: 5,
      level2: 5,
      bonusHp: 3,
      strength: 18,
      dexterity: 8,
      constitution: 16,
      intelligence: 12,
      wisdom: 13,
      charisma: 7,
      ac: 5,
      apr: 1,
      xpv: 420,
      alignment: "CHAOTIC_EVIL",
      morale: 12,
      general: "GIANTHUMANOID",
      race: "OGRE",
      class: "FIGHTER_CLERIC",
      size: { value: "Large", tall: true, long: false },
      movement: 9,
      immunities: ["giant"],
      proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 2 }],
      items: {
        remove: ["BLUN01"],
      },
      spells: {
        memorized: [
          { file: SPELLS.Priest.Bless.file, memorizedCount: 1 },
          { file: SPELLS.Priest.Command.file, memorizedCount: 2 },
          { file: SPELLS.Priest.Chant.file, memorizedCount: 1 },
          { file: SPELLS.Priest.HoldPerson.file, memorizedCount: 1 },
        ],
      },
    },
  });
  if (!kin?.ogreFists) throw new Error("The Ogre entry must build before the Ogre Shaman");
  shaman.equipItem(kin.ogreFists);
  shaman.setBehavior({
    restHeal: true,
    usePotions: true,
    abilities: { entries: [] },
  });
  shaman.setAttack({
    targetPriorities: [
      {
        // The ogres fight more wisely when led by a half-ogre that concentrates assaults on characters it recognizes as spellcasters and teaming up against skilled fighters.
        targets: ["Spellcasters", "PreferringStrong"],
      },
    ],
  });
  return shaman;
}

class OgreShamanEntry extends CreatureEntry<Ogre> {
  constructor(kin?: OgreKin) {
    super(EntryEnum.OgreShaman, kin, MonsterFamilyEnum.Ogre);
    this.addCreature(() => shaman(this, kin));
  }

  createCreature(id: MonsterEnum): Ogre {
    return new Ogre(id);
  }
}

export const createOgreShamanEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new OgreShamanEntry(kins.get(KinEnum.Ogre));
