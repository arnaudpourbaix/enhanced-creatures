import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { DEFAULT_SPELL_PROBABILITY, FEAR_TARGET_LISTS } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-names";
import { SPELLS } from "../spells/spell-names";

export const FEAR_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Wizard.Horror.file,
    ability: {
      name: SPELLS.Wizard.Horror.name,
      targets: targetService.combineListWithTriggers(FEAR_TARGET_LISTS, [
        triggerFactory.checkStatGT(0, "MINORGLOBE", true),
        // triggerFactory.checkStatGT(0, "WIZARD_RESIST_FEAR", true),
        // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
      ]),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.Spook.file,
    ability: {
      name: SPELLS.Wizard.Spook.name,
      targets: targetService.combineListWithTriggers(FEAR_TARGET_LISTS, [
        triggerFactory.checkStatGT(0, "MINORGLOBE", true),
        // triggerFactory.checkStatGT(0, "WIZARD_RESIST_FEAR", true),
        // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
      ]),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  ...presetFactory.create(
    [SPELLS.Priest.CloakOfFear.file, FNP_SPELLS.Priest.CloakOfFear.file],
    {
      name: SPELLS.Priest.CloakOfFear.name,
      targets: targetService.combineListWithTriggers(FEAR_TARGET_LISTS, [
        // triggerFactory.checkStatGT(0, "WIZARD_RESIST_FEAR", true),
        // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
      ]),
      spell: {
        selfTarget: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  ),
];
