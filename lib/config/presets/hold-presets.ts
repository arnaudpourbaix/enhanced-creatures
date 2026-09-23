import presetFactory from "../../src/factories/preset.factory";
import { AbilityPreset } from "../../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY, HOLD_TARGET_LISTS } from "../common";
import { SPELLS } from "../spells/spell-database";

export const HOLD_PRESETS: AbilityPreset[] = [
  ...presetFactory.create([SPELLS.Priest.HoldPerson.file, SPELLS.Wizard.HoldPerson.file], {
    name: SPELLS.Priest.HoldPerson.name,
    targets: HOLD_TARGET_LISTS,
    spell: {},
    requireVocal: true,
    probability: DEFAULT_SPELL_PROBABILITY,
  }),
  {
    preset: SPELLS.Priest.HoldPersonOrAnimal.file,
    ability: {
      name: SPELLS.Priest.HoldPersonOrAnimal.name,
      targets: HOLD_TARGET_LISTS,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.HoldMonster.file,
    ability: {
      name: SPELLS.Wizard.HoldMonster.name,
      targets: HOLD_TARGET_LISTS,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.Web.file,
    ability: {
      name: SPELLS.Wizard.Web.name,
      targets: HOLD_TARGET_LISTS,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];
