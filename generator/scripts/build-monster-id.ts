import * as fs from "fs";
import * as path from "path";

interface MonsterDef {
  monster: string;
  family: string;
  method: string;
  files: string[];
  notEnforceFiles: string[];
  general?: string;
  race?: string;
  class?: string;
}

function parseArgs(): { generatorDir: string; defsFile: string; csvPath: string } {
  const args = process.argv.slice(2);
  const flag = (name: string) => {
    const idx = args.indexOf(name);
    return idx >= 0 ? args[idx + 1] : undefined;
  };
  const generatorDir = path.resolve(flag("--generator") ?? process.cwd());
  const defsFile = path.resolve(flag("--defs") ?? path.join(generatorDir, "monster-defs.json"));
  const csvPath = path.resolve(
    flag("--csv") ?? path.join(generatorDir, "assets", "creatures.csv"),
  );
  return { generatorDir, defsFile, csvPath };
}

const { defsFile, csvPath } = parseArgs();
if (!fs.existsSync(defsFile)) {
  console.error(`${defsFile} not found. Run extract-monster-defs.ts first.`);
  process.exit(1);
}
if (!fs.existsSync(csvPath)) {
  console.error(`${csvPath} not found. Pass --csv <path> or --generator <path>.`);
  process.exit(1);
}

const COLUMNS = ["file", "general", "race", "class", "anim", "deathvar", "dialog", "origin", "name"];

const GENERIC_CLASS_RE =
  /^(FIGHTER|CLERIC|MAGE|THIEF|DRUID|RANGER|PALADIN|BARD|MONK|SORCERER|NO_CLASS)(_(FIGHTER|CLERIC|MAGE|THIEF|DRUID|RANGER|PALADIN|BARD|MONK|SORCERER))*$/;

function isGenericClass(value: string): boolean {
  return GENERIC_CLASS_RE.test(value.toUpperCase());
}

const defs: MonsterDef[] = JSON.parse(fs.readFileSync(defsFile, "utf-8"));

// --- Build direct file -> monster map, detecting collisions ---
const fileMap = new Map<string, string>();
const collisions: { file: string; monsters: string[] }[] = [];
for (const def of defs) {
  for (const f of def.files) {
    const key = f.toUpperCase();
    if (fileMap.has(key) && fileMap.get(key) !== def.monster) {
      collisions.push({ file: key, monsters: [fileMap.get(key)!, def.monster] });
    } else {
      fileMap.set(key, def.monster);
    }
  }
}
if (collisions.length) {
  console.log(`WARNING: ${collisions.length} file(s) claimed by multiple active monsters:`);
  for (const c of collisions) console.log(`  ${c.file}: ${c.monsters.join(" vs ")}`);
}

// --- Parse creatures.csv ---
const raw = fs.readFileSync(csvPath, "utf-8");
const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
const header = lines[0];
const hasMonsterIdColumns = header.split(";").includes("MonsterId");

type Row = Record<string, string> & { _line: string };
const rowColumns = hasMonsterIdColumns ? [...COLUMNS, "MonsterId", "ValidatedMonsterId"] : COLUMNS;
const rows: Row[] = lines.slice(1).map((line) => {
  const fields = line.split(";");
  const row = {} as Row;
  rowColumns.forEach((col, idx) => (row[col] = fields[idx] ?? ""));
  row._line = line;
  return row;
});

// Rows already marked ValidatedMonsterId=true are locked: this can mean a direct file match
// from a previous run (deterministic, recomputing is harmless) OR a guess the user manually
// reviewed and confirmed/corrected in an editor (recomputing would silently discard that
// manual work). Either way, leave them untouched and only recompute everything else.
const lockedRows = new Set<Row>(rows.filter((r) => r.ValidatedMonsterId === "true"));
let lockedCount = lockedRows.size;

// --- Pass 1: direct file matches (skips locked rows) ---
let matchedCount = 0;
const monsterIdByRow = new Map<Row, { monster: string; validated: boolean }>();
for (const row of rows) {
  if (lockedRows.has(row)) continue;
  const monster = fileMap.get(row.file.toUpperCase());
  if (monster) {
    monsterIdByRow.set(row, { monster, validated: true });
    matchedCount++;
  }
}

