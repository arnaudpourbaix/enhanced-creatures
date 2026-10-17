import { MonsterItemIconEnum } from "../../config/item";
import { Creature } from "../../src/model/creature/creature";
import { ItemSlot, WeaponSlot } from "../../src/model/creature/item";
import { Durations } from "../../src/model/game-data/durations";
import { BaseEffect, Effect } from "../../src/model/spell-item/effect";
import {
  EffectDispelResistanceEnum,
  EffectStatisticModifierEnum,
  PortraitIconEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { WeaponCastSpell } from "../../src/model/spell-item/spell-item";
import type { TurnUndeadType } from "./turn-level";

/**
 * Shared weapon primitives for every undead creature. Creature-specific spells
 * and abilities live as plain functions in the undead entries' files
 * (ghoul.ts, mummy.ts, skeleton/, ghost.ts, zombie.ts...).
 */
export class Undead extends Creature {
  /** PnP "turned as" row, when harder to turn than the creature's own Hit Dice. */
  turnAs?: TurnUndeadType;

  createTouch(p: {
    diceThrown: number;
    diceSize: number;
    damageBonus?: number;
    effects?: Effect[];
    slot?: ItemSlot;
  }) {
    return this.addNaturalWeapon("touch", {
      stringRef: "monster.undead.weapon.touch",
      diceThrown: p.diceThrown,
      diceSize: p.diceSize,
      damageBonus: p.damageBonus,
      speed: 3,
      effects: p.effects,
      slot: p.slot ?? null,
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
    return this.addNaturalWeapon("claws", {
      stringRef: "monster.undead.weapon.claws",
      icon: MonsterItemIconEnum.Ghoul,
      diceThrown: p.diceThrown,
      diceSize: p.diceSize,
      damageBonus: p.damageBonus,
      speed: 5,
      effects: p.effects,
      slot: (p.equipped ?? true) ? "WEAPON1" : null,
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
    return this.addNaturalWeapon("jaws", {
      diceThrown,
      diceSize,
      slot,
      castSpells,
      stringRef: "monster.undead.weapon.jaws",
      speed: 3,
    });
  }
}
