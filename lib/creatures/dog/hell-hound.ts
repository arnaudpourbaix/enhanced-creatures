import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Dog, DogIds } from "./kin";

class HellHoundEntry extends CreatureEntry<Dog> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.HellHound, kin, MonsterFamilyEnum.Dog);
    this.addCreature(() => this.hellHound());
  }

  createCreature(id: MonsterEnum): Dog {
    return new Dog(id);
  }

  /**
   * Hell Hound
   */
  private hellHound() {
    const hellHound = this.create({
      monster: MonsterEnum.HellHound,
      name: "monster.dog.name.hellHound",
      files: [],
      data: {
        level1: 4,
        strength: 17,
        dexterity: 12,
        constitution: 14,
        intelligence: 7,
        wisdom: 13,
        charisma: 6,
        ac: 4,
        apr: 1,
        xpv: 420,
        alignment: "LAWFUL_EVIL",
        morale: 13,
        general: "MONSTER",
        race: "DOG",
        class: "DOG_WAR",
        gender: "MALE",
        size: { value: "Medium", tall: false, long: true },
        movement: 12,
        items: {
          remove: ["P1-10", "HELLHO", "SEEINVIS"],
        },
        script: { remove: ["HELHOU01"] },
        immunities: ["outsider", "extraplanar"],
      },
    });
    hellHound.addTrait({
      immunities: ["fire", "backstab", "seeInvisible"],
    });
    hellHound.createBreathFire();
    // The hell hound can continue to exhale flame while biting.
    // If the hell hound rolls a natural 20 on its attack roll, it grabs a victim in its jaws and breathes fire on the victim.
    hellHound.createJaws({
      diceThrown: 1,
      diceSize: 10,
      castSpell: {
        probability1: 5,
        spell: this.spell(DogIds.BreathFire).file,
        doc: "both",
      },
      grab: {
        probability: 5,
        trigger: "probability",
      },
    });
    hellHound.setBehavior({
      abilities: [this.ability(DogIds.BreathFire)],
    });
    hellHound.setAdjustments([{ files: ["HELLHO01", "OBSFIR05"], data: { level1: 7, xpv: 1400 } }]);
    return hellHound;
  }
}

export const createHellHoundEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new HellHoundEntry(kins.get(KinEnum.Dog));
