# Creature CSV Validation Controls Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add three advisory checks that compare each generated creature against its source row(s) in `assets/creatures.csv` — persisting items, level gap, retained original scripts — each acknowledgeable per source row via a new boolean column.

**Architecture:** A new CSV parser (`parseCreatureRowsCsv` / `getCreatureRow`) in `monster-files.service.ts` exposes per-file source data. Three pure finder methods on `creatureService` produce per-file `CsvFinding[]`. `creatureService.checkAgainstCsv` filters findings by the row's new `Validated*` flag and emits one aggregated log line per creature; `creatureFactory.validate()` calls it. The three columns are carried through a full `creatures.csv` rebuild (`CARRIED_COLUMNS`) and seeded once by a new `scripts/build-validation-columns.ts`.

**Tech Stack:** TypeScript, Node, Vitest, ts-node. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-09-01-creature-csv-validation-controls-design.md`

## Global Constraints

- **Severity:** all three checks are `logService.warn` / `logService.info` only. `Creature.valid` is never modified by this feature.
- **Item clearing:** only `data.items.remove` clears a persisting-item finding. Re-equipping via `data.items.equipped` does not.
- **Level threshold:** finding when `Math.abs(csvLevel - effectiveLevel) > 2`.
- **Effective level per file:** base `creature.data.level1.pnpValue`, overridden by the **last** adjustment (in `creature.adjustments` order) that lists the file *and* sets its own `data.level1`.
- **Effective remove/removed sets per file:** base value ∪ the same-named field of every adjustment whose `files` include that file. Script check additionally unions `GLOBAL_CONFIG.tpaConstants.genericScriptsToRemove`. All comparisons case-insensitive.
- **Script column values:** blank entries are dropped by the parser; `None` (any case) is ignored by the check.
- **Column semantics:** literal string `"true"` suppresses; anything else (blank) does not.
- **Column names (exact):** `ValidatedLevel`, `ValidatedItems`, `ValidatedScript`, inserted immediately after `ValidatedMonsterId`.
- **Log line format:** `` `${translationService.from(creature.name)}: ${label} — ${details.join("; ")}` ``.
- **Canonical column orders:**
  - `SLOT_COLUMNS = ["helmet","shield","lring","rring","amulet","weapon1","weapon2","weapon3","weapon4"]`
  - `SCRIPT_COLUMNS = ["overrideScript","classScript","raceScript","generalScript","defaultScript"]`
- Run single test files with `npx vitest run <path>`. Full suite: `npx vitest run`.

---

## File Structure

| File | Responsibility |
|---|---|
| `lib/src/services/monster-files.service.ts` | + `CreatureCsvRow`, `parseCreatureRowsCsv`, `pickCreatureRow`, `monsterFilesService.getCreatureRow` |
| `lib/src/services/monster-files.service.test.ts` | parser + picker + getter tests |
| `lib/src/services/creature.service.ts` | + `CsvFinding`, `findPersistingItems`, `findLevelGaps`, `findOriginalScripts`, `checkAgainstCsv`, `reportCsvFinding` |
| `lib/src/services/creature.service.test.ts` | finder + suppression + aggregation tests |
| `lib/src/factories/creature.factory.ts` | one `creatureService.checkAgainstCsv(creature)` call in `validate()` |
| `scripts/lib/build-creatures.ts` | generalise `CARRIED_COLUMNS` / `MonsterIds` / `indexMonsterIds` / `attachCarriedColumns` / `EMPTY_IDS` to carry the 3 columns |
| `scripts/lib/build-creatures.test.ts` | updated header assertion + carry test |
| `scripts/lib/validation-columns.ts` | **new** — pure logic: `VALIDATION_COLUMNS`, `rowKey`, `insertValidationColumns`, `applyValidationColumns` |
| `scripts/lib/validation-columns.test.ts` | **new** — pure logic tests |
| `scripts/build-validation-columns.ts` | **new** — one-shot: build families, gather findings, rewrite `assets/creatures.csv` |
| `assets/creatures.csv` | +3 columns, values filled by the one-shot script (Task 6) |

---

## Task 1: `parseCreatureRowsCsv` + `getCreatureRow` in monster-files.service

**Files:**
- Modify: `lib/src/services/monster-files.service.ts`
- Test: `lib/src/services/monster-files.service.test.ts`

**Interfaces:**
- Consumes: nothing new. Existing `csvLines`, `gameValue`, `FILE_COLUMN`, `GAME_COLUMN`, `CSV_PATH`, `Game` (from `../model/creature/game`).
- Produces:
  ```ts
  export interface CreatureCsvRow {
    file: string;
    game?: Game;
    level: number | undefined;
    items: { slot: string; file: string }[];
    scripts: { slot: string; value: string }[];
    validatedLevel: boolean;
    validatedItems: boolean;
    validatedScript: boolean;
  }
  export function parseCreatureRowsCsv(raw: string): Map<string, CreatureCsvRow[]>; // keyed by UPPERCASE file
  export function pickCreatureRow(rows: CreatureCsvRow[], game: Game | undefined): CreatureCsvRow | undefined;
  // method:
  monsterFilesService.getCreatureRow(file: string, game: Game | undefined): CreatureCsvRow | undefined;
  ```

- [ ] **Step 1: Write the failing tests**

Add to `lib/src/services/monster-files.service.test.ts`:

```ts
import monsterFilesService, {
  // ...existing imports...
  parseCreatureRowsCsv,
  pickCreatureRow,
} from "./monster-files.service";

const ROW_HEADER =
  "file;level;overrideScript;classScript;raceScript;generalScript;defaultScript;" +
  "helmet;shield;lring;rring;amulet;weapon1;weapon2;weapon3;weapon4;" +
  "MonsterId;ValidatedMonsterId;ValidatedLevel;ValidatedItems;ValidatedScript;game;name";

// column order for a ROW_HEADER row:
// file;level;override;class;race;general;default;helmet;shield;lring;rring;amulet;
// weapon1;weapon2;weapon3;weapon4;MonsterId;ValidatedMonsterId;VLevel;VItems;VScript;game;name

