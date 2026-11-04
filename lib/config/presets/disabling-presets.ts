import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { ScriptTarget } from "../../src/model/constants";
import { Durations } from "../../src/model/game-data/durations";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";
import { CommonTargetLists } from "../target/common";

const UNHINDERED_SPELLCASTERS = targetService.combineListWithTriggers(
  CommonTargetLists.Spellcasters,
  [
    triggerFactory.checkStatGT(50, "SPELLFAILUREPRIEST", true),
    triggerFactory.checkStatGT(50, "SPELLFAILUREMAGE", true),
  ],
);

export const DISABLING_PRESETS: AbilityPreset[] = [
  ...presetFactory.createSpells(
    [SPELLS.Wizard.Maze, SPELLS.Wizard.Imprisonment, SPELLS.Priest.EtherGate],
    {
      // removing the only enemy just delays the fight: another one must be left to deal with
      triggers: [triggerFactory.detect("SecondNearestEnemyOf")],
      targets: CommonTargetLists.AbleEnemies,
    },
  ),
  ...presetFactory.createSpells(
    [
      SPELLS.Wizard.PowerWordStun,
      SPELLS.Priest.SymbolStunning,
      SPELLS.Wizard.StinkingCloud,
      SPELLS.Wizard.EmotionHopelessness,
      FNP_SPELLS.Priest.Emotion,
      SPELLS.Priest.SymbolHopelessness,
      SPELLS.Wizard.TeleportField,
      SPELLS.Wizard.Feeblemind,
      SPELLS.Wizard.PowerWordBlind,
      SPELLS.Priest.HolyWord,
      SPELLS.Priest.UnholyWord,
      SPELLS.Wizard.Slow,
      SPELLS.Wizard.BeltynsBurningBlood,
      SPELLS.Wizard.Grease,
      SPELLS.Wizard.SymbolOfStunning,
      SPELLS.Wizard.Telekinesis,
      SPELLS.Wizard.GreatShout,
      SPELLS.Wizard.PrismaticSpray,
      SPELLS.Wizard.OtilukesResilientSphere,
    ],
    {
      targets: CommonTargetLists.AbleEnemies,
    },
  ),
  ...presetFactory.createSpells(
    [
      SPELLS.Priest.CreepingDoom,
      SPELLS.Priest.InsectPlague,
      SPELLS.Priest.SummonInsects,
      SPELLS.Wizard.Shout,
      SPELLS.Wizard.SoundBurst,
    ],
    {
      // Their damage and penalties still hurt anyone once the spellcasters are hindered
      targets: [...UNHINDERED_SPELLCASTERS, ...CommonTargetLists.AbleEnemies],
    },
  ),
  ...presetFactory.createSpells([SPELLS.Priest.MiscastMagic, FNP_SPELLS.Priest.MiscastMagic], {
    targets: UNHINDERED_SPELLCASTERS,
  }),
  ...presetFactory.createSpell(SPELLS.Wizard.Darkness15Radius, {
    targets: CommonTargetLists.AbleEnemies,
  }),
  ...presetFactory.createSpells([SPELLS.Wizard.ObscuringMist, SPELLS.Priest.ObscuringMist], {
    targets: CommonTargetLists.Fighters,
  }),
  ...presetFactory.createSpell(SPELLS.Priest.Silence, {
    targets: CommonTargetLists.Spellcasters,
  }),
  ...presetFactory.createSpell(SPELLS.Priest.Entangle, {
    targets: targetService.combineListWithTriggers(CommonTargetLists.AbleEnemies, [
      triggerFactory.checkStatGT(0, "ENTANGLE", true),
    ]),
  }),

  ...presetFactory.createSpell(SPELLS.Wizard.ColorSpray, {
    targets: CommonTargetLists.AbleEnemies,
  }),
  ...presetFactory.createSpell(FNP_SPELLS.Priest.Forbiddance, {
    targets: CommonTargetLists.AbleEnemies,
    timer: { name: "Forbiddance", value: 2 * Durations.round },
  }),

  ...presetFactory.createSpells(
    [SPELLS.Wizard.PolymorphOther, SPELLS.Wizard.PowerWordSilence, SPELLS.Priest.PolymorphOther],
    {
      targets: CommonTargetLists.Spellcasters,
    },
  ),
  ...presetFactory.createSpell(SPELLS.Priest.SpiritualLock, {
    targets: [...CommonTargetLists.Spellcasters, ...CommonTargetLists.AbleEnemies],
  }),

  // turns the undead entering its area, around the caster
  ...presetFactory.createSpell(SPELLS.Priest.UndeadWard, {
    targets: [
      {
        name: "NearestEnemies",
        includeStatus: ["Able"],
        triggers: [{ name: "General", params: [ScriptTarget.token, "UNDEAD"] }],
      },
    ],
    range: 10,
  }),
];
