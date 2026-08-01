# Warning Count Summary Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `warn()`/`summary()` pair to `LogService` so `generator.log` ends with a `Summary` section reporting the total warning count, and reclassify the 13 call sites that are genuinely warnings from `.log(...)` to `.warn(...)`.

**Architecture:** `LogService` gains a private `warningCount` counter (reset in `init()`), a `warn(message)` method that increments the counter and delegates to the existing `log(message)` for the actual write (no duplicated write logic), and a `summary()` method that emits a `section("Summary")` block with the pluralized count. `index.ts` calls `summary()` right before the existing `"Finished!"` line. The 13 call sites already known to be warnings (11 already ⚠-marked, 2 former `console.warn` sites) switch from `.log(...)` to `.warn(...)`, with message text unchanged.

**Tech Stack:** TypeScript, Vitest.

## Global Constraints

- Message text at every one of the 13 call sites stays byte-for-byte identical — only the method name changes from `.log(` to `.warn(`.
- `warn(message: string): void` increments `warningCount` then calls `this.log(message)` — it does not reimplement the indent/write loop.
- `summary(): void` always emits a `section("Summary")` block (even when `warningCount` is 0): `"No warnings"` for 0, `"1 warning"` for 1, `"${warningCount} warnings"` otherwise.
- `init()` resets `warningCount` to `0`, alongside the existing indent reset.
- `index.ts` calls `logService.summary();` immediately before the existing `logService.log("Finished!");` line — no other change to the console-output policy (console still only shows the fatal error handler and `"Finished!"`).
- Every test file that spies on `logService.log` for a message that is one of the 13 reclassified sites must retarget that specific spy to `logService.warn`. Spies in the same file covering other (non-warning) messages are left on `.log`.
- The 13 reclassified call sites: `lib/src/factories/creature.factory.ts` (6: `equipItem`'s slot-conflict warning; `validate`'s family-mismatch, no-files, existing-files, no-attack, no-behavior warnings), `lib/src/services/main.service.ts` (2: `isCreatureValid`'s not-yet-validated and invalid warnings), `lib/src/services/creature.service.ts` (1: THAC0 mismatch in `autogenerateThac0`), `lib/src/services/weapon.service.ts` (1: default weapon speed in `checkWeaponSpeed`), `lib/src/services/effects/grab.service.ts` (1: creature-size-needed in `getGrabImmuneEffects`), `lib/src/services/weidu/weidu-creature.service.ts` (1: no-slot-defined), `lib/src/services/doc/description.service.ts` (1: unknown-duration).

---

### Task 1: `LogService` `warn()`/`summary()` (+ tests)

**Files:**
- Modify: `lib/src/services/log.service.ts`
- Modify: `lib/src/services/log.service.test.ts`

**Interfaces:**
- Produces: `logService.warn(message: string): void`, `logService.summary(): void`. Later tasks call these from source files that already import `logService` (no new imports needed anywhere — every touched file already has the `logService` import from the prior debug-log-file plan).

- [ ] **Step 1: Write the failing tests**

Add these 5 tests to `lib/src/services/log.service.test.ts`, right before the file's closing `});` (after the existing "log indents every line of a multi-line message" test):

```ts
  it("warn writes the same as log (indent-prefixed by the current context)", () => {
    logService.init();
    logService.header(CREATING_OGRE);
    logService.warn("something looks off");
    expect(readLog()).toBe(`\n${CREATING_OGRE}\n    something looks off\n`);
  });

  it("warn increments the warning count while log does not", () => {
    logService.init();
    logService.log("informational line");
    logService.warn("a warning");
    logService.summary();
    expect(readLog()).toBe("informational line\na warning\n\nSummary\n-------\n1 warning\n");
  });

  it("summary reports no warnings when none were logged", () => {
    logService.init();
    logService.summary();
    expect(readLog()).toBe("\nSummary\n-------\nNo warnings\n");
  });

  it("summary reports a plural warning count", () => {
    logService.init();
    logService.warn("first warning");
    logService.warn("second warning");
    logService.summary();
    expect(readLog()).toBe(
      "first warning\nsecond warning\n\nSummary\n-------\n2 warnings\n",
    );
  });

  it("init resets the warning count across runs", () => {
    logService.init();
    logService.warn("first run warning");
    logService.init();
    logService.summary();
    expect(readLog()).toBe("\nSummary\n-------\nNo warnings\n");
  });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/src/services/log.service.test.ts`
Expected: FAIL — `logService.warn is not a function` (and `summary` likewise undefined).

- [ ] **Step 3: Implement `warn()` and `summary()`**

Replace the full contents of `lib/src/services/log.service.ts`:

```ts
import * as fs from "fs";
import * as path from "path";

class LogService {
  filePath = path.join(process.cwd(), "generator.log");
  enabled = false;
  private indent = "";
  private warningCount = 0;

  init(): void {
    this.indent = "";
    this.warningCount = 0;
    this.enabled = true;
    fs.writeFileSync(this.filePath, "");
  }

  section(title: string): void {
    this.indent = "";
    this.write("");
    this.write(title);
    this.write("-".repeat(title.length));
  }

  header(title: string): void {
    this.write("");
    this.write(title);
    this.indent = "    ";
  }

  log(message: string): void {
    for (const line of message.split("\n")) {
      this.write(`${this.indent}${line}`);
    }
  }

  warn(message: string): void {
    this.warningCount++;
    this.log(message);
  }

  summary(): void {
    this.section("Summary");
    if (this.warningCount === 0) this.log("No warnings");
    else if (this.warningCount === 1) this.log("1 warning");
    else this.log(`${this.warningCount} warnings`);
  }

  private write(line: string): void {
    if (!this.enabled) return;
    fs.appendFileSync(this.filePath, `${line}\n`);
  }
}

const logService = new LogService();
export default logService;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/src/services/log.service.test.ts`
Expected: PASS — 13 tests (8 existing + 5 new).

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/log.service.ts lib/src/services/log.service.test.ts
git commit -m "$(cat <<'EOF'
feat(generator): add LogService.warn()/summary() for a warning count

EOF
)"
```

---

### Task 2: Wire `summary()` into `index.ts`

**Files:**
- Modify: `lib/src/index.ts`

**Interfaces:**
- Consumes: `logService.summary(): void` (from Task 1).

- [ ] **Step 1: Update `index.ts`**

Replace:

```ts
      logService.section("Generating translations");
      mainService.generateTranslations();
      logService.log("Finished!");
      console.log(chalk.green(`\nFinished!`));
