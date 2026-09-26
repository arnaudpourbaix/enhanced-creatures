import presetFactory from "../../src/factories/preset.factory";
import { AbilityPreset } from "../../src/model/misc";
import { TargetList } from "../../src/model/script/target";
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
  ...presetFactory.createOrderedSpells(
    [
      SPELLS.Priest.EnergyDrain,
      SPELLS.Priest.SymbolWeakness,
      FNP_SPELLS.Priest.WavesOfFatigue,
      SPELLS.Priest.Contagion,
      SPELLS.Wizard.Glitterdust,
      SPELLS.Priest.Curse,
      SPELLS.Priest.Doom,
      FNP_SPELLS.Priest.Doom,
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
];
