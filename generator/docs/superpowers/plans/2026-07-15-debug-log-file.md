# Debug Log File Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the ~40 scattered `console.log`/`console.warn` debugging calls in the generator with a single `LogService` that writes an indented, section-grouped report to `generator.log`, keeping the terminal quiet except for errors and the final summary.

**Architecture:** A new singleton `logService` (`lib/src/services/log.service.ts`), matching the existing `translationService`/`utilsService` singleton pattern, writes directly to disk via `fs.appendFileSync` on every call (no buffering). It tracks one piece of state — the current indent prefix — plus an `enabled` gate that starts `false` and flips to `true` only inside `init()`. Every existing debugging call site converts from `console.log(...)`/`console.warn(...)` to `logService.log(...)` (or `logService.header(...)` for the two "Creating..." banners in `family.ts`).

**Tech Stack:** TypeScript, Node `fs`/`path`, Vitest.

## Global Constraints

- Log file path: `path.join(process.cwd(), "generator.log")`, exposed as the public field `logService.filePath` (mirrors `State.modFolder`'s pattern of a public, test-overridable field).
- `logService.init()` truncates/creates the file and sets `logService.enabled = true`; it is called once, first thing in `index.ts`, before `stateService.init()`.
- `log()`/`section()`/`header()` are no-ops (write nothing) until `enabled` is `true`. This means the ~13 existing test files that indirectly exercise converted call sites (via `creature.service.test.ts`, `weapon.service.test.ts`, etc.) need no changes — `logService.init()` is never called during a test run, so those calls fall through silently.
- Console output during a normal run is limited to: the fatal error handler in `index.ts` (`console.error`), and the final `"Finished!"` line. Everything else moves to `logService.log(...)`.
- `chalk.*` color wrapping is dropped at every converted call site (a plain text file can't render ANSI color); `figureSet.*` symbols (from the `figures` package) stay embedded in message text since they're plain Unicode.
- The commented-out `console.log` lines in `lib/src/services/baf/target.service.ts`, `lib/src/services/utils/utils.service.ts`, and `lib/src/services/effects/poison.service.ts` (lines 249-253) are dead code and are **not** touched by this plan.
- Where a converted file's only use of `chalk` was the wrapper being dropped (`family.ts`, `creature.service.ts`, `effects/immunity.service.ts`), the now-unused `import chalk from "chalk";` line is removed too.

---

### Task 1: `LogService` core (new file + tests)

**Files:**
- Create: `lib/src/services/log.service.ts`
- Test: `lib/src/services/log.service.test.ts`

**Interfaces:**
- Produces: `logService.filePath: string` (public, mutable), `logService.enabled: boolean` (public, mutable, starts `false`), `logService.init(): void`, `logService.section(title: string): void`, `logService.header(title: string): void`, `logService.log(message: string): void`. Every later task imports the default export `logService` from `"./log.service"` (or the appropriate relative path) and calls `.log(...)`/`.header(...)`/`.section(...)`.

- [ ] **Step 1: Write the failing test file**

Create `lib/src/services/log.service.test.ts`:

```ts
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import logService from "./log.service";

describe("LogService", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-log-"));
    logService.filePath = path.join(tempDir, "generator.log");
    logService.enabled = false;
  });

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function readLog(): string {
    return fs.readFileSync(logService.filePath, "utf-8");
  }

  it("writes nothing before init() has been called", () => {
    logService.log("should not be written");
    logService.section("should not be written either");
    expect(fs.existsSync(logService.filePath)).toBe(false);
  });

  it("init creates an empty file and enables writes", () => {
    logService.init();
    expect(readLog()).toBe("");
  });

  it("init truncates a file left over from a previous run", () => {
    fs.writeFileSync(logService.filePath, "stale content from a previous run\n");
    logService.init();
    expect(readLog()).toBe("");
  });

  it("log writes a plain line with no indent right after init", () => {
    logService.init();
    logService.log("Checking cdogr, spell found: null");
    expect(readLog()).toBe("Checking cdogr, spell found: null\n");
  });

  it("section writes a blank line, the title, and a matching underline", () => {
    logService.init();
    const title = "Generating creatures";
    logService.section(title);
    expect(readLog()).toBe(`\n${title}\n${"-".repeat(title.length)}\n`);
  });

  it("header writes a blank line then the title, and indents subsequent log lines", () => {
    logService.init();
    logService.header("Creating Ogre...");
    logService.log("dual wielding detected");
    expect(readLog()).toBe("\nCreating Ogre...\n    dual wielding detected\n");
  });

  it("section resets the indent back to top-level after a header", () => {
    logService.init();
    logService.header("Creating Ogre...");
    logService.log("dual wielding detected");
    const title = "Generating common code";
    logService.section(title);
    logService.log("writing core.tpa");
    expect(readLog()).toBe(
      `\nCreating Ogre...\n    dual wielding detected\n\n${title}\n${"-".repeat(
        title.length,
      )}\nwriting core.tpa\n`,
    );
  });

  it("log indents every line of a multi-line message", () => {
    logService.init();
    logService.header("Creating Ogre...");
    logService.log("line one\nline two");
    expect(readLog()).toBe("\nCreating Ogre...\n    line one\n    line two\n");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run lib/src/services/log.service.test.ts`
Expected: FAIL — `Cannot find module './log.service'` (the file doesn't exist yet).

- [ ] **Step 3: Implement `LogService`**

Create `lib/src/services/log.service.ts`:

```ts
import * as fs from "fs";
import * as path from "path";

class LogService {
  filePath = path.join(process.cwd(), "generator.log");
  enabled = false;
  private indent = "";

  init(): void {
    this.indent = "";
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

  private write(line: string): void {
    if (!this.enabled) return;
    fs.appendFileSync(this.filePath, `${line}\n`);
  }
}

const logService = new LogService();
export default logService;
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run lib/src/services/log.service.test.ts`
Expected: PASS — 8 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/log.service.ts lib/src/services/log.service.test.ts
git commit -m "$(cat <<'EOF'
feat(generator): add LogService for writing a readable debug log file

EOF
)"
```

---

### Task 2: Wire `LogService` into `index.ts`

**Files:**
- Modify: `lib/src/index.ts`

**Interfaces:**
- Consumes: `logService.init(): void`, `logService.section(title: string): void`, `logService.log(message: string): void` (from Task 1).

- [ ] **Step 1: Update `index.ts`**

Replace the full contents of `lib/src/index.ts`:

```ts
import chalk from "chalk";
import { program } from "commander";
import logService from "./services/log.service";
import mainService from "./services/main.service";
import stateService from "./services/state.service";

program
  .version("0.0.1")
  .description("Generate WEIDU code and BAF files for IE games")
  .parse(process.argv);

async function main() {
  logService.init();
  return Promise.resolve()
    .then(() => stateService.init())
    .then(() => {
      logService.section("Checking presets");
      mainService.checkPresets();
      logService.section("Checking spells");
      mainService.checkSpells();
      logService.section("Generating creatures");
      mainService.generateCreatures();
      logService.section("Generating common code");
      mainService.generateCommonCode();
      logService.section("Generating translations");
      mainService.generateTranslations();
      logService.log("Finished!");
      console.log(chalk.green(`\nFinished!`));
    });
}

main().catch((e: unknown) => {
  const message = e instanceof Error ? e.message : String(e);
  logService.log(`ERROR: ${message}`);
  console.error(chalk.red(`\nError: ${message}`));
  process.exit(1);
});
```

- [ ] **Step 2: Run the full test suite to confirm nothing broke**

Run: `npm run test`
Expected: PASS — all existing tests still pass (no test file covers `index.ts` directly).

- [ ] **Step 3: Manually verify against a real run**

Run: `npm run atweaks`
Expected: the command completes, prints only the green `"Finished!"` line (no per-creature/warning noise) to the terminal, and a `generator.log` file appears at the generator project root containing 5 section headers ("Checking presets", "Checking spells", "Generating creatures", "Generating common code", "Generating translations") each followed by a dashed underline, ending with a final `"Finished!"` line. (Detail lines under each section will be empty at this point — they're added in later tasks.)

- [ ] **Step 4: Commit**

```bash
git add lib/src/index.ts
git commit -m "$(cat <<'EOF'
feat(generator): write phase-level sections to the debug log file

EOF
)"
```

---

### Task 3: Migrate `family.ts` + `creature.factory.ts`

**Files:**
- Modify: `lib/src/model/creature/family.ts`
- Modify: `lib/src/factories/creature.factory.ts`
- Modify: `lib/src/factories/creature.factory.test.ts`

**Interfaces:**
- Consumes: `logService.header(title: string): void`, `logService.log(message: string): void` (from Task 1).

- [ ] **Step 1: Migrate `family.ts`**

In `lib/src/model/creature/family.ts`, remove the now-unused chalk import (line 1):

```ts
import chalk from "chalk";
```

becomes (deleted — no replacement line).

Add the logService import, alongside the existing imports (after the `abilityService` import):

```ts
import abilityService from "../../services/baf/ability.service";
import logService from "../../services/log.service";
```

Replace (in `create()`):

```ts
    console.log(chalk.bold(`\nCreating ${translationService.from(p.name)}...`));
```

with:

```ts
    logService.header(`Creating ${translationService.from(p.name)}...`);
```

Replace (still in `create()`):

```ts
      console.log("autogenerate", cre.autoGenerate);
```

with:

```ts
      logService.log(`autogenerate: ${JSON.stringify(cre.autoGenerate)}`);
```

Replace (in `createFrom()`):

```ts
    console.log(
      chalk.bold(
        `\nCreating ${translationService.from(
          cre.name,
        )} from ${translationService.from(p.from.name)}...`,
      ),
    );
```

with:

```ts
    logService.header(
      `Creating ${translationService.from(cre.name)} from ${translationService.from(
        p.from.name,
      )}...`,
    );
```

- [ ] **Step 2: Migrate `creature.factory.ts`**

In `lib/src/factories/creature.factory.ts`, add the logService import (after the `immunityService` import):

```ts
import descriptionService from "../services/doc/description.service";
import immunityService from "../services/effects/immunity.service";
import logService from "../services/log.service";
```

Replace (in `equipItem()`):

```ts
      console.log(
        `${figureSet.warning} Slot ${equippedItemSlot} is already attributed to ${duplicate.stringRef ?? "unknown"}.`,
      );
```

with:

```ts
      logService.log(
        `${figureSet.warning} Slot ${equippedItemSlot} is already attributed to ${duplicate.stringRef ?? "unknown"}.`,
      );
```

Replace (in `validate()`), all five occurrences:

```ts
      console.log(`${figureSet.warning} Family doesn't match: ${creature.family} <-> ${family}`);
```
→
```ts
      logService.log(`${figureSet.warning} Family doesn't match: ${creature.family} <-> ${family}`);
```

```ts
      console.log(`${figureSet.warning} No files defined`);
```
→
```ts
      logService.log(`${figureSet.warning} No files defined`);
```

```ts
      console.log(
        `${
          figureSet.warning
        } Those files are already declared in other creatures: ${existingFiles.join(", ")}`,
      );
```
→
```ts
      logService.log(
        `${
          figureSet.warning
        } Those files are already declared in other creatures: ${existingFiles.join(", ")}`,
      );
```

```ts
      console.log(`${figureSet.warning} No attack defined, using defaults`);
```
→
```ts
      logService.log(`${figureSet.warning} No attack defined, using defaults`);
```

```ts
      console.log(`${figureSet.warning} No behavior defined, using defaults`);
```
→
```ts
      logService.log(`${figureSet.warning} No behavior defined, using defaults`);
```

- [ ] **Step 3: Update `creature.factory.test.ts`**

In `lib/src/factories/creature.factory.test.ts`, add the import (after the `creatureFactory` import):

```ts
import creatureFactory from "./creature.factory";
import logService from "../services/log.service";
```

Replace the file-header comment:

```ts
// Several tests below spy on console.log without restoring it themselves, relying on getting a
// fresh spy (no leftover call history) in the next test.
```

with:

```ts
// Several tests below spy on logService.log without restoring it themselves, relying on getting a
// fresh spy (no leftover call history) in the next test.
```

Replace both occurrences of:

```ts
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
```

with:

```ts
    const logSpy = vi.spyOn(logService, "log").mockImplementation(() => {});
```

(these are in the `"warns when the target slot is already occupied..."` and `"does not detect the conflict when..."` tests in the `equipItem` describe block.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/src/factories/creature.factory.test.ts lib/src/model/creature/family.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/src/model/creature/family.ts lib/src/factories/creature.factory.ts lib/src/factories/creature.factory.test.ts
git commit -m "$(cat <<'EOF'
refactor(generator): move family/creature-factory debug logs to LogService

EOF
)"
```

---

### Task 4: Migrate `main.service.ts`

**Files:**
- Modify: `lib/src/services/main.service.ts`
- Modify: `lib/src/services/main.service.test.ts`

**Interfaces:**
- Consumes: `logService.log(message: string): void` (from Task 1).

- [ ] **Step 1: Migrate `main.service.ts`**

In `lib/src/services/main.service.ts`, add the logService import (after `documentationService`):

```ts
import documentationService from "./doc/documentation.service";
import logService from "./log.service";
```

Replace (in `isCreatureValid()`):

```ts
      console.log(
        `${figureSet.warning} ${translationService.from(
          creature.name,
        )} has not been validated, you must call validate`,
      );
```

with:

```ts
      logService.log(
        `${figureSet.warning} ${translationService.from(
          creature.name,
        )} has not been validated, you must call validate`,
      );
```

Replace:

```ts
      console.log(
        `${figureSet.warning} ${translationService.from(
          creature.name,
        )} is not valid, please fix it !`,
      );
```

with:

```ts
      logService.log(
        `${figureSet.warning} ${translationService.from(
          creature.name,
        )} is not valid, please fix it !`,
      );
```

Replace (in `checkPresets()`):

```ts
      console.log(`Checking ${preset.preset}, spell found: ${JSON.stringify(spell)}`);
```

with:

```ts
      logService.log(`Checking ${preset.preset}, spell found: ${JSON.stringify(spell)}`);
```

- [ ] **Step 2: Update `main.service.test.ts`**

In `lib/src/services/main.service.test.ts`, add the import:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { Creature } from "../model/creature/creature";
import bafGeneratorService from "./baf/baf-generator.service";
import logService from "./log.service";
import mainService from "./main.service";
import weiduCreatureService from "./weidu/weidu-creature.service";
```

Replace the file-header comment:

```ts
// Several tests below spy on console.log without restoring it themselves, relying on getting a
// fresh spy (no leftover call history) in the next test.
```

with:

```ts
// Several tests below spy on logService.log without restoring it themselves, relying on getting a
// fresh spy (no leftover call history) in the next test.
```

Replace all four occurrences of:

```ts
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
```

with:

```ts
    const logSpy = vi.spyOn(logService, "log").mockImplementation(() => {});
```

Replace the `generateCreature` test's bare mock (no `logSpy` variable used there):

```ts
    vi.spyOn(console, "log").mockImplementation(() => {});
```

with:

```ts
    vi.spyOn(logService, "log").mockImplementation(() => {});
```

- [ ] **Step 3: Run the test to verify it passes**

Run: `npx vitest run lib/src/services/main.service.test.ts`
Expected: PASS — 4 tests.

- [ ] **Step 4: Commit**

```bash
git add lib/src/services/main.service.ts lib/src/services/main.service.test.ts
git commit -m "$(cat <<'EOF'
refactor(generator): move main-service debug logs to LogService

EOF
)"
```

---

### Task 5: Migrate `creature.service.ts` + `weapon.service.ts` + `hit-point.service.ts`

**Files:**
- Modify: `lib/src/services/creature.service.ts`
- Modify: `lib/src/services/weapon.service.ts`
- Modify: `lib/src/services/hit-point.service.ts`

**Interfaces:**
- Consumes: `logService.log(message: string): void` (from Task 1).

- [ ] **Step 1: Migrate `creature.service.ts`**

In `lib/src/services/creature.service.ts`, remove the now-unused chalk import (line 1):

```ts
import chalk from "chalk";
```

becomes (deleted).

Add the logService import (after `hitPointService`):

```ts
import hitPointService from "./hit-point.service";
import itemService from "./item.service";
import kitService from "./kit.service";
import logService from "./log.service";
import weaponService from "./weapon.service";
```

Replace:

```ts
    console.log(p.base.files);
