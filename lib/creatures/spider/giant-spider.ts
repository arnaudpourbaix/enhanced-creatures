import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Spider } from "./kin";

class GiantSpiderEntry extends CreatureEntry<Spider> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.GiantSpider, kin);
    this.addCreature(() => this.giant());
  }

  createCreature(id: MonsterEnum): Spider {
    return new Spider(id);
  }

  /**
   * Giant
   */
  private giant() {
    const giant = this.create({
      monster: MonsterEnum.GiantSpider,
      name: "monster.spider.name.giant",
      files: [],
      data: {
        level1: 4,
        bonusHp: 4,
        thac0: 15,
        strength: 14,
        dexterity: 16,
        constitution: 12,
        intelligence: 7,
        wisdom: 11,
        charisma: 4,
        ac: 4,
        apr: 1,
        xpv: 650,
        alignment: "CHAOTIC_EVIL",
        morale: 13,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_GIANT",
        animation: "SPIDER_GIANT",
        gender: "NIETHER",
        size: { value: "Large", tall: false, long: true },
        movement: 3, // Web 12
        immunities: ["spider"],
        items: {
          remove: [
            "BDSPIDGI",
            "SPIDGI1",
            "SPIDG1",
            "SPIDGISU",
            "ANTIWEB",
            "PLYSPID",
            "VERMTYPE",
            "SPIDHU1",
          ],
        },
        script: {
          remove: ["DW#SPIDG", "O#LLFIGH"],
        },
      },
    });
    giant.createJaws({
      diceThrown: 1,
      diceSize: 8,
      poisonType: "F",
    });
    giant.setAdjustments([{ files: ["PLYSPID2"], data: { script: { location: "None" } } }]);
    return giant;
  }
}

export const createGiantSpiderEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new GiantSpiderEntry(kins.get(KinEnum.Spider));
