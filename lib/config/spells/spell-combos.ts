import {
  checkDuplicates,
  minorSequencer,
  registerContingencies,
  registerSequencers,
  SpellCombo,
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
export const SEQUENCERS = registerSequencers(
  {
    DoubleMagicMissiles: minorSequencer([s.MagicMissiles, s.MagicMissiles]),
  },
  COMBO_SPELLS,
);

/** Wizard contingencies and chain contingencies, by key. */
export const CONTINGENCIES = registerContingencies({}, COMBO_SPELLS);

/** Every combo, the list later stages iterate. */
export const SPELL_COMBOS: SpellCombo[] = [
  ...Object.values<SpellCombo>(SEQUENCERS),
  ...Object.values<SpellCombo>(CONTINGENCIES),
];
checkDuplicates(SPELL_COMBOS);
