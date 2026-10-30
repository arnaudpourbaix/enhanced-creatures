import {
  chainContingency,
  checkDuplicates,
  contingency,
  contingencyMaxLevel,
  minorSequencer,
  registerContingencies,
  registerSequencers,
  SpellCombo,
  spellSequencer,
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
    LarlochMinorDrain: minorSequencer([s.LarlochMinorDrain, s.LarlochMinorDrain]),
    MagicMissiles: minorSequencer([s.MagicMissiles, s.MagicMissiles]),
    Lifedrain: spellSequencer([s.LarlochMinorDrain, s.LarlochMinorDrain, s.VampiricTouch]),
    EmotionSlow: spellSequencer([s.EmotionHopelessness, s.EmotionHopelessness, s.Slow]),
  },
  COMBO_SPELLS,
);

/** Wizard contingencies and chain contingencies, by key. */
export const CONTINGENCIES = registerContingencies(
  {
    Stoneskin: contingency("hp50", [s.Stoneskin]),
    AbiDalzimHorridWilting: chainContingency(
      "hit",
      [s.AbiDalzimHorridWilting, s.AbiDalzimHorridWilting, s.AbiDalzimHorridWilting],
      "lastHitter",
    ),
  },
  COMBO_SPELLS,
);

/** Every combo, the list later stages iterate. */
export const SPELL_COMBOS: SpellCombo[] = [
  ...Object.values<SpellCombo>(SEQUENCERS),
  ...Object.values<SpellCombo>(CONTINGENCIES),
];
checkDuplicates(SPELL_COMBOS);
