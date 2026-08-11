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