```

with:

```ts
    logService.log(`base files: ${JSON.stringify(p.base.files)}`);
```

Replace:

```ts
      console.log(`${figureSet.arrowRight} dual wielding detected`);
```

with:

```ts
      logService.log(`${figureSet.arrowRight} dual wielding detected`);
```

Replace:

```ts
    console.log(`${figureSet.arrowRight} setting dual wield: ${p.data.apr} APR +1 offhand`);
```

with:

```ts
    logService.log(`${figureSet.arrowRight} setting dual wield: ${p.data.apr} APR +1 offhand`);
```

Replace:

```ts
      console.log(
        `${figureSet.arrowRight} movement increased to ${data.movement.getGameValue()} (barbarian): `,
      );
```

with:

```ts
      logService.log(
        `${figureSet.arrowRight} movement increased to ${data.movement.getGameValue()} (barbarian): `,
      );
```

Replace:

```ts
      console.log(`${figureSet.arrowRight} calculating THAC0 as a level ${level} creature`);
```

with:

```ts
      logService.log(`${figureSet.arrowRight} calculating THAC0 as a level ${level} creature`);
```

Replace:

```ts
    if (data.thac0 !== undefined)
      console.log(
        chalk.yellowBright(
          `${figureSet.warning} level: ${level}, hp bonus: ${data.bonusHp ?? 0}, thac0: ${data.thac0}, calculated: ${item.thac0}`,
        ),
      );
