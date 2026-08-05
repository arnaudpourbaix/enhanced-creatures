import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import { parseMonsterFilesCsv } from "../lib/src/services/monster-files.service";

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
if (!fs.existsSync(creaturesDir)) {
  console.error(
    `Could not find ${creaturesDir}. Run this from the generator/ directory, or pass --generator <path>.`,
  );
  process.exit(1);
}
if (!fs.existsSync(csvPath)) {
  console.error(`${csvPath} not found. Pass --csv <path> or --generator <path>.`);
  process.exit(1);
}

// Validated files per monster - reuses the exact same parser MonsterFilesService.getFiles() uses
// at runtime, so a hardcoded files: entry is only removed below if it's guaranteed to still be
// supplied by MonsterFilesService afterward (same condition, not a re-derived approximation).
const rawByMonster = parseMonsterFilesCsv(fs.readFileSync(csvPath, "utf-8"));
const validatedFilesByMonster = new Map<string, Set<string>>(
  [...rawByMonster].map(([monster, files]) => [monster, new Set(files.map((f) => f.toUpperCase()))]),
);

const skip = new Set(["monster.ts", "common.ts", "index.ts", "test.ts"]);

let totalRemoved = 0;
let filesChanged = 0;

for (const file of fs.readdirSync(creaturesDir)) {
  if (!file.endsWith(".ts") || skip.has(file)) continue;
  const filePath = path.join(creaturesDir, file);
  const source = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);

  const linesToDelete = new Set<number>();
  const replacements: { start: number; end: number; replacement: string }[] = [];
  const removedNames: string[] = [];

  function visit(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      (node.expression.name.text === "create" || node.expression.name.text === "createFrom") &&
      node.expression.expression.kind === ts.SyntaxKind.ThisKeyword &&
      node.arguments.length === 1 &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      const obj = node.arguments[0];
      const monsterProp = obj.properties.find(
        (p): p is ts.PropertyAssignment =>
          ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === "monster",
      );
      const monsterInit = monsterProp?.initializer;
      const monsterName =
        monsterInit && ts.isPropertyAccessExpression(monsterInit) ? monsterInit.name.text : undefined;
      const validatedFiles = monsterName ? validatedFilesByMonster.get(monsterName) : undefined;

      const filesProp = obj.properties.find(
        (p): p is ts.PropertyAssignment =>
          ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === "files",
      );
      if (validatedFiles && filesProp && ts.isArrayLiteralExpression(filesProp.initializer)) {
        const arrayNode = filesProp.initializer;
        const isMultiline = arrayNode.getText(sourceFile).includes("\n");
        const elements = arrayNode.elements;
        const stringElements = elements.filter(ts.isStringLiteral);
        const matched = stringElements.filter((e) => validatedFiles.has(e.text.toUpperCase()));

        if (matched.length) {
          removedNames.push(...matched.map((e) => e.text));
          if (isMultiline) {
            for (const el of matched) {
              const { line } = sourceFile.getLineAndCharacterOfPosition(el.getStart(sourceFile));
              linesToDelete.add(line);
            }
          } else {
            // Reconstruct the interior from only the kept elements in one shot, rather than
            // deleting each matched element's span individually - adjacent matched elements'
            // spans would otherwise overlap (each claiming the same separating comma).
            const matchedSet = new Set<ts.Expression>(matched);
            const kept = elements.filter((e) => !matchedSet.has(e));
            const interiorStart = arrayNode.getStart(sourceFile) + 1;
            const interiorEnd = arrayNode.getEnd() - 1;
            const replacement = kept.map((e) => e.getText(sourceFile)).join(", ");
            replacements.push({ start: interiorStart, end: interiorEnd, replacement });
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  if (!removedNames.length) continue;

  let text = source;
  for (const { start, end, replacement } of [...replacements].sort((a, b) => b.start - a.start)) {
    text = text.slice(0, start) + replacement + text.slice(end);
  }
  if (linesToDelete.size) {
    text = text
      .split(/\r?\n/)
      .filter((_, i) => !linesToDelete.has(i))
      .join("\n");
  }

  fs.writeFileSync(filePath, text);
  filesChanged++;
  totalRemoved += removedNames.length;
  console.log(`${file}: removed ${removedNames.length} (${removedNames.join(", ")})`);
}

console.log(
  `\nDone. Removed ${totalRemoved} filename(s) now covered by creatures.csv, across ${filesChanged} file(s).`,
);
console.log(`Run "npm run format" next to clean up any now-empty multi-line files: [] arrays.`);
