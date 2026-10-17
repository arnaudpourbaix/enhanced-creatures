import { MonsterItemIconEnum } from "../../config/item";
import {
  AbilityDamageTypeEnum,
  CastSpellOnConditionTargetEnum,
  EffectBonusToEnum,
  EffectDispelResistanceEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { Cat } from "./kin";

class DisplacerBeastEntry extends CreatureEntry<Cat> {
  constructor(kin?: CreatureKin) {
    super(EntryEnum.DisplacerBeast, kin, MonsterFamilyEnum.Cat);
    this.addCreature(() => this.displacerBeast());
  }

  createCreature(id: MonsterEnum): Cat {
    return new Cat(id);
  }

  /**
   * Displacer Beast
   */
  private displacerBeast() {
    const displacerBeast = this.create({
      monster: MonsterEnum.DisplacerBeast,
      name: "monster.cat.name.displacerBeast",
      files: [],
      data: {
        level1: 6,
        strength: 18,
        dexterity: 15,
        constitution: 16,
        intelligence: 4,
        wisdom: 12,
        charisma: 8,
        ac: 6,
        apr: 2,
        xpv: 975,
        alignment: "LAWFUL_EVIL",
        morale: 14,
        general: "MONSTER",
        race: "CAT",
        class: "CAT",
        gender: "NIETHER",
        size: { value: "Large", tall: false, long: true },
        movement: 15,
        items: {
          remove: ["BDDISPBE", "JY_01DB", "JY_02DB", "JY_03DB", "BOOT01", "MOBHA39A"],
        },
        immunities: ["magicalBeast", "backstab"],
      },
      autoGenerate: {
        savingThrows: {
          level: 12,
          classe: "FIGHTER",
          bonus: {
            saveDeath: 2,
            saveBreath: 2,
            savePolymorph: 2,
            saveSpell: 2,
            saveWand: 2,
          },
        },
      },
    });
    displacerBeast.addTrait({
      immunities: ["magic", "fire", "cold"],
      effects: [
        {
          opcode: EffectTypeEnum.ArmorClassBonus,
          bonusTo: EffectBonusToEnum.AllWeapons,
          value: 2,
          dispelResistance: EffectDispelResistanceEnum.NotDispelBypassResistance,
        },
        {
          opcode: EffectTypeEnum.Blur,
          dispelResistance: EffectDispelResistanceEnum.NotDispelBypassResistance,
        },
        {
          opcode: EffectTypeEnum.MirrorImageEffect,
          amount: 1,
          dispelResistance: EffectDispelResistanceEnum.NotDispelBypassResistance,
        },
        {
          opcode: EffectTypeEnum.CastSpellOnCondition,
          condition: "AttackedBy([ANYONE])",
          conditionTarget: CastSpellOnConditionTargetEnum.Myself,
          resource: "BDDISPLC",
          dispelResistance: EffectDispelResistanceEnum.NotDispelBypassResistance,
        },
      ],
    });
    displacerBeast.addWeapon({
      weapon: {
        stringRef: "monster.cat.weapon.tentacles",
        icon: MonsterItemIconEnum.Jelly,
        equippedSlot: ["WEAPON1"],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          range: 5,
          diceThrown: 2,
          diceSize: 4,
          damageType: AbilityDamageTypeEnum.PiercingOrCrushing,
          speed: 3,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
    });
    displacerBeast.setAdjustments([
      {
        files: ["BDDISPBP"],
        data: {
          level1: 9,
          xpv: 1100,
          strength: 19,
          constitution: 19,
          ac: 2,
        },
      },
      {
        files: ["JY_00DB1"],
        data: {
          level1: 12,
          xpv: 1200,
        },
      },
      {
        files: ["JY_00DB"],
        data: {
          level1: 14,
          xpv: 3000,
          apr: 4,
          resistMagic: 50,
        },
      },
    ]);
    return displacerBeast;
  }
}

export const createDisplacerBeastEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new DisplacerBeastEntry(kins.get(KinEnum.Cat));
