/** A value to add to the database entry owning `file`, as TypeScript source. */
export interface DatabaseValue {
  file: string;
  /** The entry's key, needed when entries for different mods share the file */
  key?: string;
  value: string;
}

/**
 * Adds `field` to the spell-database.ts entries of `values` (by the entry's own `file`, and `key`
 * when several entries own it), right after their `after` field, else their `level`, or last. An
 * entry that already declares the field is left alone, so hand-made decisions are kept. Throws
 * when no entry, or several entries, match: the field would be added blindly.
 */
export function addFieldToDatabase(
  database: string,
  field: string,
  values: DatabaseValue[],
  after = "level",
): string {
  // keep the line endings the file was checked out with
  const eol = database.includes("\r\n") ? "\r\n" : "\n";
  const lines = database.split(eol).flatMap(expandInline);
  const entryStart = (fileLine: number) => {
    let start = fileLine;
    while (start > 0 && !/^ {2}\w+: \{$/.test(lines[start])) start--;
    return start;
  };
  for (const { file, key, value } of values) {
    const owners = lines
      .flatMap((line, i) => (line === `    file: "${file}",` ? [entryStart(i)] : []))
      .filter((start) => isEntry(lines, start, key));
    if (owners.length !== 1) throw new Error(`${file}: ${owners.length} entries own it`);
    const start = owners[0];
    const end = lines.findIndex((line, i) => i > start && line === "  },");
    const entry = lines.slice(start, end);
    if (entry.some((line) => line.startsWith(`    ${field}:`))) continue;
    const anchor = [after, "level"].map((name) =>
      entry.findIndex((line) => line.startsWith(`    ${name}:`)),
    );
    const at = anchor.find((i) => i >= 0);
    lines.splice(at === undefined ? end : start + at + 1, 0, `    ${field}: ${value},`);
  }
  return lines.join(eol);
}

/** An entry written on one line (`  Key: { a: 1, b: [2, 3] },`), one property per line. */
function expandInline(line: string): string[] {
  const match = /^ {2}(\w+): \{ (.*) \},$/.exec(line);
  if (!match) return [line];
  const properties: string[] = [];
  let depth = 0;
  let current = "";
  for (const char of match[2]) {
    if (char === "," && depth === 0) {
      properties.push(current.trim());
      current = "";
      continue;
    }
    if ("[{(".includes(char)) depth++;
    if ("]})".includes(char)) depth--;
    current += char;
  }
  properties.push(current.trim());
  return [`  ${match[1]}: {`, ...properties.map((property) => `    ${property},`), "  },"];
}

/** Whether the entry starting at `start` is the one named `key`, when one is given. */
function isEntry(lines: string[], start: number, key: string | undefined): boolean {
  return key === undefined || lines[start] === `  ${key}: {`;
}
