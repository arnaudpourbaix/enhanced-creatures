/**
 * What a spell is for in a caster's cast order. Auto-classified from the spell's effects by
 * scripts/extract-spell-profile.ts, then reviewed by hand.
 */
export type SpellRole =
  /** Only cast when its condition happens (healing, dispel, true sight, escape): always first */
  | "reactive"
  | "protection"
  | "buff"
  | "disable"
  | "summon"
  | "damage"
  /** Kills outright, all or nothing: usually stronger than damage (Finger of Death) */
  | "kill"
  /**
   * Takes another form, usually without spellcasting: a new attack, sometimes abilities. Great for
   * attacking, but a caster must think about when to shift - never a buff
   */
  | "shapeshift"
  /** Never cast by a script: no use in a fight (Dancing Lights, Find Traps, Detect Evil) */
  | "useless";

export type SpellDurationClass =
  | "long" // several hours
  | "mid" // several turns
  | "short"; // several rounds to one turn
