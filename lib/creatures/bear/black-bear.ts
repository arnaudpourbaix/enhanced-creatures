import actionFactory from "../../src/factories/action.factory";
import responseFactory from "../../src/factories/response.factory";
import { CustomCode } from "../../src/model/script/script";
import { customCodes } from "../common";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Bear } from "./kin";

class BlackBearEntry extends CreatureEntry<Bear> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.BlackBear, kin, MonsterFamilyEnum.Bear);
    this.addCreature(() => this.black());
  }

  createCreature(id: MonsterEnum): Bear {
    return new Bear(id);
  }

  /**
   * Black Bear
   */
  private black() {
    const black = this.create({
      monster: MonsterEnum.BlackBear,
      name: "monster.bear.name.black",
      files: [],
      data: {
        immunities: ["animal"],
        level1: 3,
        bonusHp: 3,
        strength: 15,
        dexterity: 10,
        constitution: 15,
        intelligence: 4,
        wisdom: 12,
        charisma: 7,
        ac: 7,
        apr: 3,
        xpv: 175,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "BEAR",
        class: "BEAR_BLACK",
        gender: "NIETHER",
        size: { value: "Medium", tall: false, long: true },
        movement: 12,
        items: {
          remove: ["B1-6"],
        },
        script: {
          remove: ["CBEAR", "BEAR"],
        },
      },
    });
    black.createPaws(1, 3, { diceThrown: 2, diceSize: 4 });
    black.createJaws(1, 6);
    black.setBehavior({
      walk: true,
      customCodes: [customCodes.wildAnimalsTurningHostile, this.fearFire],
    });
    black.setAdjustments([{ files: ["PLYBEAR2"], data: { script: { location: "None" } } }]);
    return black;
  }

  fearFire: CustomCode = {
    location: "handlePanic",
    type: "insertAfter",
    statements: [
      {
        triggers: [{ name: "HitBy", params: ["ANYONE", "FIRE"] }],
        responses: responseFactory.response(
          actionFactory.disableInterrupt([
            { name: "RunAwayFromNoLeaveArea", params: ["LastAttackerOf", 200] },
          ]),
        ),
      },
    ],
    abilities: [],
  };
}

export const createBlackBearEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new BlackBearEntry(kins.get(KinEnum.Bear));
