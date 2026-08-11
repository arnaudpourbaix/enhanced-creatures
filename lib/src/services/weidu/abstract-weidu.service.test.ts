import { describe, expect, it } from "vitest";
import { CodeLine } from "../../model/misc";
import weiduItemService from "./weidu-item.service";

interface AbstractWeiduServiceProtected {
  addConditionalSourceRes(
    lines: CodeLine[],
    codes: string | string[],
    tab: number,
    files: string[],
    exclude: boolean,
  ): void;
  executeCodeWithIncludedFiles(
    lines: CodeLine[],
    tab: number,
    code: string,
    files: string[],
  ): void;
}

const service = weiduItemService as unknown as AbstractWeiduServiceProtected;

function codes(lines: CodeLine[]): string[] {
  return lines.map((l) => l.code);
}

describe("addConditionalSourceRes (protected)", () => {
  it("accepts a single code string (not just an array)", () => {
    const lines: CodeLine[] = [];
    service.addConditionalSourceRes(lines, "SOME_CODE", 0, ["FILE1"], false);
    expect(codes(lines)).toContain("SOME_CODE");
  });

  it("accepts an array of code strings", () => {
    const lines: CodeLine[] = [];
    service.addConditionalSourceRes(
      lines,
      ["CODE1", "CODE2"],
      0,
      ["FILE1"],
      false,
    );
    expect(codes(lines)).toEqual(
      expect.arrayContaining(["CODE1", "CODE2"]),
    );
  });
});

describe("executeCodeWithIncludedFiles (protected)", () => {
  it("emits nothing when files is empty", () => {
    const lines: CodeLine[] = [];
    service.executeCodeWithIncludedFiles(lines, 0, "SOME_CODE", []);
    expect(lines).toHaveLength(0);
  });

  it("wraps the code in a PATCH_IF when files is non-empty", () => {
    const lines: CodeLine[] = [];
    service.executeCodeWithIncludedFiles(lines, 0, "SOME_CODE", ["FILE1"]);
    expect(codes(lines).some((c) => c.includes("PATCH_IF"))).toBe(true);
  });
});
