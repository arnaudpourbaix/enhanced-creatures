import * as fs from "fs";
import * as path from "path";
import { buildCreatures, parseCsv, serializeCsv } from "./lib/build-creatures";
import { renderDuplicatesReport } from "./lib/duplicates-report";

// Rebuilds assets/creatures.csv from the two per-game extractions in assets/bg1/ and assets/bg2/.
//
// - Rows are matched by the `file` (resref) column. A file in only one folder is taken as-is.
//   A file in both must match (case-insensitively) on every column except `origin`; if so it
//   collapses to one row (bg1 spelling) with the two origins combined ("bg1origin,bg2origin",
//   deduped when equal). If any other value genuinely differs it is EXCLUDED and written to
//   assets/bg{1,2}-duplicates.csv for manual reconciliation, with the field-level diffs in
//   assets/duplicates-report.md.
// - Only files listed in assets/old-creatures.csv are kept - that file is the curated wanted set.
// - The output adds three columns - `summon` (computed - sex=SUMMONED or allegiance=CONTROLLED or
//   resref ending in SU), `MonsterId` and `ValidatedMonsterId` (carried from old-creatures.csv by
//   `file`) - and moves `name` to the last column (it is unquoted and may contain `;`).
// - assets/build-report.md lists wanted creatures that ended up missing (absent from both
//   folders, or excluded by a conflict) and any MonsterId disagreements in old-creatures.csv.
//
// The bg{1,2}-duplicates.csv and duplicates-report.md are written only if they don't already
// exist - once you've hand-filtered them, re-running this rebuilds creatures.csv without touching
// your work. Pass --force to regenerate them from the full conflict set.
//
// Run: ts-node scripts/build-creatures-csv.ts   (pass --assets <dir> to point elsewhere)

const CREATURES_CSV = "creatures.csv";

function parseArgs(): { assetsDir: string; force: boolean } {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--assets");
  const assetsDir = path.resolve(idx >= 0 ? args[idx + 1] : path.join(process.cwd(), "assets"));
  return { assetsDir, force: args.includes("--force") };
}

function readCsv(file: string) {
  if (!fs.existsSync(file)) {
    console.error(`Missing input: ${file}`);
    process.exit(1);
  }
  return parseCsv(fs.readFileSync(file, "utf-8"));
}

function renderBuildReport(args: {
  written: number;
  missing: string[];
  excludedWanted: string[];
  idConflicts: { file: string; values: string[] }[];
}): string {
  const lines = [
    "# creatures.csv build report",
    "",
    `Rows written: **${args.written}**`,
    "",
    `## Wanted creatures absent from both bg1 and bg2 (${args.missing.length})`,
    "",
    "Not in creatures.csv - old-creatures.csv wants them but neither extraction has them.",
    "",
    ...args.missing.map((f) => `- ${f}`),
    "",
    `## Wanted creatures excluded by a bg1/bg2 conflict (${args.excludedWanted.length})`,
    "",
    "Not in creatures.csv until the conflict is resolved (see duplicates-report.md).",
    "",
    ...args.excludedWanted.map((f) => `- ${f}`),
    "",
    `## MonsterId disagreements within old-creatures.csv (${args.idConflicts.length})`,
    "",
    ...(args.idConflicts.length
      ? args.idConflicts.map((c) => `- ${c.file}: ${c.values.join(" vs ")} (kept the first)`)
      : ["_none_"]),
    "",
  ];
  return lines.join("\n");
}

const { assetsDir, force } = parseArgs();

const bg1 = readCsv(path.join(assetsDir, "bg1", CREATURES_CSV));
const bg2 = readCsv(path.join(assetsDir, "bg2", CREATURES_CSV));
const old = readCsv(path.join(assetsDir, "old-creatures.csv"));

const result = buildCreatures(bg1, bg2, old);

const outPath = path.join(assetsDir, CREATURES_CSV);
fs.writeFileSync(outPath, serializeCsv(result.outputHeader, result.creatures), "utf-8");

fs.writeFileSync(
  path.join(assetsDir, "build-report.md"),
  renderBuildReport({
    written: result.creatures.length,
    missing: result.missing,
    excludedWanted: result.excludedWanted,
    idConflicts: result.idConflicts,
  }),
  "utf-8",
);

const dup1 = path.join(assetsDir, "bg1-duplicates.csv");
const dup2 = path.join(assetsDir, "bg2-duplicates.csv");
const dupsExist = fs.existsSync(dup1) || fs.existsSync(dup2);

if (dupsExist && !force) {
  console.log(
    "bg{1,2}-duplicates.csv already exist - left untouched. Pass --force to regenerate them.",
  );
} else {
  fs.writeFileSync(
    dup1,
    serializeCsv(
      bg1.header,
      result.conflicts.map((c) => c.bg1),
    ),
    "utf-8",
  );
  fs.writeFileSync(
    dup2,
    serializeCsv(
      bg2.header,
      result.conflicts.map((c) => c.bg2),
    ),
    "utf-8",
  );
  fs.writeFileSync(
    path.join(assetsDir, "duplicates-report.md"),
    renderDuplicatesReport(result.conflicts),
    "utf-8",
  );
}

console.log(`Wrote ${result.creatures.length} rows to ${path.relative(process.cwd(), outPath)}`);
console.log(
  `Conflicts: ${result.conflicts.length} (${result.excludedWanted.length} of them wanted)`,
);
console.log(`Wanted files absent from both folders: ${result.missing.length}`);
console.log(`MonsterId disagreements: ${result.idConflicts.length}`);
