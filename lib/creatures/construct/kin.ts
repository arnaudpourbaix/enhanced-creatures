import { Creature } from "../../src/model/creature/creature";
import {
  AbilityDamageTypeEnum,
  ColorEnum,
  EffectColorLocationEnum,
  EffectDamageTypeEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
  ItemAnimationEnum,
  ItemCategoryEnum,
  ItemFlagEnum,
  ProficiencyTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { CreatureKin } from "../../src/model/creature/kin";
import { KinEnum } from "../kin";

export enum ConstructIds {
  Helmet,
  Armor,
  FlamingSword,
  Longsword,
}

export class Construct extends Creature {}

export class ConstructKin extends CreatureKin {
  /** Set when the Helmed Horror entry builds: the Battle Horror derives from it. */
  helmedHorror?: Construct;
  /** Set when the Battle Horror entry builds: the Doom Sayer derives from it. */
  battleHorror?: Construct;

  constructor() {
    super(KinEnum.Construct);
    this.createFlamingSword();
    this.createLongsword();
    this.createArmor();
    this.createHelmet();
  }

  createFlamingSword() {
    this.addWeapon({
      weapon: {
        stringRef: "monster.construct.weapon.flamingSword",
        id: ConstructIds.FlamingSword,
        equippedSlot: ["WEAPON1"],
        enchantment: 1,
        flags: [ItemFlagEnum.TwoHanded, ItemFlagEnum.Magical],
        animation: ItemAnimationEnum.TwoHandedSword,
        category: ItemCategoryEnum.Greatswords,
        proficiency: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD,
        header: {
          type: ItemAbilityTypeEnum.Melee,
          icon: "IFLAMS01",
          animationSwing: { backhand: 40, overhand: 40, thrust: 20 },
          range: 2,
          diceThrown: 2,
          diceSize: 6,
          damageType: AbilityDamageTypeEnum.Slashing,
          speed: 10,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
          effects: [
            {
              opcode: EffectTypeEnum.Damage,
              diceSize: 6,
              diceThrown: 1,
              type: EffectDamageTypeEnum.Fire,
            },
          ],
        },
        effects: [
          {
            opcode: EffectTypeEnum.SetColor,
            color: ColorEnum.ShinyGold,
            location: EffectColorLocationEnum.WeaponBlueHeadBladeMinor,
          },
          {
            opcode: EffectTypeEnum.SetColor,
            color: ColorEnum.ShinyGold,
            location: EffectColorLocationEnum.WeaponRedGripStaffMinor,
          },
          {
            opcode: EffectTypeEnum.SetColor,
            color: ColorEnum.LightCarnationPink,
            location: EffectColorLocationEnum.WeaponGreyHeadBladeStaffMajor,
          },
          {
            opcode: EffectTypeEnum.SetColorGlowSolid,
            color: { red: 64, green: 0, blue: 0 },
            location: EffectColorLocationEnum.WeaponGreyHeadBladeStaffMajor,
            duration: 3,
          },
          {
            opcode: EffectTypeEnum.SetColorGlowSolid,
            color: { red: 64, green: 0, blue: 0 },
            location: EffectColorLocationEnum.WeaponBlueHeadBladeMinor,
            duration: 3,
          },
          {
            opcode: EffectTypeEnum.SetColorGlowSolid,
            color: { red: 0, green: 0, blue: 0 },
            location: EffectColorLocationEnum.WeaponRedGripStaffMinor,
            duration: 3,
          },
        ],
      },
    });
  }

  createLongsword() {
    this.addWeapon({
      weapon: {
        stringRef: "monster.construct.weapon.longSword",
        id: ConstructIds.Longsword,
        equippedSlot: ["WEAPON1"],
        flags: [ItemFlagEnum.Magical],
        animation: ItemAnimationEnum.LongSword,
        icon: "ISW1H04",
        category: ItemCategoryEnum.LargeSwords,
        proficiency: ProficiencyTypeEnum.PROFICIENCYLONGSWORD,
        enchantment: 1,
        header: {
          type: ItemAbilityTypeEnum.Melee,
          animationSwing: { backhand: 50, overhand: 50, thrust: 0 },
          range: 1,
          diceThrown: 1,
          diceSize: 8,
          damageType: AbilityDamageTypeEnum.Slashing,
          speed: 5,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
        effects: [
          {
            opcode: EffectTypeEnum.SetColor,
            color: ColorEnum.Silver,
            location: EffectColorLocationEnum.WeaponBlueHeadBladeMinor,
          },
          {
            opcode: EffectTypeEnum.SetColor,
            color: ColorEnum.Rhubarb,
            location: EffectColorLocationEnum.WeaponRedGripStaffMinor,
          },
          {
            opcode: EffectTypeEnum.SetColor,
            color: ColorEnum.DarkSilver,
            location: EffectColorLocationEnum.WeaponGreyHeadBladeStaffMajor,
          },
        ],
      },
    });
  }

  createArmor() {
    this.addItem({
      id: ConstructIds.Armor,
      stringRef: "monster.construct.item.plateMail",
      equippedSlot: ["ARMOR"],
      animation: ItemAnimationEnum.PlateMail,
      icon: "IPLAT01",
      category: ItemCategoryEnum.ArmorSlot,
      effects: [
        {
          opcode: EffectTypeEnum.SetColor,
          color: ColorEnum.LeafGreen,
          location: EffectColorLocationEnum.ArmorBlueArmorTrimming,
        },
        {
          opcode: EffectTypeEnum.SetColor,
          color: ColorEnum.RedTintedBlack,
          location: EffectColorLocationEnum.ArmorRedStrapLeather,
        },
        {
          opcode: EffectTypeEnum.SetColor,
          color: ColorEnum.DarkPoopyBrown,
          location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
        },
      ],
    });
  }

  createHelmet() {
    this.addItem({
      id: ConstructIds.Helmet,
      stringRef: "monster.construct.item.helmet",
      equippedSlot: ["HELMET"],
      animation: ItemAnimationEnum.HelmetFeatherSideburns,
      category: ItemCategoryEnum.Headgear,
      icon: "ihelm10",
      effects: [
        {
          opcode: EffectTypeEnum.SetColor,
          color: ColorEnum.Silver,
          location: EffectColorLocationEnum.HelmetBlueExterior,
        },
        {
          opcode: EffectTypeEnum.SetColor,
          color: ColorEnum.Silver,
          location: EffectColorLocationEnum.HelmetRedFace,
        },
        {
          opcode: EffectTypeEnum.SetColor,
          color: ColorEnum.Silver,
          location: EffectColorLocationEnum.HelmetGreyWings,
        },
      ],
    });
  }
}

/** A creature another entry builds first and this entry derives from. */
export function builtBefore(creature: Construct | undefined, name: string): Construct {
  if (!creature) throw new Error(`The ${name} entry must build first`);
  return creature;
}

export const createConstructKin = () => new ConstructKin();
