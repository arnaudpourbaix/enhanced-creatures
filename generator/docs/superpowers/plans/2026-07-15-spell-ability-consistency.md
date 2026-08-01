# Spell / Ability Consistency Check Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a per-creature check that errors when a memorized spell (base, spellbook-variant, or adjustment) has no matching AI ability, and warns when an ability references a spell that's memorized nowhere — surfacing bugs like Greater Mummy's spellbook-variant/ability mismatch as build-breaking errors.

**Architecture:** A generic `error()` severity is added to `LogService` (parallel to the existing `warn()`), with `index.ts` failing the process (`process.exit(1)`) when any were logged. A new `CreatureService.checkSpellAbilities(creature)` method collects every "memorized spell group" a creature can have (default list, each spellbook variant, each adjustment) and every ability's spell resource, then cross-checks them, wired into the existing `creatureFactory.validate()` per-creature validation chain.

**Tech Stack:** TypeScript, Vitest (real file I/O in tests, no mocks for `LogService`; `vi.spyOn` for spying on `logService.warn`/`logService.error` in unrelated services).

## Global Constraints

- No exemption/opt-out mechanism for individual spells — the check is unconditional (per spec).
- No special-casing for `behavior.spellcaster` (sequencer/contingency) creatures — those add triggers on top of per-spell abilities, they don't replace them (per spec).
- Matching between a memorized spell and an ability is by exact string equality between `MemorizedSpell.file` and `CreatureAbility.resource` (per spec, confirmed via `ability.service.ts` tracing).
- `index.ts` has no existing test file and this plan does not add one (per spec) — Task 2 is verified by typecheck + the real pipeline run in Task 4.

---

### Task 1: `LogService` — add `error()` severity

**Files:**
- Modify: `lib/src/services/log.service.ts`
- Test: `lib/src/services/log.service.test.ts`

**Interfaces:**
- Produces: `logService.error(message: string): void`, `logService.hasErrors(): boolean`. `logService.summary()`'s written output gains an errors line (`"No errors"` / `"1 error"` / `"N errors"`) immediately above the existing warnings line.

- [ ] **Step 1: Write the failing tests**

Update the 4 existing tests in `lib/src/services/log.service.test.ts` whose expected string includes a `summary()` call — they need the new `"No errors"` line inserted — and add 6 new tests for `error()`/`hasErrors()`. Replace the block from `it("warn increments the warning count...")` through the end of the `describe` (lines 91-122) with:

```ts
  it("warn increments the warning count while log does not", () => {
    logService.init();
    logService.log("informational line");
    logService.warn("a warning");
    logService.summary();
    expect(readLog()).toBe(
      "informational line\na warning\n\nSummary\n-------\nNo errors\n1 warning\n",
    );
  });

  it("summary reports no warnings when none were logged", () => {
    logService.init();
    logService.summary();
    expect(readLog()).toBe("\nSummary\n-------\nNo errors\nNo warnings\n");
  });

  it("summary reports a plural warning count", () => {
    logService.init();
    logService.warn("first warning");
    logService.warn("second warning");
    logService.summary();
    expect(readLog()).toBe(
      "first warning\nsecond warning\n\nSummary\n-------\nNo errors\n2 warnings\n",
    );
  });

  it("init resets the warning count across runs", () => {
    logService.init();
    logService.warn("first run warning");
    logService.init();
    logService.summary();
    expect(readLog()).toBe("\nSummary\n-------\nNo errors\nNo warnings\n");
  });

  it("error writes the same as log (indent-prefixed by the current context)", () => {
    logService.init();
    logService.header(CREATING_OGRE);
    logService.error("something is definitely broken");
    expect(readLog()).toBe(`\n${CREATING_OGRE}\n    something is definitely broken\n`);
  });

  it("error increments the error count while log does not", () => {
    logService.init();
    logService.log("informational line");
    logService.error("an error");
    logService.summary();
    expect(readLog()).toBe(
      "informational line\nan error\n\nSummary\n-------\n1 error\nNo warnings\n",
    );
  });

  it("summary reports a plural error count", () => {
    logService.init();
    logService.error("first error");
    logService.error("second error");
    logService.summary();
    expect(readLog()).toBe(
      "first error\nsecond error\n\nSummary\n-------\n2 errors\nNo warnings\n",
    );
  });

  it("init resets the error count across runs", () => {
    logService.init();
    logService.error("first run error");
    logService.init();
    logService.summary();
    expect(readLog()).toBe("\nSummary\n-------\nNo errors\nNo warnings\n");
  });

  it("hasErrors is false when no errors were logged", () => {
    logService.init();
    logService.warn("just a warning");
    expect(logService.hasErrors()).toBe(false);
  });

  it("hasErrors is true after at least one error was logged", () => {
    logService.init();
    logService.error("something is definitely broken");
    expect(logService.hasErrors()).toBe(true);
  });

  it("init resets hasErrors across runs", () => {
    logService.init();
    logService.error("first run error");
    logService.init();
    expect(logService.hasErrors()).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/services/log.service.test.ts`
