import { ScriptTarget } from "../../src/model/constants";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { ALLIES_TARGET_LISTS, DEFAULT_SPELL_PROBABILITY } from "../common";
import { SPELLS } from "../spells/spell-names";

export const HEAL_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Priest.CureLightWounds.file,
    ability: {
      name: SPELLS.Priest.CureLightWounds.name,
      targets: targetService.combineListWithTriggers(ALLIES_TARGET_LISTS, [
        { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 75] },
      ]),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Innate.HealingLick.file,
    ability: {
      name: SPELLS.Innate.HealingLick.name,
      targets: targetService.combineListWithTriggers(ALLIES_TARGET_LISTS, [
        {
          name: "Or",
          triggers: [
            { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 75] },
            { name: "StateCheck", params: [ScriptTarget.lastSeen, "STATE_DISEASED"] },
          ],
        },
      ]),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.RegenerateLightWounds.file,
    ability: {
      name: SPELLS.Priest.RegenerateLightWounds.name,
      targets: targetService.combineListWithTriggers(ALLIES_TARGET_LISTS, [
        { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 80] },
        {
          name: "CheckStatGT",
          params: [ScriptTarget.lastSeen, 0, "CLERIC_REGENERATION"],
          negation: true,
        },
      ]),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.RegenerateModerateWounds.file,
    ability: {
      name: SPELLS.Priest.RegenerateModerateWounds.name,
      targets: targetService.combineListWithTriggers(ALLIES_TARGET_LISTS, [
        { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 80] },
        {
          name: "CheckStatGT",
          params: [ScriptTarget.lastSeen, 0, "CLERIC_REGENERATION"],
          negation: true,
        },
      ]),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.RegenerateSeriousWounds.file,
    ability: {
      name: SPELLS.Priest.RegenerateSeriousWounds.name,
      targets: targetService.combineListWithTriggers(ALLIES_TARGET_LISTS, [
        { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 80] },
        {
          name: "CheckStatGT",
          params: [ScriptTarget.lastSeen, 0, "CLERIC_REGENERATION"],
          negation: true,
        },
      ]),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.RegenerateCriticalWounds.file,
    ability: {
      name: SPELLS.Priest.RegenerateCriticalWounds.name,
      targets: targetService.combineListWithTriggers(ALLIES_TARGET_LISTS, [
        { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 80] },
        {
          name: "CheckStatGT",
          params: [ScriptTarget.lastSeen, 0, "CLERIC_REGENERATION"],
          negation: true,
        },
      ]),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Regeneration.file,
    ability: {
      name: SPELLS.Priest.Regeneration.name,
      targets: targetService.combineListWithTriggers(ALLIES_TARGET_LISTS, [
        { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 80] },
        {
          name: "CheckStatGT",
          params: [ScriptTarget.lastSeen, 0, "CLERIC_REGENERATION"],
          negation: true,
        },
      ]),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];
