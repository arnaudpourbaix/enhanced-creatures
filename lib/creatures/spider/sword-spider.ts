import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Spider, SpiderIds } from "./kin";

class SwordSpiderEntry extends CreatureEntry<Spider> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.SwordSpider, kin);
    this.addCreature(() => this.sword());
  }

  createCreature(id: MonsterEnum): Spider {
    return new Spider(id);
  }

  /**
   * Sword
   */
  private sword() {
    const sword = this.create({
      monster: MonsterEnum.SwordSpider,
      name: "monster.spider.name.sword",
      files: [],
      data: {
        level1: 5,
        bonusHp: 5,
        thac0: 15,
        strength: 16,
        dexterity: 18,
        constitution: 14,
        intelligence: 9,
        wisdom: 14,
        charisma: 4,
        ac: 3,
        apr: 2,
        xpv: 2000,
        alignment: "CHAOTIC_EVIL",
        morale: 13,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_SWORD",
        animation: "SPIDER_SWORD",
        gender: "NIETHER",
        size: { value: "Huge", tall: false, long: true },
        movement: 6, // Web 8
        immunities: ["spider"],
        items: {
          remove: ["SPIDSW1", "ANTIWEB", "SPIDSWSU", "WISPIDSW", "FIGSPID", "VERMTYPE"],
        },
        script: {
          remove: ["DW#SPIDS", "SPIDFGSU"],
        },
        spells: {
          removeMemorized: true,
        },
      },
    });
    sword.createLegWeapon({ id: SpiderIds.Leg, equipped: true });
    sword.createLeapImpalingSpell({
      id: SpiderIds.LeapImpalingAttack,
      memorizedCount: 1,
    });
    sword.createLegWeapon({ id: SpiderIds.LightningLeg, lightning: true });
    sword.createLeapImpalingSpell({
      id: SpiderIds.LightningLeapImpalingAttack,
      lightning: true,
    });
    sword.createJaws({
      diceThrown: 2,
      diceSize: 4,
      slot: "SHIELD",
    });
    sword.setBehavior({
      abilities: [
        this.ability(SpiderIds.LeapImpalingAttack),
        this.ability(SpiderIds.LightningLeapImpalingAttack),
      ],
    });
    sword.setAdjustments([
      { files: ["PLYSPID"], data: { script: { location: "None" } } },
      { files: ["L0SPID"], data: { level1: 16, xpv: 4000 } },
      { files: ["OHHSPI03"], data: { level1: 15, xpv: 4000 } },
      {
        files: ["WISPID03"],
        data: {
          spells: {
            removeMemorized: true,
            memorized: [
              {
                file: this.spell(SpiderIds.LightningLeapImpalingAttack).file,
                memorizedCount: 1,
              },
            ],
          },
          items: {
            equipped: [{ file: this.item(SpiderIds.LightningLeg).file, slot: "SHIELD" }],
          },
        },
      },
    ]);
    return sword;
  }
}

export const createSwordSpiderEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new SwordSpiderEntry(kins.get(KinEnum.Spider));
