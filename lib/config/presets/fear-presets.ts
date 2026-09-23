import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { DEFAULT_SPELL_PROBABILITY, FEAR_TARGET_LISTS } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";

export const FEAR_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Wizard.Horror.file,
    ability: {
      name: SPELLS.Wizard.Horror.name,
      targets: targetService.combineListWithTriggers(FEAR_TARGET_LISTS, [
        triggerFactory.checkStatGT(0, "MINORGLOBE", true),
        ...triggerFactory.spellChecks(SPELLS.Wizard.Horror.keywords),
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
        ...triggerFactory.spellChecks(SPELLS.Wizard.Spook.keywords),
      ]),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  ...presetFactory.create([SPELLS.Priest.CloakOfFear.file, FNP_SPELLS.Priest.CloakOfFear.file], {
    name: SPELLS.Priest.CloakOfFear.name,
    targets: targetService.combineListWithTriggers(
      FEAR_TARGET_LISTS,
      triggerFactory.spellChecks(SPELLS.Priest.CloakOfFear.keywords),
    ),
    spell: {
      selfTarget: true,
    },
    range: 10,
    requireVocal: true,
    probability: DEFAULT_SPELL_PROBABILITY,
  }),
  ...presetFactory.create([SPELLS.Innate.MoonDogHowl.file], {
    name: SPELLS.Innate.MoonDogHowl.name,
    targets: targetService.combineListWithTriggers(FEAR_TARGET_LISTS, [
      triggerFactory.checkStatGT(0, "MINORGLOBE", true),
      triggerFactory.alignment("MASK_EVIL"),
      ...triggerFactory.spellChecks(SPELLS.Innate.MoonDogHowl.keywords),
    ]),
    spell: {
      selfTarget: true,
    },
    range: 30,
    requireVocal: true,
    probability: DEFAULT_SPELL_PROBABILITY,
  }),
  {
    preset: SPELLS.Wizard.SymbolFear.file,
    ability: {
      name: SPELLS.Wizard.SymbolFear.name,
      targets: targetService.combineListWithTriggers(
        FEAR_TARGET_LISTS,
        triggerFactory.spellChecks(SPELLS.Wizard.SymbolFear.keywords),
      ),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];
