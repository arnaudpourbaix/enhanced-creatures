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
      SPELLS.Priest.SymbolDeath,
      SPELLS.Wizard.SymbolDeath,
      SPELLS.Wizard.Disintegrate,
      SPELLS.Wizard.FleshToStone,
      SPELLS.Wizard.GreatShout,
      SPELLS.Priest.Whirlwind,
      FNP_SPELLS.Priest.FingerOfDeath,
      FNP_SPELLS.Priest.SlayLiving,
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

  ...presetFactory.createSpell(SPELLS.Priest.Banishment, {
    targets: [
      {
        name: "NearestEnemies",
        triggers: SummonsTriggers,
      },
    ],
  }),

  ...presetFactory.createSpell(SPELLS.Wizard.DeathSpell, {
    targets: [{ name: "NearestEnemies", triggers: SummonsTriggers }, ...CommonTargetLists.Enemies],
  }),
];
