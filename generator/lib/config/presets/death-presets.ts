import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { DEFAULT_SPELL_PROBABILITY } from "../common";
import { SPELLS } from "../spells/spell-names";

export const DEATH_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Wizard.WailOfTheBanshee.file,
    ability: {
      name: SPELLS.Wizard.WailOfTheBanshee.name,
      targets: [
        {
          name: "Players",
          triggers: [
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
          ],
        },
      ],
      spell: {
        selfTarget: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.PowerWordKill.file,
    ability: {
      name: SPELLS.Wizard.PowerWordKill.name,
      targets: [
        {
          name: "Players",
          includeStatus: ["Able"],
          triggers: [
            triggerFactory.hplt(61),
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
    preset: SPELLS.Priest.FingerOfDeath.file,
    ability: {
      name: SPELLS.Priest.FingerOfDeath.name,
      targets: targetService.combineListWithTriggers(
        [
          {
            name: "Players",
            includeStatus: ["Able"],
            randomOrder: true,
          },
          {
            name: "Players",
            randomOrder: true,
          },
        ],
        [
          // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
        ],
      ),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.SymbolDeath.file,
    ability: {
      name: SPELLS.Priest.SymbolDeath.name,
      targets: [
        {
          name: "Players",
          triggers: [
            triggerFactory.hplt(61),
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
