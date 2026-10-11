// Reader for the assets/*.csv files. They are round-tripped through Excel, which writes them
// either semicolon- or comma-delimited depending on the locale, so the delimiter is detected from
// the header line. Fields are RFC 4180 style: a field starting with `"` is quoted, may contain the
// delimiter, line breaks and `""` (an escaped quote).

export type CsvDelimiter = ";" | ",";

export interface CsvRecords {
  delimiter: CsvDelimiter;
  header: string[];
  rows: string[][];
}

/** The header names never contain either delimiter, so whichever appears more often wins. */
export function detectCsvDelimiter(headerLine: string): CsvDelimiter {
  const count = (c: string) => headerLine.split(c).length - 1;
  return count(",") > count(";") ? "," : ";";
}

/** Quoted field opening at `start`: its unescaped value and the index just past its closing quote. */
function readQuoted(body: string, start: number): { value: string; end: number } {
  let value = "";
  let from = start + 1;
  for (;;) {
    const close = body.indexOf('"', from);
    if (close < 0) return { value: value + body.slice(from), end: body.length };
    value += body.slice(from, close);
    if (body[close + 1] !== '"') return { value, end: close + 1 };
    value += '"';
    from = close + 2;
  }
}

export function readCsvRecords(raw: string): CsvRecords {
  // Strip a leading UTF-8 BOM (U+FEFF) - Excel writes one, and it would otherwise glue itself to
  // the first header name so that header.indexOf("file") no longer matches.
  const body = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  const delimiter = detectCsvDelimiter(body.split(/\r?\n/, 1)[0]);

  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let i = 0;
  const endRecord = () => {
    record.push(field);
    // Skip blank lines (a lone empty field).
    if (record.length > 1 || record[0] !== "") records.push(record);
    record = [];
    field = "";
  };
  while (i < body.length) {
    const c = body[i];
    if (c === '"' && field === "") {
      const quoted = readQuoted(body, i);
      field = quoted.value;
      i = quoted.end;
    } else if (c === delimiter) {
      record.push(field);
      field = "";
      i++;
    } else if (c === "\r" || c === "\n") {
      endRecord();
      i += c === "\r" && body[i + 1] === "\n" ? 2 : 1;
    } else {
      field += c;
      i++;
    }
  }
  if (field !== "" || record.length > 0) endRecord();

  const [header = [], ...rows] = records;
  return { delimiter, header, rows };
}

/** Quote a field only when it needs it (contains the delimiter, a quote or a line break). */
export function formatCsvField(value: string, delimiter: CsvDelimiter): string {
  return value.includes(delimiter) || /["\r\n]/.test(value)
    ? `"${value.replace(/"/g, '""')}"`
    : value;
}

/** Boolean column value: `true` in any case (Excel uppercases it to `TRUE`), surrounding spaces ignored. */
export function csvBool(value: string | undefined): boolean {
  return (value ?? "").trim().toLowerCase() === "true";
}
