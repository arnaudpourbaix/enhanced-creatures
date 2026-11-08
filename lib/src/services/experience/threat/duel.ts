import { SpellRole } from "../../../../config/spells/spell-role";
import { CombatProfile, HitEffect, ProfileAttack, ProfilePower } from "./combat-profile";
import {
  ReferenceCombatant,
  referenceArcher,
  referenceEnchantment,
  referenceFighter,
  saveOf,
} from "./reference";

// The threat duels: the rounds a monster needs to take a reference fighter (melee) or archer
// (ranged) of its level out, against the rounds he needs to kill it. Threat is their ratio.

export interface DuelResult {
  /** Rounds the monster needs to take the reference out (R_m), at most 30 */
  monsterRounds: number;
  /** Rounds the reference needs to kill the monster (R_f), party factors included */
  fighterRounds: number;
  /** fighterRounds ÷ monsterRounds: about 1 is an even fight for its level */
  ratio: number;
  /** Short lines for the breakdown ("77% ending a round") */
  notes: string[];
}

export interface GameSpellHazard {
  average: number;
  ending: boolean;
  area: boolean;
}

/** The longest duel: a monster that can't be killed (or can't kill) saturates there */
const MAX_ROUNDS = 30;
/** A drained level is worth a level of the reference's HP (10 + 3 Con) */
const HP_PER_LEVEL = 13;
const HP_PER_STRENGTH = 1.3;
/** A disease is worth a level of HP */
const DISEASE_HP = 13;
const AREA_FACTOR = 1.5;
const INVISIBLE_TO_HIT = 0.1;
/** The archer's movement: a slower melee monster is kited, one as fast or faster closes in */
const KITING_MOVEMENT = 12;
/** A kiting archer shoots at half rate */
const KITING_RATE = 0.5;
/** The fewest rounds a fast monster's free round of arrows leaves the archer */
const MIN_CLOSING_ROUNDS = 0.5;
/**
 * The ranged duel's weight in the threat (user, 2026-11-08): a party mostly melees, and with 3 to 10
 * enemies an archer is rarely safe to kite; the ranged duel only discounts a slow melee brute
 */
const RANGED_WEIGHT = 0.25;
const INVISIBLE_FACTOR = 1.2;
const DECLARED_FACTOR = 1.1;

const harmlessSpell = (): GameSpellHazard => ({ average: 0, ending: false, area: false });
const endingSpell = (): GameSpellHazard => ({ average: 0, ending: true, area: false });

