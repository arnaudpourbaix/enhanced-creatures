import * as fs from "fs";
import * as path from "path";

// Adds/refreshes the "summon" column on creatures.csv. A row counts as a summon if the real
// extracted CRE data says so (sex=SUMMONED or allegiance=CONTROLLED), or if its filename ends in
// SU - reviewed by hand against the whole CSV (see check-summon-naming.ts) and confirmed to have
// zero false positives, so the naming convention alone is trusted here too.

function parseArgs(): { csvPath: string } {
  const args = process.argv.slice(2);
  const flag = (name: string) => {
    const idx = args.indexOf(name);
    return idx >= 0 ? args[idx + 1] : undefined;
  };
  const generatorDir = path.resolve(flag("--generator") ?? process.cwd());
  const csvPath = path.resolve(
    flag("--csv") ?? path.join(generatorDir, "assets", "creatures.csv"),
  );
  return { csvPath };
}

const { csvPath } = parseArgs();
if (!fs.existsSync(csvPath)) {
  console.error(`${csvPath} not found. Pass --csv <path> or --generator <path>.`);
  process.exit(1);
}

const raw = fs.readFileSync(csvPath, "utf-8");
const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
const header = lines[0].split(";");

const fileIdx = header.indexOf("file");
const sexIdx = header.indexOf("sex");
const allegianceIdx = header.indexOf("allegiance");
const nameIdx = header.indexOf("name");
if (fileIdx < 0 || sexIdx < 0 || allegianceIdx < 0 || nameIdx < 0) {
  console.error(`creatures.csv is missing one of: file, sex, allegiance, name.`);
  process.exit(1);
}

let summonIdx = header.indexOf("summon");
const isNewColumn = summonIdx < 0;
if (isNewColumn) {
  summonIdx = nameIdx + 1;
  header.splice(summonIdx, 0, "summon");
}

let summonCount = 0;
const outLines = [header.join(";")];
for (const line of lines.slice(1)) {
  const fields = line.split(";");
  const file = fields[fileIdx] ?? "";
  const sex = (fields[sexIdx] ?? "").toUpperCase();
  const allegiance = (fields[allegianceIdx] ?? "").toUpperCase();
  const isSummon = sex === "SUMMONED" || allegiance === "CONTROLLED" || file.toUpperCase().endsWith("SU");
  if (isSummon) summonCount++;
  if (isNewColumn) {
    fields.splice(summonIdx, 0, isSummon ? "true" : "");
  } else {
    fields[summonIdx] = isSummon ? "true" : "";
  }
  outLines.push(fields.join(";"));
}

fs.writeFileSync(csvPath, outLines.join("\r\n") + "\r\n");

console.log(`Checked ${lines.length - 1} rows.`);
console.log(`Marked ${summonCount} row(s) as summon=true.`);
console.log(isNewColumn ? `Added new "summon" column.` : `Refreshed existing "summon" column.`);