Expected: FAIL — `logService.error is not a function` and `logService.hasErrors is not a function`, plus the 4 updated assertions failing on the missing `"No errors"` line.

- [ ] **Step 3: Implement `error()`, `hasErrors()`, and the updated `summary()`**

Replace the full contents of `lib/src/services/log.service.ts` with:

```ts
import * as fs from "fs";
import * as path from "path";

class LogService {
  filePath = path.join(process.cwd(), "generator.log");
  enabled = false;
  private indent = "";
  private warningCount = 0;
  private errorCount = 0;

  init(): void {
    this.indent = "";
    this.warningCount = 0;
    this.errorCount = 0;
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

  error(message: string): void {
    this.errorCount++;
    this.log(message);
  }

  hasErrors(): boolean {
    return this.errorCount > 0;
  }

  summary(): void {
    this.section("Summary");
    if (this.errorCount === 0) this.log("No errors");
    else if (this.errorCount === 1) this.log("1 error");
    else this.log(`${this.errorCount} errors`);
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

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/src/services/log.service.test.ts`
Expected: PASS (all tests green, no other suite affected — only this file imports these new members so far)

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/log.service.ts lib/src/services/log.service.test.ts
git commit -m "feat(generator): add error() severity to LogService"
```

---

### Task 2: `index.ts` — fail the process when errors were logged

**Files:**
- Modify: `lib/src/index.ts`

**Interfaces:**
- Consumes: `logService.hasErrors(): boolean` (from Task 1).

- [ ] **Step 1: Update `main()`**

In `lib/src/index.ts`, replace:

```ts
      logService.summary();
      logService.log("Finished!");
      console.log(chalk.green(`\nFinished!`));
```

with:

```ts
      logService.summary();
      if (logService.hasErrors()) {
        console.error(chalk.red(`\nGenerator finished with errors, see generator.log`));
        process.exit(1);
      }
      logService.log("Finished!");
      console.log(chalk.green(`\nFinished!`));
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc -p . --noEmit`
Expected: no errors (this file has no dedicated test suite — Task 4 exercises this branch end-to-end against the real creature roster)

- [ ] **Step 3: Commit**

```bash
git add lib/src/index.ts
git commit -m "feat(generator): fail the generator process when LogService has errors"
```

---

### Task 3: `CreatureService.checkSpellAbilities` — the consistency check

**Files:**
- Modify: `lib/src/services/creature.service.ts`
- Modify: `lib/src/factories/creature.factory.ts:177-183`
- Test: `lib/src/services/creature.service.test.ts`

**Interfaces:**
- Consumes: `creature.data.spells.memorized: MemorizedSpell[]`, `creature.data.spells.spellbooks?: SpellbookVariant[]` (each `{ mod: SpellbookModName, memorized: MemorizedSpell[] }`), `creature.adjustments: CreatureAdjustment[]` (each `.data.spells.memorized`), `creature.behavior.abilities: CreatureAbility[]` (each optionally `.resource?: string`) — all from `lib/src/model/creature/data.ts` and `lib/src/model/creature/ability.ts`. `logService.error(message: string)` / `logService.warn(message: string)` (from Task 1 / existing).
- Produces: `creatureService.checkSpellAbilities(creature: Creature): void`, called from `creatureFactory.validate()`.

- [ ] **Step 1: Write the failing tests**

In `lib/src/services/creature.service.test.ts`, change the existing first import line (currently `import { describe, expect, it } from "vitest";`) to add `vi`:

```ts
import { describe, expect, it, vi } from "vitest";
```

Change the existing `import { CreatureData, CreatureDataItems } from "../model/creature/data";` line to also pull in the two new types:

```ts
import { CreatureData, CreatureDataItems, MemorizedSpell, SpellbookVariant } from "../model/creature/data";
```

Add two new import lines to the existing import block:

```ts
import { CreatureAbility } from "../model/creature/ability";
import logService from "./log.service";
```

Then append the following helpers and `describe` block to the end of the file:

```ts
function fakeAbility(resource: string | undefined): CreatureAbility {
  return { resource } as unknown as CreatureAbility;
}

