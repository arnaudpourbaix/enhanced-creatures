import { ATWEAKS_CREATURES } from "../config/creatures";
import { MonsterItemIconEnum } from "../config/item";
import effectFactory from "../src/factories/effect.factory";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import {
  AbilityDamageTypeEnum,
  EffectStatisticModifierEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

class Plant extends Creature {
  createBranch(diceThrown: number, diceSize: number, equip = false) {
    return this.addItem({
      stringRef: "monster.plant.weapon.branch",
      icon: MonsterItemIconEnum.Golem,
      equippedSlot: equip ? ["WEAPON1"] : undefined,
      header: {
        type: ItemAbilityTypeEnum.Melee,
        diceThrown: diceThrown,
        diceSize: diceSize,
        damageType: AbilityDamageTypeEnum.Crushing,
        range: 5,
        speed: 8,
        abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
      },
    });
  }
}

class PlantFamily extends CreatureFamily<Plant> {
  constructor() {
    super(MonsterFamilyEnum.Plant);
    this.addCreature(() => this.treant());
  }

  createCreature(id: MonsterEnum): Plant {
    return new Plant(id);
  }

  /**
   * Treant
   */
  private treant() {
    const treant = this.create({
      monster: MonsterEnum.Treant,
      name: "monster.plant.name.treant",
      files: [
        ATWEAKS_CREATURES.Treant11hd,
        ATWEAKS_CREATURES.Treant9hd,
        ATWEAKS_CREATURES.Treant7hd,
        ATWEAKS_CREATURES.Treant5hd,
      ],
      newFiles: [
        {
          files: [ATWEAKS_CREATURES.Treant11hd],
          copyFrom: "jatrean",
          stringRef: "monster.plant.name.treant11HD",
        },
        {
          files: [ATWEAKS_CREATURES.Treant9hd],
          copyFrom: "jatrean",
          stringRef: "monster.plant.name.treant9HD",
        },
        {
          files: [ATWEAKS_CREATURES.Treant7hd],
          copyFrom: "jatrean",
          stringRef: "monster.plant.name.treant7HD",
        },
        {
          files: [ATWEAKS_CREATURES.Treant5hd],
          copyFrom: "jatrean",
          stringRef: "monster.plant.name.treant5HD",
        },
      ],
      data: {
        level1: 11,
        strength: 23,
        dexterity: 8,
        constitution: 21,
        intelligence: 12,
        wisdom: 16,
        charisma: 12,
        ac: 0,
        apr: 2,
        xpv: 6000,
        alignment: "CHAOTIC_GOOD",
        morale: 16,
        general: "PLANT",
        race: "TREANT",
        class: "NO_CLASS",
        gender: "NIETHER",
        size: "Huge",
        movement: 12,
        immunities: ["plant"],
        items: {
          remove: ["BDTREANT", "BDPLANT", "IPSION"],
        },
      },
    });
    treant.createBranch(4, 6, true);
    const wp9 = treant.createBranch(3, 6).file;
    const wp7 = treant.createBranch(2, 8).file;
    const wp5 = treant.createBranch(2, 6).file;
    treant.addTrait({
      effects: effectFactory.fireResistance(-25),
    });
    treant.setAdjustments([
      {
        files: [ATWEAKS_CREATURES.Treant9hd],
        data: {
          level1: 9,
          strength: 21,
          constitution: 20,
          xpv: 4000,
          items: { equipped: [{ file: wp9, slot: "WEAPON1" }] },
        },
      },
      {
        files: [ATWEAKS_CREATURES.Treant7hd],
        data: {
          level1: 7,
          strength: 20,
          constitution: 20,
          xpv: 2000,
          items: { equipped: [{ file: wp7, slot: "WEAPON1" }] },
        },
      },
      {
        files: [ATWEAKS_CREATURES.Treant5hd],
        data: {
          level1: 5,
          strength: 19,
          constitution: 19,
          xpv: 1400,
          items: { equipped: [{ file: wp5, slot: "WEAPON1" }] },
        },
      },
    ]);
    return treant;
  }
}

export const createPlants = () => new PlantFamily();
