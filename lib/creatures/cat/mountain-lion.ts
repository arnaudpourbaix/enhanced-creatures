import { customCodes } from "../common";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Cat, CatIds } from "./kin";

class MountainLionEntry extends CreatureEntry<Cat> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.MountainLion, kin);
    this.addCreature(() => this.mountainLion());
  }

  createCreature(id: MonsterEnum): Cat {
    return new Cat(id);
  }

  /**
   * Mountain Lion
   */
  private mountainLion() {
    const mountainLion = this.create({
      monster: MonsterEnum.MountainLion,
      name: "monster.cat.name.mountainLion",
      files: [],
      data: {
        level1: 3,
        bonusHp: 1,
        strength: 17,
        dexterity: 15,
        constitution: 13,
        intelligence: 4,
        wisdom: 12,
        charisma: 8,
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
        movement: 12,
        items: {
          remove: ["P1-6"],
        },
        immunities: ["cat", "animal"],
      },
    });
    const dices = {
      diceThrown: 1,
      diceSize: 3,
    };
    mountainLion.createPaws(dices);
    mountainLion.createJaws(1, 6);
    mountainLion.createLeapAttack({
      id: CatIds.MountainLionLeap,
      ...dices,
      range: 30,
      rear: {
        diceThrown: 1,
        diceSize: 4,
      },
    });
    mountainLion.setBehavior({
      abilities: [this.ability(CatIds.MountainLionLeap)],
      customCodes: [customCodes.hunterCustomCode],
    });
    mountainLion.setAdjustments([{ files: ["ANLION1"], data: { level1: 15 } }]);
    return mountainLion;
  }
}

export const createMountainLionEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new MountainLionEntry(kins.get(KinEnum.Cat));
