import presetFactory from "../../src/factories/preset.factory";
import { AbilityPreset } from "../../src/model/misc";
import { TargetList } from "../../src/model/script/target";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";
import { ExcludeUnwantedTargetsTriggers } from "../target/common";

const CONFUSION_TARGET_LISTS: TargetList[] = [
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    triggers: ExcludeUnwantedTargetsTriggers,
    randomOrder: true,
  },
];

export const CONFUSION_PRESETS: AbilityPreset[] = presetFactory.createFromSpellList(
  [SPELLS.Priest.Chaos, FNP_SPELLS.Priest.Chaos, SPELLS.Wizard.Confusion],
  {
    targets: CONFUSION_TARGET_LISTS,
  },
);
