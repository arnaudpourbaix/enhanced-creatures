# Creature Error Isolation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Stop a single broken creature from aborting the entire generator run — log the error and keep building/generating every other creature, while still exiting non-zero at the end.

**Architecture:** `CreatureFamily.addCreature()` switches from taking an already-built creature to taking a builder thunk, so it can wrap both the builder call and `Creature.validate()` in try/catch. `MainService.generateCreature()` gets the same try/catch around its two generation calls. Both catch blocks log via the existing `LogService.error()` (which already drives the final exit code through `hasErrors()`) instead of letting the exception propagate to `index.ts`'s `handleError`/`process.exit(1)`. A companion AST-matching script (`scripts/extract-monster-defs.ts`) that greps the old call shape must be updated in lockstep, since it drives the `monster-id-mapping` skill.

**Tech Stack:** TypeScript, vitest, ts-node.

## Global Constraints

- Global/setup errors (`checkPresets`, `checkSpells`, duplicate-family-id check, `generateCommonCode`, `generateTranslations`, documentation/changelog generation, the `copy` command) stay fatal — do not touch `index.ts`'s `handleError` or those call paths.
- No re-throwing from either new catch block — the whole point is the caller keeps going.
- Every caught error must still increment `LogService`'s error count (via `logService.error(...)`, not `logService.log(...)` or `logService.warn(...)`) so the existing `hasErrors()` check in `index.ts` still exits the process with code 1 at the end of a run that hit any error.
- Message text goes through `logService.error(...)`; a stack trace (when `e instanceof Error && e.stack`) is appended via a plain `logService.log(...)` call right after, so it lands in `generator.log` without affecting the error count.

---

### Task 1: Rework `CreatureFamily.addCreature()` to catch build/validate errors, and migrate every call site

**Files:**
- Modify: `generator/lib/src/model/creature/family.ts:118-120`
- Test: `generator/lib/src/model/creature/family.test.ts`
- Modify (mechanical, 92 call sites across 23 files): `generator/lib/creatures/ankhegs.ts`, `bears.ts`, `basilisks.ts`, `cats.ts`, `constructs.ts`, `crawlers.ts`, `dogs.ts`, `ettercaps.ts`, `ettin.ts`, `feys.ts`, `golems.ts`, `minotaurs.ts`, `ogres.ts`, `plants.ts`, `slimes.ts`, `spiders.ts`, `undead.ts`, `wolves.ts`, `wyvern.ts`

**Interfaces:**
- Consumes: `logService.error(message: string): void`, `logService.log(message: string): void` (both already exist on the default-exported singleton from `generator/lib/src/services/log.service.ts`); `translationService.from(ref: StringReference): string` (default-exported singleton from `generator/lib/src/services/translation.service.ts`); `creature.validate(family: MonsterFamilyEnum): void` (instance method on `Creature`, already implemented in `generator/lib/src/model/creature/creature.ts:203-205`).
- Produces: `CreatureFamily<T>.addCreature(build: () => T): void` — the new public signature every family constructor calls. Later tasks and any future family file must call it as `this.addCreature(() => this.someBuilderMethod())`, never `this.addCreature(this.someBuilderMethod())`.

- [ ] **Step 1: Write the failing tests**

Add this new `describe` block to `generator/lib/src/model/creature/family.test.ts` (add the `creatureFactory` import alongside the existing imports at the top of the file):

```ts
import creatureFactory from "../../factories/creature.factory";
```

