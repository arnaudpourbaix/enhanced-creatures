import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { SPELLS } from "../spells/spell-database";
import { CommonTargetLists, SummonsTriggers } from "../target/common";

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
      targets: CommonTargetLists.Enemies,
    },
  ),
  ...presetFactory.createSpell(SPELLS.Wizard.PowerWordKill, {
    targets: targetService.combineListWithTriggers(CommonTargetLists.Enemies, [
      triggerFactory.hplt(61),
    ]),
  }),
  ...presetFactory.createSpell(SPELLS.Wizard.FleshToStone, {
    targets: CommonTargetLists.Enemies,
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
