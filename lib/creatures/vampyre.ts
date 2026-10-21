import effectFactory from "../src/factories/effect.factory";
import { Creature } from "../src/model/creature/creature";
import type { CreatureEntry } from "../src/model/creature/entry";
import { SimpleEntry } from "../src/model/creature/simple-entry";
import { Durations } from "../src/model/game-data/durations";
import { Effect } from "../src/model/spell-item/effect";
import {
  CharmTypeEnum,
  EffectDamageTypeEnum,
  EffectDispelResistanceEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { EntryEnum } from "./entry";
import { MonsterEnum } from "./monster";

export function vampyre(entry: CreatureEntry<Creature>): Creature {
  const vampyre = entry.create({
    monster: MonsterEnum.Vampyre,
    name: "monster.vampyre.name",
    files: [],
    data: {
      level1: 8,
      bonusHp: 3,
      strength: 15,
      dexterity: 16,
      constitution: 13,
      intelligence: 16,
      wisdom: 14,
      charisma: 18,
      ac: 4,
      apr: 3,
      xpv: 2000,
      alignment: "CHAOTIC_EVIL",
      morale: 12,
      general: "MONSTER",
      race: "VAMPYRE",
      class: "VAMPYRE",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
      items: {
        remove: ["vampreg"],
      },
      script: {
        remove: ["vampir01"],
      },
    },
  });
  vampyre.addNaturalWeapon("claws", {
    diceThrown: 1,
    diceSize: 4,
    speed: 5,
    slot: "WEAPON1",
  });
  // The bite's 1d6 is dealt by its spell, so the charm's save can depend on the damage rolled
  vampyre.addNaturalWeapon("jaws", {
    diceThrown: 0,
    diceSize: 0,
    speed: 5,
    slot: "SHIELD",
    castSpells: [
      {
        spell: {
          name: "monster.vampyre.ability.bite.name",
          description: "monster.vampyre.ability.bite.description",
          secondaryType: ItemAbilitySecondaryTypeEnum.OffensiveDamage,
          headers: [{ type: ItemAbilityTypeEnum.Melee, range: 5, effects: biteEffects(6) }],
        },
      },
    ],
  });
  vampyre.setBehavior({
    restHeal: true,
  });
  return vampyre;
}

/**
 * The saliva of a vampyre carries a toxin: those bitten save vs. poison or become charmed, at a -1
 * penalty for every 2 points of damage of the bite (3 points saves at -2, so rounded up). One
 * outcome per damage value, each its damage and its charm, sharing an even probability range:
 * the engine rolls the probability once for all the effects of a spell.
 */
function biteEffects(diceSize: number): Effect[] {
  const outcomes = effectFactory.splitProbabilities(
    Array.from({ length: diceSize }, (_, i) => ({
      opcode: EffectTypeEnum.Damage,
      amount: i + 1,
      type: EffectDamageTypeEnum.Piercing,
    })),
  );
  return outcomes.flatMap((damage, i) => [
    damage,
    ...effectFactory
      .charm({
        charmType: CharmTypeEnum.HostileCharm,
        duration: Durations.turn,
        dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
        saveType: SaveTypeEnum.ParalyzePoisonDeath,
        saveBonus: -Math.ceil((i + 1) / 2),
      })
      .map((charm) => ({
        ...charm,
        probability1: damage.probability1,
        probability2: damage.probability2,
      })),
  ]);
}

export const createVampyreEntry = () => new SimpleEntry(EntryEnum.Vampyre, [vampyre]);
