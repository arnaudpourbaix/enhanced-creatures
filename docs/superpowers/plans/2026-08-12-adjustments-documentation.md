# Showing per-file adjustments in the generated docs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show each creature's per-`.cre`-file adjustments in `docs/monsters.html`, as a header badge that expands into one full mini stat block per effective adjustment - same stat-grid/Attacks/Traits/Abilities layout as the creature's own base block - with fields that actually differ from the base called out via a highlight chip.

**Architecture:** `adjustment.service.ts` (a pure computation layer) folds `creature.adjustments` per file (unchanged logic) and now produces, per field, an **effective value** (the folded adjustment's value, or the base creature's own value when unset) plus a **changed** flag (whether that effective value differs from the base creature's own displayed value). `documentation.service.ts` (the only layer that builds HTML/strings) turns that into a `<details>` header + one full mini creature card per effective adjustment, reusing the same per-field rendering helpers as the main block (`formatEnumLabel`, `getAttackDisplayText`, `getCreatureSpell`, `getTraitItemHtml`, `buildDescriptionHtml`), each now able to flag a field as changed via a small, backward-compatible signature extension.

**Context:** This supersedes the diff-line implementation already committed on the `worktree-adjustments-docs` branch (commits `f220843`..`0d0a8a2`, worktree at `.claude/worktrees/adjustments-docs`). Task 1 there (`monster-files.service.ts`'s `getName`/`parseFileNamesCsv`) is unaffected and stays as-is. Everything else in `adjustment.service.ts` and `documentation.service.ts` gets replaced by this plan's tasks, executed as new commits on that same branch/worktree (do not rewrite its existing history).

**Tech Stack:** TypeScript, Vitest, existing WeiDU-doc-generation pipeline (`ts-node lib/src/index.ts`, `npm run generate`).

## Global Constraints

- A field only appears on an adjustment's card if it already has a rendering path in the main
  per-creature block today (ability scores, Hit Dice/level+hp, Armor Class, THAC0, Attacks per
  Round, Movement, Morale, Alignment, Size, XP Value, Attacks/`items.equipped`,
  Traits/`immunities`, Abilities/`spells.memorized`). Everything else (`class`/`kit`/`race`/
  `general`, `bonusHp`/`specialBonusHp`, `proficiencies`, colors, `script`, `gender`, `ea`,
  sub-type ACs/saves/resistances, `hideShadow`/`moveSilent`) is never shown, with no generic
  fallback.
- Every shown field always renders its **effective value** (folded adjustment's value, falling
  back to the base creature's own value when unset) - never omitted just because it's unchanged.
  A field is additionally flagged **changed** (gets the `adjustment-changed` highlight class) only
  when that effective value actually differs from the base creature's own displayed value.
- List fields (`items.equipped`, `immunities`, `spells.memorized`) always render their full
  effective set (base entries included), with only the changed/new entries flagged.
- A file whose effective data has **no** changed field anywhere (all scalars unchanged, all list
  entries unchanged, `noWeapon` false) is excluded entirely - it would just repeat the base
  creature's own card with nothing to show.
- `scriptName` and `summon` are never rendered in any form.
- `noWeapon: true` renders as the literal phrase `"uses his own weapon"`, always flagged changed
  (it has no "unchanged" state).
- No changes to WeiDU generation (`weidu-creature.service.ts`) - this is a pure read of
  already-computed `creature.adjustments`, docs-only.
- Full spec: `docs/superpowers/specs/2026-08-12-adjustments-documentation-design.md`.

---

### Task 1: Compute effective per-file adjustment data (value + changed) against the base creature

**Files:**
- Replace: `lib/src/services/doc/adjustment.service.ts`
- Replace: `lib/src/services/doc/adjustment.service.test.ts`

**Interfaces:**
- Consumes: `Creature` (`.adjustments: CreatureAdjustment[]`, `.data: CreatureData`, `.attack.dualWielding: boolean`), `CreatureAdjustment` (`{ files: string[]; data: CreatureData; noWeapon: boolean; summon: boolean; scriptName: boolean }`), `creatureService.getFinalArmorClass(base: BaseCreature): number` (`lib/src/services/creature.service.ts:240`).
- Produces: `adjustmentService.getEffectiveAdjustments(creature: Creature): EffectiveAdjustment[]`, the `EffectiveAdjustment` interface, and the `AdjustmentField<T> = { value: T; changed: boolean }` interface - all exported from `lib/src/services/doc/adjustment.service.ts`, used by Task 2 and Task 3.

- [ ] **Step 1: Write the failing tests**

Replace `lib/src/services/doc/adjustment.service.test.ts` with:

```ts
import { describe, expect, it } from "vitest";
import { Creature } from "../../model/creature/creature";
import { CreatureData } from "../../model/creature/data";
import adjustmentService from "./adjustment.service";

function fakeCreature(p: {
  data?: Partial<CreatureData>;
  dualWielding?: boolean;
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
    doubleApr: false,
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
    attack: { dualWielding: p.dualWielding ?? false },
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

describe("adjustmentService.getEffectiveAdjustments", () => {
  it("returns an empty array when the creature has no adjustments", () => {
    expect(adjustmentService.getEffectiveAdjustments(fakeCreature({}))).toEqual([]);
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

    const effectives = adjustmentService.getEffectiveAdjustments(creature);

    const bdsogr = effectives.find((e) => e.files.includes("BDSOGR1"));
    expect(bdsogr?.files).toEqual(["BDSOGR1", "BDSOGR2"]);
    expect(bdsogr?.level).toEqual({ value: 7, changed: true });
    expect(bdsogr?.ac).toEqual({ value: 2, changed: true });
    expect(bdsogr?.xpv).toEqual({ value: 1000, changed: true }); // third entry's xpv wins over the first's
    expect(bdsogr?.noWeapon).toBe(true);

    const acWrim = effectives.find((e) => e.files.includes("AC#WRIM1"));
    expect(acWrim?.files).toEqual(["AC#WRIM1"]);
    expect(acWrim?.xpv).toEqual({ value: 975, changed: true });
    expect(acWrim?.noWeapon).toBe(false);

    const acFp2ot = effectives.find((e) => e.files.includes("AC#FP2OT"));
    expect(acFp2ot?.files).toEqual(["AC#FP2OT"]);
    expect(acFp2ot?.noWeapon).toBe(true);
    expect(acFp2ot?.level).toEqual({ value: 5, changed: false }); // inherited from the base
    expect(acFp2ot?.xpv).toEqual({ value: 500, changed: false });
  });

  it("excludes a file whose only authored change is to a field with no doc presence (e.g. class)", () => {
    const creature = fakeCreature({
      adjustments: [{ files: ["WELT"], data: { class: "INNOCENT" } as Partial<CreatureData> }],
    });

    expect(adjustmentService.getEffectiveAdjustments(creature)).toEqual([]);
  });

  it("still produces an entry for a file whose only change is noWeapon", () => {
    const creature = fakeCreature({
      adjustments: [{ files: ["KAHRK"], noWeapon: true, data: {} }],
    });

    const effectives = adjustmentService.getEffectiveAdjustments(creature);

    expect(effectives).toEqual([expect.objectContaining({ files: ["KAHRK"], noWeapon: true })]);
  });

  // creatureService.checkData autogenerates hp/thac0 for every adjustment (from bonusHp,
  // constitution, etc.) even when the adjustment never touches hp/thac0 directly - so by the time
  // this runs, an adjustment driven purely by bonusHp already has its own final hp/thac0 baked
  // into `.data`. changed must reflect whether that final value actually differs from the base's
  // own - not merely that hp/thac0 are always present.
  it("flags hp/thac0 changed only when the autogenerated final value actually differs from the base", () => {
    const creature = fakeCreature({
      data: { hp: 40, thac0: 15 },
      adjustments: [
        { files: ["SAME"], data: { hp: 40, thac0: 15 } },
        { files: ["DIFFERENT"], data: { hp: 52, thac0: 14 } },
      ],
    });

    const effectives = adjustmentService.getEffectiveAdjustments(creature);

    expect(effectives.find((e) => e.files.includes("SAME"))).toBeUndefined();
    const different = effectives.find((e) => e.files.includes("DIFFERENT"));
    expect(different?.hp).toEqual({ value: 52, changed: true });
    expect(different?.thac0).toEqual({ value: 14, changed: true });
  });

  it("compares AC against the base creature's own final (dexterity-adjusted) armor class", () => {
    const creature = fakeCreature({
      data: { ac: 10, dexterity: 18 }, // final AC = 10 + (-4) = 6, see creature.service.test.ts
      adjustments: [
        { files: ["SAME_FINAL"], data: { ac: 6 } },
        { files: ["DIFFERENT"], data: { ac: 2 } },
      ],
    });

    const effectives = adjustmentService.getEffectiveAdjustments(creature);

    expect(effectives.find((e) => e.files.includes("SAME_FINAL"))).toBeUndefined();
    expect(effectives.find((e) => e.files.includes("DIFFERENT"))?.ac).toEqual({
      value: 2,
      changed: true,
    });
  });

  it("falls back to the base's own final AC when the adjustment never sets ac", () => {
    const creature = fakeCreature({
      data: { ac: 10, dexterity: 18 },
      adjustments: [{ files: ["NOAC"], data: { xpv: 999 } }],
    });

    const effective = adjustmentService
      .getEffectiveAdjustments(creature)
      .find((e) => e.files.includes("NOAC"));

    expect(effective?.ac).toEqual({ value: 6, changed: false });
  });

  // Mirrors documentationService.getEffectiveApr's own apr*doubleApr(+dual-wielding) formula so an
  // adjustment card's APR number and its "changed" flag agree with what the main block would show
  // for the same raw apr/doubleApr - duplicated here (not imported) because documentation.service
  // already imports this file, and importing it back would be circular.
  it("combines apr, doubleApr, and the base creature's own dual-wielding bonus consistently", () => {
    const creature = fakeCreature({
      data: { apr: 2, doubleApr: false },
      dualWielding: true, // base's own effective apr = 2 + 1 = 3
      adjustments: [
        { files: ["SAME"], data: { apr: 2 } }, // 2 + 1 = 3, same as base
        { files: ["DOUBLED"], data: { apr: 2, doubleApr: true } }, // 2*2 + 1 = 5
      ],
    });

    const effectives = adjustmentService.getEffectiveAdjustments(creature);

    expect(effectives.find((e) => e.files.includes("SAME"))).toBeUndefined();
    expect(effectives.find((e) => e.files.includes("DOUBLED"))?.apr).toEqual({
      value: 5,
      changed: true,
    });
  });

  it("shows the full effective equipped set, flagging only the slot that changed", () => {
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

    const swap = adjustmentService
      .getEffectiveAdjustments(creature)
      .find((e) => e.files.includes("SWAP"));

    expect(swap?.equipped).toEqual(
      expect.arrayContaining([
        { item: { file: "NEWWEAP", slot: "WEAPON1" }, changed: true },
        { item: { file: "BASERING", slot: "LRING" }, changed: false },
      ]),
    );
    expect(swap?.equipped).toHaveLength(2);
  });

  it("shows the full effective immunities set, flagging only newly granted ones", () => {
    const creature = fakeCreature({
      data: { immunities: ["giant"] },
      adjustments: [{ files: ["IMMUNE"], data: { immunities: ["giant", "undead"] } }],
    });

    const effective = adjustmentService
      .getEffectiveAdjustments(creature)
      .find((e) => e.files.includes("IMMUNE"));

    expect(effective?.immunities).toEqual(
      expect.arrayContaining([
        { name: "giant", changed: false },
        { name: "undead", changed: true },
      ]),
    );
    expect(effective?.immunities).toHaveLength(2);
  });

  it("shows the full effective memorized spellbook, flagging only entries whose count changed", () => {
    const creature = fakeCreature({
      data: {
        spells: {
          memorized: [
            { file: "SPPR101", memorizedCount: 1 },
            { file: "SPPR201", memorizedCount: 2 },
          ],
        } as unknown as CreatureData["spells"],
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

    const effective = adjustmentService
      .getEffectiveAdjustments(creature)
      .find((e) => e.files.includes("CASTER"));

    expect(effective?.memorized).toEqual(
      expect.arrayContaining([
        { spell: { file: "SPPR101", memorizedCount: 3 }, changed: true },
        { spell: { file: "SPPR201", memorizedCount: 2 }, changed: false },
      ]),
    );
    expect(effective?.memorized).toHaveLength(2);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/services/doc/adjustment.service.test.ts`
Expected: FAIL - `getEffectiveAdjustments` doesn't exist yet (the file still exports the old
`getAdjustmentDiffs`/`AdjustmentDiff`).

- [ ] **Step 3: Implement the effective-data computation**

Replace `lib/src/services/doc/adjustment.service.ts` with:

```ts
import { CreatureAdjustment } from "../../model/creature/adjustment";
import { Creature } from "../../model/creature/creature";
import { CreatureData, MemorizedSpell } from "../../model/creature/data";
import { EquippedItem } from "../../model/creature/item";
import { ImmunityName } from "../../model/final/immunity";
import creatureService from "../creature.service";

export interface AdjustmentField<T> {
  value: T;
  changed: boolean;
}

export interface EffectiveAdjustment {
  files: string[];
  noWeapon: boolean;
  level: AdjustmentField<number>;
  hp: AdjustmentField<number>;
  thac0: AdjustmentField<number>;
  ac: AdjustmentField<number>;
  apr: AdjustmentField<number>;
  movement: AdjustmentField<number>;
  morale: AdjustmentField<number>;
  alignment: AdjustmentField<string>;
  size: AdjustmentField<string>;
  xpv: AdjustmentField<number>;
  strength: AdjustmentField<number>;
  exceptionalStrength: AdjustmentField<number | undefined>;
  dexterity: AdjustmentField<number>;
  constitution: AdjustmentField<number>;
  intelligence: AdjustmentField<number>;
  wisdom: AdjustmentField<number>;
  charisma: AdjustmentField<number>;
  equipped: { item: EquippedItem; changed: boolean }[];
  immunities: { name: ImmunityName; changed: boolean }[];
  memorized: { spell: MemorizedSpell; changed: boolean }[];
}

class AdjustmentService {
  getEffectiveAdjustments(creature: Creature): EffectiveAdjustment[] {
    const files = this.getAllFiles(creature.adjustments);
    const perFile = files.map((file) => this.getEffectiveDataForFile(creature, file));
    return this.group(perFile.filter((effective) => this.hasVisibleChanges(effective)));
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

  private getEffectiveDataForFile(creature: Creature, file: string): EffectiveAdjustment {
    const matching = creature.adjustments.filter((a) => a.files.includes(file));
    const base = creature.data;

    return {
      files: [file],
      noWeapon: matching.some((a) => a.noWeapon),
      level: this.field(this.lastDefined(matching, (d) => d.level1?.pnpValue), base.level1.pnpValue),
      hp: this.field(this.lastDefined(matching, (d) => d.hp), base.hp),
      thac0: this.field(this.lastDefined(matching, (d) => d.thac0), base.thac0),
      ac: this.getAc(matching, creature),
      apr: this.getApr(matching, creature),
      movement: this.field(
        this.lastDefined(matching, (d) => d.movement?.pnpValue),
        base.movement.pnpValue,
      ),
      morale: this.field(this.lastDefined(matching, (d) => d.morale), base.morale),
      alignment: this.field(this.lastDefined(matching, (d) => d.alignment), base.alignment),
      size: this.field(this.lastDefined(matching, (d) => d.size), base.size),
      xpv: this.field(this.lastDefined(matching, (d) => d.xpv), base.xpv),
      strength: this.field(this.lastDefined(matching, (d) => d.strength), base.strength),
      exceptionalStrength: this.field(
        this.lastDefined(matching, (d) => d.exceptionalStrength),
        base.exceptionalStrength,
      ),
      dexterity: this.field(this.lastDefined(matching, (d) => d.dexterity), base.dexterity),
      constitution: this.field(
        this.lastDefined(matching, (d) => d.constitution),
        base.constitution,
      ),
      intelligence: this.field(
        this.lastDefined(matching, (d) => d.intelligence),
        base.intelligence,
      ),
      wisdom: this.field(this.lastDefined(matching, (d) => d.wisdom), base.wisdom),
      charisma: this.field(this.lastDefined(matching, (d) => d.charisma), base.charisma),
      equipped: this.getEquipped(matching, base),
      immunities: this.getImmunities(matching, base),
      memorized: this.getMemorized(matching, base),
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

  private field<T>(overridden: T | undefined, base: T): AdjustmentField<T> {
    const value = overridden === undefined ? base : overridden;
    return { value, changed: value !== base };
  }

  // checkData already ran checkDexterityArmorClassBonus on every adjustment's own data using only
  // that adjustment's own dexterity (never falling back to the base's) - so a folded `ac` is
  // already a finished, display-ready value whenever the adjustment sets its own dexterity too.
  // No adjustment does that today (see the spec's Non-goals), so this is never exercised in
  // practice, but the base side always needs getFinalArmorClass() since the base's own raw
  // data.ac has had its dexterity bonus stripped out for WeiDU generation by that same pass.
  private getAc(matching: CreatureAdjustment[], creature: Creature): AdjustmentField<number> {
    const base = creatureService.getFinalArmorClass(creature);
    return this.field(this.lastDefined(matching, (d) => d.ac), base);
  }

  // Mirrors documentationService.getEffectiveApr (raw apr * doubleApr multiplier, plus the +1 the
  // engine grants automatically for an off-hand weapon) - duplicated rather than imported because
  // documentation.service.ts already imports this file. The base creature's own dual-wielding
  // status is reused as-is (never re-derived per adjustment - see the spec's Non-goals).
  private getApr(matching: CreatureAdjustment[], creature: Creature): AdjustmentField<number> {
    const dualWieldingBonus = creature.attack.dualWielding ? 1 : 0;
    const rawApr = this.lastDefined(matching, (d) => d.apr) ?? creature.data.apr;
    const doubleApr = this.lastDefined(matching, (d) => d.doubleApr) ?? creature.data.doubleApr;
    const value = rawApr * (doubleApr ? 2 : 1) + dualWieldingBonus;
    const base = creature.data.apr * (creature.data.doubleApr ? 2 : 1) + dualWieldingBonus;
    return { value, changed: value !== base };
  }

  private slotKey(item: EquippedItem): string {
    return Array.isArray(item.slot) ? item.slot.join(",") : item.slot;
  }

  private getEquipped(
    matching: CreatureAdjustment[],
    base: CreatureData,
  ): { item: EquippedItem; changed: boolean }[] {
    const baseBySlot = new Map(base.items.equipped.map((item) => [this.slotKey(item), item]));
    const bySlot = new Map(baseBySlot);
    for (const adjustment of matching) {
      // adjustment.data is typed as the full CreatureData (real adjustments always go through
      // creatureFactory.setAdjustments, which fully populates it via getData()), but
      // documentation.service.test.ts fixtures construct adjustments via `as unknown as` casts
      // that skip that and leave nested collections genuinely undefined at runtime - keep the
      // optional chain.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      for (const item of adjustment.data.items?.equipped ?? []) {
        bySlot.set(this.slotKey(item), item);
      }
    }
    return [...bySlot.entries()]
      .map(([slot, item]) => ({ item, changed: baseBySlot.get(slot)?.file !== item.file }))
      .sort((a, b) => this.slotKey(a.item).localeCompare(this.slotKey(b.item)));
  }

  private getImmunities(
    matching: CreatureAdjustment[],
    base: CreatureData,
  ): { name: ImmunityName; changed: boolean }[] {
    const granted = new Set<ImmunityName>(base.immunities);
    for (const adjustment of matching) {
      // See getEquipped's comment above - test fixtures can leave this undefined at runtime
      // despite the non-optional type.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      for (const name of adjustment.data.immunities ?? []) granted.add(name);
    }
    return [...granted]
      .map((name) => ({ name, changed: !base.immunities.includes(name) }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  private getMemorized(
    matching: CreatureAdjustment[],
    base: CreatureData,
  ): { spell: MemorizedSpell; changed: boolean }[] {
    const baseByFile = new Map(base.spells.memorized.map((s) => [s.file, s]));
    const byFile = new Map(baseByFile);
    for (const adjustment of matching) {
      // See getEquipped's comment above - test fixtures can leave this undefined at runtime
      // despite the non-optional type.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      for (const spell of adjustment.data.spells?.memorized ?? []) byFile.set(spell.file, spell);
    }
    return [...byFile.entries()]
      .map(([file, spell]) => ({
        spell,
        changed: baseByFile.get(file)?.memorizedCount !== spell.memorizedCount,
      }))
      .sort((a, b) => a.spell.file.localeCompare(b.spell.file));
  }

  // A flat one-field-per-line OR chain over every trackable field - each check is independent and
  // self-contained (no shared state, no nesting), same reasoning as adjustment rendering's own
  // field dispatch previously here.
  // eslint-disable-next-line sonarjs/cognitive-complexity
  private hasVisibleChanges(effective: EffectiveAdjustment): boolean {
    return (
      effective.noWeapon ||
      effective.level.changed ||
      effective.hp.changed ||
      effective.thac0.changed ||
      effective.ac.changed ||
      effective.apr.changed ||
      effective.movement.changed ||
      effective.morale.changed ||
      effective.alignment.changed ||
      effective.size.changed ||
      effective.xpv.changed ||
      effective.strength.changed ||
      effective.exceptionalStrength.changed ||
      effective.dexterity.changed ||
      effective.constitution.changed ||
      effective.intelligence.changed ||
      effective.wisdom.changed ||
      effective.charisma.changed ||
      effective.equipped.some((e) => e.changed) ||
      effective.immunities.some((i) => i.changed) ||
      effective.memorized.some((m) => m.changed)
    );
  }

  private group(effectives: EffectiveAdjustment[]): EffectiveAdjustment[] {
    const bySignature = new Map<string, EffectiveAdjustment>();
    const order: string[] = [];
    for (const effective of effectives) {
      const { files, ...rest } = effective;
      const signature = JSON.stringify(rest);
      const existing = bySignature.get(signature);
      if (existing) {
        existing.files.push(...files);
      } else {
        bySignature.set(signature, { ...effective, files: [...files] });
        order.push(signature);
      }
    }
    return order.map((signature) => bySignature.get(signature) as EffectiveAdjustment);
  }
}

const adjustmentService = new AdjustmentService();
export default adjustmentService;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/src/services/doc/adjustment.service.test.ts`
Expected: PASS (all tests).

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/doc/adjustment.service.ts lib/src/services/doc/adjustment.service.test.ts
git commit -m "feat: compute effective per-file adjustment data with change tracking"
```

---

### Task 2: Render the header badge and per-card stat-grid

**Files:**
- Modify: `lib/src/services/doc/documentation.service.ts:19` (import), `:72-113` (`addCreature`), remove the old `getCreatureAdjustments`/`getAdjustmentLine`/`getAdjustmentChanges` methods, add new methods
- Modify: `lib/templates/monster.html:1-2`
- Test: `lib/src/services/doc/documentation.service.test.ts`

**Interfaces:**
- Consumes: `adjustmentService.getEffectiveAdjustments(creature): EffectiveAdjustment[]` (Task 1), `monsterFilesService.getName(file): string | undefined` (existing, unchanged).
- Produces: `documentationService.getCreatureHeader(template, creature)`, used by `addCreature`. `getAdjustmentCard`/`getAdjustmentStatGrid` (private for now, extended by Task 3) - used by `getCreatureHeader`.

- [ ] **Step 1: Write the failing tests**

In `lib/src/services/doc/documentation.service.test.ts`, replace the entire
`describe("getCreatureAdjustments", ...)` block (currently the last block in the file) with:

```ts
describe("getCreatureHeader", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders a plain h3 with no details/badge when the creature has no adjustments", () => {
    const creature = fakeCreatureForAddCreature(false);
    creature.adjustments = [];
    const template = { text: "{{header}}" };

    documentationService.getCreatureHeader(template, creature);

    expect(template.text).toBe(`<h3>${translationService.from(creature.name)}</h3>`);
  });

  it("renders a details/summary badge and one adjustment-card per effective group", () => {
    vi.spyOn(monsterFilesService, "getName").mockReturnValue(undefined);
    const creature = fakeCreatureForAddCreature(false);
    creature.adjustments = [
      {
        files: ["BDSOGR1", "BDSOGR2"],
        noWeapon: false,
        summon: false,
        scriptName: false,
        data: { level1: { pnpValue: 7, type: "none", value: 7 }, hp: 70, xpv: 975 },
      },
    ] as unknown as Creature["adjustments"];
    const template = { text: "{{header}}" };

    documentationService.getCreatureHeader(template, creature);

    expect(template.text).toContain('<details class="creature-adjustments">');
    expect(template.text).toContain('<span class="adjustments-badge">1 adjustment ▾</span>');
    expect(template.text).toContain('<div class="adjustment-card">');
    expect(template.text).toContain("<h4>BDSOGR1, BDSOGR2</h4>");
    // Changed field: highlighted.
    expect(template.text).toMatch(
      /<dt>Hit Dice<\/dt><dd class="adjustment-changed">7 \(70 hp\)<\/dd>/,
    );
    expect(template.text).toMatch(/<dt>XP Value<\/dt><dd class="adjustment-changed">975<\/dd>/);
    // Untouched field: still shown, but plain (base's own final AC is 5 - ac:5, dexterity:12).
    expect(template.text).toMatch(/<dt>Armor Class<\/dt><dd>5<\/dd>/);
  });

  it("shows the creatures.csv name next to the files when it differs from the creature's own name", () => {
    vi.spyOn(monsterFilesService, "getName").mockReturnValue("Undead Knight");
    const creature = fakeCreatureForAddCreature(false);
    creature.adjustments = [
      { files: ["KNIGHTSK"], noWeapon: false, summon: false, scriptName: false, data: { xpv: 100 } },
    ] as unknown as Creature["adjustments"];
    const template = { text: "{{header}}" };

    documentationService.getCreatureHeader(template, creature);

    expect(template.text).toContain("<h4>KNIGHTSK — Undead Knight</h4>");
  });

  // Regression coverage carried over from the prior diff-line implementation: a multi-file group
  // whose files resolve to genuinely different creatures.csv names (e.g. KRYSKEL1..6 ->
  // Rick/Shane/Daryl/Glenn/Lori/Hagar) must fall back to the bare file list, not just the first
  // file's name.
  it("shows the bare file list, with no name suffix, when files in the group resolve to different names", () => {
    vi.spyOn(monsterFilesService, "getName").mockImplementation((file: string) => {
      if (file === "KRYSKEL1") return "Rick";
      if (file === "KRYSKEL2") return "Shane";
      return undefined;
    });
    const creature = fakeCreatureForAddCreature(false);
    creature.adjustments = [
      {
        files: ["KRYSKEL1", "KRYSKEL2"],
        noWeapon: false,
        summon: false,
        scriptName: false,
        data: { xpv: 100 },
      },
    ] as unknown as Creature["adjustments"];
    const template = { text: "{{header}}" };

    documentationService.getCreatureHeader(template, creature);

    expect(template.text).toContain("<h4>KRYSKEL1, KRYSKEL2</h4>");
    expect(template.text).not.toContain("Rick");
    expect(template.text).not.toContain("Shane");
  });

  it("renders 'uses his own weapon' for noWeapon and never renders scriptName/summon", () => {
    vi.spyOn(monsterFilesService, "getName").mockReturnValue(undefined);
    const creature = fakeCreatureForAddCreature(false);
    creature.adjustments = [
      { files: ["KAHRK"], noWeapon: true, summon: true, scriptName: true, data: { xpv: 100 } },
    ] as unknown as Creature["adjustments"];
    const template = { text: "{{header}}" };

    documentationService.getCreatureHeader(template, creature);

    expect(template.text).toContain(
      '<p class="adjustment-note adjustment-changed">uses his own weapon</p>',
    );
    expect(template.text).not.toContain("summon");
    expect(template.text).not.toContain("script");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/services/doc/documentation.service.test.ts`
Expected: FAIL - `getCreatureHeader` doesn't exist, and the `{{header}}` token isn't in the
template yet.

- [ ] **Step 3: Update the template**

In `lib/templates/monster.html`, change:

```html
<div class="creature" id="{{id}}">
  <h3>{{name}}</h3>
```

to:

```html
<div class="creature" id="{{id}}">
  {{header}}
```

And remove the `{{adjustments}}` line further down (between `{{traits}}` and `{{abilities}}`) -
the panel now lives inside `{{header}}` itself, so it's no longer a separate token:

```html
  {{traits}}
  {{abilities}}
  {{spellbooks}}
```

- [ ] **Step 4: Update the import in `documentation.service.ts`**

Change:

```ts
import adjustmentService, { AdjustmentDiff } from "./adjustment.service";
```

to:

```ts
import adjustmentService, { EffectiveAdjustment } from "./adjustment.service";
```

- [ ] **Step 5: Replace the name replace with `getCreatureHeader`, and remove the old adjustments methods**

In `addCreature` (`documentation.service.ts:72-113`), replace this line:

```ts
    this.replace(template, "name", translationService.from(creature.name));
```

with:

```ts
    this.getCreatureHeader(template, creature);
```

And remove this line entirely (the panel is now built inside `getCreatureHeader`, not as a
separate token):

```ts
    this.getCreatureAdjustments(template, creature);
```

Delete the three old methods `getCreatureAdjustments`, `getAdjustmentLine`, and
`getAdjustmentChanges` (currently right after `getCreatureTraits`) - they built the old
comma-separated diff line and are fully superseded. **Keep `getAdjustmentLabel`** (the
file-list-plus-optional-name lookup) exactly as-is - it's still used, just from a new caller.

- [ ] **Step 6: Implement `getCreatureHeader` and the per-card stat-grid**

Add these methods where the deleted ones used to be (right after `getCreatureTraits`):

```ts
  getCreatureHeader(template: { text: string }, creature: Creature) {
    const name = translationService.from(creature.name);
    const effectiveAdjustments = adjustmentService.getEffectiveAdjustments(creature);
    let header = `<h3>${name}</h3>`;
    if (effectiveAdjustments.length) {
      const cards = effectiveAdjustments
        .map((effective, index) => this.getAdjustmentCard(creature, effective, index))
        .join("");
      const count = effectiveAdjustments.length;
      const label = count === 1 ? "adjustment" : "adjustments";
      header =
        `<details class="creature-adjustments">` +
        `<summary><span>${name}</span><span class="adjustments-badge">${count} ${label} ▾</span></summary>` +
        `<div class="adjustment-cards">${cards}</div></details>`;
    }
    this.replace(template, "header", header);
  }

  // Task 3 appends the Attacks/Traits/Abilities sections to this same card, between the stat-grid
  // and the closing </div> - `noWeaponNote` (if any) already sits right after the stat-grid.
  private getAdjustmentCard(
    creature: Creature,
    effective: EffectiveAdjustment,
    cardIndex: number,
  ): string {
    const label = this.getAdjustmentLabel(creature, effective.files);
    const noWeaponNote = effective.noWeapon
      ? `<p class="adjustment-note adjustment-changed">uses his own weapon</p>`
      : "";
    return (
      `<div class="adjustment-card">` +
      `<h4>${label}</h4>` +
      `<dl class="stat-grid">${this.getAdjustmentStatGrid(effective)}</dl>` +
      noWeaponNote +
      this.getAdjustmentAttacks(creature, effective, cardIndex) +
      this.getAdjustmentTraits(creature, effective) +
      this.getAdjustmentSpells(creature, effective, cardIndex) +
      `</div>`
    );
  }

  private getAdjustmentStatGrid(effective: EffectiveAdjustment): string {
    const abilityChanged =
      effective.strength.changed ||
      effective.exceptionalStrength.changed ||
      effective.dexterity.changed ||
      effective.constitution.changed ||
      effective.intelligence.changed ||
      effective.wisdom.changed ||
      effective.charisma.changed;
    let str = `${effective.strength.value}`;
    if (effective.exceptionalStrength.value) str += `/${effective.exceptionalStrength.value}`;
    const abilityScores =
      `STR ${str}, DEX ${effective.dexterity.value}, CON ${effective.constitution.value}, ` +
      `INT ${effective.intelligence.value}, WIS ${effective.wisdom.value}, CHA ${effective.charisma.value}`;
    const hitDiceChanged = effective.level.changed || effective.hp.changed;

    const row = (label: string, value: string | number, changed: boolean, wide = false): string =>
      `<div class="stat${wide ? " stat-wide" : ""}"><dt>${label}</dt>` +
      `<dd${changed ? ' class="adjustment-changed"' : ""}>${value}</dd></div>`;

    return (
      row("Ability Scores", abilityScores, abilityChanged, true) +
      row("Hit Dice", `${effective.level.value} (${effective.hp.value} hp)`, hitDiceChanged) +
      row("Armor Class", effective.ac.value, effective.ac.changed) +
      row("THAC0", effective.thac0.value, effective.thac0.changed) +
      row("Attacks per Round", effective.apr.value, effective.apr.changed) +
      row("Movement", effective.movement.value, effective.movement.changed) +
      row("Morale", effective.morale.value, effective.morale.changed) +
      row(
        "Alignment",
        this.formatEnumLabel(effective.alignment.value),
        effective.alignment.changed,
      ) +
      row("Size", effective.size.value, effective.size.changed) +
      row("XP Value", effective.xpv.value, effective.xpv.changed)
    );
  }
```

This won't compile yet - `getAdjustmentAttacks`, `getAdjustmentTraits`, and `getAdjustmentSpells`
are added in Task 3. Add temporary stubs at the end of this step, matching `getAdjustmentCard`'s
call-site arguments exactly (`getAdjustmentTraits` takes no `cardIndex` - it never needs a unique
popover id, unlike the other two) so Task 2's own tests can run in isolation:

```ts
  private getAdjustmentAttacks(
    creature: Creature,
    effective: EffectiveAdjustment,
    cardIndex: number,
  ): string {
    return "";
  }

  private getAdjustmentTraits(creature: Creature, effective: EffectiveAdjustment): string {
    return "";
  }

  private getAdjustmentSpells(
    creature: Creature,
    effective: EffectiveAdjustment,
    cardIndex: number,
  ): string {
    return "";
  }
```

(Task 3 replaces these three stubs with real implementations. Unused-parameter lint warnings on
the stubs are expected and transient - Task 3 removes the stubs entirely within the same task
sequence, before any lint/commit gate that would fail on them.)

- [ ] **Step 7: Run tests to verify they pass**

Run: `npx vitest run lib/src/services/doc/documentation.service.test.ts`
Expected: PASS (all tests in the file, including pre-existing ones - `addCreature`'s existing
tests now also exercise `getCreatureHeader` on a creature with no adjustments, which must render
`<h3>{{name}}</h3>` unchanged).

- [ ] **Step 8: Commit**

```bash
git add lib/src/services/doc/documentation.service.ts lib/src/services/doc/documentation.service.test.ts lib/templates/monster.html
git commit -m "feat: render the adjustments header badge and per-card stat-grid"
```

---

### Task 3: Render Attacks/Traits/Abilities within each adjustment card

**Files:**
- Modify: `lib/src/services/doc/documentation.service.ts` (replace the three stubs from Task 2;
  extend `getCreatureSpell` and `getTraitItemHtml` with an optional highlight parameter)
- Test: `lib/src/services/doc/documentation.service.test.ts`

**Interfaces:**
- Consumes: `EffectiveAdjustment.equipped`/`.immunities`/`.memorized` (Task 1).
- Extends (backward-compatibly): `getCreatureSpell(ability, memorizedList, idPrefix, extraClass = "")`, `getTraitItemHtml(item, changed = false)` - existing call sites omit the new parameter and get byte-identical output to today.

- [ ] **Step 1: Write the failing tests**

Add to `lib/src/services/doc/documentation.service.test.ts`, inside the `describe("getCreatureHeader", ...)` block added in Task 2 (after its last test):

```ts
  it("shows the effective Attacks list, highlighting only the weapon the adjustment changed", () => {
    vi.spyOn(monsterFilesService, "getName").mockReturnValue(undefined);
    const originalItems = State.items;
    State.items = [{ file: "NEWWEAP", doc: true, description: "" }] as unknown as typeof State.items;
    const creature = fakeCreatureForAddCreature(false);
    creature.data.items.equipped = [
      { file: "OLDWEAP", slot: "WEAPON1" },
    ] as unknown as Creature["data"]["items"]["equipped"];
    creature.adjustments = [
      {
        files: ["SWAP"],
        noWeapon: false,
        summon: false,
        scriptName: false,
        data: {
          items: { equipped: [{ file: "NEWWEAP", slot: "WEAPON1" }], remove: [] },
        } as unknown as CreatureAdjustment["data"],
      },
    ] as unknown as Creature["adjustments"];
    const template = { text: "{{header}}" };

    documentationService.getCreatureHeader(template, creature);
    State.items = originalItems;

    expect(template.text).toContain('<div class="weapon adjustment-changed">');
  });

  it("omits a non-weapon equipped item (e.g. an internal trait-carrier) from the Attacks section", () => {
    vi.spyOn(monsterFilesService, "getName").mockReturnValue(undefined);
    const creature = fakeCreatureForAddCreature(false);
    creature.adjustments = [
      {
        files: ["KAHRK"],
        noWeapon: false,
        summon: false,
        scriptName: false,
        data: {
          items: { equipped: [{ file: "ja#i3", slot: "AMULET" }], remove: [] },
        } as unknown as CreatureAdjustment["data"],
      },
    ] as unknown as Creature["adjustments"];
    const template = { text: "{{header}}" };

    documentationService.getCreatureHeader(template, creature);

    expect(template.text).toContain('<div class="weapon">By weapon</div>');
    expect(template.text).not.toContain("ja#i3");
  });

  it("shows the full effective immunities list, highlighting only the newly granted ones", () => {
    vi.spyOn(monsterFilesService, "getName").mockReturnValue(undefined);
    const originalImmunities = State.immunities;
    State.immunities = [
      { name: "giant", type: "trait", stringRef: "common.traits.construct.name" },
      { name: "undead", type: "trait", stringRef: "common.traits.undead.name" },
    ] as unknown as typeof State.immunities;
    const creature = fakeCreatureForAddCreature(false);
    creature.data.immunities = ["giant"] as unknown as Creature["data"]["immunities"];
    creature.adjustments = [
      {
        files: ["KALDRAN"],
        noWeapon: false,
        summon: false,
        scriptName: false,
        data: { immunities: ["giant", "undead"] } as unknown as CreatureAdjustment["data"],
      },
    ] as unknown as Creature["adjustments"];
    const template = { text: "{{header}}" };

    documentationService.getCreatureHeader(template, creature);
    State.immunities = originalImmunities;

    expect(template.text).toContain('<a href="#giant" class="trait-link">');
    expect(template.text).toContain('<a href="#undead" class="trait-link adjustment-changed">');
  });

  it("shows the full effective Abilities list, highlighting only the spell whose count changed", () => {
    vi.spyOn(monsterFilesService, "getName").mockReturnValue(undefined);
    const originalSpells = State.spells;
    State.spells = [] as unknown as typeof State.spells;
    const creature = fakeCreatureForAddCreature(false);
    creature.behavior = {
      abilities: [{ name: "ability.test", resource: "SPPR101" } as unknown as CreatureAbility],
      customCodes: [],
    };
    creature.data.spells.memorized = [
      { file: "SPPR101", memorizedCount: 1 },
    ] as unknown as Creature["data"]["spells"]["memorized"];
    creature.adjustments = [
      {
        files: ["CASTER"],
        noWeapon: false,
        summon: false,
        scriptName: false,
        data: {
          spells: { memorized: [{ file: "SPPR101", memorizedCount: 3 }] },
        } as unknown as CreatureAdjustment["data"],
      },
    ] as unknown as Creature["adjustments"];
    const template = { text: "{{header}}" };

    documentationService.getCreatureHeader(template, creature);
    State.spells = originalSpells;

    expect(template.text).toContain('<div class="ability-entry adjustment-changed">');
    expect(template.text).toContain("3/day");
  });
```

Add the missing imports these tests need at the top of the file:

```ts
import { CreatureAdjustment } from "../../model/creature/adjustment";
```

(`CreatureAbility` is already imported.)

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/services/doc/documentation.service.test.ts`
Expected: FAIL - the Task 2 stubs return `""`, so none of the Attacks/Traits/Abilities assertions
find their markup.

- [ ] **Step 3: Extend `getCreatureSpell` and `getTraitItemHtml` with an optional highlight flag**

Change the `getCreatureSpell` signature and its two `ability-entry` return sites:

```ts
  getCreatureSpell(
    ability: CreatureAbility,
    memorizedList: MemorizedSpell[],
    idPrefix: string,
    extraClass = "",
  ) {
    const memorized = memorizedList.find((m) => m.file === ability.resource);
    const spell = State.spells.find((s) => s.file === ability.resource);
    let result = "";
    let popoverEntry = "";
    const infiniteUse = ability.infiniteUse ? 1 : undefined;
    if (spell && spell.doc && memorized) {
      const rounds = spell.options?.renew ?? infiniteUse;
      const quantity = this.getSpellQuantity(memorized.memorizedCount, rounds);
      const name = translationService.from(spell.name);
      const description =
        spell.doc !== "name" ? translationService.fromOptional(spell.description) : "";
      if (description) {
        const id = `${idPrefix}-desc`;
        popoverEntry = `<div class="spell-popover-entry" id="${id}" hidden>${this.buildDescriptionHtml(description.split(/\r\n|\n/))}</div>`;
        result = `<h5><a href="#${id}" class="trait-link">${name}</a> (${quantity})</h5>`;
      } else {
        result = `<h5>${name} (${quantity})</h5>`;
      }
    } else if (memorized) {
      const infiniteUseRounds = ability.timer ? ability.timer.value / 6 : 1;
      const quantity = ability.infiniteUse
        ? this.getSpellQuantity(1, infiniteUseRounds)
        : this.getSpellQuantity(memorized.memorizedCount);
      result = `<h5>${translationService.from(ability.name)} (${quantity})</h5>`;
    }
    if (!result) return "";
    const cls = extraClass ? `ability-entry ${extraClass}` : "ability-entry";
    return `<div class="${cls}">${result}</div>${popoverEntry}`;
  }
```

(Only the signature's new `extraClass = ""` parameter and the final two lines change - the body
above the `if (!result) return "";` line is unchanged from today, reproduced here for placement
context.)

Change `getTraitItemHtml`'s signature and return:

```ts
  private getTraitItemHtml(item: Item, changed = false): string {
    const traitLines = new Map<string, string>();
    for (const subName of item.immunities) {
      const sub = State.immunities.find((i) => i.name === subName);
      if (sub?.type === "trait" && sub.doc) {
        traitLines.set(translationService.fromOptional(sub.stringRef), sub.name);
      }
    }
    const lines = translationService.fromOptional(item.description).split(/\r\n|\n/);
    const html = lines
      .filter((line) => line !== "")
      .map((line) => {
        const traitName = traitLines.get(line);
        return traitName
          ? `<p><a href="#${traitName}" class="trait-link">${line}</a></p>`
          : `<p>${line}</p>`;
      })
      .join("");
    return changed ? `<div class="adjustment-changed">${html}</div>` : html;
  }
```

- [ ] **Step 4: Replace the three Task 2 stubs with real implementations**

```ts
  private getAdjustmentAttacks(
    creature: Creature,
    effective: EffectiveAdjustment,
    cardIndex: number,
  ): string {
    let attacks = "";
    let weaponIndex = 0;
    for (const { item, changed } of effective.equipped) {
      const weapon = itemService.isEquippedWeapon(item)
        ? State.items.find((i) => i.file === item.file)
        : undefined;
      if (!weapon?.doc) continue;
      const entries: { id: string; html: string }[] = [];
      const text = this.getAttackDisplayText(
        translationService.fromOptional(weapon.description),
        entries,
        `m${creature.id}-adj${cardIndex}-w${weaponIndex}`,
      );
      const cls = changed ? "weapon adjustment-changed" : "weapon";
      attacks += attacks ? "<hr/>" : "";
      attacks += `<div class="${cls}">${text}</div>`;
      attacks += entries
        .map((e) => `<div class="spell-popover-entry" id="${e.id}" hidden>${e.html}</div>`)
        .join("");
      weaponIndex++;
    }
    if (!attacks) attacks = `<div class="weapon">By weapon</div>`;
    return `<div class="detail-section"><h4>Attacks</h4>${attacks}</div>`;
  }

  // A flat one-branch-per-section builder mirroring getCreatureTraits' own shape (trait links,
  // then equipped trait-carrier items, then non-trait immunity descriptions) - same reasoning as
  // that method for not splitting further.
  // eslint-disable-next-line sonarjs/cognitive-complexity
  private getAdjustmentTraits(creature: Creature, effective: EffectiveAdjustment): string {
    let result = "";
    const resolved = effective.immunities
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      .filter(({ name }) => !creature.autoImmunities?.includes(name))
      .map(({ name, changed }) => ({
        config: State.immunities.find((i) => i.name === name),
        changed,
      }))
      .filter(
        (entry): entry is { config: ImmunityConfig; changed: boolean } =>
          entry.config !== undefined,
      );

    const traitLinks = resolved
      .filter((entry) => entry.config.type === "trait")
      .map((entry) => {
        const cls = entry.changed ? "trait-link adjustment-changed" : "trait-link";
        return `<a href="#${entry.config.name}" class="${cls}">${translationService.fromOptional(entry.config.stringRef)}</a>`;
      });
    if (traitLinks.length) result += `<h5>${traitLinks.join(", ")}</h5>`;

    for (const { item, changed } of effective.equipped) {
      const found = State.items.find((i) => i.file === item.file);
      if (found?.trait) result += this.getTraitItemHtml(found, changed);
    }

    for (const entry of resolved.filter((e) => e.config.type !== "trait")) {
      let text = translationService.fromOptional(entry.config.stringRef);
      if (entry.config.description) {
        const desc = translationService.from(entry.config.description);
        text = `<h5>${text}</h5>${this.buildDescriptionHtml(desc.split(/\r\n|\n/))}`;
      }
      result += entry.changed ? `<div class="adjustment-changed">${text}</div>` : text;
    }
    if (!result) return "";
    return `<div class="detail-section"><h4>Traits</h4><div class="traits">${result}</div></div>`;
  }

  private getAdjustmentSpells(
    creature: Creature,
    effective: EffectiveAdjustment,
    cardIndex: number,
  ): string {
    let spells = "";
    const memorizedList = effective.memorized.map((entry) => entry.spell);
    this.getResourceAbilities(creature).forEach((ability, index) => {
      const entry = effective.memorized.find((m) => m.spell.file === ability.resource);
      const extraClass = entry?.changed ? "adjustment-changed" : "";
      spells += this.getCreatureSpell(
        ability,
        memorizedList,
        `m${creature.id}-adj${cardIndex}-ability-${index}`,
        extraClass,
      );
    });
    if (!spells) return "";
    return `<h4>Abilities</h4><div class="abilities">${spells}</div>`;
  }
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/src/services/doc/documentation.service.test.ts`
Expected: PASS (all tests in the file, including every pre-existing `getCreatureSpell`/
`getCreatureTraits` test - `extraClass`/`changed` both default so those call sites are unaffected).

- [ ] **Step 6: Commit**

```bash
git add lib/src/services/doc/documentation.service.ts lib/src/services/doc/documentation.service.test.ts
git commit -m "feat: render Attacks/Traits/Abilities within each adjustment card"
```

---

### Task 4: CSS, full regeneration, and verification

**Files:**
- Modify: `mod/docs/monsters.css` (replace the old `.adjustments`/`.adjustment-list` rules from
  the superseded implementation)
- Regenerate: `mod/docs/monsters.html`

- [ ] **Step 1: Replace the old adjustments CSS**

In `mod/docs/monsters.css`, find and remove the three rules added by the superseded
implementation (`.adjustments summary`, `.adjustment-list`, `.adjustment-list li` - currently at
the end of the file). Replace them with:

```css

.creature-adjustments summary {
  cursor: pointer;
  list-style: none;
}

.creature-adjustments summary::-webkit-details-marker {
  display: none;
}

.creature-adjustments > summary {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-top: 0;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--color-gold);
}

.creature-adjustments > summary > span:first-child {
  font-family: var(--font-heading);
  color: var(--color-red);
  font-size: 1.17em;
}

.adjustments-badge {
  font-size: 0.75rem;
  font-family: var(--font-heading);
  color: var(--color-ink-soft);
  white-space: nowrap;
}

.adjustment-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 12px;
}

.adjustment-card {
  border: 1px solid var(--color-gold);
  border-radius: 5px;
  padding: 10px 14px;
  background: var(--color-bg);
}

.adjustment-card h4 {
  margin: 0 0 8px;
  font-size: 0.95rem;
  color: var(--color-red);
  border-bottom: 1px dashed var(--color-gold);
  padding-bottom: 4px;
}

.adjustment-card .stat-grid {
  font-size: 0.9em;
}

.adjustment-note {
  margin: 6px 0;
}

.adjustment-changed {
  font-weight: 700;
  background: rgba(139, 26, 26, 0.14);
  border-radius: 3px;
  padding: 1px 5px;
}
```

- [ ] **Step 2: Regenerate the real docs and manually verify**

Run: `npm run generate`

Open `mod/docs/monsters.html` in a browser (or search for the Ogre's, Skeleton's, and a Kryskel
family member's `id="m..."`) and confirm:

- The Ogre entry's header shows a badge; expanding it shows one card per effective adjustment
  group, each with a full stat-grid (every field shown, only the actually-different ones
  highlighted), the `BDSOGR1, BDSOGR2` card showing "uses his own weapon" where expected.
- The Skeleton's `KNIGHTSK` adjustment (if present) shows `KNIGHTSK — Undead Knight` in its card
  header.
- A Kryskel file's card (six different individually-named skeletons) shows the bare file list
  with no name suffix, since the six names disagree.
- A creature with no adjustments (e.g. a plain wolf) shows a plain name with no badge.

If anything looks wrong, fix it in the relevant Task 1/2/3 file and re-run `npm run generate`
before moving on - do not hand-edit `mod/docs/monsters.html` itself (it's build output).

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: PASS, no regressions in any other test file.

- [ ] **Step 4: Commit the CSS and the regenerated docs**

```bash
git add mod/docs/monsters.css
git commit -m "feat: style the adjustments header badge and per-card layout"
git add mod/docs/monsters.html
git commit -m "chore: regenerate docs with the full-stat-block adjustments panel"
```
