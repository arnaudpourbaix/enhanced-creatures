import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Cat, CatIds } from "./kin";

class WildTigerEntry extends CreatureEntry<Cat> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.WildTiger, kin, MonsterFamilyEnum.Cat);
    this.addCreature(() => this.wildTiger());
  }

  createCreature(id: MonsterEnum): Cat {
    return new Cat(id);
  }

  /**
   * Wild Tiger
   */
  private wildTiger() {
    const wildTiger = this.create({
      monster: MonsterEnum.WildTiger,
      name: "monster.cat.name.wildTiger",
      files: [],
      data: {
        level1: 5,
        bonusHp: 5,
        strength: 17,
        dexterity: 15,
        constitution: 14,
        intelligence: 3,
        wisdom: 12,
        charisma: 8,
        ac: 6,
        apr: 3,
        xpv: 650,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: { value: "Large", tall: false, long: true },
        movement: 12,
        items: {
          remove: ["P1-10"],
        },
        immunities: ["cat", "animal"],
      },
    });
    const dices = {
      diceThrown: 1,
      diceSize: 4,
    };
    wildTiger.createPaws(dices);
    wildTiger.createJaws(1, 10);
    wildTiger.createLeapAttack({
      id: CatIds.TigerLeap,
      ...dices,
      range: 30,
      rear: {
        diceThrown: 2,
        diceSize: 4,
      },
    });
    wildTiger.setBehavior({
      abilities: [this.ability(CatIds.TigerLeap)],
    });
    return wildTiger;
  }
}

export const createWildTigerEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new WildTigerEntry(kins.get(KinEnum.Cat));