describe("parseCreatureRowsCsv", () => {
  it("extracts level, slot items and scripts in canonical order, dropping blanks", () => {
    const csv = [
      ROW_HEADER,
      "ABELA;6;RR#PICKP;None;None;None;wtrunsgt;;;RING95;;;SW1H01;;;;Nymph;true;;;;;Abela",
    ].join("\n");

    expect(parseCreatureRowsCsv(csv).get("ABELA")).toEqual([
      {
        file: "ABELA",
        game: undefined,
        level: 6,
        items: [
          { slot: "lring", file: "RING95" },
          { slot: "weapon1", file: "SW1H01" },
        ],
        scripts: [
          { slot: "overrideScript", value: "RR#PICKP" },
          { slot: "classScript", value: "None" },
          { slot: "raceScript", value: "None" },
          { slot: "generalScript", value: "None" },
          { slot: "defaultScript", value: "wtrunsgt" },
        ],
        validatedLevel: false,
        validatedItems: false,
        validatedScript: false,
      },
    ]);
  });

  it("parses a blank or non-numeric level as undefined", () => {
    const csv = [
      ROW_HEADER,
      "AAA;;None;None;None;None;None;;;;;;;;;;Nymph;true;;;;;A",
      "BBB;x;None;None;None;None;None;;;;;;;;;;Nymph;true;;;;;B",
    ].join("\n");
    const m = parseCreatureRowsCsv(csv);
    expect(m.get("AAA")![0].level).toBeUndefined();
    expect(m.get("BBB")![0].level).toBeUndefined();
  });

  it("reads the three Validated* flags, treating only 'true' as set", () => {
    const csv = [
      ROW_HEADER,
      "AAA;1;None;None;None;None;None;;;;;;;;;;N;true;true;false;;;A",
    ].join("\n");
    const row = parseCreatureRowsCsv(csv).get("AAA")![0];
    expect([row.validatedLevel, row.validatedItems, row.validatedScript]).toEqual([true, false, false]);
  });

  it("defaults the flags to false when the columns are absent", () => {
    const csv = ["file;level;game;name", "AAA;1;;A"].join("\n");
    const row = parseCreatureRowsCsv(csv).get("AAA")![0];
    expect([row.validatedLevel, row.validatedItems, row.validatedScript]).toEqual([false, false, false]);
  });

  it("groups game-tagged duplicate rows under the uppercased file key", () => {
    const csv = [
      ROW_HEADER,
      "gorf;3;None;None;None;None;None;;;;;;;;;;Ogre;true;;;;bg1;Gorf",
      "gorf;5;None;None;None;None;None;;;;;;;;;;Ogre;true;;;;bg2;Big Gorf",
    ].join("\n");
    const rows = parseCreatureRowsCsv(csv).get("GORF")!;
    expect(rows.map((r) => [r.game, r.level])).toEqual([["bg1", 3], ["bg2", 5]]);
  });
});

describe("pickCreatureRow", () => {
  const mk = (game: CreatureCsvRow["game"]): CreatureCsvRow => ({
    file: "X", game, level: 0, items: [], scripts: [],
    validatedLevel: false, validatedItems: false, validatedScript: false,
  });

  it("prefers an exact game match", () => {
    expect(pickCreatureRow([mk(undefined), mk("bg2")], "bg2")!.game).toBe("bg2");
  });
  it("falls back to the untagged row", () => {
    expect(pickCreatureRow([mk(undefined), mk("bg1")], "bg2")!.game).toBeUndefined();
  });
  it("falls back to the first row when nothing else matches", () => {
    expect(pickCreatureRow([mk("bg1"), mk("bg2")], undefined)!.game).toBe("bg1");
  });
});

describe("monsterFilesService.getCreatureRow", () => {
  it("returns a parsed row for a known file, case-insensitively", () => {
    const row = monsterFilesService.getCreatureRow("abela", undefined);
    expect(row?.file.toUpperCase()).toBe("ABELA");
    expect(typeof row?.level === "number" || row?.level === undefined).toBe(true);
  });
  it("returns undefined for an unknown file", () => {
    expect(monsterFilesService.getCreatureRow("NOT_A_REAL_FILE_ID", undefined)).toBeUndefined();
  });
});
```

Also add `CreatureCsvRow` to the type import if the test references it (it does in `mk`): import it from `./monster-files.service`.

- [ ] **Step 2: Run the tests, verify they fail**

Run: `npx vitest run lib/src/services/monster-files.service.test.ts`
Expected: FAIL — `parseCreatureRowsCsv is not a function` / `pickCreatureRow is not a function` / `getCreatureRow is not a function`.

- [ ] **Step 3: Implement**

In `lib/src/services/monster-files.service.ts`, add the `Game` import and the new constants/code. Near the other column constants:

```ts
import { CreatureFile, Game } from "../model/creature/game";

const LEVEL_COLUMN = "level";
const SLOT_COLUMNS = [
  "helmet", "shield", "lring", "rring", "amulet",
  "weapon1", "weapon2", "weapon3", "weapon4",
] as const;
const SCRIPT_COLUMNS = [
  "overrideScript", "classScript", "raceScript", "generalScript", "defaultScript",
] as const;
const VALIDATED_LEVEL_COLUMN = "ValidatedLevel";
const VALIDATED_ITEMS_COLUMN = "ValidatedItems";
const VALIDATED_SCRIPT_COLUMN = "ValidatedScript";

export interface CreatureCsvRow {
  file: string;
  game?: Game;
  level: number | undefined;
  items: { slot: string; file: string }[];
  scripts: { slot: string; value: string }[];
  validatedLevel: boolean;
  validatedItems: boolean;
  validatedScript: boolean;
}

export function parseCreatureRowsCsv(raw: string): Map<string, CreatureCsvRow[]> {
  const lines = csvLines(raw);
  const header = lines[0].split(";");
  const at = (col: string) => header.indexOf(col);
  const fileIdx = at(FILE_COLUMN);
  const gameIdx = at(GAME_COLUMN);
  const levelIdx = at(LEVEL_COLUMN);
  const slotIdx = SLOT_COLUMNS.map((slot) => ({ slot, i: at(slot) }));
  const scriptIdx = SCRIPT_COLUMNS.map((slot) => ({ slot, i: at(slot) }));
  const vLevelIdx = at(VALIDATED_LEVEL_COLUMN);
  const vItemsIdx = at(VALIDATED_ITEMS_COLUMN);
  const vScriptIdx = at(VALIDATED_SCRIPT_COLUMN);

  const result = new Map<string, CreatureCsvRow[]>();
  for (const line of lines.slice(1)) {
    const fields = line.split(";");
    const file = fields[fileIdx] ?? "";
    if (!file) continue;
    const levelRaw = (fields[levelIdx] ?? "").trim();
    const levelNum = Number(levelRaw);
    const row: CreatureCsvRow = {
      file,
      game: gameValue(fields[gameIdx]),
      level: levelRaw === "" || Number.isNaN(levelNum) ? undefined : levelNum,
      items: slotIdx
        .filter(({ i }) => i >= 0 && (fields[i] ?? "").trim() !== "")
        .map(({ slot, i }) => ({ slot, file: fields[i].trim() })),
      scripts: scriptIdx
        .filter(({ i }) => i >= 0 && (fields[i] ?? "").trim() !== "")
        .map(({ slot, i }) => ({ slot, value: fields[i].trim() })),
      validatedLevel: (fields[vLevelIdx] ?? "") === "true",
      validatedItems: (fields[vItemsIdx] ?? "") === "true",
      validatedScript: (fields[vScriptIdx] ?? "") === "true",
    };
    const key = file.toUpperCase();
    const existing = result.get(key);
    if (existing) existing.push(row);
    else result.set(key, [row]);
  }
  return result;
}

