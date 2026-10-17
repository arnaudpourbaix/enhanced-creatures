import { ScriptTarget } from "../../src/model/constants";
import { Durations } from "../../src/model/game-data/durations";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Spider, SpiderIds } from "./kin";

class GhostwalkSpiderEntry extends CreatureEntry<Spider> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.GhostwalkSpider, kin);
    this.addCreature(() => this.ghostwalk());
  }

  createCreature(id: MonsterEnum): Spider {
    return new Spider(id);
  }

  /**
   * Ghostwalk
   */
  private ghostwalk() {
    const ghostwalk = this.create({
      monster: MonsterEnum.GhostwalkSpider,
      name: "monster.spider.name.ghostwalk",
      files: [],
      data: {
        level1: 14,
        strength: 15,
        dexterity: 20,
        constitution: 17,
        intelligence: 9,
        wisdom: 14,
        charisma: 8,
        ac: 6,
        apr: 2,
        xpv: 5000,
        alignment: "CHAOTIC_EVIL",
        morale: 13,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_WRAITH",
        animation: "SPIDER_WRAITH",
        gender: "NIETHER",
        size: { value: "Large", tall: false, long: true },
        movement: 15,
        immunities: ["spider"],
        items: {
          remove: ["SPIDPH1", "ANTIWEB", "GHOST2", "SPSPID3"],
        },
        script: {
          remove: ["C#LCCENS", "PSPIDER", "L#ULCSP"],
        },
      },
    });
    ghostwalk.addTrait({
      description: "monster.spider.trait.ghostwalk",
      immunities: ["seeInvisible"],
    });
    ghostwalk.createWeb({
      id: SpiderIds.InvisibleWebTangle,
      duration: 3 * Durations.round,
      saveBonus: -2,
      description: "monster.spider.ability.webTangle.ghostwalkDesc",
      invisible: true,
    });
    ghostwalk.createJaws({
      diceThrown: 3,
      diceSize: 10,
      immunities: ["incorporeal", "ghostVisual1"],
      doc: false,
    });
    ghostwalk.createJaws({
      diceThrown: 3,
      diceSize: 10,
      slot: "WEAPON2",
      poisonType: "E",
      saveBonus: -2,
    });
    ghostwalk.setAttack({
      targetPriorities: [{ status: ["HeldAndNotPoisoned"] }],
      selectWeapons: [
        {
          slot: "WEAPON1",
          triggers: [
            {
              name: "Range",
              params: [ScriptTarget.lastSeen, 5],
              negation: true,
            },
          ],
        },
        {
          slot: "WEAPON2",
          triggers: [
            {
              name: "Range",
              params: [ScriptTarget.lastSeen, 5],
            },
          ],
        },
      ],
    });
    ghostwalk.setBehavior({
      dialog: ["C#LCCENS"],
      abilities: [this.ability(SpiderIds.InvisibleWebTangle)],
    });
    return ghostwalk;
  }
}

export const createGhostwalkSpiderEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new GhostwalkSpiderEntry(kins.get(KinEnum.Spider));
