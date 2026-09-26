import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import { TargetList } from "../../src/model/script/target";
import targetService from "../../src/services/baf/target.service";
import { SPELLS } from "../spells/spell-database";
import { ExcludeUnwantedTargetsTriggers, SummonsTriggers } from "../target/common";

const DEATH_TARGET_LISTS: TargetList[] = [
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    triggers: ExcludeUnwantedTargetsTriggers,
    randomOrder: true,
  },
];

export const DEATH_PRESETS: AbilityPreset[] = [
  ...presetFactory.createOrderedSpells(
    [
      SPELLS.Wizard.WailOfTheBanshee,
      SPELLS.Priest.Destruction,
      SPELLS.Priest.FingerOfDeath,
      SPELLS.Priest.SymbolDeath,
      SPELLS.Wizard.SymbolDeath,
    ],
    {
      targets: DEATH_TARGET_LISTS,
    },
  ),
  ...presetFactory.createSpell(SPELLS.Wizard.PowerWordKill, {
    targets: targetService.combineListWithTriggers(DEATH_TARGET_LISTS, [triggerFactory.hplt(61)]),
  }),
  ...presetFactory.createSpell(SPELLS.Wizard.FleshToStone, {
    targets: DEATH_TARGET_LISTS,
  }),
  ...presetFactory.createSpell(SPELLS.Priest.Banishment, {
    targets: [
      {
        name: "NearestEnemies",
        triggers: SummonsTriggers,
      },
    ],
  }),
];
