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
  ...presetFactory.createSpells([SPELLS.Wizard.GreaterMalison, FNP_SPELLS.Priest.GreaterMalison], {
    targets: DEBUFF_TARGET_LISTS,
  }),
  ...presetFactory.createFromSpellList(
    [
      SPELLS.Priest.EnergyDrain,
      SPELLS.Priest.SymbolWeakness,
      FNP_SPELLS.Priest.WavesOfFatigue,
      SPELLS.Priest.Contagion,
      SPELLS.Wizard.Glitterdust,
      SPELLS.Priest.Curse,
    ],
    {
      targets: DEBUFF_TARGET_LISTS,
    },
  ),
  ...presetFactory.createSpells([SPELLS.Priest.Doom, FNP_SPELLS.Priest.Doom], {
    targets: targetService.combineListWithTriggers(DEBUFF_TARGET_LISTS, [
      triggerFactory.checkSpellState("DOOM", true),
    ]),
  }),
  ...presetFactory.createSpell(
    SPELLS.Priest.SymbolPain,
    {
      targets: CommonTargetLists.Fighters,
    },
    [NEW_SPELLS.WizardSymbolOfPain],
  ),
];
