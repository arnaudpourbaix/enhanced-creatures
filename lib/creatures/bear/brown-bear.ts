import { customCodes } from "../common";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Bear } from "./kin";

class BrownBearEntry extends CreatureEntry<Bear> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.BrownBear, kin);
    this.addCreature(() => this.brown());
  }

  createCreature(id: MonsterEnum): Bear {
    return new Bear(id);
  }

  /**
   * Brown Bear
   */
  private brown() {
    const brown = this.create({
      monster: MonsterEnum.BrownBear,
      name: "monster.bear.name.brown",
      files: [],
      data: {
        immunities: ["animal"],
        level1: 5,
        bonusHp: 5,
        specialBonusHp: 8,
        strength: 19,
        dexterity: 10,
        constitution: 16,
        intelligence: 4,
        wisdom: 13,
        charisma: 7,
        ac: 6,
        apr: 3,
        xpv: 420,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "BEAR",
        class: "BEAR_BROWN",
        gender: "NIETHER",
        size: { value: "Large", tall: false, long: true },
        movement: 12,
        items: {
          remove: ["B1-8", "S1-8", "BEARBR", "B1-8M1"],
        },
        script: {
          remove: ["CBEAR", "BEAR"],
        },
      },
    });
    brown.createPaws(1, 6, { diceThrown: 2, diceSize: 6 });
    brown.createJaws(1, 8);
    brown.setBehavior({
      walk: true,
      customCodes: [customCodes.wildAnimalsTurningHostile, customCodes.hunterCustomCode],
    });
    brown.setAdjustments([
      { files: ["PLYBEAR1", "CB595BRB"], data: { script: { location: "None" } } },
      { files: ["BDBEARBR"], stringRef: "monster.bear.name.brown" },
    ]);
    return brown;
  }
}

export const createBrownBearEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new BrownBearEntry(kins.get(KinEnum.Bear));
