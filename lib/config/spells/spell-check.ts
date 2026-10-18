import { ScriptTarget } from "../../src/model/constants";
import { Triggers } from "../../src/model/script/triggers";
import { SpellKeyword } from "./keyword";

/**
 * Keywords guarding the whole spell rather than one of its effects: a target protected by any of
 * them is skipped. Every other keyword is an effect, and a target is only skipped once it's
 * protected from all of the spell's effects (e.g. a hold + fear aura still targets someone with
 * free action but no fear protection). See TriggerFactory.spellChecks.
 */
export const SPELL_CHECK_GATE_KEYWORDS: ReadonlySet<SpellKeyword> = new Set<SpellKeyword>([
  "elf",
  "halfElf",
  "magicResistance",
  "missile",
  "shield",
]);

/**
 * Checks driven by the spell's level rather than by a keyword (see
 * AbilityService.appendSpellCheckTriggers):
 * - immuneToSpellLevel: Minor Globe, Globe of Invulnerability, Spell Immunity, ...
 * - spellReflections: Spell Turning/Trap/Deflection, Shield of the Archons (single-target only)
 */
export type SpellLevelCheck = "immuneToSpellLevel" | "spellReflections";

/**
 * Keywords that turn level-driven checks off: a friendly spell is wanted by its target, and spell
 * reflections don't stop an area spell. A castOnSelf spell that isn't an area spell is also
 * exempt from both (see suppressedSpellLevelChecks).
 */
export const SPELL_CHECK_SUPPRESSORS: Partial<Record<SpellKeyword, SpellLevelCheck[]>> = {
  friendly: ["immuneToSpellLevel", "spellReflections"],
  area: ["spellReflections"],
};

/**
 * The level-driven checks `keywords` turn off: those of SPELL_CHECK_SUPPRESSORS, plus both for a
 * castOnSelf spell without the area keyword - it only lands on its caster, so a target list
 * (e.g. the allies Protection from Evil 10' looks for) only gates when to cast, and that target's
 * protections are irrelevant. A castOnSelf area spell (Cloak of Fear, ...) hits the targets of
 * its list, so it keeps its checks.
 */
export function suppressedSpellLevelChecks(keywords: SpellKeyword[]): Set<SpellLevelCheck> {
  const suppressed = new Set(keywords.flatMap((keyword) => SPELL_CHECK_SUPPRESSORS[keyword] ?? []));
  if (keywords.includes("castOnSelf") && !keywords.includes("area")) {
    suppressed.add("immuneToSpellLevel");
    suppressed.add("spellReflections");
  }
  return suppressed;
}

/**
 * How to test each SpellCheckKeyword against the current target. A keyword can expand to one or
 * several triggers (e.g. a protection covered by both an old-style stat and a newer spell state).
 * The *_IMMUNITY / ITEM_* spell states are those set by the mod's own immunities (see IMMUNITIES).
 */