```

with:

```ts
      logService.section("Generating translations");
      mainService.generateTranslations();
      logService.summary();
      logService.log("Finished!");
      console.log(chalk.green(`\nFinished!`));
```

- [ ] **Step 2: Run the full test suite to confirm nothing broke**

Run: `npm run test`
Expected: PASS — all existing tests still pass (no test file covers `index.ts` directly).

- [ ] **Step 3: Manually verify against a real run**

Run: `npm run atweaks`
Expected: terminal output unchanged (just the green `"Finished!"` line). The generated `generator.log` now ends with a `Summary` section (a dashed-underlined header, then a warning-count line) immediately before the final `"Finished!"` line.

- [ ] **Step 4: Commit**

```bash
git add lib/src/index.ts
git commit -m "$(cat <<'EOF'
feat(generator): emit a warning-count summary at the end of generator.log

EOF
)"
```

---

### Task 3: Reclassify `creature.factory.ts`'s 6 warnings

**Files:**
- Modify: `lib/src/factories/creature.factory.ts`
- Modify: `lib/src/factories/creature.factory.test.ts`

**Interfaces:**
- Consumes: `logService.warn(message: string): void` (from Task 1).

- [ ] **Step 1: Reclassify the 6 call sites in `creature.factory.ts`**

Replace (in `equipItem()`):

```ts
      logService.log(
        `${figureSet.warning} Slot ${equippedItemSlot} is already attributed to ${duplicate.stringRef ?? "unknown"}.`,
      );
