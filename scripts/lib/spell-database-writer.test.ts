import { describe, expect, it } from "vitest";
import { addFieldToDatabase } from "./spell-database-writer";

describe("addFieldToDatabase", () => {
  const database = [
    "const WIZARD_SPELLS = {",
    "  CharmPerson: {",
    '    file: "SPWI104",',
    "    level: 1,",
    '    variants: [{ mod: "AllSpellMods", file: "SPWI999" }],',
    "  },",
    "  Innate: {",
    '    file: "SPIN100",',
    '    name: "x",',
    "  },",
    "  DispelMagic: {",
    '    file: "SPPR303",',
    '    role: "reactive",',
    "  },",
    "};",
  ].join("\n");

  it("adds the field right after the entry's level", () => {
    const result = addFieldToDatabase(database, "castingTime", [{ file: "SPWI104", value: "1" }]);
    expect(result.split("\n").slice(2, 5)).toEqual([
      '    file: "SPWI104",',
      "    level: 1,",
      "    castingTime: 1,",
    ]);
  });

  it("adds the field right after another one when asked, after level without it", () => {
    const withRole = addFieldToDatabase(database, "role", [
      { file: "SPWI104", value: '"disable"' },
    ]);
    const result = addFieldToDatabase(
      withRole,
      "secondaryRoles",
      [{ file: "SPWI104", value: '["damage"]' }],
      "role",
    );
    expect(result.split("\n").slice(3, 6)).toEqual([
      "    level: 1,",
      '    role: "disable",',
      '    secondaryRoles: ["damage"],',
    ]);
  });

  it("adds it last without a level", () => {
    const result = addFieldToDatabase(database, "role", [{ file: "SPIN100", value: '"buff"' }]);
    expect(result.split("\n").slice(8, 11)).toEqual([
      '    name: "x",',
      '    role: "buff",',
      "  },",
    ]);
  });

  it("keeps the value an entry already declares", () => {
    expect(addFieldToDatabase(database, "role", [{ file: "SPPR303", value: '"damage"' }])).toBe(
      database,
    );
  });

  it("picks the entry by key when entries for different mods share the file", () => {
    const shared = [
      "const WIZARD_SPELLS = {",
      "  Blindness: {",
      '    file: "SPWI106",',
      "  },",
      "  ObscuringMist: {",
      '    file: "SPWI106",',
      "  },",
      "};",
    ].join("\n");
    const values = [
      { file: "SPWI106", key: "Blindness", value: '"disable"' },
      { file: "SPWI106", key: "ObscuringMist", value: '"protection"' },
    ];
    const result = addFieldToDatabase(shared, "role", values).split("\n");
    expect(result.slice(1, 4)).toEqual([
      "  Blindness: {",
      '    file: "SPWI106",',
      '    role: "disable",',
    ]);
    expect(result.slice(5, 9)).toEqual([
      "  ObscuringMist: {",
      '    file: "SPWI106",',
      '    role: "protection",',
      "  },",
    ]);
  });

  it("expands an entry written on one line to add the field", () => {
    const inline = [
      "const WIZARD_SPELLS = {",
      '  Breach: { file: "SPWI513", level: 5, keywords: ["area", "fire"] },',
      "};",
    ].join("\n");
    const result = addFieldToDatabase(inline, "role", [{ file: "SPWI513", value: '"reactive"' }]);
    expect(result.split("\n")).toEqual([
      "const WIZARD_SPELLS = {",
      "  Breach: {",
      '    file: "SPWI513",',
      "    level: 5,",
      '    role: "reactive",',
      '    keywords: ["area", "fire"],',
      "  },",
      "};",
    ]);
  });

  it("handles a database checked out with CRLF line endings, keeping them", () => {
    const crlf = database.replace(/\n/g, "\r\n");
    const result = addFieldToDatabase(crlf, "castingTime", [{ file: "SPWI104", value: "1" }]);
    expect(result.split("\r\n").slice(2, 5)).toEqual([
      '    file: "SPWI104",',
      "    level: 1,",
      "    castingTime: 1,",
    ]);
  });

  it("throws on a file no entry owns (a variant's isn't the entry's own)", () => {
    expect(() =>
      addFieldToDatabase(database, "role", [{ file: "SPWI999", value: '"buff"' }]),
    ).toThrow(/SPWI999: 0 entries own it/);
  });
});
