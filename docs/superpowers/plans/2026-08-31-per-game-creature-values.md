# Per-Game Creature Values Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the WeiDU generator emit game-specific creature patches — gated by `GAME_IS` at install time — from a single generated mod, driven by a new `game` column in `assets/creatures.csv` and an optional `game` filter on adjustment entries.

**Architecture:** Creature files become typed values (`{ name, game? }`) instead of bare strings, so each file carries which game(s) it applies to (derived from `creatures.csv`, collapsed per name). Adjustment entries gain an optional `game`. The generator partitions its per-file `ACTION_FOR_EACH` loop into both/bg1/bg2 groups wrapped in `ACTION_IF GAME_IS`, and wraps `game`-tagged adjustment blocks in `PATCH_IF GAME_IS`. Validation becomes game-aware so a resref may belong to different creatures in different games.

**Tech Stack:** TypeScript, Node, `ts-node` (generator entrypoint `lib/src/index.ts`), Vitest (`vitest run`), ESLint. Output is WeiDU `.tpa` under `mod/`.

**Spec:** `docs/superpowers/specs/2026-08-31-per-game-creature-values-design.md`

## Global Constraints

- `Game` is exactly `"bg1" | "bg2"`. No IWD/PST. `game` absent/`undefined` ⇒ both games.
- `GAME_IS` mapping is fixed: `bg1` → `GAME_IS ~bgee eet~` (EET folds into bg1 so it does not regress), `bg2` → `GAME_IS ~bg2ee~`.
- `creatures.csv` `game` column values are `""`, `bg1`, `bg2` only. The column already exists; header is `…;ValidatedMonsterId;game;name` (game is second-to-last, name is last).
- WeiDU `STRING_EQUAL_CASE` comparisons against file names are case-sensitive: every file name reaching the model/generator is uppercased.
- `adjustment.files` stays `string[]` — adjustment game scoping rides on the entry's `game`, never per-file.
- `notEnforceFiles` stays `string[]` (this plan narrows the spec here; a game-specific not-enforce file is YAGNI — revisit only if one appears).
- Run a single test file with `npx vitest run <path>`; full suite with `npm test`.
- Commit after every task. Conventional Commits (`feat:`, `refactor:`, `test:`, `fix:`).

---

## File Structure

| File | Responsibility |
| --- | --- |
| `lib/src/model/creature/game.ts` | **new** — `Game` type, `CreatureFile` interface, `gamesOverlap` helper, `GAME_IS_CONDITION` map |
| `lib/src/model/creature/creature.ts` | `Creature.files: CreatureFile[]`; `fileNames` getter; `BaseCreature` drops `files` |
| `lib/src/model/creature/adjustment.ts` | `game?: Game` on `CreatureAdjustment`; declare `files: string[]` directly |
| `lib/src/services/monster-files.service.ts` | parse `game` column; `getFiles`/`getSummonFiles`/`getUnvalidatedFiles` return `CreatureFile[]` |
| `lib/src/model/creature/family.ts` | `create`/`createFrom` accept `(string \| CreatureFile)[]`; `resolveFiles` collapse rule; `applyCsvSummonFiles` game tagging |
| `lib/src/factories/creature.factory.ts` | pass `game` through `setAdjustments`; game-aware file-uniqueness in `validate` |
| `lib/src/services/creature.service.ts` | `checkAdjustmentFiles` → `fileNames`, game-availability check, unsupported-combination guard |
| `lib/src/services/weidu/weidu-creature.service.ts` | `GAME_IS` in `handleAdjustment` and partitioned `patchCreatures` file loops |
| `lib/src/services/doc/adjustment.service.ts` + `documentation.service.ts` | (Task 11, deferrable) `game` on `EffectiveAdjustment` + a `bg1`/`bg2` chip in the docs panel |
| `scripts/report-game-adjustments.ts` | extend cross-check to flag mis-tagged / uncovered rows |
| `lib/creatures/ogres.ts` | split the `GORF` adjustment into `game`-tagged bg1/bg2 entries (demonstration) |

---

## Task 1: `Game` / `CreatureFile` types and typed `Creature.files`

**Files:**
- Create: `lib/src/model/creature/game.ts`
- Modify: `lib/src/model/creature/creature.ts` (interface `BaseCreature` ~34-37; class field `files` ~50; add getter)
- Test: `lib/src/model/creature/game.test.ts`

**Interfaces:**
- Produces:
  - `type Game = "bg1" | "bg2"`
  - `interface CreatureFile { name: string; game?: Game }`
  - `function gamesOverlap(a: Game | undefined, b: Game | undefined): boolean`
  - `const GAME_IS_CONDITION: Record<Game, string>` — `{ bg1: "GAME_IS ~bgee eet~", bg2: "GAME_IS ~bg2ee~" }`
  - `Creature.files: CreatureFile[]`
  - `Creature.fileNames: string[]` (getter)
  - `BaseCreature` no longer declares `files`

- [ ] **Step 1: Write the failing test**

```ts
// lib/src/model/creature/game.test.ts
import { describe, expect, it } from "vitest";
import { gamesOverlap, GAME_IS_CONDITION } from "./game";

describe("gamesOverlap", () => {
  it("undefined overlaps everything", () => {
    expect(gamesOverlap(undefined, "bg1")).toBe(true);
    expect(gamesOverlap("bg2", undefined)).toBe(true);
    expect(gamesOverlap(undefined, undefined)).toBe(true);
  });
  it("same game overlaps", () => {
    expect(gamesOverlap("bg1", "bg1")).toBe(true);
  });
  it("different games do not overlap", () => {
    expect(gamesOverlap("bg1", "bg2")).toBe(false);
  });
});

describe("GAME_IS_CONDITION", () => {
  it("maps bg1 to bgee+eet and bg2 to bg2ee", () => {
    expect(GAME_IS_CONDITION.bg1).toBe("GAME_IS ~bgee eet~");
    expect(GAME_IS_CONDITION.bg2).toBe("GAME_IS ~bg2ee~");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/src/model/creature/game.test.ts`
Expected: FAIL — cannot resolve `./game`.

- [ ] **Step 3: Create `game.ts`**

