import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import {
  AbilityDamageTypeEnum,
  ColorEnum,
  EffectColorLocationEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
  ItemAnimationEnum,
  ItemCategoryEnum,
  ItemFlagEnum,
  ProficiencyTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { EntryEnum } from "../entry";
import { KinEnum } from "../kin";
import { MonsterEnum } from "../monster";
import { Construct, ConstructIds, ConstructKin } from "./kin";

class DoomGuardEntry extends CreatureEntry<Construct> {
  constructor(private readonly constructKin?: ConstructKin) {
    super(EntryEnum.DoomGuard, constructKin);
    this.createLongsword();
    this.addCreature(() => this.doomGuard());
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

  createCreature(id: MonsterEnum): Construct {
    return new Construct(id);
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
        size: { value: "Medium", tall: true, long: false },
        movement: 12,
        items: { remove: ["HELM13", "PLAT07", "SW1H11", "RING95"] },
        immunities: ["construct"],
        proficiencies: [{ type: ProficiencyTypeEnum.PROFICIENCYLONGSWORD, value: 2 }],
      },
    });
    doomGuard.addTrait({
      immunities: ["fireResistance", "coldResistance"],
    });
    doomGuard.equipItem(this.item(ConstructIds.Longsword));
    doomGuard.equipItem(this.item(ConstructIds.Armor));
    doomGuard.equipItem(this.item(ConstructIds.Helmet));
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
      {
        files: ["WIPINATA"],
        noWeapon: true,
        data: {
          level1: 8,
          ac: -3,
          xpv: 3000,
        },
      },
    ]);
    return doomGuard;
  }
}

export const createDoomGuardEntry = (kins: Map<KinEnum, CreatureKin>) =>
  new DoomGuardEntry(kins.get(KinEnum.Construct) as ConstructKin | undefined);
