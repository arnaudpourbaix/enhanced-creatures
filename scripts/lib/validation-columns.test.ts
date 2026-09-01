import { describe, expect, it } from "vitest";
import {
  applyValidationColumns,
  insertValidationColumns,
  rowKey,
  VALIDATION_COLUMNS,
  type ValidationColumn,
} from "./validation-columns";

const emptyFindingKeys = (): Record<ValidationColumn, Set<string>> => ({
  ValidatedLevel: new Set(),
  ValidatedItems: new Set(),
  ValidatedScript: new Set(),
});

describe("insertValidationColumns", () => {
  it("inserts the three columns right after ValidatedMonsterId", () => {
    expect(insertValidationColumns(["file", "MonsterId", "ValidatedMonsterId", "game", "name"])).toEqual([
      "file", "MonsterId", "ValidatedMonsterId",
      "ValidatedLevel", "ValidatedItems", "ValidatedScript",
      "game", "name",
    ]);
  });

  it("is a no-op when the columns are already present", () => {
    const header = ["file", "ValidatedMonsterId", "ValidatedLevel", "ValidatedItems", "ValidatedScript", "name"];
    expect(insertValidationColumns(header)).toEqual(header);
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
    fk.ValidatedLevel.add(key);
    const out = run({ file: "AAA", game: "", ValidatedLevel: "true" }, fk, new Set([key]));
    expect(out.ValidatedLevel).toBe("true");
  });

  it("sets 'true' for an owned row with no finding", () => {
    const key = rowKey("AAA", "");
    const out = run({ file: "AAA", game: "" }, emptyFindingKeys(), new Set([key]));
    expect(out.ValidatedLevel).toBe("true");
    expect(out.ValidatedItems).toBe("true");
    expect(out.ValidatedScript).toBe("true");
  });

  it("leaves blank an owned row that has a finding", () => {
    const key = rowKey("AAA", "");
    const fk = emptyFindingKeys();
    fk.ValidatedItems.add(key);
    const out = run({ file: "AAA", game: "" }, fk, new Set([key]));
    expect(out.ValidatedItems).toBe("");
    expect(out.ValidatedLevel).toBe("true"); // other checks unaffected
  });

  it("leaves blank a row no built creature references", () => {
    const out = run({ file: "ORPHAN", game: "" }, emptyFindingKeys(), new Set());
    expect(out.ValidatedLevel).toBe("");
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
        fk.ValidatedLevel.add(rowKey("GORF", "bg2"));
        return fk;
      })(),
      ownedKeys: new Set([rowKey("GORF", "bg1"), rowKey("GORF", "bg2")]),
    }).rows;
    expect(out[0].ValidatedLevel).toBe("true"); // bg1 - no finding
    expect(out[1].ValidatedLevel).toBe("");     // bg2 - finding
  });
});