export const SPELL_CHECK_TRIGGERS: Record<SpellKeyword, Triggers.Trigger[]> = {
  acid: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTACID"] }],
  area: [],
  blind: [],
  castOnSelf: [],
  causeWounds: [],
  cloud: [],
  charm: [
    { name: "CheckSpellState", params: [ScriptTarget.token, "CHAOTIC_COMMANDS"], negation: true },
    { name: "CheckSpellState", params: [ScriptTarget.token, "CHARM_IMMUNITY"], negation: true },
  ],
  cold: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTCOLD"] }],
  confusion: [
    { name: "CheckSpellState", params: [ScriptTarget.token, "CHAOTIC_COMMANDS"], negation: true },
    { name: "CheckSpellState", params: [ScriptTarget.token, "CONFUSION_IMMUNITY"], negation: true },
  ],
  death: [
    { name: "CheckSpellState", params: [ScriptTarget.token, "DEATH_WARD"], negation: true },
    { name: "CheckSpellState", params: [ScriptTarget.token, "DEATH_IMMUNITY"], negation: true },
  ],
  deathSpell: [],
  disease: [],
  electrical: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTELECTRICITY"] }],
  elf: [{ name: "Race", params: [ScriptTarget.token, "ELF"], negation: true }],
  fear: [
    { name: "CheckSpellState", params: [ScriptTarget.token, "PANIC_IMMUNITY"], negation: true },
    // Remove Fear, Resist Fear (both also set RESIST_FEAR below)
    { name: "CheckStatGT", params: [ScriptTarget.token, 0, "WIZARD_RESIST_FEAR"], negation: true },
    // Permanent immunities: Blackguard, the mod's own fear immunity (see IMMUNITIES), ...
    { name: "CheckSpellState", params: [ScriptTarget.token, "RESIST_FEAR"], negation: true },
    { name: "CheckSpellState", params: [ScriptTarget.token, "EXALTATION"], negation: true },
    // Kit ability not tied to any stat or spell state (opcode 101 against panic only)
    { name: "Kit", params: [ScriptTarget.token, "CAVALIER"], negation: true },
  ],
  fire: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTFIRE"] }],
  friendly: [],
  halfElf: [{ name: "Race", params: [ScriptTarget.token, "HALF_ELF"], negation: true }],
  hold: [
    { name: "CheckSpellState", params: [ScriptTarget.token, "CHAOTIC_COMMANDS"], negation: true },
    { name: "CheckStatGT", params: [ScriptTarget.token, 0, "CLERIC_FREE_ACTION"], negation: true },
    { name: "CheckSpellState", params: [ScriptTarget.token, "HOLD_IMMUNITY"], negation: true },
  ],
  levelDrain: [
    {
      name: "CheckStatGT",
      params: [ScriptTarget.token, 0, "LEVEL_DRAIN_IMMUNITY"],
      negation: true,
    },
    { name: "CheckSpellState", params: [ScriptTarget.token, "ITEM_LEVELDRAIN"], negation: true },
  ],
  magicDamage: [
    {
      name: "CheckStatGT",
      params: [ScriptTarget.token, 0, "WIZARD_PROTECTION_FROM_MAGIC_ENERGY"],
      negation: true,
    },
  ],
  magicResistance: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTMAGIC"] }],
  maze: [],
  miscast: [],
  missile: [
    // {
    //   name: "CheckStatGT",
    //   params: [ScriptTarget.token, 0, "SHIELDGLOBE"],
    //   negation: true,
    // },
    {
      name: "CheckSpellState",
      params: [ScriptTarget.token, "PROTECTION_FROM_NORMAL_MISSILES"],
      negation: true,
    },
  ],
  movement: [
    { name: "CheckStatGT", params: [ScriptTarget.token, 0, "CLERIC_FREE_ACTION"], negation: true },
  ],
  petrify: [
    { name: "CheckSpellState", params: [ScriptTarget.token, "PETRIFY_IMMUNITY"], negation: true },
  ],
  poison: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTPOISON"] }],
  polymorph: [],
  shield: [
    { name: "CheckStat", params: [ScriptTarget.token, 2, "SCRIPTINGSTATE5"], negation: true },
  ],
  silence: [],
  sleep: [
    { name: "CheckSpellState", params: [ScriptTarget.token, "CHAOTIC_COMMANDS"], negation: true },
    { name: "CheckSpellState", params: [ScriptTarget.token, "SLEEP_IMMUNITY"], negation: true },
  ],
  slow: [],
  stun: [
    { name: "CheckSpellState", params: [ScriptTarget.token, "CHAOTIC_COMMANDS"], negation: true },
    { name: "CheckSpellState", params: [ScriptTarget.token, "STUN_IMMUNITY"], negation: true },
  ],
  // group tags only (see SpellKeyword) - no protection to check
  bleeding: [],
  colorSpray: [],
  curePoison: [],
  cureWounds: [],
  earthquake: [],
  entangle: [],
  fatigue: [],
  fireball: [],
  flameArrow: [],
  gaze: [],
  globeOfInvulnerability: [],
  ground: [],
  illusion: [],
  insect: [],
  lightningBolt: [],
  magicMissile: [],
  minorGlobeOfInvulnerability: [],
  necromancyEffects: [],
  web: [],
};