```

with:

```ts
      logService.warn(
        `${figureSet.warning} Slot ${equippedItemSlot} is already attributed to ${duplicate.stringRef ?? "unknown"}.`,
      );
```

Replace (in `validate()`), all five occurrences:

```ts
      logService.log(`${figureSet.warning} Family doesn't match: ${creature.family} <-> ${family}`);
```
→
```ts
      logService.warn(`${figureSet.warning} Family doesn't match: ${creature.family} <-> ${family}`);
```

```ts
      logService.log(`${figureSet.warning} No files defined`);
```
→
```ts
      logService.warn(`${figureSet.warning} No files defined`);
```

```ts
      logService.log(
        `${
          figureSet.warning
        } Those files are already declared in other creatures: ${existingFiles.join(", ")}`,
      );
```
→
```ts
      logService.warn(
        `${
          figureSet.warning
        } Those files are already declared in other creatures: ${existingFiles.join(", ")}`,
      );
```

```ts
      logService.log(`${figureSet.warning} No attack defined, using defaults`);
```
→
```ts
      logService.warn(`${figureSet.warning} No attack defined, using defaults`);
```

```ts
      logService.log(`${figureSet.warning} No behavior defined, using defaults`);
```
→
```ts
      logService.warn(`${figureSet.warning} No behavior defined, using defaults`);
```

- [ ] **Step 2: Retarget both `equipItem` test spies in `creature.factory.test.ts`**

Replace (in "warns when the target slot is already occupied by an item on the creature"):

```ts
    const logSpy = vi.spyOn(logService, "log").mockImplementation(() => {});
    const newItem = { file: "new01" } as unknown as Item;
    creatureFactory.equipItem(creature, newItem, ["LRING"]);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("already attributed to"));
```

with:

```ts
    const logSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    const newItem = { file: "new01" } as unknown as Item;
    creatureFactory.equipItem(creature, newItem, ["LRING"]);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining("already attributed to"));
```

Replace (in "does not detect the conflict when the existing entry's slot is stored as a bare string..."):

```ts
    const logSpy = vi.spyOn(logService, "log").mockImplementation(() => {});
    const newItem = { file: "new01" } as unknown as Item;
    creatureFactory.equipItem(creature, newItem, ["LRING"]);
    expect(logSpy).not.toHaveBeenCalled();
```

with:

```ts
    const logSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    const newItem = { file: "new01" } as unknown as Item;
    creatureFactory.equipItem(creature, newItem, ["LRING"]);
    expect(logSpy).not.toHaveBeenCalled();
```

- [ ] **Step 3: Run the tests to verify they pass**

Run: `npx vitest run lib/src/factories/creature.factory.test.ts`
Expected: PASS — 6 tests.

- [ ] **Step 4: Commit**

```bash
git add lib/src/factories/creature.factory.ts lib/src/factories/creature.factory.test.ts
git commit -m "$(cat <<'EOF'
refactor(generator): reclassify creature.factory.ts's warnings as LogService.warn

EOF
)"
```

---

### Task 4: Reclassify `main.service.ts`'s 2 warnings

**Files:**
- Modify: `lib/src/services/main.service.ts`
- Modify: `lib/src/services/main.service.test.ts`

**Interfaces:**
- Consumes: `logService.warn(message: string): void` (from Task 1).

- [ ] **Step 1: Reclassify the 2 call sites in `main.service.ts`**

Replace (in `isCreatureValid()`):

```ts
      logService.log(
        `${figureSet.warning} ${translationService.from(
          creature.name,
        )} has not been validated, you must call validate`,
      );
```

with:

```ts
      logService.warn(
        `${figureSet.warning} ${translationService.from(
          creature.name,
        )} has not been validated, you must call validate`,
      );
