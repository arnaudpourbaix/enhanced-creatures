import { customCodes } from "../common";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Bear } from "./kin";

class CaveBearEntry extends CreatureEntry<Bear> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.CaveBear, kin);
    this.addCreature(() => this.cave());
  }

  createCreature(id: MonsterEnum): Bear {
    return new Bear(id);
  }

  /**
   * Cave Bear
   */
  private cave() {
    const cave = this.create({
      monster: MonsterEnum.CaveBear,
      name: "monster.bear.name.cave",
      files: [],
      data: {
        immunities: ["animal"],
        level1: 6,
        bonusHp: 6,
        specialBonusHp: 8,
        strength: 20,
        dexterity: 10,
        constitution: 16,
        intelligence: 4,
        wisdom: 13,
        charisma: 7,
        ac: 6,
        apr: 3,
        xpv: 650,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "BEAR",
        class: "BEAR_CAVE",
        gender: "NIETHER",
        size: { value: "Huge", tall: false, long: true },
        movement: 12,
        items: {
          remove: ["B1-10", "BEARCASU", "BEARCA", "S1-12", "B1-12"],
        },
        script: {
          remove: ["CBEAR", "BEAR"],
        },
      },
    });
    cave.createPaws(1, 8, { diceThrown: 2, diceSize: 6 });
    cave.createJaws(1, 12);
    cave.setBehavior({
      customCodes: [customCodes.wildAnimalsTurningHostile],
      walk: true,
    });
    cave.setAdjustments([
      { files: ["BD328OSO"], data: { level1: 8, xpv: 900 } },
      { files: ["BDBEARCA"], data: { level1: 9, xpv: 975 } },
      { files: ["OHDANIM1"], data: { script: { location: "None" } } },
    ]);
    return cave;
  }
}

export const createCaveBearEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new CaveBearEntry(kins.get(KinEnum.Bear));
