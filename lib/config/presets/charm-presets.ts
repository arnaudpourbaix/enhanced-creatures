import presetFactory from "../../src/factories/preset.factory";
import { AbilityPreset } from "../../src/model/misc";
import { TargetList } from "../../src/model/script/target";
import { SPELLS } from "../spells/spell-database";
import { ExcludeUnwantedTargetsTriggers } from "../target/common";

const CHARM_TARGET_LISTS: TargetList[] = [
  {
    name: "Fighters",
    includeStatus: ["Able"],
    keywords: ["elf", "halfElf"],
    triggers: ExcludeUnwantedTargetsTriggers,
    randomOrder: true,
  },
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    keywords: ["elf", "halfElf"],
    triggers: ExcludeUnwantedTargetsTriggers,
    randomOrder: true,
  },
  {
    name: "Fighters",
    includeStatus: ["Able"],
    keywords: ["elf"],
    triggers: ExcludeUnwantedTargetsTriggers,
    randomOrder: true,
  },
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    keywords: ["elf"],
    triggers: ExcludeUnwantedTargetsTriggers,
    randomOrder: true,
  },
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    keywords: ["elf"],
    triggers: ExcludeUnwantedTargetsTriggers,
    randomOrder: true,
  },
];

export const CHARM_PRESETS: AbilityPreset[] = presetFactory.createFromSpellList(
  [
    SPELLS.Wizard.Domination,
    SPELLS.Priest.MentalDomination,
    SPELLS.Wizard.DireCharm,
    SPELLS.Priest.CharmPersonOrAnimal,
    SPELLS.Wizard.CharmPerson,
  ],
  {
    targets: CHARM_TARGET_LISTS,
  },
);
