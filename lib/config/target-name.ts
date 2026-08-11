export type TargetListName =
  | "Players"
  | "NearestEnemies"
  | "NearestAllies"
  | "PCs"
  | "PCsFighters"
  | "PCsPreferringStrong"
  | "PCsPreferringWeak"
  | "PCSpellcasters"
  | "PCMages"
  | "FarthestEnemies"
  | "CloseEnemies"
  | "Animals";

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
