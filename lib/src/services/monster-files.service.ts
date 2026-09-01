import * as fs from "fs";
import { MonsterEnum } from "../../creatures/monster";
import { CreatureFile, Game, gamesOverlap } from "../model/creature/game";

const CSV_PATH = "assets/creatures.csv";
const FILE_COLUMN = "file";
const MONSTER_ID_COLUMN = "MonsterId";
const VALIDATED_COLUMN = "ValidatedMonsterId";
const DEATHVAR_COLUMN = "deathvar";
const DIALOG_COLUMN = "dialog";
const SUMMON_COLUMN = "summon";
const NAME_COLUMN = "name";
const GAME_COLUMN = "game";
const LEVEL_COLUMN = "level";
const SLOT_COLUMNS = [
  "helmet", "shield", "lring", "rring", "amulet",
  "weapon1", "weapon2", "weapon3", "weapon4",
] as const;
const SCRIPT_COLUMNS = [
  "overrideScript", "classScript", "raceScript", "generalScript", "defaultScript",
] as const;
const VALIDATED_LEVEL_COLUMN = "ValidatedLevel";
const VALIDATED_ITEMS_COLUMN = "ValidatedItems";
const VALIDATED_SCRIPT_COLUMN = "ValidatedScript";

function gameValue(raw: string | undefined): Game | undefined {
  const v = (raw ?? "").trim().toLowerCase();
  return v === "bg1" || v === "bg2" ? v : undefined;
}

// assets/creatures.csv is regularly round-tripped through Excel, which writes a UTF-8 BOM
// (U+FEFF). Strip it so header.indexOf("file") (and every other column lookup) still resolves.
function csvLines(raw: string): string[] {
  const body = raw.charCodeAt(0) === 0xfeff ? raw.slice(1) : raw;
  return body.split(/\r?\n/).filter((line) => line.length > 0);
}

export interface CreatureCsvRow {
  file: string;
  game?: Game;
  level: number | undefined;
  items: { slot: string; file: string }[];
  scripts: { slot: string; value: string }[];
  validatedLevel: boolean;
  validatedItems: boolean;
  validatedScript: boolean;
}

export function parseCreatureRowsCsv(raw: string): Map<string, CreatureCsvRow[]> {
  const lines = csvLines(raw);
  const header = lines[0].split(";");
  const at = (col: string) => header.indexOf(col);
  const fileIdx = at(FILE_COLUMN);
  const gameIdx = at(GAME_COLUMN);
  const levelIdx = at(LEVEL_COLUMN);
  const slotIdx = SLOT_COLUMNS.map((slot) => ({ slot, i: at(slot) }));
  const scriptIdx = SCRIPT_COLUMNS.map((slot) => ({ slot, i: at(slot) }));
  const vLevelIdx = at(VALIDATED_LEVEL_COLUMN);
  const vItemsIdx = at(VALIDATED_ITEMS_COLUMN);
  const vScriptIdx = at(VALIDATED_SCRIPT_COLUMN);

  const result = new Map<string, CreatureCsvRow[]>();
  for (const line of lines.slice(1)) {
    const fields = line.split(";");
    const file = fields[fileIdx] ?? "";
    if (!file) continue;
    const levelRaw = (fields[levelIdx] ?? "").trim();
    const levelNum = Number(levelRaw);
    const row: CreatureCsvRow = {
      file,
      game: gameValue(fields[gameIdx]),
      level: levelRaw === "" || Number.isNaN(levelNum) ? undefined : levelNum,
      items: slotIdx
        .filter(({ i }) => i >= 0 && (fields[i] ?? "").trim() !== "")
        .map(({ slot, i }) => ({ slot, file: fields[i].trim() })),
      scripts: scriptIdx
        .filter(({ i }) => i >= 0 && (fields[i] ?? "").trim() !== "")
        .map(({ slot, i }) => ({ slot, value: fields[i].trim() })),
      validatedLevel: (fields[vLevelIdx] ?? "") === "true",
      validatedItems: (fields[vItemsIdx] ?? "") === "true",
      validatedScript: (fields[vScriptIdx] ?? "") === "true",
    };
    const key = file.toUpperCase();
    const existing = result.get(key);
    if (existing) existing.push(row);
    else result.set(key, [row]);
  }
  return result;
}

