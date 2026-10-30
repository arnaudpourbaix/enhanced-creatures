import { MageSpellTable } from "../game-data/spell-level";
import type { SpellReference } from "./spell-reference";

/** The situation a contingency waits for before casting its spells. */
export type ContingencyTrigger =
  "hit" | "seeEnemy" | "hp50" | "hp25" | "hp10" | "helpless" | "poisoned";

/** Who a chain contingency's spells are cast at when it fires: one target for all of them. */
export type ContingencyTarget = "self" | "lastHitter" | "nearestEnemy";

export type SequencerKind = "minorSequencer" | "spellSequencer";
export type ContingencyKind = "contingency" | "chainContingency";
export type SpellComboKind = SequencerKind | ContingencyKind;

/**
 * A sequencer or contingency: a wizard spell that holds other spells and casts them together
 * (sequencers, on the caster's command) or when `condition` happens (contingencies).
 */
export interface SpellCombo<K extends SpellComboKind = SpellComboKind> {
  /** The registry key, filled in by `registerCombos`. */
  key: string;
  kind: K;
  /** The contained spells, cast in this order. */
  spells: SpellReference[];
  /** Contingencies only. */
  condition?: ContingencyTrigger;
  /** Chain contingencies only (a contingency casts on the caster), the caster by default. */
  target?: ContingencyTarget;
}

type ComboEntry<K extends SpellComboKind = SpellComboKind> = Omit<SpellCombo<K>, "key">;

/** Level 4 spell: triggers 2 spells of level 1-2. */
export const minorSequencer = (spells: SpellReference[]): ComboEntry<"minorSequencer"> => ({
  kind: "minorSequencer",
  spells,
});

/** Triggers 3 spells of level 1-4. */
export const spellSequencer = (spells: SpellReference[]): ComboEntry<"spellSequencer"> => ({
  kind: "spellSequencer",
  spells,
});

/**
 * Level 6 spell: casts 1 spell when `condition` happens. The contained spell's level can't exceed
 * the caster level divided by three (see `contingencyMaxLevel`):
 *
 * | Caster level | Max level |
 * | ------------ | --------- |
 * | 12-14        | 4         |
 * | 15-17        | 5         |
 * | 18-20        | 6         |
 * | 21-23        | 7         |
 * | 24+          | 8         |
 */
export const contingency = (
  condition: ContingencyTrigger,
  spells: SpellReference[],
): ComboEntry<"contingency"> => ({ kind: "contingency", spells, condition });

/** Level 9 spell: casts 3 spells of level 1-8 when `condition` happens. */
export const chainContingency = (
  condition: ContingencyTrigger,
  spells: SpellReference[],
  target: ContingencyTarget = "self",
): ComboEntry<"chainContingency"> => ({ kind: "chainContingency", spells, condition, target });

/** The first mage caster level with at least `slots` spell slots of `spellLevel`. */
function firstCasterLevel(spellLevel: number, slots: number): number {
  const row = MageSpellTable.find((r) =>
    r.spells.some((s) => s.level === spellLevel && s.count >= slots),
  );
  if (!row) throw new Error(`No mage caster level has ${slots} slot(s) of level ${spellLevel}`);
  return row.level;
}

/**
 * Per kind: the level of the spell the caster needs, the lowest caster level having it, how many
 * spells it holds ([min, max]) and the highest level of a held spell. For contingencies that last
 * value is the absolute cap, `contingencyMaxLevel` gives the one for a given caster level.
 */
export const COMBO_RULES: Record<
  SpellComboKind,
  {
    spellLevel: number;
    minCasterLevel: number;
    count: [number, number];
    maxContainedLevel: number;
  }
> = {
  minorSequencer: {
    spellLevel: 4,
    minCasterLevel: firstCasterLevel(4, 1),
    count: [2, 2],
    maxContainedLevel: 2,
  },
  spellSequencer: {
    spellLevel: 7,
    minCasterLevel: firstCasterLevel(7, 1),
    count: [3, 3],
    maxContainedLevel: 4,
  },
  contingency: {
    spellLevel: 6,
    minCasterLevel: firstCasterLevel(6, 1),
    count: [1, 1],
    maxContainedLevel: 8,
  },
  chainContingency: {
    spellLevel: 9,
    minCasterLevel: firstCasterLevel(9, 1),
    count: [3, 3],
    maxContainedLevel: 8,
  },
};

