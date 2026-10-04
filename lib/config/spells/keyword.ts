/**
 * What a spell does, used for two things at once: SPELL_CHECK_TRIGGERS (the protections an AI
 * checks on its target before casting) and SPELL_GROUPS (a group named after a keyword gathers
 * every spell tagged with it - see SpellGroupName). A keyword with no trigger of its own (an empty
 * SPELL_CHECK_TRIGGERS entry) is just a group tag.
 */
export type SpellKeyword =
  /**
   * Blocked by Protection from Missiles
   */
  | "acid"
  /**
   * Affects an area: spell reflections don't stop it (see SPELL_CHECK_SUPPRESSORS)
   */
  | "area"
  | "bleeding"
  | "blind"
  | "castOnSelf"
  | "causeWounds"
  | "charm"
  | "cloud"
  | "cold"
  | "colorSpray"
  | "confusion"
  | "curePoison"
  | "cureWounds"
  | "death"
  | "disease"
  | "earthquake"
  | "electrical"
  | "entangle"
  | "fatigue"
  /**
   * Resisted by elven blood (90% for full elves) - skip Elf targets
   */
  | "elf"
  | "fear"
  | "fire"
  | "fireball"
  | "flameArrow"
  /**
   * Means that the spell is friendly and we should not check for protections (see
   * SPELL_CHECK_SUPPRESSORS)
   */
  | "friendly"
  | "globeOfInvulnerability"
  | "ground"
  /**
   * Resisted by half-elven blood (30%) - skip Half-Elf targets
   */
  | "halfElf"
  | "hold"
  | "illusion"
  | "insect"
  | "levelDrain"
  | "lightningBolt"
  | "magicDamage"
  | "magicMissile"
  | "magicResistance"
  | "maze"
  | "minorGlobeOfInvulnerability"
  | "miscast"
  | "missile"
  | "movement"
  | "necromancyEffects"
  | "petrify"
  | "poison"
  | "polymorph"
  /**
   * Blocked by Shield (wizard spell)
   */
  | "shield"
  | "silence"
  | "sleep"
  | "slow"
  | "stun"
  | "web";
