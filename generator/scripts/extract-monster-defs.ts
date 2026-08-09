import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

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

function parseArgs(): { generatorDir: string; outFile: string } {
  const args = process.argv.slice(2);
  const flag = (name: string) => {
    const idx = args.indexOf(name);
    return idx >= 0 ? args[idx + 1] : undefined;
  };
  const generatorDir = path.resolve(flag("--generator") ?? process.cwd());
  const outFile = path.resolve(flag("--out") ?? path.join(generatorDir, "monster-defs.json"));
  return { generatorDir, outFile };
}

const { generatorDir, outFile } = parseArgs();
const creaturesDir = path.join(generatorDir, "lib", "creatures");
if (!fs.existsSync(creaturesDir)) {
  console.error(
    `Could not find ${creaturesDir}. Run this from the generator/ directory of the target ` +
      `project, or pass --generator <path-to-generator>.`,
  );
  process.exit(1);
}

const skip = new Set(["monster.ts", "common.ts", "index.ts", "test.ts"]);

function getStringArray(node: ts.Expression | undefined): string[] {
  if (!node || !ts.isArrayLiteralExpression(node)) return [];
  return node.elements.filter(ts.isStringLiteral).map((e) => e.text);
}

function getProp(obj: ts.ObjectLiteralExpression, name: string): ts.Expression | undefined {
  const prop = obj.properties.find(
    (p): p is ts.PropertyAssignment =>
      ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === name,
  );
  return prop?.initializer;
}

function getStringProp(obj: ts.ObjectLiteralExpression, name: string): string | undefined {
  const init = getProp(obj, name);
  return init && ts.isStringLiteral(init) ? init.text : undefined;
}

function enclosingMethodName(node: ts.Node): string | undefined {
  let cur: ts.Node | undefined = node;
  while (cur) {
    if (ts.isMethodDeclaration(cur) && ts.isIdentifier(cur.name)) return cur.name.text;
    cur = cur.parent;
  }
  return undefined;
}

const results: MonsterDef[] = [];
const excludedInactive: { family: string; method: string; monster: string }[] = [];

for (const file of fs.readdirSync(creaturesDir)) {
  if (!file.endsWith(".ts") || skip.has(file)) continue;
  const filePath = path.join(creaturesDir, file);
  const source = fs.readFileSync(filePath, "utf-8");
  const sourceFile = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);

  // Active methods = those actually invoked (non-commented) as
  // this.addCreature(() => this.xxx()) in the family's constructor. Commented-out lines never
  // become AST nodes, so this naturally excludes unfinished/disabled monster definitions.
  const activeMethods = new Set<string>();
  function collectActive(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "addCreature" &&
      node.arguments.length === 1 &&
      ts.isArrowFunction(node.arguments[0]) &&
      ts.isCallExpression(node.arguments[0].body) &&
      ts.isPropertyAccessExpression(node.arguments[0].body.expression)
    ) {
      activeMethods.add(node.arguments[0].body.expression.name.text);
    }
    ts.forEachChild(node, collectActive);
  }
  collectActive(sourceFile);

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
      const monsterInit = getProp(obj, "monster");
      let monsterName: string | undefined;
      if (monsterInit && ts.isPropertyAccessExpression(monsterInit)) {
        monsterName = monsterInit.name.text;
      }
      const method = enclosingMethodName(node) ?? "?";
      if (monsterName) {
        if (!activeMethods.has(method)) {
          excludedInactive.push({ family: file, method, monster: monsterName });
        } else {
          const files = getStringArray(getProp(obj, "files"));
          const notEnforceFiles = getStringArray(getProp(obj, "notEnforceFiles"));
          const dataInit = getProp(obj, "data");
          let general: string | undefined;
          let race: string | undefined;
          let klass: string | undefined;
          if (dataInit && ts.isObjectLiteralExpression(dataInit)) {
            general = getStringProp(dataInit, "general");
            race = getStringProp(dataInit, "race");
            klass = getStringProp(dataInit, "class");
          }
          results.push({
            monster: monsterName,
            family: file,
            method,
            files,
            notEnforceFiles,
            general,
            race,
            class: klass,
          });
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);
}

// Manually resolved createFrom() cases: general/race/class inherited from the cloned
// creature plus any explicit override via a chained .setData() call right after creation.
// createFrom() call sites aren't otherwise walked for data - if a target project adds new
// createFrom() monsters, add their resolved general/race/class here too.
const createFromOverrides: Record<string, { general: string; race: string; class: string }> = {
  BattleHorror: { general: "MONSTER", race: "GOLEM", class: "FIGHTER_MAGE" },
  DoomSayer: { general: "MONSTER", race: "GOLEM", class: "FIGHTER_MAGE" },
  BabyWyvern: { general: "MONSTER", race: "WYVERN", class: "WYVERN" },
  GreaterWyvern: { general: "MONSTER", race: "WYVERN", class: "WYVERN" },
};
for (const def of results) {
  const override = createFromOverrides[def.monster];
  if (override && (!def.general || !def.race || !def.class)) {
    Object.assign(def, override);
  }
}

fs.writeFileSync(outFile, JSON.stringify(results, null, 2));

console.log(`Extracted ${results.length} active monster definitions -> ${outFile}`);
if (excludedInactive.length) {
  console.log(
    `Excluded ${excludedInactive.length} inactive/unfinished (commented out in constructor):`,
  );
  for (const m of excludedInactive) console.log(`  ${m.family} :: ${m.monster} (${m.method})`);
}
const missingData = results.filter((r) => !r.general || !r.race || !r.class);
if (missingData.length) {
  console.log(`WARNING: ${missingData.length} entries missing general/race/class:`);
  for (const m of missingData) console.log(`  ${m.family} :: ${m.monster}`);
}