export function pickCreatureRow(
  rows: CreatureCsvRow[],
  game: Game | undefined,
): CreatureCsvRow | undefined {
  return (
    rows.find((r) => r.game === game) ??
    rows.find((r) => r.game === undefined) ??
    rows[0]
  );
}

export function parseMonsterFilesCsv(raw: string): Map<string, CreatureFile[]> {
  const lines = csvLines(raw);
  const header = lines[0].split(";");
  const fileIdx = header.indexOf(FILE_COLUMN);
  const monsterIdIdx = header.indexOf(MONSTER_ID_COLUMN);
  const validatedIdx = header.indexOf(VALIDATED_COLUMN);
  const gameIdx = header.indexOf(GAME_COLUMN);

  const result = new Map<string, CreatureFile[]>();
  for (const line of lines.slice(1)) {
    const fields = line.split(";");
    const validated = fields[validatedIdx] ?? "";
    const monsterId = fields[monsterIdIdx] ?? "";
    if (validated !== "true" || !monsterId) continue;
    const entry: CreatureFile = { name: fields[fileIdx] ?? "", game: gameValue(fields[gameIdx]) };
    const existing = result.get(monsterId);
    if (existing) existing.push(entry);
    else result.set(monsterId, [entry]);
  }
  return result;
}

export function parseUnvalidatedMonsterFilesCsv(raw: string): Map<string, CreatureFile[]> {
  const lines = csvLines(raw);
  const header = lines[0].split(";");
  const fileIdx = header.indexOf(FILE_COLUMN);
  const monsterIdIdx = header.indexOf(MONSTER_ID_COLUMN);
  const validatedIdx = header.indexOf(VALIDATED_COLUMN);
  const gameIdx = header.indexOf(GAME_COLUMN);

  const result = new Map<string, CreatureFile[]>();
  for (const line of lines.slice(1)) {
    const fields = line.split(";");
    const validated = fields[validatedIdx] ?? "";
    const monsterId = fields[monsterIdIdx] ?? "";
    if (validated === "true" || !monsterId) continue;
    const entry: CreatureFile = { name: fields[fileIdx] ?? "", game: gameValue(fields[gameIdx]) };
    const existing = result.get(monsterId);
    if (existing) existing.push(entry);
    else result.set(monsterId, [entry]);
  }
  return result;
}

export function parseMonsterDialogCsv(
  raw: string,
): Map<string, { file: string; deathvar: string; dialog: string }[]> {
  const lines = csvLines(raw);
  const header = lines[0].split(";");
  const fileIdx = header.indexOf(FILE_COLUMN);
  const deathvarIdx = header.indexOf(DEATHVAR_COLUMN);
  const dialogIdx = header.indexOf(DIALOG_COLUMN);
  const monsterIdIdx = header.indexOf(MONSTER_ID_COLUMN);
  const validatedIdx = header.indexOf(VALIDATED_COLUMN);

  const result = new Map<string, { file: string; deathvar: string; dialog: string }[]>();
  for (const line of lines.slice(1)) {
    const fields = line.split(";");
    const validated = fields[validatedIdx] ?? "";
    const monsterId = fields[monsterIdIdx] ?? "";
    if (validated !== "true" || !monsterId) continue;
    const row = {
      file: fields[fileIdx] ?? "",
      deathvar: fields[deathvarIdx] ?? "",
      dialog: fields[dialogIdx] ?? "",
    };
    const existing = result.get(monsterId);
    if (existing) existing.push(row);
    else result.set(monsterId, [row]);
  }
  return result;
}

export function parseMonsterSummonFilesCsv(raw: string): Map<string, CreatureFile[]> {
  const lines = csvLines(raw);
  const header = lines[0].split(";");
  const fileIdx = header.indexOf(FILE_COLUMN);
  const monsterIdIdx = header.indexOf(MONSTER_ID_COLUMN);
  const validatedIdx = header.indexOf(VALIDATED_COLUMN);
  const summonIdx = header.indexOf(SUMMON_COLUMN);
  const gameIdx = header.indexOf(GAME_COLUMN);

  const result = new Map<string, CreatureFile[]>();
  for (const line of lines.slice(1)) {
    const fields = line.split(";");
    const validated = fields[validatedIdx] ?? "";
    const monsterId = fields[monsterIdIdx] ?? "";
    const summon = fields[summonIdx] ?? "";
    if (validated !== "true" || !monsterId || summon !== "true") continue;
    const entry: CreatureFile = { name: fields[fileIdx] ?? "", game: gameValue(fields[gameIdx]) };
    const existing = result.get(monsterId);
    if (existing) existing.push(entry);
    else result.set(monsterId, [entry]);
  }
  return result;
}

