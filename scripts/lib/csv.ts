// Helpers for the assets/*.csv files (semicolon- or comma-delimited, see lib/src/csv.ts).

import { type CsvDelimiter, formatCsvField, readCsvRecords } from "../../lib/src/csv";

export interface Csv {
  delimiter: CsvDelimiter;
  header: string[];
  rows: Record<string, string>[];
}

/**
 * Delimiter detected from the header, quoted fields supported. The display-name column is always
 * last and, in an unquoted semicolon file, may itself contain `;`, so everything past the first
 * (header.length - 1) fields folds back into it.
 */
export function parseCsv(raw: string): Csv {
  const { delimiter, header, rows: records } = readCsvRecords(raw);
  const rows = records.map((parts) => {
    const fields =
      parts.length > header.length
        ? [...parts.slice(0, header.length - 1), parts.slice(header.length - 1).join(delimiter)]
        : parts;
    while (fields.length < header.length) fields.push("");
    return Object.fromEntries(header.map((col, i) => [col, fields[i]]));
  });
  return { delimiter, header, rows };
}

export function serializeCsv(
  header: string[],
  rows: Record<string, string>[],
  delimiter: CsvDelimiter = ";",
): string {
  const line = (values: string[]) =>
    values.map((v) => formatCsvField(v, delimiter)).join(delimiter);
  const body = rows.map((row) => line(header.map((col) => (col in row ? row[col] : ""))));
  return [line(header), ...body].join("\r\n") + "\r\n";
}

/**
 * Move `name` to the end of the header. The display name may be unquoted and contain `;`, so it
 * must be the last field for parseCsv's fold-back to stay aligned. No-op if `name` isn't present.
 */
export function withNameLast(header: string[]): string[] {
  if (!header.includes("name")) return [...header];
  return [...header.filter((col) => col !== "name"), "name"];
}
