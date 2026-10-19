import presetFactory from "../../src/factories/preset.factory";
import { AbilityPreset } from "../../src/model/misc";
import { ScriptTarget } from "../../src/model/constants";
import { TargetList } from "../../src/model/script/target";
import { SPELLS } from "../spells/spell-database";
import { ExcludeUnwantedTargetsTriggers } from "../target/common";

export const CHARM_TARGET_LISTS: TargetList[] = [
  {
    name: "Fighters",
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
    keywords: ["elf", "halfElf"],
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

/**
 * Control Undead takes any undead not charmed yet, so it neither shares the charms' lists nor waits
 * for them. Summoned ones are the best catch (animated dead, a skeleton warrior, a death knight...)
 * and undead illusions hardly exist: neither is left out.
 */
const CONTROL_UNDEAD_TARGET_LISTS: TargetList[] = [
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    triggers: [
      { name: "StateCheck", params: [ScriptTarget.token, "STATE_CHARMED"], negation: true },
      { name: "General", params: [ScriptTarget.token, "UNDEAD"] },
    ],
  },
];

export const CHARM_PRESETS: AbilityPreset[] = [
  ...presetFactory.createSpell(SPELLS.Wizard.ControlUndead, {
    targets: CONTROL_UNDEAD_TARGET_LISTS,
  }),
  ...presetFactory.createOrderedSpells(
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
  ),
];
