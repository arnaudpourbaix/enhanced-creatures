export type TargetListName =
  | "Animals"
  | "CloseEnemies"
  | "FarthestEnemies"
  | "NearestEnemies"
  | "NearestAllies"
  | "MaleHumanoids"
  | "Fighters"
  | "PreferringStrong"
  | "PreferringWeak"
  | "Spellcasters"
  | "Mages"
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