const CONDITIONS: ContingencyTrigger[] = [
  "hit",
  "seeEnemy",
  "hp50",
  "hp25",
  "hp10",
  "helpless",
  "poisoned",
];

/** The highest level of spell a contingency can hold at `casterLevel`. */
export function contingencyMaxLevel(casterLevel: number): number {
  return Math.min(8, Math.floor(casterLevel / 3));
}

/**
 * Throws (naming the combo) when the combo breaks the rules of its kind, or holds a spell missing
 * from `spells` (the wizard and priest spells, when given).
 */
export function validateCombo(combo: SpellCombo, spells?: SpellReference[]): void {
  const rule = COMBO_RULES[combo.kind];
  const fail = (why: string): never => {
    throw new Error(`Spell combo ${combo.key} (${combo.kind}): ${why}`);
  };
  const [min, max] = rule.count;
  if (combo.spells.length < min || combo.spells.length > max) {
    const expected = min === max ? String(min) : `${min}-${max}`;
    fail(`holds ${combo.spells.length} spells, expected ${expected}`);
  }
  const known = spells && new Set(spells.map((s) => s.file.toUpperCase()));
  for (const spell of combo.spells) {
    if (known && !known.has(spell.file.toUpperCase())) {
      fail(`spell ${spell.file} isn't a wizard or priest spell`);
    }
    if (spell.level === undefined) fail(`spell ${spell.file} has no level`);
    else if (spell.level > rule.maxContainedLevel) {
      fail(
        `spell ${spell.file} is level ${spell.level}, above the maximum ${rule.maxContainedLevel}`,
      );
    }
  }
  const isContingency = combo.kind === "contingency" || combo.kind === "chainContingency";
  if (!isContingency && combo.condition !== undefined) fail("a sequencer can't have a condition");
  if (!isContingency && combo.target !== undefined) fail("a sequencer can't have a target");
  if (isContingency && (combo.condition === undefined || !CONDITIONS.includes(combo.condition))) {
    fail(`missing or unknown condition ${String(combo.condition)}`);
  }
}

const signature = (combo: SpellCombo): string =>
  [
    combo.kind,
    combo.condition ?? "",
    combo.target ?? "self",
    ...combo.spells.map((s) => s.file),
  ].join("|");

/** Throws when two combos have the same kind, spell files (in order), condition and target. */
export function checkDuplicates(combos: SpellCombo[]): void {
  const seen = new Map<string, string>();
  for (const combo of combos) {
    const other = seen.get(signature(combo));
    if (other !== undefined)
      throw new Error(`Spell combos ${other} and ${combo.key} are identical`);
    seen.set(signature(combo), combo.key);
  }
}

/** A registry: each entry keeps its own key and kind, so `SEQUENCERS.` completes in editors. */
export type ComboRegistry<T extends Record<string, ComboEntry>> = {
  [P in keyof T]: SpellCombo<T[P]["kind"]>;
};

/**
 * Sets each combo's `key` from its registry key, then validates them (`spells`: every wizard and
 * priest spell a combo may hold, see validateCombo) and checks for duplicates.
 */
export function registerCombos<T extends Record<string, ComboEntry>>(
  entries: T,
  spells: SpellReference[],
): ComboRegistry<T> {
  const combos = Object.fromEntries(
    Object.entries(entries).map(([key, entry]) => [key, { ...entry, key }]),
  ) as ComboRegistry<T>;
  const list = Object.values<SpellCombo>(combos);
  for (const combo of list) validateCombo(combo, spells);
  checkDuplicates(list);
  return combos;
}

/** registerCombos for minor and spell sequencers only. */
export const registerSequencers = <T extends Record<string, ComboEntry<SequencerKind>>>(
  entries: T,
  spells: SpellReference[],
): ComboRegistry<T> => registerCombos(entries, spells);

/** registerCombos for contingencies and chain contingencies only. */
export const registerContingencies = <T extends Record<string, ComboEntry<ContingencyKind>>>(
  entries: T,
  spells: SpellReference[],
): ComboRegistry<T> => registerCombos(entries, spells);
