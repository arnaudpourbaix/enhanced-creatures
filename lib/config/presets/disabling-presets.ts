import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { Durations } from "../../src/model/game-data/durations";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { DEFAULT_SPELL_PROBABILITY } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-names";
import { SPELLS } from "../spells/spell-names";

export const DISABLING_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Wizard.Darkness15Radius.file,
    ability: {
      name: SPELLS.Wizard.Darkness15Radius.name,
      targets: [
        {
          name: "NearestEnemies",
          includeStatus: ["Able"],
          limit: 6,
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
    preset: SPELLS.Wizard.ObscuringMist.file,
    ability: {
      name: SPELLS.Wizard.ObscuringMist.name,
      targets: [
        {
          name: "PCsFighters",
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
    preset: SPELLS.Priest.Silence.file,
    ability: {
      name: SPELLS.Priest.Silence.name,
      targets: [
        {
          name: "PCSpellcasters",
          includeStatus: ["Able"],
          triggers: [
            triggerFactory.range(20, true),
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
          ],
          randomOrder: true,
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.MiscastMagic.file,
    ability: {
      name: SPELLS.Priest.MiscastMagic.name,
      targets: [
        {
          name: "PCSpellcasters",
          includeStatus: ["Able"],
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
  ...presetFactory.create(
    [SPELLS.Priest.RigidThinking.file, FNP_SPELLS.Priest.RigidThinking.file],
    {
      name: SPELLS.Priest.RigidThinking.name,
      targets: [
        {
          name: "NearestEnemies",
          includeStatus: ["Able"],
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
  ),
  {
    preset: SPELLS.Priest.SummonInsects.file,
    ability: {
      name: SPELLS.Priest.SummonInsects.name,
      targets: [
        {
          name: "PCSpellcasters",
          includeStatus: ["Able"],
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
    preset: SPELLS.Priest.Entangle.file,
    ability: {
      name: SPELLS.Priest.Entangle.name,
      targets: [
        {
          name: "NearestEnemies",
          includeStatus: ["Able"],
          triggers: [
            triggerFactory.checkStatGT(0, "ENTANGLE", true),
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
    preset: SPELLS.Wizard.Slow.file,
    ability: {
      name: SPELLS.Wizard.Slow.name,
      targets: targetService.combineListWithTriggers(
        [
          {
            name: "PCsFighters",
            includeStatus: ["Able"],
          },
          {
            name: "NearestEnemies",
            includeStatus: ["Able"],
            limit: 6,
          },
        ],
        [
          triggerFactory.checkStatGT(0, "MINORGLOBE", true),
          // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
        ],
      ),
      spell: {
        excludeStateChecks: ["STATE_SLOWED"],
      },
      requireVocal: true,
    },
  },
  {
    preset: SPELLS.Wizard.PowerWordBlind.file,
    ability: {
      name: SPELLS.Wizard.PowerWordBlind.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
          triggers: [
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
          ],
        },
      ],
      spell: {
        excludeStateChecks: ["STATE_BLIND", "STATE_DISABLED"],
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.PowerWordStun.file,
    ability: {
      name: SPELLS.Wizard.PowerWordStun.name,
      targets: [
        {
          name: "Players",
          includeStatus: ["Able"],
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
    preset: FNP_SPELLS.Priest.Forbiddance.file,
    ability: {
      name: FNP_SPELLS.Priest.Forbiddance.name,
      targets: [
        {
          name: "NearestEnemies",
          triggers: [
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
          ],
        },
      ],
      spell: {},
      timer: { name: "Forbiddance", value: 2 * Durations.round },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: FNP_SPELLS.Priest.MiscastMagic.file,
    ability: {
      name: FNP_SPELLS.Priest.MiscastMagic.name,
      targets: [
        {
          name: "PCSpellcasters",
          triggers: [
            triggerFactory.checkSpellState("MISCAST_MAGIC", true),
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
    preset: SPELLS.Wizard.StinkingCloud.file,
    ability: {
      name: SPELLS.Wizard.StinkingCloud.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
          includeStatus: ["Able"],
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
  ...presetFactory.create([SPELLS.Wizard.Emotion.file, FNP_SPELLS.Priest.Emotion.file], {
    name: SPELLS.Wizard.Emotion.name,
    targets: [
      {
        name: "NearestEnemies",
        includeStatus: ["Able"],
        randomOrder: true,
      },
    ],
    spell: {},
    requireVocal: true,
    probability: DEFAULT_SPELL_PROBABILITY,
  }),
  {
    preset: SPELLS.Wizard.TeleportField.file,
    ability: {
      name: SPELLS.Wizard.TeleportField.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];
