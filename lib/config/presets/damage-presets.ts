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
      SPELLS.Wizard.BigbyIcyGrasp,
      SPELLS.Priest.DolorousDecay,
      SPELLS.Priest.BoltOfGlory,
      SPELLS.Wizard.ShroudOfFlame,
      SPELLS.Priest.FlameStrike,
      SPELLS.Priest.Poison,
      SPELLS.Wizard.FlameArrow,
      SPELLS.Wizard.VampiricTouch,
      SPELLS.Wizard.Combust,
      SPELLS.Wizard.BatteringRam,
      SPELLS.Wizard.ChromaticOrb,
      SPELLS.Wizard.LarlochMinorDrain,
      SPELLS.Wizard.BigbysCrushingHand,
      SPELLS.Wizard.IceKnife,
      SPELLS.Wizard.IceLance,
      SPELLS.Wizard.LarlochEnergyDrain,
      SPELLS.Wizard.MinorLightningBolt,
      SPELLS.Wizard.OtilukesFreezingSphere,
      SPELLS.Wizard.VeridonsIcyRay,
      SPELLS.Priest.AlicornLance,
      SPELLS.Priest.Icelance,
      SPELLS.Priest.Implosion,
      SPELLS.Priest.Sunscorch,
      FNP_SPELLS.Priest.Poison,
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
        ...targetService.combineListWithTriggers(CommonTargetLists.Spellcasters, [
          triggerFactory.stateCheck("STATE_MIRRORIMAGE"),
        ]),
        ...CommonTargetLists.Enemies,
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

  ...presetFactory.createSpell(SPELLS.Priest.StaticCharge, {
    spell: { castOnSelf: true },
    triggers: [triggerFactory.see("NearestEnemyOf")],
  }),
];
