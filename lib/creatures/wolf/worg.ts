import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Wolf } from "./kin";

class WorgEntry extends CreatureEntry<Wolf> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.Worg, kin, MonsterFamilyEnum.Wolf);
    this.addCreature(() => this.worg());
  }

  createCreature(id: MonsterEnum): Wolf {
    return new Wolf(id);
  }

  /**
   * Worg
   */
  private worg() {
    const worg = this.create({
      monster: MonsterEnum.Worg,
      name: "monster.wolf.name.worg",
      files: [],
      data: {
        level1: 3,
        bonusHp: 3,
        strength: 16,
        dexterity: 13,
        constitution: 13,
        intelligence: 7,
        wisdom: 11,
        charisma: 8,
        ac: 6,
        apr: 1,
        xpv: 120,
        alignment: "NEUTRAL_EVIL",
        morale: 11,
        general: "ANIMAL",
        race: "WOLF",
        class: "WOLF_WORG",
        animation: "WORG",
        gender: "MALE",
        size: { value: "Medium", tall: false, long: true },
        movement: 18,
        immunities: ["magicalBeast"],
        items: {
          remove: ["P1-6", "P1-8", "P2-8"],
        },
      },
    });
    worg.createJaws({
      diceThrown: 2,
      diceSize: 4,
    });
    worg.setAdjustments([{ files: ["C0CARNIF"], data: { level1: 13 } }]);
    return worg;
  }
}

export const createWorgEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new WorgEntry(kins.get(KinEnum.Wolf));
