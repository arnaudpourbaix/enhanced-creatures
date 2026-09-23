import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { DEFAULT_SPELL_PROBABILITY, SLEEP_TARGET_LISTS } from "../common";
import { SPELLS } from "../spells/spell-database";

export const SLEEP_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Wizard.PowerWordSleep.file,
    ability: {
      name: SPELLS.Wizard.PowerWordSleep.name,
      targets: targetService.combineListWithTriggers(SLEEP_TARGET_LISTS, [triggerFactory.hplt(20)]),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.Sleep.file,
    ability: {
      name: SPELLS.Wizard.Sleep.name,
      targets: SLEEP_TARGET_LISTS,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.GreaterCommand.file,
    ability: {
      name: SPELLS.Priest.GreaterCommand.name,
      targets: SLEEP_TARGET_LISTS,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Command.file,
    ability: {
      name: SPELLS.Priest.Command.name,
      targets: SLEEP_TARGET_LISTS,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];
