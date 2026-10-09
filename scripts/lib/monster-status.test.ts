import { describe, expect, it } from "vitest";
import { MonsterEnum } from "../../lib/creatures/monster";
import { diffMonsters } from "./monster-status";

describe("diffMonsters", () => {
  it("reports a built, valid monster as neither missing nor unvalidated", () => {
    const result = diffMonsters([{ id: MonsterEnum.Wolf, valid: true }]);

    expect(result.missing).not.toContain("Wolf");
    expect(result.unvalidated).not.toContain("Wolf");
  });

  it("reports a monster with no built creature as missing", () => {
    const result = diffMonsters([]);

    expect(result.missing).toContain("Wolf");
  });

  it("reports a built creature with valid: false as unvalidated, not missing", () => {
    const result = diffMonsters([{ id: MonsterEnum.Wolf, valid: false }]);

    expect(result.unvalidated).toContain("Wolf");
    expect(result.missing).not.toContain("Wolf");
  });

  it("reports a built creature with valid: undefined as unvalidated", () => {
    const result = diffMonsters([{ id: MonsterEnum.Wolf, valid: undefined }]);

    expect(result.unvalidated).toContain("Wolf");
  });

  it("reports a noFiles creature under noFiles, not unvalidated", () => {
    const result = diffMonsters([{ id: MonsterEnum.Wolf, valid: false, noFiles: true }]);

    expect(result.noFiles).toEqual(["Wolf"]);
    expect(result.unvalidated).not.toContain("Wolf");
    expect(result.missing).not.toContain("Wolf");
  });

  it("returns name lists sorted alphabetically", () => {
    const result = diffMonsters([]);

    expect(result.missing).toEqual([...result.missing].sort((a, b) => a.localeCompare(b)));
  });

  it("returns the total count of MonsterEnum members", () => {
    const result = diffMonsters([]);

    const expectedTotal = Object.values(MonsterEnum).filter((v) => typeof v === "number").length;
    expect(result.total).toBe(expectedTotal);
  });
});
