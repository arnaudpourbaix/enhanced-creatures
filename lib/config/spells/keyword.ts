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
   * Affects an area: spell reflections don't stop it (see suppressedSpellLevelChecks)
   */
  | "area"
  | "bleeding"
  | "blind"
  /**
   * Cast on its caster. Without the area keyword, it skips the level-driven checks on its target
   * list, like a friendly spell (see suppressedSpellLevelChecks)
   */
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
  /**
   * The Death Spell itself, not every death effect (see the deathSpell immunity). Under Spell
   * Revisions, its file is Banishment, which also slays summons, so the immunity still fits
   */
  | "deathSpell"
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
   * Gaze attack: blocked by gaze attack immunity (see the gazeAttacks immunity)
   */
  | "gaze"
  /**
   * Means that the spell is wanted by its (allied) target and we should not check for protections
   * (see suppressedSpellLevelChecks). Not needed on a castOnSelf spell
   */
  | "friendly"
  | "globeOfInvulnerability"
  | "ground"
  /**
   * Resisted by half-elven blood (30%) - skip Half-Elf targets
   */
  | "halfElf"
  | "hold"
  /**
   * Only affects humanoids (e.g. a charm whose effect is restricted to GENERAL.IDS HUMANOID) -
   * skip other targets
   */
  | "humanoid"
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
