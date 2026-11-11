export type TargetListName =
  | "Animals"
  | "CloseEnemies"
  | "FarthestAllies"
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
  | "CharmedAlly" // charmed onto the creature's side: attacked once no enemy can be (see attack())
  | "Grabbed"
  | "Held"
  | "Prone" // knocked down by a trip (see TripService): can still act
  | "HeldAndNotPoisoned"
  | "HeldNearby" // held within PLAYER_CONFIG.preferRange, while no able enemy engages the creature
  | "NoCheck"
  | "PanicConfused" // panic, confused, feebleminded
  | "Sleep"
  | "Slowed"
  | "Stunned"
  | "StunnedNearby" // stunned within PLAYER_CONFIG.preferRange, while no able enemy engages the creature
  | "Unprotected" // able, without mirror images nor stoneskin, within PLAYER_CONFIG.preferRange
  | "Wounded"; // able, below 25% hit points, within PLAYER_CONFIG.preferRange
