import triggerFactory from "../../src/factories/trigger.factory";
import { ScriptTarget } from "../../src/model/constants";
import { AbilityPreset } from "../../src/model/misc";
import { TargetList } from "../../src/model/script/target";
import targetService from "../../src/services/baf/target.service";
import { DEFAULT_SPELL_PROBABILITY } from "../common";
import { SPELLS } from "../spells/spell-names";

const DeathTargets: TargetList[] = [
  {
    name: "Players",
    includeStatus: ["Able"],
    randomOrder: true,
    triggers: [
      // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
    ],
  },
  {
    name: "Players",
    randomOrder: true,
    triggers: [
      // triggerFactory.checkStatLT(50, "RESISTMAGIC"),
    ],
  },
];

export const DEATH_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Wizard.WailOfTheBanshee.file,
    ability: {
      name: SPELLS.Wizard.WailOfTheBanshee.name,
      targets: DeathTargets,
      spell: {
        selfTarget: true,
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.PowerWordKill.file,
    ability: {
      name: SPELLS.Wizard.PowerWordKill.name,
      targets: targetService.combineListWithTriggers(DeathTargets, [triggerFactory.hplt(61)]),
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.FingerOfDeath.file,
    ability: {
      name: SPELLS.Priest.FingerOfDeath.name,
      targets: DeathTargets,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.SymbolDeath.file,
    ability: {
      name: SPELLS.Priest.SymbolDeath.name,
      targets: DeathTargets,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.FleshToStone.file,
    ability: {
      name: SPELLS.Wizard.FleshToStone.name,
      targets: DeathTargets,
      spell: {
        excludeStateChecks: ["STATE_STONE_DEATH"],
      },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Destruction.file,
    ability: {
      name: SPELLS.Priest.Destruction.name,
      targets: DeathTargets,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.Banishment.file,
    ability: {
      name: SPELLS.Priest.Banishment.name,
      targets: [
        {
          name: "NearestEnemies",
          triggers: [{ name: "Gender", params: [ScriptTarget.lastSeen, "SUMMONED"] }],
        },
      ],
      spell: {
        selfTarget: true,
      },
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];
