// Development and release build toggles: they change the generated output (and its install
// time), not how the creatures play. Gameplay choices live in player-config.ts.

export interface BuildConfig {
  /**
   * Keep disabled during development: shuffling target order on every regeneration would churn
   * the committed .baf files with no real config change behind it. Enable once, right before a
   * release build, to bake in the intended non-nearest-first target variety.
   */
  enableRandomTargetOrder: boolean;
  /**
   * Keep disabled during development because it increases installation time. Enable once, right
   * before a release build.
   */
  enableSecondaryTypes: boolean;
  /**
   * Give the game's spells and items granting an immunity its spell state (see
   * WeiduCoreService.generateImmunityStates), so the AI sees a party's protections. Keep disabled
   * during development because it increases installation time (a pass over every spell and item).
   * Enable once, right before a release build.
   */
  enableImmunityStates: boolean;
  /**
   * Randomize the order additional spells are picked from when filling a spellbook (see
   * spell.service.ts's createSpellbook). Keep disabled during development: shuffling would churn
   * committed output with no real config change behind it.
   */
  randomizeSpellbookAdditionals: boolean;
}

export const BUILD_CONFIG: BuildConfig = {
  enableRandomTargetOrder: false,
  enableSecondaryTypes: false,
  enableImmunityStates: false,
  randomizeSpellbookAdditionals: false,
};
