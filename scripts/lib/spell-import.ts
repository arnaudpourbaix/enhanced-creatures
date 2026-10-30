/** A new spell-database.ts entry: its key and its property lines (without indent or comma). */
export interface NewEntry {
  key: string;
  lines: string[];
}

const byBytes = (a: string, b: string) => Buffer.compare(Buffer.from(a), Buffer.from(b));

/** A database key from a game name: PascalCase letters and digits ("Mordenkainen's Sword"). */
export function spellKey(name: string): string {
  const key = name
    .replace(/['’]/g, "")
    .split(/[^A-Za-z0-9]+/)
    .filter((word) => word)
    .map((word) => word[0].toUpperCase() + word.slice(1))
    .join("");
  return /^\d/.test(key) ? `Spell${key}` : key;
}

/**
 * Inserts `entries` into the `const <category> = {` object of spell-database.ts, each at its
 * alphabetical place among the entries already there. Throws on a key the category already has.
 */
export function insertEntries(database: string, category: string, entries: NewEntry[]): string {
  const eol = database.includes("\r\n") ? "\r\n" : "\n";
  const lines = database.split(eol);
  const start = lines.indexOf(`const ${category} = {`);
  if (start < 0) throw new Error(`No ${category} in the database`);
  for (const entry of [...entries].sort((a, b) => byBytes(a.key, b.key))) {
    // a category's object ends at its first closing brace ("};" or "} satisfies ...;")
    const end = lines.findIndex((line, i) => i > start && line.startsWith("}"));
    const keys = lines
      .slice(start + 1, end)
      .map((line, i) => ({ key: /^ {2}(\w+): \{/.exec(line)?.[1], at: start + 1 + i }))
      .filter((k): k is { key: string; at: number } => k.key !== undefined);
    if (keys.some((k) => k.key === entry.key)) {
      throw new Error(`${entry.key} is already in ${category}`);
    }
    const next = keys.find((k) => byBytes(k.key, entry.key) > 0);
    const at = next ? next.at : end;
    lines.splice(at, 0, `  ${entry.key}: {`, ...entry.lines.map((l) => `    ${l},`), "  },");
  }
  return lines.join(eol);
}