```

with:

```ts
    if (data.thac0 !== undefined)
      logService.log(
        `${figureSet.warning} level: ${level}, hp bonus: ${data.bonusHp ?? 0}, thac0: ${data.thac0}, calculated: ${item.thac0}`,
      );
```

Replace:

```ts
    if (key !== "fighter")
      console.log(
        `${figureSet.arrowRight} Level: ${p.level}, class: ${
          p.classe ?? "none"
        }, saving throws table: ${key}, ${JSON.stringify(saves)}`,
      );
```

with:

```ts
    if (key !== "fighter")
      logService.log(
        `${figureSet.arrowRight} Level: ${p.level}, class: ${
          p.classe ?? "none"
        }, saving throws table: ${key}, ${JSON.stringify(saves)}`,
      );
```

Replace:

```ts
      console.log(
        `${figureSet.arrowRight} AC reduced to ${data.ac - bonus} (was ${
          data.ac
        }) because of dexterity bonus (${bonus})`,
      );
```

with:

```ts
      logService.log(
        `${figureSet.arrowRight} AC reduced to ${data.ac - bonus} (was ${
          data.ac
        }) because of dexterity bonus (${bonus})`,
      );
```

- [ ] **Step 2: Migrate `weapon.service.ts`**

In `lib/src/services/weapon.service.ts`, add the logService import (after `figures`):

```ts
import figureSet from "figures";
import { Creature } from "../model/creature/creature";
import { EnchantmentTable } from "../model/game-data/enchantement";
import { CreatureSizeTable } from "../model/game-data/sizes";
import { ItemFlagEnum } from "../model/spell-item/effect.enums";
import { Weapon } from "../model/spell-item/spell-item";
import logService from "./log.service";
```

Replace:

```ts
      console.log(
        `${figureSet.warning} default speed of ${weapon.header.speed} from weapon ${weapon.file}.`,
      );
