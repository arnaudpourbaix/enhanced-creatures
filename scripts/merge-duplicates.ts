import * as fs from "fs";
import * as path from "path";
import {
  applyGameColumn,
  CARRIED_COLUMNS,
  GAME_COLUMN,
  parseCsv,
  serializeCsv,
} from "./lib/build-creatures";

// Folds the two hand-filtered duplicates files back into creatures.csv, adding a `game` column:
// existing rows keep it empty (the creature is identical in both games), every bg1-duplicates row
// is appended with game=bg1 and every bg2-duplicates row with game=bg2. Run this after filtering
// bg{1,2}-duplicates.csv and running add-duplicate-columns.ts. Safe to re-run: game-tagged rows
// already in creatures.csv are dropped and rebuilt from the current duplicates files.
//
// Run: ts-node scripts/merge-duplicates.ts   (pass --assets <dir> to point elsewhere)

function parseArgs(): { assetsDir: string } {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--assets");
  const assetsDir = path.resolve(idx >= 0 ? args[idx + 1] : path.join(process.cwd(), "assets"));
  return { assetsDir };
}

function readCsv(file: string) {
  if (!fs.existsSync(file)) {
    console.error(`Missing input: ${file}`);
    process.exit(1);
  }
  return parseCsv(fs.readFileSync(file, "utf-8"));
}

const { assetsDir } = parseArgs();

const creaturesPath = path.join(assetsDir, "creatures.csv");
const base = readCsv(creaturesPath);
const bg1Dups = readCsv(path.join(assetsDir, "bg1-duplicates.csv"));
const bg2Dups = readCsv(path.join(assetsDir, "bg2-duplicates.csv"));

for (const [name, csv] of [
  ["bg1-duplicates.csv", bg1Dups],
  ["bg2-duplicates.csv", bg2Dups],
] as const) {
  const missing = CARRIED_COLUMNS.filter((c) => !csv.header.includes(c));
  if (missing.length > 0) {
    console.error(`${name} is missing ${missing.join(", ")} - run add-duplicate-columns.ts first.`);
    process.exit(1);
  }
}

const b1Files = new Set(bg1Dups.rows.map((r) => r.file));
const b2Files = new Set(bg2Dups.rows.map((r) => r.file));
const onlyB1 = [...b1Files].filter((f) => !b2Files.has(f));
const onlyB2 = [...b2Files].filter((f) => !b1Files.has(f));
if (onlyB1.length) console.warn(`Only in bg1-duplicates.csv: ${onlyB1.join(", ")}`);
if (onlyB2.length) console.warn(`Only in bg2-duplicates.csv: ${onlyB2.join(", ")}`);

const { header, rows } = applyGameColumn(base, bg1Dups, bg2Dups);
fs.writeFileSync(creaturesPath, serializeCsv(header, rows), "utf-8");

const baseCount = rows.filter((r) => r[GAME_COLUMN] === "").length;
console.log(
  `Wrote ${rows.length} rows to ${path.relative(process.cwd(), creaturesPath)}: ` +
    `${baseCount} both-games + ${bg1Dups.rows.length} bg1 + ${bg2Dups.rows.length} bg2.`,
);
