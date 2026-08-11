# Release Command Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `npm run release -- <version>` — a standalone script that validates a version bump, regenerates the mod, rolls the changelog, commits/tags/pushes to `master`, packages `mod/` into a zip, and publishes a GitHub release — and fix the `copy` command, which the recent file reorg silently broke.

**Architecture:** New commander command (`release`) in the existing `lib/src/index.ts` CLI, backed by an orchestrator `lib/src/services/release/release.service.ts` that composes small, focused services (version-file editing, changelog rollover, git, GitHub CLI, zip packaging) — mirroring how `lib/src/services/weidu/` and `lib/src/services/doc/` are already decomposed. `generate`'s orchestration is extracted into a reusable `mainService.generateAll()` so both the `generate` command and the release flow share one implementation. `mod/CHANGELOG.md` → `docs/changelog.html` rendering moves out of the generate pipeline (it only means something at release time) and becomes an explicit release step.

**Tech Stack:** TypeScript (CommonJS, Node 22, `ts-node`), commander, vitest, `adm-zip` (new dependency) for zip creation, `child_process.execFileSync` for `git`/`gh` calls.

## Global Constraints

- Version format is plain semver `X.Y.Z` only — no `v` prefix on the CLI arg, no prerelease/build metadata.
- `package.json`'s `version` and `mod/enhanced_creatures.tp2`'s `VERSION ~vX.Y.Z~` line must already match before a release can start; the release script does not reconcile a mismatch, it aborts.
- Releases are cut from `master` only, from a clean, up-to-date working tree.
- The GitHub CLI (`gh`) must already be installed and authenticated (`gh auth login`) — the script only checks, never installs/authenticates.
- `mod/` is the single source of truth for shipped content: both the `copy` command and the release zip must copy/package *everything* currently under `mod/`, never a hardcoded file list.
- `dist/` is already gitignored — the release zip is written there. Add `release.log` to `.gitignore` alongside the existing `generator.log`/`copy.log` entries.
- Follow the existing service pattern throughout: one class per file, instantiated once, exported as the default (`const xService = new XService(); export default xService;`).

---

### Task 1: Align `package.json` and the tp2's version, add the `release` script and `adm-zip` dependency

**Files:**
- Modify: `package.json`
- Modify: `mod/enhanced_creatures.tp2:6`

**Interfaces:**
- Produces: `package.json` `"version": "0.1.0"`, a `"release": "ts-node lib/src/index.ts release"` script, and `adm-zip`/`@types/adm-zip` in dependencies/devDependencies. `mod/enhanced_creatures.tp2` line 6 becomes `VERSION ~v0.1.0~`. Later tasks' "versions must match" precheck relies on these already agreeing.

- [ ] **Step 1: Bump `package.json`'s version and add the release script**

Edit `package.json`:
- Line 3: `"version": "0.0.1",` → `"version": "0.1.0",`
- In `"scripts"`, add after `"copy": "ts-node lib/src/index.ts copy",`:
  ```json
    "release": "ts-node lib/src/index.ts release",
  ```

- [ ] **Step 2: Add the `adm-zip` dependency**

Run: `npm install adm-zip@^0.6.0` and `npm install -D @types/adm-zip@^0.5.8`

- [ ] **Step 3: Bump the tp2's VERSION line**

Edit `mod/enhanced_creatures.tp2:6`: `VERSION ~v0.1~` → `VERSION ~v0.1.0~`

- [ ] **Step 4: Verify the project still builds and tests still pass**

Run: `npm run lint && npx vitest run`
Expected: PASS (no test currently asserts on these exact version strings).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json mod/enhanced_creatures.tp2
git commit -m "chore: align package.json and tp2 versions at 0.1.0, add release script and adm-zip"
```

---

### Task 2: Fix `copy.service.ts` — correct paths, copy all of `mod/` instead of a hardcoded list

**Files:**
- Modify: `lib/src/services/copy.service.ts`
- Modify: `lib/src/services/copy.service.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `copyService.copy(targets: CopyTargets): Promise<number>` — same public signature as today, unchanged for `lib/src/index.ts`'s `runCopy`.

The `73bceff refactor: reorganize files structure` commit moved this file one directory shallower (`generator/lib/src/services/` → `lib/src/services/`) without updating its path math: `repoRoot` now resolves one directory *above* the actual repo root, `configPath`/`exampleConfigPath` still expect a `generator/` subfolder that no longer exists, and the hardcoded `MOD_ITEMS` list copies from the repo root instead of `mod/`.

- [ ] **Step 1: Write the failing tests for the fixed behavior**

Replace `lib/src/services/copy.service.test.ts` entirely with:

```typescript
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import logService from "./log.service";
import copyService from "./copy.service";

describe("CopyService", () => {
  const TP2_FILE = "enhanced_creatures.tp2";
  const TP2_CONTENTS = "tp2 contents";
  const MOD_SUBFOLDER = "enhanced_creatures";
  const CHANGELOG_FILE = "CHANGELOG.md";

  let repoDir: string;
  let bg1Dir: string;
  let bg2Dir: string;

  beforeEach(() => {
    repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-copy-repo-"));
    bg1Dir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-copy-bg1-"));
    bg2Dir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-copy-bg2-"));

    const modDir = path.join(repoDir, "mod");
    fs.writeFileSync(path.join(modDir, TP2_FILE), TP2_CONTENTS);
    fs.mkdirSync(path.join(modDir, "lib", "common"), { recursive: true });
    fs.writeFileSync(path.join(modDir, "lib", "common", "index.tpa"), "lib contents");
    fs.mkdirSync(path.join(modDir, "languages", "english"), { recursive: true });
    fs.writeFileSync(path.join(modDir, "languages", "english", "setup.tra"), "tra contents");
    fs.mkdirSync(path.join(modDir, "docs"), { recursive: true });
    fs.writeFileSync(path.join(modDir, "docs", "index.html"), "docs contents");
    fs.writeFileSync(path.join(modDir, CHANGELOG_FILE), "changelog contents");

    copyService.repoRoot = repoDir;
    copyService.modDir = modDir;
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

  function modPath(dest: string, ...segments: string[]): string {
    return path.join(dest, MOD_SUBFOLDER, ...segments);
  }

  it("throws a clear error when paths.local.json is missing", async () => {
    await expect(copyService.copy({ bg1: true, bg2: true })).rejects.toThrow(/paths\.local\.json/);
  });

  it("warns and skips a target with no configured path", async () => {
    writeConfig({});
    const warn = vi.spyOn(logService, "warn");

    await copyService.copy({ bg1: true, bg2: false });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("BG1 path is not configured"));
    expect(fs.existsSync(modPath(bg1Dir, TP2_FILE))).toBe(false);
  });

  it("warns and skips a target whose configured path does not exist on disk", async () => {
    const missing = path.join(bg1Dir, "does-not-exist");
    writeConfig({ bg1: missing });
    const warn = vi.spyOn(logService, "warn");

    await copyService.copy({ bg1: true, bg2: false });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining(missing));
  });

  it("copies everything under mod/, nested under enhanced_creatures/, into each configured, existing target", async () => {
    writeConfig({ bg1: bg1Dir, bg2: bg2Dir });

    await copyService.copy({ bg1: true, bg2: true });

    for (const dest of [bg1Dir, bg2Dir]) {
      expect(fs.readFileSync(modPath(dest, TP2_FILE), "utf-8")).toBe(TP2_CONTENTS);
      expect(fs.readFileSync(modPath(dest, "lib", "common", "index.tpa"), "utf-8")).toBe(
        "lib contents",
      );
      expect(fs.readFileSync(modPath(dest, "languages", "english", "setup.tra"), "utf-8")).toBe(
        "tra contents",
      );
      expect(fs.readFileSync(modPath(dest, "docs", "index.html"), "utf-8")).toBe("docs contents");
      expect(fs.readFileSync(modPath(dest, CHANGELOG_FILE), "utf-8")).toBe("changelog contents");
    }
  });

  it("picks up a file added under mod/ without any code change", async () => {
    writeConfig({ bg1: bg1Dir, bg2: bg2Dir });
    fs.writeFileSync(path.join(repoDir, "mod", "new-file.txt"), "brand new");

    await copyService.copy({ bg1: true, bg2: false });

    expect(fs.readFileSync(modPath(bg1Dir, "new-file.txt"), "utf-8")).toBe("brand new");
  });

  it("only copies to the selected target", async () => {
    writeConfig({ bg1: bg1Dir, bg2: bg2Dir });

    await copyService.copy({ bg1: true, bg2: false });

    expect(fs.existsSync(modPath(bg1Dir, TP2_FILE))).toBe(true);
    expect(fs.existsSync(modPath(bg2Dir, TP2_FILE))).toBe(false);
  });

  it("merges into an existing destination without deleting unrelated files", async () => {
    writeConfig({ bg1: bg1Dir, bg2: bg2Dir });
    fs.writeFileSync(path.join(bg1Dir, "some-other-mod.tp2"), "unrelated mod");
    fs.mkdirSync(modPath(bg1Dir), { recursive: true });
    fs.writeFileSync(modPath(bg1Dir, "leftover.txt"), "leftover from a previous install");

    await copyService.copy({ bg1: true, bg2: false });

    expect(fs.readFileSync(path.join(bg1Dir, "some-other-mod.tp2"), "utf-8")).toBe("unrelated mod");
    expect(fs.readFileSync(modPath(bg1Dir, "leftover.txt"), "utf-8")).toBe(
      "leftover from a previous install",
    );
    expect(fs.existsSync(modPath(bg1Dir, TP2_FILE))).toBe(true);
  });

  it("overwrites a stale copy of the mod already present in the destination", async () => {
    writeConfig({ bg1: bg1Dir, bg2: bg2Dir });
    fs.mkdirSync(modPath(bg1Dir), { recursive: true });
    fs.writeFileSync(modPath(bg1Dir, TP2_FILE), "stale contents");

    await copyService.copy({ bg1: true, bg2: false });

    expect(fs.readFileSync(modPath(bg1Dir, TP2_FILE), "utf-8")).toBe(TP2_CONTENTS);
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run lib/src/services/copy.service.test.ts`
Expected: FAIL — `repoDir`'s `mod/` subfolder isn't where the current code looks (it still reads `MOD_ITEMS` straight off `repoRoot`), and `configPath` resolution is off by a directory.

