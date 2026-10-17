import effectFactory from "../../src/factories/effect.factory";
import {
  EffectDamageTypeEnum,
  EffectStatisticModifierEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import creatureService from "../../src/services/creature.service";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Spider } from "./kin";

class WraithSpiderEntry extends CreatureEntry<Spider> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.WraithSpider, kin, MonsterFamilyEnum.Spider);
    this.addCreature(() => this.wraith());
  }

  createCreature(id: MonsterEnum): Spider {
    return new Spider(id);
  }

  /**
   * Wraith
   */
  private wraith() {
    const wraith = this.create({
      monster: MonsterEnum.WraithSpider,
      name: "monster.spider.name.wraith",
      files: [],
      data: {
        level1: 3,
        bonusHp: 2,
        strength: 17,
        dexterity: 15,
        constitution: 9,
        intelligence: 10,
        wisdom: 10,
        charisma: 1,
        ac: 5,
        apr: 1,
        xpv: 1400,
        alignment: "LAWFUL_EVIL",
        morale: 15,
        general: "MONSTER",
        race: "SPIDER",
        class: "SPIDER_WRAITH",
        gender: "NIETHER",
        size: { value: "Medium", tall: false, long: true },
        movement: 12,
        immunities: ["spider", "undead"],
        items: {
          remove: ["IMMUNE1", "RING95", "ANTIWEB", "SPIDWR1"],
        },
        script: {
          remove: ["DW#SPIDG"],
        },
      },
    });
    wraith.addTrait({
      immunities: ["cold", "nonSilverNonMagicalWeapons"],
      effects: [
        {
          opcode: EffectTypeEnum.MagicResistanceModifier,
          value: 15,
          type: EffectStatisticModifierEnum.Set,
        },
      ],
    });
    wraith.createJaws({
      diceThrown: 0,
      diceSize: 0,
      effects: [
        {
          opcode: EffectTypeEnum.Damage,
          type: EffectDamageTypeEnum.Cold,
          diceThrown: 1,
          diceSize: 4,
          amount: creatureService.getStrengthBonus(wraith.data).damage,
        },
        ...effectFactory.levelDrain({ levels: 1 }),
      ],
      poisonType: "S",
    });
    wraith.setBehavior({
      dialog: ["C#Q04009", "ttspid"],
    });
    return wraith;
  }
}

export const createWraithSpiderEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new WraithSpiderEntry(kins.get(KinEnum.Spider));
