import { SPELLS } from "../../config/spells/spell-database";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Spider } from "./kin";

class HairySpiderEntry extends CreatureEntry<Spider> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.HairySpider, kin);
    this.addCreature(() => this.hairy());
  }

  createCreature(id: MonsterEnum): Spider {
    return new Spider(id);
  }

  /**
   * Hairy
   */
  private hairy() {
    const hairy = this.create({
      monster: MonsterEnum.HairySpider,
      name: "monster.spider.name.hairy",
      files: [],
      data: {
        level1: 1,
        bonusHp: 1,
        strength: 2,
        dexterity: 14,
        constitution: 8,
        intelligence: 1,
        wisdom: 10,
        charisma: 2,
        ac: 8,
        apr: 1,
        thac0: 20,
        xpv: 65,
        alignment: "NEUTRAL_EVIL",
        morale: 10,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_HUGE",
        gender: "NIETHER",
        size: { value: "Tiny", tall: false, long: true },
        movement: 6, // web 15
        immunities: ["spider"],
        items: {
          remove: ["SPIDHU1", "ANTIWEB"],
        },
        script: {
          remove: ["DW#SPIDG"],
        },
        spells: {
          memorized: [{ file: SPELLS.Wizard.DetectInvisibility.file, memorizedCount: 1 }],
        },
      },
    });
    hairy.createJaws({
      diceThrown: 1,
      diceSize: 1,
      poisonType: "R",
      saveBonus: 2,
    });
    hairy.addTrait({ immunities: ["crushingDamageResistance"] });
    hairy.setBehavior({
      abilities: [
        {
          preset: SPELLS.Wizard.DetectInvisibility.file,
          spell: {
            type: "force",
          },
          timer: { name: "detectInvisibility", value: 18 },
          requireVocal: false,
          probability: 30,
        },
      ],
    });
    hairy.setAdjustments([{ files: ["BDSPIDER"], data: { script: { location: "None" } } }]);
    return hairy;
  }
}

export const createHairySpiderEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new HairySpiderEntry(kins.get(KinEnum.Spider));
