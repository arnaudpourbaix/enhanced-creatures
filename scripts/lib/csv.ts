// Semicolon-delimited csv helpers for the assets/*.csv files.

export interface Csv {
  header: string[];
  rows: Record<string, string>[];
}

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
