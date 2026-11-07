import { SaveTypeEnum } from "../../../model/spell-item/effect.enums";

// The fighter and archer a monster's threat is measured against: a character of the monster's own
// level (monsters are designed to meet a similar level party). Threat is a duel: the rounds the
// monster needs to drop him against the rounds he needs to drop it.
// - HP: 10 per level (the usual maximum) + 3 Con up to 9, then +3 per level
// - AC: 10 at levels 1-2, plate (3) around 4, full plate (1) around 6, magic items down to -5 at 20
// - fighter: Strength 18/50 (+1 to hit, +3 damage), two d8 swords, +1/2 attack at 7 and 13,
//   specialization +1 to hit, +2 damage, +1/2 attack
// - archer: Dexterity +2 to hit, specialization +1, two arrows a round, armour 4 AC better than
//   the fighter's
// - enchantment: +0 at 1-4, +1 at 5-8, +2 at 9-12, +3 at 13+
// - THAC0, saving throws: the 2e warrior tables

export interface ReferenceCombatant {
  level: number;
  /** What the monster rolls against */
  ac: number;
  /** What the monster must take down */
  hp: number;
  /** His THAC0, every bonus included: what he rolls against the monster's AC */
  thac0: number;
  /** His attacks per round */
  apr: number;
  /** His average damage per hit */
  damage: number;
  saveDeath: number;
  savePolymorph: number;
  saveBreath: number;
  saveSpell: number;
  saveWand: number;
  movement: number;
}

/** 2e warrior saving throws from a level on: death, polymorph, breath, spell, wand */
const WARRIOR_SAVES: [number, [number, number, number, number, number]][] = [
  [1, [14, 15, 17, 17, 16]],
  [3, [13, 14, 16, 16, 15]],
  [5, [11, 12, 13, 14, 13]],
  [7, [10, 11, 12, 13, 12]],
  [9, [8, 9, 9, 11, 10]],
  [11, [7, 8, 8, 10, 9]],
  [13, [5, 6, 5, 8, 7]],
  [15, [4, 5, 4, 7, 6]],
  [17, [3, 4, 4, 6, 5]],
];

/** AC by level: the markers, linear from full plate (1 at 6) to -5 at 20 */
const AC_MARKERS: Record<number, number> = { 1: 10, 2: 10, 3: 6, 4: 3, 5: 2, 6: 1 };

const MOVEMENT = 12;

function clampLevel(level: number): number {
  return Math.min(20, Math.max(1, Math.round(level)));
}

function saves(level: number): [number, number, number, number, number] {
  let result = WARRIOR_SAVES[0][1];
  for (const [from, s] of WARRIOR_SAVES) if (level >= from) result = s;
  return result;
}

function armorClass(level: number): number {
  // + 0 turns a rounded -0 into 0
  return (AC_MARKERS[level] ?? Math.round(1 - ((level - 6) * 6) / 14)) + 0;
}

function hitPoints(level: number): number {
  return Math.min(level, 9) * 13 + Math.max(0, level - 9) * 3;
}

function fighterAttacks(level: number): number {
  let apr = 2.5; // two swords + specialization's half attack
  if (level >= 7) apr += 0.5;
  if (level >= 13) apr += 0.5;
  return apr;
}

/** The magic bonus on the reference's weapon: +0 at 1-4, +1 at 5-8, +2 at 9-12, +3 at 13+ */
export function referenceEnchantment(level: number): number {
  return Math.min(3, Math.floor((clampLevel(level) - 1) / 4));
}

function base(level: number): Omit<ReferenceCombatant, "ac" | "thac0" | "apr" | "damage"> {
  const [saveDeath, savePolymorph, saveBreath, saveSpell, saveWand] = saves(level);
  return {
    level,
    saveDeath,
    savePolymorph,
    saveBreath,
    saveSpell,
    saveWand,
    hp: hitPoints(level),
    movement: MOVEMENT,
  };
}

export function referenceFighter(level: number): ReferenceCombatant {
  const lvl = clampLevel(level);
  const enchantment = referenceEnchantment(lvl);
  const toHit = 1 + 1 + enchantment; // strength, specialization, enchantment
  return {
    ...base(lvl),
    ac: armorClass(lvl),
    thac0: 21 - lvl - toHit,
    apr: fighterAttacks(lvl),
    damage: 4.5 + 3 + 2 + enchantment,
  };
}

export function referenceArcher(level: number): ReferenceCombatant {
  const lvl = clampLevel(level);
  const enchantment = referenceEnchantment(lvl);
  const toHit = 2 + 1 + enchantment; // dexterity, specialization, enchantment
  return {
    ...base(lvl),
    ac: armorClass(lvl) - 4,
    thac0: 21 - lvl - toHit,
    apr: 2,
    damage: 3.5 + 2 + enchantment,
  };
}

/** The reference's save against a type; with several types, the best (lowest) */
export function saveOf(ref: ReferenceCombatant, ...types: SaveTypeEnum[]): number {
  const bySaveType = (type: SaveTypeEnum): number => {
    switch (type) {
      case SaveTypeEnum.Spell:
        return ref.saveSpell;
      case SaveTypeEnum.Breath:
        return ref.saveBreath;
      case SaveTypeEnum.ParalyzePoisonDeath:
        return ref.saveDeath;
      case SaveTypeEnum.RodStaffWand:
        return ref.saveWand;
      case SaveTypeEnum.PetrifyPolymorph:
        return ref.savePolymorph;
      default:
        throw new Error(`No reference save for save type ${type}`);
    }
  };
  return Math.min(...types.map(bySaveType));
}
