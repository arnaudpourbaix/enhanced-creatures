import { MonsterEnum } from "../../lib/creatures/monster";
import type { Creature } from "../../lib/src/model/creature/creature";
import {
  ExperienceRow,
  ExperienceStatus,
} from "../../lib/src/services/experience/experience.service";
import { ExperienceScore } from "../../lib/src/services/experience/experience-table";

// Collects the XP decided for every built creature (creature.experience, one row per file scope)
// for the dashboard's Experience tab (rendering in experience-report-html.ts).

export interface ExperienceReportRow extends ExperienceRow {
  monster: string;
  /** newXp - inGameXp; undefined for `zero` rows or when the in-game XP is unknown. */
  difference?: number;
}

export interface ExperienceConflictRow {
  monster: string;
  bookXp?: number;
  score: ExperienceScore;
}

export interface ExperienceReportData {
  rows: ExperienceReportRow[];
  drops: ExperienceReportRow[];
  conflicts: ExperienceConflictRow[];
  counts: Record<ExperienceStatus, number>;
  /**
   * Adjustments whose XP changed (formula or as base, difference not 0): the formula's decisions.
   * Book files apply the base XP, reviewed per monster in the conflicts.
   */
  changedRows: ExperienceReportRow[];
  changed: number;
}

export function buildExperienceReport(creatures: Creature[]): ExperienceReportData {
  const rows: ExperienceReportRow[] = [];
  const conflicts: ExperienceConflictRow[] = [];
  const counts: Record<ExperienceStatus, number> = {
    zero: 0,
    book: 0,
    asBase: 0,
    formula: 0,
    drop: 0,
  };
  for (const creature of creatures) {
    const monster = MonsterEnum[creature.id] ?? String(creature.id);
    for (const r of creature.experience) {
      counts[r.status]++;
      const difference =
        r.status === "zero" || r.inGameXp === undefined ? undefined : r.newXp - r.inGameXp;
      rows.push({ ...r, monster, difference });
    }
    if (creature.baseExperience) conflicts.push({ monster, ...creature.baseExperience });
  }
  const drops = rows.filter((r) => r.status === "drop");
  const changedRows = rows.filter(
    (r) =>
      (r.status === "formula" || r.status === "asBase") &&
      r.difference !== undefined &&
      r.difference !== 0,
  );
  return { rows, drops, conflicts, counts, changedRows, changed: changedRows.length };
}
