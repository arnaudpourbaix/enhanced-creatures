import { describe, expect, it } from "vitest";
import { csvBool, detectCsvDelimiter, formatCsvField, readCsvRecords } from "./csv";

describe("detectCsvDelimiter", () => {
  it("picks the delimiter used by the header", () => {
    expect(detectCsvDelimiter("file;level;name")).toBe(";");
    expect(detectCsvDelimiter("file,level,name")).toBe(",");
  });
});

describe("readCsvRecords", () => {
  it("reads a semicolon file", () => {
    expect(readCsvRecords(`a;b\r\n1;2\r\n`)).toEqual({
      delimiter: ";",
      header: ["a", "b"],
      rows: [["1", "2"]],
    });
  });

  it("reads a comma file with quoted fields, escaped quotes and line breaks", () => {
    const csv = readCsvRecords(
      `file,name\r\nFOO,"Zzrakh, the ""Bebilith"""\r\nBAR,"two\r\nlines"\r\n`,
    );
    expect(csv.delimiter).toBe(",");
    expect(csv.rows).toEqual([
      ["FOO", 'Zzrakh, the "Bebilith"'],
      ["BAR", "two\r\nlines"],
    ]);
  });

  it("strips a BOM, keeps empty fields and skips blank lines", () => {
    const csv = readCsvRecords(`﻿a,b,c\n1,,3\n\n`);
    expect(csv.header).toEqual(["a", "b", "c"]);
    expect(csv.rows).toEqual([["1", "", "3"]]);
  });

  it("keeps a quote in the middle of an unquoted field literal", () => {
    expect(readCsvRecords(`a;b\r\nThe "Butcher";2`).rows).toEqual([['The "Butcher"', "2"]]);
  });
});

describe("formatCsvField", () => {
  it("quotes only when needed", () => {
    expect(formatCsvField("Bob", ",")).toBe("Bob");
    expect(formatCsvField("Bob, the Bold", ",")).toBe('"Bob, the Bold"');
    expect(formatCsvField("Bob, the Bold", ";")).toBe("Bob, the Bold");
    expect(formatCsvField('a"b', ";")).toBe('"a""b"');
  });
});

describe("csvBool", () => {
  it("accepts true in any case, ignoring surrounding spaces", () => {
    expect(["true", "TRUE", "True", " true "].map(csvBool)).toEqual([true, true, true, true]);
    expect(["false", "FALSE", "", undefined, "yes"].map(csvBool)).toEqual([
      false,
      false,
      false,
      false,
      false,
    ]);
  });
});
