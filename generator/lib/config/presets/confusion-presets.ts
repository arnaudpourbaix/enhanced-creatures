import presetFactory from "../../src/factories/preset.factory";
import { AbilityPreset } from "../../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-names";
import { SPELLS } from "../spells/spell-names";

export const CONFUSION_PRESETS: AbilityPreset[] = [
  ...presetFactory.create([SPELLS.Wizard.Confusion.file], {
    name: SPELLS.Wizard.Confusion.name,
    targets: [
      {
        name: "NearestEnemies",
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
  }),
  ...presetFactory.create([SPELLS.Priest.Chaos.file, FNP_SPELLS.Priest.Chaos.file], {
    name: SPELLS.Priest.Chaos.name,
    targets: [
      {
        name: "NearestEnemies",
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
  }),
];
