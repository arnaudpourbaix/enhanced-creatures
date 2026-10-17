import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Dog, DogIds } from "./kin";

class BlinkDogEntry extends CreatureEntry<Dog> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.BlinkDog, kin, MonsterFamilyEnum.Dog);
    this.addCreature(() => this.blinkDog());
  }

  createCreature(id: MonsterEnum): Dog {
    return new Dog(id);
  }

  /**
   * Blink Dog
   */
  private blinkDog() {
    const blinkDog = this.create({
      monster: MonsterEnum.BlinkDog,
      name: "monster.dog.name.blink",
      files: [],
      data: {
        level1: 4,
        strength: 12,
        dexterity: 17,
        constitution: 15,
        intelligence: 9,
        wisdom: 13,
        charisma: 11,
        ac: 5,
        apr: 1,
        xpv: 270,
        alignment: "NEUTRAL",
        morale: 12,
        general: "ANIMAL",
        race: "DOG",
        class: "DOG_WILD",
        gender: "MALE",
        size: { value: "Medium", tall: false, long: true },
        movement: 12,
        immunities: ["magicalBeast"],
        items: { remove: ["P1-6"] },
        script: { remove: ["PSPIDER"] },
      },
    });
    blinkDog.createBlink();
    blinkDog.createJaws({ diceThrown: 1, diceSize: 6 });
    blinkDog.setBehavior({ abilities: [this.ability(DogIds.Blink)] });
    return blinkDog;
  }
}

export const createBlinkDogEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new BlinkDogEntry(kins.get(KinEnum.Dog));
