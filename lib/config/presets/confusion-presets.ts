import presetFactory from "../../src/factories/preset.factory";
import { ScriptTarget } from "../../src/model/constants";
import { AbilityPreset } from "../../src/model/misc";
import { TargetList } from "../../src/model/script/target";
import targetService from "../../src/services/baf/target.service";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";
import { CommonTargetLists, ExcludeUnwantedTargetsTriggers } from "../target/common";

const CONFUSION_TARGET_LISTS: TargetList[] = [
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    triggers: ExcludeUnwantedTargetsTriggers,
    randomOrder: true,
  },
];

export const CONFUSION_PRESETS: AbilityPreset[] = [
  // Feeblemind, confusion, panic, sleep or hold at random: only useless against all of them
  ...presetFactory.createSpells(
    [SPELLS.Wizard.Chaos, SPELLS.Priest.Chaos, FNP_SPELLS.Priest.Chaos],
    {
      targets: targetService.combineListWithTriggers(CommonTargetLists.AbleEnemies, [
        {
          name: "CheckSpellState",
          params: [ScriptTarget.lastSeen, "CHAOTIC_COMMANDS"],
          negation: true,
        },
        {
          name: "Or",
          triggers: ["CONFUSION_IMMUNITY", "PANIC_IMMUNITY", "SLEEP_IMMUNITY", "HOLD_IMMUNITY"].map(
            (state) => ({
              name: "CheckSpellState",
              params: [ScriptTarget.lastSeen, state],
              negation: true,
            }),
          ),
        },
      ]),
    },
  ),
  ...presetFactory.createSpells(
    [SPELLS.Wizard.Confusion, SPELLS.Priest.RigidThinking, FNP_SPELLS.Priest.RigidThinking],
    {
      targets: CONFUSION_TARGET_LISTS,
    },
  ),
];
