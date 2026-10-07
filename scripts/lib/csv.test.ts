import { describe, expect, it } from "vitest";
import { parseCsv, serializeCsv, withNameLast } from "./csv";

describe("parseCsv", () => {
  it("splits rows into records keyed by header column", () => {
    const csv = parseCsv(`a;b;c\r\n1;2;3\r\n`);
    expect(csv.header).toEqual(["a", "b", "c"]);
    expect(csv.rows).toEqual([{ a: "1", b: "2", c: "3" }]);
  });

  it("keeps embedded semicolons in the final (name) column", () => {
    const csv = parseCsv(`file;origin;name\r\nFOO;bg1;Bob; the Bold\r\n`);
    expect(csv.rows[0].name).toBe("Bob; the Bold");
  });

  it("ignores blank trailing lines", () => {
    const csv = parseCsv(`a;b\r\n1;2\r\n\r\n`);
    expect(csv.rows).toHaveLength(1);
  });
});

describe("serializeCsv", () => {
  it("round-trips a parsed file with CRLF and a trailing newline", () => {
    const raw = `file;origin;name\r\nFOO;bg1;Bob\r\n`;
    const csv = parseCsv(raw);
    expect(serializeCsv(csv.header, csv.rows)).toBe(raw);
  });
});

describe("withNameLast", () => {
  it("moves name to the end", () => {
    expect(withNameLast(["file", "name", "summon", "game"])).toEqual([
      "file",
      "summon",
      "game",
      "name",
    ]);
  });

  it("leaves a header without a name column untouched", () => {
    expect(withNameLast(["file", "level"])).toEqual(["file", "level"]);
  });
});
