import { NEW_CREATURES } from "../config/creatures";
import effectFactory from "../src/factories/effect.factory";
import { Creature } from "../src/model/creature/creature";
import { CreatureEntry } from "../src/model/creature/entry";
import { EntryEnum } from "./entry";
import { MonsterEnum } from "./monster";

class Plant extends Creature {
  createBranch(diceThrown: number, diceSize: number, equip = false) {
    return this.addNaturalWeapon("branch", {
      diceThrown,
      diceSize,
      speed: 8,
      range: 5,
      slot: equip ? "WEAPON1" : null,
    });
  }
}

class TreantEntry extends CreatureEntry<Plant> {
  constructor() {
    super(EntryEnum.Treant);
    this.addCreature(() => this.treant());
  }

  createCreature(id: MonsterEnum): Plant {
    return new Plant(id);
  }

  /**
   * Treant
   */
  private treant() {
    const treant = this.create({
      monster: MonsterEnum.Treant,
      name: "monster.plant.name.treant",
      files: [
        NEW_CREATURES.Treant11hd,
        NEW_CREATURES.Treant9hd,
        NEW_CREATURES.Treant7hd,
        NEW_CREATURES.Treant5hd,
      ],
      newFiles: [
        {
          files: [NEW_CREATURES.Treant11hd],
          copyFrom: "jacm1904",
          stringRef: "monster.plant.name.treant11HD",
        },
        {
          files: [NEW_CREATURES.Treant9hd],
          copyFrom: "jacm1904",
          stringRef: "monster.plant.name.treant9HD",
        },
        {
          files: [NEW_CREATURES.Treant7hd],
          copyFrom: "jacm1904",
          stringRef: "monster.plant.name.treant7HD",
        },
        {
          files: [NEW_CREATURES.Treant5hd],
          copyFrom: "jacm1904",
          stringRef: "monster.plant.name.treant5HD",
        },
      ],
      data: {
        level1: 11,
        strength: 23,
        dexterity: 8,
        constitution: 21,
        intelligence: 12,
        wisdom: 16,
        charisma: 12,
        ac: 0,
        apr: 2,
        xpv: 6000,
        alignment: "CHAOTIC_GOOD",
        morale: 16,
        general: "PLANT",
        race: "TREANT",
        class: "NO_CLASS",
        gender: "NIETHER",
        size: { value: "Huge", tall: true, long: false },
        movement: 12,
        immunities: ["plant"],
        items: {
          remove: ["BDTREANT", "BDPLANT", "IPSION"],
        },
      },
    });
    treant.createBranch(4, 6, true);
    const wp9 = treant.createBranch(3, 6).file;
    const wp7 = treant.createBranch(2, 8).file;
    const wp5 = treant.createBranch(2, 6).file;
    treant.addTrait({
      effects: effectFactory.fireResistance(-25),
    });
    treant.setAdjustments([
      {
        files: [
          NEW_CREATURES.Treant11hd,
          NEW_CREATURES.Treant9hd,
          NEW_CREATURES.Treant7hd,
          NEW_CREATURES.Treant5hd,
        ],
        summon: true,
      },
      {
        files: [NEW_CREATURES.Treant9hd, "BDTREANT", "WITREANT"],
        data: {
          level1: 9,
          strength: 21,
          constitution: 20,
          xpv: 4000,
          items: { equipped: [{ file: wp9, slot: "WEAPON1" }] },
        },
      },
      {
        files: [NEW_CREATURES.Treant7hd],
        data: {
          level1: 7,
          strength: 20,
          constitution: 20,
          xpv: 2000,
          items: { equipped: [{ file: wp7, slot: "WEAPON1" }] },
        },
      },
      {
        files: [NEW_CREATURES.Treant5hd],
        data: {
          level1: 5,
          strength: 19,
          constitution: 19,
          xpv: 1400,
          items: { equipped: [{ file: wp5, slot: "WEAPON1" }] },
        },
      },
    ]);
    return treant;
  }
}

export const createTreantEntry = () => new TreantEntry();
