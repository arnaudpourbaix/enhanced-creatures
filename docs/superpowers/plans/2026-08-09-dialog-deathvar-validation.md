# Dialog / deathVar CSV Validation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a creature's `behavior.dialog` (TS) is non-empty, fail creature validation unless `generator/assets/creatures.csv` has at least one validated row for that creature whose `deathvar` equals its own `dialog` column.

**Architecture:** A new CSV parser (`parseMonsterDialogCsv`) and cached lookup method (`monsterFilesService.getDialogRows`) expose `{file, deathvar, dialog}` rows per `MonsterId`, restricted to `ValidatedMonsterId === "true"` rows (mirrors the existing `parseMonsterFilesCsv`/`getFiles` pattern exactly). A new `creatureService.checkDialog()` consumes that lookup and is wired into `creatureFactory.validate()`, where its boolean result is folded into `creature.valid`.

**Tech Stack:** TypeScript, Vitest.

## Global Constraints

- CSV column names are exactly `deathvar` and `dialog` (lowercase), from
  `generator/assets/creatures.csv`'s header row.
- Lookup is scoped to rows where `ValidatedMonsterId === "true"` and `MonsterId` is non-empty —
  same restriction `monsterFilesService.getFiles()` already applies.
- Rows with an empty `deathvar` are discarded before checking (never counted as pass or fail on
  their own).
- A creature with empty `behavior.dialog` is unaffected — `checkDialog` returns `true`
  immediately, no CSV lookup happens.
- `checkDialog`'s boolean result is folded into `creature.valid` in `creature.factory.ts`
  (`creature.valid = valid && dialogValid`), unlike the neighboring `checkSpellAbilities`/
  `checkDuplicateAbilities` calls which only log errors.

---

### Task 1: `parseMonsterDialogCsv` + `monsterFilesService.getDialogRows`

**Files:**
- Modify: `generator/lib/src/services/monster-files.service.ts`
- Test: `generator/lib/src/services/monster-files.service.test.ts`

**Interfaces:**
- Produces: `export function parseMonsterDialogCsv(raw: string): Map<string, { file: string; deathvar: string; dialog: string }[]>`
- Produces: `monsterFilesService.getDialogRows(monster: MonsterEnum): { file: string; deathvar: string; dialog: string }[]`

- [ ] **Step 1: Write the failing tests**

Append to `generator/lib/src/services/monster-files.service.test.ts` (the file already imports
`describe`, `expect`, `it`, `MonsterEnum`, and defines `HEADER` at the top — reuse both):

```ts
import monsterFilesService, {
  parseMonsterDialogCsv,
  parseMonsterFilesCsv,
  parseUnvalidatedMonsterFilesCsv,
} from "./monster-files.service";
```

(update the existing import statement to add `parseMonsterDialogCsv`)

```ts
describe("parseMonsterDialogCsv", () => {
  it("groups deathvar/dialog rows under their MonsterId, in row order", () => {
    const csv = [
      HEADER,
      "0XAL2DG;HUMANOID;HUMAN;MAGE;MONK;0XAL2DG;0XAL2DG;TOTDG;Hooded Alchemist;Alchemist;true",
      "0XAL3DG;HUMANOID;HUMAN;MAGE;MONK;;;TOTDG;Hooded Alchemist 2;Alchemist;true",
    ].join("\n");

    const result = parseMonsterDialogCsv(csv);

    expect(result.get("Alchemist")).toEqual([
      { file: "0XAL2DG", deathvar: "0XAL2DG", dialog: "0XAL2DG" },
      { file: "0XAL3DG", deathvar: "", dialog: "" },
    ]);
  });

  it("excludes rows that aren't validated or aren't mapped to a monster", () => {
    const csv = [
      HEADER,
      "GUESS1;MONSTER;WOLF;WOLF;WOLF;guess1;guess1;BD;Wolf guess;Wolf;false",
      "BLANK1;MONSTER;WOLF;WOLF;WOLF;blank1;blank1;BD;Wolf blank;;",
    ].join("\n");

    const result = parseMonsterDialogCsv(csv);

    expect(result.has("Wolf")).toBe(false);
  });

  it("returns an empty map for a header-only CSV", () => {
    const result = parseMonsterDialogCsv(HEADER);

    expect(result.size).toBe(0);
  });
});

describe("monsterFilesService.getDialogRows", () => {
  it("returns the validated deathvar/dialog rows for a known monster", () => {
    const rows = monsterFilesService.getDialogRows(MonsterEnum.Ankheg);

    expect(rows).toEqual(
      expect.arrayContaining([{ file: "L#MIMMI", deathvar: "L#MIMMI", dialog: "L#MIMMI" }]),
    );
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd generator && npx vitest run lib/src/services/monster-files.service.test.ts`
Expected: FAIL — `parseMonsterDialogCsv` is not exported / `getDialogRows` is not a function.

