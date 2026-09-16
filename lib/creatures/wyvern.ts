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
  createStinger(p: {
    diceThrown: number;
    diceSize: number;
    poisonType: PnPPoisonType;
    saveBonus: number;
  }) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.wyvern.weapon.stinger",
        id: Ids.Stinger,
        icon: MonsterItemIconEnum.Wolf,
        equippedSlot: ["WEAPON1"],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: p.diceThrown,
          diceSize: p.diceSize,
          damageType: AbilityDamageTypeEnum.Piercing,
          speed: 3,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
      castSpells: [poisonService.getSpell({ poisonType: p.poisonType, saveBonus: p.saveBonus })],
    });
  }

  createJaws(p: { diceThrown: number; diceSize: number }) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.wyvern.weapon.jaws",
        id: Ids.Jaws,
        icon: MonsterItemIconEnum.Jaws,
        equippedSlot: ["SHIELD"],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: p.diceThrown,
          diceSize: p.diceSize,
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
    this.addCreature(() => this.wyvern());
    this.addCreature(() => this.baby());
    this.addCreature(() => this.greater());
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
        size: { value: "Gargantuan", tall: false, long: true },
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
    wyvern.createStinger({
      diceThrown: 1,
      diceSize: 6,
      poisonType: "F",
      saveBonus: 0,
    });
    wyvern.createJaws({ diceThrown: 2, diceSize: 8 });
    wyvern.setAdjustments([{ files: ["PWYVV01"], data: { level1: 10 } }]);
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
      size: { value: "Large", tall: false, long: true },
      movement: 24,
      items: {
        remove: ["BDWYV02", "WYVBABSU"],
      },
    });
    baby.createStinger({
      diceThrown: 1,
      diceSize: 6,
      poisonType: "F",
      saveBonus: 2,
    });
    baby.setAdjustments([{ files: ["PLYWYVRN"], data: { script: { location: "None" } } }]);
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
      level1: 14,
      bonusHp: 14,
      strength: 21,
      ac: 1,
      morale: 16,
      xpv: 5000,
      size: { value: "Gargantuan", tall: false, long: true },
      movement: 24,
      items: {
        remove: ["BDWYV03"],
      },
    });
    greater.createStinger({
      diceThrown: 1,
      diceSize: 6,
      poisonType: "E",
      saveBonus: 0,
    });
    greater.setAdjustments([]);
    return greater;
  }

  /**
   * Red Wyvern Drake
   */
  private redDrake() {
    const drake = this.create({
      monster: MonsterEnum.Wyvern,
      name: "monster.wyvern.name.redDrake",
      files: [],
      data: {
        level1: 8,
        bonusHp: 7,
        strength: 24,
        dexterity: 10,
        constitution: 18,
        intelligence: 9,
        wisdom: 12,
        charisma: 11,
        ac: -3,
        apr: 2,
        xpv: 10000,
        alignment: "CHAOTIC_EVIL",
        morale: 14,
        general: "MONSTER",
        race: "WYVERN",
        class: "WYVERN",
        gender: "NIETHER",
        size: { value: "Gargantuan", tall: false, long: true },
        movement: 24,
        items: {
          remove: ["RING97", "BDWYV01", "WYVERN1", "WYVERN2", "WYVERNSU"],
        },
        script: {
          remove: ["WYVERN"],
        },
      },
    });
    // Immune to breath weapon of dragon parent and like attacks (spells, etc.)
    drake.addTrait({ immunities: ["hover"] });
    drake.createStinger({
      diceThrown: 1,
      diceSize: 8,
      poisonType: "F",
      saveBonus: 0,
    });
    drake.createJaws({ diceThrown: 2, diceSize: 10 });
    // The wyvern drake also fights with a breath weapon inherited from its dragon parent usable three times per day.
    // Damage done by the wyvern drake's breath weapon is equal to the beast's normal hit point total.
    // This damage does not vary as the beast is wounded or healed over time.
    //
    // Breath Weapon (Su): 30-ft. cone or 60-ft. line (based on dragon parent).
    // Damage is 8d6 of the corresponding elemental type (Fire, Acid, Lightning, or Cold).
    // Reflex save (DC 19) for half damage.
    // Can use once every 1d4 rounds.
    drake.setAdjustments([]);
    return drake;
  }
}
export const createWyverns = () => new WyvernFamily();
