import { minorSequencer, registerCombos, checkDuplicates } from "../../src/model/spell-item/spell-combo";
import { SPELLS } from "./spell-database";

const s = SPELLS.Wizard;

/** Wizard sequencers, by key. */
export const SEQUENCERS = registerCombos({
  DoubleMagicMissiles: minorSequencer([s.MagicMissiles, s.MagicMissiles]),
});

/** Wizard contingencies and chain contingencies, by key. */
export const CONTINGENCIES = registerCombos({});

/** Every combo, the list later stages iterate. */
export const SPELL_COMBOS = [...Object.values(SEQUENCERS), ...Object.values(CONTINGENCIES)];
checkDuplicates(SPELL_COMBOS);
