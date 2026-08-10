import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

// Cross-checks every setAdjustments() entry with summon:true against creatures.csv's "summon"
// column (see build-summon.ts), and separately flags "pure" summon-only entries (no other keys
// besides files/summon) - those are redundant with the CSV column and are removal candidates,
// but only once verified to agree with the CSV.

interface AdjustmentEntry {
  familyFile: string;
  method: string;
  files: string[];
  summon: boolean;
  otherKeys: string[];
}

function parseArgs(): { generatorDir: string; csvPath: string } {
  const args = process.argv.slice(2);
  const flag = (name: string) => {
    const idx = args.indexOf(name);
    return idx >= 0 ? args[idx + 1] : undefined;
  };
  const generatorDir = path.resolve(flag("--generator") ?? process.cwd());
  const csvPath = path.resolve(
    flag("--csv") ?? path.join(generatorDir, "assets", "creatures.csv"),
  );
  return { generatorDir, csvPath };
}

const { generatorDir, csvPath } = parseArgs();
const creaturesDir = path.join(generatorDir, "lib", "creatures");

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ATWEAKS_CREATURES: Record<string, string> = require("../lib/config/creatures").ATWEAKS_CREATURES;

function getStringArray(node: ts.Expression | undefined): string[] {
  if (!node || !ts.isArrayLiteralExpression(node)) return [];
  return node.elements
    .map((e) => {
      if (ts.isStringLiteral(e)) return e.text;
      if (
        ts.isPropertyAccessExpression(e) &&
        ts.isIdentifier(e.expression) &&
        e.expression.text === "ATWEAKS_CREATURES"
      ) {
        return ATWEAKS_CREATURES[e.name.text];
      }
      return undefined;
    })
    .filter((f): f is string => !!f);
}

function enclosingMethodName(node: ts.Node): string {
  let cur: ts.Node | undefined = node;
  while (cur) {
    if (ts.isMethodDeclaration(cur) && ts.isIdentifier(cur.name)) return cur.name.text;
    cur = cur.parent;
  }
  return "?";
}

const entries: AdjustmentEntry[] = [];
const skip = new Set(["monster.ts", "common.ts", "index.ts", "test.ts"]);

for (const file of fs.readdirSync(creaturesDir)) {
  if (!file.endsWith(".ts") || skip.has(file)) continue;
  const filePath = path.join(creaturesDir, file);
  const source = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "setAdjustments" &&
      node.arguments.length === 1 &&
      ts.isArrayLiteralExpression(node.arguments[0])
    ) {
      const method = enclosingMethodName(node);
      for (const el of node.arguments[0].elements) {
        if (!ts.isObjectLiteralExpression(el)) continue;
        const propNames = el.properties
          .map((p) => (p.name && ts.isIdentifier(p.name) ? p.name.text : undefined))
          .filter((n): n is string => !!n);
        const filesProp = el.properties.find(
          (p): p is ts.PropertyAssignment =>
            ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === "files",
        );
        const summonProp = el.properties.find(
          (p): p is ts.PropertyAssignment =>
            ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === "summon",
        );
        const summon =
          !!summonProp &&
          summonProp.initializer.kind === ts.SyntaxKind.TrueKeyword;
        if (!summon) continue; // only entries that actually set summon:true matter here
        entries.push({
          familyFile: file,
          method,
          files: getStringArray(filesProp?.initializer),
          summon,
          otherKeys: propNames.filter((n) => n !== "files" && n !== "summon"),
        });
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

// --- Load creatures.csv summon column ---
const raw = fs.readFileSync(csvPath, "utf-8");
const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
const header = lines[0].split(";");
const fileIdx = header.indexOf("file");
const summonIdx = header.indexOf("summon");
if (fileIdx < 0 || summonIdx < 0) {
  console.error(`creatures.csv is missing "file" or "summon" column. Run build-summon.ts first.`);
  process.exit(1);
}
const csvSummon = new Map<string, boolean>();
for (const line of lines.slice(1)) {
  const fields = line.split(";");
  const file = (fields[fileIdx] ?? "").toUpperCase();
  if (!file) continue;
  const isSummon = (fields[summonIdx] ?? "").toLowerCase() === "true";
  // A file can appear multiple times (different origin mods); true wins if any row says true.
  csvSummon.set(file, (csvSummon.get(file) ?? false) || isSummon);
}

// --- Report mismatches: code says summon:true but CSV disagrees (or file not in CSV at all) ---
const mismatches: { familyFile: string; method: string; file: string; csvStatus: string }[] = [];
for (const entry of entries) {
  for (const file of entry.files) {
    const key = file.toUpperCase();
    if (!csvSummon.has(key)) {
      mismatches.push({ familyFile: entry.familyFile, method: entry.method, file, csvStatus: "NOT IN CSV" });
    } else if (csvSummon.get(key) !== true) {
      mismatches.push({ familyFile: entry.familyFile, method: entry.method, file, csvStatus: "summon=false in CSV" });
    }
  }
}

console.log(`Scanned ${entries.length} setAdjustments entries with summon:true.`);
console.log(`\n=== MISMATCHES (code says summon:true, CSV disagrees) ===`);
if (!mismatches.length) {
  console.log("None. Every summon:true file agrees with creatures.csv.");
} else {
  for (const m of mismatches) {
    console.log(`  ${m.familyFile} :: ${m.method} :: ${m.file} -> ${m.csvStatus}`);
  }
}

// --- Pure summon-only entries (no other keys): removal candidates ---
const pureEntries = entries.filter((e) => e.otherKeys.length === 0);
const mixedEntries = entries.filter((e) => e.otherKeys.length > 0);

console.log(`\n=== PURE summon-only entries (candidates for removal): ${pureEntries.length} ===`);
for (const e of pureEntries) {
  const allOk = e.files.every((f) => csvSummon.get(f.toUpperCase()) === true);
  console.log(`  ${e.familyFile} :: ${e.method} :: [${e.files.join(", ")}] ${allOk ? "OK" : "MISMATCH - do not remove blindly"}`);
}

console.log(`\n=== MIXED entries (summon:true + other data, kept as-is): ${mixedEntries.length} ===`);
for (const e of mixedEntries) {
  console.log(`  ${e.familyFile} :: ${e.method} :: [${e.files.join(", ")}] otherKeys=[${e.otherKeys.join(", ")}]`);
}
