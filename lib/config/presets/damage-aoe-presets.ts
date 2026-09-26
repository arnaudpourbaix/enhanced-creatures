import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { ScriptTarget } from "../../src/model/constants";
import { Durations } from "../../src/model/game-data/durations";
import { AbilityPreset } from "../../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";
import { CommonTargetLists } from "../target/common";

// NumCreatureGT is not used purposely
// Although it is best to maximize spell efficiency, you must remember the solo enemy case.

export const DAMAGE_AOE_PRESETS: AbilityPreset[] = [
  ...presetFactory.createSpells(
    [
      SPELLS.Wizard.Cloudkill,
      SPELLS.Wizard.ChainLightning,
      SPELLS.Wizard.ConeOfCold,
      SPELLS.Wizard.BurningHands,
      SPELLS.Priest.MassCauseLightWounds,
      SPELLS.Priest.CloudOfPestilence,
      FNP_SPELLS.Priest.CloudOfPestilence,
      SPELLS.Wizard.LightningBolt,
      SPELLS.Wizard.AgannazarScorcher,
    ],
    {
      targets: CommonTargetLists.Enemies,
    },
  ),
  ...presetFactory.createSpells([SPELLS.Wizard.Fireburst], {
    targets: CommonTargetLists.Enemies,
    spell: {
      castOnSelf: true,
    },
    range: 10,
  }),
  ...presetFactory.createSpells(
    [
      SPELLS.Wizard.Fireball,
      SPELLS.Wizard.SkullTrap,
      SPELLS.Priest.GlyphOfWarding,
      SPELLS.Wizard.VitriolicSphere,
      SPELLS.Priest.HolySmite,
      SPELLS.Priest.UnholyBlight,
      SPELLS.Wizard.IceStorm,
    ],
    {
      targets: CommonTargetLists.FarthestEnemies,
      minRange: 20,
      actionsAfter: [{ name: "RunAwayFrom", params: [ScriptTarget.lastSeen, 30] }],
    },
  ),
  {
    // Frost Fingers itself is broken in the Faiths & Powers mod that provides it (confirmed:
    // not a bug in this generator or this preset) - can't be fixed from here. Currently unused
    // (the one spellbook slot that referenced it, undead.ts's mummy, was switched to Command
    // instead), kept for whenever FNP fixes the underlying spell.
    preset: FNP_SPELLS.Priest.FrostFingers.file,
    ability: {
      name: FNP_SPELLS.Priest.FrostFingers.name,
      targets: [
        {
          name: "NearestEnemies",
        },
      ],
      spell: {
        castOnSelf: true,
      },
      triggers: [
        {
          name: "CheckStat",
          params: [ScriptTarget.myself, 5, "SCRIPTINGSTATE4"],
          negation: true,
        },
      ],
      range: 10,
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];
