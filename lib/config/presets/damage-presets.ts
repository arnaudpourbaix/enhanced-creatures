import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { Durations } from "../../src/model/game-data/durations";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";
import { CommonTargetLists } from "../target/common";

export const DAMAGE_PRESETS: AbilityPreset[] = [
  ...presetFactory.createSpells(
    [
      SPELLS.Priest.DolorousDecay,
      SPELLS.Priest.Poison,
      SPELLS.Wizard.BigbyIcyGrasp,
      SPELLS.Priest.BoltOfGlory,
      SPELLS.Priest.FlameStrike,
      SPELLS.Wizard.FlameArrow,
      SPELLS.Wizard.VampiricTouch,
      SPELLS.Wizard.ShroudOfFlame,
      SPELLS.Wizard.Combust,
      SPELLS.Wizard.ChromaticOrb,
    ],
    {
      targets: CommonTargetLists.Enemies,
    },
  ),
  ...presetFactory.createSpell(SPELLS.Wizard.MelfAcidArrow, {
    targets: [...CommonTargetLists.Spellcasters, ...CommonTargetLists.Enemies],
  }),
  ...presetFactory.createSpells(
    [SPELLS.Wizard.MordenkainenForceMissiles, SPELLS.Wizard.MagicMissiles],
    {
      targets: [
        {
          name: "Spellcasters",
          randomOrder: true,
          triggers: [triggerFactory.stateCheck("STATE_MIRRORIMAGE")],
        },
        {
          name: "Spellcasters",
          randomOrder: true,
        },
      ],
    },
  ),
  ...presetFactory.createSpell(SPELLS.Priest.CallLightning, {
    targets: targetService.combineListWithTriggers(CommonTargetLists.Enemies, [
      triggerFactory.areaType("OUTDOOR"),
    ]),
  }),
  ...presetFactory.createSpells([SPELLS.Priest.CauseDisease, FNP_SPELLS.Priest.CauseDisease], {
    targets: targetService.combineListWithTriggers(CommonTargetLists.Fighters, [
      triggerFactory.checkStatGT(12, "STRENGTH_MODIFIER"),
    ]),
  }),
  ...presetFactory.createSpell(FNP_SPELLS.Priest.Shatter, {
    targets: CommonTargetLists.Enemies,
    timer: { name: "Shatter", value: 4 * Durations.round },
  }),
];
