import { SPELLS } from "../config/spells/spell-names";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
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
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {
  Helmet,
  Armor,
  FlamingSword,
  Longsword,
}

class Construct extends Creature {}

class ConstructFamily extends CreatureFamily<Construct> {
  constructor() {
    super(MonsterFamilyEnum.Construct);
    this.createFlamingSword();
    this.createLongsword();
    this.createArmor();
    this.createHelmet();
    this.addCreature(() => this.helmedHorror());
    this.addCreature(() => this.battleHorror());
    this.addCreature(() => this.doomSayer());
    this.addCreature(() => this.doomGuard());
  }

  createCreature(id: MonsterEnum): Construct {
    return new Construct(id);
  }

  /**
   * Helmed Horror
   */
  private helmedHorror() {
    const helmedHorror = this.create({
      monster: MonsterEnum.HelmedHorror,
      name: "monster.construct.name.helmedHorror",
      files: [],
      data: {
        level1: 4,
        bonusHp: 10,
        strength: 18,
        dexterity: 13,
        constitution: 9,
        intelligence: 14,
        wisdom: 10,
        charisma: 10,
        ac: 2,
        apr: 1,
        xpv: 2000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "MONSTER",
        race: "GOLEM",
        class: "FIGHTER",
        gender: "NIETHER",
        size: "Medium",
        animation: "FIGHTER_MALE_HUMAN",
        hairColor: 63,
        armorColor: 63,
        skinColor: 63,
        majorColor: 63,
        metalColor: 63,
        minorColor: 63,
        leatherColor: 63,
        movement: 12,
        items: {
          remove: [
            "HELM08",
            "HELM01",
            "SHLD18",
            "RING95",
            "RING98",
            "BLUN08",
            "FBLADE",
            "PLAT07",
            "HELM13",
          ],
        },
        immunities: ["construct"],
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD, value: 2 }],
      },
    });
    helmedHorror.addTrait({
      immunities: [
        "seeInvisible",
        "fireballSpell",
        "lightningBoltSpell",
        "flameArrowSpell",
        "magicMissile",
        "hover",
      ],
    });
    helmedHorror.equipItem(this.item(Ids.FlamingSword));
    helmedHorror.equipItem(this.item(Ids.Armor));
    helmedHorror.equipItem(this.item(Ids.Helmet));
    helmedHorror.setBehavior({
      restHeal: true,
    });
    return helmedHorror;
  }

  /**
   * Battle Horror
   */
  private battleHorror() {
    const battleHorror = this.createFrom({
      name: "monster.construct.name.battleHorror",
      monster: MonsterEnum.BattleHorror,
      from: this.creature(MonsterEnum.HelmedHorror),
      files: [],
    });
    battleHorror.setData({
      level1: 8,
      level2: 3, // for magic missiles as a level 3 wizard
      bonusHp: 11,
      strength: 20,
      class: "FIGHTER_MAGE",
      alignment: "LAWFUL_EVIL",
      xpv: 4000,
      spells: {
        memorized: [
          { file: SPELLS.Wizard.MagicMissiles.file, memorizedCount: 1 },
          { file: SPELLS.Wizard.DimensionDoor.file, memorizedCount: 1 },
        ],
      },
    });
    battleHorror.setBehavior({
      abilities: [
        {
          preset: SPELLS.Wizard.MagicMissiles.file,
          spell: {
            type: "noDec",
          },
          triggers: [{ name: "Range", params: ["NearestEnemyOf", 10], negation: true }],
          requireVocal: false,
          timer: { name: "MagicMissiles", value: 18 },
        },
      ],
      customCodes: [
        {
          location: "trackTargets",
          type: "insertBefore",
          abilities: [
            {
              preset: SPELLS.Wizard.DimensionDoor.file,
              range: 180,
              requireVocal: false,
            },
          ],
        },
      ],
    });
    return battleHorror;
  }

  /**
   * Doom Sayer
   */
  private doomSayer() {
    const doomSayer = this.createFrom({
      name: "monster.construct.name.doomSayer",
      monster: MonsterEnum.DoomSayer,
      from: this.creature(MonsterEnum.BattleHorror),
      files: [],
    });
    doomSayer.setData({
      immunities: ["incorporeal"],
    });
    doomSayer.setBehavior({ dialog: ["DOOMSAYER"] });
    return doomSayer;
  }

  /**
   * Doom Guard
   */
  private doomGuard() {
    const doomGuard = this.create({
      monster: MonsterEnum.DoomGuard,
      name: "monster.construct.name.doomGuard",
      files: [],
      data: {
        level1: 5,
        strength: 20,
        dexterity: 10,
        constitution: 9,
        intelligence: 7,
        wisdom: 11,
        charisma: 1,
        ac: 2,
        apr: 1,
        xpv: 2000,
        alignment: "NEUTRAL",
        morale: 20,
        general: "MONSTER",
        race: "GOLEM",
        class: "FIGHTER",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
        items: { remove: ["HELM13", "PLAT07", "SW1H11", "RING95"] },
        immunities: ["construct"],
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD, value: 2 }],
      },
    });
    doomGuard.addTrait({
      immunities: ["fireResistance", "coldResistance"],
    });
    doomGuard.equipItem(this.item(Ids.Longsword));
    doomGuard.equipItem(this.item(Ids.Armor));
    doomGuard.equipItem(this.item(Ids.Helmet));
    doomGuard.setBehavior({
      restHeal: true,
    });
    doomGuard.setAdjustments([
      {
        files: ["DOOMDUR"],
        data: {
          level1: 8,
          proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD, value: 3 }],
        },
      },
    ]);
    return doomGuard;
  }

  createArmor() {
    this.addItem({
      id: Ids.Armor,
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
      id: Ids.Helmet,
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

  createFlamingSword() {
    this.addWeapon({
      weapon: {
        stringRef: "monster.construct.weapon.flamingSword",
        id: Ids.FlamingSword,
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
        id: Ids.Longsword,
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
}

export const createConstructs = () => new ConstructFamily();