```

with:

```ts
      logService.log(
        `${figureSet.warning} default speed of ${weapon.header.speed} from weapon ${weapon.file}.`,
      );
```

Replace:

```ts
    console.log(`${figureSet.arrowRight} ${weapon.file} enchant: ${item.enchant}`);
```

with:

```ts
    logService.log(`${figureSet.arrowRight} ${weapon.file} enchant: ${item.enchant}`);
```

Replace:

```ts
      console.log(`${figureSet.arrowRight} Melee range: ${range.attackRange}`);
```

with:

```ts
      logService.log(`${figureSet.arrowRight} Melee range: ${range.attackRange}`);
```

- [ ] **Step 3: Migrate `hit-point.service.ts`**

In `lib/src/services/hit-point.service.ts`, add the logService import (after `figures`):

```ts
import figureSet from "figures";
import { GLOBAL_CONFIG } from "../../config/generate";
import { Creature } from "../model/creature/creature";
import { CreatureData } from "../model/creature/data";
import { ConstitutionTable } from "../model/game-data/constitution";
import { HitDiceTable, SizeBonusHitPointTable } from "../model/game-data/hp";
import { CreatureSize } from "../model/game-data/sizes";
import { PLAYER_CLASS_IDENTIFIERS } from "../model/ids/class";
import logService from "./log.service";
```

Replace:

```ts
    console.log(`${log} = ${value}`);