export function pickCreatureRow(
  rows: CreatureCsvRow[],
  game: Game | undefined,
): CreatureCsvRow | undefined {
  return (
    rows.find((r) => r.game === game) ??
    rows.find((r) => r.game === undefined) ??
    rows[0]
  );
}
```

In the `MonsterFilesService` class add the cache field and method:

```ts
private creatureRowsByFile?: Map<string, CreatureCsvRow[]>;

getCreatureRow(file: string, game: Game | undefined): CreatureCsvRow | undefined {
  this.creatureRowsByFile ??= parseCreatureRowsCsv(fs.readFileSync(CSV_PATH, "utf-8"));
  const rows = this.creatureRowsByFile.get(file.toUpperCase());
  return rows?.length ? pickCreatureRow(rows, game) : undefined;
}
```

- [ ] **Step 4: Run the tests, verify they pass**

Run: `npx vitest run lib/src/services/monster-files.service.test.ts`
Expected: PASS. If the `getCreatureRow("abela")` test fails because `ABELA` is absent from `assets/creatures.csv`, pick any file that `grep -m1 '^[A-Z]' assets/creatures.csv` shows and adjust the assertion (assert only `row?.file` upper-cases to that file and `getCreatureRow("NOT_A_REAL_FILE_ID")` is undefined).

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/monster-files.service.ts lib/src/services/monster-files.service.test.ts
git commit -m "feat: parse per-file source rows from creatures.csv

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 2: three finder methods on creatureService

**Files:**
- Modify: `lib/src/services/creature.service.ts`
- Test: `lib/src/services/creature.service.test.ts`

**Interfaces:**
- Consumes: `monsterFilesService.getCreatureRow` (Task 1); `GLOBAL_CONFIG.tpaConstants.genericScriptsToRemove` from `../../config/generate`; `Game` from `../model/creature/game`; existing `CreatureAdjustment` import.
- Produces:
  ```ts
  export interface CsvFinding { file: string; game?: Game; detail: string }
  creatureService.findPersistingItems(creature: Creature): CsvFinding[]
  creatureService.findLevelGaps(creature: Creature): CsvFinding[]
  creatureService.findOriginalScripts(creature: Creature): CsvFinding[]
  ```

- [ ] **Step 1: Write the failing tests**

Add a new describe block to `lib/src/services/creature.service.test.ts`. It builds creatures inline (the shared `fakeCreature` helper does not carry `files` / `data.script` / `data.level1`) and stubs `getCreatureRow`:

```ts
import { vi, afterEach } from "vitest";
import type { CreatureCsvRow } from "./monster-files.service";
import type { Game } from "../model/creature/game";

function csvRow(over: Partial<CreatureCsvRow>): CreatureCsvRow {
  return {
    file: "F", game: undefined, level: undefined, items: [], scripts: [],
    validatedLevel: false, validatedItems: false, validatedScript: false, ...over,
  };
}

function creatureWith(p: {
  files: { name: string; game?: Game }[];
  level1?: number;
  itemsRemove?: string[];
  scriptRemove?: string[];
  adjustments?: {
    files: string[];
    level1?: number;
    itemsRemove?: string[];
    scriptRemove?: string[];
  }[];
}): Creature {
  return {
    name: "test.name",
    files: p.files,
    data: {
      level1: p.level1 === undefined ? undefined : { pnpValue: p.level1, value: p.level1, type: "none" },
      items: { remove: p.itemsRemove ?? [], equipped: [] },
      script: { remove: p.scriptRemove ?? [] },
    },
    adjustments: (p.adjustments ?? []).map((a) => ({
      files: a.files,
      data: {
        level1: a.level1 === undefined ? undefined : { pnpValue: a.level1, value: a.level1, type: "none" },
        items: { remove: a.itemsRemove ?? [], equipped: [] },
        script: { remove: a.scriptRemove ?? [] },
      },
    })),
  } as unknown as Creature;
}

describe("creatureService.findPersistingItems", () => {
  afterEach(() => vi.restoreAllMocks());

  it("reports a slot item that no remove list clears", () => {
    vi.spyOn(monsterFilesService, "getCreatureRow").mockReturnValue(
      csvRow({ file: "AAA", items: [{ slot: "weapon1", file: "P1-4" }, { slot: "lring", file: "RING95" }] }),
    );
    const cre = creatureWith({ files: [{ name: "AAA" }], level1: 3, itemsRemove: ["RING95"] });
    expect(creatureService.findPersistingItems(cre)).toEqual([
      { file: "AAA", game: undefined, detail: "AAA (P1-4 weapon1)" },
    ]);
  });

  it("treats an adjustment's remove list as clearing items for that adjustment's files only", () => {
    vi.spyOn(monsterFilesService, "getCreatureRow").mockReturnValue(
      csvRow({ file: "AAA", items: [{ slot: "weapon1", file: "P1-4" }] }),
    );
    const cre = creatureWith({
      files: [{ name: "AAA" }],
      level1: 3,
      adjustments: [{ files: ["AAA"], itemsRemove: ["P1-4"] }],
    });
    expect(creatureService.findPersistingItems(cre)).toEqual([]);
  });

  it("still reports an item that is only re-equipped, never removed", () => {
    // re-equip is modelled elsewhere; the finder only inspects `remove`
    vi.spyOn(monsterFilesService, "getCreatureRow").mockReturnValue(
      csvRow({ file: "AAA", items: [{ slot: "weapon1", file: "P1-4" }] }),
    );
    const cre = creatureWith({ files: [{ name: "AAA" }], level1: 3, itemsRemove: [] });
    expect(creatureService.findPersistingItems(cre)).toHaveLength(1);
  });

  it("skips files with no csv row", () => {
    vi.spyOn(monsterFilesService, "getCreatureRow").mockReturnValue(undefined);
    const cre = creatureWith({ files: [{ name: "AAA" }], level1: 3 });
    expect(creatureService.findPersistingItems(cre)).toEqual([]);
  });
});

