export type TargetListName =
  | "Animals"
  | "CloseEnemies"
  | "FarthestEnemies"
  | "NearestEnemies"
  | "NearestAllies"
  | "EvilcutoffMaleHumanoids"
  | "PCs"
  | "PCsFighters"
  | "PCsPreferringStrong"
  | "PCsPreferringWeak"
  | "PCSpellcasters"
  | "PCMages"
  | "Players";

export type TargetStatusName =
  | "Grabbed"
  | "Held"
  | "Stunned"
  | "Slowed"
  | "PanicConfused" // panic, confused, feebleminded
  | "Sleep"
  | "Able" // Not affected by any disabling status
  | "HeldAndNotPoisoned"
  | "NoCheck";
