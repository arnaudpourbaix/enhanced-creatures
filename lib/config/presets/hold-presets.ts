import presetFactory from "../../src/factories/preset.factory";
import { AbilityPreset } from "../../src/model/misc";
import { TargetList } from "../../src/model/script/target";
import { SPELLS } from "../spells/spell-database";
import { ExcludeUnwantedTargetsTriggers } from "../target/common";

export const HOLD_TARGET_LISTS: TargetList[] = [
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

export const HOLD_PRESETS: AbilityPreset[] = [
  ...presetFactory.createFromSpellList(
    [
      SPELLS.Priest.WavesOfAgony,
      SPELLS.Wizard.Web,
      SPELLS.Wizard.HoldMonster,
      SPELLS.Priest.HoldPersonOrAnimal,
      SPELLS.Priest.HoldPerson,
      SPELLS.Wizard.HoldPerson,
    ],
    {
      targets: HOLD_TARGET_LISTS,
    },
  ),
];