- [ ] **Step 3: Implement `parseMonsterDialogCsv` and `getDialogRows`**

In `generator/lib/src/services/monster-files.service.ts`, add the two new column constants next
to the existing ones, add the parser function next to `parseMonsterFilesCsv`, and add the cached
lookup to the class:

```ts
const DEATHVAR_COLUMN = "deathvar";
const DIALOG_COLUMN = "dialog";
```

```ts
export function parseMonsterDialogCsv(
  raw: string,
): Map<string, { file: string; deathvar: string; dialog: string }[]> {
  const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
  const header = lines[0].split(";");
  const fileIdx = header.indexOf(FILE_COLUMN);
  const deathvarIdx = header.indexOf(DEATHVAR_COLUMN);
  const dialogIdx = header.indexOf(DIALOG_COLUMN);
  const monsterIdIdx = header.indexOf(MONSTER_ID_COLUMN);
  const validatedIdx = header.indexOf(VALIDATED_COLUMN);

  const result = new Map<string, { file: string; deathvar: string; dialog: string }[]>();
  for (const line of lines.slice(1)) {
    const fields = line.split(";");
    const validated = fields[validatedIdx] ?? "";
    const monsterId = fields[monsterIdIdx] ?? "";
    if (validated !== "true" || !monsterId) continue;
    const row = {
      file: fields[fileIdx] ?? "",
      deathvar: fields[deathvarIdx] ?? "",
      dialog: fields[dialogIdx] ?? "",
    };
    const existing = result.get(monsterId);
    if (existing) existing.push(row);
    else result.set(monsterId, [row]);
  }
  return result;
}
```

In `class MonsterFilesService`, add the cache field and method next to `filesByMonster`/
`getFiles`:

```ts
  private dialogRowsByMonster?: Map<string, { file: string; deathvar: string; dialog: string }[]>;
```

```ts
  getDialogRows(monster: MonsterEnum): { file: string; deathvar: string; dialog: string }[] {
    this.dialogRowsByMonster ??= parseMonsterDialogCsv(fs.readFileSync(CSV_PATH, "utf-8"));
    return this.dialogRowsByMonster.get(MonsterEnum[monster]) ?? [];
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd generator && npx vitest run lib/src/services/monster-files.service.test.ts`
Expected: PASS, all tests including the pre-existing ones.

- [ ] **Step 5: Commit**

```bash
git add generator/lib/src/services/monster-files.service.ts generator/lib/src/services/monster-files.service.test.ts
git commit -m "feat: expose deathvar/dialog rows from creatures.csv per MonsterId"
```

---

### Task 2: `creatureService.checkDialog`

**Files:**
- Modify: `generator/lib/src/services/creature.service.ts`
- Test: `generator/lib/src/services/creature.service.test.ts`

**Interfaces:**
- Consumes: `monsterFilesService.getDialogRows(monster: MonsterEnum): { file: string; deathvar: string; dialog: string }[]` (Task 1)
- Consumes: `creature.behavior.dialog: string[]`, `creature.id: MonsterEnum`, `creature.name: TranslationKey`
- Produces: `creatureService.checkDialog(creature: Creature): boolean`

- [ ] **Step 1: Write the failing tests**

Add the import at the top of `generator/lib/src/services/creature.service.test.ts` (alongside the
existing `logService` import):

```ts
import monsterFilesService from "./monster-files.service";
```

Append a fake-creature helper and the test suite at the end of the file:

