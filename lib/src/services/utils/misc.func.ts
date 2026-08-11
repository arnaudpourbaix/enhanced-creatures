export function getSpellFilename(
  num: number,
  creatureId: number,
  creatureType: "f" | "m" = "m",
): string {
  return getFilename(num, creatureId, creatureType, "s");
}

export function getItemFilename(
  num: number,
  creatureId: number,
  creatureType: "f" | "m" = "m",
): string {
  return getFilename(num, creatureId, creatureType, "i");
}

export function getProjectileFilename(
  num: number,
  creatureId: number,
  creatureType: "f" | "m" = "m",
): string {
  return getFilename(num, creatureId, creatureType, "p");
}

function getFilename(
  num: number,
  creatureId: number,
  creatureType: "f" | "m",
  fileType: "s" | "i" | "p",
): string {
  return `ja#${fileType}${num.toString(16)}${creatureType}${creatureId.toString(16)}`;
}
