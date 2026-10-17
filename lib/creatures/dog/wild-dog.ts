import { customCodes } from "../common";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Dog } from "./kin";

class WildDogEntry extends CreatureEntry<Dog> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.WildDog, kin, MonsterFamilyEnum.Dog);
    this.addCreature(() => this.wildDog());
  }

  createCreature(id: MonsterEnum): Dog {
    return new Dog(id);
  }

  /**
   * Wild Dog
   */
  private wildDog() {
    const wild = this.create({
      monster: MonsterEnum.WildDog,
      name: "monster.dog.name.wild",
      files: [],
      data: {
        immunities: ["animal"],
        level1: 1,
        bonusHp: 1,
        strength: 12,
        dexterity: 17,
        constitution: 15,
        intelligence: 4,
        wisdom: 13,
        charisma: 11,
        ac: 7,
        thac0: 19,
        apr: 1,
        xpv: 35,
        alignment: "NEUTRAL",
        morale: 6,
        general: "ANIMAL",
        race: "DOG",
        class: "DOG_WILD",
        gender: "MALE",
        size: { value: "Small", tall: false, long: true },
        movement: 15,
        items: {
          remove: ["P1-4", "P1-3"],
        },
        script: {
          remove: ["WILDDOG", "dogwisu", "direwolf"],
        },
      },
    });
    wild.createJaws({ diceThrown: 1, diceSize: 4 });
    wild.setBehavior({
      dialog: ["BDDOGW01"],
      customCodes: [customCodes.wildAnimalsTurningHostile],
    });
    wild.setAdjustments([
      { files: ["BDDOG"], data: { class: "INNOCENT" } },
      { files: ["BDDEADOG"], data: { script: { location: "None" } } },
      { files: ["DOGWISU"], data: { level1: 3 } },
    ]);
    return wild;
  }
}

export const createWildDogEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new WildDogEntry(kins.get(KinEnum.Dog));
