import { SpellKeyword } from "./keyword";

/**
 * The keywords that have a SPELL_GROUPS entry - a group is named after the keyword it gathers, so
 * tagging a spell with the keyword is all it takes to add it to the group (see SPELL_GROUPS).
 */
export type SpellGroupName = MustBeKeyword<GroupKeyword>;

type GroupKeyword =
  | "acid"
  | "bleeding"
  | "blind"
  | "cloud"
  | "cold"
  | "colorSpray"
  | "confusion"
  | "curePoison"
  | "causeWounds"
  | "cureWounds"
  | "death"
  | "disease"
  | "earthquake"
  | "entangle"
  | "electrical"
  | "fatigue"
  | "fear"
  | "fireball"
  | "fire"
  | "flameArrow"
  | "globeOfInvulnerability"
  | "ground"
  | "hold"
  | "illusion"
  | "insect"
  | "lightningBolt"
  | "magicMissile"
  | "maze"
  | "minorGlobeOfInvulnerability"
  | "necromancyEffects"
  | "petrify"
  | "poison"
  | "polymorph"
  | "web";

/** Fails to compile when a group name above isn't a SpellKeyword (unlike Extract, which drops it). */
type MustBeKeyword<T extends SpellKeyword> = T;
