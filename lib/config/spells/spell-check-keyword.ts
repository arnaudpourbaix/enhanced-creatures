/**
 * Protections that can block or reduce the effect of a spell on its target, independent of any
 * particular spell - e.g. Free Action stops any `hold` effect, not just Hold Person specifically.
 * Tag a spell with the keywords that apply via `SpellReference.cause`, then pull the matching
 * triggers with `triggerFactory.spellChecks(...)` (see spell-check.ts for what each keyword
 * actually tests, and GLOBAL_CONFIG.spellChecks to toggle a keyword off everywhere at once).
 */
export type SpellCheckKeyword =
  /**
   * Blocked by Protection from Missiles
   */
  | "acid"
  | "blind"
  | "causeWounds"
  | "charm"
  | "cloud"
  | "cold"
  | "confusion"
  | "death"
  | "disease"
  | "electrical"
  | "fear"
  | "fire"
  | "movement"
  | "hold"
  | "levelDrain"
  | "magicDamage"
  | "magicResistance"
  | "maze"
  | "miscast"
  | "missile"
  | "petrify"
  | "poison"
  | "polymorph"
  | "silence"
  | "sleep"
  | "slow"
  | "stun"
  /**
   * Blocked by Shield (wizard spell)
   */
  | "shield";
