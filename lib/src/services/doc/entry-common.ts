import { CardParts } from "./card-parts";

function keysOf(parts: CardParts): Set<string> {
  return new Set([
    ...parts.stats.map((p) => p.key),
    ...parts.scores.map((p) => p.key),
    ...parts.weapons.flatMap((w) => [w.key, w.descKey]),
    ...parts.traitLinks.map((p) => p.key),
    ...parts.traitLines.map((p) => p.key),
    ...parts.abilities.map((p) => p.key),
  ]);
}

/** Keys of the parts every member of an entry has ("Common to all"). */
export function getCommonKeys(members: CardParts[]): Set<string> {
  if (members.length < 2) return new Set();
  const [first, ...rest] = members.map(keysOf);
  return new Set([...first].filter((key) => rest.every((keys) => keys.has(key))));
}