function fakeSpellCreature(p: {
  memorized?: MemorizedSpell[];
  spellbooks?: SpellbookVariant[];
  adjustmentsMemorized?: MemorizedSpell[][];
  abilities?: CreatureAbility[];
}): Creature {
  return {
    name: "test",
    data: {
      spells: {
        memorized: p.memorized ?? [],
        spellbooks: p.spellbooks,
      },
    },
    adjustments: (p.adjustmentsMemorized ?? []).map((memorized) => ({
      data: { spells: { memorized } },
    })),
    behavior: { abilities: p.abilities ?? [] },
  } as unknown as Creature;
}

describe("checkSpellAbilities", () => {
  it("does not log when every memorized spell has a matching ability", () => {
    const creature = fakeSpellCreature({
      memorized: [{ file: "sppr101" }],
      abilities: [fakeAbility("sppr101")],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("errors when a spell in the default memorized list has no matching ability", () => {
    const creature = fakeSpellCreature({
      memorized: [{ file: "sppr101" }],
      abilities: [],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("sppr101"));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("default"));
    errorSpy.mockRestore();
  });

  it("errors once per spellbook variant missing an ability, naming the variant's mod", () => {
    const creature = fakeSpellCreature({
      spellbooks: [
        { mod: "FaithsAndPowers", memorized: [{ file: "sppr201" }] },
        { mod: "Vanilla", memorized: [{ file: "sppr301" }] },
      ],
      abilities: [fakeAbility("sppr201")],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("sppr301"));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("Vanilla"));
    errorSpy.mockRestore();
  });

  it("errors when an adjustment's memorized spell has no matching ability, naming the adjustment", () => {
    const creature = fakeSpellCreature({
      adjustmentsMemorized: [[{ file: "sppr401" }]],
      abilities: [],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("sppr401"));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("adjustment #0"));
    errorSpy.mockRestore();
  });

  it("warns once when an ability references a spell that isn't memorized anywhere", () => {
    const creature = fakeSpellCreature({
      memorized: [{ file: "sppr101" }],
      abilities: [fakeAbility("sppr101"), fakeAbility("sppr999")],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("sppr999"));
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it("does not warn about an ability with no resource (e.g. a non-spell ability)", () => {
    const creature = fakeSpellCreature({
      memorized: [],
      abilities: [fakeAbility(undefined)],
    });
    const warnSpy = vi.spyOn(logService, "warn").mockImplementation(() => {});
    creatureService.checkSpellAbilities(creature);
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/services/creature.service.test.ts`
Expected: FAIL — `creatureService.checkSpellAbilities is not a function`

- [ ] **Step 3: Implement `checkSpellAbilities`**

Add these two methods to the `CreatureService` class, right after the existing `checkWeapons` method:

```ts
  checkSpellAbilities(creature: Creature): void {
    const groups = this.getSpellGroups(creature);
    const abilityResources = new Set(
      creature.behavior.abilities
        .filter((a): a is CreatureAbility & { resource: string } => a.resource !== undefined)
        .map((a) => a.resource),
    );
    const memorizedFiles = new Set(groups.flatMap((g) => g.files));
    for (const group of groups) {
      for (const file of group.files) {
        if (abilityResources.has(file)) continue;
        logService.error(
          `${figureSet.cross} ${translationService.from(creature.name)}: spell '${file}' is memorized in '${group.label}' but has no matching ability - it will never be cast.`,
        );
      }
    }
    for (const resource of abilityResources) {
      if (memorizedFiles.has(resource)) continue;
      logService.warn(
        `${figureSet.warning} ${translationService.from(creature.name)}: ability references spell '${resource}' which isn't memorized in any spellbook variant.`,
      );
    }
  }

  private getSpellGroups(creature: Creature): { label: string; files: string[] }[] {
    const groups: { label: string; files: string[] }[] = [];
    const defaultFiles = [...new Set(creature.data.spells.memorized.map((s) => s.file))];
    if (defaultFiles.length) groups.push({ label: "default", files: defaultFiles });
    for (const variant of creature.data.spells.spellbooks ?? []) {
      const files = [...new Set(variant.memorized.map((s) => s.file))];
      if (files.length) groups.push({ label: variant.mod, files });
    }
    creature.adjustments.forEach((adjustment, index) => {
      const files = [...new Set(adjustment.data.spells.memorized.map((s) => s.file))];
      if (files.length) groups.push({ label: `adjustment #${index}`, files });
    });
    return groups;
  }
```

Add the two new imports needed above (`CreatureAbility` from the ability model, and `translationService`) to `creature.service.ts`'s existing import block:

```ts
import { CreatureAbility } from "../model/creature/ability";
import translationService from "./translation.service";
```

(`group.label` is typed as plain `string` — it holds either the literal `"default"`, a `SpellbookModName` value, or an `"adjustment #N"` string, and is only ever used as display text, so no import of `SpellbookModName` is needed.)

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/src/services/creature.service.test.ts`
Expected: PASS (all tests including the 7 new `checkSpellAbilities` tests)

- [ ] **Step 5: Wire the check into `creatureFactory.validate()`**

In `lib/src/factories/creature.factory.ts`, replace:

```ts
    if (valid) State.creatures.push(creature);
    creatureService.check(creature);
    immunityService.handleImmunities(creature);
    creatureService.checkWeapons(creature);
```

with:

```ts
    if (valid) State.creatures.push(creature);
    creatureService.check(creature);
    creatureService.checkSpellAbilities(creature);
    immunityService.handleImmunities(creature);
    creatureService.checkWeapons(creature);
```

- [ ] **Step 6: Run the full test suite**

Run: `npx vitest run`
Expected: PASS — in particular `creature.factory.test.ts` and `pipeline.golden.test.ts` (the end-to-end pipeline test that runs every real creature through `validate()`) are unaffected, since `checkSpellAbilities` only calls `logService.error`/`warn` (non-throwing) and never mutates `creature.valid`.

- [ ] **Step 7: Commit**

```bash
git add lib/src/services/creature.service.ts lib/src/services/creature.service.test.ts lib/src/factories/creature.factory.ts
git commit -m "feat(generator): error when a memorized spell has no matching AI ability"
```

---

### Task 4: Run the real pipeline and report affected creatures

This task makes no code changes. Its purpose is to find out, before this ships, how many creatures besides Greater Mummy already have this bug — since Task 2 makes any such error fail the whole generator run.

**Files:** none (verification only)

- [ ] **Step 1: Run the real generator**

Run: `npx ts-node lib/src/index.ts`
Expected: this will very likely print `Generator finished with errors, see generator.log` and exit non-zero, because other creatures beyond Greater Mummy are expected to share this bug pattern.

- [ ] **Step 2: Extract every error from the log**

Run (PowerShell): `Select-String -Path generator.log -Pattern "✘" | Select-Object -First 50`

- [ ] **Step 3: Report to the user**

Summarize: total error count from the `Summary` section, the list of distinct creature names affected, and a couple of example messages. Do not attempt to fix the underlying creature definitions in this task — that's a separate follow-up once the check itself is confirmed working and the user has seen the full blast radius.

- [ ] **Step 4: Check for unintended file changes**

Run: `git status`
Expected: only `generator.log` (if not gitignored) and possibly regenerated `.tpa`/`.baf`/translation files under the mod tree from the real run in Step 1. Review with the user before committing or discarding any of these — this task does not commit anything itself.