```

Replace:

```ts
      logService.log(
        `${figureSet.warning} ${translationService.from(
          creature.name,
        )} is not valid, please fix it !`,
      );
```

with:

```ts
      logService.warn(
        `${figureSet.warning} ${translationService.from(
          creature.name,
        )} is not valid, please fix it !`,
      );
```

- [ ] **Step 2: Retarget all 4 spy occurrences in `main.service.test.ts`**

Replace all three:

```ts
    const logSpy = vi.spyOn(logService, "log").mockImplementation(() => {});
```

with:

```ts
    const logSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
```

(these are the "returns false and warns when valid is undefined", "returns false and warns when valid is explicitly false", and "returns true without warning when valid is true" tests in the `isCreatureValid` describe block.)

Replace the bare occurrence in the `generateCreature` describe block:

```ts
    vi.spyOn(logService, "log").mockImplementation(() => {});
```

with:

```ts
    vi.spyOn(logService, "warn").mockImplementation(() => {});
```

- [ ] **Step 3: Run the tests to verify they pass**

Run: `npx vitest run lib/src/services/main.service.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 4: Commit**

```bash
git add lib/src/services/main.service.ts lib/src/services/main.service.test.ts
git commit -m "$(cat <<'EOF'
refactor(generator): reclassify main.service.ts's warnings as LogService.warn

EOF
)"
```

---

### Task 5: Reclassify `creature.service.ts` + `weapon.service.ts` + `weidu-creature.service.ts`

**Files:**
- Modify: `lib/src/services/creature.service.ts`
- Modify: `lib/src/services/weapon.service.ts`
- Modify: `lib/src/services/weidu/weidu-creature.service.ts`

**Interfaces:**
- Consumes: `logService.warn(message: string): void` (from Task 1).

None of these three files' companion test files spy on `logService.log`/`logService.warn` for the reclassified message, so no test changes are needed for this task.

- [ ] **Step 1: Reclassify `creature.service.ts`'s THAC0-mismatch warning**

Replace:

```ts
    if (data.thac0 !== undefined)
      logService.log(
        `${figureSet.warning} level: ${level}, hp bonus: ${data.bonusHp ?? 0}, thac0: ${data.thac0}, calculated: ${item.thac0}`,
      );
```

with:

```ts
    if (data.thac0 !== undefined)
      logService.warn(
        `${figureSet.warning} level: ${level}, hp bonus: ${data.bonusHp ?? 0}, thac0: ${data.thac0}, calculated: ${item.thac0}`,
      );
```

- [ ] **Step 2: Reclassify `weapon.service.ts`'s default-speed warning**

Replace:

```ts
      logService.log(
        `${figureSet.warning} default speed of ${weapon.header.speed} from weapon ${weapon.file}.`,
      );
```

with:

```ts
      logService.warn(
        `${figureSet.warning} default speed of ${weapon.header.speed} from weapon ${weapon.file}.`,
      );
```

- [ ] **Step 3: Reclassify `weidu-creature.service.ts`'s no-slot-defined warning**

Replace:

```ts
        logService.log(
          `No slot defined for equipped item ${item.file}, check if it is used by an adjustment`,
        );
```

with:

```ts
        logService.warn(
          `No slot defined for equipped item ${item.file}, check if it is used by an adjustment`,
        );
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/src/services/creature.service.test.ts lib/src/services/weapon.service.test.ts lib/src/services/weidu/weidu-creature.service.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/creature.service.ts lib/src/services/weapon.service.ts lib/src/services/weidu/weidu-creature.service.ts
git commit -m "$(cat <<'EOF'
refactor(generator): reclassify creature/weapon/weidu-creature warnings as LogService.warn

EOF
)"
```

---

### Task 6: Reclassify `effects/grab.service.ts`'s warning

**Files:**
- Modify: `lib/src/services/effects/grab.service.ts`
- Modify: `lib/src/services/effects/grab.service.test.ts`

**Interfaces:**
- Consumes: `logService.warn(message: string): void` (from Task 1).

