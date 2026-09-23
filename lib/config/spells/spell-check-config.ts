import { SpellKeyword } from "./keyword";

export interface SpellCheckConfig {
  /**
   * Check for spells or items that grant some protection
   */
  spellProtections: boolean;
  /**
   * Check for stats like hit points, saving throws, resists
   */
  stats: boolean;
  /**
   * Check for races
   */
  races: boolean;
  /**
   * Check for classes
   */
  classes: boolean;
  /**
   * Check for kits
   */
  kits: boolean;
}

/**
 * Groups each SpellKeyword under the single SpellCheckConfig property that governs whether its
 * SPELL_CHECK_TRIGGERS entry runs (see TriggerFactory.spellChecks) - disabling that property in
 * GLOBAL_CONFIG.spellChecks drops every keyword listed here for it. Each keyword appears in at most
 * one list, classified by what its trigger actually tests rather than by trigger name: a scripting
 * -state stat that merely tracks a granted spell/item duration (e.g. CLERIC_FREE_ACTION,
 * WIZARD_RESIST_FEAR) counts as spellProtections, while an innate elemental/energy resistance stat
 * (RESISTACID and siblings) counts as stats.
 *
 * A keyword absent from every list here is unaffected by any toggle - either its
 * SPELL_CHECK_TRIGGERS entry is still empty (blind, causeWounds, cloud, disease, maze, miscast,
 * petrify, polymorph, silence, slow) so there's nothing to gate yet, or (for races/classes/kits)
 * no trigger of that kind exists at all yet. Classify a keyword here once its trigger is written.
 */
export const SPELL_CHECK_CONFIG_KEYWORDS: Record<keyof SpellCheckConfig, SpellKeyword[]> = {
  spellProtections: [
    "charm",
    "confusion",
    "death",
    "fear",
    "hold",
    "levelDrain",
    "magicDamage",
    "missile",
    "movement",
    "shield",
    "sleep",
    "stun",
  ],
  stats: ["acid", "cold", "electrical", "fire", "magicResistance", "poison"],
  races: [],
  classes: [],
  kits: [],
};

const KEYWORD_CHECK_CATEGORY = new Map<SpellKeyword, keyof SpellCheckConfig>(
  Object.entries(SPELL_CHECK_CONFIG_KEYWORDS).flatMap(([category, keywords]) =>
    keywords.map((keyword) => [keyword, category as keyof SpellCheckConfig] as const),
  ),
);

/**
 * The SpellCheckConfig property that governs the given keyword's SPELL_CHECK_TRIGGERS entry, per
 * SPELL_CHECK_CONFIG_KEYWORDS - undefined for a keyword not yet classified there (see its comment).
 */
export function keywordCheckCategory(keyword: SpellKeyword): keyof SpellCheckConfig | undefined {
  return KEYWORD_CHECK_CATEGORY.get(keyword);
}
