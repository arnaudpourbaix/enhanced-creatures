import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Cat, CatIds } from "./kin";

class GiantLynxEntry extends CreatureEntry<Cat> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.GiantLynx, kin, MonsterFamilyEnum.Cat);
    this.addCreature(() => this.giantLynx());
  }

  createCreature(id: MonsterEnum): Cat {
    return new Cat(id);
  }

  /**
   * Giant Lynx
   */
  private giantLynx() {
    const giantLynx = this.create({
      monster: MonsterEnum.GiantLynx,
      name: "monster.cat.name.giantLynx",
      files: [],
      data: {
        level1: 2,
        bonusHp: 2,
        strength: 14,
        dexterity: 18,
        constitution: 13,
        intelligence: 12,
        wisdom: 14,
        charisma: 10,
        ac: 6,
        apr: 3,
        xpv: 175,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: { value: "Medium", tall: false, long: true },
        movement: 12,
        hideShadow: 90,
        items: {
          remove: ["P1-6"],
        },
        immunities: ["cat", "animal"],
      },
    });
    const dices = {
      diceThrown: 1,
      diceSize: 2,
    };
    giantLynx.createPaws(dices);
    giantLynx.createJaws(1, 2);
    giantLynx.createLeapAttack({
      id: CatIds.LynxLeap,
      ...dices,
      range: 30,
      rear: {
        diceThrown: 1,
        diceSize: 3,
      },
    });
    giantLynx.setBehavior({
      abilities: [this.ability(CatIds.LynxLeap)],
    });
    giantLynx.setAdjustments([{ files: ["CATLYN01", "CB585AN1"], data: { level1: 4 } }]);
    return giantLynx;
  }
}

export const createGiantLynxEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new GiantLynxEntry(kins.get(KinEnum.Cat));
