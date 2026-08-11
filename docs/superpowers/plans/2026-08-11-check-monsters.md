# Check-monsters Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `npm run check-monsters` — a CLI command that walks every `MonsterEnum` member and
reports which ones are **missing** (no `create()`/`createFrom()` call reachable from any family)
and which are **unvalidated** (built, but `Creature.valid` isn't `true`), so this can be re-run
any time as a standing todo list.

**Architecture:** New commander command (`check-monsters`) in the existing `lib/src/index.ts`
CLI, backed by a new `lib/src/services/check-monsters.service.ts`. The service reuses the exact
mechanism `mainService.generateCreatures()` already relies on for validity (`familyFactories`
entries call `creatureFactory.validate()` internally as they build), so no new validation logic
is written — the service only builds creatures (no WeiDU/doc/file output) and diffs the result
against `MonsterEnum`.

**Tech Stack:** TypeScript (CommonJS, Node 22, `ts-node`), commander, vitest.

## Global Constraints

- No new dependencies.
- The command never exits non-zero just because monsters are missing/unvalidated — it's an
  advisory report, not a CI gate. Only an uncaught exception (existing `handleError()` path in
  `lib/src/index.ts`) exits `1`.
- Logs to `check-monsters.log` via the existing `logService`, same convention as `copy.log` /
  `release.log`.
- Follow the existing service pattern: one class per file, instantiated once, exported as the
  default (`const xService = new XService(); export default xService;`).
- Follow the existing test pattern in this repo: no `vi.mock()` calls anywhere in the codebase —
  use `vi.spyOn()` on exported singletons, and dependency-injected parameters (with real defaults)
  where a collaborator needs to be swapped out in a test.

---

### Task 1: `diffMonsters` — pure classification logic + tests

**Files:**
- Create: `lib/src/services/check-monsters.service.ts`
- Create: `lib/src/services/check-monsters.service.test.ts`

**Interfaces:**
- Produces: `export interface CheckMonstersResult { missing: string[]; unvalidated: string[]; total: number }`
  and `export function diffMonsters(builtCreatures: { id: number; valid?: boolean }[]): CheckMonstersResult`.
  Both are consumed by Task 2's `CheckMonstersService.check()`.

- [ ] **Step 1: Write the failing tests**

Create `lib/src/services/check-monsters.service.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { MonsterEnum } from "../../creatures/monster";
import { diffMonsters } from "./check-monsters.service";

describe("diffMonsters", () => {
  it("reports a built, valid monster as neither missing nor unvalidated", () => {
    const result = diffMonsters([{ id: MonsterEnum.Wolf, valid: true }]);

    expect(result.missing).not.toContain("Wolf");
    expect(result.unvalidated).not.toContain("Wolf");
  });

  it("reports a monster with no built creature as missing", () => {
    const result = diffMonsters([]);

    expect(result.missing).toContain("Wolf");
  });

  it("reports a built creature with valid: false as unvalidated, not missing", () => {
    const result = diffMonsters([{ id: MonsterEnum.Wolf, valid: false }]);

    expect(result.unvalidated).toContain("Wolf");
    expect(result.missing).not.toContain("Wolf");
  });

  it("reports a built creature with valid: undefined as unvalidated", () => {
    const result = diffMonsters([{ id: MonsterEnum.Wolf, valid: undefined }]);

    expect(result.unvalidated).toContain("Wolf");
  });

  it("returns name lists sorted alphabetically", () => {
    const result = diffMonsters([]);

    expect(result.missing).toEqual([...result.missing].sort());
  });

  it("returns the total count of MonsterEnum members", () => {
    const result = diffMonsters([]);

    const expectedTotal = Object.values(MonsterEnum).filter((v) => typeof v === "number").length;
    expect(result.total).toBe(expectedTotal);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/src/services/check-monsters.service.test.ts`
Expected: FAIL — `check-monsters.service.ts` doesn't exist yet (`Cannot find module './check-monsters.service'`).

- [ ] **Step 3: Implement `diffMonsters`**

Create `lib/src/services/check-monsters.service.ts`:

```typescript
import { MonsterEnum } from "../../creatures/monster";

export interface CheckMonstersResult {
  missing: string[];
  unvalidated: string[];
  total: number;
}

export function diffMonsters(
  builtCreatures: { id: number; valid?: boolean }[],
): CheckMonstersResult {
  const validById = new Map<number, boolean | undefined>();
  for (const creature of builtCreatures) {
    validById.set(creature.id, creature.valid);
  }

  const missing: string[] = [];
  const unvalidated: string[] = [];
  let total = 0;
  for (const value of Object.values(MonsterEnum)) {
    if (typeof value !== "number") continue;
    total++;
    if (!validById.has(value)) {
      missing.push(MonsterEnum[value]);
    } else if (!validById.get(value)) {
      unvalidated.push(MonsterEnum[value]);
    }
  }

  missing.sort();
  unvalidated.sort();
  return { missing, unvalidated, total };
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/src/services/check-monsters.service.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/check-monsters.service.ts lib/src/services/check-monsters.service.test.ts
git commit -m "feat: add diffMonsters classification logic for check-monsters command"
```

---

### Task 2: `CheckMonstersService.check()` — build creatures via `familyFactories`, diff, log

**Files:**
- Modify: `lib/src/services/check-monsters.service.ts`
- Modify: `lib/src/services/check-monsters.service.test.ts`

**Interfaces:**
- Consumes: `diffMonsters` and `CheckMonstersResult` from Task 1 (same file); `familyFactories`
  from `../../creatures` (`(() => Family)[]`); `mainService.checkPresets()`, `checkSpells()` from
  `./main.service`; `stateService.init(): Promise<void>` from `./state.service`; `logService.init()`
  from `./log.service`.
- Produces: `checkMonstersService.check(factories?: (() => Family)[]): Promise<CheckMonstersResult>`
  (default export, singleton instance) — consumed by Task 3's `runCheckMonsters()` in
  `lib/src/index.ts`.

- [ ] **Step 1: Write the failing tests**

Add to `lib/src/services/check-monsters.service.test.ts` (new imports go at the top alongside the
existing ones; new `describe` block goes after the existing `describe("diffMonsters", ...)`):

```typescript
import { afterEach, describe, expect, it, vi } from "vitest";
import { MonsterEnum } from "../../creatures/monster";
import { Creature } from "../model/creature/creature";
import { Family } from "../model/creature/family";
import logService from "./log.service";
import mainService from "./main.service";
import stateService from "./state.service";
import checkMonstersService, { diffMonsters } from "./check-monsters.service";

afterEach(() => {
  vi.restoreAllMocks();
});

function fakeCreature(id: MonsterEnum, valid: boolean | undefined): Creature {
  return { id, valid } as unknown as Creature;
}

function fakeFamily(creatures: Creature[]): Family {
  return { id: 0, items: [], projectiles: [], spells: [], creatures };
}

describe("CheckMonstersService.check", () => {
  function stubPipeline() {
    vi.spyOn(logService, "init").mockImplementation(() => {});
    vi.spyOn(stateService, "init").mockResolvedValue(undefined);
    vi.spyOn(mainService, "checkPresets").mockImplementation(() => {});
    vi.spyOn(mainService, "checkSpells").mockImplementation(() => {});
  }

  it("collects creatures from every factory and diffs them against MonsterEnum", async () => {
    stubPipeline();
    const factories = [
      () => fakeFamily([fakeCreature(MonsterEnum.Wolf, true)]),
      () => fakeFamily([fakeCreature(MonsterEnum.Ankheg, false)]),
    ];

    const result = await checkMonstersService.check(factories);

    expect(result.missing).toContain("Medusa");
    expect(result.missing).not.toContain("Wolf");
    expect(result.missing).not.toContain("Ankheg");
    expect(result.unvalidated).toEqual(["Ankheg"]);
  });

  it("runs preflight steps in order, before building any family", async () => {
    const calls: string[] = [];
    vi.spyOn(logService, "init").mockImplementation(() => {
      calls.push("logService.init");
    });
    vi.spyOn(stateService, "init").mockImplementation(async () => {
      calls.push("stateService.init");
    });
    vi.spyOn(mainService, "checkPresets").mockImplementation(() => {
      calls.push("checkPresets");
    });
    vi.spyOn(mainService, "checkSpells").mockImplementation(() => {
      calls.push("checkSpells");
    });
    const factories = [
      () => {
        calls.push("factory");
        return fakeFamily([]);
      },
    ];

    await checkMonstersService.check(factories);

    expect(calls).toEqual([
      "logService.init",
      "stateService.init",
      "checkPresets",
      "checkSpells",
      "factory",
    ]);
  });
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/src/services/check-monsters.service.test.ts`
Expected: FAIL — `checkMonstersService` has no default export yet (`check-monsters.service.ts`
only exports `diffMonsters` and `CheckMonstersResult` so far).

- [ ] **Step 3: Implement `CheckMonstersService`**

Add to `lib/src/services/check-monsters.service.ts` (imports go at the top alongside the existing
`MonsterEnum` import; the class and its default export go after `diffMonsters`):

```typescript
import { familyFactories } from "../../creatures";
import { Family } from "../model/creature/family";
import logService from "./log.service";
import mainService from "./main.service";
import stateService from "./state.service";
```

```typescript
class CheckMonstersService {
  async check(factories: (() => Family)[] = familyFactories): Promise<CheckMonstersResult> {
    logService.init();
    await stateService.init();
    mainService.checkPresets();
    mainService.checkSpells();

    const builtCreatures: { id: number; valid?: boolean }[] = [];
    for (const factory of factories) {
      const family = factory();
      for (const creature of family.creatures) {
        builtCreatures.push({ id: creature.id, valid: creature.valid });
      }
    }
    return diffMonsters(builtCreatures);
  }
}

const checkMonstersService = new CheckMonstersService();
export default checkMonstersService;
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/src/services/check-monsters.service.test.ts`
Expected: PASS (8 tests total: 6 from Task 1 + 2 new).

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/check-monsters.service.ts lib/src/services/check-monsters.service.test.ts
git commit -m "feat: build creatures via familyFactories and diff them in CheckMonstersService"
```

---

### Task 3: Wire `check-monsters` into the CLI

**Files:**
- Modify: `lib/src/index.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: `checkMonstersService.check(): Promise<CheckMonstersResult>` from Task 2.
- Produces: `npm run check-monsters` — a runnable command, matching the existing
  `generate`/`copy`/`release` pattern in this file.

- [ ] **Step 1: Add the import**

Edit `lib/src/index.ts` — insert this line before the existing `import copyService, ...` line
(so imports stay alphabetical by module path):

```typescript
import checkMonstersService from "./services/check-monsters.service";
```

- [ ] **Step 2: Register the commander command**

Edit `lib/src/index.ts` — insert this block after the existing `copy` command's `.action(...)`
block (i.e. right before the `program.command("release")` block):

```typescript
program
  .command("check-monsters")
  .description("List MonsterEnum members that are missing or unvalidated")
  .action(async () => {
    try {
      await runCheckMonsters();
    } catch (e: unknown) {
      handleError(e);
    }
  });
```

- [ ] **Step 3: Add the `runCheckMonsters` function**

Edit `lib/src/index.ts` — insert this function after `runCopy` and before `runRelease`:

```typescript
async function runCheckMonsters(): Promise<void> {
  logService.filePath = path.join(process.cwd(), "check-monsters.log");
  const { missing, unvalidated, total } = await checkMonstersService.check();
  logService.summary();
  console.log(chalk.bold("\nChecking monsters..."));
  if (!missing.length && !unvalidated.length) {
    console.log(chalk.green("All monsters OK."));
    return;
  }
  if (missing.length) {
    console.log(
      chalk.yellow(
        `\nMissing (${missing.length}) - declared in MonsterEnum, not implemented anywhere:`,
      ),
    );
    console.log(`  ${missing.join(", ")}`);
  }
  if (unvalidated.length) {
    console.log(
      chalk.yellow(
        `\nUnvalidated (${unvalidated.length}) - implemented but failed validation, see check-monsters.log for details:`,
      ),
    );
    console.log(`  ${unvalidated.join(", ")}`);
  }
  console.log(
    chalk.bold(`\n${total - missing.length - unvalidated.length} of ${total} monsters OK.`),
  );
}
```

- [ ] **Step 4: Add the npm script**

Edit `package.json` — in `"scripts"`, add after `"release": "ts-node lib/src/index.ts release",`:

```json
    "check-monsters": "ts-node lib/src/index.ts check-monsters",
```

- [ ] **Step 5: Run the full test suite and lint**

Run: `npm run lint && npx vitest run`
Expected: PASS, no new errors.

- [ ] **Step 6: Smoke-test the real command**

Run: `npm run check-monsters`
Expected: exits 0; console output lists a "Missing" section that includes (at least) `Feyr`,
`Tiger`, `MutatedSpider`, `DeathKnight`, `DeathShade`, `Wight`, `Wraith`, `Zombie`, `ZombieJuju`,
`ZombieSea` (the known gaps described in `.claude/skills/monster-id-mapping/SKILL.md`); a
`check-monsters.log` file is created in the repo root.

- [ ] **Step 7: Commit**

```bash
git add lib/src/index.ts package.json
git commit -m "feat: add npm run check-monsters CLI command"
```

---

## Self-Review

**Spec coverage:**
- "Missing" and "unvalidated" categories, correctly distinguished → Task 1 (`diffMonsters`).
- Building creatures the same way `generate` does, without file-writing side effects → Task 2
  (`CheckMonstersService.check()`, calling `familyFactories` directly, skipping
  `weiduFamilyService`/doc generation).
- Validation reasons landing in `check-monsters.log` for free → Task 2 (`logService.init()` before
  building families means `creatureFactory.validate()`'s existing `warn()` calls are captured
  automatically — no new code needed for this).
- `npm run check-monsters` CLI surface, console summary format, exit-code-0 behavior → Task 3.
- Preflight ordering (`stateService.init` → `checkPresets` → `checkSpells` → build families) →
  Task 2, Step 1's "runs preflight steps in order" test.

**Placeholder scan:** no TBD/TODO markers; every step has real code, not a description of code.

**Type consistency:** `CheckMonstersResult` (Task 1) is the return type of both `diffMonsters` and
`CheckMonstersService.check()` (Task 2), and is destructured as `{ missing, unvalidated, total }`
in Task 3 — same three field names throughout. `factories: (() => Family)[]` (Task 2's parameter)
matches `familyFactories`' actual exported type in `lib/creatures/index.ts`.
