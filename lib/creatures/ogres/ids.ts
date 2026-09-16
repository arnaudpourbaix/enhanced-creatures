/**
 * Shared ability/item ids for the ogre family. They live in one enum because
 * `family.item(id)` / `family.spell(id)` search across every creature in the
 * family, so ids must stay unique family-wide.
 */
export enum Ids {
  ConeOfCold,
  Fly,
  GaseousForm,
  Naginata,
  HalfOgre,
  Ogre,
  OgreLeader,
}
