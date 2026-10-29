import {
  minorSequencer,
  registerCombos,
  checkDuplicates,
} from "../../src/model/spell-item/spell-combo";
import { SPELLS } from "./spell-database";
import { FNP_SPELLS } from "./fnp-spell-database";

const s = SPELLS.Wizard;

/** The spells a combo may hold: wizard and priest ones. */
const COMBO_SPELLS = [
  ...Object.values(SPELLS.Wizard),
  ...Object.values(SPELLS.Priest),
  ...Object.values(FNP_SPELLS.Priest),
];

/** Wizard sequencers, by key. */
export const SEQUENCERS = registerCombos(
  {
    DoubleMagicMissiles: minorSequencer([s.MagicMissiles, s.MagicMissiles]),
  },
  COMBO_SPELLS,
);

/** Wizard contingencies and chain contingencies, by key. */
export const CONTINGENCIES = registerCombos({}, COMBO_SPELLS);

/** Every combo, the list later stages iterate. */
export const SPELL_COMBOS = [...Object.values(SEQUENCERS), ...Object.values(CONTINGENCIES)];
checkDuplicates(SPELL_COMBOS);
