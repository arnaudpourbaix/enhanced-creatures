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
  | "HeldNearby" // held within bafConstants.preferRange, while no able enemy engages the creature
  | "NoCheck"
  | "PanicConfused" // panic, confused, feebleminded
  | "Sleep"
  | "Slowed"
  | "Stunned"
  | "StunnedNearby" // stunned within bafConstants.preferRange, while no able enemy engages the creature
  | "Unprotected" // able, without mirror images nor stoneskin, within bafConstants.preferRange
  | "Wounded"; // able, below 25% hit points, within bafConstants.preferRange
