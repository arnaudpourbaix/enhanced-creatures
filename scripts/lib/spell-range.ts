import { type SpellRole } from "../../lib/config/spells/spell-role";

/** The Range() gate of a spell having to get close to its target (see SpellReference.range). */
export const SHORT_RANGE = 10;
/** SPL header target of a creature */
const CREATURE_TARGET = 1;
/** Roles aimed at an enemy, the only ones a Range() gate suits (see proposeRange). */
const OFFENSIVE_ROLES: (SpellRole | undefined)[] = ["damage", "disable", "kill"];

/**
 * Spells putting a touch attack in the caster's hand: their SPL targets the caster and their
 * description says "Personal", yet the charge must still be delivered in melee.
 */
export const CHARGED_TOUCH = new Set([
  "SPWI117",
  "SPWI218",
  "SPPR121",
  "SPPR220",
  "SPPR322",
  "SPCL820",
]);

/** One state of a spell's SPL (as shipped, or with the install's mods). */
export interface SplRange {
  /** First header's range */
  range: number;
  /** First header's target */
  target: number;
  /** The "Range:" line of its description */
  text?: string;
}

/** The `Range:` line of a spell description, undefined without one. */
export function rangeText(description: string): string | undefined {
  return /Range:\s*([^\r\n]*)/i.exec(description)?.[1].trim();
}

/**
 * The `range` a database entry should declare: SHORT_RANGE for an offensive touch or short range
 * spell in any state of the game, so it also holds without the mod widening it; nothing otherwise,
 * the engine walking the caster to a longer range target being short enough. Not for a spell on
 * allies or the caster: nothing else would bring its caster closer to an ally, so the gate would
 * only keep it from casting. A cone isn't covered either: its description says "Special", and an
 * allies check usually keeps its targets further.
 */
export function proposeRange(
  file: string,
  spell: { role?: SpellRole },
  states: (SplRange | undefined)[],
): number | undefined {
  if (CHARGED_TOUCH.has(file)) return SHORT_RANGE;
  if (!OFFENSIVE_ROLES.includes(spell.role)) return undefined;
  const found = states.filter((state): state is SplRange => !!state);
  const close = found.some(
    ({ range, target, text }) =>
      /^(touch|short)$/i.test(text ?? "") ||
      // innates have no Range line in their description
      (text === undefined && target === CREATURE_TARGET && range <= 1),
  );
  return close ? SHORT_RANGE : undefined;
}