```ts
describe("addCreature", () => {
  it("builds, validates, and keeps the creature when nothing throws", () => {
    const family = fakeFamily();
    const validateSpy = vi.spyOn(creatureFactory, "validate").mockImplementation(() => {});
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});

    family.addCreature(() =>
      family.create({
        name: CREATURE_NAME_KEY,
        monster: MonsterEnum.Ankheg,
        data: {} as unknown as InputMainCreatureData,
      }),
    );

    expect(family.creatures).toHaveLength(1);
    expect(validateSpy).toHaveBeenCalledWith(family.creatures[0], family.id);
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it("logs and continues, without adding a creature, when the builder throws before create()", () => {
    const family = fakeFamily();
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});

    expect(() =>
      family.addCreature(() => {
        throw new Error("boom");
      }),
    ).not.toThrow();

    expect(family.creatures).toHaveLength(0);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("boom"));
  });

  it("logs, invalidates, and keeps the partially-built creature when the builder throws after create()", () => {
    const family = fakeFamily();
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});

    expect(() =>
      family.addCreature(() => {
        const cre = family.create({
          name: CREATURE_NAME_KEY,
          monster: MonsterEnum.Ankheg,
          data: {} as unknown as InputMainCreatureData,
        });
        throw new Error("boom");
      }),
    ).not.toThrow();

    expect(family.creatures).toHaveLength(1);
    expect(family.creatures[0].valid).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("boom"));
  });

  it("logs and invalidates the creature when validate() throws", () => {
    const family = fakeFamily();
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    vi.spyOn(creatureFactory, "validate").mockImplementation(() => {
      throw new Error("validate boom");
    });

    expect(() =>
      family.addCreature(() =>
        family.create({
          name: CREATURE_NAME_KEY,
          monster: MonsterEnum.Ankheg,
          data: {} as unknown as InputMainCreatureData,
        }),
      ),
    ).not.toThrow();

    expect(family.creatures).toHaveLength(1);
    expect(family.creatures[0].valid).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("validate boom"));
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd generator && npx vitest run lib/src/model/creature/family.test.ts`
Expected: the first test (`"builds, validates, and keeps..."`) fails because `family.addCreature` currently expects a `Creature`, not a thunk, so `creature.validate` is called on a function and throws `TypeError: creature.validate is not a function` (or equivalent) instead of returning cleanly. The other three tests fail for the same reason — the thrown error inside the arrow function is never caught by the old `addCreature`, so it propagates out of the `expect(() => ...).not.toThrow()` wrapper.

- [ ] **Step 3: Implement the new `addCreature`**

Replace `generator/lib/src/model/creature/family.ts:118-120`:

```ts
// before
  addCreature(creature: T) {
    creature.validate(this.id);
  }
```

with:

```ts
  addCreature(build: () => T) {
    let creature: T | undefined;
    try {
      creature = build();
      creature.validate(this.id);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      const label = creature ? translationService.from(creature.name) : "creature";
      logService.error(`Failed to build ${label}: ${message}`);
      if (e instanceof Error && e.stack) logService.log(e.stack);
      if (creature) creature.valid = false;
    }
  }
```

