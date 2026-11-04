import { customCodes } from "../common";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Wolf } from "./kin";

class WolfEntry extends CreatureEntry<Wolf> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.Wolf, kin);
    this.addCreature(() => this.wolf());
  }

  createCreature(id: MonsterEnum): Wolf {
    return new Wolf(id);
  }

  /**
   * Wolf
   */
  private wolf() {
    const wolf = this.create({
      monster: MonsterEnum.Wolf,
      name: "monster.wolf.name.wolf",
      files: [],
      data: {
        immunities: ["animal"],
        level1: 3,
        strength: 12,
        dexterity: 15,
        constitution: 12,
        intelligence: 4,
        wisdom: 12,
        charisma: 6,
        ac: 7,
        apr: 1,
        xpv: 65,
        alignment: "NEUTRAL",
        morale: 10,
        general: "ANIMAL",
        race: "WOLF",
        class: "WOLF",
        gender: "MALE",
        size: { value: "Small", tall: false, long: true },
        movement: 18,
        items: {
          remove: ["P1-6", "P1-4", "WOLFSU", "B1-6"],
        },
        script: {
          remove: ["attack"],
        },
      },
    });
    wolf.createJaws({
      diceThrown: 1,
      diceSize: 4,
    });
    wolf.setBehavior({
      customCodes: [customCodes.avoidNaturalFriends],
    });
    return wolf;
  }
}

export const createWolfEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new WolfEntry(kins.get(KinEnum.Wolf));