describe("creatureService.findLevelGaps", () => {
  afterEach(() => vi.restoreAllMocks());

  it("reports a gap greater than 2 against the base level1", () => {
    vi.spyOn(monsterFilesService, "getCreatureRow").mockReturnValue(csvRow({ file: "AAA", level: 6 }));
    const cre = creatureWith({ files: [{ name: "AAA" }], level1: 10 });
    expect(creatureService.findLevelGaps(cre)).toEqual([
      { file: "AAA", game: undefined, detail: "AAA (csv 6 / def 10)" },
    ]);
  });

  it("does not report a gap of exactly 2", () => {
    vi.spyOn(monsterFilesService, "getCreatureRow").mockReturnValue(csvRow({ file: "AAA", level: 8 }));
    expect(creatureService.findLevelGaps(creatureWith({ files: [{ name: "AAA" }], level1: 10 }))).toEqual([]);
  });

  it("uses the last adjustment that sets level1 for the file", () => {
    vi.spyOn(monsterFilesService, "getCreatureRow").mockReturnValue(csvRow({ file: "AAA", level: 6 }));
    const cre = creatureWith({
      files: [{ name: "AAA" }],
      level1: 10,
      adjustments: [
        { files: ["AAA"] },              // no level1 - ignored
        { files: ["AAA"], level1: 7 },   // wins
      ],
    });
    expect(creatureService.findLevelGaps(cre)).toEqual([]); // |6-7| = 1
  });

  it("skips a file whose csv level is blank", () => {
    vi.spyOn(monsterFilesService, "getCreatureRow").mockReturnValue(csvRow({ file: "AAA", level: undefined }));
    expect(creatureService.findLevelGaps(creatureWith({ files: [{ name: "AAA" }], level1: 10 }))).toEqual([]);
  });
});

describe("creatureService.findOriginalScripts", () => {
  afterEach(() => vi.restoreAllMocks());

  it("reports scripts that are neither None, in script.remove, nor generic", () => {
    vi.spyOn(monsterFilesService, "getCreatureRow").mockReturnValue(
      csvRow({
        file: "AAA",
        scripts: [
          { slot: "overrideScript", value: "0X1DG" },
          { slot: "classScript", value: "None" },
          { slot: "defaultScript", value: "WTASIGHT" }, // in genericScriptsToRemove
        ],
      }),
    );
    const cre = creatureWith({ files: [{ name: "AAA" }], level1: 3 });
    expect(creatureService.findOriginalScripts(cre)).toEqual([
      { file: "AAA", game: undefined, detail: "AAA (overrideScript=0X1DG)" },
    ]);
  });

  it("is cleared when the script is listed in data.script.remove (case-insensitive)", () => {
    vi.spyOn(monsterFilesService, "getCreatureRow").mockReturnValue(
      csvRow({ file: "AAA", scripts: [{ slot: "overrideScript", value: "0x1dg" }] }),
    );
    const cre = creatureWith({ files: [{ name: "AAA" }], level1: 3, scriptRemove: ["0X1DG"] });
    expect(creatureService.findOriginalScripts(cre)).toEqual([]);
  });

  it("is cleared by an adjustment's script.remove for that adjustment's files", () => {
    vi.spyOn(monsterFilesService, "getCreatureRow").mockReturnValue(
      csvRow({ file: "AAA", scripts: [{ slot: "overrideScript", value: "0X1DG" }] }),
    );
    const cre = creatureWith({
      files: [{ name: "AAA" }],
      level1: 3,
      adjustments: [{ files: ["AAA"], scriptRemove: ["0X1DG"] }],
    });
    expect(creatureService.findOriginalScripts(cre)).toEqual([]);
  });
});
```

Check `WTASIGHT` is actually in `GLOBAL_CONFIG.tpaConstants.genericScriptsToRemove` (`grep -n WTASIGHT lib/config/generate.ts`). If not, substitute a value that IS in that array (e.g. `DW2MC2MO`) in the test.

- [ ] **Step 2: Run the tests, verify they fail**

Run: `npx vitest run lib/src/services/creature.service.test.ts`
Expected: FAIL — `creatureService.findPersistingItems is not a function`, etc.

- [ ] **Step 3: Implement**

In `lib/src/services/creature.service.ts`:

Add imports near the top:
```ts
import { GLOBAL_CONFIG } from "../../config/generate";
import { Game } from "../model/creature/game";
```
(`CreatureAdjustment` is already imported.)

Add a module-level constant after the imports:
```ts
const GENERIC_SCRIPTS_REMOVED = new Set(
  GLOBAL_CONFIG.tpaConstants.genericScriptsToRemove.map((s) => s.toUpperCase()),
);
```

Add the finding type near the top of the file (after the existing `type` declarations):
```ts
export interface CsvFinding {
  file: string;
  game?: Game;
  detail: string;
}
```

Add these methods to the `CreatureService` class:
```ts
private adjustmentsForFile(creature: Creature, file: string): CreatureAdjustment[] {
  const upper = file.toUpperCase();
  return creature.adjustments.filter((a) => a.files.some((f) => f.toUpperCase() === upper));
}

findPersistingItems(creature: Creature): CsvFinding[] {
  const findings: CsvFinding[] = [];
  for (const f of creature.files) {
    const row = monsterFilesService.getCreatureRow(f.name, f.game);
    if (!row) continue;
    const removed = new Set(
      [
        ...creature.data.items.remove,
        ...this.adjustmentsForFile(creature, f.name).flatMap((a) => a.data.items.remove),
      ].map((r) => r.toUpperCase()),
    );
    const persisting = row.items.filter((it) => !removed.has(it.file.toUpperCase()));
    if (persisting.length) {
      findings.push({
        file: f.name,
        game: f.game,
        detail: `${f.name} (${persisting.map((it) => `${it.file} ${it.slot}`).join(", ")})`,
      });
    }
  }
  return findings;
}

findLevelGaps(creature: Creature): CsvFinding[] {
  const findings: CsvFinding[] = [];
  for (const f of creature.files) {
    const row = monsterFilesService.getCreatureRow(f.name, f.game);
    if (!row || row.level === undefined) continue;
    let level = creature.data.level1.pnpValue;
    for (const a of this.adjustmentsForFile(creature, f.name)) {
      if (a.data.level1 !== undefined) level = a.data.level1.pnpValue;
    }
    if (Math.abs(row.level - level) > 2) {
      findings.push({
        file: f.name,
        game: f.game,
        detail: `${f.name} (csv ${row.level} / def ${level})`,
      });
    }
  }
  return findings;
}

