export const VALIDATION_COLUMNS = ["ValidatedLevel", "ValidatedItems", "ValidatedScript"] as const;
export type ValidationColumn = (typeof VALIDATION_COLUMNS)[number];

/**
 * `${UPPERCASE_FILE}|${game}` where game is "" | "bg1" | "bg2".
 *
 * The game value is normalised here because the two callers feed different shapes:
 * `applyValidationColumns` passes the raw `parseCsv` string (whatever Excel wrote - "BG2", a
 * trailing space), while the seed script passes the already-normalised `CreatureCsvRow.game`.
 * Without normalising, a stray casing/space would key an owned row differently from its finding
 * and silently blank its flags.
 */
export function rowKey(file: string, game: string | undefined): string {
  const g = (game ?? "").trim().toLowerCase();
  return `${file.toUpperCase()}|${g === "bg1" || g === "bg2" ? g : ""}`;
}

/** Insert the three columns right after ValidatedMonsterId, skipping any already present. */
export function insertValidationColumns(header: string[]): string[] {
  const out = [...header];
  const anchor = out.indexOf("ValidatedMonsterId");
  let at = anchor === -1 ? out.length : anchor + 1;
  for (const col of VALIDATION_COLUMNS) {
    if (out.includes(col)) continue;
    out.splice(at, 0, col);
    at++;
  }
  return out;
}

export function applyValidationColumns(input: {
  header: string[];
  rows: Record<string, string>[];
  findingKeys: Record<ValidationColumn, Set<string>>;
  ownedKeys: Set<string>;
}): { header: string[]; rows: Record<string, string>[] } {
  const header = insertValidationColumns(input.header);
  const rows = input.rows.map((row) => {
    const key = rowKey(row.file, row.game);
    const owned = input.ownedKeys.has(key);
    const next: Record<string, string> = { ...row };
    for (const col of VALIDATION_COLUMNS) {
      const current = row[col] ?? "";
      next[col] =
        current === "true" || (owned && !input.findingKeys[col].has(key)) ? "true" : "";
    }
    return next;
  });
  return { header, rows };
}
