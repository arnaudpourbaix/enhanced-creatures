import { ScriptTarget } from "../src/model/constants";
import { GRAB_DEFAULT_CONFIG } from "../src/model/creature/grab";
import { TargetStatus } from "../src/model/script/target";
import { TargetListName, TargetStatusName } from "./target-name";

export const TARGET_LISTS: {
  name: TargetListName;
  value: string[];
  allegianceCheck: boolean;
}[] = [
  {
    name: "NearestEnemies",
    value: [
      "NearestEnemyOf",
      "SecondNearestEnemyOf",
      "ThirdNearestEnemyOf",
      "FourthNearestEnemyOf",
      "FifthNearestEnemyOf",
      "SixthNearestEnemyOf",
      "SeventhNearestEnemyOf",
      "EighthNearestEnemyOf",
      "NinthNearestEnemyOf",
      "TenthNearestEnemyOf",
    ],
    allegianceCheck: false,
  },
  {
    name: "NearestAllies",
    value: [
      "NearestAllyOf",
      "SecondNearestAllyOf",
      "ThirdNearestAllyOf",
      "FourthNearestAllyOf",
      "FifthNearestAllyOf",
      "SixthNearestAllyOf",
    ],
    allegianceCheck: false,
  },
  {
    name: "Players",
    value: ["Player1", "Player2", "Player3", "Player4", "Player5", "Player6"],
    allegianceCheck: false,
  },
  {
    name: "PCs",
    value: [
      `NearestEnemyOfType([PC])`,
      `SecondNearestEnemyOfType([PC])`,
      `ThirdNearestEnemyOfType([PC])`,
      `FourthNearestEnemyOfType([PC])`,
      `FifthNearestEnemyOfType([PC])`,
      `SixthNearestEnemyOfType([PC])`,
    ],
    allegianceCheck: false,
  },
  {
    name: "PCsFighters",
    value: [
      `NearestEnemyOfType([PC.0.0.FIGHTER_ALL])`,
      `SecondNearestEnemyOfType([PC.0.0.FIGHTER_ALL])`,
      `ThirdNearestEnemyOfType([PC.0.0.FIGHTER_ALL])`,
      `NearestEnemyOfType([PC.0.0.RANGER_ALL])`,
      `SecondNearestEnemyOfType([PC.0.0.RANGER_ALL])`,
      `ThirdNearestEnemyOfType([PC.0.0.RANGER_ALL])`,
      `NearestEnemyOfType([PC.0.0.PALADIN_ALL])`,
      `SecondNearestEnemyOfType([PC.0.0.PALADIN_ALL])`,
      `ThirdNearestEnemyOfType([PC.0.0.PALADIN_ALL])`,
    ],
    allegianceCheck: false,
  },
  {
    name: "PCsPreferringStrong",
    value: [
      `[PC.0.0.FIGHTER]`,
      `[PC.0.0.RANGER]`,
      `[PC.0.0.PALADIN]`,
      `[PC.0.0.FIGHTER_THIEF]`,
      `[PC.0.0.BARD]`,
      `[PC.0.0.THIEF]`,
      `NearestEnemyOfType([PC])`,
      `SecondNearestEnemyOfType([PC])`,
      `ThirdNearestEnemyOfType([PC])`,
    ],
    allegianceCheck: false,
  },
  {
    name: "PCsPreferringWeak",
    value: [
      `[PC.0.0.MAGE]`,
      `[PC.0.0.MAGE_THIEF]`,
      `[PC.0.0.MAGE_ALL]`,
      `[PC.0.0.THIEF]`,
      `[PC.0.0.BARD]`,
      `[PC.0.0.THIEF_ALL]`,
      `[PC.0.0.CLERIC]`,
      `NearestEnemyOfType([PC])`,
      `SecondNearestEnemyOfType([PC])`,
      `ThirdNearestEnemyOfType([PC])`,
    ],
    allegianceCheck: false,
  },
  {
    name: "PCSpellcasters",
    value: [`[PC.0.0.MAGE_ALL]`, `[PC.0.0.CLERIC_ALL]`, `[PC.0.0.DRUID_ALL]`, `[PC.0.0.BARD]`],
    allegianceCheck: false,
  },
  {
    name: "PCMages",
    value: [`[PC.0.0.MAGE_ALL]`, `[PC.0.0.BARD]`],
    allegianceCheck: false,
  },
  {
    name: "FarthestEnemies",
    value: [
      "FarthestEnemyOf(Myself)",
      "SecondFarthestEnemyOf(Myself)",
      "ThirdFarthestEnemyOf(Myself)",
      "FourthFarthestEnemyOf(Myself)",
    ],
    allegianceCheck: false,
  },
  {
    name: "Animals",
    value: [
      `NearestEnemyOfType([0.ANIMAL])`,
      `SecondNearestEnemyOfType([0.ANIMAL])`,
      `ThirdNearestEnemyOfType([0.ANIMAL])`,
      `[NEUTRAL.ANIMAL]`,
      `SecondNearest([NEUTRAL.ANIMAL])`,
      `ThirdNearest([NEUTRAL.ANIMAL])`,
    ],
    allegianceCheck: false,
  },
  {
    name: "EvilcutoffMaleHumanoids",
    value: [
      `[EVILCUTOFF.HUMANOID.0.0.0.MALE]`,
      `SecondNearest([EVILCUTOFF.HUMANOID.0.0.0.MALE])`,
      `ThirdNearest([EVILCUTOFF.HUMANOID.0.0.0.MALE])`,
      `FourthNearest([EVILCUTOFF.HUMANOID.0.0.0.MALE])`,
      `FifthNearest([EVILCUTOFF.HUMANOID.0.0.0.MALE])`,
      `SixthNearest([EVILCUTOFF.HUMANOID.0.0.0.MALE])`,
    ],
    allegianceCheck: false,
  },
];

