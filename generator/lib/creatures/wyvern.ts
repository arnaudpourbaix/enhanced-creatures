import { MonsterItemIconEnum } from "../config/item";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import {
  AbilityDamageTypeEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
  PnPPoisonType,
} from "../src/model/spell-item/effect.enums";
import poisonService from "../src/services/effects/poison.service";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {
  Stinger,
  Jaws,
}

class Wyvern extends Creature {
  createStinger(poisonType: PnPPoisonType, saveBonus: number) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.wyvern.weapon.stinger",
        id: Ids.Stinger,
        icon: MonsterItemIconEnum.Wolf,
        equippedSlot: ["WEAPON1"],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: 1,
          diceSize: 6,
          damageType: AbilityDamageTypeEnum.Piercing,
          speed: 3,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
      castSpells: [poisonService.getSpell({ poisonType, saveBonus })],
    });
  }

  createJaws() {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.wyvern.weapon.jaws",
        id: Ids.Jaws,
        icon: MonsterItemIconEnum.Jaws,
        equippedSlot: ["SHIELD"],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: 2,
          diceSize: 8,
          damageType: AbilityDamageTypeEnum.Piercing,
          speed: 2,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
    });
  }
}

class WyvernFamily extends CreatureFamily<Wyvern> {
  constructor() {
    super(MonsterFamilyEnum.Wyvern);
    this.addCreature(this.wyvern());
    this.addCreature(this.baby());
    this.addCreature(this.greater());
  }

  createCreature(id: MonsterEnum): Wyvern {
    return new Wyvern(id);
  }

  /**
   * Wyvern
   */
  private wyvern() {
    const wyvern = this.create({
      monster: MonsterEnum.Wyvern,
      name: "monster.wyvern.name.wyvern",
      files: [],
      data: {
        level1: 7,
        bonusHp: 7,
        strength: 19,
        dexterity: 10,
        constitution: 16,
        intelligence: 7,
        wisdom: 12,
        charisma: 6,
        ac: 3,
        apr: 2,
        xpv: 1400,
        alignment: "NEUTRAL_EVIL",
        morale: 14,
        general: "MONSTER",
        race: "WYVERN",
        class: "WYVERN",
        gender: "NIETHER",
        size: "Gargantuan",
        movement: 24,
        items: {
          remove: ["RING97", "BDWYV01", "WYVERN1", "WYVERN2", "WYVERNSU"],
        },
        script: {
          remove: ["WYVERN"],
        },
      },
    });
    wyvern.addTrait({ immunities: ["hover"] });
    wyvern.createStinger("F", 0);
    wyvern.createJaws();
    wyvern.setAdjustments([{ files: ["WYVERNSU"], summon: true }]);
    return wyvern;
  }

  /**
   * Baby Wyvern
   */
  private baby() {
    const baby = this.createFrom({
      from: this.creature(MonsterEnum.Wyvern),
      monster: MonsterEnum.BabyWyvern,
      name: "monster.wyvern.name.baby",
      files: [],
    });
    baby.setData({
      level1: 5,
      bonusHp: 5,
      strength: 17,
      ac: 5,
      morale: 12,
      xpv: 650,
      size: "Huge",
      movement: 24,
      items: {
        remove: ["BDWYV02"],
      },
    });
    baby.createStinger("J", 0);
    baby.createJaws();
    baby.setAdjustments([
      { files: ["PLYWYVRN"], data: { script: { location: "None" } } },
      { files: ["WYVBABSU"], summon: true },
    ]);
    return baby;
  }

  /**
   * Greater Wyvern
   */
  private greater() {
    const greater = this.createFrom({
      from: this.creature(MonsterEnum.Wyvern),
      monster: MonsterEnum.GreaterWyvern,
      name: "monster.wyvern.name.greater",
      files: [],
    });
    greater.setData({
      level1: 11,
      bonusHp: 11,
      strength: 20,
      ac: 1,
      morale: 16,
      xpv: 2000,
      size: "Gargantuan",
      movement: 24,
      items: {
        remove: ["BDWYV03"],
      },
    });
    greater.createStinger("F", -2);
    greater.createJaws();
    greater.setAdjustments([]);
    return greater;
  }
}
export const createWyverns = () => new WyvernFamily();
