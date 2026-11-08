import spellComboFactory from "../../src/factories/spell-combo.factory";
import { ItemAbilityPrimaryTypeEnum } from "../../src/model/spell-item/effect.enums";
import { SpellBook } from "../../src/model/spell-item/spellbook";
import { COMBOS } from "../spells/spell-combos";
import { SPELLS } from "../spells/spell-database";

const s = SPELLS.Wizard;

export const VampireNecromancerSpellbook: SpellBook = {
  name: "VampireNecromancerSpellbook",
  specialization: ItemAbilityPrimaryTypeEnum.Necromancer,
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
      additionnals: [s.StinkingCloud, s.SoundBurst],
      repeat: [s.Combust, s.MelfAcidArrow],
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
      base: [s.AnimateSkeletonWarrior, s.ProtectionFromMagicalWeapons, s.ImprovedHaste],
      additionnals: [],
      repeat: [s.Disintegrate, s.OtilukesFreezingSphere],
    },
    {
      level: 7,
      base: [s.SummonDeathKnight, s.KhelbensWardingWhip, s.GreaterSpellDeflection],
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
  ...spellComboFactory.bySchool(
    [ItemAbilityPrimaryTypeEnum.Necromancer, ItemAbilityPrimaryTypeEnum.Abjurer],
    {
      specialization: ItemAbilityPrimaryTypeEnum.Necromancer,
      contingencies: [ItemAbilityPrimaryTypeEnum.Abjurer],
    },
  ),
};
