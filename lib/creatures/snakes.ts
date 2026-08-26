import { NEW_CREATURES } from "../config/creatures";
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

class Snake extends Creature {
  createJaws(p: {
    diceThrown: number;
    diceSize: number;
    poisonType?: PnPPoisonType;
    saveBonus?: number;
  }) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.snake.weapon.jaws",
        icon: MonsterItemIconEnum.Jaws,
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
      castSpells: p.poisonType
        ? [poisonService.getSpell({ poisonType: p.poisonType, saveBonus: p.saveBonus })]
        : [],
    });
  }
}

class SnakeFamily extends CreatureFamily<Snake> {
  constructor() {
    super(MonsterFamilyEnum.Snake);
    this.addCreature(() => this.giantPoisonous());
  }

  createCreature(id: MonsterEnum): Snake {
    return new Snake(id);
  }

  /**
   * Poison (Giant)
   */
  private giantPoisonous() {
    const giantPoisonous = this.create({
      monster: MonsterEnum.GiantPoisonousSnake,
      name: "monster.snake.name.giantPoisonous",
      files: [NEW_CREATURES.GiantPoisonousSnake],
      newFiles: [
        {
          files: [NEW_CREATURES.GiantPoisonousSnake],
          copyFrom: "jasnake",
          stringRef: "monster.snake.name.giantPoisonous",
        },
      ],
      data: {
        level1: 4,
        bonusHp: 2,
        strength: 10,
        dexterity: 18,
        constitution: 13,
        intelligence: 1,
        wisdom: 10,
        charisma: 3,
        ac: 5,
        apr: 1,
        xpv: 420,
        alignment: "NEUTRAL",
        morale: 9,
        general: "ANIMAL",
        race: "REPTILE",
        class: "NO_CLASS",
        gender: "NIETHER",
        size: "Medium",
        movement: 15,
        immunities: [],
        items: {
          remove: ["P1-3P"],
        },
      },
    });
    giantPoisonous.createJaws({
      diceThrown: 1,
      diceSize: 3,
      poisonType: "F",
    });
    giantPoisonous.setAdjustments([
      {
        files: [NEW_CREATURES.GiantPoisonousSnake],
        summon: true,
      },
    ]);
    return giantPoisonous;
  }
}

export const createSnakes = () => new SnakeFamily();
