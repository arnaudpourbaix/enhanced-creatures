import {
  chainContingency,
  contingency,
  minorSequencer,
  registerComboGroups,
  SpellCombo,
  spellSequencer,
} from "../../src/model/spell-item/spell-combo";
import { FNP_SPELLS } from "./fnp-spell-database";
import { SPELLS } from "./spell-database";

const s = SPELLS.Wizard;

/** The spells a combo may hold: wizard and priest ones. */
const COMBO_SPELLS = [
  ...Object.values(SPELLS.Wizard),
  ...Object.values(SPELLS.Priest),
  ...Object.values(FNP_SPELLS.Priest),
];

/** Wizard sequencers and contingencies, one group per kind: `COMBOS.Contingencies.Stoneskin`. */
export const COMBOS = registerComboGroups(
  {
    MinorSequencers: {
      LarlochMinorDrain: minorSequencer([s.LarlochMinorDrain, s.LarlochMinorDrain]),
      MagicMissiles: minorSequencer([s.MagicMissiles, s.MagicMissiles]),
      RayOfEnfeeblement: minorSequencer([s.RayOfEnfeeblement, s.RayOfEnfeeblement]),
      MirrorBlur: minorSequencer([s.MirrorImages, s.Blur]),
    },
    SpellSequencers: {
      Lifedrain: spellSequencer([s.VampiricTouch, s.LarlochMinorDrain, s.LarlochMinorDrain]),
      EmotionSlow: spellSequencer([s.EmotionHopelessness, s.EmotionHopelessness, s.Slow]),
      StoneskinsGlobe: spellSequencer([s.Stoneskin, s.MinorGlobeOfInvulnerability, s.SpiritArmor]),
    },
    Contingencies: {
      OtilukesResilientSphere: contingency("helpless", [s.OtilukesResilientSphere]),
      Stoneskin: contingency("hp50", [s.Stoneskin]),
      ImprovedHaste: contingency("hit", [s.ImprovedHaste]),
      TrueSeeing: contingency("seeEnemy", [s.TrueSeeing]),
      ProtectionFromMagicalWeapons: contingency("hit", [s.ProtectionFromMagicalWeapons]),
      ProtectionFromMagicEnergy: contingency("seeEnemy", [s.ProtectionFromMagicEnergy]),
      MassInvisibility: contingency("seeEnemy", [s.MassInvisibility]),
      PrismaticMantle: contingency("hit", [s.PrismaticMantle]),
      MomentOfPrescience: contingency("hit", [s.MomentOfPrescience]),
    },
    ChainContingencies: {
      ProtectAndSummon: chainContingency(
        "seeEnemy",
        [s.MomentOfPrescience, s.ProtectionFromEnergy, s.MonsterSummoning8],
        "self",
      ),
    },
  },
  COMBO_SPELLS,
);

/** Every combo, the list later stages iterate. */
export const SPELL_COMBOS: SpellCombo[] = Object.values(COMBOS).flatMap((group) =>
  Object.values<SpellCombo>(group),
);
