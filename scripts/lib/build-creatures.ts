// Pure logic for scripts/build-creatures-csv.ts. See that file's header for the full rationale.

export interface Csv {
  header: string[];
  rows: Record<string, string>[];
}

const byFileName = (a: { file: string }, b: { file: string }): number =>
  a.file.localeCompare(b.file);

const byFileKey = (a: Record<string, string>, b: Record<string, string>): number =>
  a.file.localeCompare(b.file);

/**
 * Semicolon-delimited, no quoting. The display-name column is always last and may itself
 * contain `;`, so everything past the first (header.length - 1) fields folds back into it.
 */
export function parseCsv(raw: string): Csv {
  // Strip a leading UTF-8 BOM (U+FEFF) - the assets CSVs are round-tripped through Excel, which
  // writes one, and it would otherwise glue itself to the first header name so that
  // header.indexOf("file") no longer matches.
  const body = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const lines = body.split(/\r?\n/).filter((line) => line.length > 0);
  const header = lines[0].split(";");
  const rows = lines.slice(1).map((line) => {
    const parts = line.split(";");
    const fields =
      parts.length > header.length
        ? [...parts.slice(0, header.length - 1), parts.slice(header.length - 1).join(";")]
        : parts;
    while (fields.length < header.length) fields.push("");
    return Object.fromEntries(header.map((col, i) => [col, fields[i]]));
  });
  return { header, rows };
}

export function serializeCsv(header: string[], rows: Record<string, string>[]): string {
  const body = rows.map((row) => header.map((col) => row[col]).join(";"));
  return [header.join(";"), ...body].join("\r\n") + "\r\n";
}

/**
 * Move `name` to the end of the header. The display name is unquoted and may contain `;`, so it
 * must be the last field for a plain split to stay aligned. No-op if `name` isn't present.
 */
export function withNameLast(header: string[]): string[] {
  if (!header.includes("name")) return [...header];
  return [...header.filter((col) => col !== "name"), "name"];
}

/**
 * A row is a summon if the extracted CRE data says so (gender or sex = SUMMONED, or
 * allegiance = CONTROLLED) or its resref ends in "SU". Extends the rule from the removed
 * build-summon.ts (commit 22164a6): the newer extraction splits the CRE "sex" field into
 * `gender` (which carries the SUMMONED marker) and `sex` (M/F), so both must be checked -
 * e.g. CATLIOWP in bg2 is gender=SUMMONED but sex=MALE, allegiance=ALLY.
 */
export function computeSummon(row: Record<string, string>): "true" | "" {
  const gender = row.gender.toUpperCase();
  const sex = row.sex.toUpperCase();
  const allegiance = row.allegiance.toUpperCase();
  const file = row.file.toUpperCase();
  const isSummon =
    gender === "SUMMONED" ||
    sex === "SUMMONED" ||
    allegiance === "CONTROLLED" ||
    file.endsWith("SU");
  return isSummon ? "true" : "";
}

export function combineOrigin(bg1: string, bg2: string): string {
  return bg1.toLowerCase() === bg2.toLowerCase() ? bg1 : `${bg1},${bg2}`;
}

export interface ColumnDiff {
  column: string;
  a: string;
  b: string;
}

/**
 * Compares case-insensitively: Infinity Engine resrefs, scripts and death variables are not
 * case-sensitive, so `None` and `NONE` are the same value and are not reported as a difference.
 */
export function diffRow(
  a: Record<string, string>,
  b: Record<string, string>,
  columns: string[],
): ColumnDiff[] {
  return columns
    .filter((col) => a[col].toLowerCase() !== b[col].toLowerCase())
    .map((col) => ({ column: col, a: a[col], b: b[col] }));
}

export interface MergeConflict {
  file: string;
  bg1: Record<string, string>;
  bg2: Record<string, string>;
  diffs: ColumnDiff[];
}

export interface ConflictSummary {
  file: string;
  /** bg1 name, or "bg1 / bg2" when the two folders disagree on the display name. */
  name: string;
  columns: string[];
}

