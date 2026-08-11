import { describe, expect, it } from "vitest";
import { MonsterEnum } from "../../creatures/monster";
import monsterFilesService, {
  parseMonsterDialogCsv,
  parseMonsterFilesCsv,
  parseUnvalidatedMonsterFilesCsv,
} from "./monster-files.service";

const HEADER =
  "file;general;race;class;anim;deathvar;dialog;origin;name;MonsterId;ValidatedMonsterId";
const EMPTY_MAP_FOR_HEADER_ONLY_CSV = "returns an empty map for a header-only CSV";

describe("parseMonsterFilesCsv", () => {
  it("groups validated files under their MonsterId, in row order", () => {
    const csv = [
      HEADER,
      "ANKHEG;MONSTER;ANKHEG;ANKHEG;ANKHEG;ankheg;;VIENXAY;Ankheg;Ankheg;true",
      "BDNEO;MONSTER;ANKHEG;ANKHEG;ANKHEG;bdneo;;BD;Ankheg;Ankheg;true",
    ].join("\n");

    const result = parseMonsterFilesCsv(csv);

    expect(result.get("Ankheg")).toEqual(["ANKHEG", "BDNEO"]);
  });

  it("excludes rows that aren't validated or aren't mapped to a monster", () => {
    const csv = [
      HEADER,
      "GUESS1;MONSTER;WOLF;WOLF;WOLF;guess1;;BD;Wolf guess;Wolf;false",
      "BLANK1;MONSTER;WOLF;WOLF;WOLF;blank1;;BD;Wolf blank;;",
    ].join("\n");

    const result = parseMonsterFilesCsv(csv);

    expect(result.has("Wolf")).toBe(false);
  });

  it(EMPTY_MAP_FOR_HEADER_ONLY_CSV, () => {
    const result = parseMonsterFilesCsv(HEADER);

    expect(result.size).toBe(0);
  });
});

describe("monsterFilesService.getFiles", () => {
  it("returns the validated creatures.csv files for a known monster", () => {
    const files = monsterFilesService.getFiles(MonsterEnum.Ankheg);

    expect(files).toEqual(expect.arrayContaining(["ANKHEG", "BDNEO", "BDANKH01"]));
  });
});

describe("parseUnvalidatedMonsterFilesCsv", () => {
  it("groups unvalidated (false) guesses under their MonsterId, in row order", () => {
    const csv = [
      HEADER,
      "GUESS1;MONSTER;WOLF;WOLF;WOLF;guess1;;BD;Wolf guess;Wolf;false",
      "GUESS2;MONSTER;WOLF;WOLF;WOLF;guess2;;BD;Wolf guess 2;Wolf;false",
    ].join("\n");

    const result = parseUnvalidatedMonsterFilesCsv(csv);

    expect(result.get("Wolf")).toEqual(["GUESS1", "GUESS2"]);
  });

  it("excludes rows that are already validated or aren't mapped to a monster", () => {
    const csv = [
      HEADER,
      "ANKHEG;MONSTER;ANKHEG;ANKHEG;ANKHEG;ankheg;;VIENXAY;Ankheg;Ankheg;true",
      "BLANK1;MONSTER;WOLF;WOLF;WOLF;blank1;;BD;Wolf blank;;",
    ].join("\n");

    const result = parseUnvalidatedMonsterFilesCsv(csv);

    expect(result.has("Ankheg")).toBe(false);
    expect(result.has("Wolf")).toBe(false);
  });

  it(EMPTY_MAP_FOR_HEADER_ONLY_CSV, () => {
    const result = parseUnvalidatedMonsterFilesCsv(HEADER);

    expect(result.size).toBe(0);
  });
});

describe("monsterFilesService.getUnvalidatedFiles", () => {
  it("returns the unvalidated creatures.csv guesses for a known monster", () => {
    const files = monsterFilesService.getUnvalidatedFiles(MonsterEnum.Wolf);

    expect(files).toEqual(expect.arrayContaining(["9XDOG"]));
  });
});

describe("parseMonsterDialogCsv", () => {
  it("groups deathvar/dialog rows under their MonsterId, in row order", () => {
    const csv = [
      HEADER,
      "0XAL2DG;HUMANOID;HUMAN;MAGE;MONK;0XAL2DG;0XAL2DG;TOTDG;Hooded Alchemist;Alchemist;true",
      "0XAL3DG;HUMANOID;HUMAN;MAGE;MONK;;;TOTDG;Hooded Alchemist 2;Alchemist;true",
    ].join("\n");

    const result = parseMonsterDialogCsv(csv);

    expect(result.get("Alchemist")).toEqual([
      { file: "0XAL2DG", deathvar: "0XAL2DG", dialog: "0XAL2DG" },
      { file: "0XAL3DG", deathvar: "", dialog: "" },
    ]);
  });

  it("excludes rows that aren't validated or aren't mapped to a monster", () => {
    const csv = [
      HEADER,
      "GUESS1;MONSTER;WOLF;WOLF;WOLF;guess1;guess1;BD;Wolf guess;Wolf;false",
      "BLANK1;MONSTER;WOLF;WOLF;WOLF;blank1;blank1;BD;Wolf blank;;",
    ].join("\n");

    const result = parseMonsterDialogCsv(csv);

    expect(result.has("Wolf")).toBe(false);
  });

  it(EMPTY_MAP_FOR_HEADER_ONLY_CSV, () => {
    const result = parseMonsterDialogCsv(HEADER);

    expect(result.size).toBe(0);
  });
});

describe("monsterFilesService.getDialogRows", () => {
  it("returns the validated deathvar/dialog rows for a known monster", () => {
    const rows = monsterFilesService.getDialogRows(MonsterEnum.Ankheg);

    expect(rows).toEqual(
      expect.arrayContaining([{ file: "L#MIMMI", deathvar: "L#MIMMI", dialog: "L#MIMMI" }]),
    );
  });
});
