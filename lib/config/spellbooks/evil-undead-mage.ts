import { SpellBook } from "../../src/model/spell-item/spellbook";
import { SPELLS } from "../spells/spell-names";

const s = SPELLS.Wizard;

export const EvilUndeadMageSpellbook: SpellBook = {
  name: "EvilUndeadMage",
  spells: [
    {
      mod: "Vanilla",
      values: [
        {
          level: 1,
          base: [s.MagicMissiles, s.Spook, s.Sleep],
          additionnals: [],
          repeat: [s.MagicMissiles, s.ChromaticOrb],
        },
        {
          level: 2,
          base: [s.MirrorImages, s.Combust],
          additionnals: [s.Web, s.StinkingCloud],
          repeat: [s.MelfAcidArrow, s.MirrorImages, s.Combust],
        },
        {
          level: 3,
          base: [s.Haste, s.Slow, s.SkullTrap],
          additionnals: [s.ProtectionFromMissiles, s.VampiricTouch],
          repeat: [s.SkullTrap, s.FlameArrow],
        },
        {
          level: 4,
          base: [s.Stoneskin, s.MinorGlobeOfInvulnerability, s.ShadowMonsters],
          additionnals: [s.Confusion, s.MordenkainenForceMissiles],
          repeat: [s.Stoneskin, s.MordenkainenForceMissiles],
        },
        {
          level: 5,
          base: [s.DemiShadowMonsters, s.HoldMonster],
          additionnals: [s.Breach, s.SummonShadow],
          repeat: [s.ShroudOfFlame, s.Breach],
        },
        {
          level: 6,
          base: [],
          additionnals: [],
          repeat: [],
        },
        {
          level: 7,
          base: [],
          additionnals: [],
          repeat: [],
        },
      ],
    },
  ],
};

export const EvilUndeadMageNoFFSpellbook: SpellBook = {
  name: "EvilUndeadMageNoFF", // no friendly fire
  spells: [
    {
      mod: "Vanilla",
      values: [
        {
          level: 1,
          base: [s.MagicMissiles, s.Spook, s.Sleep],
          additionnals: [],
          repeat: [s.MagicMissiles, s.ChromaticOrb],
        },
        {
          level: 2,
          base: [s.MirrorImages, s.Combust],
          additionnals: [s.PowerWordSleep, s.StinkingCloud],
          repeat: [s.MelfAcidArrow, s.MirrorImages, s.Combust],
        },
        {
          level: 3,
          base: [s.Haste, s.Slow, s.FlameArrow],
          additionnals: [s.ProtectionFromMissiles, s.VampiricTouch],
          repeat: [s.DireCharm, s.FlameArrow],
        },
        {
          level: 4,
          base: [s.Stoneskin, s.MinorGlobeOfInvulnerability, s.ShadowMonsters],
          additionnals: [s.Confusion, s.MordenkainenForceMissiles],
          repeat: [s.Stoneskin, s.MordenkainenForceMissiles],
        },
        {
          level: 5,
          base: [s.DemiShadowMonsters, s.HoldMonster],
          additionnals: [s.Breach, s.SummonShadow],
          repeat: [s.ShroudOfFlame, s.Breach],
        },
        {
          level: 6,
          base: [],
          additionnals: [],
          repeat: [],
        },
        {
          level: 7,
          base: [],
          additionnals: [],
          repeat: [],
        },
      ],
    },
  ],
};
