import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import { TargetList } from "../../src/model/script/target";
import targetService from "../../src/services/baf/target.service";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
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
    // No save under 20 HP, then worth a try on anyone: a level 2 spell can't wait for that moment
    targets: [
      ...targetService.combineListWithTriggers(SLEEP_TARGET_LISTS, [triggerFactory.hplt(20)]),
      ...SLEEP_TARGET_LISTS,
    ],
  }),
  ...presetFactory.createSpells(
    [
      SPELLS.Priest.GreaterCommand,
      FNP_SPELLS.Priest.GreaterCommand,
      SPELLS.Wizard.Sleep,
      SPELLS.Priest.Command,
    ],
    {
      targets: SLEEP_TARGET_LISTS,
    },
  ),
];
