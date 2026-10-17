/**
 * Kins: code or resources shared by several entries (a kin exists only when several entries
 * really share something). Ids are stable: they name kin-owned resources (scope `k`).
 */
export enum KinEnum {
  Bear = 1,
  Cat,
  Construct,
  Dog,
  Fey,
  Golem,
  Ogre,
  Ooze,
  Spider,
  Wolf,
  // 11 (Ghoul) was never used.
  Skeleton = 12,
}

const kinIds = Object.values(KinEnum).filter((v): v is KinEnum => typeof v === "number");

/** Kin folder name under `lib/pnp-monster/kin/`: the lowercase enum key ("bear"). */
export const KIN_FOLDERS = Object.fromEntries(
  kinIds.map((id) => [id, KinEnum[id].toLowerCase()]),
) as Record<KinEnum, string>;
