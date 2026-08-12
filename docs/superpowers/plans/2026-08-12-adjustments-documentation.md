# Showing per-file adjustments in the generated docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each creature's per-`.cre`-file adjustments in `docs/monsters.html`, as a collapsed disclosure listing only the fields that differ from the base creature and already have a rendering elsewhere on the page.

**Architecture:** A new pure computation layer (`adjustment.service.ts`) folds `creature.adjustments` per file and diffs the result against the base creature, returning a typed `AdjustmentDiff[]`. `documentation.service.ts` (the only layer that builds HTML/strings today) turns that into a `<details>` block, reusing existing label/lookup helpers (`formatEnumLabel`, `State.items`/`State.immunities`/`State.spells`, `monsterFilesService`).

**Tech Stack:** TypeScript, Vitest, existing WeiDU-doc-generation pipeline (`ts-node lib/src/index.ts`, `npm run generate`).

## Global Constraints

- A field only appears in an adjustment's line if it already has a rendering path in the main
  per-creature block today (ability scores, Hit Dice/level, hp, Armor Class, THAC0, Attacks per
  Round, Movement, Morale, Alignment, Size, XP Value, Attacks/`items.equipped`,
  Traits/`immunities`, Abilities/`spells.memorized`). Everything else (`class`/`kit`/`race`/
  `general`, `bonusHp`/`specialBonusHp`, `proficiencies`, colors, `script`, `gender`, `ea`,
  sub-type ACs/saves/resistances, `hideShadow`/`moveSilent`, `doubleApr` as its own line) is never
  shown, with no generic fallback.
- A shown field is included only when its value differs from the base creature's own value for
  that field - never merely "is it set."
- `scriptName` and `summon` are never rendered in any form.
- `noWeapon: true` renders as the literal phrase `"uses his own weapon"`.
- No changes to WeiDU generation (`weidu-creature.service.ts`) - this is a pure read of
  already-computed `creature.adjustments`, docs-only.
- Full spec: `docs/superpowers/specs/2026-08-12-adjustments-documentation-design.md`.

---

### Task 1: Look up a `.cre` file's display name from `creatures.csv`

**Files:**
- Modify: `lib/src/services/monster-files.service.ts`
- Test: `lib/src/services/monster-files.service.test.ts`

**Interfaces:**
- Produces: `parseFileNamesCsv(raw: string): Map<string, string>` (exported function) and
  `monsterFilesService.getName(file: string): string | undefined` (used by Task 3).

- [ ] **Step 1: Write the failing tests**

Add to `lib/src/services/monster-files.service.test.ts` (the file already defines `HEADER` with a
`name` column at the top - reuse it):

```ts
import monsterFilesService, {
  parseFileNamesCsv,
  parseMonsterDialogCsv,
  parseMonsterFilesCsv,
  parseUnvalidatedMonsterFilesCsv,
} from "./monster-files.service";

describe("parseFileNamesCsv", () => {
  it("maps each file to its name column value, uppercased", () => {
    const csv = [
      HEADER,
      "kaldran;ANIMAL;BEAR;BEAR_POLAR;BEAR_POLAR;kaldran;;BG1;Kaldran the Bear;PolarBear;true",
    ].join("\n");

    const result = parseFileNamesCsv(csv);

    expect(result.get("KALDRAN")).toBe("Kaldran the Bear");
  });

  it("skips rows with an empty file or an empty name", () => {
    const csv = [
      HEADER,
      ";ANIMAL;BEAR;BEAR_POLAR;BEAR_POLAR;;;BG1;No File;PolarBear;true",
      "NONAME;ANIMAL;BEAR;BEAR_POLAR;BEAR_POLAR;noname;;BG1;;PolarBear;true",
    ].join("\n");

    const result = parseFileNamesCsv(csv);

    expect(result.size).toBe(0);
  });

  it(EMPTY_MAP_FOR_HEADER_ONLY_CSV, () => {
    const result = parseFileNamesCsv(HEADER);

    expect(result.size).toBe(0);
  });
});

describe("monsterFilesService.getName", () => {
  it("returns the creatures.csv name for a known file, case-insensitively", () => {
    expect(monsterFilesService.getName("kaldran")).toBe("Kaldran the Bear");
    expect(monsterFilesService.getName("KALDRAN")).toBe("Kaldran the Bear");
  });

  it("returns undefined for an unknown file", () => {
    expect(monsterFilesService.getName("NOT_A_REAL_FILE_ID")).toBeUndefined();
  });
});
```