```

with:

```ts
    logService.log(`${log} = ${value}`);
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/src/services/creature.service.test.ts lib/src/services/weapon.service.test.ts lib/src/services/hit-point.service.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/creature.service.ts lib/src/services/weapon.service.ts lib/src/services/hit-point.service.ts
git commit -m "$(cat <<'EOF'
refactor(generator): move creature/weapon/hit-point debug logs to LogService

EOF
)"
```

---

### Task 6: Migrate `effects/immunity.service.ts` + `effects/grab.service.ts` + `effects/poison.service.ts`

**Correction (found during implementation):** the original plan text claimed
this task's companion test files needed no changes. That's wrong for two of
them — `vi.spyOn(console, "log")` (comma-separated arguments) doesn't contain
the literal substring `console.log`, so the plan's research missed it.
`immunity.service.test.ts` and `grab.service.test.ts` both spy on `console`
directly and must be retargeted to `logService.log`, same pattern as Tasks
3/4. `poison.service.test.ts` has no such spy and genuinely needs no changes.

**Files:**
- Modify: `lib/src/services/effects/immunity.service.ts`
- Modify: `lib/src/services/effects/grab.service.ts`
- Modify: `lib/src/services/effects/poison.service.ts`
- Modify: `lib/src/services/effects/immunity.service.test.ts`
- Modify: `lib/src/services/effects/grab.service.test.ts`

**Interfaces:**
- Consumes: `logService.log(message: string): void` (from Task 1).

- [ ] **Step 1: Migrate `effects/immunity.service.ts`**

In `lib/src/services/effects/immunity.service.ts`, remove the now-unused chalk import (line 1):

```ts
import chalk from "chalk";
```

becomes (deleted).

Add the logService import (after `itemService`):

```ts
import utils from "../utils/utils.service";
import itemService from "../item.service";
import logService from "../log.service";
```

Replace:

```ts
      console.log(
        chalk.yellowBright(
          `${figureSet.arrowRight} ${immunity.name} needs a helmet to cover immunity from critical hits. Adding a helmet to cover it.`,
        ),
      );