findOriginalScripts(creature: Creature): CsvFinding[] {
  const findings: CsvFinding[] = [];
  for (const f of creature.files) {
    const row = monsterFilesService.getCreatureRow(f.name, f.game);
    if (!row) continue;
    const removed = new Set(
      [
        ...creature.data.script.remove,
        ...this.adjustmentsForFile(creature, f.name).flatMap((a) => a.data.script.remove),
      ].map((s) => s.toUpperCase()),
    );
    const kept = row.scripts.filter((s) => {
      const v = s.value.toUpperCase();
      return v !== "NONE" && !removed.has(v) && !GENERIC_SCRIPTS_REMOVED.has(v);
    });
    if (kept.length) {
      findings.push({
        file: f.name,
        game: f.game,
        detail: `${f.name} (${kept.map((s) => `${s.slot}=${s.value}`).join(", ")})`,
      });
    }
  }
  return findings;
}
```

Note on `adjustmentsForFile` reuse: `findLevelGaps` must preserve `creature.adjustments` order for "last writer wins" — `Array.prototype.filter` preserves order, so iterating `this.adjustmentsForFile(...)` is correct.

- [ ] **Step 4: Run the tests, verify they pass**

Run: `npx vitest run lib/src/services/creature.service.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/creature.service.ts lib/src/services/creature.service.test.ts
git commit -m "feat: creature-vs-csv finder methods (items, level, scripts)

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 3: `checkAgainstCsv` + wire into `validate()`

**Files:**
- Modify: `lib/src/services/creature.service.ts`
- Modify: `lib/src/factories/creature.factory.ts:199` (after `creatureService.checkWeapons(creature);`)
- Test: `lib/src/services/creature.service.test.ts`

**Interfaces:**
- Consumes: `findPersistingItems` / `findLevelGaps` / `findOriginalScripts` / `CsvFinding` (Task 2); existing `logService`, `translationService`, `monsterFilesService`.
- Produces: `creatureService.checkAgainstCsv(creature: Creature): void`.

- [ ] **Step 1: Write the failing tests**

Add to `lib/src/services/creature.service.test.ts`:

```ts
describe("creatureService.checkAgainstCsv", () => {
  afterEach(() => vi.restoreAllMocks());

  it("emits one aggregated warn line for unacknowledged persisting items", () => {
    vi.spyOn(monsterFilesService, "getCreatureRow").mockReturnValue(
      csvRow({ file: "AAA", items: [{ slot: "weapon1", file: "P1-4" }] }),
    );
    vi.spyOn(translationService, "from").mockReturnValue("Test Creature");
    const warn = vi.spyOn(logService, "warn").mockImplementation(() => undefined);

    creatureService.checkAgainstCsv(creatureWith({ files: [{ name: "AAA" }], level1: 3 }));

    expect(warn).toHaveBeenCalledWith("Test Creature: unremoved source items — AAA (P1-4 weapon1)");
  });

  it("suppresses a file whose row has ValidatedItems=true", () => {
    vi.spyOn(monsterFilesService, "getCreatureRow").mockReturnValue(
      csvRow({ file: "AAA", items: [{ slot: "weapon1", file: "P1-4" }], validatedItems: true }),
    );
    const warn = vi.spyOn(logService, "warn").mockImplementation(() => undefined);

    creatureService.checkAgainstCsv(creatureWith({ files: [{ name: "AAA" }], level1: 3 }));

    expect(warn).not.toHaveBeenCalled();
  });

  it("routes the script finding through logService.info", () => {
    vi.spyOn(monsterFilesService, "getCreatureRow").mockReturnValue(
      csvRow({ file: "AAA", scripts: [{ slot: "overrideScript", value: "0X1DG" }] }),
    );
    vi.spyOn(translationService, "from").mockReturnValue("Test Creature");
    const info = vi.spyOn(logService, "info").mockImplementation(() => undefined);

    creatureService.checkAgainstCsv(creatureWith({ files: [{ name: "AAA" }], level1: 3 }));

    expect(info).toHaveBeenCalledWith("Test Creature: original scripts retained — AAA (overrideScript=0X1DG)");
  });
});
```

`translationService` and `logService` are already imported in this test file.

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run lib/src/services/creature.service.test.ts`
Expected: FAIL — `creatureService.checkAgainstCsv is not a function`.

- [ ] **Step 3: Implement**

In `lib/src/services/creature.service.ts`, add to the class:

```ts
checkAgainstCsv(creature: Creature): void {
  this.reportCsvFinding(
    creature, this.findPersistingItems(creature),
    "validatedItems", "warn", "unremoved source items",
  );
  this.reportCsvFinding(
    creature, this.findLevelGaps(creature),
    "validatedLevel", "warn", "level gap > 2 vs creatures.csv",
  );
  this.reportCsvFinding(
    creature, this.findOriginalScripts(creature),
    "validatedScript", "info", "original scripts retained",
  );
}

private reportCsvFinding(
  creature: Creature,
  findings: CsvFinding[],
  column: "validatedItems" | "validatedLevel" | "validatedScript",
  level: "warn" | "info",
  label: string,
): void {
  const shown = findings.filter(
    (f) => !monsterFilesService.getCreatureRow(f.file, f.game)?.[column],
  );
  if (!shown.length) return;
  const name = translationService.from(creature.name);
  logService[level](`${name}: ${label} — ${shown.map((f) => f.detail).join("; ")}`);
}
```

In `lib/src/factories/creature.factory.ts`, `validate()`, immediately after `creatureService.checkWeapons(creature);`:

```ts
creatureService.checkAgainstCsv(creature);
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run lib/src/services/creature.service.test.ts lib/src/factories/creature.factory.test.ts`
Expected: PASS. (The factory test may now emit extra log lines during its `validate()` runs — that is fine; only assert it still passes.)

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/creature.service.ts lib/src/services/creature.service.test.ts lib/src/factories/creature.factory.ts
git commit -m "feat: run creatures.csv consistency checks during validate()

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 4: carry the three columns through a full `creatures.csv` rebuild

**Files:**
- Modify: `scripts/lib/build-creatures.ts` (`CARRIED_COLUMNS`, `MonsterIds`, `EMPTY_IDS`, `indexMonsterIds`, `attachCarriedColumns`)
- Test: `scripts/lib/build-creatures.test.ts`

**Interfaces:**
- Consumes: nothing new.
- Produces: `CARRIED_COLUMNS` gains `"ValidatedLevel"`, `"ValidatedItems"`, `"ValidatedScript"`; `MonsterIds` gains the three same-named `string` fields; `attachCarriedColumns` writes them onto every row.

- [ ] **Step 1: Update the existing tests + add a carry test**

In `scripts/lib/build-creatures.test.ts`:

Change `OLD_HEADER` (line ~31) to include the new columns so `oldRow(..., extra)` can inject them:
```ts
const OLD_HEADER =
  "file;general;race;class;anim;deathvar;dialog;origin;level;sex;allegiance;name;summon;" +
  "MonsterId;ValidatedMonsterId;ValidatedLevel;ValidatedItems;ValidatedScript";
