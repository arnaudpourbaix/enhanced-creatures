import * as fs from "fs";
import * as path from "path";
import {
  attachCarriedColumns,
  CARRIED_COLUMNS,
  indexMonsterIds,
  parseCsv,
  serializeCsv,
  withNameLast,
  type MonsterIds,
} from "./lib/build-creatures";

// Adds (or refreshes) the three columns creatures.csv carries beyond the raw extraction schema -
// `summon`, `MonsterId`, `ValidatedMonsterId` - on assets/bg1-duplicates.csv and
// assets/bg2-duplicates.csv, so a row lifted out of those files during conflict resolution is
// already in the final creatures.csv shape. `summon` is computed from each row; the two ids are
// looked up by `file` in old-creatures.csv. `name` is moved to the last column. Safe to re-run.
//
// If old-creatures.csv is gone but both files already carry the three columns, it only re-orders
// them (name last) and leaves the values as they are.
//
// Run: ts-node scripts/add-duplicate-columns.ts   (pass --assets <dir> to point elsewhere)

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
const files = ["bg1-duplicates.csv", "bg2-duplicates.csv"];

const oldPath = path.join(assetsDir, "old-creatures.csv");
let monsterIds: Map<string, MonsterIds> | undefined;
if (fs.existsSync(oldPath)) {
  monsterIds = indexMonsterIds(parseCsv(fs.readFileSync(oldPath, "utf-8")).rows).byFile;
} else {
  const missing = files.filter((name) => {
    const header = readCsv(path.join(assetsDir, name)).header;
    return CARRIED_COLUMNS.some((c) => !header.includes(c));
  });
  if (missing.length > 0) {
    console.error(
      `old-creatures.csv not found and ${missing.join(", ")} still lack the carried columns - ` +
        "restore old-creatures.csv to populate them.",
    );
    process.exit(1);
  }
  console.warn("old-creatures.csv not found - only re-ordering columns, values left as they are.");
}

for (const name of files) {
  const file = path.join(assetsDir, name);
  const csv = readCsv(file);
  const header = withNameLast([
    ...csv.header,
    ...CARRIED_COLUMNS.filter((c) => !csv.header.includes(c)),
  ]);
  const rows = monsterIds ? attachCarriedColumns(csv.rows, monsterIds) : csv.rows;
  fs.writeFileSync(file, serializeCsv(header, rows), "utf-8");

  const withId = rows.filter((r) => r.MonsterId).length;
  const summons = rows.filter((r) => r.summon === "true").length;
  console.log(`${name}: ${rows.length} rows - ${summons} summon, ${withId} with a MonsterId`);
}
