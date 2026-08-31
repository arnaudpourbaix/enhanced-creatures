import * as fs from "fs";
import { MonsterEnum } from "../../creatures/monster";
import { CreatureFile, Game } from "../model/creature/game";

const CSV_PATH = "assets/creatures.csv";
const FILE_COLUMN = "file";
const MONSTER_ID_COLUMN = "MonsterId";
const VALIDATED_COLUMN = "ValidatedMonsterId";
const DEATHVAR_COLUMN = "deathvar";
const DIALOG_COLUMN = "dialog";
const SUMMON_COLUMN = "summon";
const NAME_COLUMN = "name";
const GAME_COLUMN = "game";

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
}

const monsterFilesService = new MonsterFilesService();
export default monsterFilesService;
