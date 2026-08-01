import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { Durations } from "../../src/model/game-data/durations";
import { AbilityPreset } from "../../src/model/misc";
import targetService from "../../src/services/baf/target.service";
import { DEFAULT_SPELL_PROBABILITY } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-names";
import { SPELLS } from "../spells/spell-names";

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
          triggerFactory.checkStatGT(0, "MINORGLOBE", true),
          triggerFactory.checkStat(2, "SCRIPTINGSTATE5", true), // Shield
          // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
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
          triggerFactory.checkStat(2, "SCRIPTINGSTATE5", true), // Shield
          // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
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
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
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
          triggers: [
            triggerFactory.areaType("OUTDOOR"),
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
            // triggerFactory.checkStatLT(50, "RESISTELECTRICITY"),
          ],
          randomOrder: true,
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: FNP_SPELLS.Priest.CauseDisease.file,
    ability: {
      name: FNP_SPELLS.Priest.CauseDisease.name,
      targets: [
        {
          name: "PCsFighters",
          triggers: [
            triggerFactory.checkStatGT(12, "STRENGTH_MODIFIER"),
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
          ],
          randomOrder: true,
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: FNP_SPELLS.Priest.CauseLightWounds.file,
    ability: {
      name: FNP_SPELLS.Priest.CauseLightWounds.name,
      spell: {
        selfTarget: true,
      },
      triggers: [
        ...triggerFactory.hasItem(["LIGHT", "SERIOUS", "CRITICAL", "HARM", "SLAYLIVE"], true),
        ...triggerFactory.haveSpellRES(
          [
            FNP_SPELLS.Priest.CauseSeriousWounds.file,
            FNP_SPELLS.Priest.CauseCriticalWounds.file,
            FNP_SPELLS.Priest.Harm.file,
            SPELLS.Priest.SlayLiving.file,
          ],
          true,
        ),
      ],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  ...presetFactory.create(
    [SPELLS.Priest.CauseSeriousWounds.file, FNP_SPELLS.Priest.CauseSeriousWounds.file],
    {
      name: SPELLS.Priest.CauseSeriousWounds.name,
      spell: {
        selfTarget: true,
      },
      triggers: [
        ...triggerFactory.hasItem(["LIGHT", "SERIOUS", "CRITICAL", "HARM", "SLAYLIVE"], true),
        ...triggerFactory.haveSpellRES(
          [
            FNP_SPELLS.Priest.CauseCriticalWounds.file,
            FNP_SPELLS.Priest.Harm.file,
            SPELLS.Priest.SlayLiving.file,
          ],
          true,
        ),
      ],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  ),
  {
    preset: FNP_SPELLS.Priest.CauseCriticalWounds.file,
    ability: {
      name: FNP_SPELLS.Priest.CauseCriticalWounds.name,
      spell: {
        selfTarget: true,
      },
      triggers: [
        ...triggerFactory.hasItem(["LIGHT", "SERIOUS", "CRITICAL", "HARM", "SLAYLIVE"], true),
        ...triggerFactory.haveSpellRES(
          [FNP_SPELLS.Priest.Harm.file, SPELLS.Priest.SlayLiving.file],
          true,
        ),
      ],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Harm.file,
    ability: {
      name: SPELLS.Priest.Harm.name,
      spell: {
        selfTarget: true,
      },
      triggers: [
        ...triggerFactory.hasItem(["LIGHT", "SERIOUS", "CRITICAL", "HARM", "SLAYLIVE"], true),
        ...triggerFactory.haveSpellRES([SPELLS.Priest.SlayLiving.file], true),
      ],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.SlayLiving.file,
    ability: {
      name: SPELLS.Priest.SlayLiving.name,
      spell: {
        selfTarget: true,
      },
      triggers: triggerFactory.hasItem(["LIGHT", "SERIOUS", "CRITICAL", "HARM", "SLAYLIVE"], true),
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: FNP_SPELLS.Priest.Shatter.file,
    ability: {
      name: FNP_SPELLS.Priest.Shatter.name,
      targets: [
        {
          name: "NearestEnemies",
          triggers: [
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
          ],
        },
      ],
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
        [
          // triggerFactory.checkStatLT(50, "RESISTMAGIC")
        ],
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
      targets: targetService.combineListWithTriggers(
        [
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
        [
          // triggerFactory.checkStatLT(50, "RESISTMAGIC")
        ],
      ),
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
          triggers: [
            triggerFactory.stateCheck("STATE_POISONED", true),
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
            // triggerFactory.checkStatLT(50, "RESISTPOISON"),
          ],
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
        [
          triggerFactory.checkStatGT(0, "MINORGLOBE", true),
          triggerFactory.checkSpellState("PROTECTION_FROM_NORMAL_MISSILES", true),
          // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
          // triggerFactory.checkStatLT(50, "RESISTACID"),
        ],
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
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            triggerFactory.checkSpellState("PROTECTION_FROM_NORMAL_MISSILES", true),
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
            // triggerFactory.checkStatLT(50, "RESISTFIRE"),
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
    preset: SPELLS.Priest.FlameStrike.file,
    ability: {
      name: SPELLS.Priest.FlameStrike.name,
      targets: [
        {
          name: "Players",
          randomOrder: true,
          triggers: [
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
            // triggerFactory.checkStatLT(50, "RESISTFIRE"),
          ],
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
          triggers: [
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
            // triggerFactory.checkStatLT(50, "RESISTFIRE"),
          ],
        },
      ],
      spell: {},
      range: 5,
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];
