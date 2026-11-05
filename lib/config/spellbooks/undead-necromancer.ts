import { SpellBook } from "../../src/model/spell-item/spellbook";
import { COMBOS } from "../spells/spell-combos";
import { SPELLS } from "../spells/spell-database";

const s = SPELLS.Wizard;

export const EvilUndeadNecromancerSpellbook: SpellBook = {
  name: "EvilUndeadNecromancer",
  // Necromancer: no Illusion or Enchantment/Charm
  values: [
    {
      level: 1,
      base: [s.Shield],
      additionnals: [],
      repeat: [s.LarlochMinorDrain, s.MagicMissiles],
    },
    {
      level: 2,
      base: [s.Horror, s.RayOfEnfeeblement, s.Vocalize],
      additionnals: [s.StinkingCloud, s.SoundBurst, s.GhoulTouch],
      repeat: [s.MelfAcidArrow],
    },
    {
      level: 3,
      base: [s.VampiricTouch],
      additionnals: [s.ProtectionFromMissiles, s.Slow, s.RemoveMagic],
      repeat: [s.SkullTrap],
    },
    {
      level: 4,
      base: [s.Stoneskin, s.Contagion, s.MinorGlobeOfInvulnerability],
      additionnals: [],
      repeat: [s.BeltynsBurningBlood, s.Stoneskin],
    },
    {
      level: 5,
      base: [s.SummonShadow, s.WavesOfFatigue, s.Breach, s.ConeOfCold],
      additionnals: [],
      repeat: [s.SummonShadow, s.WavesOfFatigue],
    },
    {
      level: 6,
      base: [s.AnimateSkeletonWarrior, s.ProtectionFromMagicalWeapons],
      additionnals: [],
      repeat: [s.Disintegrate, s.OtilukesFreezingSphere, s.AnimateSkeletonWarrior],
    },
    {
      level: 7,
      base: [s.SummonDeathKnight, s.KhelbensWardingWhip, s.FingerOfDeath, s.GreaterSpellDeflection],
      additionnals: [],
      repeat: [s.FingerOfDeath],
    },
    {
      level: 8,
      base: [s.AbiDalzimHorridWilting, s.Maze, s.MomentOfPrescience],
      additionnals: [],
      repeat: [s.AbiDalzimHorridWilting],
    },
    {
      level: 9,
      base: [s.WailOfTheBanshee, s.AbsoluteImmunity],
      additionnals: [],
      repeat: [s.LarlochEnergyDrain],
    },
  ],
  minorSequencers: [
    COMBOS.MinorSequencers.LarlochMinorDrain,
    COMBOS.MinorSequencers.RayOfEnfeeblement,
  ],
  spellSequencers: [COMBOS.SpellSequencers.Lifedrain],
  contingencies: [
    COMBOS.Contingencies.MomentOfPrescience,
    COMBOS.Contingencies.PrismaticMantle,
    COMBOS.Contingencies.ProtectionFromMagicalWeapons,
    COMBOS.Contingencies.Stoneskin,
  ],
  chainContingencies: [COMBOS.ChainContingencies.ProtectAndSummon],
};
