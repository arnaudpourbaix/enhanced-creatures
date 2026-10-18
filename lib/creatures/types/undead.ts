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
import type { CreatureTypeModule } from "../../src/services/creature-type-hooks.service";
import creatureTypeService from "../../src/services/creature-type.service";
import { applyTurnLevel } from "./turn-level";

/**
 * Undead type: d12 Hit Dice, General UNDEAD and the turn level of every undead creature (and of
 * adjustments making a creature undead). The weapon helpers below are shared by every undead
 * entry; creature-specific spells and abilities live in the entries' files.
 */
export const undeadType: CreatureTypeModule = {
  type: "undead",
  hitDie: 12,
  afterBuild: (creature) => {
    applyUndeadGeneral(creature);
    applyTurnLevel(creature);
  },
};

/**
 * Turn Undead only affects creatures whose CRE General is UNDEAD (tested in game), and the mod
 * writes General over the game's: an undead creature gets UNDEAD, so do its adjustments that set
 * another General, and, for a creature that isn't undead, each adjustment making it undead
 * (zombie ankhegs). Undead only by a type trait or trait item (Wraith Spider, Dread Wolf) counts.
 */
export function applyUndeadGeneral(creature: Creature): void {
  const own = creatureTypeService.getCreatureTypes(creature);
  if (own.includes("undead")) {
    creature.data.general = "UNDEAD";
    for (const { data } of creature.adjustments) {
      if (data.general !== undefined) data.general = "UNDEAD";
    }
    return;
  }
  for (const adjustment of creature.adjustments) {
    if (creatureTypeService.getAdjustmentTypes(creature, adjustment, own).includes("undead")) {
      adjustment.data.general = "UNDEAD";
    }
  }
}

export function createTouch(
  creature: Creature,
  p: {
    diceThrown: number;
    diceSize: number;
    damageBonus?: number;
    effects?: Effect[];
    slot?: ItemSlot;
  },
) {
  return creature.addNaturalWeapon("touch", {
    diceThrown: p.diceThrown,
    diceSize: p.diceSize,
    damageBonus: p.damageBonus,
    speed: 3,
    effects: p.effects,
    slot: p.slot ?? null,
  });
}

export function createClaws(
  creature: Creature,
  p: {
    diceThrown: number;
    diceSize: number;
    damageBonus?: number;
    effects?: Effect[];
    castSpell?: WeaponCastSpell;
    equipped?: boolean;
  },
) {
  return creature.addNaturalWeapon("claws", {
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

export function createShadowWeapon(
  creature: Creature,
  p: {
    diceThrown: number;
    diceSize: number;
    damageBonus: number;
    opcode: EffectTypeEnum.StrengthBonus | EffectTypeEnum.WisdomBonus;
    drainValue: number;
    equipped?: boolean;
  },
) {
  const baseEffect: BaseEffect = {
    dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
    duration: 5 * Durations.turn,
  };
  return createClaws(creature, {
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

export function createJaws(
  creature: Creature,
  diceThrown: number,
  diceSize: number,
  castSpells?: WeaponCastSpell[],
  slot: WeaponSlot = "SHIELD",
) {
  return creature.addNaturalWeapon("jaws", {
    diceThrown,
    diceSize,
    slot,
    castSpells,
    speed: 3,
  });
}
