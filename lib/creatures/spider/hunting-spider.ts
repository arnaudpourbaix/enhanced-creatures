import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Spider, SpiderIds } from "./kin";

class HuntingSpiderEntry extends CreatureEntry<Spider> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.HuntingSpider, kin);
    this.addCreature(() => this.hunting());
  }

  createCreature(id: MonsterEnum): Spider {
    return new Spider(id);
  }

  /**
   * Hunting
   */
  private hunting() {
    const hunting = this.create({
      monster: MonsterEnum.HuntingSpider,
      name: "monster.spider.name.hunting",
      files: [],
      data: {
        level1: 3,
        bonusHp: 3,
        thac0: 17,
        strength: 14,
        dexterity: 16,
        constitution: 12,
        intelligence: 10,
        wisdom: 11,
        charisma: 4,
        ac: 4,
        apr: 1,
        xpv: 650,
        alignment: "NEUTRAL",
        morale: 13,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_GIANT",
        gender: "NIETHER",
        size: { value: "Large", tall: false, long: true },
        movement: 8,
        immunities: [
          "spider",
          "seeInvisible", // their vision gives them the natural ability of true seeing
        ],
        items: {
          remove: ["D5SMSPID", "ANTIWEB"],
        },
      },
    });
    hunting.createLeapSpell({ id: SpiderIds.LeapAttack, memorizedCount: 1 });
    hunting.createJaws({
      diceThrown: 1,
      diceSize: 3,
      poisonType: "A",
      saveBonus: 2,
    });
    hunting.setBehavior({ abilities: [this.ability(SpiderIds.LeapAttack)] });
    return hunting;
  }
}

export const createHuntingSpiderEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new HuntingSpiderEntry(kins.get(KinEnum.Spider));
