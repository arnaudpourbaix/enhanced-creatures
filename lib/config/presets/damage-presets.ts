import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { Durations } from "../../src/model/game-data/durations";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { DEFAULT_SPELL_PROBABILITY } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";

export const DAMAGE_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Wizard.MagicMissiles.file,
    ability: {
      name: SPELLS.Wizard.MagicMissiles.name,
      targets: targetService.combineListWithTriggers(
        [
          {
            name: "PCSpellcasters",
            randomOrder: true,
            triggers: [triggerFactory.stateCheck("STATE_MIRRORIMAGE")],
          },
          {
            name: "PCSpellcasters",
            randomOrder: true,
          },
          {
            name: "Players",
            randomOrder: true,
          },
        ],
        [
          // triggerFactory.hasBounceEffects(true),
        ],
      ),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.MordenkainenForceMissiles.file,
    ability: {
      name: SPELLS.Wizard.MordenkainenForceMissiles.name,
      targets: targetService.combineListWithTriggers(
        [
          {
            name: "PCSpellcasters",
            randomOrder: true,
            triggers: [triggerFactory.stateCheck("STATE_MIRRORIMAGE")],
          },
          {
            name: "PCSpellcasters",
            randomOrder: true,
          },
          {
            name: "Players",
            randomOrder: true,
          },
        ],
        [
          // triggerFactory.hasBounceEffects(true),
        ],
      ),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.ChromaticOrb.file,
    ability: {
      name: SPELLS.Wizard.ChromaticOrb.name,
      targets: [
        {
          name: "PCs",
          randomOrder: true,
          triggers: [
            // triggerFactory.hasBounceEffects(true),
          ],
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.CallLightning.file,
    ability: {
      name: SPELLS.Priest.CallLightning.name,
      targets: [
        {
          name: "NearestEnemies",
          triggers: [triggerFactory.areaType("OUTDOOR")],
          randomOrder: true,
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  ...presetFactory.create([SPELLS.Priest.CauseDisease.file, FNP_SPELLS.Priest.CauseDisease.file], {
    name: SPELLS.Priest.CauseDisease.name,
    targets: [
      {
        name: "PCsFighters",
        triggers: [triggerFactory.checkStatGT(12, "STRENGTH_MODIFIER")],
        randomOrder: true,
      },
    ],
    spell: {},
    requireVocal: true,
    probability: DEFAULT_SPELL_PROBABILITY,
  }),
  {
    preset: FNP_SPELLS.Priest.Shatter.file,
    ability: {
      name: FNP_SPELLS.Priest.Shatter.name,
      // Explicit level (not auto-resolved): FNP_SPELLS' BaseSpell type isn't a SpellCollection
      // entry, so levelForFile(SPELLS, ...) can't find it - same gap already noted for keywords.
      level: FNP_SPELLS.Priest.Shatter.level,
      targets: [{ name: "NearestEnemies" }],
      spell: {},
      timer: { name: "Shatter", value: 4 * Durations.round },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Wither.file,
    ability: {
      name: SPELLS.Priest.Wither.name,
      targets: targetService.combineListWithTriggers(
        [
          {
            name: "Players",
            includeStatus: ["Able"],
            randomOrder: true,
          },
          {
            name: "Players",
            randomOrder: true,
          },
        ],
        [],
      ),
      range: 10,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.DolorousDecay.file,
    ability: {
      name: SPELLS.Priest.DolorousDecay.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
          triggers: [triggerFactory.stateCheck("STATE_POISONED", true)],
        },
        {
          name: "Players",
          randomOrder: true,
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Poison.file,
    ability: {
      name: SPELLS.Priest.Poison.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
          triggers: [triggerFactory.stateCheck("STATE_POISONED", true)],
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.MelfAcidArrow.file,
    ability: {
      name: SPELLS.Wizard.MelfAcidArrow.name,
      targets: targetService.combineListWithTriggers(
        [
          {
            name: "PCSpellcasters",
            randomOrder: true,
          },
          {
            name: "Players",
            randomOrder: true,
          },
        ],
        [],
      ),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.FlameArrow.file,
    ability: {
      name: SPELLS.Wizard.FlameArrow.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
          triggers: [
            // triggerFactory.hasBounceEffects(true),
          ],
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.ShroudOfFlame.file,
    ability: {
      name: SPELLS.Wizard.ShroudOfFlame.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.FlameStrike.file,
    ability: {
      name: SPELLS.Priest.FlameStrike.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.Combust.file,
    ability: {
      name: SPELLS.Wizard.Combust.name,
      targets: [
        {
          name: "NearestEnemies",
          randomOrder: true,
        },
      ],
      spell: {},
      range: 5,
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.BigbyIcyGrasp.file,
    ability: {
      name: SPELLS.Wizard.BigbyIcyGrasp.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
        },
      ],
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.BoltOfGlory.file,
    ability: {
      name: SPELLS.Priest.BoltOfGlory.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.VampiricTouch.file,
    ability: {
      name: SPELLS.Wizard.VampiricTouch.name,
      targets: [
        {
          name: "NearestEnemies",
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];
