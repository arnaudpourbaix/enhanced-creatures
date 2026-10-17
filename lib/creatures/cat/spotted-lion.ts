import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Cat, CatIds } from "./kin";

class SpottedLionEntry extends CreatureEntry<Cat> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.SpottedLion, kin, MonsterFamilyEnum.Cat);
    this.addCreature(() => this.spottedLion());
  }

  createCreature(id: MonsterEnum): Cat {
    return new Cat(id);
  }

  /**
   * Spotted Lion
   */
  private spottedLion() {
    const spottedLion = this.create({
      monster: MonsterEnum.SpottedLion,
      name: "monster.cat.name.spottedLion",
      files: [],
      data: {
        level1: 6,
        bonusHp: 2,
        strength: 18,
        dexterity: 14,
        constitution: 17,
        intelligence: 3,
        wisdom: 13,
        charisma: 10,
        ac: 5,
        apr: 3,
        xpv: 975,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: { value: "Large", tall: false, long: true },
        movement: 12,
        items: {
          remove: ["CATLIS", "FIGLION", "IMMUNE1"],
        },
        immunities: ["cat", "animal"],
      },
    });
    const dices = {
      diceThrown: 1,
      diceSize: 4,
    };
    spottedLion.createPaws(dices);
    spottedLion.createJaws(1, 12);
    spottedLion.createLeapAttack({
      id: CatIds.SpottedLionLeap,
      ...dices,
      range: 30,
      rear: {
        diceThrown: 2,
        diceSize: 4,
      },
    });
    spottedLion.setBehavior({
      abilities: [this.ability(CatIds.SpottedLionLeap)],
    });
    spottedLion.setAdjustments([{ files: ["CATLIOWP"], data: { level1: 9 } }]);
    return spottedLion;
  }
}

export const createSpottedLionEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new SpottedLionEntry(kins.get(KinEnum.Cat));