```

Update the `buildCreatures` outputHeader assertion (line ~241):
```ts
it("outputs the bg schema plus the carried columns, with name last", () => {
  const bgWithoutName = BG_HEADER.split(";").filter((c) => c !== "name");
  expect(result.outputHeader).toEqual([
    ...bgWithoutName,
    "summon",
    "MonsterId",
    "ValidatedMonsterId",
    "ValidatedLevel",
    "ValidatedItems",
    "ValidatedScript",
    "name",
  ]);
});
```

Add a new test in the `attachCarriedColumns` describe block:
```ts
it("carries the three Validated* review flags from the old csv by file", () => {
  const { byFile } = indexMonsterIds(
    parseCsv(
      [
        OLD_HEADER,
        oldRow("ABELA", "Nymph", "true", {
          ValidatedLevel: "true",
          ValidatedItems: "",
          ValidatedScript: "true",
        }),
        "",
      ].join("\r\n"),
    ).rows,
  );
  const rows = parseCsv([BG_HEADER, bgRow("ABELA"), bgRow("MISSING"), ""].join("\r\n")).rows;
  const out = attachCarriedColumns(rows, byFile);
  expect(out[0]).toMatchObject({
    ValidatedLevel: "true",
    ValidatedItems: "",
    ValidatedScript: "true",
  });
  expect(out[1]).toMatchObject({
    ValidatedLevel: "",
    ValidatedItems: "",
    ValidatedScript: "",
  });
});
```

- [ ] **Step 2: Run, verify the updated/new tests fail**

Run: `npx vitest run scripts/lib/build-creatures.test.ts`
Expected: FAIL — outputHeader mismatch; `out[0].ValidatedLevel` is `undefined`.

- [ ] **Step 3: Implement**

In `scripts/lib/build-creatures.ts`:

```ts
export interface MonsterIds {
  MonsterId: string;
  ValidatedMonsterId: string;
  ValidatedLevel: string;
  ValidatedItems: string;
  ValidatedScript: string;
}
```

```ts
export const CARRIED_COLUMNS = [
  "summon",
  "MonsterId",
  "ValidatedMonsterId",
  "ValidatedLevel",
  "ValidatedItems",
  "ValidatedScript",
];
const EMPTY_IDS: MonsterIds = {
  MonsterId: "",
  ValidatedMonsterId: "",
  ValidatedLevel: "",
  ValidatedItems: "",
  ValidatedScript: "",
};
```

In `indexMonsterIds`, build the full object:
```ts
const ids: MonsterIds = {
  MonsterId: row.MonsterId,
  ValidatedMonsterId: row.ValidatedMonsterId,
  ValidatedLevel: row.ValidatedLevel ?? "",
  ValidatedItems: row.ValidatedItems ?? "",
  ValidatedScript: row.ValidatedScript ?? "",
};
```

In `attachCarriedColumns`, spread the carried flags:
```ts
return rows.map((row) => {
  const ids = monsterIds.get(row.file) ?? EMPTY_IDS;
  return {
    ...row,
    MonsterId: ids.MonsterId,
    ValidatedMonsterId: ids.ValidatedMonsterId,
    ValidatedLevel: ids.ValidatedLevel,
    ValidatedItems: ids.ValidatedItems,
    ValidatedScript: ids.ValidatedScript,
    summon: computeSummon(row),
  };
});
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run scripts/lib/build-creatures.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/build-creatures.ts scripts/lib/build-creatures.test.ts
git commit -m "feat: carry Validated* review flags through creatures.csv rebuild

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 5: baseline one-shot script

**Files:**
- Create: `scripts/lib/validation-columns.ts`
- Create: `scripts/lib/validation-columns.test.ts`
- Create: `scripts/build-validation-columns.ts`

**Interfaces:**
- Consumes: `parseCsv`, `serializeCsv`, `withNameLast` from `./lib/build-creatures`; `familyFactories` from `../lib/creatures`; `creatureService` + `monsterFilesService` + `CreatureCsvRow` from `../lib/src/...`; `Creature` type.
- Produces:
  ```ts
  export const VALIDATION_COLUMNS: readonly ["ValidatedLevel","ValidatedItems","ValidatedScript"];
  export type ValidationColumn = (typeof VALIDATION_COLUMNS)[number];
  export function rowKey(file: string, game: string | undefined): string;
  export function insertValidationColumns(header: string[]): string[];
  export function applyValidationColumns(input: {
    header: string[];
    rows: Record<string, string>[];
    findingKeys: Record<ValidationColumn, Set<string>>;
    ownedKeys: Set<string>;
  }): { header: string[]; rows: Record<string, string>[] };
  ```

- [ ] **Step 1: Write the failing tests**

