import presetFactory from "../../src/factories/preset.factory";
import { ScriptTarget } from "../../src/model/constants";
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
  ...presetFactory.createSpells(
    [
      SPELLS.Priest.WavesOfAgony,
      SPELLS.Wizard.Web,
      SPELLS.Wizard.HoldMonster,
      SPELLS.Priest.HoldPersonOrAnimal,
      SPELLS.Priest.HoldPerson,
      SPELLS.Wizard.HoldPerson,
      SPELLS.Wizard.OtilukesResilientSphere,
      SPELLS.Wizard.OtilukesResilientSphereSPWI853,
    ],
    {
      targets: HOLD_TARGET_LISTS,
    },
  ),

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
