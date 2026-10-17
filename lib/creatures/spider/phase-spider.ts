import { InvisibilityTypeEnum } from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Spider, SpiderIds } from "./kin";

class PhaseSpiderEntry extends CreatureEntry<Spider> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.PhaseSpider, kin, MonsterFamilyEnum.Spider);
    this.addCreature(() => this.phase());
  }

  createCreature(id: MonsterEnum): Spider {
    return new Spider(id);
  }

  /**
   * Phase
   */
  private phase() {
    const phase = this.create({
      monster: MonsterEnum.PhaseSpider,
      name: "monster.spider.name.phase",
      files: [],
      data: {
        level1: 5,
        bonusHp: 5,
        strength: 15,
        dexterity: 15,
        constitution: 12,
        intelligence: 7,
        wisdom: 10,
        charisma: 6,
        ac: 7,
        apr: 1,
        xpv: 1400,
        alignment: "NEUTRAL",
        morale: 15,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_PHASE",
        gender: "NIETHER",
        size: { value: "Huge", tall: false, long: true },
        movement: 6, // Web 15
        immunities: ["spider", "magicalBeast"],
        items: {
          remove: ["SPIDPH1", "ANTIWEB", "SPIDPHSU", "VERMTYPE"],
        },
        script: {
          remove: ["PSPIDER", "SPIDPHSU"],
        },
      },
    });
    phase.addTrait({
      effects: [
        {
          opcode: EffectTypeEnum.Invisibility,
          type: InvisibilityTypeEnum.Normal,
        },
      ],
    });
    phase.createPhaseOut();
    // They phase in, attack, and phase out, all in a single round.
    // This gives them a -3 modifier on initiative rolls; if a phase spider wins initiative by more than 4, it attacks and phases out before its opponent has a chance to strike back.
    // Then too, a phase spider usually phases into existence behind its chosen victim, so they get a +4 modifier for attacking from behind.
    // Phase spiders flee to the Ethereal plane when outmatched
    phase.createJaws({
      diceThrown: 1,
      diceSize: 6,
      poisonType: "F",
      saveBonus: -2,
      castSpells: [{ spell: this.spell(SpiderIds.PhaseOut).file, delay: 2, doc: "both" }],
    });
    phase.setBehavior({
      abilities: [this.ability(SpiderIds.PhaseOut)],
    });
    phase.setAdjustments([
      {
        files: ["SPIDPHAS"],
        data: {
          level1: 12,
          xpv: 4000,
        },
      },
    ]);
    return phase;
  }
}

export const createPhaseSpiderEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new PhaseSpiderEntry(kins.get(KinEnum.Spider));
