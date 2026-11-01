import presetFactory from "../../src/factories/preset.factory";
import { ScriptTarget } from "../../src/model/constants";
import { Durations } from "../../src/model/game-data/durations";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { SPELLS } from "../spells/spell-database";
import { CommonTargetLists } from "../target/common";

// Only one of them sets a stat to check, and they block each other: a shared wait limits the waste
const REGENERATE_TIMER = { name: "Regenerate", value: 5 * Durations.round };

export const HEAL_PRESETS: AbilityPreset[] = [
  ...presetFactory.createSpells(
    [
      SPELLS.Priest.CureCriticalWounds,
      SPELLS.Priest.CureMediumWounds,
      SPELLS.Priest.CureModerateWounds,
      SPELLS.Priest.CureSeriousWounds,
      SPELLS.Priest.CureLightWounds,
      SPELLS.Priest.HealingMist,
    ],
    {
      targets: targetService.combineListWithTriggers(CommonTargetLists.MyselfOrAllies, [
        { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 75] },
      ]),
    },
  ),
  // It restores all hit points: not worth it on light wounds
  ...presetFactory.createSpell(SPELLS.Priest.Heal, {
    targets: targetService.combineListWithTriggers(CommonTargetLists.MyselfOrAllies, [
      { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 50] },
    ]),
  }),
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
      timer: REGENERATE_TIMER,
      targets: targetService.combineListWithTriggers(CommonTargetLists.MyselfOrAllies, [
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
    targets: targetService.combineListWithTriggers(CommonTargetLists.MyselfOrAllies, [
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
    targets: targetService.combineListWithTriggers(CommonTargetLists.MyselfOrAllies, [
      { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 30] },
    ]),
  }),
  ...presetFactory.createSpell(SPELLS.Priest.MassCure, {
    targets: targetService.combineListWithTriggers(CommonTargetLists.MyselfOrAllies, [
      { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 75] },
    ]),
  }),
  ...presetFactory.createSpell(SPELLS.Priest.MassRegenerate, {
    timer: REGENERATE_TIMER,
    targets: targetService.combineListWithTriggers(CommonTargetLists.MyselfOrAllies, [
      { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 80] },
    ]),
  }),
  ...presetFactory.createSpell(SPELLS.Priest.CureDisease, {
    targets: targetService.combineListWithTriggers(CommonTargetLists.MyselfOrAllies, [
      {
        name: "Or",
        triggers: [
          { name: "StateCheck", params: [ScriptTarget.lastSeen, "STATE_DISEASED"] },
          { name: "StateCheck", params: [ScriptTarget.lastSeen, "STATE_BLIND"] },
        ],
      },
    ]),
  }),
  ...presetFactory.createSpells([SPELLS.Priest.NeutralizePoison, SPELLS.Priest.SlowPoison], {
    targets: targetService.combineListWithTriggers(CommonTargetLists.MyselfOrAllies, [
      { name: "StateCheck", params: [ScriptTarget.lastSeen, "STATE_POISONED"] },
    ]),
  }),
  ...presetFactory.createSpell(SPELLS.Priest.RemoveParalysis, {
    targets: targetService.combineListWithTriggers(CommonTargetLists.Allies, [
      {
        name: "Or",
        triggers: [
          { name: "CheckStatGT", params: [ScriptTarget.lastSeen, 0, "HELD"] },
          { name: "StateCheck", params: [ScriptTarget.lastSeen, "STATE_STUNNED"] },
        ],
      },
    ]),
  }),
  ...presetFactory.createSpells([SPELLS.Wizard.BreakEnchantment, SPELLS.Priest.BreakEnchantment], {
    targets: targetService.combineListWithTriggers(CommonTargetLists.Allies, [
      {
        name: "Or",
        triggers: [
          { name: "StateCheck", params: [ScriptTarget.lastSeen, "STATE_CONFUSED"] },
          { name: "StateCheck", params: [ScriptTarget.lastSeen, "STATE_FEEBLEMINDED"] },
          { name: "StateCheck", params: [ScriptTarget.lastSeen, "STATE_SLEEPING"] },
        ],
      },
    ]),
  }),
];
