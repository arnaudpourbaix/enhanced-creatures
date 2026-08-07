# Copy-mod Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `copy` CLI command, separate from `generate`, that copies the mod's tp2/lib/languages into locally-configured BG1/BG2 folders for testing.

**Architecture:** A new `copy.service.ts` holds the copy logic (config loading + `fs.promises.cp`) and is wired into `index.ts` as a second commander subcommand alongside a (now explicit) `generate` subcommand, which stays the default so existing invocations are unaffected.

**Tech Stack:** TypeScript, Node's `fs.promises.cp`, commander (already a dependency), vitest.

Design spec: `docs/superpowers/specs/2026-08-07-copy-mod-command-design.md`

## Global Constraints

- Copy is for local testing only: merge-copy (overwrite matching files, never delete/clean destination files) — no zipping, no versioning.
- Copied items are exactly: `enhanced_creatures.tp2`, `lib/`, `languages/` from the repo root. Nothing else (not `docs/`, not `backup/`).
- Destination paths (`bg1`, `bg2`) come from a local, gitignored `generator/paths.local.json`; both keys are optional.
- `copy` with no flags copies to both configured targets; `--bg1`/`--bg2` restrict to one (both flags together = same as neither).
- A target that's unconfigured or whose configured path doesn't exist on disk is skipped with a warning, not a hard failure. A missing `paths.local.json` file itself *is* a hard failure (clear error pointing at the example template).
- `copy` must not be added to the `generate` pipeline — it's a fully independent command.

---

### Task 1: `copy.service.ts` — config loading + copy logic

**Files:**
- Create: `generator/lib/src/services/copy.service.ts`
- Create: `generator/lib/src/services/copy.service.test.ts`
- Create: `generator/paths.example.json`
- Modify: `.gitignore` (repo root)

**Interfaces:**
- Consumes: `logService` (`generator/lib/src/services/log.service.ts`) — `warn(message: string): void`, `header(title: string): void`, `log(message: string): void`.
- Produces: default export `copyService` with `copy(targets: CopyTargets): Promise<void>`, and exported type `CopyTargets = { bg1: boolean; bg2: boolean }`. Also public mutable fields `repoRoot`, `configPath`, `exampleConfigPath` (strings) for test overrides, following the `logService.filePath` pattern already used in this codebase.

- [ ] **Step 1: Write the failing test file**

Create `generator/lib/src/services/copy.service.test.ts`:

```typescript
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import logService from "./log.service";
import copyService from "./copy.service";

describe("CopyService", () => {
  let repoDir: string;
  let bg1Dir: string;
  let bg2Dir: string;

  beforeEach(() => {
    repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-copy-repo-"));
    bg1Dir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-copy-bg1-"));
    bg2Dir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-copy-bg2-"));

    fs.writeFileSync(path.join(repoDir, "enhanced_creatures.tp2"), "tp2 contents");
    fs.mkdirSync(path.join(repoDir, "lib", "common"), { recursive: true });
    fs.writeFileSync(path.join(repoDir, "lib", "common", "index.tpa"), "lib contents");
    fs.mkdirSync(path.join(repoDir, "languages", "english"), { recursive: true });
    fs.writeFileSync(path.join(repoDir, "languages", "english", "setup.tra"), "tra contents");

    copyService.repoRoot = repoDir;
    copyService.configPath = path.join(repoDir, "paths.local.json");
    copyService.exampleConfigPath = path.join(repoDir, "paths.example.json");

    logService.filePath = path.join(repoDir, "generator.log");
    logService.enabled = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(repoDir, { recursive: true, force: true });
    fs.rmSync(bg1Dir, { recursive: true, force: true });
    fs.rmSync(bg2Dir, { recursive: true, force: true });
  });

  function writeConfig(config: Record<string, string>): void {
    fs.writeFileSync(copyService.configPath, JSON.stringify(config));
  }

  it("throws a clear error when paths.local.json is missing", async () => {
    await expect(copyService.copy({ bg1: true, bg2: true })).rejects.toThrow(/paths\.local\.json/);
  });

  it("warns and skips a target with no configured path", async () => {
    writeConfig({});
    const warn = vi.spyOn(logService, "warn");

    await copyService.copy({ bg1: true, bg2: false });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("BG1 path is not configured"));
    expect(fs.existsSync(path.join(bg1Dir, "enhanced_creatures.tp2"))).toBe(false);
  });

  it("warns and skips a target whose configured path does not exist on disk", async () => {
    const missing = path.join(bg1Dir, "does-not-exist");
    writeConfig({ bg1: missing });
    const warn = vi.spyOn(logService, "warn");

    await copyService.copy({ bg1: true, bg2: false });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining(missing));
  });

  it("copies the tp2, lib, and languages folders into each configured, existing target", async () => {
    writeConfig({ bg1: bg1Dir, bg2: bg2Dir });

    await copyService.copy({ bg1: true, bg2: true });

    for (const dest of [bg1Dir, bg2Dir]) {
      expect(fs.readFileSync(path.join(dest, "enhanced_creatures.tp2"), "utf-8")).toBe(
        "tp2 contents",
      );
      expect(fs.readFileSync(path.join(dest, "lib", "common", "index.tpa"), "utf-8")).toBe(
        "lib contents",
      );
      expect(
        fs.readFileSync(path.join(dest, "languages", "english", "setup.tra"), "utf-8"),
      ).toBe("tra contents");
    }
  });

  it("only copies to the selected target", async () => {
    writeConfig({ bg1: bg1Dir, bg2: bg2Dir });

    await copyService.copy({ bg1: true, bg2: false });

    expect(fs.existsSync(path.join(bg1Dir, "enhanced_creatures.tp2"))).toBe(true);
    expect(fs.existsSync(path.join(bg2Dir, "enhanced_creatures.tp2"))).toBe(false);
  });

  it("merges into an existing destination without deleting unrelated files", async () => {
    writeConfig({ bg1: bg1Dir, bg2: bg2Dir });
    fs.writeFileSync(path.join(bg1Dir, "some-other-mod.tp2"), "unrelated mod");

    await copyService.copy({ bg1: true, bg2: false });

    expect(fs.readFileSync(path.join(bg1Dir, "some-other-mod.tp2"), "utf-8")).toBe(
      "unrelated mod",
    );
    expect(fs.existsSync(path.join(bg1Dir, "enhanced_creatures.tp2"))).toBe(true);
  });

  it("overwrites a stale copy of the mod already present in the destination", async () => {
    writeConfig({ bg1: bg1Dir, bg2: bg2Dir });
    fs.writeFileSync(path.join(bg1Dir, "enhanced_creatures.tp2"), "stale contents");

    await copyService.copy({ bg1: true, bg2: false });

    expect(fs.readFileSync(path.join(bg1Dir, "enhanced_creatures.tp2"), "utf-8")).toBe(
      "tp2 contents",
    );
  });
});
```

