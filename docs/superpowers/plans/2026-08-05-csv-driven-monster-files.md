# CSV-driven monster files: Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make `generator/assets/creatures.csv` (validated rows only) the primary source for each monster's `files:` list, with the hand-authored arrays in `generator/lib/creatures/*.ts` kept only as a backup for filenames the CSV doesn't know about.

**Architecture:** A new `MonsterFilesService` parses `creatures.csv` once and exposes the validated files per monster. `CreatureFamily.create()`/`createFrom()` merge that with whatever hand-authored `files:` array is still passed in (deduped, CSV first). A one-off codemod then trims every hardcoded `files:` array down to just the entries absent from the CSV, since anything present is now supplied automatically.

**Tech Stack:** TypeScript, ts-node, vitest, TypeScript Compiler API (`typescript` package, already a dependency, already used the same way in `generator/scripts/extract-monster-defs.ts`).

## Global Constraints

- Only `creatures.csv` rows with `ValidatedMonsterId === "true"` may feed the generator — never unvalidated guesses. A wrong guess must never drive a real `.cre` file patch.
- `setAdjustments()` and `notEnforceFiles` are completely out of scope — untouched by both the runtime change and the migration script.
- No mass-edit is "safe" until `family.ts` already merges in CSV files — the trim task (Task 3) MUST run after Task 2, never before, or trimmed filenames would silently stop being generated.
- Full test suite (`npm test`) and build (`npm run build`) must pass at the end of every task.
- Lint: `tsconfig.eslint.json` only ever included `lib/**/*.ts` (pre-existing, predates this plan —
  `generator/scripts/build-monster-id.ts` and `extract-monster-defs.ts` were never added to it
  either, and linting them for the first time surfaces ~20 unrelated pre-existing violations, not
  something this plan should absorb). Task 1/2 touch only `lib/`, so lint those specific files with
  `npx eslint <path>` (not a blanket `npm run lint`, which also reports one unrelated pre-existing
  `lib/translations/i18n.ts` failure and, once Task 3 lands, parsing errors on every `scripts/*.ts`
  file — none of that is this plan's to fix). Task 3's new `scripts/trim-monster-files.ts` is not
  lint-checked at all, consistent with the other two scripts already there.

---

### Task 1: MonsterFilesService — parse creatures.csv, expose validated files per monster

**Files:**
- Create: `generator/lib/src/services/monster-files.service.ts`
- Test: `generator/lib/src/services/monster-files.service.test.ts`

**Interfaces:**
- Produces: `export function parseMonsterFilesCsv(raw: string): Map<string, string[]>` — pure CSV-text-to-map parser, keyed by `MonsterId`, values are that monster's validated `file` column entries in CSV row order.
- Produces: default export `monsterFilesService` (singleton instance of `MonsterFilesService`) with `getFiles(monster: MonsterEnum): string[]` — reads `assets/creatures.csv` (relative to cwd, same convention as `changelog.service.ts`'s `fs.readFileSync("lib/templates/changelog.html")`), memoized after first call, returns `[]` if the monster has no validated rows.
- Consumes: `MonsterEnum` from `../../creatures/monster` (same relative path `main.service.ts` already uses from this directory).

- [ ] **Step 1: Write the failing tests for `parseMonsterFilesCsv`**

Create `generator/lib/src/services/monster-files.service.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { MonsterEnum } from "../../creatures/monster";
import monsterFilesService, { parseMonsterFilesCsv } from "./monster-files.service";

const HEADER =
  "file;general;race;class;anim;deathvar;dialog;origin;name;MonsterId;ValidatedMonsterId";

describe("parseMonsterFilesCsv", () => {
  it("groups validated files under their MonsterId, in row order", () => {
    const csv = [
      HEADER,
      "ANKHEG;MONSTER;ANKHEG;ANKHEG;ANKHEG;ankheg;;VIENXAY;Ankheg;Ankheg;true",
      "BDNEO;MONSTER;ANKHEG;ANKHEG;ANKHEG;bdneo;;BD;Ankheg;Ankheg;true",
    ].join("\n");

    const result = parseMonsterFilesCsv(csv);

    expect(result.get("Ankheg")).toEqual(["ANKHEG", "BDNEO"]);
  });

  it("excludes rows that aren't validated or aren't mapped to a monster", () => {
    const csv = [
      HEADER,
      "GUESS1;MONSTER;WOLF;WOLF;WOLF;guess1;;BD;Wolf guess;Wolf;false",
      "BLANK1;MONSTER;WOLF;WOLF;WOLF;blank1;;BD;Wolf blank;;",
    ].join("\n");

    const result = parseMonsterFilesCsv(csv);

    expect(result.has("Wolf")).toBe(false);
  });

  it("returns an empty map for a header-only CSV", () => {
    const result = parseMonsterFilesCsv(HEADER);

    expect(result.size).toBe(0);
  });
});

describe("monsterFilesService.getFiles", () => {
  it("returns the validated creatures.csv files for a known monster", () => {
    const files = monsterFilesService.getFiles(MonsterEnum.Ankheg);

    expect(files).toEqual(expect.arrayContaining(["ANKHEG", "BDNEO", "BDANKH01"]));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- monster-files.service` (from `generator/`)
Expected: FAIL — `Cannot find module './monster-files.service'`

- [ ] **Step 3: Implement `monster-files.service.ts`**

Create `generator/lib/src/services/monster-files.service.ts`:

```typescript
import * as fs from "fs";
import { MonsterEnum } from "../../creatures/monster";

const CSV_PATH = "assets/creatures.csv";
const FILE_COLUMN = "file";
const MONSTER_ID_COLUMN = "MonsterId";
const VALIDATED_COLUMN = "ValidatedMonsterId";

export function parseMonsterFilesCsv(raw: string): Map<string, string[]> {
  const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
  const header = lines[0].split(";");
  const fileIdx = header.indexOf(FILE_COLUMN);
  const monsterIdIdx = header.indexOf(MONSTER_ID_COLUMN);
  const validatedIdx = header.indexOf(VALIDATED_COLUMN);

  const result = new Map<string, string[]>();
  for (const line of lines.slice(1)) {
    const fields = line.split(";");
    const validated = fields[validatedIdx] ?? "";
    const monsterId = fields[monsterIdIdx] ?? "";
    if (validated !== "true" || !monsterId) continue;
    const file = fields[fileIdx] ?? "";
    const existing = result.get(monsterId);
    if (existing) existing.push(file);
    else result.set(monsterId, [file]);
  }
  return result;
}

class MonsterFilesService {
  private filesByMonster?: Map<string, string[]>;

  getFiles(monster: MonsterEnum): string[] {
    this.filesByMonster ??= parseMonsterFilesCsv(fs.readFileSync(CSV_PATH, "utf-8"));
    return this.filesByMonster.get(MonsterEnum[monster]) ?? [];
  }
}

const monsterFilesService = new MonsterFilesService();
export default monsterFilesService;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- monster-files.service` (from `generator/`)
Expected: PASS (4 tests)

- [ ] **Step 5: Lint the new files**

Run (from `generator/`): `npx eslint lib/src/services/monster-files.service.ts lib/src/services/monster-files.service.test.ts`
Expected: exit 0, no output. (Not `npm run lint` — see Global Constraints: that also reports
unrelated pre-existing failures outside this task's files.)

- [ ] **Step 6: Verify the build still passes**

Run (from `generator/`): `npm run build`
Expected: exit 0, no output.

- [ ] **Step 7: Commit**

```bash
git add generator/lib/src/services/monster-files.service.ts generator/lib/src/services/monster-files.service.test.ts
git commit -m "feat: add MonsterFilesService to read validated files from creatures.csv"
```

---

### Task 2: Wire `create()`/`createFrom()` to merge CSV files with the backup list

**Files:**
- Modify: `generator/lib/src/model/creature/family.ts:1-98`
- Test: `generator/lib/src/model/creature/family.test.ts`

**Interfaces:**
- Consumes: `monsterFilesService.getFiles(monster: MonsterEnum): string[]` from Task 1.
- Produces: `create()`'s and `createFrom()`'s `files` parameter becomes optional (`files?: string[]`); `cre.files` is now `[...monsterFilesService.getFiles(monster), ...(files ?? [])]` deduped. No other consumer of `cre.files` changes — `weidu-creature.service.ts`, `creature.factory.ts`'s existing collision check, etc. all keep working unmodified since they only read `creature.files`.

- [ ] **Step 1: Write the failing tests**

Add to `generator/lib/src/model/creature/family.test.ts` (`MonsterEnum` is already imported there;
add these two new imports to the existing import block, then the new `describe` blocks at the end
of the file):

```typescript
import { TranslationKey } from "../../../translations/i18n";
import { InputMainCreatureData } from "./data-input";
```

```typescript
describe("create (files resolution)", () => {
  it("merges creatures.csv-validated files with the hand-authored backup list, deduped", () => {
    const family = fakeFamily();

    const cre = family.create({
      name: "common.creatureTraits" as TranslationKey,
      monster: MonsterEnum.Ankheg,
      files: ["ANKHEG", "SOME_BACKUP_FILE"],
      data: {} as unknown as InputMainCreatureData,
    });

    expect(cre.files).toEqual(
      expect.arrayContaining(["ANKHEG", "BDNEO", "BDANKH01", "SOME_BACKUP_FILE"]),
    );
    expect(cre.files.filter((f) => f === "ANKHEG")).toHaveLength(1);
  });

  it("works with no backup files at all", () => {
    const family = fakeFamily();

    const cre = family.create({
      name: "common.creatureTraits" as TranslationKey,
      monster: MonsterEnum.Ankheg,
      data: {} as unknown as InputMainCreatureData,
    });

    expect(cre.files).toEqual(expect.arrayContaining(["ANKHEG", "BDNEO"]));
  });
});

describe("createFrom (files resolution)", () => {
  it("merges creatures.csv-validated files with the hand-authored backup list, deduped", () => {
    const family = fakeFamily();
    const from = {
      data: { movement: {} },
      attack: { dualWielding: false },
    } as unknown as Creature;

    const cre = family.createFrom({
      name: "common.creatureTraits" as TranslationKey,
      from,
      monster: MonsterEnum.Ankheg,
      files: ["SOME_BACKUP_FILE"],
    });

    expect(cre.files).toEqual(expect.arrayContaining(["ANKHEG", "BDNEO", "SOME_BACKUP_FILE"]));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npm test -- family.test` (from `generator/`)
Expected: FAIL — `cre.files` only contains `["ANKHEG", "SOME_BACKUP_FILE"]` / `[]` / `["SOME_BACKUP_FILE"]` (today's pass-through behavior), missing the CSV-sourced entries like `"BDNEO"`.

- [ ] **Step 3: Wire up `family.ts`**

In `generator/lib/src/model/creature/family.ts`, add the import (alongside the existing service imports near the top):

```typescript
import monsterFilesService from "../../services/monster-files.service";
```

Change the `files` field to optional in both method signatures, and change the two `cre.files = p.files;` assignments to go through a new private `resolveFiles` helper:

```typescript
  create(p: {
    name: TranslationKey;
    monster: MonsterEnum;
    files?: string[];
    notEnforceFiles?: string[];
    newFiles?: CreatureNewFile[];
    data: InputMainCreatureData;
    autoGenerate?: CreatureAutoGenerate;
  }): T {
    logService.header(`Creating ${translationService.from(p.name)}...`);
    const cre = this.createCreature(p.monster);
    cre.name = p.name;
    cre.family = this.id;
    cre.files = this.resolveFiles(p.monster, p.files);
    cre.newFiles = p.newFiles ?? [];
    cre.notEnforceFiles = p.notEnforceFiles ?? [];
    cre.setData(p.data);
    cre.logging = this.logging;
    if (p.autoGenerate) {
      cre.autoGenerate = { ...cre.autoGenerate, ...p.autoGenerate };
      logService.log(`autogenerate: ${JSON.stringify(cre.autoGenerate)}`);
    }
    this.creatures.push(cre);
    return cre;
  }

  createFrom(p: {
    name: TranslationKey;
    from: T;
    monster: MonsterEnum;
    files?: string[];
    notEnforceFiles?: string[];
    newFiles?: CreatureNewFile[];
  }): T {
    const cre = structuredClone(p.from);
    Object.setPrototypeOf(cre, p.from);
    Object.setPrototypeOf(cre.data.movement, p.from.data.movement);
    cre.id = p.monster;
    cre.name = p.name;
    cre.files = this.resolveFiles(p.monster, p.files);
    cre.newFiles = p.newFiles ?? [];
    cre.notEnforceFiles = p.notEnforceFiles ?? [];
    cre.data.hp = undefined;
    cre.data.thac0 = undefined;
    cre.data.saveBreath = undefined;
    cre.data.saveDeath = undefined;
    cre.data.savePolymorph = undefined;
    cre.data.saveSpell = undefined;
    cre.data.saveWand = undefined;
    cre.items = [];
    cre.spells = [];
    cre.effectFiles = [];
    cre.projectiles = [];
    cre.adjustments = [];
    cre.valid = undefined;
    if (p.from.attack.dualWielding) cre.data.apr++;
    logService.header(
      `Creating ${translationService.from(cre.name)} from ${translationService.from(
        p.from.name,
      )}...`,
    );
    this.creatures.push(cre);
    return cre;
  }

  private resolveFiles(monster: MonsterEnum, backupFiles: string[] = []): string[] {
    return [...new Set([...monsterFilesService.getFiles(monster), ...backupFiles])];
  }
```

(Only the `files?:` type change, the two `cre.files = this.resolveFiles(...)` lines, and the new
`resolveFiles` private method are new — everything else shown is existing code included for
placement context.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npm test -- family.test` (from `generator/`)
Expected: PASS

- [ ] **Step 5: Run the full test suite**

Run: `npm test` (from `generator/`)
Expected: PASS — no other test constructs a real creature through `create()`/`createFrom()` and
asserts on `.files` today, so nothing else should change.

- [ ] **Step 6: Lint the changed files**

Run (from `generator/`): `npx eslint lib/src/model/creature/family.ts lib/src/model/creature/family.test.ts`
Expected: exit 0, no output. (Not `npm run lint` — see Global Constraints.)

- [ ] **Step 7: Verify the build still passes**

Run (from `generator/`): `npm run build`
Expected: exit 0, no output.

- [ ] **Step 8: Commit**

```bash
git add generator/lib/src/model/creature/family.ts generator/lib/src/model/creature/family.test.ts
git commit -m "feat: merge creatures.csv-validated files into create()/createFrom()"
```

---

### Task 3: Trim hardcoded `files:` arrays down to the CSV-absent backup list

**Files:**
- Create: `generator/scripts/trim-monster-files.ts`
- Modify (by running the script, not by hand): `generator/lib/creatures/undead.ts`, `generator/lib/creatures/feys.ts`, `generator/lib/creatures/dogs.ts`, `generator/lib/creatures/wolves.ts` (the only families with any filename absent from `creatures.csv`, per the 49-entry gap already catalogued this session — every other family's `files:` array will end up empty)

**Interfaces:**
- Consumes: `parseMonsterFilesCsv` from Task 1's `generator/lib/src/services/monster-files.service.ts`
  (imported directly, not re-implemented — same validated-rows-grouped-by-`MonsterId` parsing
  `MonsterFilesService.getFiles()` uses at runtime). A hardcoded `files:` entry is only removed if
  there's a validated CSV row for that filename under that array's own `monster:` value, so removal
  is provably safe on its own terms (guaranteed to still be supplied by `MonsterFilesService` after
  trimming).
- Produces: no new runtime interface — this is a one-off source rewrite, not a reusable module. Not
  wired into any skill or npm script; run manually, once, from `generator/`.

This task has no unit test of its own (matching `generator/scripts/build-monster-id.ts` and
`generator/scripts/extract-monster-defs.ts`, the two existing one-off migration scripts in this
repo, neither of which has a test file) — its correctness is verified by running it against the
real repo and checking the resulting diff builds and passes the full test suite (see Global
Constraints for why lint doesn't apply to this script).

- [ ] **Step 1: Write the script**

Create `generator/scripts/trim-monster-files.ts`:

```typescript
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
            const matchedSet = new Set(matched);
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
```

- [ ] **Step 2: Commit the script**

```bash
git add generator/scripts/trim-monster-files.ts
git commit -m "feat: add one-off script to trim files: arrays now covered by creatures.csv"
```

- [ ] **Step 3: Run it**

Run (from `generator/`): `npx ts-node scripts/trim-monster-files.ts`

Expected: console output listing removed filenames per family file, ending with a `Done. Removed
49 filename(s)...` summary. Only `undead.ts`, `feys.ts`, `dogs.ts`, and `wolves.ts` should be
touched — every other family's hardcoded list is already 100% covered by the CSV and will be
fully emptied.

- [ ] **Step 4: Clean up formatting**

Run (from `generator/`): `npm run format`

Expected: reformats any now-empty multi-line `files: [\n],` arrays down to `files: [],`, and
normalizes spacing in any single-line arrays the script rewrote. Exit code 0.

- [ ] **Step 5: Review the diff**

Run (from `generator/`): `git diff -- lib/creatures/undead.ts lib/creatures/feys.ts lib/creatures/dogs.ts lib/creatures/wolves.ts`

Expected: only `files:` array elements are removed (the ones from the 49-entry unmatched list
gathered earlier this session); no `setAdjustments(...)` blocks, `notEnforceFiles`, or any other
code changed. If anything else changed, stop and investigate before proceeding.

- [ ] **Step 6: Verify the build and tests still pass**

Run (from `generator/`):
```bash
npm run build
npm test
```
Expected: both exit 0. (No lint step here — `scripts/trim-monster-files.ts` isn't part of
`tsconfig.eslint.json`'s project, same as the two scripts already there; see Global Constraints.)

- [ ] **Step 7: Commit the trimmed source**

```bash
git add generator/lib/creatures/undead.ts generator/lib/creatures/feys.ts generator/lib/creatures/dogs.ts generator/lib/creatures/wolves.ts
git commit -m "chore: trim monster files: arrays now supplied by creatures.csv"
```

---

### Task 4: Final end-to-end verification

**Files:** none (verification only). `generator/lib/pnp-monster/**` and the `docs/` HTML/JS output
are committed, generated artifacts (not gitignored) — regenerating them for real is a separate,
consequential decision (it changes the actual shipped mod content for every monster whose file list
just grew, not only the 4 families Task 3 touched) that the user should explicitly make, not
something this verification task commits on its own initiative.

**Interfaces:** none — this task confirms the whole feature works together, it doesn't add code.

- [ ] **Step 1: Run a full generate and confirm it completes cleanly**

Run (from `generator/`): `npm run generate`

Expected: exits 0, no `ERROR:` lines, `Finished!` printed. This exercises every family's
`create()`/`createFrom()` (now CSV-merged) end-to-end, including the trimmed families from Task 3,
and writes real output under `generator/lib/pnp-monster/**` and `docs/`.

- [ ] **Step 2: Spot-check that a trimmed monster's generated output still includes its full file list**

Run (from `generator/`): search the generated `.tpa` for a trimmed monster, e.g. Skeleton
(`undead.ts`, one of the families Task 3 touched — it keeps 3 backup entries, `bpskelar`,
`CMSKE01`, `CMSKE02`, that stay hardcoded because they have no CSV row):

```bash
grep -n '"' lib/pnp-monster/undead/*.tpa | grep -i skel | head -5
```

Expected: the generated file lists Skeleton's CSV-sourced resrefs together with those 3 backup
ones — i.e. trimming the source didn't shrink the actual generated output, since `MonsterFilesService`
now supplies what was removed from the source array.

- [ ] **Step 3: Run the full test suite one more time**

Run (from `generator/`): `npm test`
Expected: PASS.

- [ ] **Step 4: Show the generated-output diff to the user, then discard it**

Run (from repo root): `git status --short` and `git diff --stat -- generator/lib/pnp-monster docs`

Expected: a real diff across many monster families (every monster whose CSV-validated file list
includes files beyond what was already hardcoded gains them here — expected and is the actual
point of this feature, not a bug). Report the summary to the user. Then run
`git checkout -- generator/lib/pnp-monster docs` (from repo root) to discard the regenerated output,
since committing it is a separate decision for the user to make explicitly, not part of this
plan's scope.

- [ ] **Step 5: Confirm the working tree is clean aside from this plan's own commits**

Run (from repo root): `git status --short`
Expected: clean.
