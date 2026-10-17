import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Cat, CatIds } from "./kin";

class LionEntry extends CreatureEntry<Cat> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.Lion, kin);
    this.addCreature(() => this.lion());
  }

  createCreature(id: MonsterEnum): Cat {
    return new Cat(id);
  }

  /**
   * Lion
   */
  private lion() {
    const lion = this.create({
      monster: MonsterEnum.Lion,
      name: "monster.cat.name.lion",
      files: [],
      data: {
        level1: 5,
        bonusHp: 2,
        strength: 17,
        dexterity: 15,
        constitution: 13,
        intelligence: 4,
        wisdom: 12,
        charisma: 8,
        ac: 5,
        apr: 3,
        xpv: 650,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: { value: "Medium", tall: false, long: true },
        movement: 12,
        items: {
          remove: ["CATLIO", "P1-10"],
        },
        immunities: ["cat", "animal"],
      },
    });
    const dices = {
      diceThrown: 1,
      diceSize: 4,
    };
    lion.createPaws(dices);
    lion.createJaws(1, 10);
    lion.createLeapAttack({
      id: CatIds.LionLeap,
      ...dices,
      range: 30,
      rear: {
        diceThrown: 1,
        diceSize: 6,
      },
    });
    lion.setBehavior({
      abilities: [this.ability(CatIds.LionLeap)],
    });
    return lion;
  }
}

export const createLionEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new LionEntry(kins.get(KinEnum.Cat));