```ts
// lib/src/model/creature/game.ts

/** Which game a creature file / adjustment applies to. Absent ⇒ both games. */
export type Game = "bg1" | "bg2";

export interface CreatureFile {
  name: string;
  /** Absent ⇒ the file applies to both games. */
  game?: Game;
}

/** Two game scopes conflict when they can both be active in one install. */
export function gamesOverlap(a: Game | undefined, b: Game | undefined): boolean {
  return a === undefined || b === undefined || a === b;
}

/** Install-time WeiDU predicate for each game. EET folds into bg1. */
export const GAME_IS_CONDITION: Record<Game, string> = {
  bg1: "GAME_IS ~bgee eet~",
  bg2: "GAME_IS ~bg2ee~",
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/src/model/creature/game.test.ts`
Expected: PASS

- [ ] **Step 5: Retype `Creature.files` and add `fileNames`**

In `lib/src/model/creature/creature.ts`:

- Add to imports: `import { CreatureFile } from "./game";`
- In `interface BaseCreature`, delete the `files: string[];` line (keep `data: CreatureData;`).
- Change the class field `files: string[] = [];` to `files: CreatureFile[] = [];`
- Add the getter directly below the `files` field:

```ts
  /** Just the file names, for the many call sites that don't care about game scoping. */
  get fileNames(): string[] {
    return this.files.map((f) => f.name);
  }
```

- [ ] **Step 6: Fix the one non-test `BaseCreature.files` reader**

In `lib/src/services/creature.service.ts` `checkData` (~line 50):

```ts
    logService.log(`base files: ${JSON.stringify("files" in p.base ? p.base.files : p.creature.fileNames)}`);
```

