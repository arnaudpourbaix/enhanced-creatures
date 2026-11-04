export const SPELL_STATES = {
  flying: "JA_FLYING",
  grabbed: "JA_GRAPPLED",
  grabbing: "JA_GRAPPLING",
  gaseousForm: "JA_GASEOUSFORM",
  animalForm: "JA_ANIMALFORM",
} as const;

/**
 * One of SPELL_STATES' scripting-state values (e.g. "JA_FLYING"), not a SplStateIdentifier.
 * Defined here (rather than on CreatureAbilitySpell in ability.ts, its only current consumer)
 * because SpellReference also needs it and already sits underneath ability.ts in the import graph
 * - importing it from ability.ts instead would create a cycle.
 */
export type SpellStateValue = (typeof SPELL_STATES)[keyof typeof SPELL_STATES];

export const DEFAULT_SPELL_PROBABILITY = 70;

/**
 * Copies memorized of a spell usable at will: more than any fight will use (renewing a spell
 * instead isn't always possible, e.g. a real wizard spell). The docs show it as "at will".
 */
export const AT_WILL = 90;

export const PRESET_NAMES = {
  DimensionDoorOffscreen: "DimensionDoorOffscreen",
};
