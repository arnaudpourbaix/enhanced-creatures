import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Spider } from "./kin";

class HugeSpiderEntry extends CreatureEntry<Spider> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.HugeSpider, kin, MonsterFamilyEnum.Spider);
    this.addCreature(() => this.huge());
  }

  createCreature(id: MonsterEnum): Spider {
    return new Spider(id);
  }

  /**
   * Huge
   */
  private huge() {
    const huge = this.create({
      monster: MonsterEnum.HugeSpider,
      name: "monster.spider.name.huge",
      files: [],
      data: {
        level1: 2,
        bonusHp: 2,
        thac0: 19,
        strength: 14,
        dexterity: 16,
        constitution: 12,
        intelligence: 7,
        wisdom: 11,
        charisma: 4,
        ac: 6,
        apr: 1,
        xpv: 270,
        alignment: "NEUTRAL",
        morale: 8,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_HUGE",
        animation: "SPIDER_HUGE",
        gender: "NIETHER",
        size: { value: "Medium", tall: false, long: true },
        movement: 18,
        immunities: ["spider"],
        items: {
          remove: ["BDSPIDHU", "SPIDHU1", "ANTIWEB", "D5SMSPID", "SPSPID"],
        },
        script: {
          remove: ["DW#SPIDS"],
        },
      },
    });
    huge.createJaws({
      diceThrown: 1,
      diceSize: 6,
      poisonType: "A",
      saveBonus: 1,
    });
    return huge;
  }
}

export const createHugeSpiderEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new HugeSpiderEntry(kins.get(KinEnum.Spider));
