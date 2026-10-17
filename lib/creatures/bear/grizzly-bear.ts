import { customCodes } from "../common";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Bear } from "./kin";

class GrizzlyBearEntry extends CreatureEntry<Bear> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.GrizzlyBear, kin, MonsterFamilyEnum.Bear);
    this.addCreature(() => this.grizzly());
  }

  createCreature(id: MonsterEnum): Bear {
    return new Bear(id);
  }

  /**
   * Grizzly Bear
   */
  private grizzly() {
    const grizzly = this.create({
      monster: MonsterEnum.GrizzlyBear,
      name: "monster.bear.name.grizzly",
      files: [],
      data: {
        immunities: ["animal"],
        level1: 10,
        bonusHp: 10,
        specialBonusHp: 12,
        strength: 20,
        dexterity: 14,
        constitution: 20,
        intelligence: 4,
        wisdom: 13,
        charisma: 7,
        ac: 5,
        apr: 3,
        xpv: 1500,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "BEAR",
        class: "BEAR_BROWN",
        gender: "NIETHER",
        size: { value: "Huge", tall: false, long: true },
        movement: 12,
        items: {
          remove: ["B1-12", "S1-8"],
        },
        script: {
          remove: ["BEAR"],
        },
      },
    });
    grizzly.createPaws(1, 12, { diceThrown: 3, diceSize: 6 });
    grizzly.createJaws(2, 6);
    grizzly.setBehavior({
      walk: true,
      customCodes: [customCodes.wildAnimalsTurningHostile, customCodes.hunterCustomCode],
    });
    grizzly.setAdjustments([
      { files: ["BDGRIZHU"], data: { class: "HUNTER_CREATURE" } },
      { files: ["CB595GRB"], data: { script: { location: "None" } } },
    ]);
    return grizzly;
  }
}

export const createGrizzlyBearEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new GrizzlyBearEntry(kins.get(KinEnum.Bear));
