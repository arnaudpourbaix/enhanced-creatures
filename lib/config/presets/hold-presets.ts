import presetFactory from "../../src/factories/preset.factory";
import { ScriptTarget } from "../../src/model/constants";
import { AbilityPreset } from "../../src/model/misc";
import { TargetList } from "../../src/model/script/target";
import targetService from "../../src/services/baf/target.service";
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
  ...presetFactory.createSpells(
    [
      SPELLS.Wizard.Web,
      SPELLS.Wizard.HoldMonster,
      SPELLS.Priest.HoldPerson,
      SPELLS.Wizard.HoldPerson,
    ],
    {
      targets: HOLD_TARGET_LISTS,
    },
  ),

  ...presetFactory.createSpell(SPELLS.Priest.HoldPersonOrAnimal, {
    targets: targetService.combineListWithTriggers(HOLD_TARGET_LISTS, [
      {
        name: "Or",
        triggers: [
          { name: "General", params: [ScriptTarget.lastSeen, "HUMANOID"] },
          { name: "General", params: [ScriptTarget.lastSeen, "ANIMAL"] },
        ],
      },
    ]),
  }),
  ...presetFactory.createSpell(SPELLS.Wizard.HaltUndead, {
    targets: [
      {
        name: "NearestEnemies",
        includeStatus: ["Able"],
        triggers: [{ name: "General", params: [ScriptTarget.token, "UNDEAD"] }],
      },
    ],
  }),
];
