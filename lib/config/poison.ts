import { Durations } from "../src/model/game-data/durations";
import { PnPPoisonType } from "../src/model/spell-item/effect.enums";

export interface PoisonModel {
  type: PnPPoisonType;
  damage: number;
  saveDamage: number;
  duration: number;
}

export const poisonFatalDamage = 250;
export const poisonImmediateDeathDuration = 12; // 2 rounds so it gives some time to cure it

export const POISONS: PoisonModel[] = [
  {
    // 10–30 minutes (~16 rounds) 15/0
    type: "A",
    damage: 15,
    saveDamage: 0,
    duration: 20 * Durations.minute,
  },
  {
    // 2–12 minutes (~6 rounds) 20/1-3
    type: "B",
    damage: 20,
    saveDamage: 2,
    duration: 7 * Durations.minute,
  },
  {
    // 2–5 minutes (~3 rounds) 25/2-8
    type: "C",
    damage: 25,
    saveDamage: 5,
    duration: 3 * Durations.minute,
  },
  {
    // 1–2 minutes (~2 rounds) 30/2-12
    type: "D",
    damage: 30,
    saveDamage: 7,
    duration: 2 * Durations.minute,
  },
  {
    // Immediate Death/20
    type: "E",
    damage: poisonFatalDamage,
    saveDamage: 20,
    duration: poisonImmediateDeathDuration,
  },
  {
    // Immediate Death/0
    type: "F",
    damage: poisonFatalDamage,
    saveDamage: 0,
    duration: poisonImmediateDeathDuration,
  },
  {
    // 2–12 hours (~20 turns) 20/10
    type: "G",
    damage: 20,
    saveDamage: 10,
    duration: 4 * Durations.hour,
  },
  {
    // 1–4 hours (~10 turns) 20/10
    type: "H",
    damage: 20,
    saveDamage: 10,
    duration: 2 * Durations.hour,
  },
  {
    // 2–12 minutes (~6 rounds) 30/15
    type: "I",
    damage: 30,
    saveDamage: 15,
    duration: 7 * Durations.minute,
  },
  {
    // 1–4 minutes (~4 rounds) Death/20
    type: "J",
    damage: poisonFatalDamage,
    saveDamage: 20,
    duration: poisonImmediateDeathDuration + 3 * Durations.minute,
  },
  {
    // 2–8 minutes (~4 rounds) 5/0
    type: "K",
    damage: 5,
    saveDamage: 0,
    duration: 5 * Durations.minute,
  },
  {
    // 2–8 minutes (~4 rounds) 10/0
    type: "L",
    damage: 10,
    saveDamage: 0,
    duration: 2 * Durations.minute,
  },
  {
    // 1–4 minutes (~3 rounds) 20/5
    type: "M",
    damage: 20,
    saveDamage: 5,
    duration: 3 * Durations.minute,
  },
  {
    // 1 minute (~1 round) Death/25
    type: "N",
    damage: poisonFatalDamage,
    saveDamage: 25,
    duration: poisonImmediateDeathDuration + Durations.minute,
  },
  {
    // 2–24 minutes Paralytic.
    // Paralytic poisons leave the character unable to move for 2d6 hours.
    type: "O",
    damage: 0,
    saveDamage: 0,
    duration: 13 * Durations.minute,
  },
  {
    // 1–3 hours Debilitative.
    // Weaken the character for 1d3 days.
    // All of the character's ability scores are reduced by half during this time.
    // All appropriate adjustments to attack rolls, damage, Armor Class, etc., from the lowered ability scores are applied during the course of the illness.
    // In addition, the character moves at one-half his normal movement rate.
    // Finally, the character cannot heal by normal or magical means until the poison is neutralized or the duration of the debilitation is elapsed.
    type: "P",
    damage: 0,
    saveDamage: 0,
    duration: 2 * Durations.day,
  },
  {
    // fall into a coma for 2d4 turns (used by Gargantuan spider)
    type: "Q",
    damage: 0,
    saveDamage: 0,
    duration: 5 * Durations.turn,
  },
  {
    // the victim's AC and attack rolls are penalized by 1, and Dexterity is penalized by -3.
    // These effects begin one round after the bite and last for 1d4+1 rounds.
    type: "R",
    damage: 0,
    saveDamage: 0,
    duration: 4 * Durations.round,
  },
  {
    // This poison remains active for 5 rounds and drains 1 point of Constitution each round it is active.
    // The victim must roll a successful saving throw vs. poison each round to escape the poison's effects for that round.
    // Constitution points can be regained at the rate of 1 per week; a heal spell restores 1-4 points per spell.
    type: "S",
    damage: 0,
    saveDamage: 0,
    duration: 5 * Durations.round,
  },
];
