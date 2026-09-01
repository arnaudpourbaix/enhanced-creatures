import { describe, expect, it } from "vitest";
import { MonsterEnum } from "../../creatures/monster";
import { gamesOverlap } from "../model/creature/game";
import monsterFilesService, {
  parseFileNamesCsv,
  parseMonsterDialogCsv,
  parseMonsterFilesCsv,
  parseMonsterSummonFilesCsv,
  parseUnvalidatedMonsterFilesCsv,
  parseCreatureRowsCsv,
  pickCreatureRow,
  CreatureCsvRow,
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
        { name: "BDANKH01", game: undefined },
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

const ROW_HEADER =
  "file;level;overrideScript;classScript;raceScript;generalScript;defaultScript;" +
  "helmet;shield;lring;rring;amulet;weapon1;weapon2;weapon3;weapon4;" +
  "MonsterId;ValidatedMonsterId;ValidatedLevel;ValidatedItems;ValidatedScript;game;name";

// column order for a ROW_HEADER row:
// file;level;override;class;race;general;default;helmet;shield;lring;rring;amulet;
// weapon1;weapon2;weapon3;weapon4;MonsterId;ValidatedMonsterId;VLevel;VItems;VScript;game;name

describe("parseCreatureRowsCsv", () => {
  it("extracts level, slot items and scripts in canonical order, dropping blanks", () => {
    const csv = [
      ROW_HEADER,
      "ABELA;6;RR#PICKP;None;None;None;wtrunsgt;;;RING95;;;SW1H01;;;;Nymph;true;;;;;Abela",
    ].join("\n");

    expect(parseCreatureRowsCsv(csv).get("ABELA")).toEqual([
      {
        file: "ABELA",
        game: undefined,
        level: 6,
        items: [
          { slot: "lring", file: "RING95" },
          { slot: "weapon1", file: "SW1H01" },
        ],
        scripts: [
          { slot: "overrideScript", value: "RR#PICKP" },
          { slot: "classScript", value: "None" },
          { slot: "raceScript", value: "None" },
          { slot: "generalScript", value: "None" },
          { slot: "defaultScript", value: "wtrunsgt" },
        ],
        validatedLevel: false,
        validatedItems: false,
        validatedScript: false,
      },
    ]);
  });

  it("parses a blank or non-numeric level as undefined", () => {
    const csv = [
      ROW_HEADER,
      "AAA;;None;None;None;None;None;;;;;;;;;;Nymph;true;;;;;A",
      "BBB;x;None;None;None;None;None;;;;;;;;;;Nymph;true;;;;;B",
    ].join("\n");
    const m = parseCreatureRowsCsv(csv);
    expect(m.get("AAA")).toEqual([expect.objectContaining({ level: undefined })]);
    expect(m.get("BBB")).toEqual([expect.objectContaining({ level: undefined })]);
  });

  it("reads the three Validated* flags, treating only 'true' as set", () => {
    const csv = [
      ROW_HEADER,
      "AAA;1;None;None;None;None;None;;;;;;;;;;N;true;true;false;;;A",
    ].join("\n");
    expect(parseCreatureRowsCsv(csv).get("AAA")).toEqual([
      expect.objectContaining({
        validatedLevel: true,
        validatedItems: false,
        validatedScript: false,
      }),
    ]);
  });

  it("defaults the flags to false when the columns are absent", () => {
    const csv = ["file;level;game;name", "AAA;1;;A"].join("\n");
    expect(parseCreatureRowsCsv(csv).get("AAA")).toEqual([
      expect.objectContaining({
        validatedLevel: false,
        validatedItems: false,
        validatedScript: false,
      }),
    ]);
  });

  it("groups game-tagged duplicate rows under the uppercased file key", () => {
    const csv = [
      ROW_HEADER,
      "gorf;3;None;None;None;None;None;;;;;;;;;;Ogre;true;;;;bg1;Gorf",
      "gorf;5;None;None;None;None;None;;;;;;;;;;Ogre;true;;;;bg2;Big Gorf",
    ].join("\n");
    expect(parseCreatureRowsCsv(csv).get("GORF")).toEqual([
      expect.objectContaining({ game: "bg1", level: 3 }),
      expect.objectContaining({ game: "bg2", level: 5 }),
    ]);
  });
});

describe("pickCreatureRow", () => {
  const mk = (game: CreatureCsvRow["game"]): CreatureCsvRow => ({
    game,
    file: "X", level: 0, items: [], scripts: [],
    validatedLevel: false, validatedItems: false, validatedScript: false,
  });

  it("prefers an exact game match", () => {
    expect(pickCreatureRow([mk(undefined), mk("bg2")], "bg2")).toEqual(
      expect.objectContaining({ game: "bg2" }),
    );
  });
  it("falls back to the untagged row", () => {
    expect(pickCreatureRow([mk(undefined), mk("bg1")], "bg2")).toEqual(
      expect.objectContaining({ game: undefined }),
    );
  });
  it("falls back to the first row when nothing else matches", () => {
    expect(pickCreatureRow([mk("bg1"), mk("bg2")], undefined)).toEqual(
      expect.objectContaining({ game: "bg1" }),
    );
  });
});

describe("monsterFilesService.getCreatureRow", () => {
  it("returns a parsed row for a known file, case-insensitively", () => {
    expect(monsterFilesService.getCreatureRow("abela", undefined)).toEqual(
      expect.objectContaining({ file: "ABELA" }),
    );
  });
  it("returns undefined for an unknown file", () => {
    expect(monsterFilesService.getCreatureRow("NOT_A_REAL_FILE_ID", undefined)).toBeUndefined();
  });
});

describe("monsterFilesService.getCreatureRows", () => {
  const DUAL_CSV = [
    ROW_HEADER,
    "gorf;3;None;None;None;None;None;;;;;;;;;;Ogre;true;;;;;Gorf both",
    "gorf;5;None;None;None;None;None;;;;;;;;;;Ogre;true;;;;bg1;Gorf bg1",
    "gorf;9;None;None;None;None;None;;;;;;;;;;Ogre;true;;;;bg2;Gorf bg2",
  ].join("\n");

  // getCreatureRows = parseCreatureRowsCsv(<disk>) + gamesOverlap filter. Exercise that
  // composition over a fixture (the disk smoke tests below cover the fs half).
  const rowsFor = (game: CreatureCsvRow["game"]) =>
    (parseCreatureRowsCsv(DUAL_CSV).get("GORF") ?? []).filter((r) => gamesOverlap(r.game, game));

  it("returns every row for an untagged (both-games) file entry", () => {
    expect(rowsFor(undefined)).toEqual([
      expect.objectContaining({ game: undefined, level: 3 }),
      expect.objectContaining({ game: "bg1", level: 5 }),
      expect.objectContaining({ game: "bg2", level: 9 }),
    ]);
  });

  it("returns the untagged and matching-game rows for a bg1 file entry, never the bg2 row", () => {
    expect(rowsFor("bg1")).toEqual([
      expect.objectContaining({ game: undefined, level: 3 }),
      expect.objectContaining({ game: "bg1", level: 5 }),
    ]);
  });

  it("resolves BOTH rows on disk for a dual-game resref via an untagged file entry", () => {
    // TAZOK has a bg1 and a bg2 row in assets/creatures.csv; collapseFilesByGame yields one
    // untagged creature.files entry for it, so both rows must come back.
    const rows = monsterFilesService.getCreatureRows("tazok", undefined);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    expect(rows.map((r) => r.game)).toEqual(expect.arrayContaining(["bg1", "bg2"]));
    expect(rows.every((r) => r.file.toUpperCase() === "TAZOK")).toBe(true);
  });

  it("returns only the bg1-compatible rows when the file entry is bg1-scoped", () => {
    expect(monsterFilesService.getCreatureRows("tazok", "bg1").map((r) => r.game)).not.toContain(
      "bg2",
    );
  });

  it("returns an empty array for an unknown file", () => {
    expect(monsterFilesService.getCreatureRows("NOT_A_REAL_FILE_ID", undefined)).toEqual([]);
  });
});