export function summarizeConflict(conflict: MergeConflict): ConflictSummary {
  const name1 = conflict.bg1.name;
  const name2 = conflict.bg2.name;
  return {
    file: conflict.file,
    name: name1.toLowerCase() === name2.toLowerCase() ? name1 : `${name1} / ${name2}`,
    columns: conflict.diffs.map((d) => d.column),
  };
}

export interface MergeResult {
  merged: Record<string, string>[];
  conflicts: MergeConflict[];
}

/**
 * Combine the two folders keyed by `file`. Files in one folder pass through untouched. Files in
 * both are compared case-insensitively on every column except `origin`: matching rows collapse to
 * one (bg1's row, with a combined origin), genuinely differing rows are dropped and reported as
 * conflicts.
 */
export function mergeFolders(
  bg1Rows: Record<string, string>[],
  bg2Rows: Record<string, string>[],
): MergeResult {
  const byFile2 = new Map(bg2Rows.map((r) => [r.file, r]));
  const seen = new Set<string>();
  const comparedColumns = Object.keys(bg1Rows[0]).filter((c) => c !== "origin");

  const merged: Record<string, string>[] = [];
  const conflicts: MergeConflict[] = [];

  for (const row1 of bg1Rows) {
    seen.add(row1.file);
    const row2 = byFile2.get(row1.file);
    if (!row2) {
      merged.push(row1);
    } else {
      const diffs = diffRow(row1, row2, comparedColumns);
      if (diffs.length > 0) {
        conflicts.push({ file: row1.file, bg1: row1, bg2: row2, diffs });
      } else {
        merged.push({ ...row1, origin: combineOrigin(row1.origin, row2.origin) });
      }
    }
  }
  for (const row2 of bg2Rows) {
    if (!seen.has(row2.file)) merged.push(row2);
  }

  merged.sort(byFileKey);
  conflicts.sort(byFileName);
  return { merged, conflicts };
}

export interface IdConflict {
  file: string;
  values: string[];
}

export interface MonsterIds {
  MonsterId: string;
  ValidatedMonsterId: string;
  ValidatedLevel: string;
  ValidatedItems: string;
  ValidatedScript: string;
}

interface MonsterIdIndex {
  byFile: Map<string, MonsterIds>;
  idConflicts: IdConflict[];
}

/**
 * Map every `file` in old-creatures.csv to its MonsterId / ValidatedMonsterId, preferring the row
 * with a non-empty MonsterId. `idConflicts` lists files with two different non-empty MonsterIds.
 */
export function indexMonsterIds(oldRows: Record<string, string>[]): MonsterIdIndex {
  const byFile = new Map<string, MonsterIds>();
  const distinctIds = new Map<string, string[]>();

  for (const row of oldRows) {
    const ids: MonsterIds = {
      MonsterId: row.MonsterId,
      ValidatedMonsterId: row.ValidatedMonsterId,
      // The `??` is load-bearing at runtime even though parseCsv types rows as
      // Record<string, string>: an old-creatures.csv written before these columns existed has no
      // such key, so the lookup really does yield undefined.
      /* eslint-disable @typescript-eslint/no-unnecessary-condition */
      ValidatedLevel: row.ValidatedLevel ?? "",
      ValidatedItems: row.ValidatedItems ?? "",
      ValidatedScript: row.ValidatedScript ?? "",
      /* eslint-enable @typescript-eslint/no-unnecessary-condition */
    };
    if (ids.MonsterId) {
      const known = distinctIds.get(row.file) ?? [];
      if (!known.includes(ids.MonsterId)) known.push(ids.MonsterId);
      distinctIds.set(row.file, known);
    }
    const existing = byFile.get(row.file);
    if (!existing || (!existing.MonsterId && ids.MonsterId)) byFile.set(row.file, ids);
  }

  const idConflicts = [...distinctIds.entries()]
    .filter(([, values]) => values.length > 1)
    .map(([file, values]) => ({ file, values }))
    .sort(byFileName);

  return { byFile, idConflicts };
}

