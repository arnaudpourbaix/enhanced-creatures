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
    Lifedrain: spellSequencer([s.VampiricTouch, s.LarlochMinorDrain, s.LarlochMinorDrain]),
    EmotionSlow: spellSequencer([s.EmotionHopelessness, s.EmotionHopelessness, s.Slow]),
  },
  COMBO_SPELLS,
);

/** Wizard contingencies and chain contingencies, by key. */
export const CONTINGENCIES = registerContingencies(
  {
    OtilukesResilientSphere: contingency("helpless", [s.OtilukesResilientSphere]),
    Stoneskin: contingency("hp50", [s.Stoneskin]),
    ImprovedHaste: contingency("hit", [s.ImprovedHaste]),
    TrueSeeing: contingency("seeEnemy", [s.TrueSeeing]),
    ProtectionFromMagicalWeapons: contingency("hit", [s.ProtectionFromMagicalWeapons]),
    ProtectionFromMagicEnergy: contingency("seeEnemy", [s.ProtectionFromMagicEnergy]),
    MassInvisibility: contingency("seeEnemy", [s.MassInvisibility]),
    PrismaticMantle: contingency("hit", [s.PrismaticMantle]),
    MomentOfPrescience: contingency("hit", [s.MomentOfPrescience]),
    ProtectAndSummon: chainContingency(
      "hit",
      [s.MomentOfPrescience, s.ProtectionFromEnergy, s.MonsterSummoning8],
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