`logService` and `translationService` are already imported at the top of `family.ts` — no new imports needed there.

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd generator && npx vitest run lib/src/model/creature/family.test.ts`
Expected: PASS (all tests in the file, including the pre-existing ones above `addCreature`).

- [ ] **Step 5: Migrate every call site from `this.addCreature(this.xxx())` to `this.addCreature(() => this.xxx())`**

At this point `generator/lib/creatures/*.ts` still call the old shape, so `tsc` will fail to compile them (vitest itself will still run since it doesn't type-check, but `npm run build` won't). Run this from the repo root to migrate every active (non-commented) call site in one pass:

```bash
cd "generator/lib/creatures"
for f in ankhegs.ts bears.ts basilisks.ts cats.ts constructs.ts crawlers.ts dogs.ts ettercaps.ts ettin.ts feys.ts golems.ts minotaurs.ts ogres.ts plants.ts slimes.ts spiders.ts undead.ts wolves.ts wyvern.ts; do
  sed -i -E '/^[[:space:]]*\/\//! s/this\.addCreature\(this\.([A-Za-z0-9_]+)\(\)\);/this.addCreature(() => this.\1());/' "$f"
done
```

The `/^[[:space:]]*\/\//!` address guard skips any line that starts with `//` (after optional leading whitespace), so the commented-out `undead.ts` entries (`// this.addCreature(this.deathKnight());` etc.) are left untouched.

- [ ] **Step 6: Verify the migration**

Run: `cd generator && grep -rn "addCreature(this\." lib/creatures/*.ts`
Expected: only the 7 commented-out lines in `undead.ts` remain (each prefixed with `//`). Every active call site now reads `this.addCreature(() => this.xxx());`.

Run: `cd generator && grep -c "addCreature(() =>" lib/creatures/*.ts | awk -F: '{sum+=$2} END {print sum}'`
Expected: `92`.

- [ ] **Step 7: Confirm the full build and test suite are green**

Run: `cd generator && npx tsc -p . --noEmit`
Expected: no errors.

Run: `cd generator && npm test`
Expected: all tests pass (this exercises the migrated files indirectly through `mainService.generateCreatures()`-adjacent code paths, and directly through `family.test.ts`).

- [ ] **Step 8: Commit**

```bash
cd generator
git add lib/src/model/creature/family.ts lib/src/model/creature/family.test.ts lib/creatures/*.ts
git commit -m "feat: isolate per-creature build/validate errors in addCreature"
```

---

### Task 2: Update `scripts/extract-monster-defs.ts` for the new `addCreature(() => this.xxx())` call shape

**Files:**
- Modify: `generator/scripts/extract-monster-defs.ts:75-92`

**Interfaces:**
- Consumes: the migrated call shape produced by Task 1 (`this.addCreature(() => this.xxx())`) across `generator/lib/creatures/*.ts`.
- Produces: unchanged `MonsterDef[]` JSON output shape at the `--out` path — no downstream consumer of this script's output changes.

This script (used by the `monster-id-mapping` skill) walks the TypeScript AST of every family file to find which builder methods are actively wired up via `addCreature`. Its `collectActive()` function currently expects the argument to `addCreature` to itself be a call expression (`this.xxx()`); after Task 1 it's an arrow function wrapping that call expression. There's no existing test file for this script (it's a side-effecting CLI script, not an exported function), so this task is verified against known-good counts instead of unit tests: running this script against the pre-Task-1 codebase (call sites not yet migrated, old matcher) produces exactly **85 active monster definitions** and **7 excluded inactive/unfinished** entries — `DeathKnight`, `Wight`, `Wraith`, `Zombie`, `ZombieJuju`, `ZombieSea`, and `DeathShade`, all in `undead.ts`. Since this task only changes call *syntax*, not which creatures are wired up, the fixed matcher must reproduce the exact same 85/7 split.

- [ ] **Step 1: Confirm the matcher is currently broken (post Task 1 migration)**

Run: `cd generator && npx ts-node scripts/extract-monster-defs.ts --generator . --out /tmp/monster-defs-broken.json`
Expected: `Extracted 0 active monster definitions -> /tmp/monster-defs-broken.json`, with all 85 real monsters now listed under "Excluded ... inactive/unfinished" — confirming the matcher no longer recognizes any `addCreature` call after Task 1's migration to the arrow-thunk shape.

- [ ] **Step 2: Fix `collectActive()`**

Replace `generator/scripts/extract-monster-defs.ts:75-92`:

```ts
// before
  // Active methods = those actually invoked (non-commented) as this.addCreature(this.xxx())
  // in the family's constructor. Commented-out lines never become AST nodes, so this
  // naturally excludes unfinished/disabled monster definitions.
  const activeMethods = new Set<string>();
  function collectActive(node: ts.Node) {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "addCreature" &&
      node.arguments.length === 1 &&
      ts.isCallExpression(node.arguments[0]) &&
      ts.isPropertyAccessExpression(node.arguments[0].expression)
    ) {
      activeMethods.add(node.arguments[0].expression.name.text);
    }
    ts.forEachChild(node, collectActive);
  }
  collectActive(sourceFile);
```

with:

```ts
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
```

- [ ] **Step 3: Verify the counts match the known-good pre-Task-1 numbers**

Run: `cd generator && npx ts-node scripts/extract-monster-defs.ts --generator . --out /tmp/monster-defs-fixed.json`
Expected: `Extracted 85 active monster definitions -> /tmp/monster-defs-fixed.json` and exactly this 7-entry "Excluded ... inactive/unfinished" list, each on its own line:

```
  undead.ts :: DeathKnight (deathKnight)
  undead.ts :: Wight (wight)
  undead.ts :: Wraith (wraith)
  undead.ts :: Zombie (zombie)
  undead.ts :: ZombieJuju (zombieJuju)
  undead.ts :: ZombieSea (zombieSea)
  undead.ts :: DeathShade (deathShade)
```

This confirms the call-shape change didn't alter which creatures are considered active.

- [ ] **Step 4: Commit**

```bash
cd generator
git add scripts/extract-monster-defs.ts
git commit -m "fix: match the new addCreature(() => this.xxx()) call shape in extract-monster-defs"
```

---

### Task 3: Wrap `MainService.generateCreature()`'s generation calls in try/catch

**Files:**
- Modify: `generator/lib/src/services/main.service.ts:41-45`
- Test: `generator/lib/src/services/main.service.test.ts`

**Interfaces:**
- Consumes: `logService.error(message: string): void`, `logService.log(message: string): void`, `translationService.from(ref: StringReference): string` — all already imported in `main.service.ts`. `bafGeneratorService.generate(creature: Creature): void` and `weiduCreatureService.generateWeiduScript(creature: Creature): void` — unchanged signatures, already imported.
- Produces: `MainService.generateCreature(creature: Creature): void` keeps its existing signature; behavior change only (no longer throws — sets `creature.valid = false` and logs on any error from either generation call).

- [ ] **Step 1: Write the failing tests**

Add to the existing `describe("generateCreature", ...)` block in `generator/lib/src/services/main.service.test.ts` (after the existing "skips baf/weidu generation for an invalid creature" test):

```ts
  it("logs the error and invalidates the creature when baf generation throws, without propagating", () => {
    vi.spyOn(logService, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    vi.spyOn(bafGeneratorService, "generate").mockImplementation(() => {
      throw new Error("boom");
    });
    const weiduSpy = vi
      .spyOn(weiduCreatureService, "generateWeiduScript")
      .mockImplementation(() => {});

    const creature = fakeCreature(true);
    expect(() => mainService.generateCreature(creature)).not.toThrow();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("boom"));
    expect(creature.valid).toBe(false);
    expect(weiduSpy).not.toHaveBeenCalled();
  });

  it("logs the error and invalidates the creature when weidu script generation throws", () => {
    vi.spyOn(logService, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    vi.spyOn(bafGeneratorService, "generate").mockImplementation(() => {});
    vi.spyOn(weiduCreatureService, "generateWeiduScript").mockImplementation(() => {
      throw new Error("weidu boom");
    });

    const creature = fakeCreature(true);
    expect(() => mainService.generateCreature(creature)).not.toThrow();

    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("weidu boom"));
    expect(creature.valid).toBe(false);
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd generator && npx vitest run lib/src/services/main.service.test.ts`
Expected: both new tests fail — the thrown error from the mocked `bafGeneratorService.generate`/`weiduCreatureService.generateWeiduScript` propagates straight out of `mainService.generateCreature(creature)`, so `expect(() => ...).not.toThrow()` fails.

- [ ] **Step 3: Implement the try/catch**

Replace `generator/lib/src/services/main.service.ts:41-45`:

```ts
// before
  generateCreature(creature: Creature) {
    if (!this.isCreatureValid(creature)) return;
    bafGeneratorService.generate(creature);
    weiduCreatureService.generateWeiduScript(creature);
  }
```

with:

```ts
  generateCreature(creature: Creature) {
    if (!this.isCreatureValid(creature)) return;
    try {
      bafGeneratorService.generate(creature);
      weiduCreatureService.generateWeiduScript(creature);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      logService.error(
        `${translationService.from(creature.name)}: failed to generate - ${message}`,
      );
      if (e instanceof Error && e.stack) logService.log(e.stack);
      creature.valid = false;
    }
  }
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd generator && npx vitest run lib/src/services/main.service.test.ts`
Expected: PASS (all tests in the file).

- [ ] **Step 5: Run the full test suite**

Run: `cd generator && npm test`
Expected: all tests pass.

- [ ] **Step 6: Commit**

```bash
cd generator
git add lib/src/services/main.service.ts lib/src/services/main.service.test.ts
git commit -m "feat: isolate per-creature generation errors in generateCreature"
```

---

### Task 4: End-to-end verification with a real generator run

**Files:** none modified permanently — this task exercises the real generator and reverts any temporary changes it makes.

**Interfaces:**
- Consumes: `npm run generate` (defined in `generator/package.json`), `generator/generator.log` output, the process exit code.

- [ ] **Step 1: Confirm a clean run still succeeds**

Run: `cd generator && npm run generate; echo "exit code: $?"`
Expected: `exit code: 0`, terminal prints `Finished!` in green, and `generator.log` ends with a `Summary` section reading `No errors`.

- [ ] **Step 2: Temporarily force one creature to fail during construction**

Edit `generator/lib/creatures/basilisks.ts`'s `lesser()` method (the one starting at the line with `private lesser() {`) to throw immediately as its first statement:

```ts
  private lesser() {
    throw new Error("forced failure for verification");
    const lesser = this.create({
      // ... existing body unchanged below this point
```

(TypeScript will flag the now-unreachable code — that's fine, this edit is temporary and gets reverted in Step 4; don't fix the unreachable-code warning.)

- [ ] **Step 3: Run the generator again and inspect the result**

Run: `cd generator && npm run generate; echo "exit code: $?"`
Expected:
- `exit code: 1` (the run still fails overall, since `hasErrors()` is true).
- Terminal prints `Generator finished with errors, see generator.log` in red.
- `generator.log` contains a line matching `error: Failed to build creature: forced failure for verification` (the generic `"creature"` label, since the throw happens before `this.create(...)` runs).
- `generator.log` still contains later sections after that error — specifically `Generating common code`, `Generating translations`, and a final `Summary` section reporting `1 error` — proving the run continued past the broken creature instead of aborting.
- The `Greater Basilisk` (`greater()`, the sibling creature in the same family) still has its `"Creating Greater Basilisk..."` header and normal content in `generator.log`, with no error under it.

- [ ] **Step 4: Revert the temporary breakage**

Run: `cd generator && git diff --stat lib/creatures/basilisks.ts` to confirm only the temporary throw is present, then:

```bash
cd generator
git checkout -- lib/creatures/basilisks.ts
```

- [ ] **Step 5: Confirm the clean run is restored**

Run: `cd generator && npm run generate; echo "exit code: $?"`
Expected: same as Step 1 — `exit code: 0`, `Finished!`, `No errors` in the log summary.

No commit for this task — it's verification only, and Step 4 already discards the temporary change.

---

### Task 5: Regenerate and commit stale mod output

**Files:**
- Modify (regenerated, not hand-edited): `lib/pnp-monster/**` (repo root, sibling of `generator/`), plus any of the fixed generated files listed in `generator/lib/src/services/pipeline.golden.test.ts`'s `FIXED_GENERATED_FILES` that changed: `lib/common/spell-resources.tpa`, `lib/common/spell-functions.tpa`, `lib/common/immunities.tpa`, `docs/monsters.html`, `docs/changelog.html`, `languages/*/generated.tra`.

**Interfaces:**
- Consumes: `npm run generate` (writes to the real mod folder this time, not a temp dir — this is what discovers the discrepancy `pipeline.golden.test.ts` reports).

Discovered during Task 3's review (not anticipated when this plan was written): `generator/lib/src/services/pipeline.golden.test.ts` runs the full pipeline against a temp directory and diffs it against what's actually committed under `lib/pnp-monster/**` (and the fixed generated files) in the repo. Before Tasks 1-3, some creature's generation threw and crashed the whole pipeline before it reached many families — so those families' output was never committed, and the test never noticed because it also crashed (all 7 of its tests showed as "skipped", not failing). With Tasks 1-3 in place, the pipeline no longer crashes, so it now produces output for those previously-unreached creatures/families — and `pipeline.golden.test.ts`'s "regenerates lib/pnp-monster identically to what's on disk" test fails with a list of "unexpected" new files, because the committed mod output is now stale relative to what the fixed generator actually produces. This is the same situation the repo's prior commit `2af1e33` ("chore: regenerate mod output for creatures now failing dialog/deathVar validation") addressed — regenerate and commit.

- [ ] **Step 1: Run the real generator**

Run: `cd generator && npm run generate; echo "exit code: $?"`

This writes output for real into the repo's actual `lib/pnp-monster/**` and the other `FIXED_GENERATED_FILES` locations (unlike Task 4, which redirected `State.modFolder` to a temp dir — this step intentionally writes to the real, tracked locations). Expected: `exit code: 0` (no errors — if this run reports errors, stop and investigate before continuing; don't commit generator output produced by a run that logged errors).

- [ ] **Step 2: Review what changed**

Run: `git status --short -- ../lib/pnp-monster ../lib/common ../docs/monsters.html ../docs/changelog.html ../languages` (paths are relative to `generator/`, so `..` reaches the repo root)
Expected: new/modified files, all additions of creature output that previously never got generated (families/creatures that were downstream of whatever used to crash the pipeline) — no deletions of previously-working output, and no modifications to hand-authored files outside the generator's known output paths.

- [ ] **Step 3: Run the golden test to confirm it's now clean**

Run: `cd generator && npx vitest run lib/src/services/pipeline.golden.test.ts`
Expected: `Tests  7 passed (7)` — no failures, no skips.

- [ ] **Step 4: Run the full test suite**

Run: `cd generator && npm test`
Expected: only the pre-existing baseline failures remain (`monster-files.service.test.ts`, `family.test.ts`'s "unvalidated creatures.csv guesses warning", `documentation.service.test.ts`'s 3 `getTraits` tests, `poison.service.test.ts`) — `pipeline.golden.test.ts` no longer among them.

- [ ] **Step 5: Commit**

```bash
git add lib/pnp-monster lib/common docs/monsters.html docs/changelog.html languages
git commit -m "$(cat <<'EOF'
chore: regenerate mod output now that the pipeline no longer crashes early

Tasks 1-3 stopped a single broken creature from aborting the whole
generator run, which means families/creatures previously unreachable
after an early crash now get generated for the first time.
EOF
)"
```
