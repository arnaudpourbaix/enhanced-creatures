import { Durations } from "../../src/model/game-data/durations";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Spider, SpiderIds } from "./kin";

class GargantuanSpiderEntry extends CreatureEntry<Spider> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.GargantuanSpider, kin, MonsterFamilyEnum.Spider);
    this.addCreature(() => this.gargantuan());
  }

  createCreature(id: MonsterEnum): Spider {
    return new Spider(id);
  }

  /**
   * Gargantuan
   */
  private gargantuan() {
    const gargantuan = this.create({
      monster: MonsterEnum.GargantuanSpider,
      name: "monster.spider.name.gargantuan",
      files: [],
      data: {
        level1: 8,
        bonusHp: 8,
        thac0: 11,
        strength: 18,
        dexterity: 15,
        constitution: 17,
        intelligence: 7,
        wisdom: 11,
        charisma: 4,
        ac: 4,
        apr: 1,
        xpv: 3000,
        alignment: "CHAOTIC_EVIL",
        morale: 14,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_GIANT",
        gender: "NIETHER",
        size: { value: "Gargantuan", tall: false, long: true },
        movement: 9, // Web 12
        immunities: ["spider"],
        items: {
          remove: ["BDSPIDGA", "ANTIWEB"],
        },
        script: {
          remove: ["BDSPIDGA"],
        },
      },
    });
    gargantuan.createWeb({
      id: SpiderIds.WebTangle,
      duration: 3 * Durations.round,
      // saveBonus: -2,
      description: "monster.spider.ability.webTangle.standardDesc",
    });
    gargantuan.createJaws({
      diceThrown: 2,
      diceSize: 6,
      poisonType: "Q",
      saveBonus: -2,
    });
    gargantuan.setAttack({
      targetPriorities: [{ status: ["HeldAndNotPoisoned"] }],
    });
    gargantuan.setBehavior({
      abilities: [this.ability(SpiderIds.WebTangle)],
    });
    return gargantuan;
  }
}

export const createGargantuanSpiderEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new GargantuanSpiderEntry(kins.get(KinEnum.Spider));
