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
  const common = new Set([...first].filter((key) => rest.every((keys) => keys.has(key))));
  // Attacks only make sense read together: they are shared only when every member's whole attack
  // set is, so no card shows half its attacks (the wyverns' common jaws stay next to each stinger)
  const wholeAttacksShared = members.every((m) => m.weapons.every((w) => common.has(w.descKey)));
  if (!wholeAttacksShared) {
    for (const w of members.flatMap((m) => m.weapons)) {
      common.delete(w.key);
      common.delete(w.descKey);
    }
  }
  return common;
}