- [ ] **Step 1: Reclassify the call site in `grab.service.ts`**

Replace:

```ts
      logService.log(`${figureSet.warning} Creature size is needed to add grab immunities!`);
```

with:

```ts
      logService.warn(`${figureSet.warning} Creature size is needed to add grab immunities!`);
```

- [ ] **Step 2: Retarget the spy in `grab.service.test.ts`**

Replace (in "getGrabImmuneEffects (private) skips the size-based extras and warns when the creature has no size"):

```ts
    const consoleSpy = vi.spyOn(logService, "log").mockImplementation(() => {});
```

with:

```ts
    const consoleSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
```

- [ ] **Step 3: Run the tests to verify they pass**

Run: `npx vitest run lib/src/services/effects/grab.service.test.ts`
Expected: PASS — 9 tests.

- [ ] **Step 4: Commit**

```bash
git add lib/src/services/effects/grab.service.ts lib/src/services/effects/grab.service.test.ts
git commit -m "$(cat <<'EOF'
refactor(generator): reclassify grab.service.ts's warning as LogService.warn

EOF
)"
```

---

### Task 7: Reclassify `doc/description.service.ts`'s warning

**Files:**
- Modify: `lib/src/services/doc/description.service.ts`
- Modify: `lib/src/services/doc/description.service.test.ts`

**Interfaces:**
- Consumes: `logService.warn(message: string): void` (from Task 1).

- [ ] **Step 1: Reclassify the call site in `description.service.ts`**

Replace:

```ts
    logService.log(`unknown duration ${duration}s`);
```

with:

```ts
    logService.warn(`unknown duration ${duration}s`);
```

- [ ] **Step 2: Retarget both spies in `description.service.test.ts`**

Replace (the top-level `beforeEach` blanket silencer):

```ts
  vi.spyOn(logService, "log").mockImplementation(() => undefined);
```

with:

```ts
  vi.spyOn(logService, "warn").mockImplementation(() => undefined);
```

Replace (in "warns and falls back to raw seconds for a non-integer duration"):

```ts
    const warnSpy = vi.spyOn(logService, "log").mockImplementation(() => undefined);
    expect(service.getDuration(0.5)).toBe("0.5s");
    expect(warnSpy).toHaveBeenCalledWith("unknown duration 0.5s");
```

with:

```ts
    const warnSpy = vi.spyOn(logService, "warn").mockImplementation(() => undefined);
    expect(service.getDuration(0.5)).toBe("0.5s");
    expect(warnSpy).toHaveBeenCalledWith("unknown duration 0.5s");
```

- [ ] **Step 3: Run the tests to verify they pass**

Run: `npx vitest run lib/src/services/doc/description.service.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add lib/src/services/doc/description.service.ts lib/src/services/doc/description.service.test.ts
git commit -m "$(cat <<'EOF'
refactor(generator): reclassify description.service.ts's warning as LogService.warn

EOF
)"
```

---

### Task 8: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: PASS — all tests green, no regressions.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 3: Run the generator end-to-end and inspect the summary**

Run: `npm run atweaks`
Expected: terminal output is just the green `"Finished!"` line. Open `generator.log` and confirm it ends with:

```
Summary
-------
N warnings
Finished!
```

where `N` is a plausible count (the real creature data currently exercises several of the reclassified warning paths — e.g. missing-attack, missing-behavior — so `N` should be greater than 0, not "No warnings"). Grep the file for the reclassified message texts (e.g. `grep -c "No attack defined" generator.log`) and confirm the count roughly matches what `Summary` reports (some reclassified warnings, like the THAC0 mismatch, may not fire on this particular creature set — that's fine, the summary only needs to match what actually printed, not every possible warning site).

- [ ] **Step 4: Clean up the generated log file**

Run: `rm -f generator.log` (from the `generator` directory) — it's gitignored and only needed for the manual check above.

No commit needed for this task (verification only, no code changes).
