import { ScriptTarget } from "../src/model/constants";
import { TargetList } from "../src/model/script/target";

export const SPELL_STATES = {
  flying: "JA_FLYING",
  grabbed: "JA_GRAPPLED",
  grabbing: "JA_GRAPPLING",
  gaseousForm: "JA_GASEOUSFORM",
};

export const DEFAULT_SPELL_PROBABILITY = 70;

// Fallback cascade: best case excludes both Elf (90% resistant) and Half-Elf (30% resistant),
// a looser fallback tier allows Half-Elf, and the last-resort tier excludes neither. Each tier's
// own `keywords` (see TargetList.keywords) is independently toggleable via
// GLOBAL_CONFIG.spellChecks.races - disabling it collapses now-identical tiers automatically (see
// AbilityService.dedupeTargetLists).
export const CHARM_TARGET_LISTS: TargetList[] = [
  {
    name: "PCsFighters",
    randomOrder: true,
    includeStatus: ["Able"],
    keywords: ["elf", "halfElf"],
  },
  {
    name: "PCs",
    includeStatus: ["Able"],
    randomOrder: true,
    keywords: ["elf", "halfElf"],
  },
  {
    name: "PCsFighters",
    randomOrder: true,
    includeStatus: ["Able"],
    keywords: ["elf"],
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
    keywords: ["elf", "halfElf"],
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
