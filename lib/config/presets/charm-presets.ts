import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import { CHARM_TARGET_LISTS, DEFAULT_SPELL_PROBABILITY } from "../common";
import { SPELLS } from "../spells/spell-database";

export const CHARM_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Wizard.Domination.file,
    ability: {
      name: SPELLS.Wizard.Domination.name,
      targets: CHARM_TARGET_LISTS,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.MentalDomination.file,
    ability: {
      name: SPELLS.Priest.MentalDomination.name,
      targets: CHARM_TARGET_LISTS,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.DireCharm.file,
    ability: {
      name: SPELLS.Wizard.DireCharm.name,
      targets: CHARM_TARGET_LISTS,
      spell: {},
      triggers: [
        ...triggerFactory.haveSpellRES(
          [SPELLS.Wizard.Domination.file, SPELLS.Priest.MentalDomination.file],
          true,
        ),
      ],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.CharmPerson.file,
    ability: {
      name: SPELLS.Wizard.CharmPerson.name,
      targets: CHARM_TARGET_LISTS,
      spell: {},
      triggers: [
        ...triggerFactory.haveSpellRES(
          [
            SPELLS.Wizard.Domination.file,
            SPELLS.Priest.MentalDomination.file,
            SPELLS.Wizard.DireCharm.file,
          ],
          true,
        ),
      ],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.CharmPersonOrAnimal.file,
    ability: {
      name: SPELLS.Priest.CharmPersonOrAnimal.name,
      targets: CHARM_TARGET_LISTS,
      spell: {},
      triggers: [
        ...triggerFactory.haveSpellRES(
          [
            SPELLS.Wizard.Domination.file,
            SPELLS.Priest.MentalDomination.file,
            SPELLS.Wizard.DireCharm.file,
          ],
          true,
        ),
      ],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];
