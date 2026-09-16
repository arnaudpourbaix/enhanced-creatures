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
  | "Able" // Not affected by any disabling status
  | "Blinded"
  | "Grabbed"
  | "Held"
  | "HeldAndNotPoisoned"
  | "NoCheck"
  | "PanicConfused" // panic, confused, feebleminded
  | "Sleep"
  | "Slowed"
  | "Stunned";
