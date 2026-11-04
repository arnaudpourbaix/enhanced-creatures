import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Wolf } from "./kin";

class DireWolfEntry extends CreatureEntry<Wolf> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.DireWolf, kin);
    this.addCreature(() => this.dire());
  }

  createCreature(id: MonsterEnum): Wolf {
    return new Wolf(id);
  }

  /**
   * Dire wolf
   */
  private dire() {
    const dire = this.create({
      monster: MonsterEnum.DireWolf,
      name: "monster.wolf.name.dire",
      files: [],
      data: {
        immunities: ["animal"],
        level1: 4,
        bonusHp: 4,
        strength: 17,
        dexterity: 15,
        constitution: 15,
        intelligence: 4,
        wisdom: 12,
        charisma: 7,
        ac: 6,
        apr: 1,
        xpv: 175,
        alignment: "NEUTRAL",
        morale: 10,
        general: "ANIMAL",
        race: "WOLF",
        class: "WOLF_DIRE",
        gender: "MALE",
        size: { value: "Large", tall: false, long: true },
        movement: 18,
        items: {
          remove: ["P1-8", "P2-8", "IMMUNE1", "RING95", "P1-4", "P1-8M1", "WOLFDI"],
        },
        script: {
          remove: ["DIREWOLF"],
        },
      },
    });
    dire.createJaws({
      diceThrown: 2,
      diceSize: 4,
    });
    dire.setAdjustments([
      {
        files: ["A#FERA04"],
        data: { level1: 10, strength: 18, xpv: 450 },
      },
      {
        files: ["RUFIE"],
        data: { script: { location: "None" } },
      },
    ]);
    return dire;
  }
}

export const createDireWolfEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new DireWolfEntry(kins.get(KinEnum.Wolf));
