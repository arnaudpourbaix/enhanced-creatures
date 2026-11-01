import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";
import { CommonTargetLists, SummonsTriggers } from "../target/common";

export const DEATH_PRESETS: AbilityPreset[] = [
  ...presetFactory.createSpells(
    [
      SPELLS.Wizard.WailOfTheBanshee,
      SPELLS.Priest.Destruction,
      SPELLS.Priest.FingerOfDeath,
      SPELLS.Wizard.FingerOfDeath,
      SPELLS.Wizard.FleshToStone,
      SPELLS.Wizard.Cloudkill,
      FNP_SPELLS.Priest.FingerOfDeath,
    ],
    {
      targets: CommonTargetLists.Enemies,
    },
  ),
  // Only worth it on a sure kill: above 60 HP, targets are immune or a save cancels it
  ...presetFactory.createSpells(
    [SPELLS.Wizard.PowerWordKill, SPELLS.Priest.SymbolDeath, SPELLS.Wizard.SymbolDeath],
    {
      targets: targetService.combineListWithTriggers(CommonTargetLists.Enemies, [
        triggerFactory.hplt(60),
      ]),
    },
  ),

  ...presetFactory.createSpells([SPELLS.Priest.Banishment, SPELLS.Wizard.DeathSpell], {
    targets: [
      {
        name: "NearestEnemies",
        triggers: SummonsTriggers,
      },
    ],
  }),
];
