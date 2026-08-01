import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import { ItemSlot } from "../src/model/creature/item";
import {
  AbilityDamageTypeEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
  ItemAnimationEnum,
  ItemCategoryEnum,
  ItemFlagEnum,
  ProficiencyTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

class Ettin extends Creature {
  /**
   * Large Spiked Club
   */
  createLargeSpikedClub(p: { diceThrown: number; diceSize: number; slot: ItemSlot }) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.ettin.weapon.largeSpikedClub",
        equippedSlot: [p.slot],
        flags: [ItemFlagEnum.Displayable],
        animation: ItemAnimationEnum.Club,
        category: ItemCategoryEnum.Clubs,
        icon: "IBLUN13",
        proficiency: ProficiencyTypeEnum.PROFICIENCYCLUB,
        header: {
          type: ItemAbilityTypeEnum.Melee,
          animationSwing: { backhand: 50, overhand: 50, thrust: 0 },
          diceThrown: p.diceThrown,
          diceSize: p.diceSize,
          damageType: AbilityDamageTypeEnum.Crushing,
          speed: 8,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
    });
  }
}

class EttinFamily extends CreatureFamily<Ettin> {
  constructor() {
    super(MonsterFamilyEnum.Ettin);
    this.addCreature(this.ettin());
  }
  createCreature(id: MonsterEnum): Ettin {
    return new Ettin(id);
  }
  /**
   * Ettin
   */
  private ettin() {
    const ettin = this.create({
      monster: MonsterEnum.Ettin,
      name: "monster.undead.name.banshee",
      files: [
        "BDETTIN", // Ettin Ghost
      ],
      data: {
        level1: 10,
        strength: 21,
        dexterity: 8,
        constitution: 17,
        intelligence: 7,
        wisdom: 10,
        charisma: 8,
        ac: 3,
        apr: 2,
        xpv: 3000,
        alignment: "CHAOTIC_EVIL",
        morale: 14,
        general: "GIANTHUMANOID",
        race: "ETTIN",
        class: "GIANT",
        gender: "NIETHER",
        size: "Huge",
        movement: 12,
        items: {
          remove: ["BDRINGGE", "B2-16"],
        },
      },
    });
    ettin.createLargeSpikedClub({
      diceThrown: 3,
      diceSize: 6,
      slot: "WEAPON1",
    });
    ettin.createLargeSpikedClub({ diceThrown: 2, diceSize: 8, slot: "SHIELD" });
    ettin.addTrait({
      immunities: ["backstab", "giant"],
    });
    ettin.setBehavior({
      restHeal: true,
      abilities: [],
    });
    ettin.setAdjustments([{ files: ["BDETTIN"], data: { script: { location: "None" } } }]);
    return ettin;
  }
}

export const createEttins = () => new EttinFamily();