```

with:

```ts
      logService.log(
        `${figureSet.arrowRight} ${immunity.name} needs a helmet to cover immunity from critical hits. Adding a helmet to cover it.`,
      );
```

Replace:

```ts
    if (overwrittingItem)
      console.log(
        chalk.yellowBright(
          `${figureSet.arrowRight} skipping ${itemSlot.file} because ${overwrittingItem.file} overwrites it`,
        ),
      );
    else if (overwrittingSlot)
      console.log(
        chalk.redBright(
          `${figureSet.arrowRight} skipping ${immunity.name} (${itemSlot.file}) because slot ${
            Array.isArray(itemSlot.slot) ? itemSlot.slot.join(",") : itemSlot.slot
          } is already assigned`,
        ),
      );
```

with:

```ts
    if (overwrittingItem)
      logService.log(
        `${figureSet.arrowRight} skipping ${itemSlot.file} because ${overwrittingItem.file} overwrites it`,
      );
    else if (overwrittingSlot)
      logService.log(
        `${figureSet.arrowRight} skipping ${immunity.name} (${itemSlot.file}) because slot ${
          Array.isArray(itemSlot.slot) ? itemSlot.slot.join(",") : itemSlot.slot
        } is already assigned`,
      );
```

- [ ] **Step 2: Migrate `effects/grab.service.ts`**

In `lib/src/services/effects/grab.service.ts`, add the logService import (after `figures`):

```ts
import figureSet from "figures";
import { GRAB_IMMUNE_CREATURES, HUGE_CREATURES, LARGE_CREATURES } from "../../../config/creatures";
import { Creature } from "../../model/creature/creature";
import { CreatureGrabConfig, GRAB_DEFAULT_CONFIG } from "../../model/creature/grab";
import { Effect, IdsEffect } from "../../model/spell-item/effect";
import {
  EffectBonusToEnum,
  EffectCastSpellTypeEnum,
  EffectModifierTypeEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  EffectVisualEffectLocationEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  PortraitIconEnum,
} from "../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { Spell, Weapon } from "../../model/spell-item/spell-item";
import creatureService from "../creature.service";
import effectService from "./effect.service";
import logService from "../log.service";
import spellService from "../spell.service";
import translationService from "../translation.service";
import { getSpellFilename } from "../utils/misc.func";
import { CreatureSizeTable } from "../../model/game-data/sizes";
```

Replace:

```ts
      console.log(`${figureSet.warning} Creature size is needed to add grab immunities!`);
```

with:

```ts
      logService.log(`${figureSet.warning} Creature size is needed to add grab immunities!`);
```

- [ ] **Step 3: Migrate `effects/poison.service.ts`**

In `lib/src/services/effects/poison.service.ts`, add the logService import (after `descriptionService`):

```ts
import descriptionService from "../doc/description.service";
import logService from "../log.service";
import translationService from "../translation.service";
```

Replace (leave the commented-out block below it, lines 248-253, untouched):

```ts
    console.log(
      `poison (1dmg/x seconds) (${label}) => ${damage}/${duration} ==> ${type}: ${amount}/${newDuration} (total=${total}, diff duration=${
        newDuration - duration
      })`,
    );
```

with:

```ts
    logService.log(
      `poison (1dmg/x seconds) (${label}) => ${damage}/${duration} ==> ${type}: ${amount}/${newDuration} (total=${total}, diff duration=${
        newDuration - duration
      })`,
    );
```

- [ ] **Step 4: Update `effects/immunity.service.test.ts`**

Add the logService import (alongside the existing relative imports):

```ts
import logService from "../log.service";
```

Replace (in the top-level `beforeEach`):

```ts
  vi.spyOn(console, "log").mockImplementation(() => {});
```

with:

```ts
  vi.spyOn(logService, "log").mockImplementation(() => {});
```

- [ ] **Step 5: Update `effects/grab.service.test.ts`**

Add the logService import (alongside the existing relative imports):

```ts
import logService from "../log.service";
```

Replace (in the "warns when the creature has no size" test):

```ts
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
```

with:

```ts
    const consoleSpy = vi.spyOn(logService, "log").mockImplementation(() => {});
```

(keep the variable name `consoleSpy` as-is — the existing
`expect(consoleSpy).toHaveBeenCalled()` assertion works unchanged.)

- [ ] **Step 6: Run the tests to verify they pass**

Run: `npx vitest run lib/src/services/effects/immunity.service.test.ts lib/src/services/effects/grab.service.test.ts lib/src/services/effects/poison.service.test.ts`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add lib/src/services/effects/immunity.service.ts lib/src/services/effects/grab.service.ts lib/src/services/effects/poison.service.ts lib/src/services/effects/immunity.service.test.ts lib/src/services/effects/grab.service.test.ts
git commit -m "$(cat <<'EOF'
refactor(generator): move immunity/grab/poison debug logs to LogService

EOF
)"
```