(Adjustments — the other `p.base` — carry `files: string[]`, so `"files" in p.base` is true there and this logs the adjustment's own file list unchanged.)

- [ ] **Step 7: Compile to find remaining fallout**

Run: `npx tsc -p . --noEmit`
Expected: errors only in files handled by later tasks — `monster-files.service.ts`, `family.ts`, `creature.factory.ts`, `weidu-creature.service.ts`, `adjustment.service.ts`, and various `*.test.ts`. Note them; do **not** fix here. If an error appears in a file *not* in that list, stop and reassess.

- [ ] **Step 8: Commit**

```bash
git add lib/src/model/creature/game.ts lib/src/model/creature/game.test.ts lib/src/model/creature/creature.ts lib/src/services/creature.service.ts
git commit -m "feat: add Game type and typed CreatureFile entries"
```

---

## Task 2: `monster-files.service.ts` returns `CreatureFile[]`

**Files:**
- Modify: `lib/src/services/monster-files.service.ts`
- Test: `lib/src/services/monster-files.service.test.ts`

**Interfaces:**
- Consumes: `CreatureFile` from Task 1.
- Produces:
  - `parseMonsterFilesCsv(raw): Map<string, CreatureFile[]>`
  - `parseUnvalidatedMonsterFilesCsv(raw): Map<string, CreatureFile[]>`
  - `parseMonsterSummonFilesCsv(raw): Map<string, CreatureFile[]>`
  - `monsterFilesService.getFiles(monster): CreatureFile[]`
  - `monsterFilesService.getSummonFiles(monster): CreatureFile[]`
  - `monsterFilesService.getUnvalidatedFiles(monster): CreatureFile[]`
  - `getDialogRows`, `getName` unchanged.

- [ ] **Step 1: Write the failing tests**

Replace the `parseMonsterFilesCsv` describe block's first test and add a game test. Note the test `HEADER` constant must gain `;game` before `;name` — update it and every CSV row string in the file to add the extra `;` (game empty) before the trailing name field. New/changed assertions:

```ts
const HEADER =
  "file;general;race;class;anim;deathvar;dialog;origin;MonsterId;ValidatedMonsterId;game;name";

it("groups validated files under their MonsterId as CreatureFile entries, in row order", () => {
  const csv = [
    HEADER,
    "ANKHEG;MONSTER;ANKHEG;ANKHEG;ANKHEG;ankheg;;VIENXAY;Ankheg;true;;Ankheg",
    "BDNEO;MONSTER;ANKHEG;ANKHEG;ANKHEG;bdneo;;BD;Ankheg;true;;Ankheg",
  ].join("\n");

  expect(parseMonsterFilesCsv(csv).get("Ankheg")).toEqual([
    { name: "ANKHEG", game: undefined },
    { name: "BDNEO", game: undefined },
  ]);
});

it("carries the game column onto each entry", () => {
  const csv = [
    HEADER,
    "GORF;X;X;X;X;gorf;;bg1;Ogre;true;bg1;Gorf",
    "GORF;X;X;X;X;gorf;;bg2;Ogre;true;bg2;Gorf the Squisher",
  ].join("\n");

  expect(parseMonsterFilesCsv(csv).get("Ogre")).toEqual([
    { name: "GORF", game: "bg1" },
    { name: "GORF", game: "bg2" },
  ]);
});
```

For `monsterFilesService.getFiles`:

```ts
it("returns validated creatures.csv files as CreatureFile entries", () => {
  const files = monsterFilesService.getFiles(MonsterEnum.Ankheg);
  expect(files).toEqual(
    expect.arrayContaining([{ name: "ANKHEG", game: undefined }, { name: "BDNEO", game: undefined }]),
  );
});
```

Update the `parseUnvalidatedMonsterFilesCsv` and `getUnvalidatedFiles` assertions the same way (`{ name: "GUESS1", game: undefined }`, etc.), and add a `parseMonsterSummonFilesCsv` describe block if none exists asserting `{ name, game }` shape.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/services/monster-files.service.test.ts`
Expected: FAIL — receives arrays of strings, expected arrays of objects.

- [ ] **Step 3: Implement**

Add the import: `import { CreatureFile, Game } from "../model/creature/game";`

Add a shared helper near the top:

```ts
const GAME_COLUMN = "game";

function gameValue(raw: string | undefined): Game | undefined {
  const v = (raw ?? "").trim().toLowerCase();
  return v === "bg1" || v === "bg2" ? v : undefined;
}
```

In `parseMonsterFilesCsv`, `parseUnvalidatedMonsterFilesCsv`, `parseMonsterSummonFilesCsv`:
- compute `const gameIdx = header.indexOf(GAME_COLUMN);`
- change the map value type to `CreatureFile[]`
- where the code currently pushes `file` (a string), push `{ name: file, game: gameValue(fields[gameIdx]) }`

In the `MonsterFilesService` class, change the three field types and the three getter return types from `string[]` to `CreatureFile[]`; the `.get(...) ?? []` bodies are otherwise unchanged.

Leave `parseMonsterDialogCsv`, `parseFileNamesCsv`, `getDialogRows`, `getName` as-is (they ignore the new column; index-based parsing tolerates it).

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/src/services/monster-files.service.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/monster-files.service.ts lib/src/services/monster-files.service.test.ts
git commit -m "feat: monster-files service returns CreatureFile entries with game"
```

---

## Task 3: `family.ts` file resolution + collapse rule

**Files:**
- Modify: `lib/src/model/creature/family.ts` (`create` param `~36-44`, `createFrom` param `~63-70`, `resolveFiles` `~103-107`, `applyCsvSummonFiles` `~117-134`)
- Test: `lib/src/model/creature/family.test.ts`

**Interfaces:**
- Consumes: `CreatureFile`, `Game` (Task 1); `monsterFilesService.getFiles`/`getSummonFiles` returning `CreatureFile[]` (Task 2).
- Produces:
  - `create({ files?: (string | CreatureFile)[] })`, `createFrom({ files?: (string | CreatureFile)[] })`
  - `CreatureFamily.resolveFiles(monster, backupFiles?: (string | CreatureFile)[]): CreatureFile[]` (private)
  - collapse rule: one entry per uppercased name; `game: undefined` if any source entry for that name is `undefined` **or** the entries cover both `bg1` and `bg2`; else the single game present.

- [ ] **Step 1: Write the failing tests**

Add to `family.test.ts`. The existing "create (files resolution)" tests assert `cre.files` contains bare strings — rewrite those to read `cre.fileNames`, then add:

```ts
describe("create (game collapse)", () => {
  it("collapses a resref present in both games to an unconditional entry", () => {
    const family = fakeFamily();
    // Ankheg fixture has only game='' rows; simulate both-game by stubbing getFiles.
    vi.spyOn(monsterFilesService, "getFiles").mockReturnValue([
      { name: "GORF", game: "bg1" },
      { name: "GORF", game: "bg2" },
    ]);
    const cre = family.create({
      name: CREATURE_NAME_KEY, monster: MonsterEnum.Ankheg,
      data: {} as unknown as InputMainCreatureData,
    });
    expect(cre.files).toEqual([{ name: "GORF", game: undefined }]);
  });

  it("keeps a single-game resref scoped to that game", () => {
    const family = fakeFamily();
    vi.spyOn(monsterFilesService, "getFiles").mockReturnValue([{ name: "BG1ONLY", game: "bg1" }]);
    const cre = family.create({
      name: CREATURE_NAME_KEY, monster: MonsterEnum.Ankheg,
      data: {} as unknown as InputMainCreatureData,
    });
    expect(cre.files).toEqual([{ name: "BG1ONLY", game: "bg1" }]);
  });

  it("accepts and uppercases object backup entries with a game", () => {
    const family = fakeFamily();
    vi.spyOn(monsterFilesService, "getFiles").mockReturnValue([]);
    const cre = family.create({
      name: CREATURE_NAME_KEY, monster: MonsterEnum.Ankheg,
      files: [{ name: "bar", game: "bg2" }, "foo"],
      data: {} as unknown as InputMainCreatureData,
    });
    expect(cre.files).toEqual(
      expect.arrayContaining([{ name: "BAR", game: "bg2" }, { name: "FOO", game: undefined }]),
    );
  });
});
```

Add `import monsterFilesService from "../../services/monster-files.service";` to the test file if absent.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/model/creature/family.test.ts`
Expected: FAIL — `resolveFiles` still returns strings / doesn't collapse.

- [ ] **Step 3: Implement `resolveFiles` + collapse**

Add imports: `import { CreatureFile, Game } from "./game";`

```ts
  private resolveFiles(
    monster: MonsterEnum,
    backupFiles: (string | CreatureFile)[] = [],
  ): CreatureFile[] {
    const raw: CreatureFile[] = [
      ...monsterFilesService.getFiles(monster),
      ...backupFiles.map((f) => (typeof f === "string" ? { name: f } : f)),
    ].map((f) => ({ name: f.name.toUpperCase(), game: f.game }));
    return collapseFilesByGame(raw);
  }
```

Add a module-level function (exported for direct testing):

```ts
/**
 * One entry per name. `game` is undefined (both games) when any entry for that name is
 * undefined, or when the entries together cover both bg1 and bg2; otherwise the lone game.
 */
export function collapseFilesByGame(files: CreatureFile[]): CreatureFile[] {
  const byName = new Map<string, Set<Game | undefined>>();
  const order: string[] = [];
  for (const f of files) {
    if (!byName.has(f.name)) {
      byName.set(f.name, new Set());
      order.push(f.name);
    }
    byName.get(f.name)!.add(f.game);
  }
  return order.map((name) => {
    const games = byName.get(name)!;
    const both = games.has("bg1") && games.has("bg2");
    const game = games.has(undefined) || both ? undefined : [...games][0];
    return { name, game };
  });
}
```

- [ ] **Step 4: Update `create` / `createFrom` param types**

In both param object type literals change `files?: string[];` to `files?: (string | CreatureFile)[];`. Leave `notEnforceFiles?: string[]` unchanged (mapped to uppercase strings as today).

- [ ] **Step 5: Update `applyCsvSummonFiles`**

`getSummonFiles` now returns `CreatureFile[]`. Rewrite the body to tag the synthetic adjustments:

```ts
  private applyCsvSummonFiles(creature: T): void {
    const knownFiles = new Set(
      creature.adjustments
        .filter((a) => a.summon)
        .flatMap((a) => a.files.map((f) => f.toUpperCase())),
    );
    const csvSummon = collapseFilesByGame(
      monsterFilesService.getSummonFiles(creature.id).map((f) => ({ ...f, name: f.name.toUpperCase() })),
    ).filter((f) => !knownFiles.has(f.name));
    if (csvSummon.length) {
      creature.setAdjustments(
        csvSummon.map((f) => ({ files: [f.name], summon: true, game: f.game })),
      );
    }
  }
```

(`PartialCreatureAdjustment` gains `game?` in Task 4 — this compiles once Task 4 lands; acceptable within a task boundary since Task 4 is next. If running strictly, add the `game?` field to `adjustment.ts` first.)

- [ ] **Step 6: Run tests**

Run: `npx vitest run lib/src/model/creature/family.test.ts`
Expected: PASS (the family suite; factory/weidu suites still red — later tasks).

- [ ] **Step 7: Commit**

```bash
git add lib/src/model/creature/family.ts lib/src/model/creature/family.test.ts
git commit -m "feat: resolve creature files with per-game collapse"
```

---

## Task 4: `game` on adjustment entries

**Files:**
- Modify: `lib/src/model/creature/adjustment.ts`, `lib/src/factories/creature.factory.ts` (`setAdjustments` `~73-88`)
- Test: `lib/src/factories/creature.factory.test.ts`

**Interfaces:**
- Consumes: `Game` (Task 1).
- Produces:
  - `CreatureAdjustment.game?: Game` and `CreatureAdjustment.files: string[]` (declared directly)
  - `PartialCreatureAdjustment` includes optional `game`
  - `creatureFactory.setAdjustments` copies `game` verbatim onto each `CreatureAdjustment`

- [ ] **Step 1: Write the failing test**

```ts
// creature.factory.test.ts
it("carries the game filter from a partial adjustment onto the built adjustment", () => {
  const creature = fakeCreature();
  creature.files = [{ name: "GORF" }];
  creatureFactory.setAdjustments(creature, [
    { files: ["gorf"], game: "bg2", data: { level1: 5 } },
  ]);
  expect(creature.adjustments[0].game).toBe("bg2");
  expect(creature.adjustments[0].files).toEqual(["GORF"]);
});
```

(Check `fakeCreature` in that test file; if it doesn't exist, use the pattern already used by neighbouring tests there — several set `creature.files = [...]` directly, now `CreatureFile[]`.)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/src/factories/creature.factory.test.ts -t "carries the game filter"`
Expected: FAIL — `game` is not a known property / is `undefined`.

- [ ] **Step 3: Implement**

`lib/src/model/creature/adjustment.ts`:

```ts
import { Game } from "./game";
// ...
export interface CreatureAdjustment extends BaseCreature {
  files: string[];
  /** Only apply this entry when installing the named game. Absent ⇒ both. */
  game?: Game;
  summon: boolean;
  noWeapon: boolean;
  scriptName: boolean;
  stringRef?: StringReference;
}

export type PartialCreatureAdjustment = PartialBy<
  Omit<CreatureAdjustment, "data">,
  "summon" | "noWeapon" | "scriptName" | "game"
> & { data?: InputCreatureData };
```

`creature.factory.ts` `setAdjustments`, in the `result` object literal, add:

```ts
        game: adjustment.game,
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/src/factories/creature.factory.test.ts -t "carries the game filter"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/src/model/creature/adjustment.ts lib/src/factories/creature.factory.ts lib/src/factories/creature.factory.test.ts
git commit -m "feat: optional game filter on adjustment entries"
```

---

## Task 5: Game-aware file uniqueness in `validate`

**Files:**
- Modify: `lib/src/factories/creature.factory.ts` (`validate` `~151-202`, specifically the `existingFiles` block `~164-174`)
- Test: `lib/src/factories/creature.factory.test.ts`

**Interfaces:**
- Consumes: `gamesOverlap` (Task 1); `Creature.files: CreatureFile[]`, `State.creatures` (each a `Creature`).
- Produces: `validate` flags a cross-creature file-name clash only when the two entries' games overlap.

- [ ] **Step 1: Write the failing tests**

The existing tests around lines 172-217 set `creature.files = ["TESTCRE"]` (strings) — update to `[{ name: "TESTCRE" }]`. Add:

```ts
it("allows the same resref on two creatures when their games don't overlap", () => {
  const a = fakeCreature();
  a.family = MonsterFamilyEnum.Ankheg;
  a.files = [{ name: "SHARED", game: "bg1" }];
  a.name = PLACEHOLDER_NAME_KEY;
  creatureFactory.validate(a, MonsterFamilyEnum.Ankheg);

  const b = fakeCreature();
  b.id = 2;
  b.family = MonsterFamilyEnum.Ankheg;
  b.files = [{ name: "SHARED", game: "bg2" }];
  b.name = PLACEHOLDER_NAME_KEY;
  const warn = vi.spyOn(logService, "warn");
  creatureFactory.validate(b, MonsterFamilyEnum.Ankheg);

  expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("already declared in other creatures"));
  expect(b.valid).toBe(true);
});

it("still flags the same resref when one side is both-games", () => {
  const a = fakeCreature();
  a.family = MonsterFamilyEnum.Ankheg;
  a.files = [{ name: "SHARED2" }];
  a.name = PLACEHOLDER_NAME_KEY;
  creatureFactory.validate(a, MonsterFamilyEnum.Ankheg);

  const b = fakeCreature();
  b.id = 3;
  b.family = MonsterFamilyEnum.Ankheg;
  b.files = [{ name: "SHARED2", game: "bg1" }];
  b.name = PLACEHOLDER_NAME_KEY;
  const warn = vi.spyOn(logService, "warn");
  creatureFactory.validate(b, MonsterFamilyEnum.Ankheg);

  expect(warn).toHaveBeenCalledWith(expect.stringContaining("already declared in other creatures"));
});
```

Match the exact helpers/imports used by the existing uniqueness tests in that file (`fakeCreature`, `PLACEHOLDER_NAME_KEY`, `logService`, `State` reset in `beforeEach`/`afterEach`). If `State.creatures` isn't reset between tests there, reuse whatever reset the neighbouring tests rely on.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/factories/creature.factory.test.ts -t "resref"`
Expected: FAIL — current code compares raw values / `.includes` on objects.

- [ ] **Step 3: Implement**

Add import: `import { gamesOverlap } from "../model/creature/game";`

Replace the `existingFiles` computation:

```ts
    const existingFiles = creature.files.filter((f) =>
      State.creatures.some((c) =>
        c.files.some((known) => known.name === f.name && gamesOverlap(known.game, f.game)),
      ),
    );
    if (existingFiles.length) {
      logService.warn(
        `${figureSet.warning} Those files are already declared in other creatures: ${existingFiles
          .map((f) => (f.game ? `${f.name} (${f.game})` : f.name))
          .join(", ")}`,
      );
      valid = false;
    }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/src/factories/creature.factory.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/src/factories/creature.factory.ts lib/src/factories/creature.factory.test.ts
git commit -m "feat: game-aware creature file uniqueness"
```

---

## Task 6: `checkAdjustmentFiles` — game availability + unsupported-combination guard

**Files:**
- Modify: `lib/src/services/creature.service.ts` (`checkAdjustmentFiles` `~179-192`)
- Test: `lib/src/services/creature.service.test.ts` (existing `checkAdjustmentFiles` describe `~1216+`)

**Interfaces:**
- Consumes: `Creature.fileNames`, `Creature.files: CreatureFile[]`, `CreatureAdjustment.game` (Tasks 1, 4).
- Produces: `checkAdjustmentFiles(creature): boolean` — returns `false` (and `logService.error`s) when:
  1. an adjustment names a file absent from `creature.fileNames` (existing behaviour), or
  2. a `game`-tagged adjustment names a file whose collapsed creature entry is scoped to the *other* game, or
  3. a `game`-tagged adjustment also sets any field emitted **outside** `handleAdjustment`: `summon`, `noWeapon`, `scriptName`, `data.script.location`, an array `data.effects.remove`, `data.spells.removeKnown === false`, or `data.spells.removeMemorized === false`.

- [ ] **Step 1: Write the failing tests**

```ts
// creature.service.test.ts, within the checkAdjustmentFiles describe
it("errors when a game-tagged adjustment names a wrong-game file", () => {
  const creature = fakeCreature();
  creature.files = [{ name: "BG1ONLY", game: "bg1" }];
  creature.adjustments = [
    { files: ["BG1ONLY"], game: "bg2", data: emptyData(), summon: false, noWeapon: false, scriptName: false },
  ] as unknown as CreatureAdjustment[];
  const err = vi.spyOn(logService, "error");
  expect(creatureService.checkAdjustmentFiles(creature)).toBe(false);
  expect(err).toHaveBeenCalledWith(expect.stringContaining("not available in bg2"));
});

it("errors when a game-tagged adjustment also toggles summon", () => {
  const creature = fakeCreature();
  creature.files = [{ name: "GORF" }];
  creature.adjustments = [
    { files: ["GORF"], game: "bg1", summon: true, noWeapon: false, scriptName: false, data: emptyData() },
  ] as unknown as CreatureAdjustment[];
  const err = vi.spyOn(logService, "error");
  expect(creatureService.checkAdjustmentFiles(creature)).toBe(false);
  expect(err).toHaveBeenCalledWith(expect.stringContaining("game-tagged adjustment"));
});

it("accepts a game-tagged data-only adjustment", () => {
  const creature = fakeCreature();
  creature.files = [{ name: "GORF" }];
  creature.adjustments = [
    { files: ["GORF"], game: "bg2", summon: false, noWeapon: false, scriptName: false, data: emptyData() },
  ] as unknown as CreatureAdjustment[];
  expect(creatureService.checkAdjustmentFiles(creature)).toBe(true);
});
```

Use whatever `fakeCreature` / data-builder the existing tests in this file use; if there's no `emptyData()` helper, inline `{ script: {}, effects: {}, spells: {} } as unknown as CreatureData` matching the neighbouring tests. Update the pre-existing `checkAdjustmentFiles` tests that set `creature.files` to string arrays → `CreatureFile[]`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/services/creature.service.test.ts -t "checkAdjustmentFiles"`
Expected: FAIL — `.some((known) => known.toUpperCase()...)` throws / new checks absent.

- [ ] **Step 3: Implement**

```ts
  checkAdjustmentFiles(creature: Creature): boolean {
    let ok = true;
    for (const adjustment of creature.adjustments) {
      for (const file of adjustment.files) {
        const entry = creature.files.find((k) => k.name.toUpperCase() === file.toUpperCase());
        if (!entry) {
          logService.error(
            `${translationService.from(creature.name)}: adjustment references unknown file '${file}' (not in creature.files).`,
          );
          ok = false;
          continue;
        }
        if (adjustment.game && entry.game && entry.game !== adjustment.game) {
          logService.error(
            `${translationService.from(creature.name)}: adjustment file '${file}' is not available in ${adjustment.game}.`,
          );
          ok = false;
        }
      }
      if (adjustment.game && this.adjustmentHasUngatedEffects(adjustment)) {
        logService.error(
          `${translationService.from(creature.name)}: game-tagged adjustment for '${adjustment.files.join(", ")}' also sets a field that is not game-gated (summon / noWeapon / scriptName / script.location / effects.remove array / spells.removeKnown:false / spells.removeMemorized:false). Split it into a non-game entry.`,
        );
        ok = false;
      }
    }
    return ok;
  }

  private adjustmentHasUngatedEffects(a: CreatureAdjustment): boolean {
    const d = a.data;
    return (
      a.summon ||
      a.noWeapon ||
      a.scriptName ||
      d.script.location !== undefined ||
      Array.isArray(d.effects.remove) ||
      d.spells.removeKnown === false ||
      d.spells.removeMemorized === false
    );
  }
```

Keep the existing case-insensitive-matching comment block above the method.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/src/services/creature.service.test.ts -t "checkAdjustmentFiles"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/creature.service.ts lib/src/services/creature.service.test.ts
git commit -m "feat: validate game-tagged adjustments"
```

---

## Task 7: `handleAdjustment` wraps `game`-tagged blocks in `PATCH_IF GAME_IS`

**Files:**
- Modify: `lib/src/services/weidu/weidu-creature.service.ts` (`handleAdjustment` `~560-599`)
- Test: `lib/src/services/weidu/weidu-creature.service.test.ts` (`handleAdjustment` describe `~407`)

**Interfaces:**
- Consumes: `GAME_IS_CONDITION` (Task 1); `CreatureAdjustment.game` (Task 4).
- Produces: when `adjustment.game` set, the entire emitted adjustment block is nested inside `PATCH_IF <GAME_IS_CONDITION[game]> BEGIN … END`.

- [ ] **Step 1: Write the failing test**

```ts
// weidu-creature.service.test.ts
it("wraps a game-tagged adjustment in PATCH_IF GAME_IS", () => {
  const creature = fakeCreature({ files: [{ name: "GORF" }] });
  const adjustment = fakeAdjustment({
    files: ["GORF"],
    game: "bg2",
    data: { level1: { pnpValue: 5 } as unknown, effects: { list: [] }, spells: { memorized: [] } },
  });
  const lines: CodeLine[] = [];
  service.handleAdjustment(lines, 0, creature, adjustment);
  const out = codes(lines);
  expect(out).toContain("PATCH_IF GAME_IS ~bg2ee~ BEGIN ");
  // the file-match PATCH_IF is now nested one deeper than the game guard
  const gameIdx = out.findIndex((c) => c.includes("PATCH_IF GAME_IS"));
  const fileIdx = out.findIndex((c) => c.includes('"%SOURCE_RES%" STRING_EQUAL_CASE ~GORF~'));
  expect(gameIdx).toBeGreaterThanOrEqual(0);
  expect(fileIdx).toBeGreaterThan(gameIdx);
});

it("emits no game guard for an untagged adjustment", () => {
  const creature = fakeCreature({ files: [{ name: "GORF" }] });
  const adjustment = fakeAdjustment({ files: ["GORF"], data: { effects: { list: [] }, spells: { memorized: [] } } });
  const lines: CodeLine[] = [];
  service.handleAdjustment(lines, 0, creature, adjustment);
  expect(codes(lines).some((c) => c.includes("GAME_IS"))).toBe(false);
});
```

Add `game?` to the `fakeAdjustment` param type in the test file's `WeiduCreatureServicePrivate`-adjacent helper (it spreads `...p` into a `CreatureAdjustment` cast, so just widening the param type is enough).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/services/weidu/weidu-creature.service.test.ts -t "game"`
Expected: FAIL — no `PATCH_IF GAME_IS` emitted.

- [ ] **Step 3: Implement**

At the top of `handleAdjustment`, before `this.startConditionalSourceRes(...)`:

```ts
    const gameGuard = adjustment.game ? GAME_IS_CONDITION[adjustment.game] : undefined;
    if (gameGuard) {
      this.add(lines, `PATCH_IF ${gameGuard} BEGIN `, tab);
      tab++;
    }
```

At the end of the method, after the existing final `this.add(lines, "END", tab - 1);`:

```ts
    if (gameGuard) {
      tab--;
      this.add(lines, "END", tab);
    }
```

Add the import: `import { GAME_IS_CONDITION } from "../../model/creature/game";`

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/src/services/weidu/weidu-creature.service.test.ts -t "game"`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/weidu/weidu-creature.service.ts lib/src/services/weidu/weidu-creature.service.test.ts
git commit -m "feat: gate game-tagged adjustment output with PATCH_IF GAME_IS"
```

---

## Task 8: `patchCreatures` partitions the per-file loop by game

**Files:**
- Modify: `lib/src/services/weidu/weidu-creature.service.ts` (`patchCreatures` `~143-199`, `removeAllEffects` `~207-221` uses `creature.files`)
- Test: `lib/src/services/weidu/weidu-creature.service.test.ts`

**Interfaces:**
- Consumes: `GAME_IS_CONDITION` (Task 1); `Creature.files: CreatureFile[]`, `Creature.fileNames` (Task 1).
- Produces: `patchCreatures` emits the current single `ACTION_FOR_EACH ~file~ IN …` body once per non-empty game group — the `undefined` group unconditionally, the `bg1`/`bg2` groups each inside `ACTION_IF <GAME_IS_CONDITION[...]> BEGIN … END`. A creature whose files are all `game: undefined` produces byte-identical output to before this task.

- [ ] **Step 1: Write the failing tests**

```ts
it("emits one unconditional ACTION_FOR_EACH when all files are both-game", () => {
  const creature = fakeCreature({
    files: [{ name: "A" }, { name: "B" }],
    data: fullBaseData(),   // reuse the helper the other patchCreatures-adjacent tests use
  });
  const lines: CodeLine[] = [];
  service.patchCreatures(lines, 0, creature);
  const out = codes(lines);
  expect(out.filter((c) => c === "ACTION_FOR_EACH ~file~ IN")).toHaveLength(1);
  expect(out.some((c) => c.includes("GAME_IS"))).toBe(false);
});

it("splits bg1-only and bg2-only files into GAME_IS-guarded loops", () => {
  const creature = fakeCreature({
    files: [{ name: "BOTH" }, { name: "ONE", game: "bg1" }, { name: "TWO", game: "bg2" }],
    data: fullBaseData(),
  });
  const lines: CodeLine[] = [];
  service.patchCreatures(lines, 0, creature);
  const out = codes(lines);
  expect(out).toContain("ACTION_IF GAME_IS ~bgee eet~ BEGIN");
  expect(out).toContain("ACTION_IF GAME_IS ~bg2ee~ BEGIN");
  expect(out.filter((c) => c === "ACTION_FOR_EACH ~file~ IN")).toHaveLength(3);
  // group membership
  const j = out.join("\n");
  expect(j).toMatch(/GAME_IS ~bgee eet~ BEGIN[\s\S]*"ONE"/);
  expect(j).toMatch(/GAME_IS ~bg2ee~ BEGIN[\s\S]*"TWO"/);
});
```

`patchCreatures` is currently private and not on the `WeiduCreatureServicePrivate` interface — add it:

```ts
  patchCreatures(lines: CodeLine[], tab: number, creature: Creature): void;
```

If the existing tests lack a `fullBaseData()` helper, build the minimal `CreatureData` the method dereferences (it touches `data.effects`, `data.spells`, `data.items`, `data.proficiencies`, `data.immunities`, `data.script`, `data.movement`, `data.level1`) — copy the shape from an existing passing `patchCreature` test in the same file.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/services/weidu/weidu-creature.service.test.ts -t "ACTION_FOR_EACH"`
Expected: FAIL — one loop, no `GAME_IS`.

- [ ] **Step 3: Implement**

Extract the current loop body. Rename the existing `patchCreatures` body: keep the method as the dispatcher, move everything from `this.add(lines, "ACTION_FOR_EACH ~file~ IN", tab);` through the closing `this.add(lines, "END", tab - 1);` into a new private `patchCreatureFileLoop(lines, tab, creature, names: string[])` that takes an explicit name list instead of reading `creature.files`:

```ts
  private patchCreatures(lines: CodeLine[], tab: number, creature: Creature) {
    const groups: { game?: Game; names: string[] }[] = [
      { game: undefined, names: [] },
      { game: "bg1", names: [] },
      { game: "bg2", names: [] },
    ];
    for (const f of creature.files) {
      groups.find((g) => g.game === f.game)!.names.push(f.name);
    }
    for (const group of groups) {
      if (!group.names.length) continue;
      if (group.game) {
        this.add(lines, `ACTION_IF ${GAME_IS_CONDITION[group.game]} BEGIN`, tab);
        this.patchCreatureFileLoop(lines, tab + 1, creature, group.names);
        this.add(lines, "END", tab);
      } else {
        this.patchCreatureFileLoop(lines, tab, creature, group.names);
      }
    }
  }

  private patchCreatureFileLoop(
    lines: CodeLine[],
    tab: number,
    creature: Creature,
    names: string[],
  ) {
    this.add(lines, "ACTION_FOR_EACH ~file~ IN", tab);
    for (const file of names) this.add(lines, `"${file}"`, tab + 1);
    this.add(lines, "BEGIN", tab);
    tab++;
    // ... rest of the current body verbatim, unchanged ...
  }
```

Inner helpers keep reading the full name list: change `removeAllEffects` line `const files = creature.files.reduce<string[]>(...)` to iterate `creature.fileNames` (a non-iterated name simply never matches `%SOURCE_RES%` in the current loop, so passing the full list is correct). Same for any other `creature.files` read inside the body — swap to `creature.fileNames`.

Add imports: `import { Game, GAME_IS_CONDITION } from "../../model/creature/game";`

- [ ] **Step 4: Run tests + full generation smoke**

Run: `npx vitest run lib/src/services/weidu/weidu-creature.service.test.ts`
Expected: PASS

Run: `npm run generate`
Expected: completes without error. `git diff --stat mod/` should show **no changes** (no creature carries game-scoped files or game-tagged adjustments yet). If `mod/` changes, the extraction from `creature.files` in the loop body wasn't kept byte-identical — investigate before continuing.

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/weidu/weidu-creature.service.ts lib/src/services/weidu/weidu-creature.service.test.ts
git commit -m "feat: partition creature file patch loop by game"
```

---

## Task 9: Extend `report-game-adjustments.ts`

**Files:**
- Modify: `scripts/report-game-adjustments.ts`
- Test: none (reporting script; verify by running)

**Interfaces:**
- Consumes: `creature.adjustments` with `game` (Task 4); `assets/creatures.csv` `game` column.
- Produces: `assets/game-adjustments-report.md` gains a section listing `(file, game)` rows where the csv per-game values differ but **no** `game`-tagged adjustment covers that file for that game, and a section listing `game`-tagged adjustments whose csv row does not actually differ between games (possible mis-tag).

- [ ] **Step 1: Add the "uncovered" cross-check**

In `indexAdjustmentFiles()` also record, per file, the set of `game` values seen on adjustments covering it:

```ts
interface AdjustmentMatch {
  monster: string;
  baseLevel?: number;
  adjustmentLevel?: number;
  adjustmentGames: Set<string>;   // "" for untagged
}
```

Populate `adjustmentGames` from `creature.adjustments` (`a.game ?? ""`), keyed by uppercased file.

- [ ] **Step 2: Compute and render the new sections**

```ts
const perGameFiles = new Map<string, Set<string>>(); // file -> set of csv game values (non-empty)
for (const r of creatures.rows) {
  if (!r.game) continue;
  const s = perGameFiles.get(r.file.toUpperCase()) ?? new Set<string>();
  s.add(r.game);
  perGameFiles.set(r.file.toUpperCase(), s);
}

const uncovered = rows.filter((r) => {
  const match = adjustmentFiles.get(r.file.toUpperCase())?.[0];
  const games = match?.adjustmentGames ?? new Set<string>();
  // divergent csv rows but neither a matching game tag nor an untagged catch-all
  return perGameFiles.get(r.file.toUpperCase())!.size > 1 && !games.has(r.game) && !games.has("");
});
```

Append two markdown sections to `lines` (mirror the style of the existing sections): "Divergent csv rows not covered by a game-tagged adjustment" and "Game-tagged adjustments whose csv rows don't differ".

- [ ] **Step 3: Run it**

Run: `npx ts-node scripts/report-game-adjustments.ts`
Expected: writes `assets/game-adjustments-report.md`, prints counts, no crash.

- [ ] **Step 4: Commit**

```bash
git add scripts/report-game-adjustments.ts assets/game-adjustments-report.md
git commit -m "feat: report uncovered and mis-tagged per-game adjustments"
```

---

## Task 10: Tag the `GORF` adjustment in `ogres.ts` (demonstration + end-to-end check)

**Files:**
- Modify: `lib/creatures/ogres.ts` (`ogre()` `setAdjustments` `~447-533`)
- Test: full suite + generation diff

**Interfaces:**
- Consumes: everything above.
- Produces: `GORF` patched as a level-9 fighter only under `GAME_IS ~bgee eet~`, and (new) a level-5 entry under `GAME_IS ~bg2ee~`.

- [ ] **Step 1: Split the `GORF` entries**

In `ogre().setAdjustments([...])`:
- The chieftain entry `files: ["AC#WRIM1", "AC#FP2O2", "BDSOGR1", "BDSOGR2", "ACQ13002", "GORF", "HACK", "LARZE"]` — leave as-is (its stats are BG2-flavoured chieftain data and `GORF` legitimately gets them as a fallback).
- The level-9 fighter entry `files: ["GORF", "AC#WRIM1", "HACK", "LARZE"]` → add `game: "bg1"` (Gorf is the BG1 half-ogre lieutenant at L9). Keep `AC#WRIM1/HACK/LARZE` — they are BG2 mod resrefs with no BG1 row, and `checkAdjustmentFiles` (Task 6) will only complain if their collapsed entry is scoped to `bg2`; they collapse to `undefined` (single non-game csv row) so `game:"bg1"` on them is allowed. If Task 6 *does* flag them, split into two entries: `{ files:["GORF"], game:"bg1", ... }` and `{ files:["AC#WRIM1","HACK","LARZE"], ... }` (untagged).
- Add a new entry after it:

```ts
      {
        // BG2 "Gorf the Squisher" — level 5, weaker than the BG1 lieutenant
        files: ["GORF"],
        game: "bg2",
        data: {
          level1: 5,
          class: "FIGHTER",
          xpv: 2500,
        },
      },
```

- [ ] **Step 2: Run the full suite**

Run: `npm test`
Expected: PASS. No `checkAdjustmentFiles` error in generation logs about `GORF`.

- [ ] **Step 3: Regenerate and inspect**

Run: `npm run generate`
Then: `git diff mod/ -- '*ogre*'`
Expected: the ogre family `.tpa` now contains `PATCH_IF GAME_IS ~bgee eet~ BEGIN` around the L9 `GORF` writes and `PATCH_IF GAME_IS ~bg2ee~ BEGIN` around the new L5 writes. No other family's output changed.

- [ ] **Step 4: Run the report**

Run: `npx ts-node scripts/report-game-adjustments.ts`
Expected: `GORF` no longer in the "uncovered" section.

- [ ] **Step 5: Commit**

```bash
git add lib/creatures/ogres.ts mod/ assets/game-adjustments-report.md
git commit -m "feat: game-specific GORF stats for bg1 vs bg2"
```

- [ ] **Step 6: Lint**

Run: `npm run lint`
Expected: clean (fix any issues, re-commit with `--amend` only if not yet pushed).

---

## Task 11 (deferrable): show adjustment `game` in the generated docs

Independent of the generator; can ship later. Do it only if the docs panel is in active use.

**Files:**
- Modify: `lib/src/services/doc/adjustment.service.ts` (`EffectiveAdjustment` `~15-40`, `getEffectiveDataForFile` `~63+`, `group` )
- Modify: `lib/src/services/doc/documentation.service.ts` (`getAdjustmentPanel` label area `~509-513`)
- Test: `lib/src/services/doc/adjustment.service.test.ts`

**Interfaces:**
- Consumes: `CreatureAdjustment.game`.
- Produces: `EffectiveAdjustment.game?: Game` — set when every adjustment matching that file shares one `game`, else `undefined`; rendered as a `bg1`/`bg2` chip next to the adjustment label.

- [ ] **Step 1: Failing test**

```ts
it("carries game onto the effective adjustment when all matching entries agree", () => {
  const creature = makeCreature(/* per the file's existing helpers */);
  creature.adjustments = [
    { files: ["GORF"], game: "bg2", data: adjData({ level1: 5 }), summon: false, noWeapon: false, scriptName: false },
  ] as unknown as CreatureAdjustment[];
  const [eff] = adjustmentService.getEffectiveAdjustments(creature);
  expect(eff.game).toBe("bg2");
});
```

- [ ] **Step 2: Verify it fails**

Run: `npx vitest run lib/src/services/doc/adjustment.service.test.ts -t "carries game"`
Expected: FAIL — `game` not on `EffectiveAdjustment`.

- [ ] **Step 3: Implement**

- Add `game?: Game;` to `EffectiveAdjustment` (import `Game`).
- In `getEffectiveDataForFile`, after `const matching = creature.adjustments.filter(...)`:

```ts
    const games = new Set(matching.map((a) => a.game));
    const game = games.size === 1 ? [...games][0] : undefined;
```

  include `game` in the returned object.
- In `group`, only merge two per-file effectives into one row when their `game` matches; carry `game` onto the merged row.
- In `documentation.service.ts` `getAdjustmentPanel`, when `effective.game` is set, prepend a chip to the label:

```ts
    const gameChip = effective.game
      ? `<span class="adjustment-game-chip">${effective.game}</span> `
      : "";
    const label = gameChip + this.getAdjustmentLabel(creature, effective.files);
```

- [ ] **Step 4: Verify it passes + regen docs**

Run: `npx vitest run lib/src/services/doc/adjustment.service.test.ts`
Then: `npm run generate` and open `mod/docs/monsters.html` — GORF's BG2 adjustment card shows a `bg2` chip.

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/doc/ mod/docs/
git commit -m "feat: show per-game chip on adjustment docs cards"
```

---

## Self-Review

**Spec coverage**

| Spec section | Task |
| --- | --- |
| `Game` / `CreatureFile` types | 1 |
| `Creature.files` typed, `fileNames` getter, `BaseCreature` split | 1 |
| Input `(string \| CreatureFile)[]` | 3 |
| `monster-files.service` parses `game`, returns `CreatureFile[]` | 2 |
| `resolveFiles` collapse rule | 3 |
| `applyCsvSummonFiles` game tagging | 3 |
| `game?` on adjustment + factory passthrough | 4 |
| Game-aware uniqueness (`gamesOverlap`) | 1 (helper), 5 (use) |
| Adjustment `game` sanity + unsupported-combo guard | 6 |
| `GAME_IS` mapping | 1 |
| `patchCreatures` loop partitioning | 8 |
| `handleAdjustment` `PATCH_IF GAME_IS` | 7 |
| `patchScripts` edge case | 6 (guarded: `game` + `script.location`/`summon` is an error) — full support deferred per spec |
| report extension | 9 |
| docs chip | 11 (deferrable) |
| authoring GORF | 10 |
| tests | each task |

Deviation from spec, accepted at plan time: `notEnforceFiles` stays `string[]` (see Global Constraints). The spec's `patchScripts` "gate the arrays too" option is replaced by the stricter "reject the combination" guard from Task 6 — no creature needs it, and it keeps this plan bounded; revisit as a follow-up if a game-scoped script/summon adjustment is ever needed.

**Placeholder scan:** No "TBD"/"handle edge cases"/bare "write tests". Task 11 is explicitly labelled deferrable with full code, not a placeholder.

**Type consistency:** `CreatureFile { name, game? }`, `Game`, `gamesOverlap(a,b)`, `GAME_IS_CONDITION` (Task 1) used verbatim in Tasks 2/3/5/7/8. `Creature.fileNames` (Task 1) used in Tasks 6/8. `collapseFilesByGame` (Task 3) reused in `applyCsvSummonFiles` same task. `adjustmentHasUngatedEffects` local to Task 6. `patchCreatureFileLoop` local to Task 8.
