import { ScriptTarget } from "../../src/model/constants";
import { TargetList } from "../../src/model/script/target";
import { Triggers } from "../../src/model/script/triggers";

/**
 * Most of the times, you don't want to target:
 * - enemy charmed target (meaning a charmed ally)
 * - summon or summoned demon
 * - illusion
 * None of these apply when the target is Myself (exceptMyself).
 */
export const ExcludeUnwantedTargetsTriggers: Triggers.Trigger[] = [
  {
    name: "StateCheck",
    params: [ScriptTarget.token, "STATE_CHARMED"],
    negation: true,
    exceptMyself: true,
  },
  {
    name: "Gender",
    params: [ScriptTarget.token, "SUMMONED"],
    negation: true,
    exceptMyself: true,
  },
  {
    name: "Gender",
    params: [ScriptTarget.token, "SUMMONED_DEMON"],
    negation: true,
    exceptMyself: true,
  },
  {
    name: "Gender",
    params: [ScriptTarget.lastSeen, "ILLUSIONARY"],
    negation: true,
    exceptMyself: true,
  },
];

export const SummonsTriggers: Triggers.Trigger[] = [
  {
    name: "Or",
    triggers: [
      { name: "Gender", params: [ScriptTarget.token, "SUMMONED"] },
      { name: "Gender", params: [ScriptTarget.token, "SUMMONED_DEMON"] },
    ],
  },
];

export const CommonTargetLists = {
  Allies: [
    {
      name: "NearestAllies",
      triggers: ExcludeUnwantedTargetsTriggers,
      randomOrder: true,
    },
  ],
  MyselfThenAllies: [
    {
      name: "Myself",
    },
    {
      name: "NearestAllies",
      triggers: ExcludeUnwantedTargetsTriggers,
      randomOrder: true,
    },
  ],
  MyselfOrAllies: [
    {
      name: "MyselfAndNearestAllies",
      triggers: ExcludeUnwantedTargetsTriggers,
      randomOrder: true,
    },
  ],
  Enemies: [
    {
      name: "NearestEnemies",
      triggers: ExcludeUnwantedTargetsTriggers,
      includeStatus: ["Able"],
      randomOrder: true,
    },
    {
      name: "NearestEnemies",
      triggers: ExcludeUnwantedTargetsTriggers,
      randomOrder: true,
    },
    {
      name: "NearestEnemies",
      randomOrder: true,
    },
  ],
  AbleEnemies: [
    {
      name: "NearestEnemies",
      triggers: ExcludeUnwantedTargetsTriggers,
      includeStatus: ["Able"],
      randomOrder: true,
    },
    {
      name: "NearestEnemies",
      includeStatus: ["Able"],
      randomOrder: true,
    },
  ],
  Fighters: [
    {
      name: "Fighters",
      includeStatus: ["Able"],
      triggers: ExcludeUnwantedTargetsTriggers,
      randomOrder: true,
    },
    {
      name: "Fighters",
      triggers: ExcludeUnwantedTargetsTriggers,
      randomOrder: true,
    },
  ],
  Spellcasters: [
    {
      name: "Spellcasters",
      includeStatus: ["Able"],
      triggers: ExcludeUnwantedTargetsTriggers,
      randomOrder: true,
    },
    {
      name: "Spellcasters",
      triggers: ExcludeUnwantedTargetsTriggers,
      randomOrder: true,
    },
  ],
  FarthestEnemies: [
    {
      name: "FarthestEnemies",
      triggers: ExcludeUnwantedTargetsTriggers,
      randomOrder: true,
    },
    {
      name: "FarthestEnemies",
      randomOrder: true,
    },
  ],
  PreferringStrong: [
    {
      name: "PreferringStrong",
      includeStatus: ["Able"],
      triggers: ExcludeUnwantedTargetsTriggers,
      randomOrder: true,
    },
    {
      name: "PreferringStrong",
      triggers: ExcludeUnwantedTargetsTriggers,
      randomOrder: true,
    },
  ],
  PreferringWeak: [
    {
      name: "PreferringWeak",
      includeStatus: ["Able"],
      triggers: ExcludeUnwantedTargetsTriggers,
      randomOrder: true,
    },
    {
      name: "PreferringWeak",
      triggers: ExcludeUnwantedTargetsTriggers,
      randomOrder: true,
    },
  ],
} satisfies Record<string, TargetList[]>;