/** The game's own spells (no damage data): by role and level */
export const GAME_SPELL_HAZARD: Record<SpellRole, (level: number) => GameSpellHazard> = {
  damage: (level) => ({ average: 3.5 * (level + 1) * 2, ending: false, area: true }),
  disable: endingSpell,
  kill: endingSpell,
  reactive: harmlessSpell,
  protection: harmlessSpell,
  buff: harmlessSpell,
  summon: harmlessSpell,
  shapeshift: harmlessSpell,
  useless: harmlessSpell,
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** The chance to hit: (21 − (THAC0 − AC)) ÷ 20, clamped to 5%..95% */
export function pHit(thac0: number, ac: number): number {
  return clamp((21 - (thac0 - ac)) / 20, 0.05, 0.95);
}

/** The chance a d20 + bonus rolls under the save */
export function pFail(save: number, bonus: number): number {
  return clamp((save - 1 - bonus) / 20, 0, 1);
}

/** At least one of independent chances */
function either(chances: number[]): number {
  return 1 - chances.reduce((none, chance) => none * (1 - chance), 1);
}

function percent(share: number): string {
  return `${Math.round(share * 100)}%`;
}

/** How a fear lands: it ends the duel, counts half, or makes the reference flee */
type FearAs = "ending" | "half" | "flee";

/** What lands on the reference in a round, or in one cast */
interface Landing {
  /** Melee damage: a fleeing reference halves it */
  melee: number;
  /** Ranged and power damage */
  other: number;
  endings: number[];
  fears: number[];
  confusions: number[];
}

function landing(): Landing {
  return { melee: 0, other: 0, endings: [], fears: [], confusions: [] };
}

function effectFail(effect: HitEffect, ref: ReferenceCombatant): number {
  return effect.saves.length ? pFail(saveOf(ref, ...effect.saves), effect.saveBonus) : 1;
}

/** The HP an effect is worth when it lands */
function effectDamage(effect: HitEffect): number {
  switch (effect.kind) {
    case "poison":
      return effect.amount * effect.duration;
    case "drain":
      return effect.amount * HP_PER_LEVEL;
    case "strengthDrain":
      return effect.amount * HP_PER_STRENGTH;
    case "disease":
      return DISEASE_HP;
    default:
      return 0;
  }
}

function landEffect(into: Landing, effect: HitEffect, chance: number, fearAs: FearAs): number {
  if (effect.kind === "ending") into.endings.push(chance);
  else if (effect.kind === "half") into.endings.push(chance / 2);
  else if (effect.kind === "confusion") into.confusions.push(chance);
  else if (effect.kind === "fear") {
    if (fearAs === "flee") into.fears.push(chance);
    else into.endings.push(fearAs === "ending" ? chance : chance / 2);
  }
  return chance * effectDamage(effect);
}

/** The monster's attack round against the reference */
function attackRound(p: CombatProfile, attacks: ProfileAttack[], ref: ReferenceCombatant): Landing {
  const round = landing();
  const bonus = p.invisibleAtWill ? INVISIBLE_TO_HIT : 0;
  const hit = Math.min(0.95, pHit(p.thac0, ref.ac) + bonus);
  for (const a of attacks) {
    let damage = a.average * hit;
    for (const effect of a.effects) {
      const chance = hit * effectFail(effect, ref) * effect.chance;
      damage += landEffect(round, effect, chance, a.ranged ? "ending" : "flee");
    }
    if (a.ranged) round.other += damage;
    else round.melee += damage;
  }
  return round;
}

function gameSpell(power: ProfilePower): GameSpellHazard | undefined {
  if (power.effects.length || power.average || !power.role || power.level === undefined) {
    return undefined;
  }
  return GAME_SPELL_HAZARD[power.role](power.level);
}

/** A power's hazard for one cast: its damage ÷ HP + its ending chance, × 1.5 for an area */
function castHazard(power: ProfilePower, ref: ReferenceCombatant): number {
  const game = gameSpell(power);
  if (game) {
    const ending = game.ending ? pFail(ref.saveSpell, 0) : 0;
    const area = power.area || game.area ? AREA_FACTOR : 1;
    return (game.average / ref.hp + ending) * area;
  }
  const cast = landing();
  let damage = power.average;
  for (const effect of power.effects) {
    damage += landEffect(cast, effect, effectFail(effect, ref) * effect.chance, "half");
  }
  return (damage / ref.hp + either(cast.endings)) * (power.area ? AREA_FACTOR : 1);
}

/** A power's casts over `rounds`: its uses, one at the start then one per cooldown */
function castsIn(power: ProfilePower, rounds: number): number {
  const cooldown = power.cooldown ? Math.ceil(rounds / power.cooldown) : Infinity;
  return Math.min(power.uses, cooldown, rounds);
}

/** The powers' hazard a round: the strongest cast first, one a round, over the fighter's rounds */
function powersHazard(
  powers: ProfilePower[],
  ref: ReferenceCombatant,
  fighterRounds: number,
): number {
  if (fighterRounds <= 0) return 0;
  const hazards = powers
    .map((power) => ({ power, hazard: castHazard(power, ref) }))
    .filter((h) => h.hazard > 0)
    .sort((a, b) => b.hazard - a.hazard);
  let rounds = fighterRounds;
  let total = 0;
  for (const { power, hazard } of hazards) {
    const casts = Math.min(castsIn(power, fighterRounds), rounds);
    total += casts * hazard;
    rounds -= casts;
  }
  return total / fighterRounds;
}

/** Party factors: immunities to the party's usual answers, casters made useless */
function partyFactor(p: CombatProfile): number {
  let factor = 1;
  if (p.undead) factor *= 1.2;
  if (p.construct) factor *= 1.15;
  factor *= p.magicImmune ? 1.5 : 1 + p.resist.magic / 2;
  if (p.spellImmunity) factor *= 1.1;
  return factor;
}

/** The reference's rounds to kill the monster; `rate` cuts his damage (fear, kiting) */
function fighterSide(
  p: CombatProfile,
  ref: ReferenceCombatant,
  resist: number,
  rate: number,
  notes: string[],
): number {
  const hurts = p.weaponEnchantment <= referenceEnchantment(ref.level);
  if (!hurts) notes.push(`needs +${p.weaponEnchantment} weapons`);
  const damage = hurts
    ? ref.apr * pHit(ref.thac0, p.ac) * ref.damage * (1 - resist) * rate - p.regeneration
    : 0;
  const rounds = damage > 0 ? Math.min(MAX_ROUNDS, p.hp / damage) : MAX_ROUNDS;
  return rounds * partyFactor(p);
}

interface DuelOptions {
  resist: number;
  /** The reference's damage rate (kiting halves it) */
  rate?: number;
  /** A fast monster closing in: one free round of arrows first */
  freeRound?: boolean;
}

function duel(
  p: CombatProfile,
  ref: ReferenceCombatant,
  attacks: ProfileAttack[],
  powers: ProfilePower[],
  options: DuelOptions,
): DuelResult {
  const notes: string[] = [];
  const round = attackRound(p, attacks, ref);
  const fear = Math.min(1, either(round.fears));
  let fighterRounds = fighterSide(p, ref, options.resist, (options.rate ?? 1) * (1 - fear), notes);
  if (options.freeRound) fighterRounds = Math.max(MIN_CLOSING_ROUNDS, fighterRounds - 1);
  const damage = (round.melee * (1 - fear / 2) + round.other) / ref.hp;
  const ending = either(round.endings);
  const fromPowers = powersHazard(powers, ref, fighterRounds);
  const hazard = Math.min(1, damage + ending + fromPowers);
  const monsterRounds = hazard > 0 ? Math.min(MAX_ROUNDS, 1 / hazard) : MAX_ROUNDS;
  if (ending) notes.push(`${percent(ending)} ending a round`);
  if (damage) notes.push(`${percent(damage)} damage a round`);
  if (fromPowers) notes.push(`${percent(fromPowers)} powers a round`);
  if (fear) notes.push(`${percent(fear)} fear a round`);
  return { monsterRounds, fighterRounds, notes, ratio: fighterRounds / monsterRounds };
}

function meleeAttacks(p: CombatProfile): ProfileAttack[] {
  const melee = p.attacks.filter((a) => !a.ranged);
  return melee.length ? melee : p.attacks;
}

/** The melee duel against the reference fighter */
export function meleeDuel(p: CombatProfile, ref: ReferenceCombatant): DuelResult {
  return duel(p, ref, meleeAttacks(p), p.powers, { resist: p.resist.slashing });
}

function isRanged(p: CombatProfile, archer: ReferenceCombatant): boolean {
  return (
    p.attacks.some((a) => a.ranged) ||
    p.powers.some((power) => power.ranged && castHazard(power, archer) > 0)
  );
}

/** The better duel for the monster: the higher ratio */
function better(a: DuelResult, b: DuelResult): DuelResult {
  return b.ratio > a.ratio ? b : a;
}

/** A share of `b` mixed into `a`, rounds weighted */
function mix(a: DuelResult, b: DuelResult, share: number, note: string): DuelResult {
  const monsterRounds = a.monsterRounds * (1 - share) + b.monsterRounds * share;
  const fighterRounds = a.fighterRounds * (1 - share) + b.fighterRounds * share;
  return {
    monsterRounds,
    fighterRounds,
    ratio: fighterRounds / monsterRounds,
    notes: [note, ...a.notes, ...b.notes],
  };
}

/**
 * The chance a round confuses the kiting archer, breaking his kiting: only ranged powers reach him
 * (his melee never lands); limited uses spread over his rounds, N ÷ R_f
 */
function confusionChance(p: CombatProfile, archer: ReferenceCombatant, rounds: number): number {
  const chances = p.powers
    .filter((power) => power.ranged)
    .flatMap((power) => {
      const spread = Math.min(1, castsIn(power, rounds) / rounds);
      return power.effects
        .filter((e) => e.kind === "confusion")
        .map((e) => effectFail(e, archer) * e.chance * spread);
    });
  return either(chances);
}

/** The ranged duel against the reference archer: kited, closing in, or shooting back */
export function rangedDuel(p: CombatProfile, archer: ReferenceCombatant): DuelResult {
  const resist = Math.max(p.resist.piercing, p.resist.missile);
  const fast = p.movement >= KITING_MOVEMENT;
  const closing = () => {
    const result = duel(p, archer, meleeAttacks(p), p.powers, { resist, freeRound: true });
    result.notes.unshift("closes in after a free round of arrows");
    return result;
  };
  // Kited by a faster archer, or closing in: the duel it has without shooting back
  const unranged = fast ? closing() : kitedDuel(p, archer, resist, closing);
  if (!isRanged(p, archer)) return unranged;
  const ranged = p.attacks.filter((a) => a.ranged);
  const shooting = duel(p, archer, ranged, p.powers, { resist });
  shooting.notes.unshift("shoots back");
  // Shooting back only when it beats the melee duel: a weak dart never lowers the ratio
  return better(shooting, unranged);
}

/** A slow monster kited at half rate: only its ranged powers reach the archer */
function kitedDuel(
  p: CombatProfile,
  archer: ReferenceCombatant,
  resist: number,
  closing: () => DuelResult,
): DuelResult {
  const rangedPowers = p.powers.filter((power) => power.ranged);
  const kited = duel(p, archer, [], rangedPowers, { resist, rate: KITING_RATE });
  kited.notes.unshift("kited");
  const share = Math.min(1, confusionChance(p, archer, kited.fighterRounds) * kited.fighterRounds);
  if (!share) return kited;
  return mix(kited, closing(), share, `confusion breaks the kiting ${percent(share)} of the fight`);
}

/** Threat: melee^0.75 × ranged^0.25, × 1.2 invisible at will, × 1.1 per declared */
export function threat(p: CombatProfile): {
  threat: number;
  melee: DuelResult;
  ranged: DuelResult;
} {
  const melee = meleeDuel(p, referenceFighter(p.level));
  const ranged = rangedDuel(p, referenceArcher(p.level));
  const invisible = p.invisibleAtWill ? INVISIBLE_FACTOR : 1;
  return {
    melee,
    ranged,
    threat:
      melee.ratio ** (1 - RANGED_WEIGHT) *
      ranged.ratio ** RANGED_WEIGHT *
      invisible *
      DECLARED_FACTOR ** p.declared,
  };
}
