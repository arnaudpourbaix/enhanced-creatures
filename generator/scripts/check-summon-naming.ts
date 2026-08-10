import * as fs from "fs";
import * as path from "path";

// Cross-checks the "-SU filename suffix implies a summon" convention against the real
// sex/allegiance data extracted into creatures.csv: sex=SUMMONED or allegiance=CONTROLLED is
// ground truth for "this row is a summon". Lists every row whose file ends in SU but has
// neither flag set, so each can be reviewed by hand (either the row isn't really a summon, or
// its sex/allegiance data is missing/wrong).

function parseArgs(): { generatorDir: string; csvPath: string; outPath: string } {
  const args = process.argv.slice(2);
  const flag = (name: string) => {
    const idx = args.indexOf(name);
    return idx >= 0 ? args[idx + 1] : undefined;
  };
  const generatorDir = path.resolve(flag("--generator") ?? process.cwd());
  const csvPath = path.resolve(
    flag("--csv") ?? path.join(generatorDir, "assets", "creatures.csv"),
  );
  const outPath = path.resolve(
    flag("--out") ?? path.join(generatorDir, "summon-naming-mismatches.txt"),
  );
  return { generatorDir, csvPath, outPath };
}

const { csvPath, outPath } = parseArgs();
if (!fs.existsSync(csvPath)) {
  console.error(`${csvPath} not found. Pass --csv <path> or --generator <path>.`);
  process.exit(1);
}

const raw = fs.readFileSync(csvPath, "utf-8");
const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
const header = lines[0].split(";");
const idx = (col: string) => {
  const i = header.indexOf(col);
  if (i < 0) throw new Error(`creatures.csv is missing the "${col}" column.`);
  return i;
};
const fileIdx = idx("file");
const sexIdx = idx("sex");
const allegianceIdx = idx("allegiance");
const nameIdx = idx("name");
const generalIdx = idx("general");
const raceIdx = idx("race");
const classIdx = idx("class");
const monsterIdIdx = idx("MonsterId");

const mismatches: string[] = [];
for (const line of lines.slice(1)) {
  const fields = line.split(";");
  const file = fields[fileIdx] ?? "";
  if (!file.toUpperCase().endsWith("SU")) continue;
  const sex = (fields[sexIdx] ?? "").toUpperCase();
  const allegiance = (fields[allegianceIdx] ?? "").toUpperCase();
  if (sex === "SUMMONED" || allegiance === "CONTROLLED") continue;
  mismatches.push(
    [
      file,
      fields[nameIdx] ?? "",
      fields[generalIdx] ?? "",
      fields[raceIdx] ?? "",
      fields[classIdx] ?? "",
      fields[monsterIdIdx] ?? "",
    ].join(";"),
  );
}

const outLines = [
  "file;name;general;race;class;MonsterId",
  ...mismatches,
];
fs.writeFileSync(outPath, outLines.join("\r\n") + "\r\n");

console.log(`Checked ${lines.length - 1} rows.`);
console.log(
  `Found ${mismatches.length} row(s) with a -SU filename but no sex=SUMMONED or allegiance=CONTROLLED.`,
);
console.log(`Written to ${outPath}`);
