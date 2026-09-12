import { SpellBook } from "../../src/model/spell-item/spellbook";
import { SPELLS } from "../spells/spell-names";

const s = SPELLS.Priest;

export const Spellbooks: SpellBook[] = [
  {
    name: "EvilUndeadCleric",
    spells: [
      {
        level: 1,
        base: [s.Sanctuary, s.Command, s.CauseLightWounds],
        additionnals: [s.Curse, s.Doom, s.ProtectionFromGood, s.ArmorOfFaith],
        repeat: [s.Command, s.CauseLightWounds],
      },
      {
        level: 2,
        base: [s.Silence, s.HoldPerson, s.SpiritualHammer],
        additionnals: [s.DrawUponHolyMight, s.Chant, s.CauseModerateWounds, s.Aid],
        repeat: [s.HoldPerson, s.CauseModerateWounds],
      },
      {
        level: 3,
        base: [s.AnimateDead, s.GlyphOfWarding, s.HolySmite],
        additionnals: [s.CauseDisease, s.Contagion, s.MiscastMagic, s.RigidThinking],
        repeat: [s.AnimateDead, s.GlyphOfWarding, s.HolySmite],
      },
      {
        level: 4,
        base: [s.CloudOfPestilence, s.MentalDomination, s.HolyPower],
        additionnals: [
          s.Poison,
          s.CauseSeriousWounds,
          s.CloakOfFear,
          s.FreeAction,
          s.ProtectionFromGood10Radius,
        ],
        repeat: [s.Poison, s.MentalDomination, s.CauseSeriousWounds],
      },
      {
        level: 5,
        base: [s.GreaterCommand, s.FlameStrike, s.SlayLiving],
        additionnals: [
          s.MagicResistance,
          s.PhysicalMirror,
          s.TrueSeeing,
          s.MassCauseLightWounds,
          s.RighteousMagic,
        ],
        repeat: [s.FlameStrike, s.SlayLiving],
      },
      {
        level: 6,
        base: [s.AnimateSkeletonWarrior, s.EntropyShield],
        additionnals: [s.BladeBarrier, s.BoltOfGlory, s.DolorousDecay, s.Harm, s.Banishment],
        repeat: [s.AnimateSkeletonWarrior, s.DolorousDecay],
      },
      {
        level: 7,
        base: [s.SummonDeathKnight, s.UnholyWord],
        additionnals: [
          s.Destruction,
          s.FingerOfDeath,
          s.Chaos,
          s.Wither,
          s.SymbolDeath,
          s.SymbolStunning,
        ],
        repeat: [s.Destruction],
      },
    ],
  },
];
