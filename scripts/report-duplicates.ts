import * as fs from "fs";
import * as path from "path";
import { parseCsv } from "./lib/build-creatures";
import { levelDiffs, pairConflicts, renderDuplicatesReport } from "./lib/duplicates-report";

// Regenerates assets/duplicates-report.md from assets/bg1-duplicates.csv and
// assets/bg2-duplicates.csv as they currently stand on disk. Run this after hand-filtering those
// two files (removing rows you've decided about) so the report reflects only the conflicts still
// open. build-creatures-csv.ts writes the same report from the full, freshly merged set.
//
// Run: ts-node scripts/report-duplicates.ts   (pass --assets <dir> to point elsewhere)

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

const bg1 = readCsv(path.join(assetsDir, "bg1-duplicates.csv"));
const bg2 = readCsv(path.join(assetsDir, "bg2-duplicates.csv"));

const conflicts = pairConflicts(bg1, bg2);
const reportPath = path.join(assetsDir, "duplicates-report.md");
fs.writeFileSync(reportPath, renderDuplicatesReport(conflicts), "utf-8");

const bg1Only = bg1.rows.filter((r) => !bg2.rows.some((o) => o.file === r.file)).map((r) => r.file);
const bg2Only = bg2.rows.filter((r) => !bg1.rows.some((o) => o.file === r.file)).map((r) => r.file);

console.log(`Wrote ${conflicts.length} conflict(s) to ${path.relative(process.cwd(), reportPath)}`);
console.log(`Level differences: ${levelDiffs(conflicts).length}`);
if (bg1Only.length) console.log(`Only in bg1-duplicates.csv: ${bg1Only.join(", ")}`);
if (bg2Only.length) console.log(`Only in bg2-duplicates.csv: ${bg2Only.join(", ")}`);
