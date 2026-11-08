import { describe, expect, it } from "vitest";
import { schoolOf, schoolOfType, type SchoolRow } from "./spell-school";

const rows: SchoolRow[] = [
  { file: "SPWI228", ids: "WIZARD_DECASTAVE", school: "Evocation" },
  { file: "SPWI112", ids: "WIZARD_MAGIC_MISSILE", school: "Evocation" },
  { file: "SPWI128", ids: "WIZARD_DIMENSION_JUMP", school: "Alteration" },
  { file: "SPCL104", ids: "RESIST_FEAR", school: "None" },
];

describe("schoolOf", () => {
  it("maps the CSV school to its primary type", () => {
    expect(schoolOf(rows, { file: "spwi112", id: "WIZARD_MAGIC_MISSILE" })).toBe("Invoker");
  });

  it("gives null for a spell of no school", () => {
    expect(schoolOf(rows, { file: "SPCL104", id: "RESIST_FEAR" })).toBeNull();
  });

  it("doesn't match a file holding another spell", () => {
    expect(schoolOf(rows, { file: "SPWI228", id: "WIZARD_MONSTER_SUMMONING_2" })).toBeUndefined();
  });

  it("matches another ids of a file no other spell claims", () => {
    const spell = { file: "SPWI228", id: "WIZARD_DECASTAVE_ALIAS" };
    expect(schoolOf(rows, spell, (file) => file === "SPWI228")).toBe("Invoker");
  });

  it("matches on file alone when the spell declares no id", () => {
    expect(schoolOf(rows, { file: "SPWI228" })).toBe("Invoker");
  });

  it("falls back to a variant's file", () => {
    const spell = {
      file: "SPWI999",
      id: "WIZARD_NOTHING",
      variants: [{ file: "SPWI128", id: "WIZARD_DIMENSION_JUMP" }],
    };
    expect(schoolOf(rows, spell)).toBe("Transmuter");
  });

  it("refuses an unknown school", () => {
    expect(() =>
      schoolOf([{ file: "SPWI001", ids: "X", school: "Wild" }], { file: "SPWI001" }),
    ).toThrow("unknown school");
  });
});

describe("schoolOfType", () => {
  it("maps the SPL byte to its primary type", () => {
    expect(schoolOfType(5)).toBe("Illusionist");
    expect(schoolOfType(0)).toBeNull();
  });
});
