import { SpellCheckConfig } from "./spells/spell-check-config";

// Gameplay choices: how the generated creatures play. Build toggles live in build-config.ts,
// values that never change (file paths, script variable names) in constants.ts.

/** Which strength plays: today's 3e/5e scores, or the 2e ones a creature records (strength2e) */
export type StrengthEdition = "3e+" | "2e";

export interface PlayerConfig {
  /** The checks a spell's target must pass before the AI casts it (see SpellCheckConfig) */
  spellChecks: SpellCheckConfig;
  /**
   * "2e": creatures, variants and adjustments with a `strength2e` play it (see
   * strength-edition.service.ts); "3e+": today's strengths everywhere. Spec:
   * docs/superpowers/specs/2026-11-07-strength-2e-design.md
   */
  strengthEdition: StrengthEdition;
  /**
   * true: a base creature plays its 2e book XP (xpv2e, the Monstrous Manual value). false: base
   * creatures are scored by the 2e DMG formula like adjustments, never below their in-game XP
   * (experience.service); the book XP stays for the Base XP conflicts.
   */
  experience2e: boolean;
  /**
   * Minimum chance (in %, by steps of 5: a d20) for a target to fail a spell's saving throw, below
   * which the AI doesn't target it with that spell (see TriggerFactory.saveChecks). 0: the target
   * only needs to be able to fail, like SCS. Needs spellChecks.stats.
   */
  saveCheckMinFailChance: number;
  /**
   * Add WeaponEffectiveVs/WeaponCanDamage (main hand) to attack target triggers, so a creature
   * doesn't attack a target its weapon can't hit or damage.
   */
  weaponCheck: boolean;
  /** Get out of hostile clouds (see CLOUDS): only with Stratagems, whose clouds shout to warn. */
  avoidClouds: boolean;
  /**
   * Areas where creatures can't cast spells (innate abilities still work): entering one sets
   * BAF_CONSTANTS.disableSpellcasting, which every spellcasting block checks (see
   * BaseCreatureAbility.spellcasting).
   */
  disableSpellcastingAreas: string[];
  constitutionAffectHitPoint: boolean;
  spellcasterPrecastMidDurationSpells: boolean;
  /**
   * Script Range() distance within which a creature walks to the players it tracks, and a summon
   * follows its summoner
   */
  trackingRange: number;
  /** Script Range() distance of a melee attack (an enemy within it is in reach) */
  meleeRange: number;
  /**
   * Radius (script Range() units) of an area spell without an alliesCheck of its own, used to
   * prefer a target with other enemies around it (see StatementBuilderService.clusterTriggers).
   */
  areaRange: number;
  /**
   * Radius (script Range() units) within which a melee attacker prefers a weakened target (see
   * TargetStatus.preferWithin) over the nearest one.
   */
  preferRange: number;
}

export const PLAYER_CONFIG: PlayerConfig = {
  spellChecks: {
    spellProtections: true,
    stats: true,
    races: true,
    classes: true,
    kits: true,
  },
  strengthEdition: "3e+",
  experience2e: true,
  saveCheckMinFailChance: 0,
  weaponCheck: true,
  avoidClouds: true,
  disableSpellcastingAreas: ["AR3004", "AR3008"],
  constitutionAffectHitPoint: false,
  spellcasterPrecastMidDurationSpells: false,
  trackingRange: 150,
  meleeRange: 4,
  areaRange: 10,
  preferRange: 10,
};