- [ ] **Step 3: Fix `copy.service.ts`**

Replace `lib/src/services/copy.service.ts` entirely with:

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

// The tp2's %MOD_FOLDER% macro resolves to wherever enhanced_creatures.tp2 itself sits, so
// everything must land inside this subfolder (with the tp2) rather than at the destination's
// root - otherwise %MOD_FOLDER%/lib/... resolves to the game root instead of the mod's own files.
const MOD_SUBFOLDER = "enhanced_creatures";

class CopyService {
  repoRoot = path.resolve(__dirname, "..", "..", "..");
  modDir = path.join(this.repoRoot, "mod");
  configPath = path.join(this.repoRoot, "paths.local.json");
  exampleConfigPath = path.join(this.repoRoot, "paths.example.json");

  async copy(targets: CopyTargets): Promise<number> {
    const config = this.loadConfig();
    let copiedCount = 0;
    if (targets.bg1 && (await this.copyToTarget("BG1", config.bg1))) copiedCount++;
    if (targets.bg2 && (await this.copyToTarget("BG2", config.bg2))) copiedCount++;
    return copiedCount;
  }

  private loadConfig(): PathsConfig {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(
        `Missing ${this.configPath}. Copy ${this.exampleConfigPath} to paths.local.json and fill in your BG1/BG2 install paths.`,
      );
    }
    const raw = fs.readFileSync(this.configPath, "utf-8");
    try {
      return JSON.parse(raw) as PathsConfig;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to parse ${this.configPath}: ${message}`, { cause: e });
    }
  }

  private async copyToTarget(label: string, destRoot: string | undefined): Promise<boolean> {
    if (!destRoot) {
      logService.warn(`${label} path is not configured in paths.local.json, skipping`);
      return false;
    }
    if (!fs.existsSync(destRoot)) {
      logService.warn(`${label} path "${destRoot}" does not exist, skipping`);
      return false;
    }
    logService.header(`Copying mod to ${label} (${destRoot})`);
    const dest = path.join(destRoot, MOD_SUBFOLDER);
    await fs.promises.cp(this.modDir, dest, { recursive: true, force: true });
    logService.log(`Copied ${this.modDir} contents`);
    return true;
  }
}

const copyService = new CopyService();
export default copyService;
```

Note: `repoRoot` now uses 3 `..` (this file lives at `lib/src/services/copy.service.ts`, three directories below the repo root), and `modDir`/`configPath`/`exampleConfigPath` are derived from the corrected `repoRoot`. The old `docs/superpowers` exclusion filter is dropped: it filtered a path that can only ever appear under the repo root's own `docs/superpowers/` (this repo's dev-process specs, written by the `superpowers:brainstorming` skill), never under `mod/docs/`, so it could never fire once the copy source is `mod/` — the copy now takes literally everything under `mod/`, as intended.

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npx vitest run lib/src/services/copy.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/copy.service.ts lib/src/services/copy.service.test.ts
git commit -m "fix: correct copy.service.ts paths after the file reorg, copy all of mod/ instead of a fixed list"
```

---

### Task 3: `version.utils.ts` — semver parsing and comparison

**Files:**
- Create: `lib/src/services/utils/version.utils.ts`
- Create: `lib/src/services/utils/version.utils.test.ts`

**Interfaces:**
- Produces: `parseVersion(value: string): SemVer` (throws on anything not exactly `X.Y.Z`), `isGreater(next: SemVer, current: SemVer): boolean`, and the `SemVer` interface (`{ major: number; minor: number; patch: number }`). Task 8's `release.service.ts` imports both.

- [ ] **Step 1: Write the failing tests**

Create `lib/src/services/utils/version.utils.test.ts`:

```typescript
import { describe, expect, it } from "vitest";
import { isGreater, parseVersion } from "./version.utils";

describe("parseVersion", () => {
  it("parses a valid X.Y.Z version", () => {
    expect(parseVersion("1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it.each(["1.2", "1.2.3.4", "v1.2.3", "1.2.3-beta", "", "a.b.c"])(
    "throws for invalid version %s",
    (value) => {
      expect(() => parseVersion(value)).toThrow(/not a valid version/);
    },
  );
});

describe("isGreater", () => {
  it("returns true when the major version is greater", () => {
    expect(isGreater(parseVersion("2.0.0"), parseVersion("1.9.9"))).toBe(true);
  });

  it("returns true when the minor version is greater at the same major", () => {
    expect(isGreater(parseVersion("1.3.0"), parseVersion("1.2.9"))).toBe(true);
  });

  it("returns true when the patch version is greater at the same major.minor", () => {
    expect(isGreater(parseVersion("1.2.4"), parseVersion("1.2.3"))).toBe(true);
  });

  it("returns false when versions are equal", () => {
    expect(isGreater(parseVersion("1.2.3"), parseVersion("1.2.3"))).toBe(false);
  });

  it("returns false when next is lower than current", () => {
    expect(isGreater(parseVersion("1.2.3"), parseVersion("1.2.4"))).toBe(false);
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run lib/src/services/utils/version.utils.test.ts`
Expected: FAIL with "Cannot find module './version.utils'"

- [ ] **Step 3: Implement `version.utils.ts`**

Create `lib/src/services/utils/version.utils.ts`:

```typescript
export interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

const SEMVER_PATTERN = /^(\d+)\.(\d+)\.(\d+)$/;

export function parseVersion(value: string): SemVer {
  const match = SEMVER_PATTERN.exec(value);
  if (!match) {
    throw new Error(`"${value}" is not a valid version (expected X.Y.Z)`);
  }
  return { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]) };
}

export function isGreater(next: SemVer, current: SemVer): boolean {
  if (next.major !== current.major) return next.major > current.major;
  if (next.minor !== current.minor) return next.minor > current.minor;
  return next.patch > current.patch;
}
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npx vitest run lib/src/services/utils/version.utils.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/utils/version.utils.ts lib/src/services/utils/version.utils.test.ts
git commit -m "feat: add semver parse/compare utils for the release command"
```

---

### Task 4: Extract `mainService.generateAll()`, decouple changelog rendering from `generate`

**Files:**
- Modify: `lib/src/services/main.service.ts`
- Modify: `lib/src/services/main.service.test.ts`
- Modify: `lib/src/index.ts:1-57`
- Modify: `lib/src/services/pipeline.golden.test.ts:32-39`

**Interfaces:**
- Consumes: `stateService.init()`, `logService.{init,section,summary,hasErrors,log}` (all exist today).
- Produces: `mainService.generateAll(): Promise<void>` — runs the full generate pipeline (presets/spells checks, creature/common-code/translation generation) and **throws** `Error("Generator finished with errors, see generator.log")` if `logService.hasErrors()` afterward, instead of calling `process.exit`. Task 8's `release.service.ts` calls this directly. `generateCreatures()` no longer calls `changelogService.generate()` — Task 5/8 move that into the release flow, since a changelog only means something at release time and `generate` runs (with its Fisher–Yates shuffle) on every dev iteration.

- [ ] **Step 1: Write the failing tests for `generateAll()`**

Add to `lib/src/services/main.service.test.ts` (new imports: `logService` is already imported; add `stateService`):

```typescript
import stateService from "./state.service";
```

Add a new `describe` block at the end of the file:

```typescript
describe("generateAll", () => {
  function stubPipeline() {
    vi.spyOn(stateService, "init").mockResolvedValue(undefined);
    vi.spyOn(mainService, "checkPresets").mockImplementation(() => {});
    vi.spyOn(mainService, "checkSpells").mockImplementation(() => {});
    vi.spyOn(mainService, "generateCreatures").mockImplementation(() => {});
    vi.spyOn(mainService, "generateCommonCode").mockImplementation(() => {});
    vi.spyOn(mainService, "generateTranslations").mockImplementation(() => {});
    vi.spyOn(logService, "init").mockImplementation(() => {});
    vi.spyOn(logService, "section").mockImplementation(() => {});
    vi.spyOn(logService, "summary").mockImplementation(() => {});
  }

  it("resolves without throwing when generation has no errors", async () => {
    stubPipeline();
    vi.spyOn(logService, "hasErrors").mockReturnValue(false);

    await expect(mainService.generateAll()).resolves.toBeUndefined();
  });

  it("throws when generation finishes with errors", async () => {
    stubPipeline();
    vi.spyOn(logService, "hasErrors").mockReturnValue(true);

    await expect(mainService.generateAll()).rejects.toThrow(/finished with errors/);
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run lib/src/services/main.service.test.ts`
Expected: FAIL with "mainService.generateAll is not a function"

- [ ] **Step 3: Add `generateAll()` and remove the `changelogService.generate()` call**

In `lib/src/services/main.service.ts`:

Change the import block (line 7) — remove the now-unused `changelogService` import:
```typescript
import descriptionService from "./doc/description.service";
import documentationService from "./doc/documentation.service";
import logService from "./log.service";
import stateService from "./state.service";
import translationService from "./translation.service";
```
(drop `import changelogService from "./doc/changelog.service";`, add `import stateService from "./state.service";`)

In `generateCreatures()` (around line 37), remove the changelog line:
```typescript
    documentationService.generate();
```
(delete the `changelogService.generate();` line that followed it)

Add a new method to the `MainService` class, e.g. right after `checkSpells()`:

```typescript
  async generateAll(): Promise<void> {
    logService.init();
    await stateService.init();
    logService.section("Checking presets");
    this.checkPresets();
    logService.section("Checking spells");
    this.checkSpells();
    logService.section("Generating creatures");
    this.generateCreatures();
    logService.section("Generating common code");
    this.generateCommonCode();
    logService.section("Generating translations");
    this.generateTranslations();
    logService.summary();
    if (logService.hasErrors()) {
      throw new Error("Generator finished with errors, see generator.log");
    }
  }
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npx vitest run lib/src/services/main.service.test.ts`
Expected: PASS

- [ ] **Step 5: Update `index.ts` to delegate to `generateAll()`**

In `lib/src/index.ts`, remove the now-unused `stateService` import (line 7: `import stateService from "./services/state.service";`) and replace `runGenerate()` (lines 37-57):

```typescript
async function runGenerate(): Promise<void> {
  await mainService.generateAll();
  logService.log("Finished!");
  console.log(chalk.green(`\nFinished!`));
}
```

- [ ] **Step 6: Update the golden pipeline test — `docs/changelog.html` is no longer produced by `generateCreatures()`**

In `lib/src/services/pipeline.golden.test.ts`, remove line 37 (`"docs/changelog.html",`) from `FIXED_GENERATED_FILES` (lines 32-39):

```typescript
const FIXED_GENERATED_FILES = [
  "lib/common/spell-resources.tpa",
  "lib/common/spell-functions.tpa",
  "lib/common/immunities.tpa",
  "docs/monsters.html",
  ...LANGUAGES.map((lang) => `languages/${lang}/generated.tra`),
];
```

- [ ] **Step 7: Run the full suite and generate once to confirm nothing else regressed**

Run: `npx vitest run && npm run generate`
Expected: all tests PASS; `npm run generate` finishes with "Finished!" and no longer touches `mod/docs/changelog.html` (check with `git status` — it should show no diff for that file after this run, since its content didn't change and generation no longer rewrites it).

- [ ] **Step 8: Commit**

```bash
git add lib/src/services/main.service.ts lib/src/services/main.service.test.ts lib/src/index.ts lib/src/services/pipeline.golden.test.ts
git commit -m "refactor: extract mainService.generateAll(), stop rendering changelog.html during generate"
```

---

### Task 5: `release-changelog.service.ts` — roll `[Unreleased]` into a version section, extract release notes

**Files:**
- Create: `lib/src/services/release/release-changelog.service.ts`
- Create: `lib/src/services/release/release-changelog.service.test.ts`

**Interfaces:**
- Produces: `rollover(changelogPath: string, version: string, date: string): void` and `extractNotes(changelogPath: string, version: string): string`. Task 8 calls `rollover` with today's date (`YYYY-MM-DD`) right after bumping the version files, then calls `extractNotes` (works whether `rollover` ran this session or in a prior, resumed run) to get the GitHub release body.

- [ ] **Step 1: Write the failing tests**

Create `lib/src/services/release/release-changelog.service.test.ts`:

```typescript
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import releaseChangelogService from "./release-changelog.service";

describe("ReleaseChangelogService", () => {
  let dir: string;
  let changelogPath: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-changelog-"));
    changelogPath = path.join(dir, "CHANGELOG.md");
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  function writeChangelog(content: string): void {
    fs.writeFileSync(changelogPath, content);
  }

  describe("rollover", () => {
    it("renames [Unreleased] to the new version section and inserts a fresh blank [Unreleased] above it", () => {
      writeChangelog(
        [
          "# Changelog",
          "",
          "## [Unreleased]",
          "",
          "### Added",
          "",
          "- Initial public documentation website.",
          "",
        ].join("\n"),
      );

      releaseChangelogService.rollover(changelogPath, "0.2.0", "2026-08-11");

      const result = fs.readFileSync(changelogPath, "utf-8");
      expect(result).toContain("## [Unreleased]\n\n## [0.2.0] - 2026-08-11");
      expect(result).toContain("### Added\n\n- Initial public documentation website.");
    });

    it("throws when there is no [Unreleased] section", () => {
      writeChangelog("# Changelog\n\n## [0.1.0] - 2026-01-01\n");

      expect(() => releaseChangelogService.rollover(changelogPath, "0.2.0", "2026-08-11")).toThrow(
        /no "## \[Unreleased\]" section/,
      );
    });
  });

  describe("extractNotes", () => {
    it("returns the body between the version heading and the next heading", () => {
      writeChangelog(
        [
          "# Changelog",
          "",
          "## [Unreleased]",
          "",
          "## [0.2.0] - 2026-08-11",
          "",
          "### Added",
          "",
          "- Something new.",
          "",
          "## [0.1.0] - 2026-01-01",
          "",
          "### Added",
          "",
          "- First release.",
          "",
        ].join("\n"),
      );

      expect(releaseChangelogService.extractNotes(changelogPath, "0.2.0")).toBe(
        "### Added\n\n- Something new.",
      );
    });

    it("returns the body through EOF when the version section is last", () => {
      writeChangelog(["## [Unreleased]", "", "## [0.1.0] - 2026-01-01", "", "- First release."].join("\n"));

      expect(releaseChangelogService.extractNotes(changelogPath, "0.1.0")).toBe("- First release.");
    });

    it("throws when the version section is not found", () => {
      writeChangelog("## [Unreleased]\n");

      expect(() => releaseChangelogService.extractNotes(changelogPath, "0.2.0")).toThrow(
        /no "## \[0\.2\.0\]" section/,
      );
    });
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run lib/src/services/release/release-changelog.service.test.ts`
Expected: FAIL with "Cannot find module './release-changelog.service'"

- [ ] **Step 3: Implement `release-changelog.service.ts`**

Create `lib/src/services/release/release-changelog.service.ts`:

```typescript
import * as fs from "fs";

const UNRELEASED_HEADING = "## [Unreleased]";

class ReleaseChangelogService {
  rollover(changelogPath: string, version: string, date: string): void {
    const content = fs.readFileSync(changelogPath, "utf-8");
    if (!content.includes(UNRELEASED_HEADING)) {
      throw new Error(`${changelogPath} has no "${UNRELEASED_HEADING}" section`);
    }
    const updated = content.replace(
      UNRELEASED_HEADING,
      `${UNRELEASED_HEADING}\n\n## [${version}] - ${date}`,
    );
    fs.writeFileSync(changelogPath, updated);
  }

  extractNotes(changelogPath: string, version: string): string {
    const heading = `## [${version}]`;
    const lines = fs.readFileSync(changelogPath, "utf-8").split("\n");
    const startIndex = lines.findIndex((line) => line.startsWith(heading));
    if (startIndex === -1) {
      throw new Error(`${changelogPath} has no "${heading}" section`);
    }
    let endIndex = lines.findIndex((line, i) => i > startIndex && line.startsWith("## "));
    if (endIndex === -1) endIndex = lines.length;
    return lines
      .slice(startIndex + 1, endIndex)
      .join("\n")
      .trim();
  }
}

const releaseChangelogService = new ReleaseChangelogService();
export default releaseChangelogService;
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npx vitest run lib/src/services/release/release-changelog.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/release/release-changelog.service.ts lib/src/services/release/release-changelog.service.test.ts
git commit -m "feat: add changelog rollover/notes-extraction for the release command"
```

---

### Task 6: `release-version-files.service.ts` — read/write the version in `package.json` and the tp2

**Files:**
- Create: `lib/src/services/release/release-version-files.service.ts`
- Create: `lib/src/services/release/release-version-files.service.test.ts`

**Interfaces:**
- Produces: `readPackageVersion(packageJsonPath): string`, `writePackageVersion(packageJsonPath, version): void`, `readTp2Version(tp2Path): string`, `writeTp2Version(tp2Path, version): void`. Both read functions throw if the expected field/line is missing. Task 8 uses all four.

- [ ] **Step 1: Write the failing tests**

Create `lib/src/services/release/release-version-files.service.test.ts`:

```typescript
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import releaseVersionFilesService from "./release-version-files.service";

describe("ReleaseVersionFilesService", () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-version-files-"));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  describe("package.json", () => {
    let packageJsonPath: string;

    beforeEach(() => {
      packageJsonPath = path.join(dir, "package.json");
      fs.writeFileSync(packageJsonPath, '{\n  "name": "test",\n  "version": "0.1.0"\n}\n');
    });

    it("reads the version field", () => {
      expect(releaseVersionFilesService.readPackageVersion(packageJsonPath)).toBe("0.1.0");
    });

    it("writes the version field without disturbing the rest of the file", () => {
      releaseVersionFilesService.writePackageVersion(packageJsonPath, "0.2.0");

      const content = fs.readFileSync(packageJsonPath, "utf-8");
      expect(content).toContain('"version": "0.2.0"');
      expect(content).toContain('"name": "test"');
    });

    it("throws when there is no version field", () => {
      fs.writeFileSync(packageJsonPath, "{}");
      expect(() => releaseVersionFilesService.readPackageVersion(packageJsonPath)).toThrow(
        /no "version" field/,
      );
    });
  });

  describe("tp2", () => {
    let tp2Path: string;

    beforeEach(() => {
      tp2Path = path.join(dir, "enhanced_creatures.tp2");
      fs.writeFileSync(tp2Path, 'AUTHOR "Aigleborgne"\nVERSION ~v0.1.0~\n\nALWAYS\n');
    });

    it("reads the version from the VERSION line", () => {
      expect(releaseVersionFilesService.readTp2Version(tp2Path)).toBe("0.1.0");
    });

    it("writes the version into the VERSION line without disturbing the rest of the file", () => {
      releaseVersionFilesService.writeTp2Version(tp2Path, "0.2.0");

      const content = fs.readFileSync(tp2Path, "utf-8");
      expect(content).toContain("VERSION ~v0.2.0~");
      expect(content).toContain('AUTHOR "Aigleborgne"');
      expect(content).toContain("ALWAYS");
    });

    it("throws when there is no VERSION line", () => {
      fs.writeFileSync(tp2Path, "AUTHOR \"Aigleborgne\"\n");
      expect(() => releaseVersionFilesService.readTp2Version(tp2Path)).toThrow(
        /no "VERSION ~v...~" line/,
      );
    });
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run lib/src/services/release/release-version-files.service.test.ts`
Expected: FAIL with "Cannot find module './release-version-files.service'"

- [ ] **Step 3: Implement `release-version-files.service.ts`**

Create `lib/src/services/release/release-version-files.service.ts`:

```typescript
import * as fs from "fs";

const PACKAGE_VERSION_PATTERN = /"version":\s*"([^"]+)"/;
const TP2_VERSION_PATTERN = /VERSION ~v([^~]+)~/;

class ReleaseVersionFilesService {
  readPackageVersion(packageJsonPath: string): string {
    const content = fs.readFileSync(packageJsonPath, "utf-8");
    const match = PACKAGE_VERSION_PATTERN.exec(content);
    if (!match) throw new Error(`${packageJsonPath} has no "version" field`);
    return match[1];
  }

  writePackageVersion(packageJsonPath: string, version: string): void {
    const content = fs.readFileSync(packageJsonPath, "utf-8");
    if (!PACKAGE_VERSION_PATTERN.test(content)) {
      throw new Error(`${packageJsonPath} has no "version" field`);
    }
    const updated = content.replace(PACKAGE_VERSION_PATTERN, `"version": "${version}"`);
    fs.writeFileSync(packageJsonPath, updated);
  }

  readTp2Version(tp2Path: string): string {
    const content = fs.readFileSync(tp2Path, "utf-8");
    const match = TP2_VERSION_PATTERN.exec(content);
    if (!match) throw new Error(`${tp2Path} has no "VERSION ~v...~" line`);
    return match[1];
  }

  writeTp2Version(tp2Path: string, version: string): void {
    const content = fs.readFileSync(tp2Path, "utf-8");
    if (!TP2_VERSION_PATTERN.test(content)) {
      throw new Error(`${tp2Path} has no "VERSION ~v...~" line`);
    }
    const updated = content.replace(TP2_VERSION_PATTERN, `VERSION ~v${version}~`);
    fs.writeFileSync(tp2Path, updated);
  }
}

const releaseVersionFilesService = new ReleaseVersionFilesService();
export default releaseVersionFilesService;
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npx vitest run lib/src/services/release/release-version-files.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/release/release-version-files.service.ts lib/src/services/release/release-version-files.service.test.ts
git commit -m "feat: add package.json/tp2 version read-write for the release command"
```

---

### Task 7: `release-git.service.ts` and `release-github.service.ts` — git/gh CLI wrappers

**Files:**
- Create: `lib/src/services/release/release-git.service.ts`
- Create: `lib/src/services/release/release-git.service.test.ts`
- Create: `lib/src/services/release/release-github.service.ts`
- Create: `lib/src/services/release/release-github.service.test.ts`

**Interfaces:**
- Produces (git): `currentBranch(): string`, `isTreeClean(): boolean`, `isUpToDateWithRemote(branch: string): boolean`, `tagExistsAtHead(tag: string): boolean`, `stageReleaseFiles(): void`, `commit(message: string): void`, `tagRelease(tag: string, message: string): void`, `push(branch: string): void`.
- Produces (github): `checkAuth(): void` (throws if `gh` isn't installed/authenticated), `publishRelease(tag: string, zipPath: string, notes: string): void`.
- Task 8 calls all of the above.

- [ ] **Step 1: Write the failing tests for `release-git.service.ts`**

Create `lib/src/services/release/release-git.service.test.ts`:

```typescript
import * as childProcess from "child_process";
import { afterEach, describe, expect, it, vi } from "vitest";
import releaseGitService from "./release-git.service";

describe("ReleaseGitService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the current branch name", () => {
    vi.spyOn(childProcess, "execFileSync").mockReturnValue("master\n");

    expect(releaseGitService.currentBranch()).toBe("master");
  });

  it("reports a clean tree when git status has no output", () => {
    vi.spyOn(childProcess, "execFileSync").mockReturnValue("");

    expect(releaseGitService.isTreeClean()).toBe(true);
  });

  it("reports a dirty tree when git status has output", () => {
    vi.spyOn(childProcess, "execFileSync").mockReturnValue(" M package.json\n");

    expect(releaseGitService.isTreeClean()).toBe(false);
  });

  it("reports up to date when local and origin match", () => {
    vi.spyOn(childProcess, "execFileSync").mockImplementation((_cmd, args) => {
      const argv = args as string[];
      if (argv[0] === "fetch") return "";
      if (argv.includes("origin/master")) return "abc123\n";
      return "abc123\n";
    });

    expect(releaseGitService.isUpToDateWithRemote("master")).toBe(true);
  });

  it("reports not up to date when local and origin diverge", () => {
    vi.spyOn(childProcess, "execFileSync").mockImplementation((_cmd, args) => {
      const argv = args as string[];
      if (argv[0] === "fetch") return "";
      if (argv.includes("origin/master")) return "remote123\n";
      return "local456\n";
    });

    expect(releaseGitService.isUpToDateWithRemote("master")).toBe(false);
  });

  it("returns false when the tag does not exist", () => {
    vi.spyOn(childProcess, "execFileSync").mockImplementation(() => {
      throw new Error("unknown revision");
    });

    expect(releaseGitService.tagExistsAtHead("v0.2.0")).toBe(false);
  });

  it("returns true when the tag exists and points at HEAD", () => {
    vi.spyOn(childProcess, "execFileSync").mockImplementation((_cmd, args) => {
      const argv = args as string[];
      if (argv.includes("HEAD")) return "abc123\n";
      return "abc123\n";
    });

    expect(releaseGitService.tagExistsAtHead("v0.2.0")).toBe(true);
  });

  it("returns false when the tag exists but points elsewhere", () => {
    vi.spyOn(childProcess, "execFileSync").mockImplementation((_cmd, args) => {
      const argv = args as string[];
      if (argv.includes("HEAD")) return "abc123\n";
      return "different456\n";
    });

    expect(releaseGitService.tagExistsAtHead("v0.2.0")).toBe(false);
  });

  it("stages package.json and mod/", () => {
    const exec = vi.spyOn(childProcess, "execFileSync").mockReturnValue("");

    releaseGitService.stageReleaseFiles();

    expect(exec).toHaveBeenCalledWith(
      "git",
      ["add", "package.json", "mod"],
      expect.objectContaining({}),
    );
  });

  it("commits with the given message", () => {
    const exec = vi.spyOn(childProcess, "execFileSync").mockReturnValue("");

    releaseGitService.commit("chore: release v0.2.0");

    expect(exec).toHaveBeenCalledWith(
      "git",
      ["commit", "-m", "chore: release v0.2.0"],
      expect.objectContaining({}),
    );
  });

  it("creates an annotated tag", () => {
    const exec = vi.spyOn(childProcess, "execFileSync").mockReturnValue("");

    releaseGitService.tagRelease("v0.2.0", "Release v0.2.0");

    expect(exec).toHaveBeenCalledWith(
      "git",
      ["tag", "-a", "v0.2.0", "-m", "Release v0.2.0"],
      expect.objectContaining({}),
    );
  });

  it("pushes the branch with tags", () => {
    const exec = vi.spyOn(childProcess, "execFileSync").mockReturnValue("");

    releaseGitService.push("master");

    expect(exec).toHaveBeenCalledWith(
      "git",
      ["push", "origin", "master", "--follow-tags"],
      expect.objectContaining({}),
    );
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run lib/src/services/release/release-git.service.test.ts`
Expected: FAIL with "Cannot find module './release-git.service'"

- [ ] **Step 3: Implement `release-git.service.ts`**

Create `lib/src/services/release/release-git.service.ts`:

```typescript
import { execFileSync } from "child_process";
import * as path from "path";

class ReleaseGitService {
  repoRoot = path.resolve(__dirname, "..", "..", "..", "..");

  currentBranch(): string {
    return this.git(["rev-parse", "--abbrev-ref", "HEAD"]).trim();
  }

  isTreeClean(): boolean {
    return this.git(["status", "--porcelain"]).trim() === "";
  }

  isUpToDateWithRemote(branch: string): boolean {
    this.git(["fetch", "origin", branch]);
    const local = this.git(["rev-parse", branch]).trim();
    const remote = this.git(["rev-parse", `origin/${branch}`]).trim();
    return local === remote;
  }

  tagExistsAtHead(tag: string): boolean {
    const tagCommit = this.tryGit(["rev-parse", "--verify", `refs/tags/${tag}`]);
    if (tagCommit === null) return false;
    const head = this.git(["rev-parse", "HEAD"]).trim();
    return tagCommit.trim() === head;
  }

  stageReleaseFiles(): void {
    this.git(["add", "package.json", "mod"]);
  }

  commit(message: string): void {
    this.git(["commit", "-m", message]);
  }

  tagRelease(tag: string, message: string): void {
    this.git(["tag", "-a", tag, "-m", message]);
  }

  push(branch: string): void {
    this.git(["push", "origin", branch, "--follow-tags"]);
  }

  private git(args: string[]): string {
    return execFileSync("git", args, { cwd: this.repoRoot, encoding: "utf-8" });
  }

  private tryGit(args: string[]): string | null {
    try {
      return this.git(args);
    } catch {
      return null;
    }
  }
}

const releaseGitService = new ReleaseGitService();
export default releaseGitService;
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npx vitest run lib/src/services/release/release-git.service.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing tests for `release-github.service.ts`**

Create `lib/src/services/release/release-github.service.test.ts`:

```typescript
import * as childProcess from "child_process";
import * as fs from "fs";
import { afterEach, describe, expect, it, vi } from "vitest";
import releaseGithubService from "./release-github.service";

describe("ReleaseGithubService", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("checkAuth", () => {
    it("does not throw when gh reports it is authenticated", () => {
      vi.spyOn(childProcess, "execFileSync").mockReturnValue("");

      expect(() => releaseGithubService.checkAuth()).not.toThrow();
    });

    it("throws a clear error when gh is missing or unauthenticated", () => {
      vi.spyOn(childProcess, "execFileSync").mockImplementation(() => {
        throw new Error("command not found: gh");
      });

      expect(() => releaseGithubService.checkAuth()).toThrow(/gh auth login/);
    });
  });

  describe("publishRelease", () => {
    it("writes the notes to a temp file and calls gh release create", () => {
      const exec = vi.spyOn(childProcess, "execFileSync").mockReturnValue("");
      const writeSpy = vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
      vi.spyOn(fs, "rmSync").mockImplementation(() => {});

      releaseGithubService.publishRelease("v0.2.0", "dist/enhanced_creatures-v0.2.0.zip", "notes body");

      expect(writeSpy).toHaveBeenCalledWith(expect.stringContaining("v0.2.0"), "notes body");
      expect(exec).toHaveBeenCalledWith(
        "gh",
        [
          "release",
          "create",
          "v0.2.0",
          "dist/enhanced_creatures-v0.2.0.zip",
          "--title",
          "v0.2.0",
          "--notes-file",
          expect.stringContaining("v0.2.0") as unknown as string,
        ],
        expect.objectContaining({}),
      );
    });

    it("removes the temp notes file even if gh release create fails", () => {
      vi.spyOn(childProcess, "execFileSync").mockImplementation(() => {
        throw new Error("gh failed");
      });
      vi.spyOn(fs, "writeFileSync").mockImplementation(() => {});
      const rmSpy = vi.spyOn(fs, "rmSync").mockImplementation(() => {});

      expect(() =>
        releaseGithubService.publishRelease("v0.2.0", "dist/x.zip", "notes"),
      ).toThrow("gh failed");
      expect(rmSpy).toHaveBeenCalled();
    });
  });
});
```

- [ ] **Step 6: Run the tests to confirm they fail**

Run: `npx vitest run lib/src/services/release/release-github.service.test.ts`
Expected: FAIL with "Cannot find module './release-github.service'"

- [ ] **Step 7: Implement `release-github.service.ts`**

Create `lib/src/services/release/release-github.service.ts`:

```typescript
import { execFileSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

class ReleaseGithubService {
  checkAuth(): void {
    try {
      execFileSync("gh", ["auth", "status"], { stdio: "pipe" });
    } catch (e: unknown) {
      throw new Error(
        "GitHub CLI is not installed or not authenticated - install gh and run `gh auth login` first",
        { cause: e },
      );
    }
  }

  publishRelease(tag: string, zipPath: string, notes: string): void {
    const notesFile = path.join(os.tmpdir(), `${tag}-notes.md`);
    fs.writeFileSync(notesFile, notes);
    try {
      execFileSync(
        "gh",
        ["release", "create", tag, zipPath, "--title", tag, "--notes-file", notesFile],
        { stdio: "pipe" },
      );
    } finally {
      fs.rmSync(notesFile, { force: true });
    }
  }
}

const releaseGithubService = new ReleaseGithubService();
export default releaseGithubService;
```

- [ ] **Step 8: Run the tests to confirm they pass**

Run: `npx vitest run lib/src/services/release/release-github.service.test.ts`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add lib/src/services/release/release-git.service.ts lib/src/services/release/release-git.service.test.ts lib/src/services/release/release-github.service.ts lib/src/services/release/release-github.service.test.ts
git commit -m "feat: add git/gh CLI wrappers for the release command"
```

---

### Task 8: `release-package.service.ts` — zip `mod/` for the release asset

**Files:**
- Create: `lib/src/services/release/release-package.service.ts`
- Create: `lib/src/services/release/release-package.service.test.ts`

**Interfaces:**
- Produces: `createZip(version: string): string` — zips everything under `mod/` into `dist/enhanced_creatures-v<version>.zip`, rooted under a top-level `enhanced_creatures/` folder, and returns the absolute path it wrote. Task 9 calls this and passes the returned path to `releaseGithubService.publishRelease`.

- [ ] **Step 1: Write the failing tests**

Create `lib/src/services/release/release-package.service.test.ts`:

```typescript
import AdmZip from "adm-zip";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import releasePackageService from "./release-package.service";

describe("ReleasePackageService", () => {
  let repoDir: string;

  beforeEach(() => {
    repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-package-"));
    const modDir = path.join(repoDir, "mod");
    fs.mkdirSync(path.join(modDir, "lib"), { recursive: true });
    fs.writeFileSync(path.join(modDir, "enhanced_creatures.tp2"), "tp2 contents");
    fs.writeFileSync(path.join(modDir, "lib", "index.tpa"), "lib contents");

    releasePackageService.repoRoot = repoDir;
    releasePackageService.modDir = modDir;
    releasePackageService.distDir = path.join(repoDir, "dist");
  });

  afterEach(() => {
    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  it("creates dist/enhanced_creatures-v<version>.zip rooted under enhanced_creatures/", () => {
    const zipPath = releasePackageService.createZip("0.2.0");

    expect(zipPath).toBe(path.join(repoDir, "dist", "enhanced_creatures-v0.2.0.zip"));
    expect(fs.existsSync(zipPath)).toBe(true);

    const entries = new AdmZip(zipPath).getEntries().map((e) => e.entryName.replace(/\\/g, "/"));
    expect(entries).toContain("enhanced_creatures/enhanced_creatures.tp2");
    expect(entries).toContain("enhanced_creatures/lib/index.tpa");
  });

  it("preserves file contents", () => {
    const zipPath = releasePackageService.createZip("0.2.0");

    const zip = new AdmZip(zipPath);
    const tp2Entry = zip.getEntry("enhanced_creatures/enhanced_creatures.tp2");
    expect(tp2Entry).not.toBeNull();
    expect(zip.readAsText(tp2Entry!)).toBe("tp2 contents");
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run lib/src/services/release/release-package.service.test.ts`
Expected: FAIL with "Cannot find module './release-package.service'"

- [ ] **Step 3: Implement `release-package.service.ts`**

Create `lib/src/services/release/release-package.service.ts`:

```typescript
import AdmZip from "adm-zip";
import * as fs from "fs";
import * as path from "path";

class ReleasePackageService {
  repoRoot = path.resolve(__dirname, "..", "..", "..", "..");
  modDir = path.join(this.repoRoot, "mod");
  distDir = path.join(this.repoRoot, "dist");

  createZip(version: string): string {
    const zipPath = path.join(this.distDir, `enhanced_creatures-v${version}.zip`);
    fs.mkdirSync(this.distDir, { recursive: true });
    const zip = new AdmZip();
    zip.addLocalFolder(this.modDir, "enhanced_creatures");
    zip.writeZip(zipPath);
    return zipPath;
  }
}

const releasePackageService = new ReleasePackageService();
export default releasePackageService;
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npx vitest run lib/src/services/release/release-package.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/release/release-package.service.ts lib/src/services/release/release-package.service.test.ts
git commit -m "feat: add mod/ zip packaging for the release command"
```

---

### Task 9: `release.service.ts` — orchestrate the full release flow

**Files:**
- Create: `lib/src/services/release/release.service.ts`
- Create: `lib/src/services/release/release.service.test.ts`

**Interfaces:**
- Consumes: `mainService.generateAll()` (Task 4), `changelogService.generate()` (`lib/src/services/doc/changelog.service.ts`, unchanged), `parseVersion`/`isGreater` (Task 3), `releaseVersionFilesService` (Task 6), `releaseChangelogService` (Task 5), `releaseGitService`/`releaseGithubService` (Task 7), `releasePackageService` (Task 8).
- Produces: `release(version: string): Promise<void>`. Task 10 wires this into the CLI.

- [ ] **Step 1: Write the failing tests**

Create `lib/src/services/release/release.service.test.ts`:

```typescript
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import changelogService from "../doc/changelog.service";
import logService from "../log.service";
import mainService from "../main.service";
import releaseChangelogService from "./release-changelog.service";
import releaseGitService from "./release-git.service";
import releaseGithubService from "./release-github.service";
import releasePackageService from "./release-package.service";
import releaseService from "./release.service";
import releaseVersionFilesService from "./release-version-files.service";

describe("ReleaseService", () => {
  beforeEach(() => {
    vi.spyOn(logService, "init").mockImplementation(() => {});
    vi.spyOn(logService, "log").mockImplementation(() => {});
    vi.spyOn(releaseGitService, "currentBranch").mockReturnValue("master");
    vi.spyOn(releaseGitService, "isTreeClean").mockReturnValue(true);
    vi.spyOn(releaseGitService, "isUpToDateWithRemote").mockReturnValue(true);
    vi.spyOn(releaseGitService, "tagExistsAtHead").mockReturnValue(false);
    vi.spyOn(releaseGitService, "stageReleaseFiles").mockImplementation(() => {});
    vi.spyOn(releaseGitService, "commit").mockImplementation(() => {});
    vi.spyOn(releaseGitService, "tagRelease").mockImplementation(() => {});
    vi.spyOn(releaseGitService, "push").mockImplementation(() => {});
    vi.spyOn(releaseGithubService, "checkAuth").mockImplementation(() => {});
    vi.spyOn(releaseGithubService, "publishRelease").mockImplementation(() => {});
    vi.spyOn(releaseVersionFilesService, "readPackageVersion").mockReturnValue("0.1.0");
    vi.spyOn(releaseVersionFilesService, "readTp2Version").mockReturnValue("0.1.0");
    vi.spyOn(releaseVersionFilesService, "writePackageVersion").mockImplementation(() => {});
    vi.spyOn(releaseVersionFilesService, "writeTp2Version").mockImplementation(() => {});
    vi.spyOn(releaseChangelogService, "rollover").mockImplementation(() => {});
    vi.spyOn(releaseChangelogService, "extractNotes").mockReturnValue("release notes");
    vi.spyOn(changelogService, "generate").mockImplementation(() => {});
    vi.spyOn(mainService, "generateAll").mockResolvedValue(undefined);
    vi.spyOn(releasePackageService, "createZip").mockReturnValue("dist/enhanced_creatures-v0.2.0.zip");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("runs the full flow for a fresh release", async () => {
    await releaseService.release("0.2.0");

    expect(releaseGitService.currentBranch).toHaveBeenCalled();
    expect(releaseGitService.isTreeClean).toHaveBeenCalled();
    expect(releaseGitService.isUpToDateWithRemote).toHaveBeenCalledWith("master");
    expect(releaseGithubService.checkAuth).toHaveBeenCalled();
    expect(mainService.generateAll).toHaveBeenCalled();
    expect(releaseVersionFilesService.writePackageVersion).toHaveBeenCalledWith(
      expect.any(String),
      "0.2.0",
    );
    expect(releaseVersionFilesService.writeTp2Version).toHaveBeenCalledWith(
      expect.any(String),
      "0.2.0",
    );
    expect(releaseChangelogService.rollover).toHaveBeenCalledWith(
      expect.any(String),
      "0.2.0",
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    );
    expect(changelogService.generate).toHaveBeenCalled();
    expect(releaseGitService.stageReleaseFiles).toHaveBeenCalled();
    expect(releaseGitService.commit).toHaveBeenCalledWith(expect.stringContaining("v0.2.0"));
    expect(releaseGitService.tagRelease).toHaveBeenCalledWith("v0.2.0", expect.any(String));
    expect(releaseGitService.push).toHaveBeenCalledWith("master");
    expect(releasePackageService.createZip).toHaveBeenCalledWith("0.2.0");
    expect(releaseGithubService.publishRelease).toHaveBeenCalledWith(
      "v0.2.0",
      "dist/enhanced_creatures-v0.2.0.zip",
      "release notes",
    );
  });

  it("rejects an invalid version format before any side effects", async () => {
    await expect(releaseService.release("1.2")).rejects.toThrow(/not a valid version/);
    expect(releaseGitService.currentBranch).not.toHaveBeenCalled();
  });

  it("rejects a version that is not greater than the current one", async () => {
    await expect(releaseService.release("0.1.0")).rejects.toThrow(/greater than/);
    expect(mainService.generateAll).not.toHaveBeenCalled();
  });

  it("rejects when the current branch is not master", async () => {
    vi.spyOn(releaseGitService, "currentBranch").mockReturnValue("dev");

    await expect(releaseService.release("0.2.0")).rejects.toThrow(/must be cut from "master"/);
  });

  it("rejects when the working tree is not clean", async () => {
    vi.spyOn(releaseGitService, "isTreeClean").mockReturnValue(false);

    await expect(releaseService.release("0.2.0")).rejects.toThrow(/not clean/);
  });

  it("rejects when local master is behind origin", async () => {
    vi.spyOn(releaseGitService, "isUpToDateWithRemote").mockReturnValue(false);

    await expect(releaseService.release("0.2.0")).rejects.toThrow(/not up to date/);
  });

  it("rejects when package.json and tp2 versions disagree", async () => {
    vi.spyOn(releaseVersionFilesService, "readTp2Version").mockReturnValue("0.0.9");

    await expect(releaseService.release("0.2.0")).rejects.toThrow(/do not match/);
  });

  it("resumes from packaging when the tag already exists at HEAD, skipping generate/commit/push", async () => {
    vi.spyOn(releaseGitService, "tagExistsAtHead").mockReturnValue(true);

    await releaseService.release("0.2.0");

    expect(mainService.generateAll).not.toHaveBeenCalled();
    expect(releaseGitService.commit).not.toHaveBeenCalled();
    expect(releaseGitService.push).not.toHaveBeenCalled();
    expect(releasePackageService.createZip).toHaveBeenCalledWith("0.2.0");
    expect(releaseGithubService.publishRelease).toHaveBeenCalledWith(
      "v0.2.0",
      "dist/enhanced_creatures-v0.2.0.zip",
      "release notes",
    );
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npx vitest run lib/src/services/release/release.service.test.ts`
Expected: FAIL with "Cannot find module './release.service'"

- [ ] **Step 3: Implement `release.service.ts`**

Create `lib/src/services/release/release.service.ts`:

```typescript
import * as path from "path";
import changelogService from "../doc/changelog.service";
import logService from "../log.service";
import mainService from "../main.service";
import { isGreater, parseVersion } from "../utils/version.utils";
import releaseChangelogService from "./release-changelog.service";
import releaseGitService from "./release-git.service";
import releaseGithubService from "./release-github.service";
import releasePackageService from "./release-package.service";
import releaseVersionFilesService from "./release-version-files.service";

const BRANCH = "master";

class ReleaseService {
  repoRoot = path.resolve(__dirname, "..", "..", "..", "..");
  packageJsonPath = path.join(this.repoRoot, "package.json");
  tp2Path = path.join(this.repoRoot, "mod", "enhanced_creatures.tp2");
  changelogPath = path.join(this.repoRoot, "mod", "CHANGELOG.md");

  async release(version: string): Promise<void> {
    const target = parseVersion(version);
    logService.init();

    this.checkBranch();
    this.checkCleanTree();
    this.checkUpToDate();
    releaseGithubService.checkAuth();

    const tag = `v${version}`;
    const resuming = releaseGitService.tagExistsAtHead(tag);

    if (!resuming) {
      this.checkVersionsMatch();
      const currentVersion = releaseVersionFilesService.readPackageVersion(this.packageJsonPath);
      if (!isGreater(target, parseVersion(currentVersion))) {
        throw new Error(`${version} must be greater than the current version ${currentVersion}`);
      }

      await mainService.generateAll();

      releaseVersionFilesService.writePackageVersion(this.packageJsonPath, version);
      releaseVersionFilesService.writeTp2Version(this.tp2Path, version);
      const today = new Date().toISOString().slice(0, 10);
      releaseChangelogService.rollover(this.changelogPath, version, today);
      changelogService.generate();

      logService.log(`Committing release ${tag}`);
      releaseGitService.stageReleaseFiles();
      releaseGitService.commit(`chore: release ${tag}`);
      releaseGitService.tagRelease(tag, `Release ${tag}`);
      releaseGitService.push(BRANCH);
    } else {
      logService.log(`Tag ${tag} already exists at HEAD, resuming from packaging`);
    }

    const notes = releaseChangelogService.extractNotes(this.changelogPath, version);
    const zipPath = releasePackageService.createZip(version);
    logService.log(`Publishing GitHub release ${tag}`);
    releaseGithubService.publishRelease(tag, zipPath, notes);
  }

  private checkBranch(): void {
    const branch = releaseGitService.currentBranch();
    if (branch !== BRANCH) {
      throw new Error(`Releases must be cut from "${BRANCH}", but current branch is "${branch}"`);
    }
  }

  private checkCleanTree(): void {
    if (!releaseGitService.isTreeClean()) {
      throw new Error("Working tree is not clean, commit or stash changes before releasing");
    }
  }

  private checkUpToDate(): void {
    if (!releaseGitService.isUpToDateWithRemote(BRANCH)) {
      throw new Error(`Local "${BRANCH}" is not up to date with "origin/${BRANCH}", pull first`);
    }
  }

  private checkVersionsMatch(): void {
    const pkgVersion = releaseVersionFilesService.readPackageVersion(this.packageJsonPath);
    const tp2Version = releaseVersionFilesService.readTp2Version(this.tp2Path);
    if (pkgVersion !== tp2Version) {
      throw new Error(
        `package.json version (${pkgVersion}) and tp2 VERSION (${tp2Version}) do not match`,
      );
    }
  }
}

const releaseService = new ReleaseService();
export default releaseService;
```

- [ ] **Step 4: Run the tests to confirm they pass**

Run: `npx vitest run lib/src/services/release/release.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/release/release.service.ts lib/src/services/release/release.service.test.ts
git commit -m "feat: add release.service.ts orchestrating the full release flow"
```

---

### Task 10: Wire the `release` command into the CLI

**Files:**
- Modify: `lib/src/index.ts`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: `releaseService.release(version: string): Promise<void>` (Task 9).
- Produces: `npm run release -- <version>` on the command line.

- [ ] **Step 1: Add the `release` command to `lib/src/index.ts`**

Add the import (alongside the other service imports at the top):

```typescript
import releaseService from "./services/release/release.service";
```

Add the command registration, after the existing `copy` command block (after line 33's closing `});`):

```typescript
program
  .command("release")
  .description("Validate, bump, regenerate, and publish a GitHub release")
  .argument("<version>", "release version, e.g. 1.2.0")
  .action(async (version: string) => {
    try {
      await runRelease(version);
    } catch (e: unknown) {
      handleError(e);
    }
  });
```

Add the `runRelease` function, after `runCopy`:

```typescript
async function runRelease(version: string): Promise<void> {
  logService.filePath = path.join(process.cwd(), "release.log");
  await releaseService.release(version);
  logService.log("Finished!");
  console.log(chalk.green(`\nFinished!`));
}
```

- [ ] **Step 2: Add `release.log` to `.gitignore`**

Add a line to `.gitignore` next to the existing `generator.log`/`copy.log` entries:

```
release.log
```

- [ ] **Step 3: Verify the command is registered**

Run: `npx ts-node lib/src/index.ts release --help`
Expected: prints usage for the `release` command, showing the `<version>` argument and description.

- [ ] **Step 4: Verify the full test suite and linting still pass**

Run: `npm run lint && npx vitest run`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/src/index.ts .gitignore
git commit -m "feat: wire the release command into the CLI"
```

---

### Task 11: Manual dry run against the real repo (no push/publish)

This task has no automated tests — it's a manual sanity check that the whole flow behaves correctly against the real repository state before the release command is trusted for a real release. It requires `gh` to be installed and authenticated (per the Global Constraints) and `master` to be checked out and clean.

**Files:** none (verification only).

- [ ] **Step 1: Confirm preflight checks correctly block on the current branch**

From the `dev` branch, run: `npm run release -- 0.2.0`
Expected: fails fast with `Releases must be cut from "master", but current branch is "dev"` — no files touched, no `git status` diff.

- [ ] **Step 2: Confirm the invalid-version check**

Run: `npm run release -- 1.2` (any branch)
Expected: fails with `"1.2" is not a valid version (expected X.Y.Z)`.

- [ ] **Step 3: Confirm the not-greater-than-current check**

On `master`, with `package.json` at `0.1.0`, run: `npm run release -- 0.1.0`
Expected: fails with `0.1.0 must be greater than the current version 0.1.0`.

- [ ] **Step 4: Report back**

Summarize the three manual checks' outcomes before running an actual `npm run release -- <next-version>` for a real release — that first real run should be supervised, since it pushes to `master` and publishes a public GitHub release.
