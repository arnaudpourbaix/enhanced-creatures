import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { ScriptTarget } from "../../src/model/constants";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { SPELLS } from "../spells/spell-database";
import { CommonTargetLists } from "../target/common";

export const HEAL_PRESETS: AbilityPreset[] = [
  ...presetFactory.createSpells(
    [
      SPELLS.Priest.Heal,
      SPELLS.Priest.CureCriticalWounds,
      SPELLS.Priest.CureMediumWounds,
      SPELLS.Priest.CureModerateWounds,
      SPELLS.Priest.CureLightWounds,
      SPELLS.Priest.CureSeriousWounds,
      SPELLS.Priest.HealingMist,
    ],
    {
      targets: targetService.combineListWithTriggers(CommonTargetLists.Allies, [
        { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 75] },
      ]),
    },
  ),
  ...presetFactory.createSpells(
    [
      SPELLS.Priest.Regeneration,
      SPELLS.Priest.RegenerateCriticalWounds,
      SPELLS.Priest.RegenerateSeriousWounds,
      SPELLS.Priest.RegenerateModerateWounds,
      SPELLS.Priest.RegenerateLightWounds,
      SPELLS.Priest.RegenerationSPPR615,
    ],
    {
      targets: targetService.combineListWithTriggers(CommonTargetLists.Allies, [
        { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 80] },
        {
          name: "CheckStatGT",
          params: [ScriptTarget.lastSeen, 0, "CLERIC_REGENERATION"],
          negation: true,
        },
      ]),
    },
  ),
  ...presetFactory.createSpell(SPELLS.Innate.HealingLick, {
    targets: targetService.combineListWithTriggers(CommonTargetLists.Allies, [
      {
        name: "Or",
        triggers: [
          { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 75] },
          { name: "StateCheck", params: [ScriptTarget.lastSeen, "STATE_DISEASED"] },
        ],
      },
    ]),
    requireVocal: false,
  }),

  ...presetFactory.createSpell(SPELLS.Priest.GreaterRestoration, {
    targets: targetService.combineListWithTriggers(CommonTargetLists.Allies, [
      { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 50] },
    ]),
  }),
  ...presetFactory.createSpell(SPELLS.Priest.MassCure, {
    triggers: [triggerFactory.hpPercentLt(75)],
  }),
  ...presetFactory.createSpell(SPELLS.Priest.CureDisease, {
    targets: targetService.combineListWithTriggers(CommonTargetLists.Allies, [
      { name: "StateCheck", params: [ScriptTarget.lastSeen, "STATE_DISEASED"] },
    ]),
  }),
  ...presetFactory.createSpells([SPELLS.Priest.NeutralizePoison, SPELLS.Priest.SlowPoison], {
    targets: targetService.combineListWithTriggers(CommonTargetLists.Allies, [
      { name: "StateCheck", params: [ScriptTarget.lastSeen, "STATE_POISONED"] },
    ]),
  }),
  ...presetFactory.createSpell(SPELLS.Priest.RemoveParalysis, {
    targets: targetService.combineListWithTriggers(CommonTargetLists.Allies, [
      { name: "StateCheck", params: [ScriptTarget.lastSeen, "STATE_HELPLESS"] },
    ]),
  }),
  ...presetFactory.createSpells([SPELLS.Wizard.BreakEnchantment, SPELLS.Priest.BreakEnchantment], {
    targets: targetService.combineListWithTriggers(CommonTargetLists.Allies, [
      {
        name: "Or",
        triggers: [
          { name: "StateCheck", params: [ScriptTarget.lastSeen, "STATE_CONFUSED"] },
          { name: "StateCheck", params: [ScriptTarget.lastSeen, "STATE_FEEBLEMINDED"] },
        ],
      },
    ]),
  }),
];
