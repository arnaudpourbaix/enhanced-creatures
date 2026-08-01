import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { ScriptTarget } from "../../src/model/constants";
import { Durations } from "../../src/model/game-data/durations";
import { AbilityPreset } from "../../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-names";
import { SPELLS } from "../spells/spell-names";

export const DAMAGE_AOE_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Wizard.ConeOfCold.file,
    ability: {
      name: SPELLS.Wizard.ConeOfCold.name,
      targets: [
        {
          name: "NearestEnemies",
          randomOrder: true,
          triggers: [
            //   triggerFactory.checkStatLT(50, "RESISTCOLD"),
            //   triggerFactory.checkStatLT(50, "RESISTMAGIC"),
          ],
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.Fireburst.file,
    ability: {
      name: SPELLS.Wizard.Fireburst.name,
      targets: [
        {
          name: "NearestEnemies",
          randomOrder: true,
          triggers: [
            // triggerFactory.checkStatLT(50, "RESISTFIRE"),
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
          ],
        },
      ],
      spell: {
        selfTarget: true,
      },
      range: 10,
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.GlyphOfWarding.file,
    ability: {
      name: SPELLS.Priest.GlyphOfWarding.name,
      targets: [
        {
          name: "FarthestEnemies",
          randomOrder: true,
          triggers: [
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
          ],
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.BurningHands.file,
    ability: {
      name: SPELLS.Wizard.BurningHands.name,
      targets: [
        {
          name: "NearestEnemies",
          randomOrder: true,
          triggers: [
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
            // triggerFactory.checkStatLT(50, "RESISTFIRE"),
          ],
        },
      ],
      spell: {},
      range: 5,
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.IceStorm.file,
    ability: {
      name: SPELLS.Wizard.IceStorm.name,
      targets: [
        {
          name: "FarthestEnemies",
          randomOrder: true,
          triggers: [
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
            // triggerFactory.checkStatLT(50, "RESISTCOLD"),
          ],
        },
      ],
      minRange: 20,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.MassCauseLightWounds.file,
    ability: {
      name: SPELLS.Priest.MassCauseLightWounds.name,
      spell: {
        selfTarget: true,
      },
      triggers: [
        ...triggerFactory.hasItem(["LIGHT", "SERIOUS", "CRITICAL", "HARM", "SLAYLIVE"], true),
      ],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
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
        selfTarget: true,
      },
      triggers: [
        {
          name: "CheckStat",
          params: [ScriptTarget.myself, 5, "SCRIPTINGSTATE4"],
        },
      ],
      range: 10,
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  ...presetFactory.create([SPELLS.Priest.CloudOfPestilence.file, FNP_SPELLS.Priest.CloudOfPestilence.file], {
    name: SPELLS.Priest.CloudOfPestilence.name,
    targets: [
      {
        name: "NearestEnemies",
        triggers: [
          // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
        ],
      },
    ],
    spell: {},
    requireVocal: true,
    probability: DEFAULT_SPELL_PROBABILITY,
  }),
  {
    preset: SPELLS.Priest.WavesOfAgony.file,
    ability: {
      name: SPELLS.Priest.WavesOfAgony.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
          triggers: [
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
          ],
        },
      ],
      spell: {},
      timer: { name: "WavesOfAgony", value: 3 * Durations.round },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.LightningBolt.file,
    ability: {
      name: SPELLS.Wizard.LightningBolt.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
          triggers: [
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
            // triggerFactory.checkStatLT(50, "RESISTELECTRICITY"),
            // triggerFactory.hasBounceEffects(true),
          ],
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.AgannazarScorcher.file,
    ability: {
      name: SPELLS.Wizard.AgannazarScorcher.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
          triggers: [
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
            // triggerFactory.checkStatLT(50, "RESISTFIRE"),
          ],
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.VitriolicSphere.file,
    ability: {
      name: SPELLS.Wizard.VitriolicSphere.name,
      targets: [
        {
          name: "FarthestEnemies",
          randomOrder: true,
          triggers: [
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
            // triggerFactory.checkStatLT(50, "RESISTACID"),
          ],
        },
      ],
      minRange: 20,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.Cloudkill.file,
    ability: {
      name: SPELLS.Wizard.Cloudkill.name,
      targets: [
        {
          name: "NearestEnemies",
          randomOrder: true,
          triggers: [
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
          ],
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.ChainLightning.file,
    ability: {
      name: SPELLS.Wizard.ChainLightning.name,
      targets: [
        {
          name: "NearestEnemies",
          randomOrder: true,
          triggers: [
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
            // triggerFactory.checkStatLT(50, "RESISTELECTRICITY"),
          ],
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.UnholyBlight.file,
    ability: {
      name: SPELLS.Priest.UnholyBlight.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
          triggers: [
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            triggerFactory.alignment("MASK_GOOD"),
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
          ],
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];