- [ ] **Step 2: Run the test file to verify it fails**

Run: `cd generator && npx vitest run lib/src/services/copy.service.test.ts`
Expected: FAIL — `Cannot find module './copy.service'` (the file doesn't exist yet).

- [ ] **Step 3: Implement `copy.service.ts`**

Create `generator/lib/src/services/copy.service.ts`:

```typescript
import * as fs from "fs";
import * as path from "path";
import logService from "./log.service";

export interface CopyTargets {
  bg1: boolean;
  bg2: boolean;
}

interface PathsConfig {
  bg1?: string;
  bg2?: string;
}

const MOD_ITEMS = ["enhanced_creatures.tp2", "lib", "languages"];

class CopyService {
  repoRoot = path.resolve(__dirname, "..", "..", "..", "..");
  configPath = path.join(this.repoRoot, "generator", "paths.local.json");
  exampleConfigPath = path.join(this.repoRoot, "generator", "paths.example.json");

  async copy(targets: CopyTargets): Promise<void> {
    const config = this.loadConfig();
    if (targets.bg1) await this.copyToTarget("BG1", config.bg1);
    if (targets.bg2) await this.copyToTarget("BG2", config.bg2);
  }

  private loadConfig(): PathsConfig {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(
        `Missing ${this.configPath}. Copy ${this.exampleConfigPath} to paths.local.json and fill in your BG1/BG2 install paths.`,
      );
    }
    const raw = fs.readFileSync(this.configPath, "utf-8");
    return JSON.parse(raw) as PathsConfig;
  }

  private async copyToTarget(label: string, destRoot: string | undefined): Promise<void> {
    if (!destRoot) {
      logService.warn(`${label} path is not configured in paths.local.json, skipping`);
      return;
    }
    if (!fs.existsSync(destRoot)) {
      logService.warn(`${label} path "${destRoot}" does not exist, skipping`);
      return;
    }
    logService.header(`Copying mod to ${label} (${destRoot})`);
    for (const item of MOD_ITEMS) {
      const src = path.join(this.repoRoot, item);
      const dest = path.join(destRoot, item);
      await fs.promises.cp(src, dest, { recursive: true, force: true });
      logService.log(`Copied ${item}`);
    }
  }
}

const copyService = new CopyService();
export default copyService;
```

- [ ] **Step 4: Run the test file to verify it passes**

Run: `cd generator && npx vitest run lib/src/services/copy.service.test.ts`
Expected: PASS (7 tests).

- [ ] **Step 5: Add the committed example config template**

Create `generator/paths.example.json`:

```json
{
  "bg1": "C:/Games/Baldur's Gate",
  "bg2": "C:/Games/Baldur's Gate II"
}
```

- [ ] **Step 6: Gitignore the local (machine-specific) config file**

In the repo root `.gitignore`, add a line next to the existing `generator/monster-defs.json` entry:

```
generator/paths.local.json
```

- [ ] **Step 7: Lint and typecheck**

Run: `cd generator && npm run lint && npx tsc -p tsconfig.eslint.json --noEmit`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add generator/lib/src/services/copy.service.ts generator/lib/src/services/copy.service.test.ts generator/paths.example.json .gitignore
git commit -m "feat: add copy.service to copy the mod into local BG1/BG2 folders"
```

---

### Task 2: Wire `copy` into the CLI as a subcommand alongside `generate`

**Files:**
- Modify: `generator/lib/src/index.ts`
- Modify: `generator/package.json`
- Modify: `generator/README.md`

**Interfaces:**
- Consumes: `copyService.copy(targets: CopyTargets): Promise<void>` and `CopyTargets` from Task 1 (`./services/copy.service`).

- [ ] **Step 1: Rewrite `index.ts` with `generate` (default) and `copy` subcommands**

Replace the full contents of `generator/lib/src/index.ts`:

```typescript
import chalk from "chalk";
import { program } from "commander";
import copyService, { CopyTargets } from "./services/copy.service";
import logService from "./services/log.service";
import mainService from "./services/main.service";
import stateService from "./services/state.service";

program.version("0.0.1").description("Generate WEIDU code and BAF files for IE games");

program
  .command("generate", { isDefault: true })
  .description("Generate WEIDU code and BAF files for IE games")
  .action(async () => {
    try {
      await runGenerate();
    } catch (e: unknown) {
      handleError(e);
    }
  });

program
  .command("copy")
  .description("Copy the mod's tp2/lib/languages into local BG1/BG2 folders for testing")
  .option("--bg1", "copy to the configured BG1 folder only")
  .option("--bg2", "copy to the configured BG2 folder only")
  .action(async (opts: { bg1?: boolean; bg2?: boolean }) => {
    try {
      await runCopy(opts);
    } catch (e: unknown) {
      handleError(e);
    }
  });

program.parseAsync(process.argv).catch((e: unknown) => handleError(e));

async function runGenerate(): Promise<void> {
  logService.init();
  await stateService.init();
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
  logService.summary();
  if (logService.hasErrors()) {
    console.error(chalk.red(`\nGenerator finished with errors, see generator.log`));
    process.exit(1);
  }
  logService.log("Finished!");
  console.log(chalk.green(`\nFinished!`));
}

async function runCopy(opts: { bg1?: boolean; bg2?: boolean }): Promise<void> {
  const bg1 = !!opts.bg1;
  const bg2 = !!opts.bg2;
  const both = !bg1 && !bg2;
  const targets: CopyTargets = { bg1: bg1 || both, bg2: bg2 || both };
  logService.init();
  await copyService.copy(targets);
  logService.summary();
  if (logService.hasErrors()) {
    console.error(chalk.red(`\nCopy finished with errors, see generator.log`));
    process.exit(1);
  }
  console.log(chalk.green(`\nFinished!`));
}

function handleError(e: unknown): never {
  const message = e instanceof Error ? e.message : String(e);
  logService.log(`ERROR: ${message}`);
  console.error(chalk.red(`\nError: ${message}`));
  process.exit(1);
}
```

- [ ] **Step 2: Add the `copy` npm script**

In `generator/package.json`, in the `scripts` block, add a line right after `"generate": "ts-node lib/src/index.ts",`:

```json
"copy": "ts-node lib/src/index.ts copy",
```

- [ ] **Step 3: Document the command**

In `generator/README.md`, add a section after the existing `## Generate` section:

```markdown
## Copy (local testing)

To copy the mod's `enhanced_creatures.tp2`, `lib/`, and `languages/` into local BG1/BG2 installs for testing, copy `paths.example.json` to `paths.local.json` and fill in your install paths, then run `npm run copy`. Pass `--bg1` or `--bg2` to copy to only one of them. This does not delete anything already in the destination — it only overwrites matching files.
```

- [ ] **Step 4: Build and typecheck**

Run: `cd generator && npm run build`
Expected: compiles with no errors (confirms `index.ts`'s commander wiring and the `copyService` import are type-correct).

- [ ] **Step 5: Manually verify both commands still run**

Run: `cd generator && npm run generate`
Expected: same output as before this change (generation pipeline runs, ends with `Finished!` in green).

Run: `cd generator && cp paths.example.json paths.local.json` then edit `paths.local.json` to point `bg1`/`bg2` at two scratch directories (e.g. under the OS temp dir), then `npm run copy`.
Expected: `tp2`/`lib`/`languages` appear under both scratch directories; console ends with `Finished!` in green. Delete `paths.local.json` and the scratch directories afterward (or leave `paths.local.json` in place for future local testing — it's gitignored).

- [ ] **Step 6: Run the full test suite**

Run: `cd generator && npm test`
Expected: all tests pass, including the new `copy.service.test.ts` suite.

- [ ] **Step 7: Commit**

```bash
git add generator/lib/src/index.ts generator/package.json generator/README.md
git commit -m "feat: add copy CLI command for local BG1/BG2 testing"
```
