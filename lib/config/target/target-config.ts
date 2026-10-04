import { ScriptTarget } from "../../src/model/constants";
import { GRAB_DEFAULT_CONFIG } from "../../src/model/creature/grab";
import { ClassIdentifier } from "../../src/model/ids/class";
import { TargetStatus } from "../../src/model/script/target";
import { Triggers } from "../../src/model/script/triggers";
import { GLOBAL_CONFIG } from "../generate";
import { TargetListName, TargetStatusName } from "./target-name";

const Token = "$obj";

export const Counts = [
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
    name: "Myself",
    value: ["Myself"],
  },
  {
    name: "NearestAllies",
    value: repeat("NearestAllyOf", 6),
  },
  {
    name: "MyselfAndNearestAllies",
    value: ["Myself", ...repeat("NearestAllyOf", 6)],
  },
  {
    name: "NearestEnemies",
    value: repeat("NearestEnemyOf"),
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
      ...EnemyOfType.map((e) => e.replaceAll(Token, "[0.ANIMAL]")),
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

/**
 * A target not affected by any disabling status (see the Able status).
 */
const ABLE_TRIGGERS: Triggers.Trigger[] = [
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
];

/**
 * No able enemy is in melee range of the creature: none of its 3 nearest enemies is both within
 * bafConstants.meleeRange and able (enemies are sorted by distance, so farther ones aren't either).
 */
const NOT_ENGAGED: Triggers.Trigger[] = ["", "Second", "Third"].map((rank) => {
  const enemy = `${rank}NearestEnemyOf(${ScriptTarget.myself})`;
  return {
    name: "Or",
    // Built by hand: this module loads before triggerFactory (import cycle).
    triggers: [
      { name: "Range", params: [enemy, GLOBAL_CONFIG.bafConstants.meleeRange], negation: true },
      ...ABLE_TRIGGERS.map(
        (t) =>
          ({
            ...t,
            params: "params" in t ? [enemy, ...t.params.slice(1)] : [],
            negation: !t.negation,
          }) as Triggers.Trigger,
      ),
    ],
  };
});

export const DEFAULT_STATUS_ORDER: TargetStatusName[] = [
  "Grabbed",
  "HeldNearby",
  "StunnedNearby",
  "Slowed",
  "Able",
  "Held",
  "Stunned",
  "NoCheck",
  "Sleep",
];

export const TARGET_STATUS: TargetStatus[] = [
  {
    status: "HeldNearby",
    canOnlyTargetPlayer: false,
    requireIntelligence: true,
    preferWithin: true,
    triggers: NOT_ENGAGED,
    targetTriggers: [
      {
        name: "CheckStatGT",
        params: [ScriptTarget.token, 0, "HELD"],
      },
    ],
  },
  {
    status: "StunnedNearby",
    canOnlyTargetPlayer: false,
    requireIntelligence: true,
    preferWithin: true,
    triggers: NOT_ENGAGED,
    targetTriggers: [
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_STUNNED"],
      },
    ],
  },
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
    preferWithin: true,
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
    targetTriggers: ABLE_TRIGGERS,
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