This adds `parseFileNamesCsv` to the existing named-import list at the top of the file (keep the
other three imports already there). The `getName` tests read the real `assets/creatures.csv`
(same convention as the existing `getFiles`/`getDialogRows` tests below) - `KALDRAN` is a real row
there (`KALDRAN;ANIMAL;BEAR;BEAR_POLAR;BEAR_POLAR;kaldran;;BG1;8;;;Kaldran the Bear;;PolarBear;
true`).

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/services/monster-files.service.test.ts`
Expected: FAIL - `parseFileNamesCsv` is not exported and `monsterFilesService.getName` doesn't
exist.

- [ ] **Step 3: Implement `parseFileNamesCsv` and `getName`**

In `lib/src/services/monster-files.service.ts`, add a new column constant next to the existing
ones (after `const SUMMON_COLUMN = "summon";`):

```ts
const NAME_COLUMN = "name";
```

Add this exported function after `parseMonsterSummonFilesCsv` (before the `MonsterFilesService`
class):

```ts
export function parseFileNamesCsv(raw: string): Map<string, string> {
  const lines = raw.split(/\r?\n/).filter((line) => line.length > 0);
  const header = lines[0].split(";");
  const fileIdx = header.indexOf(FILE_COLUMN);
  const nameIdx = header.indexOf(NAME_COLUMN);

  const result = new Map<string, string>();
  for (const line of lines.slice(1)) {
    const fields = line.split(";");
    const file = fields[fileIdx] ?? "";
    const name = fields[nameIdx] ?? "";
    if (!file || !name) continue;
    result.set(file.toUpperCase(), name);
  }
  return result;
}
```

Inside the `MonsterFilesService` class, add a private cache field next to the existing ones:

```ts
private namesByFile?: Map<string, string>;
```

And a public method next to `getFiles`/`getDialogRows`:

```ts
getName(file: string): string | undefined {
  this.namesByFile ??= parseFileNamesCsv(fs.readFileSync(CSV_PATH, "utf-8"));
  return this.namesByFile.get(file.toUpperCase());
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/src/services/monster-files.service.test.ts`
Expected: PASS (all tests in the file, including the pre-existing ones).

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/monster-files.service.ts lib/src/services/monster-files.service.test.ts
git commit -m "feat: look up a creature file's display name from creatures.csv"
```

---

### Task 2: Compute per-file adjustment diffs against the base creature

**Files:**
- Create: `lib/src/services/doc/adjustment.service.ts`
- Test: `lib/src/services/doc/adjustment.service.test.ts`

**Interfaces:**
- Consumes: `Creature` (`lib/src/model/creature/creature.ts`, has `.adjustments:
  CreatureAdjustment[]` and `.data: MainCreatureData`), `CreatureAdjustment`
  (`lib/src/model/creature/adjustment.ts`, `{ files: string[]; data: CreatureData; summon:
  boolean; noWeapon: boolean; scriptName: boolean }`), `creatureService.getFinalArmorClass(base:
  BaseCreature): number` (`lib/src/services/creature.service.ts:240`).
- Produces: `adjustmentService.getAdjustmentDiffs(creature: Creature): AdjustmentDiff[]` and the
  `AdjustmentDiff` interface, both exported from `lib/src/services/doc/adjustment.service.ts` -
  used by Task 3.

- [ ] **Step 1: Write the failing tests for the core fold/group behavior**

Create `lib/src/services/doc/adjustment.service.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Creature } from "../../model/creature/creature";
import { CreatureData } from "../../model/creature/data";
import adjustmentService from "./adjustment.service";

function fakeCreature(p: {
  data?: Partial<CreatureData>;
  adjustments?: {
    files: string[];
    noWeapon?: boolean;
    data: Partial<CreatureData>;
  }[];
}): Creature {
  const data: CreatureData = {
    level1: { pnpValue: 5, type: "none", value: 5 },
    movement: { pnpValue: 12 },
    strength: 10,
    dexterity: 12,
    constitution: 12,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    hp: 40,
    ac: 5,
    thac0: 15,
    apr: 2,
    xpv: 500,
    alignment: "NEUTRAL",
    morale: 10,
    size: "Large",
    script: { remove: [] },
    proficiencies: [],
    immunities: [],
    items: { equipped: [], remove: [] },
    spells: { memorized: [] },
    effects: { list: [] },
    ...p.data,
  } as unknown as CreatureData;

  return {
    id: 1,
    data,
    adjustments: (p.adjustments ?? []).map((a) => ({
      files: a.files,
      noWeapon: a.noWeapon ?? false,
      summon: false,
      scriptName: false,
      data: {
        script: { remove: [] },
        proficiencies: [],
        immunities: [],
        items: { equipped: [], remove: [] },
        spells: { memorized: [] },
        effects: { list: [] },
        ...a.data,
      },
    })),
  } as unknown as Creature;
}

describe("adjustmentService.getAdjustmentDiffs", () => {
  it("returns an empty array when the creature has no adjustments", () => {
    const creature = fakeCreature({});

    expect(adjustmentService.getAdjustmentDiffs(creature)).toEqual([]);
  });

  it("folds cumulative adjustments per file (later entry wins) and groups files with an identical result", () => {
    // Reproduces the real Ogre chieftain case (lib/creatures/ogres.ts:463-493): three separate
    // adjustment entries touch BDSOGR1/BDSOGR2, one of which (the weapon swap) also covers
    // AC#FP2OT, and one file (AC#WRIM1) is only ever touched by the first entry.
    const creature = fakeCreature({
      adjustments: [
        {
          files: ["AC#WRIM1", "BDSOGR1", "BDSOGR2"],
          data: { level1: { pnpValue: 7, type: "none", value: 7 }, ac: 2, xpv: 975 },
        },
        {
          files: ["AC#FP2OT", "BDSOGR1", "BDSOGR2"],
          noWeapon: true,
          data: {},
        },
        {
          files: ["BDSOGR1", "BDSOGR2"],
          data: { xpv: 1000 },
        },
      ],
    });

    const diffs = adjustmentService.getAdjustmentDiffs(creature);

    const bdsogr = diffs.find((d) => d.files.includes("BDSOGR1"));
    expect(bdsogr?.files).toEqual(["BDSOGR1", "BDSOGR2"]);
    expect(bdsogr?.level).toBe(7);
    expect(bdsogr?.ac).toBe(2);
    expect(bdsogr?.xpv).toBe(1000); // the third entry's xpv wins over the first's
    expect(bdsogr?.noWeapon).toBe(true);

    const acWrim = diffs.find((d) => d.files.includes("AC#WRIM1"));
    expect(acWrim?.files).toEqual(["AC#WRIM1"]);
    expect(acWrim?.xpv).toBe(975);
    expect(acWrim?.noWeapon).toBe(false);

    const acFp2ot = diffs.find((d) => d.files.includes("AC#FP2OT"));
    expect(acFp2ot?.files).toEqual(["AC#FP2OT"]);
    expect(acFp2ot?.noWeapon).toBe(true);
    expect(acFp2ot?.level).toBeUndefined();
    expect(acFp2ot?.xpv).toBeUndefined();
  });

  it("excludes a file whose only change is to a field with no doc presence (e.g. class)", () => {
    const creature = fakeCreature({
      adjustments: [{ files: ["WELT"], data: { class: "INNOCENT" } as Partial<CreatureData> }],
    });

    expect(adjustmentService.getAdjustmentDiffs(creature)).toEqual([]);
  });

  it("still produces a line for a file whose only change is noWeapon", () => {
    const creature = fakeCreature({
      adjustments: [{ files: ["KAHRK"], noWeapon: true, data: {} }],
    });

    const diffs = adjustmentService.getAdjustmentDiffs(creature);

    expect(diffs).toEqual([expect.objectContaining({ files: ["KAHRK"], noWeapon: true })]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/services/doc/adjustment.service.test.ts`
Expected: FAIL - `./adjustment.service` doesn't exist yet.

- [ ] **Step 3: Implement the fold/group core**

Create `lib/src/services/doc/adjustment.service.ts`:

```ts
import { CreatureAdjustment } from "../../model/creature/adjustment";
import { Creature } from "../../model/creature/creature";
import { CreatureData, MemorizedSpell } from "../../model/creature/data";
import { EquippedItem } from "../../model/creature/item";
import { ImmunityName } from "../../model/final/immunity";
import creatureService from "../creature.service";

export interface AdjustmentDiff {
  files: string[];
  noWeapon: boolean;
  level?: number;
  hp?: number;
  thac0?: number;
  ac?: number;
  apr?: number;
  doubleApr?: boolean;
  movement?: number;
  morale?: number;
  alignment?: string;
  size?: string;
  xpv?: number;
  strength?: number;
  exceptionalStrength?: number;
  dexterity?: number;
  constitution?: number;
  intelligence?: number;
  wisdom?: number;
  charisma?: number;
  equipped?: EquippedItem[];
  immunities?: ImmunityName[];
  memorized?: MemorizedSpell[];
}

class AdjustmentService {
  getAdjustmentDiffs(creature: Creature): AdjustmentDiff[] {
    const files = this.getAllFiles(creature.adjustments);
    const perFile = files.map((file) => this.getDiffForFile(creature, file));
    return this.group(perFile.filter((diff) => this.hasChanges(diff)));
  }

  private getAllFiles(adjustments: CreatureAdjustment[]): string[] {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const adjustment of adjustments) {
      for (const file of adjustment.files) {
        if (seen.has(file)) continue;
        seen.add(file);
        result.push(file);
      }
    }
    return result;
  }

  private getDiffForFile(creature: Creature, file: string): AdjustmentDiff {
    const matching = creature.adjustments.filter((a) => a.files.includes(file));
    const base = creature.data;

    return {
      files: [file],
      noWeapon: matching.some((a) => a.noWeapon),
      level: this.diff(
        this.lastDefined(matching, (d) => d.level1?.pnpValue),
        base.level1.pnpValue,
      ),
      hp: this.diff(this.lastDefined(matching, (d) => d.hp), base.hp),
      thac0: this.diff(this.lastDefined(matching, (d) => d.thac0), base.thac0),
      ac: this.getAcChange(matching, creature),
      apr: this.diff(this.lastDefined(matching, (d) => d.apr), base.apr),
      doubleApr: this.diff(this.lastDefined(matching, (d) => d.doubleApr), base.doubleApr),
      movement: this.diff(
        this.lastDefined(matching, (d) => d.movement?.pnpValue),
        base.movement.pnpValue,
      ),
      morale: this.diff(this.lastDefined(matching, (d) => d.morale), base.morale),
      alignment: this.diff(this.lastDefined(matching, (d) => d.alignment), base.alignment),
      size: this.diff(this.lastDefined(matching, (d) => d.size), base.size),
      xpv: this.diff(this.lastDefined(matching, (d) => d.xpv), base.xpv),
      strength: this.diff(this.lastDefined(matching, (d) => d.strength), base.strength),
      exceptionalStrength: this.diff(
        this.lastDefined(matching, (d) => d.exceptionalStrength),
        base.exceptionalStrength,
      ),
      dexterity: this.diff(this.lastDefined(matching, (d) => d.dexterity), base.dexterity),
      constitution: this.diff(
        this.lastDefined(matching, (d) => d.constitution),
        base.constitution,
      ),
      intelligence: this.diff(
        this.lastDefined(matching, (d) => d.intelligence),
        base.intelligence,
      ),
      wisdom: this.diff(this.lastDefined(matching, (d) => d.wisdom), base.wisdom),
      charisma: this.diff(this.lastDefined(matching, (d) => d.charisma), base.charisma),
      equipped: this.getEquippedChange(matching, base),
      immunities: this.getImmunitiesChange(matching, base),
      memorized: this.getMemorizedChange(matching, base),
    };
  }

  private lastDefined<T>(
    adjustments: CreatureAdjustment[],
    get: (data: CreatureData) => T | undefined,
  ): T | undefined {
    let result: T | undefined;
    for (const adjustment of adjustments) {
      const value = get(adjustment.data);
      if (value !== undefined) result = value;
    }
    return result;
  }

  private diff<T>(effective: T | undefined, base: T | undefined): T | undefined {
    if (effective === undefined) return undefined;
    return effective === base ? undefined : effective;
  }

  // creatureService.checkData runs checkDexterityArmorClassBonus on every adjustment's own data
  // using only that adjustment's own dexterity (never falling back to the base creature's), so an
  // adjustment's folded `ac` is already the final value - no bonus reconstruction needed here,
  // just a direct compare against the base's own displayed final AC.
  private getAcChange(matching: CreatureAdjustment[], creature: Creature): number | undefined {
    const ac = this.lastDefined(matching, (d) => d.ac);
    if (ac === undefined) return undefined;
    const baseFinal = creatureService.getFinalArmorClass(creature);
    return ac === baseFinal ? undefined : ac;
  }

  private slotKey(item: EquippedItem): string {
    return Array.isArray(item.slot) ? item.slot.join(",") : item.slot;
  }

  private getEquippedChange(
    matching: CreatureAdjustment[],
    base: CreatureData,
  ): EquippedItem[] | undefined {
    const bySlot = new Map<string, EquippedItem>();
    for (const adjustment of matching) {
      for (const item of adjustment.data.items.equipped) {
        bySlot.set(this.slotKey(item), item);
      }
    }
    if (bySlot.size === 0) return undefined;
    const baseBySlot = new Map(base.items.equipped.map((item) => [this.slotKey(item), item]));
    const changed = [...bySlot.entries()]
      .filter(([slot, item]) => baseBySlot.get(slot)?.file !== item.file)
      .map(([, item]) => item)
      .sort((a, b) => this.slotKey(a).localeCompare(this.slotKey(b)));
    return changed.length ? changed : undefined;
  }

  private getImmunitiesChange(
    matching: CreatureAdjustment[],
    base: CreatureData,
  ): ImmunityName[] | undefined {
    const granted = new Set<ImmunityName>();
    for (const adjustment of matching) {
      for (const name of adjustment.data.immunities) granted.add(name);
    }
    const added = [...granted].filter((name) => !base.immunities.includes(name)).sort();
    return added.length ? added : undefined;
  }

  private getMemorizedChange(
    matching: CreatureAdjustment[],
    base: CreatureData,
  ): MemorizedSpell[] | undefined {
    const byFile = new Map<string, MemorizedSpell>();
    for (const adjustment of matching) {
      for (const spell of adjustment.data.spells.memorized) byFile.set(spell.file, spell);
    }
    if (byFile.size === 0) return undefined;
    const baseByFile = new Map(base.spells.memorized.map((s) => [s.file, s]));
    const changed = [...byFile.entries()]
      .filter(([file, spell]) => baseByFile.get(file)?.memorizedCount !== spell.memorizedCount)
      .map(([, spell]) => spell)
      .sort((a, b) => a.file.localeCompare(b.file));
    return changed.length ? changed : undefined;
  }

  private hasChanges(diff: AdjustmentDiff): boolean {
    return (
      diff.noWeapon ||
      diff.level !== undefined ||
      diff.hp !== undefined ||
      diff.thac0 !== undefined ||
      diff.ac !== undefined ||
      diff.apr !== undefined ||
      diff.doubleApr !== undefined ||
      diff.movement !== undefined ||
      diff.morale !== undefined ||
      diff.alignment !== undefined ||
      diff.size !== undefined ||
      diff.xpv !== undefined ||
      diff.strength !== undefined ||
      diff.exceptionalStrength !== undefined ||
      diff.dexterity !== undefined ||
      diff.constitution !== undefined ||
      diff.intelligence !== undefined ||
      diff.wisdom !== undefined ||
      diff.charisma !== undefined ||
      diff.equipped !== undefined ||
      diff.immunities !== undefined ||
      diff.memorized !== undefined
    );
  }

  private group(diffs: AdjustmentDiff[]): AdjustmentDiff[] {
    const bySignature = new Map<string, AdjustmentDiff>();
    const order: string[] = [];
    for (const diff of diffs) {
      const { files, ...rest } = diff;
      const signature = JSON.stringify(rest);
      const existing = bySignature.get(signature);
      if (existing) {
        existing.files.push(...files);
      } else {
        bySignature.set(signature, { ...diff, files: [...files] });
        order.push(signature);
      }
    }
    return order.map((signature) => bySignature.get(signature) as AdjustmentDiff);
  }
}

const adjustmentService = new AdjustmentService();
export default adjustmentService;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/src/services/doc/adjustment.service.test.ts`
Expected: PASS (all 4 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/doc/adjustment.service.ts lib/src/services/doc/adjustment.service.test.ts
git commit -m "feat: compute per-file adjustment diffs against the base creature"
```

- [ ] **Step 6: Write the failing tests for bonusHp-driven autogeneration and the item/immunity/spell diffs**

Append to `lib/src/services/doc/adjustment.service.test.ts` (same `describe` block, or a sibling
one in the same file):

```ts
describe("adjustmentService.getAdjustmentDiffs - autogenerated and array fields", () => {
  // creatureService.checkData autogenerates hp/thac0 for every adjustment (from bonusHp,
  // constitution, etc.) even when the adjustment never touches hp/thac0 directly - so by the
  // time this runs, an adjustment driven purely by bonusHp already has its own final hp/thac0
  // baked into `.data`. The diff must still only show a change when that final value differs
  // from the base creature's - not merely because hp/thac0 are set on every adjustment.
  it("shows hp/thac0 only when the autogenerated final value actually differs from the base", () => {
    const creature = fakeCreature({
      data: { hp: 40, thac0: 15 },
      adjustments: [
        { files: ["SAME"], data: { hp: 40, thac0: 15 } },
        { files: ["DIFFERENT"], data: { hp: 52, thac0: 14 } },
      ],
    });

    const diffs = adjustmentService.getAdjustmentDiffs(creature);

    expect(diffs.find((d) => d.files.includes("SAME"))).toBeUndefined();
    const different = diffs.find((d) => d.files.includes("DIFFERENT"));
    expect(different?.hp).toBe(52);
    expect(different?.thac0).toBe(14);
  });

  it("shows only the equipped slot that changed, leaving an untouched slot out", () => {
    const creature = fakeCreature({
      data: {
        items: {
          equipped: [
            { file: "BASEWEAP", slot: "WEAPON1" },
            { file: "BASERING", slot: "LRING" },
          ],
          remove: [],
        } as unknown as CreatureData["items"],
      },
      adjustments: [
        {
          files: ["SWAP"],
          data: {
            items: {
              equipped: [{ file: "NEWWEAP", slot: "WEAPON1" }],
              remove: [],
            } as unknown as CreatureData["items"],
          },
        },
      ],
    });

    const diffs = adjustmentService.getAdjustmentDiffs(creature);

    const swap = diffs.find((d) => d.files.includes("SWAP"));
    expect(swap?.equipped).toEqual([{ file: "NEWWEAP", slot: "WEAPON1" }]);
  });

  it("shows only newly granted immunities, not ones the base creature already has", () => {
    const creature = fakeCreature({
      data: { immunities: ["giant"] },
      adjustments: [{ files: ["IMMUNE"], data: { immunities: ["giant", "undead"] } }],
    });

    const diffs = adjustmentService.getAdjustmentDiffs(creature);

    expect(diffs.find((d) => d.files.includes("IMMUNE"))?.immunities).toEqual(["undead"]);
  });

  it("shows only memorized spells whose count changed from the base", () => {
    const creature = fakeCreature({
      data: {
        spells: { memorized: [{ file: "SPPR101", memorizedCount: 1 }] } as unknown as CreatureData["spells"],
      },
      adjustments: [
        {
          files: ["CASTER"],
          data: {
            spells: {
              memorized: [{ file: "SPPR101", memorizedCount: 3 }],
            } as unknown as CreatureData["spells"],
          },
        },
      ],
    });

    const diffs = adjustmentService.getAdjustmentDiffs(creature);

    expect(diffs.find((d) => d.files.includes("CASTER"))?.memorized).toEqual([
      { file: "SPPR101", memorizedCount: 3 },
    ]);
  });
});
```

- [ ] **Step 7: Run tests to verify they fail or pass**

Run: `npx vitest run lib/src/services/doc/adjustment.service.test.ts`
Expected: These 4 tests should already PASS against the Step 3 implementation (no new production
code needed - this step is verifying the existing implementation actually covers these cases). If
any fails, fix the corresponding method in `adjustment.service.ts` before proceeding.

- [ ] **Step 8: Commit**

```bash
git add lib/src/services/doc/adjustment.service.test.ts
git commit -m "test: cover autogenerated-field and array-field adjustment diffs"
```

---

### Task 3: Render the adjustments block in the generated docs

**Files:**
- Modify: `lib/src/services/doc/documentation.service.ts:1-19` (imports), `:106` (wire into
  `addCreature`), and add new methods after `getCreatureTraits` (currently ending at line 366)
- Modify: `lib/templates/monster.html:50-52`
- Modify: `mod/docs/monsters.css` (append after line 341)
- Test: `lib/src/services/doc/documentation.service.test.ts`

**Interfaces:**
- Consumes: `adjustmentService.getAdjustmentDiffs(creature): AdjustmentDiff[]` (Task 2),
  `monsterFilesService.getName(file): string | undefined` (Task 1).

- [ ] **Step 1: Write the failing tests**

Add to `lib/src/services/doc/documentation.service.test.ts` (add `monsterFilesService` to the
imports at the top: `import monsterFilesService from "../monster-files.service";`):

```ts
describe("getCreatureAdjustments", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when the creature has no adjustments", () => {
    const creature = fakeCreatureForAddCreature(false);
    creature.adjustments = [];
    const template = { text: "{{adjustments}}" };

    documentationService.getCreatureAdjustments(template, creature);

    expect(template.text).toBe("");
  });

  it("renders a collapsed block with one line per effective adjustment group", () => {
    vi.spyOn(monsterFilesService, "getName").mockReturnValue(undefined);
    const creature = fakeCreatureForAddCreature(false);
    creature.adjustments = [
      {
        files: ["BDSOGR1", "BDSOGR2"],
        noWeapon: false,
        summon: false,
        scriptName: false,
        data: { level1: { pnpValue: 7, type: "none", value: 7 }, xpv: 975 },
      },
    ] as unknown as Creature["adjustments"];
    const template = { text: "{{adjustments}}" };

    documentationService.getCreatureAdjustments(template, creature);

    expect(template.text).toContain("<summary>Adjustments (1)</summary>");
    expect(template.text).toContain("<strong>BDSOGR1, BDSOGR2</strong>");
    expect(template.text).toContain("Level 7");
    expect(template.text).toContain("XP 975");
  });

  it("shows the creatures.csv name next to the files when it differs from the creature's own name", () => {
    vi.spyOn(monsterFilesService, "getName").mockReturnValue("Undead Knight");
    const creature = fakeCreatureForAddCreature(false);
    creature.adjustments = [
      { files: ["KNIGHTSK"], noWeapon: false, summon: false, scriptName: false, data: { xpv: 100 } },
    ] as unknown as Creature["adjustments"];
    const template = { text: "{{adjustments}}" };

    documentationService.getCreatureAdjustments(template, creature);

    expect(template.text).toContain("<strong>KNIGHTSK — Undead Knight</strong>");
  });

  it("renders 'uses his own weapon' for noWeapon and never renders scriptName/summon", () => {
    vi.spyOn(monsterFilesService, "getName").mockReturnValue(undefined);
    const creature = fakeCreatureForAddCreature(false);
    creature.adjustments = [
      {
        files: ["KAHRK"],
        noWeapon: true,
        summon: true,
        scriptName: true,
        data: { xpv: 100 },
      },
    ] as unknown as Creature["adjustments"];
    const template = { text: "{{adjustments}}" };

    documentationService.getCreatureAdjustments(template, creature);

    expect(template.text).toContain("uses his own weapon");
    expect(template.text).not.toContain("summon");
    expect(template.text).not.toContain("script");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/services/doc/documentation.service.test.ts`
Expected: FAIL - `documentationService.getCreatureAdjustments` doesn't exist and the
`{{adjustments}}` token isn't in the template yet.

- [ ] **Step 3: Add the `{{adjustments}}` token to the template**

In `lib/templates/monster.html`, change:

```html
  {{traits}}
  {{abilities}}
  {{spellbooks}}
```

to:

```html
  {{traits}}
  {{adjustments}}
  {{abilities}}
  {{spellbooks}}
```

- [ ] **Step 4: Add imports to `documentation.service.ts`**

At the top of `lib/src/services/doc/documentation.service.ts`, add these two imports (alongside
the existing ones):

```ts
import adjustmentService, { AdjustmentDiff } from "./adjustment.service";
import monsterFilesService from "../monster-files.service";
```

- [ ] **Step 5: Implement `getCreatureAdjustments` and its helpers**

Add these methods to the `DocumentationService` class, right after `getCreatureTraits` (which
currently ends with `this.replace(template, "traits", result);` followed by the closing `}`):

```ts
getCreatureAdjustments(template: { text: string }, creature: Creature) {
  const diffs = adjustmentService.getAdjustmentDiffs(creature);
  const items = diffs.map((diff) => this.getAdjustmentLine(creature, diff)).join("");
  let result = "";
  if (items) {
    result =
      `<div class="detail-section adjustments"><details>` +
      `<summary>Adjustments (${diffs.length})</summary>` +
      `<ul class="adjustment-list">${items}</ul></details></div>`;
  }
  this.replace(template, "adjustments", result);
}

private getAdjustmentLine(creature: Creature, diff: AdjustmentDiff): string {
  const label = this.getAdjustmentLabel(creature, diff.files);
  const changes = this.getAdjustmentChanges(creature, diff).join(", ");
  return `<li><strong>${label}</strong> — ${changes}</li>`;
}

private getAdjustmentLabel(creature: Creature, files: string[]): string {
  const name = monsterFilesService.getName(files[0]);
  const creatureName = translationService.from(creature.name);
  const fileList = files.join(", ");
  if (!name || name.trim().toLowerCase() === creatureName.trim().toLowerCase()) return fileList;
  return `${fileList} — ${name}`;
}

private getAdjustmentChanges(creature: Creature, diff: AdjustmentDiff): string[] {
  const changes: string[] = [];
  if (diff.level !== undefined) changes.push(`Level ${diff.level}`);
  if (diff.hp !== undefined) changes.push(`${diff.hp} hp`);
  if (diff.thac0 !== undefined) changes.push(`THAC0 ${diff.thac0}`);
  if (diff.ac !== undefined) changes.push(`AC ${diff.ac}`);
  if (diff.apr !== undefined) {
    const apr = diff.apr * (diff.doubleApr ? 2 : 1);
    changes.push(`APR ${apr}`);
  }
  if (diff.movement !== undefined) changes.push(`Movement ${diff.movement}`);
  if (diff.morale !== undefined) changes.push(`Morale ${diff.morale}`);
  if (diff.alignment !== undefined) {
    changes.push(`Alignment: ${this.formatEnumLabel(diff.alignment)}`);
  }
  if (diff.size !== undefined) changes.push(`Size: ${diff.size}`);
  if (diff.xpv !== undefined) changes.push(`XP ${diff.xpv}`);
  if (diff.strength !== undefined || diff.exceptionalStrength !== undefined) {
    let text = `STR ${diff.strength ?? creature.data.strength}`;
    const exStr = diff.exceptionalStrength ?? creature.data.exceptionalStrength;
    if (exStr) text += `/${exStr}`;
    changes.push(text);
  }
  if (diff.dexterity !== undefined) changes.push(`DEX ${diff.dexterity}`);
  if (diff.constitution !== undefined) changes.push(`CON ${diff.constitution}`);
  if (diff.intelligence !== undefined) changes.push(`INT ${diff.intelligence}`);
  if (diff.wisdom !== undefined) changes.push(`WIS ${diff.wisdom}`);
  if (diff.charisma !== undefined) changes.push(`CHA ${diff.charisma}`);
  for (const item of diff.equipped ?? []) {
    const found = State.items.find((i) => i.file === item.file);
    const name = found ? translationService.fromOptional(found.stringRef) : "";
    changes.push(`Equips ${name || item.file}`);
  }
  for (const name of diff.immunities ?? []) {
    const immunity = State.immunities.find((i) => i.name === name);
    changes.push(immunity ? translationService.fromOptional(immunity.stringRef) : name);
  }
  for (const spell of diff.memorized ?? []) {
    const found = State.spells.find((s) => s.file === spell.file);
    const name = found ? translationService.from(found.name) : spell.file;
    changes.push(`${name} (${this.getSpellQuantity(spell.memorizedCount)})`);
  }
  if (diff.noWeapon) changes.push("uses his own weapon");
  return changes;
}
```

- [ ] **Step 6: Wire it into `addCreature`**

In `addCreature` (`documentation.service.ts`), add the call right after
`this.getCreatureTraits(template, creature);` and before `this.getCreatureSpells(template,
creature);`:

```ts
    this.getCreatureAttacks(template, creature);
    this.getCreatureTraits(template, creature);
    this.getCreatureAdjustments(template, creature);
    this.getCreatureSpells(template, creature);
```

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run lib/src/services/doc/documentation.service.test.ts`
Expected: PASS (all tests in the file, including pre-existing ones - `addCreature`'s existing
tests will now also exercise `getCreatureAdjustments` on a creature with no adjustments, which
must render nothing and not throw).

- [ ] **Step 8: Add the CSS**

Append to the end of `mod/docs/monsters.css` (after the existing `.stat-half` media-query rule
that ends the file at line 341):

```css

.adjustments summary {
  cursor: pointer;
  font-family: var(--font-heading);
  font-size: 0.85rem;
  color: var(--color-ink-soft);
}

.adjustment-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  font-size: 0.85rem;
}

.adjustment-list li {
  padding: 3px 0;
  border-bottom: 1px dashed rgba(139, 26, 26, 0.25);
}
```

- [ ] **Step 9: Commit**

```bash
git add lib/src/services/doc/documentation.service.ts lib/src/services/doc/documentation.service.test.ts lib/templates/monster.html mod/docs/monsters.css
git commit -m "feat: render per-file adjustments in the generated docs"
```

- [ ] **Step 10: Regenerate the real docs and manually verify**

Run: `npm run generate`

Open `docs/monsters.html` in a browser (or search the file for `id="m` followed by the Ogre's and
Skeleton's ids) and confirm:

- The Ogre entry has a collapsed "Adjustments" disclosure; expanding it shows a
  `BDSOGR1, BDSOGR2` line with its Level/AC/XP changes and "uses his own weapon" where expected,
  and separate lines for the other chieftain files.
- The Skeleton entry's `KNIGHTSK` adjustment (if present after regeneration) shows
  `KNIGHTSK — Undead Knight` (or whatever `assets/creatures.csv` currently has for that row).
- A creature with no adjustments (e.g. a plain wolf) shows no "Adjustments" disclosure at all.

If anything looks wrong, fix it in the relevant Task 2/3 file and re-run `npm run generate` before
moving on - do not commit `docs/monsters.html` itself as part of this verification (it's build
output regenerated by the mod's own release process).

- [ ] **Step 11: Run the full test suite**

Run: `npm test`
Expected: PASS, no regressions in any other test file.