---

### Task 7: Migrate `spell.service.ts` + `item.service.ts` + `model/creature/creature.ts`

**Files:**
- Modify: `lib/src/services/spell.service.ts`
- Modify: `lib/src/services/item.service.ts`
- Modify: `lib/src/model/creature/creature.ts`
- Modify: `lib/src/services/spell.service.test.ts` (comment wording only)

**Interfaces:**
- Consumes: `logService.log(message: string): void` (from Task 1).

- [ ] **Step 1: Migrate `spell.service.ts`**

In `lib/src/services/spell.service.ts`, add the logService import (after `effectService`):

```ts
import effectService from "./effects/effect.service";
import logService from "./log.service";
import translationService from "./translation.service";
```

Replace:

```ts
      console.log(`adding effect file ${spell.file} for spell ${spell.name}`);
```

with:

```ts
      logService.log(`adding effect file ${spell.file} for spell ${spell.name}`);
```

Replace:

```ts
      console.log(
        `adding projectile ${spell.file} for spell ${translationService.fromOptional(spell.name)}`,
      );
```

with:

```ts
      logService.log(
        `adding projectile ${spell.file} for spell ${translationService.fromOptional(spell.name)}`,
      );
```

- [ ] **Step 2: Migrate `item.service.ts`**

In `lib/src/services/item.service.ts`, add the logService import (after `effectService`):

```ts
import effectService from "./effects/effect.service";
import logService from "./log.service";
import translationService from "./translation.service";
```

Replace:

```ts
      console.log(
        `adding projectile ${
          item.file
        } for item ${translationService.fromOptional(item.stringRef)}`,
      );
```

with:

```ts
      logService.log(
        `adding projectile ${
          item.file
        } for item ${translationService.fromOptional(item.stringRef)}`,
      );
```

- [ ] **Step 3: Migrate `model/creature/creature.ts`**

In `lib/src/model/creature/creature.ts`, add the logService import (after `translationService`):

```ts
import translationService from "../../services/translation.service";
import logService from "../../services/log.service";
import { State } from "../state";
```

Replace:

```ts
      console.log(`replacing item in slot ${item.equippedSlot[0]}`);
```

with:

```ts
      logService.log(`replacing item in slot ${item.equippedSlot[0]}`);
```

- [ ] **Step 4: Update the stale comment in `spell.service.test.ts`**

In `lib/src/services/spell.service.test.ts`, replace:

```ts
// registered (addProjectile() reads spell.name for its console.log), but registering a real one
```

with:

```ts
// registered (addProjectile() reads spell.name for its logService.log call), but registering a real one
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run lib/src/services/spell.service.test.ts lib/src/services/item.service.test.ts lib/src/model/creature/creature.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/src/services/spell.service.ts lib/src/services/item.service.ts lib/src/model/creature/creature.ts lib/src/services/spell.service.test.ts
git commit -m "$(cat <<'EOF'
refactor(generator): move spell/item/creature debug logs to LogService

EOF
)"
```

---

### Task 8: Migrate `doc/documentation.service.ts` + `doc/description.service.ts` + `weidu/weidu-creature.service.ts`

