import presetFactory from "../../src/factories/preset.factory";
import { ScriptTarget } from "../../src/model/constants";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { SPELLS } from "../spells/spell-database";
import { CommonTargetLists } from "../target/common";

export const HEAL_PRESETS: AbilityPreset[] = [
  ...presetFactory.createFromSpellList(
    [
      SPELLS.Priest.Heal,
      SPELLS.Priest.CureCriticalWounds,
      SPELLS.Priest.CureMediumWounds,
      SPELLS.Priest.CureModerateWounds,
      SPELLS.Priest.CureLightWounds,
    ],
    {
      targets: targetService.combineListWithTriggers(CommonTargetLists.Allies, [
        { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 75] },
      ]),
    },
  ),
  ...presetFactory.createFromSpellList(
    [
      SPELLS.Priest.Regeneration,
      SPELLS.Priest.RegenerateCriticalWounds,
      SPELLS.Priest.RegenerateSeriousWounds,
      SPELLS.Priest.RegenerateModerateWounds,
      SPELLS.Priest.RegenerateLightWounds,
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
];
