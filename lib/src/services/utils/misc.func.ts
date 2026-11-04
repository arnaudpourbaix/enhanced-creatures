export type ResourceKind = "s" | "i" | "p" | "b" | "c" | "a" | "v";
export type ResourceScope = "m" | "e" | "k" | "c";

const MAX_CODE = 36 * 36 - 1;

/** A monster's / entry's / kin's code in every file name: base 36, 2 chars, zero-padded (153 -> "49"). */
export function toCode(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > MAX_CODE) {
    throw new Error(`Code out of range (0-${MAX_CODE}): ${n}`);
  }
  return n.toString(36).padStart(2, "0");
}

/** ja + kind + scope + owner code + counter code: always 8 characters (see resource naming spec). */
export function getResourceName(
  kind: ResourceKind,
  scope: ResourceScope,
  ownerId: number,
  counter: number,
): string {
  return `ja${kind}${scope}${toCode(ownerId)}${toCode(counter)}`;
}

export function getSpellFilename(
  num: number,
  creatureId: number,
  creatureType: ResourceScope = "m",
): string {
  return getFilename(num, creatureId, creatureType, "s");
}

export function getItemFilename(
  num: number,
  creatureId: number,
  creatureType: ResourceScope = "m",
): string {
  return getFilename(num, creatureId, creatureType, "i");
}

export function getProjectileFilename(
  num: number,
  creatureId: number,
  creatureType: ResourceScope = "m",
): string {
  return getFilename(num, creatureId, creatureType, "p");
}

function getFilename(
  num: number,
  creatureId: number,
  creatureType: ResourceScope,
  fileType: "s" | "i" | "p",
): string {
  return getResourceName(fileType, creatureType, creatureId, num);
}
