import { describe, expect, it } from "vitest";
import { MonsterEnum } from "../../creatures/monster";
import monsterFilesService, {
  parseFileNamesCsv,
  parseMonsterDialogCsv,
  parseMonsterFilesCsv,
  parseMonsterSummonFilesCsv,
  parseUnvalidatedMonsterFilesCsv,
} from "./monster-files.service";

const HEADER =
  "file;general;race;class;anim;deathvar;dialog;origin;MonsterId;ValidatedMonsterId;game;name";
const SUMMON_HEADER =
  "file;general;race;class;anim;deathvar;dialog;origin;summon;MonsterId;ValidatedMonsterId;game;name";
const EMPTY_MAP_FOR_HEADER_ONLY_CSV = "returns an empty map for a header-only CSV";
const KALDRAN_THE_BEAR = "Kaldran the Bear";

describe("parseMonsterFilesCsv", () => {
  it("groups validated files under their MonsterId as CreatureFile entries, in row order", () => {
    const csv = [
      HEADER,
      "ANKHEG;MONSTER;ANKHEG;ANKHEG;ANKHEG;ankheg;;VIENXAY;Ankheg;true;;Ankheg",
      "BDNEO;MONSTER;ANKHEG;ANKHEG;ANKHEG;bdneo;;BD;Ankheg;true;;Ankheg",
    ].join("\n");

    expect(parseMonsterFilesCsv(csv).get("Ankheg")).toEqual([
      { name: "ANKHEG", game: undefined },
      { name: "BDNEO", game: undefined },
    ]);
  });

  it("carries the game column onto each entry", () => {
    const csv = [
      HEADER,
      "GORF;X;X;X;X;gorf;;bg1;Ogre;true;bg1;Gorf",
      "GORF;X;X;X;X;gorf;;bg2;Ogre;true;bg2;Gorf the Squisher",
    ].join("\n");

    expect(parseMonsterFilesCsv(csv).get("Ogre")).toEqual([
      { name: "GORF", game: "bg1" },
      { name: "GORF", game: "bg2" },
    ]);
  });

  it("excludes rows that aren't validated or aren't mapped to a monster", () => {
    const csv = [
      HEADER,
      "GUESS1;MONSTER;WOLF;WOLF;WOLF;guess1;;BD;Wolf;false;;Wolf guess",
      "BLANK1;MONSTER;WOLF;WOLF;WOLF;blank1;;BD;;;;Wolf blank",
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
  it("returns validated creatures.csv files as CreatureFile entries", () => {
    const files = monsterFilesService.getFiles(MonsterEnum.Ankheg);

    expect(files).toEqual(
      expect.arrayContaining([
        { name: "ANKHEG", game: undefined },
        { name: "BDNEO", game: undefined },
      ]),
    );
  });
});

describe("parseUnvalidatedMonsterFilesCsv", () => {
  it("groups unvalidated (false) guesses under their MonsterId, in row order", () => {
    const csv = [
      HEADER,
      "GUESS1;MONSTER;WOLF;WOLF;WOLF;guess1;;BD;Wolf;false;;Wolf guess",
      "GUESS2;MONSTER;WOLF;WOLF;WOLF;guess2;;BD;Wolf;false;;Wolf guess 2",
    ].join("\n");

    const result = parseUnvalidatedMonsterFilesCsv(csv);

    expect(result.get("Wolf")).toEqual([
      { name: "GUESS1", game: undefined },
      { name: "GUESS2", game: undefined },
    ]);
  });

  it("excludes rows that are already validated or aren't mapped to a monster", () => {
    const csv = [
      HEADER,
      "ANKHEG;MONSTER;ANKHEG;ANKHEG;ANKHEG;ankheg;;VIENXAY;Ankheg;true;;Ankheg",
      "BLANK1;MONSTER;WOLF;WOLF;WOLF;blank1;;BD;;;;Wolf blank",
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

    expect(files).toEqual(expect.arrayContaining([{ name: "9XDOG", game: undefined }]));
  });
});

describe("parseMonsterSummonFilesCsv", () => {
  it("groups validated summon files under their MonsterId as CreatureFile entries", () => {
    const csv = [
      SUMMON_HEADER,
      "GORF;X;X;X;X;gorf;;BD;true;Ogre;true;bg1;Gorf",
      "BDGORF;X;X;X;X;bdgorf;;BD;true;Ogre;true;bg2;Big Gorf",
    ].join("\n");

    expect(parseMonsterSummonFilesCsv(csv).get("Ogre")).toEqual([
      { name: "GORF", game: "bg1" },
      { name: "BDGORF", game: "bg2" },
    ]);
  });

  it("excludes rows that aren't summons", () => {
    const csv = [
      SUMMON_HEADER,
      "GORF;X;X;X;X;gorf;;BD;;Ogre;true;;Gorf",
    ].join("\n");

    expect(parseMonsterSummonFilesCsv(csv).has("Ogre")).toBe(false);
  });

  it(EMPTY_MAP_FOR_HEADER_ONLY_CSV, () => {
    expect(parseMonsterSummonFilesCsv(SUMMON_HEADER).size).toBe(0);
  });
});

describe("parseMonsterDialogCsv", () => {
  it("groups deathvar/dialog rows under their MonsterId, in row order", () => {
    const csv = [
      HEADER,
      "0XAL2DG;HUMANOID;HUMAN;MAGE;MONK;0XAL2DG;0XAL2DG;TOTDG;Alchemist;true;;Hooded Alchemist",
      "0XAL3DG;HUMANOID;HUMAN;MAGE;MONK;;;TOTDG;Alchemist;true;;Hooded Alchemist 2",
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
      "GUESS1;MONSTER;WOLF;WOLF;WOLF;guess1;guess1;BD;Wolf;false;;Wolf guess",
      "BLANK1;MONSTER;WOLF;WOLF;WOLF;blank1;blank1;BD;;;;Wolf blank",
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

describe("parseFileNamesCsv", () => {
  it("maps each file to its name column value, uppercased", () => {
    const csv = [
      HEADER,
      "kaldran;ANIMAL;BEAR;BEAR_POLAR;BEAR_POLAR;kaldran;;BG1;PolarBear;true;;Kaldran the Bear",
    ].join("\n");

    const result = parseFileNamesCsv(csv);

    expect(result.get("KALDRAN")).toBe(KALDRAN_THE_BEAR);
  });

  it("skips rows with an empty file or an empty name", () => {
    const csv = [
      HEADER,
      ";ANIMAL;BEAR;BEAR_POLAR;BEAR_POLAR;;;BG1;PolarBear;true;;No File",
      "NONAME;ANIMAL;BEAR;BEAR_POLAR;BEAR_POLAR;noname;;BG1;PolarBear;true;;",
    ].join("\n");

    const result = parseFileNamesCsv(csv);

    expect(result.size).toBe(0);
  });

  it(EMPTY_MAP_FOR_HEADER_ONLY_CSV, () => {
    const result = parseFileNamesCsv(HEADER);

    expect(result.size).toBe(0);
  });
});

describe("monsterFilesService.getName", () => {
  it("returns the creatures.csv name for a known file, case-insensitively", () => {
    expect(monsterFilesService.getName("kaldran")).toBe(KALDRAN_THE_BEAR);
    expect(monsterFilesService.getName("KALDRAN")).toBe(KALDRAN_THE_BEAR);
  });

  it("returns undefined for an unknown file", () => {
    expect(monsterFilesService.getName("NOT_A_REAL_FILE_ID")).toBeUndefined();
  });
});