Create `scripts/lib/validation-columns.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  applyValidationColumns,
  insertValidationColumns,
  rowKey,
  VALIDATION_COLUMNS,
  type ValidationColumn,
} from "./validation-columns";

const emptyFindingKeys = (): Record<ValidationColumn, Set<string>> => ({
  ValidatedLevel: new Set(),
  ValidatedItems: new Set(),
  ValidatedScript: new Set(),
});

describe("insertValidationColumns", () => {
  it("inserts the three columns right after ValidatedMonsterId", () => {
    expect(insertValidationColumns(["file", "MonsterId", "ValidatedMonsterId", "game", "name"])).toEqual([
      "file", "MonsterId", "ValidatedMonsterId",
      "ValidatedLevel", "ValidatedItems", "ValidatedScript",
      "game", "name",
    ]);
  });

  it("is a no-op when the columns are already present", () => {
    const header = ["file", "ValidatedMonsterId", "ValidatedLevel", "ValidatedItems", "ValidatedScript", "name"];
    expect(insertValidationColumns(header)).toEqual(header);
  });
});

describe("applyValidationColumns", () => {
  const run = (
    row: Record<string, string>,
    findingKeys: Record<ValidationColumn, Set<string>>,
    ownedKeys: Set<string>,
  ) =>
    applyValidationColumns({
      header: ["file", "ValidatedMonsterId", "game", "name"],
      rows: [row],
      findingKeys,
      ownedKeys,
    }).rows[0];

  it("keeps an existing 'true' even when a finding now exists", () => {
    const key = rowKey("AAA", "");
    const fk = emptyFindingKeys();
    fk.ValidatedLevel.add(key);
    const out = run({ file: "AAA", game: "", ValidatedLevel: "true" }, fk, new Set([key]));
    expect(out.ValidatedLevel).toBe("true");
  });

  it("sets 'true' for an owned row with no finding", () => {
    const key = rowKey("AAA", "");
    const out = run({ file: "AAA", game: "" }, emptyFindingKeys(), new Set([key]));
    expect(out.ValidatedLevel).toBe("true");
    expect(out.ValidatedItems).toBe("true");
    expect(out.ValidatedScript).toBe("true");
  });

  it("leaves blank an owned row that has a finding", () => {
    const key = rowKey("AAA", "");
    const fk = emptyFindingKeys();
    fk.ValidatedItems.add(key);
    const out = run({ file: "AAA", game: "" }, fk, new Set([key]));
    expect(out.ValidatedItems).toBe("");
    expect(out.ValidatedLevel).toBe("true"); // other checks unaffected
  });

  it("leaves blank a row no built creature references", () => {
    const out = run({ file: "ORPHAN", game: "" }, emptyFindingKeys(), new Set());
    expect(out.ValidatedLevel).toBe("");
  });

  it("matches keys per game variant", () => {
    const out = applyValidationColumns({
      header: ["file", "ValidatedMonsterId", "game", "name"],
      rows: [
        { file: "GORF", game: "bg1" },
        { file: "GORF", game: "bg2" },
      ],
      findingKeys: (() => {
        const fk = emptyFindingKeys();
        fk.ValidatedLevel.add(rowKey("GORF", "bg2"));
        return fk;
      })(),
      ownedKeys: new Set([rowKey("GORF", "bg1"), rowKey("GORF", "bg2")]),
    }).rows;
    expect(out[0].ValidatedLevel).toBe("true"); // bg1 - no finding
    expect(out[1].ValidatedLevel).toBe("");     // bg2 - finding
  });
});
```

Create `scripts/lib/validation-columns.ts` with just enough to make imports resolve but wrong behavior:
```ts
export const VALIDATION_COLUMNS = ["ValidatedLevel", "ValidatedItems", "ValidatedScript"] as const;
export type ValidationColumn = (typeof VALIDATION_COLUMNS)[number];
export function rowKey(): string { return ""; }
export function insertValidationColumns(h: string[]): string[] { return h; }
export function applyValidationColumns(i: {
  header: string[]; rows: Record<string, string>[];
  findingKeys: Record<ValidationColumn, Set<string>>; ownedKeys: Set<string>;
}): { header: string[]; rows: Record<string, string>[] } {
  return { header: i.header, rows: i.rows };
}
```

- [ ] **Step 2: Run, verify fail**

Run: `npx vitest run scripts/lib/validation-columns.test.ts`
Expected: FAIL — assertions mismatch.

- [ ] **Step 3: Implement `scripts/lib/validation-columns.ts`**

```ts
export const VALIDATION_COLUMNS = ["ValidatedLevel", "ValidatedItems", "ValidatedScript"] as const;
export type ValidationColumn = (typeof VALIDATION_COLUMNS)[number];

/** `${UPPERCASE_FILE}|${game}` where game is "" | "bg1" | "bg2". */
export function rowKey(file: string, game: string | undefined): string {
  return `${file.toUpperCase()}|${game ?? ""}`;
}

/** Insert the three columns right after ValidatedMonsterId, skipping any already present. */
export function insertValidationColumns(header: string[]): string[] {
  const out = [...header];
  const anchor = out.indexOf("ValidatedMonsterId");
  let at = anchor === -1 ? out.length : anchor + 1;
  for (const col of VALIDATION_COLUMNS) {
    if (out.includes(col)) continue;
    out.splice(at, 0, col);
    at++;
  }
  return out;
}

export function applyValidationColumns(input: {
  header: string[];
  rows: Record<string, string>[];
  findingKeys: Record<ValidationColumn, Set<string>>;
  ownedKeys: Set<string>;
}): { header: string[]; rows: Record<string, string>[] } {
  const header = insertValidationColumns(input.header);
  const rows = input.rows.map((row) => {
    const key = rowKey(row.file, row.game);
    const owned = input.ownedKeys.has(key);
    const next: Record<string, string> = { ...row };
    for (const col of VALIDATION_COLUMNS) {
      const current = row[col] ?? "";
      next[col] =
        current === "true" || (owned && !input.findingKeys[col].has(key)) ? "true" : "";
    }
    return next;
  });
  return { header, rows };
}
```

- [ ] **Step 4: Run, verify pass**

Run: `npx vitest run scripts/lib/validation-columns.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the one-shot script**

Create `scripts/build-validation-columns.ts`:

```ts
import * as fs from "fs";
import * as path from "path";
import { familyFactories } from "../lib/creatures";
import type { Creature } from "../lib/src/model/creature/creature";
import creatureService, { type CsvFinding } from "../lib/src/services/creature.service";
import monsterFilesService from "../lib/src/services/monster-files.service";
import { parseCsv, serializeCsv, withNameLast } from "./lib/build-creatures";
import {
  applyValidationColumns,
  rowKey,
  VALIDATION_COLUMNS,
  type ValidationColumn,
} from "./lib/validation-columns";

// One-shot: fills assets/creatures.csv's ValidatedLevel / ValidatedItems / ValidatedScript from a
// baseline of the CURRENT state. For every source row a built creature references: `true` when
// that check produces no finding for the row, blank when it does. Rows no built creature
// references stay blank. An existing `true` is never downgraded. Safe to re-run.
//
// Always operates on ./assets/creatures.csv relative to the repo root (that path is also what the
// generator's monsterFilesService reads). Run from the repo root:
//   ts-node scripts/build-validation-columns.ts

const CSV_PATH = path.join(process.cwd(), "assets", "creatures.csv");

