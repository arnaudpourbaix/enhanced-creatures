import { ScriptTarget } from "../../src/model/constants";
import { GRAB_DEFAULT_CONFIG } from "../../src/model/creature/grab";
import { ClassIdentifier } from "../../src/model/ids/class";
import { TargetStatus } from "../../src/model/script/target";
import { TargetListName, TargetStatusName } from "./target-name";

const Token = "$obj";

const Counts = [
  "",
  "Second",
  "Third",
  "Fourth",
  "Fifth",
  "Sixth",
  "Seventh",
  "Eighth",
  "Ninth",
  "Tenth",
];

function repeat(obj: string, count = 10) {
  const list = Counts.map((c) => `${c}${obj}`);
  return list.slice(0, count);
}

const EnemyOfType = repeat(`NearestEnemyOfType(${Token})`, 3);

function enemyOfClassTypes(list: (ClassIdentifier | "0")[]) {
  return list.flatMap((o) => EnemyOfType.map((e) => e.replaceAll(Token, `[0.0.0.${o}]`)));
}

export const TARGET_LISTS: {
  name: TargetListName;
  value: string[];
}[] = [
  {
    name: "NearestEnemies",
    value: repeat("NearestEnemyOf"),
  },
  {
    name: "NearestAllies",
    value: repeat("NearestAllyOf", 6),
  },
  {
    name: "Players",
    value: ["Player1", "Player2", "Player3", "Player4", "Player5", "Player6"],
  },
  {
    name: "PreferringStrong",
    value: [
      ...enemyOfClassTypes([
        "FIGHTER",
        "RANGER",
        "PALADIN",
        "FIGHTER_THIEF",
        "FIGHTER_ALL",
        "RANGER_ALL",
        "BARD",
        "THIEF",
        "0",
      ]),
    ],
  },
  {
    name: "PreferringWeak",
    value: [
      ...enemyOfClassTypes(["MAGE", "MAGE_THIEF", "THIEF", "BARD", "CLERIC_MAGE", "CLERIC", "0"]),
    ],
  },
  {
    name: "Fighters",
    value: enemyOfClassTypes(["FIGHTER_ALL", "RANGER_ALL", "PALADIN_ALL"]),
  },
  {
    name: "Spellcasters",
    value: enemyOfClassTypes(["MAGE_ALL", "CLERIC_ALL", "DRUID_ALL", "BARD"]),
  },
  {
    name: "Mages",
    value: enemyOfClassTypes(["MAGE_ALL", "BARD"]),
  },
  {
    name: "FarthestEnemies",
    value: repeat("FarthestEnemyOf(Myself)", 4),
  },
  {
    name: "Animals",
    value: [
      ...EnemyOfType.map((e) => e.replaceAll(Token, "0.ANIMAL")),
      `[NEUTRAL.ANIMAL]`,
      `SecondNearest([NEUTRAL.ANIMAL])`,
      `ThirdNearest([NEUTRAL.ANIMAL])`,
    ],
  },
  {
    name: "MaleHumanoids",
    value: repeat("NearestEnemyOfType([0.HUMANOID.0.0.0.MALE])", 6),
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
    ],
  },
  {
    status: "Blinded",
    canOnlyTargetPlayer: false,
    requireIntelligence: true,
    triggers: [],
    targetTriggers: [
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_BLIND"],
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