// --- Build reference animation sets from ALL validated rows (locked + freshly matched) ---
const referenceAnims = new Map<string, Set<string>>();
for (const row of rows) {
  const locked = lockedRows.has(row);
  const hit = monsterIdByRow.get(row);
  const monster = locked ? row.MonsterId : hit?.monster;
  if (!monster) continue;
  const anim = row.anim.toUpperCase();
  if (!anim || anim === "NONE") continue;
  if (!referenceAnims.has(monster)) referenceAnims.set(monster, new Set());
  referenceAnims.get(monster)!.add(anim);
}

// --- Pass 2: guesses (race must match; class/anim required as corroborating evidence) ---
let guessedCount = 0;
let ambiguousCount = 0;
const ambiguousReport: { file: string; race: string; candidates: string[] }[] = [];

for (const row of rows) {
  if (lockedRows.has(row) || monsterIdByRow.has(row)) continue;
  if (!row.race) continue;
  const candidates = defs.filter(
    (d) => d.race && d.race.toUpperCase() === row.race.toUpperCase(),
  );
  if (candidates.length === 0) continue;

  let bestScore = -1;
  let bestDefs: MonsterDef[] = [];
  for (const def of candidates) {
    const classMatch = !!(
      def.class &&
      row.class &&
      def.class.toUpperCase() === row.class.toUpperCase()
    );
    const anim = row.anim.toUpperCase();
    const animMatch = !!(anim && anim !== "NONE" && referenceAnims.get(def.monster)?.has(anim));
    // Race alone (or race+general) is too weak a signal to act on: many unrelated CSV rows
    // share a monster's race (e.g. every demon shares Hellcat's race "DEMONIC"). Require at
    // least a class or animation match as corroborating evidence before this candidate is
    // even eligible to be guessed.
    if (!classMatch && !animMatch) continue;

    let score = 0;
    if (classMatch) score += isGenericClass(def.class!) ? 1 : 3;
    if (def.general && row.general && def.general.toUpperCase() === row.general.toUpperCase()) {
      score += 1;
    }
    if (animMatch) score += 2;

    if (score > bestScore) {
      bestScore = score;
      bestDefs = [def];
    } else if (score === bestScore) {
      bestDefs.push(def);
    }
  }
  if (bestDefs.length === 0) continue;

  const ambiguous = bestDefs.length > 1;
  const chosen = bestDefs[0];
  monsterIdByRow.set(row, { monster: chosen.monster, validated: false });
  guessedCount++;
  if (ambiguous) {
    ambiguousCount++;
    ambiguousReport.push({
      file: row.file,
      race: row.race,
      candidates: bestDefs.map((d) => d.monster),
    });
  }
}

// --- Write updated CSV ---
const outLines = [`${COLUMNS.join(";")};MonsterId;ValidatedMonsterId`];
for (const row of rows) {
  const baseFields = COLUMNS.map((c) => row[c]).join(";");
  if (lockedRows.has(row)) {
    outLines.push(`${baseFields};${row.MonsterId};${row.ValidatedMonsterId}`);
    continue;
  }
  const hit = monsterIdByRow.get(row);
  const monsterId = hit?.monster ?? "";
  const validated = hit ? (hit.validated ? "true" : "false") : "";
  outLines.push(`${baseFields};${monsterId};${validated}`);
}
fs.writeFileSync(csvPath, outLines.join("\r\n") + "\r\n");

// --- Summary ---
console.log(`\nTotal rows: ${rows.length}`);
console.log(`  Locked (ValidatedMonsterId=true, left untouched): ${lockedCount}`);
console.log(`  Direct file matches this run (validated=true): ${matchedCount}`);
console.log(`  Guesses this run (validated=false): ${guessedCount}`);
console.log(`    of which ambiguous ties: ${ambiguousCount}`);
console.log(`  No MonsterId: ${rows.length - lockedCount - matchedCount - guessedCount}`);

if (ambiguousReport.length) {
  console.log(`\nAmbiguous guesses (tied candidates, review these first):`);
  for (const a of ambiguousReport) {
    console.log(`  ${a.file} (race=${a.race}): ${a.candidates.join(" / ")}`);
  }
}
