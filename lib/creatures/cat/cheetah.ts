import { customCodes } from "../common";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Cat, CatIds } from "./kin";

class CheetahEntry extends CreatureEntry<Cat> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.Cheetah, kin, MonsterFamilyEnum.Cat);
    this.addCreature(() => this.cheetah());
  }

  createCreature(id: MonsterEnum): Cat {
    return new Cat(id);
  }

  /**
   * Cheetah
   */
  private cheetah() {
    const cheetah = this.create({
      monster: MonsterEnum.Cheetah,
      name: "monster.cat.name.cheetah",
      files: [],
      data: {
        level1: 3,
        strength: 14,
        dexterity: 16,
        constitution: 13,
        intelligence: 1,
        wisdom: 12,
        charisma: 6,
        ac: 5,
        apr: 3,
        xpv: 175,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: { value: "Medium", tall: false, long: true },
        movement: 15, // sprint 45
        items: {
          remove: ["P1-8"],
        },
        immunities: ["cat", "animal"],
      },
    });
    cheetah.createBurstOfSpeed();
    const dices = {
      diceThrown: 1,
      diceSize: 2,
    };
    cheetah.createPaws(dices);
    cheetah.createJaws(1, 8);
    cheetah.createLeapAttack({
      id: CatIds.CheetahLeap,
      ...dices,
      range: 20,
      rear: {
        diceThrown: 1,
        diceSize: 2,
      },
    });
    cheetah.setBehavior({
      abilities: [this.ability(CatIds.CheetahLeap), this.ability(CatIds.BurstOfSpeed)],
      customCodes: [customCodes.hunterCustomCode],
    });
    return cheetah;
  }
}

export const createCheetahEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new CheetahEntry(kins.get(KinEnum.Cat));
