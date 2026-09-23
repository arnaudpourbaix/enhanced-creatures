import abilityFactory from "../../src/factories/ability.factory";
import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";
import { NEW_SPELLS } from "../spells/spells";

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
    preset: SPELLS.Priest.Contagion.file,
    ability: {
      name: SPELLS.Priest.Contagion.name,
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
    preset: SPELLS.Priest.Curse.file,
    ability: {
      name: SPELLS.Priest.Curse.name,
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
  {
    preset: SPELLS.Priest.EnergyDrain.file,
    ability: {
      name: SPELLS.Priest.EnergyDrain.name,
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
  ...presetFactory.create([SPELLS.Priest.SymbolPain.file, NEW_SPELLS.WizardSymbolOfPain], {
    name: SPELLS.Priest.SymbolPain.name,
    targets: [
      {
        name: "PCsFighters",
        randomOrder: true,
      },
    ],
    spell: {},
    requireVocal: true,
    probability: DEFAULT_SPELL_PROBABILITY,
  }),
  {
    preset: SPELLS.Priest.SymbolWeakness.file,
    ability: {
      name: SPELLS.Priest.SymbolWeakness.name,
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
