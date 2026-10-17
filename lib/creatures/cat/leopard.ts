import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Cat, CatIds } from "./kin";

class LeopardEntry extends CreatureEntry<Cat> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.Leopard, kin, MonsterFamilyEnum.Cat);
    this.addCreature(() => this.leopard());
  }

  createCreature(id: MonsterEnum): Cat {
    return new Cat(id);
  }

  /**
   * Leopard
   */
  private leopard() {
    const leopard = this.create({
      monster: MonsterEnum.Leopard,
      name: "monster.cat.name.leopard",
      files: [],
      data: {
        level1: 3,
        bonusHp: 2,
        strength: 16,
        dexterity: 19,
        constitution: 15,
        intelligence: 4,
        wisdom: 12,
        charisma: 6,
        ac: 6,
        apr: 3,
        xpv: 270,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: { value: "Medium", tall: false, long: true },
        movement: 15,
        items: {
          remove: ["CATJAGSU", "P1-6"],
        },
        script: {
          remove: ["CATJAGSU"],
        },
        immunities: ["cat", "animal"],
      },
    });
    const dices = {
      diceThrown: 1,
      diceSize: 3,
    };
    leopard.createPaws(dices);
    leopard.createJaws(1, 6);
    leopard.createLeapAttack({
      id: CatIds.LeopardLeap,
      ...dices,
      range: 25,
      rear: {
        diceThrown: 1,
        diceSize: 4,
      },
    });
    leopard.setBehavior({
      abilities: [this.ability(CatIds.LeopardLeap)],
    });
    return leopard;
  }
}

export const createLeopardEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new LeopardEntry(kins.get(KinEnum.Cat));
