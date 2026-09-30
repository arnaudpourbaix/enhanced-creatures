import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { Durations } from "../../src/model/game-data/durations";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";
import { CommonTargetLists } from "../target/common";

export const DISABLING_PRESETS: AbilityPreset[] = [
  ...presetFactory.createSpells(
    [
      SPELLS.Priest.RigidThinking,
      FNP_SPELLS.Priest.RigidThinking,
      SPELLS.Wizard.PowerWordStun,
      SPELLS.Priest.SymbolStunning,
      SPELLS.Wizard.StinkingCloud,
      SPELLS.Wizard.Emotion,
      FNP_SPELLS.Priest.Emotion,
      SPELLS.Priest.SymbolHopelessness,
      SPELLS.Wizard.TeleportField,
      SPELLS.Wizard.Feeblemind,
    ],
    {
      targets: CommonTargetLists.AbleEnemies,
    },
  ),
  ...presetFactory.createOrderedSpells(
    [
      SPELLS.Priest.CreepingDoom,
      SPELLS.Priest.InsectPlague,
      SPELLS.Priest.SummonInsects,
      SPELLS.Priest.MiscastMagic,
      FNP_SPELLS.Priest.MiscastMagic,
    ],
    {
      targets: targetService.combineListWithTriggers(CommonTargetLists.Spellcasters, [
        triggerFactory.checkStatGT(50, "SPELLFAILUREPRIEST", true),
        triggerFactory.checkStatGT(50, "SPELLFAILUREMAGE", true),
      ]),
    },
  ),
  ...presetFactory.createSpell(SPELLS.Wizard.Darkness15Radius, {
    targets: [
      {
        name: "NearestEnemies",
        includeStatus: ["Able"],
        limit: 6,
        randomOrder: true,
      },
    ],
  }),
  ...presetFactory.createSpell(SPELLS.Wizard.ObscuringMist, {
    targets: CommonTargetLists.Fighters,
  }),
  ...presetFactory.createSpell(SPELLS.Priest.Silence, {
    targets: targetService.combineListWithTriggers(CommonTargetLists.Spellcasters, [
      triggerFactory.range(15, true),
    ]),
  }),
  ...presetFactory.createSpell(SPELLS.Priest.Entangle, {
    targets: targetService.combineListWithTriggers(CommonTargetLists.AbleEnemies, [
      triggerFactory.checkStatGT(0, "ENTANGLE", true),
    ]),
  }),
  ...presetFactory.createSpells(
    [SPELLS.Wizard.PowerWordBlind, SPELLS.Priest.BlindingBeauty, SPELLS.Priest.HolyWord],
    {
      targets: CommonTargetLists.AbleEnemies,
    },
  ),
  ...presetFactory.createSpells([SPELLS.Priest.UnholyWord, SPELLS.Wizard.Slow], {
    targets: CommonTargetLists.AbleEnemies,
  }),
  ...presetFactory.createSpell(SPELLS.Wizard.ColorSpray, {
    targets: targetService.combineListWithTriggers(CommonTargetLists.AbleEnemies, []),
    range: 5,
  }),
  ...presetFactory.createSpell(FNP_SPELLS.Priest.Forbiddance, {
    targets: CommonTargetLists.AbleEnemies,
    timer: { name: "Forbiddance", value: 2 * Durations.round },
  }),
];
