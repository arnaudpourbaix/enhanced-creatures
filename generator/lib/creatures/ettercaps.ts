import { MonsterItemIconEnum } from "../config/item";
import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import {
  AbilityDamageTypeEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
} from "../src/model/spell-item/effect.enums";
import poisonService from "../src/services/effects/poison.service";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

class Ettercap extends Creature {}

class EttercapFamily extends CreatureFamily<Ettercap> {
  constructor() {
    super(MonsterFamilyEnum.Ettercap);
    this.addCreature(() => this.ettercap());
  }

  createCreature(id: MonsterEnum): Ettercap {
    return new Ettercap(id);
  }

  /**
   * Ettercap
   */
  private ettercap() {
    const ettercap = this.create({
      monster: MonsterEnum.Ettercap,
      name: "monster.ettercap.name.ettercap",
      files: [],
      data: {
        level1: 5,
        strength: 14,
        dexterity: 15,
        constitution: 13,
        intelligence: 7,
        wisdom: 12,
        charisma: 8,
        ac: 6,
        apr: 3,
        xpv: 650,
        alignment: "NEUTRAL_EVIL",
        morale: 13,
        general: "MONSTER",
        race: "ETTERCAP",
        class: "ETTERCAP",
        gender: "NIETHER",
        size: "Medium",
        movement: 12,
        immunities: ["web"],
        items: {
          remove: ["ETTERC1", "ETTERC2", "ANTIWEB"],
        },
        script: {
          remove: ["ETTERCAP"],
        },
      },
    });
    ettercap.addWeapon({
      weapon: {
        stringRef: "monster.ettercap.weapon.claws",
        icon: MonsterItemIconEnum.Wolf,
        equippedSlot: ["WEAPON1"],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: 1,
          diceSize: 3,
          damageType: AbilityDamageTypeEnum.Slashing,
          speed: 5,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
    });
    ettercap.addWeapon({
      weapon: {
        stringRef: "monster.ettercap.weapon.jaws",
        icon: MonsterItemIconEnum.Jaws,
        equippedSlot: ["SHIELD"],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: 1,
          diceSize: 8,
          damageType: AbilityDamageTypeEnum.Piercing,
          speed: 2,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
      castSpells: [poisonService.getSpell({ poisonType: "J" })],
    });
    ettercap.setAttack({
      targetPriorities: [{ status: ["HeldAndNotPoisoned"] }],
    });
    ettercap.setAdjustments([{ files: ["ETTERCSU"], summon: true }]);
    return ettercap;
  }
}
export const createEttercaps = () => new EttercapFamily();
