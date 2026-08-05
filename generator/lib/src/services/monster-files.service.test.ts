import { describe, expect, it } from "vitest";
import { MonsterEnum } from "../../creatures/monster";
import monsterFilesService, { parseMonsterFilesCsv } from "./monster-files.service";

const HEADER =
  "file;general;race;class;anim;deathvar;dialog;origin;name;MonsterId;ValidatedMonsterId";

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

  it("returns an empty map for a header-only CSV", () => {
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
