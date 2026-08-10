import * as fs from "fs";
import { MonsterEnum } from "../../creatures/monster";

const CSV_PATH = "assets/creatures.csv";
const FILE_COLUMN = "file";
const MONSTER_ID_COLUMN = "MonsterId";
const VALIDATED_COLUMN = "ValidatedMonsterId";
const DEATHVAR_COLUMN = "deathvar";
const DIALOG_COLUMN = "dialog";
const SUMMON_COLUMN = "summon";

export function parseMonsterFilesCsv(raw: string): Map<string, string[]> {
  const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
  const header = lines[0].split(";");
  const fileIdx = header.indexOf(FILE_COLUMN);
  const monsterIdIdx = header.indexOf(MONSTER_ID_COLUMN);
  const validatedIdx = header.indexOf(VALIDATED_COLUMN);

  const result = new Map<string, string[]>();
  for (const line of lines.slice(1)) {
    const fields = line.split(";");
    const validated = fields[validatedIdx] ?? "";
    const monsterId = fields[monsterIdIdx] ?? "";
    if (validated !== "true" || !monsterId) continue;
    const file = fields[fileIdx] ?? "";
    const existing = result.get(monsterId);
    if (existing) existing.push(file);
    else result.set(monsterId, [file]);
  }
  return result;
}

export function parseUnvalidatedMonsterFilesCsv(raw: string): Map<string, string[]> {
  const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
  const header = lines[0].split(";");
  const fileIdx = header.indexOf(FILE_COLUMN);
  const monsterIdIdx = header.indexOf(MONSTER_ID_COLUMN);
  const validatedIdx = header.indexOf(VALIDATED_COLUMN);

  const result = new Map<string, string[]>();
  for (const line of lines.slice(1)) {
    const fields = line.split(";");
    const validated = fields[validatedIdx] ?? "";
    const monsterId = fields[monsterIdIdx] ?? "";
    if (validated === "true" || !monsterId) continue;
    const file = fields[fileIdx] ?? "";
    const existing = result.get(monsterId);
    if (existing) existing.push(file);
    else result.set(monsterId, [file]);
  }
  return result;
}

export function parseMonsterDialogCsv(
  raw: string,
): Map<string, { file: string; deathvar: string; dialog: string }[]> {
  const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
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

export function parseMonsterSummonFilesCsv(raw: string): Map<string, string[]> {
  const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
  const header = lines[0].split(";");
  const fileIdx = header.indexOf(FILE_COLUMN);
  const monsterIdIdx = header.indexOf(MONSTER_ID_COLUMN);
  const validatedIdx = header.indexOf(VALIDATED_COLUMN);
  const summonIdx = header.indexOf(SUMMON_COLUMN);

  const result = new Map<string, string[]>();
  for (const line of lines.slice(1)) {
    const fields = line.split(";");
    const validated = fields[validatedIdx] ?? "";
    const monsterId = fields[monsterIdIdx] ?? "";
    const summon = fields[summonIdx] ?? "";
    if (validated !== "true" || !monsterId || summon !== "true") continue;
    const file = fields[fileIdx] ?? "";
    const existing = result.get(monsterId);
    if (existing) existing.push(file);
    else result.set(monsterId, [file]);
  }
  return result;
}

class MonsterFilesService {
  private filesByMonster?: Map<string, string[]>;
  private unvalidatedFilesByMonster?: Map<string, string[]>;
  private dialogRowsByMonster?: Map<string, { file: string; deathvar: string; dialog: string }[]>;
  private summonFilesByMonster?: Map<string, string[]>;

  getFiles(monster: MonsterEnum): string[] {
    this.filesByMonster ??= parseMonsterFilesCsv(fs.readFileSync(CSV_PATH, "utf-8"));
    return this.filesByMonster.get(MonsterEnum[monster]) ?? [];
  }

  getSummonFiles(monster: MonsterEnum): string[] {
    this.summonFilesByMonster ??= parseMonsterSummonFilesCsv(fs.readFileSync(CSV_PATH, "utf-8"));
    return this.summonFilesByMonster.get(MonsterEnum[monster]) ?? [];
  }

  getUnvalidatedFiles(monster: MonsterEnum): string[] {
    this.unvalidatedFilesByMonster ??= parseUnvalidatedMonsterFilesCsv(
      fs.readFileSync(CSV_PATH, "utf-8"),
    );
    return this.unvalidatedFilesByMonster.get(MonsterEnum[monster]) ?? [];
  }

  getDialogRows(monster: MonsterEnum): { file: string; deathvar: string; dialog: string }[] {
    this.dialogRowsByMonster ??= parseMonsterDialogCsv(fs.readFileSync(CSV_PATH, "utf-8"));
    return this.dialogRowsByMonster.get(MonsterEnum[monster]) ?? [];
  }
}

const monsterFilesService = new MonsterFilesService();
export default monsterFilesService;
