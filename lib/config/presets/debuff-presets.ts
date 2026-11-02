import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import { TargetList } from "../../src/model/script/target";
import targetService from "../../src/services/baf/target.service";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";
import { NEW_SPELLS } from "../spells/spells";
import { CommonTargetLists, ExcludeUnwantedTargetsTriggers } from "../target/common";

const DEBUFF_TARGET_LISTS: TargetList[] = [
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    triggers: ExcludeUnwantedTargetsTriggers,
    randomOrder: true,
  },
];

export const DEBUFF_PRESETS: AbilityPreset[] = [
  ...presetFactory.createSpells(
    [
      SPELLS.Wizard.GreaterMalison,
      FNP_SPELLS.Priest.GreaterMalison,
      SPELLS.Priest.EnergyDrain,
      SPELLS.Priest.SymbolWeakness,
      FNP_SPELLS.Priest.WavesOfFatigue,
      SPELLS.Wizard.WavesOfFatigue,
      SPELLS.Priest.Contagion,
      SPELLS.Wizard.Contagion,
      SPELLS.Wizard.Glitterdust,
      SPELLS.Priest.Curse,
      SPELLS.Priest.Doom,
      FNP_SPELLS.Priest.Doom,
      SPELLS.Wizard.LowerResistance,
      SPELLS.Wizard.Suffocate,
      SPELLS.Priest.EtherealRetribution,
      SPELLS.Priest.FaerieFire,
      SPELLS.Wizard.SymbolOfWeakness,
      SPELLS.Priest.CloudOfPestilence,
      FNP_SPELLS.Priest.CloudOfPestilence,
    ],
    {
      targets: DEBUFF_TARGET_LISTS,
    },
  ),

  ...presetFactory.createSpell(
    SPELLS.Priest.SymbolPain,
    {
      targets: CommonTargetLists.Fighters,
    },
    [NEW_SPELLS.WizardSymbolOfPain],
  ),
  ...presetFactory.createSpell(SPELLS.Wizard.RayOfEnfeeblement, {
    targets: CommonTargetLists.PreferringStrong,
  }),
  ...presetFactory.createSpells([SPELLS.Priest.CauseDisease, FNP_SPELLS.Priest.CauseDisease], {
    targets: targetService.combineListWithTriggers(CommonTargetLists.Fighters, [
      triggerFactory.checkStatGT(12, "STRENGTH_MODIFIER"),
    ]),
  }),
];
