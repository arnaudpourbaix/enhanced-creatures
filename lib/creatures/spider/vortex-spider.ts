import { SPELLS } from "../../config/spells/spell-database";
import { Durations } from "../../src/model/game-data/durations";
import { EffectStatisticModifierEnum } from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Spider } from "./kin";

class VortexSpiderEntry extends CreatureEntry<Spider> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.VortexSpider, kin);
    this.addCreature(() => this.vortex());
  }

  createCreature(id: MonsterEnum): Spider {
    return new Spider(id);
  }

  /**
   * Vortex
   */
  private vortex() {
    const vortex = this.create({
      monster: MonsterEnum.VortexSpider,
      name: "monster.spider.name.vortex",
      files: [],
      data: {
        level1: 7,
        bonusHp: 4,
        strength: 15,
        dexterity: 15,
        constitution: 12,
        intelligence: 7,
        wisdom: 10,
        charisma: 6,
        ac: 4,
        apr: 1,
        xpv: 2700,
        alignment: "CHAOTIC_EVIL",
        morale: 10,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_PHASE",
        animation: "SPIDER_WRAITH",
        gender: "NIETHER",
        size: { value: "Large", tall: false, long: true },
        movement: 15, // Normal: 9, Web: 15
        immunities: ["spider"],
        items: {
          remove: ["BDSPIDGI", "SPIDG1", "ANTIWEB", "PLYSPID", "AC#WSTWS", "SPIDVO01", "VERMTYPE"],
        },
        script: {
          remove: ["DW#SPIDG", "SPIDVO01", "AC#WSTWS"],
        },
        spells: {
          memorized: [{ file: SPELLS.Innate.VortexWeb.file, memorizedCount: 1 }],
        },
      },
    });
    vortex.addTrait({
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 15,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    vortex.createJaws({
      diceThrown: 2,
      diceSize: 4,
      poisonType: "E",
      saveBonus: -2,
    });
    vortex.setBehavior({
      abilities: [
        {
          preset: SPELLS.Wizard.Slow.file,
          name: "spell.VortexWeb.name",
          spell: {
            resource: SPELLS.Innate.VortexWeb.file,
            type: "force",
          },
          timer: { name: "VortexWeb", value: 2 * Durations.round },
        },
      ],
    });
    return vortex;
  }
}

export const createVortexSpiderEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new VortexSpiderEntry(kins.get(KinEnum.Spider));