export const DEFAULT_STATUS_ORDER: TargetStatusName[] = [
  "Grabbed",
  "Slowed",
  "Able",
  "Held",
  "Stunned",
  "NoCheck",
  "Sleep",
];

export const TARGET_STATUS: TargetStatus[] = [
  {
    status: "Grabbed",
    canOnlyTargetPlayer: false,
    requireIntelligence: false,
    triggers: [],
    targetTriggers: [
      {
        name: "CheckSpellState",
        params: [ScriptTarget.token, GRAB_DEFAULT_CONFIG.grabbedState],
      },
    ],
  },
  {
    status: "Slowed",
    canOnlyTargetPlayer: false,
    requireIntelligence: true,
    triggers: [],
    targetTriggers: [
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_SLOWED"],
      },
      {
        name: "CheckStatGT",
        params: [ScriptTarget.token, 0, "HELD"],
        negation: true,
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_STUNNED"],
        negation: true,
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_PANIC"],
        negation: true,
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_CONFUSED"],
        negation: true,
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_FEEBLEMINDED"],
        negation: true,
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_SLEEPING"],
        negation: true,
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_HELPLESS"],
        negation: true,
      },
    ],
  },
  {
    status: "Able",
    canOnlyTargetPlayer: false,
    requireIntelligence: true,
    triggers: [],
    targetTriggers: [
      {
        name: "CheckStatGT",
        params: [ScriptTarget.token, 0, "HELD"],
        negation: true,
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_STUNNED"],
        negation: true,
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_PANIC"],
        negation: true,
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_CONFUSED"],
        negation: true,
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_FEEBLEMINDED"],
        negation: true,
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_SLEEPING"],
        negation: true,
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_HELPLESS"],
        negation: true,
      },
    ],
  },
  {
    status: "Held",
    canOnlyTargetPlayer: false,
    requireIntelligence: true,
    triggers: [],
    targetTriggers: [
      {
        name: "CheckStatGT",
        params: [ScriptTarget.token, 0, "HELD"],
      },
    ],
  },
  {
    status: "HeldAndNotPoisoned",
    canOnlyTargetPlayer: false,
    requireIntelligence: false,
    triggers: [],
    targetTriggers: [
      {
        name: "CheckStatGT",
        params: [ScriptTarget.token, 0, "HELD"],
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_POISONED"],
        negation: true,
      },
    ],
  },
  {
    status: "Stunned",
    canOnlyTargetPlayer: false,
    requireIntelligence: true,
    triggers: [],
    targetTriggers: [
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_STUNNED"],
      },
    ],
  },
  {
    status: "PanicConfused",
    canOnlyTargetPlayer: false,
    requireIntelligence: true,
    triggers: [],
    targetTriggers: [
      {
        name: "Or",
        triggers: [
          {
            name: "StateCheck",
            params: [ScriptTarget.token, "STATE_PANIC"],
          },
          {
            name: "StateCheck",
            params: [ScriptTarget.token, "STATE_CONFUSED"],
          },
          {
            name: "StateCheck",
            params: [ScriptTarget.token, "STATE_FEEBLEMINDED"],
          },
        ],
      },
    ],
  },
  {
    status: "Sleep",
    canOnlyTargetPlayer: true,
    requireIntelligence: false,
    triggers: [
      {
        name: "Allegiance",
        params: [ScriptTarget.myself, "ENEMY"],
      },
    ],
    targetTriggers: [
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_SLEEPING"],
      },
    ],
  },
  {
    status: "NoCheck",
    canOnlyTargetPlayer: false,
    requireIntelligence: false,
    triggers: [],
    targetTriggers: [],
  },
];
