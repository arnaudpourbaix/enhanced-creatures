import { MonsterEnum } from "../../creatures/monster";

export interface CheckMonstersResult {
  missing: string[];
  unvalidated: string[];
  total: number;
}

export function diffMonsters(
  builtCreatures: { id: number; valid?: boolean }[],
): CheckMonstersResult {
  const validById = new Map<number, boolean | undefined>();
  for (const creature of builtCreatures) {
    validById.set(creature.id, creature.valid);
  }

  const missing: string[] = [];
  const unvalidated: string[] = [];
  let total = 0;
  for (const value of Object.values(MonsterEnum)) {
    if (typeof value !== "number") continue;
    total++;
    if (!validById.has(value)) {
      missing.push(MonsterEnum[value]);
    } else if (!validById.get(value)) {
      unvalidated.push(MonsterEnum[value]);
    }
  }

  missing.sort();
  unvalidated.sort();
  return { missing, unvalidated, total };
}
