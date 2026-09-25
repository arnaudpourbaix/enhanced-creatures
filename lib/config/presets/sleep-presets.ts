import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import { TargetList } from "../../src/model/script/target";
import targetService from "../../src/services/baf/target.service";
import { SPELLS } from "../spells/spell-database";
import { ExcludeUnwantedTargetsTriggers } from "../target/common";

const SLEEP_TARGET_LISTS: TargetList[] = [
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    keywords: ["elf", "halfElf"],
    triggers: ExcludeUnwantedTargetsTriggers,
    randomOrder: true,
  },
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    keywords: ["elf"],
    triggers: ExcludeUnwantedTargetsTriggers,
    randomOrder: true,
  },
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    keywords: ["elf"],
    randomOrder: true,
  },
];

export const SLEEP_PRESETS: AbilityPreset[] = [
  ...presetFactory.createSpell(SPELLS.Wizard.PowerWordSleep, {
    targets: targetService.combineListWithTriggers(SLEEP_TARGET_LISTS, [triggerFactory.hplt(20)]),
  }),
  ...presetFactory.createFromSpellList(
    [SPELLS.Priest.GreaterCommand, SPELLS.Wizard.Sleep, SPELLS.Priest.Command],
    {
      targets: SLEEP_TARGET_LISTS,
    },
  ),
];
