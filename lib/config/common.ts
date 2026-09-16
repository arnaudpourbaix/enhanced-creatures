import { ScriptTarget } from "../src/model/constants";
import { TargetList } from "../src/model/script/target";

export const SPELL_STATES = {
  flying: "JA_FLYING",
  grabbed: "JA_GRAPPLED",
  grabbing: "JA_GRAPPLING",
  gaseousForm: "JA_GASEOUSFORM",
};

export const DEFAULT_SPELL_PROBABILITY = 70;

export const CHARM_TARGET_LISTS: TargetList[] = [
  {
    name: "PCsFighters",
    randomOrder: true,
    includeStatus: ["Able"],
    triggers: [
      {
        name: "Race",
        params: [ScriptTarget.lastSeen, "ELF"],
      },
      {
        name: "Race",
        params: [ScriptTarget.lastSeen, "HALF_ELF"],
      },
    ],
  },
  {
    name: "PCs",
    includeStatus: ["Able"],
    randomOrder: true,
    triggers: [
      {
        name: "Race",
        params: [ScriptTarget.lastSeen, "ELF"],
      },
      {
        name: "Race",
        params: [ScriptTarget.lastSeen, "HALF_ELF"],
      },
    ],
  },
  {
    name: "PCsFighters",
    randomOrder: true,
    includeStatus: ["Able"],
    triggers: [
      {
        name: "Race",
        params: [ScriptTarget.lastSeen, "ELF"],
      },
    ],
  },
  {
    name: "PCs",
    includeStatus: ["Able"],
    randomOrder: true,
  },
];

export const PRESET_NAMES = {
  DimensionDoorOffscreen: "DimensionDoorOffscreen",
};

export const SLEEP_TARGET_LISTS: TargetList[] = [
  {
    name: "PCs",
    includeStatus: ["Able"],
    randomOrder: true,
    triggers: [
      {
        name: "Race",
        params: [ScriptTarget.lastSeen, "ELF"],
      },
      {
        name: "Race",
        params: [ScriptTarget.lastSeen, "HALF_ELF"],
      },
    ],
  },
];

export const FEAR_TARGET_LISTS: TargetList[] = [
  {
    name: "PCs",
    includeStatus: ["Able"],
    randomOrder: true,
  },
];

export const HOLD_TARGET_LISTS: TargetList[] = [
  {
    name: "PCs",
    includeStatus: ["Able"],
    randomOrder: true,
  },
];

export const SUMMON_TARGET_LISTS: TargetList[] = [
  {
    name: "PCsPreferringWeak",
    randomOrder: true,
    includeStatus: ["Able"],
  },
  {
    name: "NearestEnemies",
    randomOrder: true,
  },
  {
    name: "NearestAllies",
    randomOrder: true,
  },
];

export const ALLIES_TARGET_LISTS: TargetList[] = [
  {
    name: "NearestAllies",
    randomOrder: true,
    triggers: [
      { name: "Gender", params: [ScriptTarget.lastSeen, "SUMMONED"], negation: true },
      { name: "Gender", params: [ScriptTarget.lastSeen, "ILLUSIONARY"], negation: true },
    ],
  },
];
