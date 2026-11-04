import { describe, expect, it } from "vitest";
import {
  applyValidationColumns,
  insertValidationColumns,
  rowKey,
  type ValidationColumn,
} from "./validation-columns";

const emptyFindingKeys = (): Record<ValidationColumn, Set<string>> => ({
  vlvl: new Set(),
  vitems: new Set(),
  vscript: new Set(),
});

describe("insertValidationColumns", () => {
  it("inserts the three columns right after ValidatedMonsterId", () => {
    expect(
      insertValidationColumns(["file", "MonsterId", "ValidatedMonsterId", "game", "name"]),
    ).toEqual([
      "file",
      "MonsterId",
      "ValidatedMonsterId",
      "vlvl",
      "vitems",
      "vscript",
      "game",
      "name",
    ]);
  });

  it("is a no-op when the columns are already present", () => {
    const header = ["file", "ValidatedMonsterId", "vlvl", "vitems", "vscript", "name"];
    expect(insertValidationColumns(header)).toEqual(header);
  });

  it("appends the columns at the end when there is no ValidatedMonsterId anchor", () => {
    expect(insertValidationColumns(["file", "game", "name"])).toEqual([
      "file",
      "game",
      "name",
      "vlvl",
      "vitems",
      "vscript",
    ]);
  });
});

describe("rowKey", () => {
  it("uppercases the file and renders an absent game as an empty scope", () => {
    expect(rowKey("abela", undefined)).toBe("ABELA|");
  });

  it("normalises a stray casing/whitespace game value from Excel", () => {
    expect(rowKey("x", " BG2 ")).toBe("X|bg2");
  });

  it("treats an unrecognised game value as the empty scope", () => {
    expect(rowKey("x", "eet")).toBe("X|");
  });
});

describe("applyValidationColumns", () => {
  const run = (
    row: Record<string, string>,
    findingKeys: Record<ValidationColumn, Set<string>>,
    ownedKeys: Set<string>,
  ) =>
    applyValidationColumns({
      header: ["file", "ValidatedMonsterId", "game", "name"],
      rows: [row],
      findingKeys,
      ownedKeys,
    }).rows[0];

  it("keeps an existing 'true' even when a finding now exists", () => {
    const key = rowKey("AAA", "");
    const fk = emptyFindingKeys();
    fk.vlvl.add(key);
    const out = run({ file: "AAA", game: "", vlvl: "true" }, fk, new Set([key]));
    expect(out.vlvl).toBe("true");
  });

  it("sets 'true' for an owned row with no finding", () => {
    const key = rowKey("AAA", "");
    const out = run({ file: "AAA", game: "" }, emptyFindingKeys(), new Set([key]));
    expect(out.vlvl).toBe("true");
    expect(out.vitems).toBe("true");
    expect(out.vscript).toBe("true");
  });

  it("leaves blank an owned row that has a finding", () => {
    const key = rowKey("AAA", "");
    const fk = emptyFindingKeys();
    fk.vitems.add(key);
    const out = run({ file: "AAA", game: "" }, fk, new Set([key]));
    expect(out.vitems).toBe("");
    expect(out.vlvl).toBe("true"); // other checks unaffected
  });

  it("leaves blank a row no built creature references", () => {
    const out = run({ file: "ORPHAN", game: "" }, emptyFindingKeys(), new Set());
    expect(out.vlvl).toBe("");
  });

  it("matches keys per game variant", () => {
    const out = applyValidationColumns({
      header: ["file", "ValidatedMonsterId", "game", "name"],
      rows: [
        { file: "GORF", game: "bg1" },
        { file: "GORF", game: "bg2" },
      ],
      findingKeys: (() => {
        const fk = emptyFindingKeys();
        fk.vlvl.add(rowKey("GORF", "bg2"));
        return fk;
      })(),
      ownedKeys: new Set([rowKey("GORF", "bg1"), rowKey("GORF", "bg2")]),
    }).rows;
    expect(out[0].vlvl).toBe("true"); // bg1 - no finding
    expect(out[1].vlvl).toBe(""); // bg2 - finding
  });
});