**Correction (found during Task 6 implementation):** the original plan text
claimed these test files needed no changes. That's wrong for one of
them — `vi.spyOn(console, "warn")` (comma-separated arguments) doesn't
contain the literal substring `console.warn`, so the plan's research missed
it. `description.service.test.ts` spies on `console.warn` in two places (a
blanket `beforeEach` silencer, and a real assertion in the "warns and falls
back to raw seconds" test) and both must be retargeted to `logService.log`,
same pattern as Tasks 3/4/6. `documentation.service.test.ts` and
`weidu-creature.service.test.ts` have no such spy and genuinely need no
changes (confirmed via `vi.spyOn(console` search across the whole test tree).

**Files:**
- Modify: `lib/src/services/doc/documentation.service.ts`
- Modify: `lib/src/services/doc/description.service.ts`
- Modify: `lib/src/services/weidu/weidu-creature.service.ts`
- Modify: `lib/src/services/doc/description.service.test.ts`

**Interfaces:**
- Consumes: `logService.log(message: string): void` (from Task 1).

- [ ] **Step 1: Migrate `doc/documentation.service.ts`**

In `lib/src/services/doc/documentation.service.ts`, add the logService import (after `itemService`):

```ts
import creatureService from "../creature.service";
import itemService from "../item.service";
import logService from "../log.service";
import translationService from "../translation.service";
```

Replace:

```ts
    console.log(`Generating documentation for ${translationService.from(creature.name)}`);
```

with:

```ts
    logService.log(`Generating documentation for ${translationService.from(creature.name)}`);
```

- [ ] **Step 2: Migrate `doc/description.service.ts`**

In `lib/src/services/doc/description.service.ts`, add the logService import as the first import line:

```ts
import logService from "../log.service";
import { ImmunityConfig, ImmunityName } from "../../model/final/immunity";
import { Durations } from "../../model/game-data/durations";
```

Replace:

```ts
    console.warn(`unknown duration ${duration}s`);
```

with:

```ts
    logService.log(`unknown duration ${duration}s`);
```

- [ ] **Step 3: Migrate `weidu/weidu-creature.service.ts`**

In `lib/src/services/weidu/weidu-creature.service.ts`, add the logService import (after `immunityService`):

```ts
import immunityService from "../effects/immunity.service";
import itemService from "../item.service";
import logService from "../log.service";
import translationService from "../translation.service";
```

Replace:

```ts
        console.warn(
          `No slot defined for equipped item ${item.file}, check if it is used by an adjustment`,
        );
```

with:

```ts
        logService.log(
          `No slot defined for equipped item ${item.file}, check if it is used by an adjustment`,
        );
```

- [ ] **Step 4: Update `doc/description.service.test.ts`**

Add the logService import (alongside the existing relative imports):

```ts
import logService from "../log.service";
```

Replace (in the top-level `beforeEach`):

```ts
  vi.spyOn(console, "warn").mockImplementation(() => undefined);
```

with:

```ts
  vi.spyOn(logService, "log").mockImplementation(() => undefined);
```

Replace (in the "warns and falls back to raw seconds for a non-integer duration" test):

```ts
    const warnSpy = vi.spyOn(console, "warn");
    expect(service.getDuration(0.5)).toBe("0.5s");
    expect(warnSpy).toHaveBeenCalledWith("unknown duration 0.5s");
```

with:

```ts
    const warnSpy = vi.spyOn(logService, "log").mockImplementation(() => undefined);
    expect(service.getDuration(0.5)).toBe("0.5s");
    expect(warnSpy).toHaveBeenCalledWith("unknown duration 0.5s");
```

(`logService.log`'s real implementation is already a no-op here regardless —
`enabled` defaults to `false` and no test calls `init()` — so the added
`mockImplementation` isn't required for safety; it's added purely so this
spy matches the style of the other retargeted spies in this file.)

- [ ] **Step 5: Run the tests to verify they pass**

Run: `npx vitest run lib/src/services/doc/documentation.service.test.ts lib/src/services/doc/description.service.test.ts lib/src/services/weidu/weidu-creature.service.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/src/services/doc/documentation.service.ts lib/src/services/doc/description.service.ts lib/src/services/weidu/weidu-creature.service.ts lib/src/services/doc/description.service.test.ts
git commit -m "$(cat <<'EOF'
refactor(generator): move documentation/description/weidu-creature debug logs to LogService

EOF
)"
```

---

### Task 9: Full verification

**Files:** none (verification only)

- [ ] **Step 1: Run the full test suite**

Run: `npm run test`
Expected: PASS — all tests green, no regressions.

- [ ] **Step 2: Run lint**

Run: `npm run lint`
Expected: no errors (in particular, no unused-import errors for the removed `chalk` imports, and no unused `console` warnings).

- [ ] **Step 3: Run format check**

Run: `npm run format:check`
Expected: no formatting violations. If it reports issues, run `npm run format` and re-check.

- [ ] **Step 4: Run the generator end-to-end and inspect the log**

Run: `npm run atweaks`
Expected: terminal output is just the green `"Finished!"` line (or a red error line, if something fails). Open the generated `generator.log` at the generator project root and confirm it reads like:

```
Checking presets
-----------------
Checking cdogr, spell found: {...}

Checking spells
----------------

Generating creatures
---------------------

Creating Ogre...
    -> dual wielding detected
    ! Family doesn't match: Ogre <-> Troll

Creating Ogre Berserker from Ogre...
    -> movement increased to 12 (barbarian):
...

Generating common code
------------------------

Generating translations
-------------------------
Finished!
```

with readable section headers, blank-line spacing between creature blocks, and 4-space indentation for nested detail lines.

- [ ] **Step 5: Commit (only if format/lint produced changes)**

```bash
git add -A
git commit -m "$(cat <<'EOF'
chore(generator): apply formatting after debug log file migration

EOF
)"
```
