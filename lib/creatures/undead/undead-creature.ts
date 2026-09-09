import { MonsterItemIconEnum } from "../../config/item";
import { Creature } from "../../src/model/creature/creature";
import { ItemSlot, WeaponSlot } from "../../src/model/creature/item";
import { Durations } from "../../src/model/game-data/durations";
import { BaseEffect, Effect } from "../../src/model/spell-item/effect";
import {
  AbilityDamageTypeEnum,
  EffectDispelResistanceEnum,
  EffectStatisticModifierEnum,
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
  PortraitIconEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { WeaponCastSpell } from "../../src/model/spell-item/spell-item";

/**
 * Shared weapon primitives for every undead creature. Creature-specific spells
 * and abilities live as plain functions in the per-sub-category files
 * (ghouls.ts, mummies.ts, skeletons.ts, spectral.ts, zombies.ts).
 */
export class Undead extends Creature {
  createTouch(p: {
    diceThrown: number;
    diceSize: number;
    damageBonus?: number;
    effects?: Effect[];
    slot?: ItemSlot;
  }) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.undead.weapon.touch",
        icon: MonsterItemIconEnum.Fist,
        equippedSlot: p.slot ? [p.slot] : [],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: p.diceThrown,
          diceSize: p.diceSize,
          damageBonus: p.damageBonus,
          damageType: AbilityDamageTypeEnum.Crushing,
          speed: 3,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
          effects: p.effects,
        },
      },
    });
  }

  createClaws(p: {
    diceThrown: number;
    diceSize: number;
    damageBonus?: number;
    effects?: Effect[];
    castSpell?: WeaponCastSpell;
    equipped?: boolean;
  }) {
    const equipped = p.equipped ?? true;
    return this.addWeapon({
      weapon: {
        stringRef: "monster.undead.weapon.claws",
        icon: MonsterItemIconEnum.Ghoul,
        equippedSlot: equipped ? ["WEAPON1"] : [],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: p.diceThrown,
          diceSize: p.diceSize,
          damageBonus: p.damageBonus,
          damageType: AbilityDamageTypeEnum.Slashing,
          speed: 5,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
          effects: p.effects,
        },
      },
      castSpells: p.castSpell ? [p.castSpell] : undefined,
    });
  }

  createShadowWeapon(p: {
    diceThrown: number;
    diceSize: number;
    damageBonus: number;
    opcode: EffectTypeEnum.StrengthBonus | EffectTypeEnum.WisdomBonus;
    drainValue: number;
    equipped?: boolean;
  }) {
    const baseEffect: BaseEffect = {
      dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
      duration: 5 * Durations.turn,
    };
    return this.createClaws({
      diceThrown: p.diceThrown,
      diceSize: p.diceSize,
      damageBonus: p.damageBonus,
      equipped: p.equipped,
      effects: [
        {
          opcode: p.opcode,
          type: EffectStatisticModifierEnum.Increment,
          value: p.drainValue,
          ...baseEffect,
        },
        {
          opcode: EffectTypeEnum.DisplayPortraitIcon,
          icon: PortraitIconEnum.AbilityScoreDrained,
          ...baseEffect,
        },
      ],
    });
  }

  createJaws(
    diceThrown: number,
    diceSize: number,
    castSpells?: WeaponCastSpell[],
    slot: WeaponSlot = "SHIELD",
  ) {
    return this.addWeapon({
      weapon: {
        stringRef: "monster.undead.weapon.jaws",
        icon: MonsterItemIconEnum.Jaws,
        equippedSlot: [slot],
        header: {
          type: ItemAbilityTypeEnum.Melee,
          diceThrown: diceThrown,
          diceSize: diceSize,
          damageType: AbilityDamageTypeEnum.Piercing,
          speed: 3,
          abilityflags: [ItemAbilityFlagEnum.AddStrengthBonus],
        },
      },
      castSpells,
    });
  }
}
