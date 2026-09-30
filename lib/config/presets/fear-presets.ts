import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import { TargetList } from "../../src/model/script/target";
import targetService from "../../src/services/baf/target.service";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";
import { ExcludeUnwantedTargetsTriggers } from "../target/common";

const FEAR_TARGET_LISTS: TargetList[] = [
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    triggers: ExcludeUnwantedTargetsTriggers,
    randomOrder: true,
  },
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    randomOrder: true,
  },
];

export const FEAR_PRESETS: AbilityPreset[] = [
  ...presetFactory.createOrderedSpells(
    [SPELLS.Wizard.SymbolFear, SPELLS.Wizard.Horror, SPELLS.Wizard.Spook],
    {
      targets: FEAR_TARGET_LISTS,
    },
  ),
  ...presetFactory.createSpells([SPELLS.Priest.CloakOfFear, FNP_SPELLS.Priest.CloakOfFear], {
    targets: FEAR_TARGET_LISTS,
    range: 10,
  }),
  ...presetFactory.createSpell(SPELLS.Innate.MoonDogHowl, {
    targets: targetService.combineListWithTriggers(FEAR_TARGET_LISTS, [
      triggerFactory.alignment("MASK_EVIL"),
    ]),
  }),
];