```ts
function fakeDialogCreature(dialog: string[]): Creature {
  return {
    name: "test",
    id: 1,
    behavior: { dialog },
  } as unknown as Creature;
}

describe("checkDialog", () => {
  it("passes without consulting creatures.csv when behavior.dialog is empty", () => {
    const creature = fakeDialogCreature([]);
    const getRowsSpy = vi.spyOn(monsterFilesService, "getDialogRows");
    expect(creatureService.checkDialog(creature)).toBe(true);
    expect(getRowsSpy).not.toHaveBeenCalled();
    getRowsSpy.mockRestore();
  });

  it("passes when a matching row has dialog equal to deathvar", () => {
    const creature = fakeDialogCreature(["L#MIMMI"]);
    const getRowsSpy = vi
      .spyOn(monsterFilesService, "getDialogRows")
      .mockReturnValue([{ file: "L#MIMMI", deathvar: "L#MIMMI", dialog: "L#MIMMI" }]);
    expect(creatureService.checkDialog(creature)).toBe(true);
    expect(getRowsSpy).toHaveBeenCalledWith(1);
    getRowsSpy.mockRestore();
  });

  it("discards rows with an empty deathvar and still passes on a remaining valid row", () => {
    const creature = fakeDialogCreature(["L#MIMMI"]);
    vi.spyOn(monsterFilesService, "getDialogRows").mockReturnValue([
      { file: "ANKHEG01", deathvar: "", dialog: "" },
      { file: "L#MIMMI", deathvar: "L#MIMMI", dialog: "L#MIMMI" },
    ]);
    expect(creatureService.checkDialog(creature)).toBe(true);
    vi.restoreAllMocks();
  });

  it("errors and fails when every row has an empty deathvar (nothing to validate against)", () => {
    const creature = fakeDialogCreature(["L#MIMMI"]);
    vi.spyOn(monsterFilesService, "getDialogRows").mockReturnValue([
      { file: "ANKHEG01", deathvar: "", dialog: "" },
    ]);
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    expect(creatureService.checkDialog(creature)).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("no entry with a deathVar"));
    vi.restoreAllMocks();
  });

  it("errors and fails when a row's deathvar doesn't match its dialog", () => {
    const creature = fakeDialogCreature(["L#MIMMI"]);
    vi.spyOn(monsterFilesService, "getDialogRows").mockReturnValue([
      { file: "L#MIMMI", deathvar: "L#MIMMI", dialog: "WRONGDLG" },
    ]);
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    expect(creatureService.checkDialog(creature)).toBe(false);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("deathVar 'L#MIMMI'"));
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("dialog 'WRONGDLG'"));
    vi.restoreAllMocks();
  });

  it("reports every mismatched row when more than one disagrees", () => {
    const creature = fakeDialogCreature(["A", "B"]);
    vi.spyOn(monsterFilesService, "getDialogRows").mockReturnValue([
      { file: "F1", deathvar: "A", dialog: "WRONG1" },
      { file: "F2", deathvar: "B", dialog: "WRONG2" },
    ]);
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    expect(creatureService.checkDialog(creature)).toBe(false);
    expect(errorSpy).toHaveBeenCalledTimes(2);
    vi.restoreAllMocks();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `cd generator && npx vitest run lib/src/services/creature.service.test.ts`
Expected: FAIL — `creatureService.checkDialog` is not a function.

- [ ] **Step 3: Implement `checkDialog`**

Add the import at the top of `generator/lib/src/services/creature.service.ts` (alongside the
existing `spellService` import):

```ts
import monsterFilesService from "./monster-files.service";
```

Add the method to `class CreatureService`, next to `checkDuplicateAbilities`:

```ts
  checkDialog(creature: Creature): boolean {
    if (!creature.behavior.dialog.length) return true;
    const rows = monsterFilesService.getDialogRows(creature.id).filter((r) => r.deathvar);
    if (!rows.length) {
      logService.error(
        `${translationService.from(creature.name)}: behavior defines dialog but ` +
          `creatures.csv has no entry with a deathVar for this creature.`,
      );
      return false;
    }
    let ok = true;
    for (const row of rows) {
      if (row.dialog !== row.deathvar) {
        logService.error(
          `${translationService.from(creature.name)}: creatures.csv entry '${row.file}' has ` +
            `deathVar '${row.deathvar}' that doesn't match its dialog '${row.dialog}'.`,
        );
        ok = false;
      }
    }
    return ok;
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `cd generator && npx vitest run lib/src/services/creature.service.test.ts`
Expected: PASS, all tests including the pre-existing ones.

- [ ] **Step 5: Commit**

```bash
git add generator/lib/src/services/creature.service.ts generator/lib/src/services/creature.service.test.ts
git commit -m "feat: validate a creature's dialog against creatures.csv deathVar"
```

---

### Task 3: Wire `checkDialog` into `creatureFactory.validate()`

**Files:**
- Modify: `generator/lib/src/factories/creature.factory.ts:151-197` (the `validate()` method)
- Test: `generator/lib/src/factories/creature.factory.test.ts`

**Interfaces:**
- Consumes: `creatureService.checkDialog(creature: Creature): boolean` (Task 2)

- [ ] **Step 1: Write the failing test**

Update the import block at the top of `generator/lib/src/factories/creature.factory.test.ts`:

```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { Creature } from "../model/creature/creature";
import { EquippedItem } from "../model/creature/item";
import { MainCreatureData } from "../model/creature/data";
import { Item } from "../model/spell-item/spell-item";
import { PartialCreatureAdjustment } from "../model/creature/adjustment";
import { MonsterFamilyEnum } from "../../creatures/monster";
import creatureFactory from "./creature.factory";
import logService from "../services/log.service";
import abilityOrderService from "../services/baf/ability-order.service";
import creatureService from "../services/creature.service";
import immunityService from "../services/effects/immunity.service";
import descriptionService from "../services/doc/description.service";
import { State } from "../state";
```

(this adds `MonsterFamilyEnum`, `creatureService`, `immunityService`, `descriptionService`,
`State` to the existing import list — everything else stays as-is)

Append at the end of the file:

```ts
describe("validate", () => {
  afterEach(() => {
    State.creatures.length = 0;
  });

  it("marks the creature invalid when checkDialog fails, even though every other check passes", () => {
    const creature = fakeCreature();
    creature.family = MonsterFamilyEnum.Ankheg;
    creature.files = ["TESTCRE"];
    creature.name = PLACEHOLDER_NAME_KEY;

    vi.spyOn(creatureService, "check").mockImplementation(() => {});
    vi.spyOn(creatureFactory, "resolveAbilities").mockImplementation(() => {});
    vi.spyOn(creatureService, "checkSpellAbilities").mockImplementation(() => {});
    vi.spyOn(creatureService, "checkDuplicateAbilities").mockImplementation(() => {});
    vi.spyOn(creatureService, "checkDialog").mockReturnValue(false);
    vi.spyOn(immunityService, "handleImmunities").mockImplementation(() => {});

    creatureFactory.validate(creature, MonsterFamilyEnum.Ankheg);

    expect(creature.valid).toBe(false);
  });

  it("keeps the creature valid when checkDialog passes and every other check passes", () => {
    const creature = fakeCreature();
    creature.family = MonsterFamilyEnum.Ankheg;
    creature.files = ["TESTCRE2"];
    creature.name = PLACEHOLDER_NAME_KEY;

    vi.spyOn(creatureService, "check").mockImplementation(() => {});
    vi.spyOn(creatureFactory, "resolveAbilities").mockImplementation(() => {});
    vi.spyOn(creatureService, "checkSpellAbilities").mockImplementation(() => {});
    vi.spyOn(creatureService, "checkDuplicateAbilities").mockImplementation(() => {});
    vi.spyOn(creatureService, "checkDialog").mockReturnValue(true);
    vi.spyOn(immunityService, "handleImmunities").mockImplementation(() => {});

    creatureFactory.validate(creature, MonsterFamilyEnum.Ankheg);

    expect(creature.valid).toBe(true);
  });
});
```

`checkWeapons`, `generateCreatureSpells`, and `generateCreatureItems` are deliberately left
unmocked: `fakeCreature()` gives the creature empty `items`/`spells` arrays, and all three
functions simply loop over their input array, so they're no-ops here — matching how
`checkWeapons`'s own tests already exercise it directly rather than needing a stub.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd generator && npx vitest run lib/src/factories/creature.factory.test.ts`
Expected: FAIL on the first new test — `creature.valid` is `true` (or the file doesn't compile
because `creatureService.checkDialog` doesn't exist yet outside this task... it exists as of Task
2, so the actual failure is `creature.valid` not being `false`).

- [ ] **Step 3: Wire `checkDialog` into `validate()`**

In `generator/lib/src/factories/creature.factory.ts`, inside the `validate()` method, change:

```ts
    creatureService.checkSpellAbilities(creature);
    creatureService.checkDuplicateAbilities(creature);
    immunityService.handleImmunities(creature);
    creatureService.checkWeapons(creature);
    descriptionService.generateCreatureSpells(creature.spells);
    descriptionService.generateCreatureItems(creature.items);
    creature.valid = valid;
```

to:

```ts
    creatureService.checkSpellAbilities(creature);
    creatureService.checkDuplicateAbilities(creature);
    const dialogValid = creatureService.checkDialog(creature);
    immunityService.handleImmunities(creature);
    creatureService.checkWeapons(creature);
    descriptionService.generateCreatureSpells(creature.spells);
    descriptionService.generateCreatureItems(creature.items);
    creature.valid = valid && dialogValid;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd generator && npx vitest run lib/src/factories/creature.factory.test.ts`
Expected: PASS, all tests including the pre-existing ones.

- [ ] **Step 5: Run the full generator test suite**

Run: `cd generator && npx vitest run`
Expected: PASS — no other test constructs a real creature through `validate()` with a non-empty
`behavior.dialog` and an unvalidated/mismatched CSV entry, so this is a purely additive check.

- [ ] **Step 6: Commit**

```bash
git add generator/lib/src/factories/creature.factory.ts generator/lib/src/factories/creature.factory.test.ts
git commit -m "feat: fail creature validation when dialog has no matching deathVar in creatures.csv"
```