const FINDERS: { col: ValidationColumn; find: (c: Creature) => CsvFinding[] }[] = [
  { col: "ValidatedLevel", find: (c) => creatureService.findLevelGaps(c) },
  { col: "ValidatedItems", find: (c) => creatureService.findPersistingItems(c) },
  { col: "ValidatedScript", find: (c) => creatureService.findOriginalScripts(c) },
];

const csv = parseCsv(fs.readFileSync(CSV_PATH, "utf-8"));
const creatures = familyFactories.flatMap((factory) => factory().creatures);

const ownedKeys = new Set<string>();
const findingKeys: Record<ValidationColumn, Set<string>> = {
  ValidatedLevel: new Set(),
  ValidatedItems: new Set(),
  ValidatedScript: new Set(),
};

for (const creature of creatures) {
  for (const f of creature.files) {
    const row = monsterFilesService.getCreatureRow(f.name, f.game);
    if (row) ownedKeys.add(rowKey(row.file, row.game));
  }
  for (const { col, find } of FINDERS) {
    for (const finding of find(creature)) {
      const row = monsterFilesService.getCreatureRow(finding.file, finding.game);
      if (row) findingKeys[col].add(rowKey(row.file, row.game));
    }
  }
}

const { header, rows } = applyValidationColumns({
  header: csv.header,
  rows: csv.rows,
  findingKeys,
  ownedKeys,
});

fs.writeFileSync(CSV_PATH, serializeCsv(withNameLast(header), rows), "utf-8");

for (const col of VALIDATION_COLUMNS) {
  const trueCount = rows.filter((r) => r[col] === "true").length;
  console.log(`${col}: ${trueCount} true / ${rows.length - trueCount} blank`);
}
```

Verify it type-checks and runs (do NOT commit the CSV change yet — inspect first in Task 6):

Run: `npx ts-node scripts/build-validation-columns.ts`
Expected: prints three summary lines; `git diff --stat assets/creatures.csv` shows the file changed.

Then reset the data change so Task 6 owns it as a reviewed commit:
```bash
git checkout -- assets/creatures.csv
```

- [ ] **Step 6: Commit the code (not the data)**

```bash
git add scripts/lib/validation-columns.ts scripts/lib/validation-columns.test.ts scripts/build-validation-columns.ts
git commit -m "feat: build-validation-columns one-shot baseline script

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Task 6: run the baseline, review, commit the CSV

**Files:**
- Modify: `assets/creatures.csv` (generated)

- [ ] **Step 1: Full test suite + lint are green**

Run: `npx vitest run`
Expected: PASS (all files).

Run: `npm run lint`
Expected: no errors.

- [ ] **Step 2: Run the baseline script**

Run: `npx ts-node scripts/build-validation-columns.ts`
Expected: three summary lines printed.

- [ ] **Step 3: Sanity-check the diff**

Run: `git diff assets/creatures.csv | head -40`
Expected:
- The header line gained `;ValidatedLevel;ValidatedItems;ValidatedScript` immediately after `ValidatedMonsterId`.
- Every data row gained three fields in that position: some `true`, some empty.
- `name` is still the last column; line endings unchanged (CRLF).

Run a spot check that a known-clean creature got `true` and a known-noisy one stayed blank:
```bash
grep -m1 '^ABELA;' assets/creatures.csv
```
(Confirm the three new fields are `;true;true;true` or a mix consistent with `generator.log`.)

- [ ] **Step 4: Confirm the generator log now carries the new lines**

Run: `npm run check-monsters` (builds every family through `validate()`; read-only)
Expected: exits 0. `grep -E 'unremoved source items|level gap > 2 vs creatures.csv|original scripts retained' check-monsters.log` shows the new advisory lines — and only for rows NOT marked `true` by Step 2.

- [ ] **Step 5: Commit the data**

```bash
git add assets/creatures.csv
git commit -m "chore: seed ValidatedLevel/ValidatedItems/ValidatedScript baseline

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**

| Spec section | Task |
|---|---|
| Schema change — 3 columns after `ValidatedMonsterId` | Task 4 (rebuild header) + Task 5 (`insertValidationColumns`) + Task 6 (applied to real file) |
| `CARRIED_COLUMNS` + generalised carry | Task 4 |
| `add-duplicate-columns.ts` picks new columns up for free | No code — it already iterates `CARRIED_COLUMNS`; covered by Task 4's change |
| `parseCreatureRowsCsv` / `CreatureCsvRow` / `getCreatureRow` | Task 1 |
| `SLOT_COLUMNS` / `SCRIPT_COLUMNS` / `None` kept in parse, filtered in check | Task 1 (parse) + Task 2 (`NONE` filter) |
| `findPersistingItems` (remove-only, adjustment union) | Task 2 |
| `findLevelGaps` (last-adjustment-with-level, `>2`, blank skip) | Task 2 |
| `findOriginalScripts` (remove ∪ generic, `None`/blank skip) | Task 2 |
| `checkAgainstCsv` + `reportCsvFinding` (per-row suppression, one line/creature, warn vs info) | Task 3 |
| `creature.factory.ts` one-line wiring after `checkWeapons` | Task 3 |
| Baseline script (setup, owned rows, never-downgrade, orphan blank) | Task 5 + Task 6 |
| Tests enumerated in the spec's Testing section | Tasks 1–5 steps 1 |

**Placeholder scan:** no TBD/TODO; every code step has the literal code. Test fixtures that depend on live data (`getCreatureRow("abela")`, `WTASIGHT` membership) carry an explicit fallback instruction.

**Type consistency:**
- `CsvFinding { file: string; game?: Game; detail: string }` — defined Task 2, consumed Task 3 (`f.detail`, `f.file`, `f.game`) and Task 5 (`finding.file`, `finding.game`). ✓
- `getCreatureRow(file, game)` signature identical in Tasks 1, 2, 3, 5. ✓
- `CreatureCsvRow` property names (`validatedItems` / `validatedLevel` / `validatedScript`, `items[].file`, `items[].slot`, `scripts[].value`, `scripts[].slot`) used consistently in `reportCsvFinding`'s `column` union and the finders. ✓
- `MonsterIds` new fields (`ValidatedLevel` etc.) match `CARRIED_COLUMNS` strings and `attachCarriedColumns` keys. ✓
- `VALIDATION_COLUMNS` values (`"ValidatedLevel"`, `"ValidatedItems"`, `"ValidatedScript"`) match `findingKeys` record keys and the CSV header strings. ✓
- `rowKey(file, game)` — `game` typed `string | undefined`; callers pass `row.game` (`Game | undefined` from `CreatureCsvRow`, or `string` from raw `parseCsv` rows). Both accepted. ✓