export function parseFileNamesCsv(raw: string): Map<string, string> {
  const lines = csvLines(raw);
  const header = lines[0].split(";");
  const fileIdx = header.indexOf(FILE_COLUMN);
  const nameIdx = header.indexOf(NAME_COLUMN);

  const result = new Map<string, string>();
  for (const line of lines.slice(1)) {
    const fields = line.split(";");
    const file = fields[fileIdx] ?? "";
    const name = fields[nameIdx] ?? "";
    if (!file || !name) continue;
    result.set(file.toUpperCase(), name);
  }
  return result;
}

class MonsterFilesService {
  private filesByMonster?: Map<string, CreatureFile[]>;
  private unvalidatedFilesByMonster?: Map<string, CreatureFile[]>;
  private dialogRowsByMonster?: Map<string, { file: string; deathvar: string; dialog: string }[]>;
  private summonFilesByMonster?: Map<string, CreatureFile[]>;
  private namesByFile?: Map<string, string>;
  private creatureRowsByFile?: Map<string, CreatureCsvRow[]>;

  getFiles(monster: MonsterEnum): CreatureFile[] {
    this.filesByMonster ??= parseMonsterFilesCsv(fs.readFileSync(CSV_PATH, "utf-8"));
    return this.filesByMonster.get(MonsterEnum[monster]) ?? [];
  }

  getSummonFiles(monster: MonsterEnum): CreatureFile[] {
    this.summonFilesByMonster ??= parseMonsterSummonFilesCsv(fs.readFileSync(CSV_PATH, "utf-8"));
    return this.summonFilesByMonster.get(MonsterEnum[monster]) ?? [];
  }

  getUnvalidatedFiles(monster: MonsterEnum): CreatureFile[] {
    this.unvalidatedFilesByMonster ??= parseUnvalidatedMonsterFilesCsv(
      fs.readFileSync(CSV_PATH, "utf-8"),
    );
    return this.unvalidatedFilesByMonster.get(MonsterEnum[monster]) ?? [];
  }

  getDialogRows(monster: MonsterEnum): { file: string; deathvar: string; dialog: string }[] {
    this.dialogRowsByMonster ??= parseMonsterDialogCsv(fs.readFileSync(CSV_PATH, "utf-8"));
    return this.dialogRowsByMonster.get(MonsterEnum[monster]) ?? [];
  }

  getName(file: string): string | undefined {
    this.namesByFile ??= parseFileNamesCsv(fs.readFileSync(CSV_PATH, "utf-8"));
    return this.namesByFile.get(file.toUpperCase());
  }

  getCreatureRow(file: string, game: Game | undefined): CreatureCsvRow | undefined {
    this.creatureRowsByFile ??= parseCreatureRowsCsv(fs.readFileSync(CSV_PATH, "utf-8"));
    const rows = this.creatureRowsByFile.get(file.toUpperCase());
    return rows?.length ? pickCreatureRow(rows, game) : undefined;
  }

  /**
   * Every source row for `file` whose game scope can coexist with `game`. A resref present in both
   * games has one row per game, and `collapseFilesByGame` merges those into a single
   * `creature.files` entry with `game: undefined` - so the per-game rows must all be resolved here
   * rather than picking one (which is what `getCreatureRow` does, for the by-key lookups).
   */
  getCreatureRows(file: string, game: Game | undefined): CreatureCsvRow[] {
    this.creatureRowsByFile ??= parseCreatureRowsCsv(fs.readFileSync(CSV_PATH, "utf-8"));
    const rows = this.creatureRowsByFile.get(file.toUpperCase());
    if (!rows?.length) return [];
    return rows.filter((r) => gamesOverlap(r.game, game));
  }
}

const monsterFilesService = new MonsterFilesService();
export default monsterFilesService;
