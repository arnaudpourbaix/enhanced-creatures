import { MonsterItemIconEnum } from "../config/item";
import effectFactory from "../src/factories/effect.factory";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import { Durations } from "../src/model/game-data/durations";
import {
  AbilityDamageTypeEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

class Crawler extends Creature {}

class CrawlerFamily extends CreatureFamily<Crawler> {
  constructor() {
    super(MonsterFamilyEnum.Crawler);
    this.addCreature(this.carrionCrawler());
  }

  createCreature(id: MonsterEnum): Crawler {
    return new Crawler(id);
  }

  /**
   * Carrion Crawler
   */
  private carrionCrawler() {
    const carrionCrawler = this.create({
      monster: MonsterEnum.CarrionCrawler,
      name: "monster.carrionCrawler.name",
      files: [],
      data: {
        level1: 3,
        bonusHp: 1,
        strength: 14,
        dexterity: 13,
        constitution: 16,
        intelligence: 1,
        wisdom: 12,
        charisma: 5,
        ac: 3,
        apr: 8,
        alignment: "NEUTRAL",
        morale: 10,
        general: "MONSTER",
        race: "CARRIONCRAWLER",
        class: "CARRIONCRAWLER",
        gender: "NIETHER",
        size: "Large",
        xpv: 420,
        movement: 12,
        items: {
          remove: ["CARRIO1"],
        },
        script: {
          remove: ["ccrawler", "bdccrawl"],
        },
      },
    });
    carrionCrawler.addWeapon({
      weapon: {
        stringRef: "monster.carrionCrawler.weapon",
        icon: MonsterItemIconEnum.Jelly,
        equippedSlot: ["WEAPON1"],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: 1,
          diceSize: 2,
          damageType: AbilityDamageTypeEnum.Piercing,
          speed: 3,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
          effects: effectFactory.paralyze({
            duration: 7 * Durations.round,
            saveType: SaveTypeEnum.ParalyzePoisonDeath,
          }),
        },
      },
    });
    carrionCrawler.setAttack({
      targetPriorities: [{ status: ["Able"] }],
    });
    carrionCrawler.setAdjustments([
      { files: ["CARRIOSU"], summon: true },
      { files: ["CRYPTCRA"], data: { level1: 6, thac0: 9, xpv: 650 } },
    ]);
    return carrionCrawler;
  }
}

export const createCarrionCrawlers = () => new CrawlerFamily();
