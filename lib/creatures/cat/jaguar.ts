import { customCodes } from "../common";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Cat, CatIds } from "./kin";

class JaguarEntry extends CreatureEntry<Cat> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.Jaguar, kin);
    this.addCreature(() => this.jaguar());
  }

  createCreature(id: MonsterEnum): Cat {
    return new Cat(id);
  }

  /**
   * Jaguar
   */
  private jaguar() {
    const jaguar = this.create({
      monster: MonsterEnum.Jaguar,
      name: "monster.cat.name.jaguar",
      files: [],
      data: {
        level1: 4,
        bonusHp: 1,
        strength: 14,
        dexterity: 15,
        constitution: 10,
        intelligence: 4,
        wisdom: 14,
        charisma: 7,
        ac: 6,
        apr: 3,
        xpv: 420,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: { value: "Large", tall: false, long: true },
        movement: 15,
        items: {
          remove: ["CATJAG", "S1-6", "P1-8"],
        },
        immunities: ["cat", "animal"],
      },
    });
    const dices = {
      diceThrown: 1,
      diceSize: 3,
    };
    jaguar.createPaws(dices);
    jaguar.createJaws(1, 8);
    jaguar.createLeapAttack({
      id: CatIds.JaguarLeap,
      ...dices,
      range: 30,
      rear: {
        diceThrown: 1,
        diceSize: 4,
      },
    });
    jaguar.setBehavior({
      abilities: [this.ability(CatIds.JaguarLeap)],
      customCodes: [customCodes.hunterCustomCode],
    });
    jaguar.setAdjustments([
      { files: ["JAGUARSU"], data: { level1: 5 } },
      { files: ["C6GUEN", "C6GUEN2"], data: { level1: 6 } },
      {
        files: [
          "BDHELP04",
          "CATJAG01",
          "CATJAGWP",
          "CATPAN01",
          "CB585AN5",
          "D9CATJ",
          "D9CATT",
          "OHDANIM3",
          "TRANIM03",
          "TREVIL05",
        ],
        stringRef: "monster.cat.name.jaguar",
      },
    ]);
    return jaguar;
  }
}

export const createJaguarEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new JaguarEntry(kins.get(KinEnum.Cat));
