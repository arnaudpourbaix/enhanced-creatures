import { familyFactories } from "../../creatures";
import { MonsterEnum } from "../../creatures/monster";
import { Family } from "../model/creature/family";
import logService from "./log.service";
import mainService from "./main.service";
import stateService from "./state.service";

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

  missing.sort((a, b) => a.localeCompare(b));
  unvalidated.sort((a, b) => a.localeCompare(b));
  return { missing, unvalidated, total };
}

class CheckMonstersService {
  async check(factories: (() => Family)[] = familyFactories): Promise<CheckMonstersResult> {
    logService.init();
    await stateService.init();
    mainService.checkPresets();
    mainService.checkSpells();

    const builtCreatures: { id: number; valid?: boolean }[] = [];
    for (const factory of factories) {
      const family = factory();
      for (const creature of family.creatures) {
        builtCreatures.push({ id: creature.id, valid: creature.valid });
      }
    }
    return diffMonsters(builtCreatures);
  }
}

const checkMonstersService = new CheckMonstersService();
export default checkMonstersService;