export interface BuildResult {
  outputHeader: string[];
  creatures: Record<string, string>[];
  conflicts: MergeConflict[];
  /** Wanted files present in neither folder. */
  missing: string[];
  /** Wanted files dropped because bg1/bg2 disagree. */
  excludedWanted: string[];
  idConflicts: IdConflict[];
}

/** The columns creatures.csv carries beyond the raw bg1/bg2 extraction schema. */
export const CARRIED_COLUMNS = [
  "summon",
  "MonsterId",
  "ValidatedMonsterId",
  "ValidatedLevel",
  "ValidatedItems",
  "ValidatedScript",
];
const EMPTY_IDS: MonsterIds = {
  MonsterId: "",
  ValidatedMonsterId: "",
  ValidatedLevel: "",
  ValidatedItems: "",
  ValidatedScript: "",
};

/**
 * Append the carried columns to each row: `summon` computed from the row itself, the other
 * carried values looked up by `file` in the given index.
 */
export function attachCarriedColumns(
  rows: Record<string, string>[],
  monsterIds: Map<string, MonsterIds>,
): Record<string, string>[] {
  return rows.map((row) => {
    const ids = monsterIds.get(row.file) ?? EMPTY_IDS;
    return {
      ...row,
      MonsterId: ids.MonsterId,
      ValidatedMonsterId: ids.ValidatedMonsterId,
      ValidatedLevel: ids.ValidatedLevel,
      ValidatedItems: ids.ValidatedItems,
      ValidatedScript: ids.ValidatedScript,
      summon: computeSummon(row),
    };
  });
}

export function buildCreatures(bg1: Csv, bg2: Csv, old: Csv): BuildResult {
  const { merged, conflicts } = mergeFolders(bg1.rows, bg2.rows);
  const { byFile: monsterIds, idConflicts } = indexMonsterIds(old.rows);

  const wanted = new Set(old.rows.map((r) => r.file));
  const mergedFiles = new Set(merged.map((r) => r.file));
  const conflictFiles = new Set(conflicts.map((c) => c.file));

  const creatures = attachCarriedColumns(
    merged.filter((row) => wanted.has(row.file)),
    monsterIds,
  );

  const missing = [...wanted]
    .filter((file) => !mergedFiles.has(file) && !conflictFiles.has(file))
    .sort((a, b) => a.localeCompare(b));
  const excludedWanted = [...wanted]
    .filter((file) => conflictFiles.has(file))
    .sort((a, b) => a.localeCompare(b));

  return {
    outputHeader: withNameLast([...bg1.header, ...CARRIED_COLUMNS]),
    creatures,
    conflicts,
    missing,
    excludedWanted,
    idConflicts,
  };
}

/** Which game a row applies to: "" means both, "bg1" / "bg2" a game-specific variant. */
export const GAME_COLUMN = "game";

/**
 * Fold the two hand-filtered duplicates files back into creatures.csv as game-tagged rows: the
 * base rows keep `game` empty (both games), every bg1-duplicates row is added with `game=bg1` and
 * every bg2-duplicates row with `game=bg2`. Any game-tagged rows already in `base` are dropped
 * first, so this is safe to re-run. Output is sorted by `file` then `game`.
 */
export function applyGameColumn(
  base: Csv,
  bg1Dups: Csv,
  bg2Dups: Csv,
): { header: string[]; rows: Record<string, string>[] } {
  const tag = (rows: Record<string, string>[], game: string): Record<string, string>[] =>
    rows.map((row) => ({ ...row, [GAME_COLUMN]: game }));

  const rows = [
    ...tag(
      base.rows.filter((row) => (row[GAME_COLUMN] ?? "") === ""),
      "",
    ),
    ...tag(bg1Dups.rows, "bg1"),
    ...tag(bg2Dups.rows, "bg2"),
  ].sort((a, b) => a.file.localeCompare(b.file) || a[GAME_COLUMN].localeCompare(b[GAME_COLUMN]));

  const withGame = base.header.includes(GAME_COLUMN) ? base.header : [...base.header, GAME_COLUMN];
  return { header: withNameLast(withGame), rows };
}
