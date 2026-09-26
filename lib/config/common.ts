export const SPELL_STATES = {
  flying: "JA_FLYING",
  grabbed: "JA_GRAPPLED",
  grabbing: "JA_GRAPPLING",
  gaseousForm: "JA_GASEOUSFORM",
} as const;

/**
 * One of SPELL_STATES' scripting-state values (e.g. "JA_FLYING"), not a SplStateIdentifier.
 * Defined here (rather than on CreatureAbilitySpell in ability.ts, its only current consumer)
 * because SpellReference also needs it and already sits underneath ability.ts in the import graph
 * - importing it from ability.ts instead would create a cycle.
 */
export type SpellStateValue = (typeof SPELL_STATES)[keyof typeof SPELL_STATES];

export const DEFAULT_SPELL_PROBABILITY = 70;

export const PRESET_NAMES = {
  DimensionDoorOffscreen: "DimensionDoorOffscreen",
};
