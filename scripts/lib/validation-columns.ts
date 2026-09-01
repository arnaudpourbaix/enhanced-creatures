export const VALIDATION_COLUMNS = ["ValidatedLevel", "ValidatedItems", "ValidatedScript"] as const;
export type ValidationColumn = (typeof VALIDATION_COLUMNS)[number];

/** `${UPPERCASE_FILE}|${game}` where game is "" | "bg1" | "bg2". */
export function rowKey(file: string, game: string | undefined): string {
  return `${file.toUpperCase()}|${game ?? ""}`;
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
