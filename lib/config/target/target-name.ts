export type TargetListName =
  | "Animals"
  | "CloseEnemies"
  | "FarthestEnemies"
  | "NearestEnemies"
  | "NearestAllies"
  | "MyselfAndNearestAllies"
  | "MaleHumanoids"
  | "Fighters"
  | "PreferringStrong"
  | "PreferringWeak"
  | "Spellcasters"
  | "Mages"
  | "Myself"
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
