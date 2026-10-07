import { MonsterEnum } from "../../lib/creatures/monster";

export interface MonsterStatus {
  missing: string[];
  unvalidated: string[];
  /** Implemented and otherwise valid, but no creature file yet (no validated creatures.csv row). */
  noFiles: string[];
  total: number;
}

export interface BuiltCreatureStatus {
  id: number;
  valid?: boolean;
  noFiles?: boolean;
}

/** Sorts every MonsterEnum member by the state of its built creature, if any. */
export function diffMonsters(builtCreatures: BuiltCreatureStatus[]): MonsterStatus {
  const byId = new Map<number, BuiltCreatureStatus>();
  for (const creature of builtCreatures) {
    byId.set(creature.id, creature);
  }

  const missing: string[] = [];
  const unvalidated: string[] = [];
  const noFiles: string[] = [];
  let total = 0;
  for (const value of Object.values(MonsterEnum)) {
    if (typeof value !== "number") continue;
    total++;
    const creature = byId.get(value);
    if (!creature) {
      missing.push(MonsterEnum[value]);
    } else if (creature.noFiles) {
      noFiles.push(MonsterEnum[value]);
    } else if (!creature.valid) {
      unvalidated.push(MonsterEnum[value]);
    }
  }

  missing.sort((a, b) => a.localeCompare(b));
  unvalidated.sort((a, b) => a.localeCompare(b));
  noFiles.sort((a, b) => a.localeCompare(b));
  return { missing, unvalidated, noFiles, total };
}
