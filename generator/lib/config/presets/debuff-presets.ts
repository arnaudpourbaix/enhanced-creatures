import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-names";
import { SPELLS } from "../spells/spell-names";

export const DEBUFF_PRESETS: AbilityPreset[] = [
  ...presetFactory.create([SPELLS.Priest.Doom.file, FNP_SPELLS.Priest.Doom.file], {
    name: SPELLS.Priest.Doom.name,
    targets: [
      {
        name: "Players",
        triggers: [
          triggerFactory.checkSpellState("DOOM", true),
          triggerFactory.checkStatGT(0, "MINORGLOBE", true),
          // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
        ],
        randomOrder: true,
      },
    ],
    spell: {},
    requireVocal: true,
    probability: DEFAULT_SPELL_PROBABILITY,
  }),
  ...presetFactory.create(
    [SPELLS.Wizard.GreaterMalison.file, FNP_SPELLS.Priest.GreaterMalison.file],
    {
      name: SPELLS.Wizard.GreaterMalison.name,
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
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  ),
  {
    preset: FNP_SPELLS.Priest.WavesOfFatigue.file,
    ability: {
      name: FNP_SPELLS.Priest.WavesOfFatigue.name,
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
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.Glitterdust.file,
    ability: {
      name: SPELLS.Wizard.Glitterdust.name,
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
