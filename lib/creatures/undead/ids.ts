/**
 * Shared ability ids for the undead family. They live in one enum because
 * `family.spell(id)` / `family.ability(id)` search across every creature in the
 * family, so ids must stay unique family-wide.
 */
export enum Ids {
  AuraOfEvil,
  BansheeFearAura,
  Blink,
  BonebatTouch,
  CarrionStench,
  DeathWail,
  GhoulTouch,
  GhoulLordTouch,
  GhastTouch,
  GhostFearAura,
  GhostTouch,
  GhoulRottingDisease,
  GreaterMummyRottingDisease,
  GreaterMummyFearAura,
  MummyFearAura,
  MummyRottingDisease,
  SkeletonWarriorFearAura,
  SpecterTouch,
  WallOfIce,
}
