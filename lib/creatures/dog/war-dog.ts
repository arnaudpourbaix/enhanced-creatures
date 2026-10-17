import { customCodes } from "../common";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Dog } from "./kin";

class WarDogEntry extends CreatureEntry<Dog> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.WarDog, kin, MonsterFamilyEnum.Dog);
    this.addCreature(() => this.warDog());
  }

  createCreature(id: MonsterEnum): Dog {
    return new Dog(id);
  }

  /**
   * War Dog
   */
  private warDog() {
    const war = this.create({
      monster: MonsterEnum.WarDog,
      name: "monster.dog.name.war",
      files: [],
      data: {
        immunities: ["animal"],
        level1: 2,
        bonusHp: 2,
        strength: 12,
        dexterity: 17,
        constitution: 15,
        intelligence: 4,
        wisdom: 13,
        charisma: 11,
        ac: 6,
        apr: 1,
        xpv: 65,
        alignment: "NEUTRAL",
        morale: 9,
        general: "MONSTER",
        race: "DOG",
        class: "DOG_WAR",
        gender: "MALE",
        size: { value: "Medium", tall: false, long: true },
        movement: 12,
        items: { remove: ["P2-8", "P1-8", "P1-4", "DOGWASU"] },
      },
    });
    war.createJaws({ diceThrown: 2, diceSize: 4 });
    war.setAdjustments([
      { files: ["UBNIMDOG", "L#NIDOG"], data: { script: { location: "None" } } },
      { files: ["FSDOG", "L#2EDDOG"], data: { level1: 3 } },
      { files: ["GPDOG1"], data: { level1: 4 } },
      { files: ["L#NIDOG"], data: { animation: "DOG_WAR" } },
    ]);
    war.setBehavior({
      customCodes: [customCodes.wildAnimalsTurningHostile],
    });
    return war;
  }
}

export const createWarDogEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new WarDogEntry(kins.get(KinEnum.Dog));
