# Automatic Spell-Ability Ordering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hand-ordered `behavior.abilities` arrays with an automatic system: registry spells (`SPELLS`/`FNP_SPELLS`) are derived from `data.spells` and auto-ordered by a new canonical priority list; custom `addSpell`-created abilities are still hand-written but spliced in via position directives.

**Architecture:** A new `AbilityOrderService.resolve()` computes the final ordered `RawCreatureAbility[]` for a creature at validation time (after `setAdjustments` has run, since adjustments contribute to the memorized-spell union). `CreatureFactory.setBehavior` stores the new declarative form (`{ entries: [...] }`) without resolving it immediately; `CreatureFactory.validate` resolves it right before the existing `checkSpellAbilities` check. The legacy plain-array form is untouched except for a new duplicate check applied to both forms.

**Tech Stack:** TypeScript, Vitest.

## Global Constraints

- `setBehavior()` is always called before `setAdjustments()` for a given creature (verified across every creature file) — this is why resolution must be deferred to `validate()`, not done eagerly in `setBehavior()`.
- Any spell auto-derived from `data.spells` that is missing from `SPELL_PRIORITY_ORDER` is a build error (`logService.error`), not a silent skip.
- Two abilities with the same resolved spell file AND the same trigger/target signature is a build error (`logService.error`); same spell with a different trigger/target signature is allowed.
- The plain-array `abilities: [...]` form keeps working exactly as today and remains the intentional escape hatch for small (roughly &lt;5-ability) creatures.
- Every spell reachable via `this.preset(file)` already has an `ABILITY_PRESETS` entry (or the existing code would already throw `Unknown preset`) — so seeding `SPELL_PRIORITY_ORDER` from `ABILITY_PRESETS` is guaranteed to cover every spell currently used as an ability.

---

## Task 1: New ability-ordering types

**Files:**
- Modify: `lib/src/model/creature/ability.ts`
- Modify: `lib/src/model/creature/creature.ts`

**Interfaces:**
- Produces: `AbilityAnchor = SpellReference | number | string`, `AbilityEntry { spell?, abilityId?, insertBefore?, insertAfter?, insertFirst?, insertLast? }`, and `Creature.pendingAbilityEntries?: AbilityEntry[]` — all consumed by Tasks 4-8.

This task only adds new, unreferenced exports and an optional field, so nothing existing changes behavior. No test file — verified by typecheck only (there is no runtime logic yet to unit test).

- [ ] **Step 1: Add `AbilityAnchor` and `AbilityEntry` to `ability.ts`**

Add to `lib/src/model/creature/ability.ts` (add the import at the top, then the two types anywhere after the existing type/interface declarations):

```ts
import { SpellReference } from "../../../config/spells/spell-names";
```

```ts
export type AbilityAnchor = SpellReference | number | string;

export interface AbilityEntry {
  /**
   * A registry (SPELLS/FNP_SPELLS) spell: overrides its auto-derived position and/or config.
   * Exactly one of `spell`/`abilityId` must be set.
   */
  spell?: SpellReference;
  /**
   * A local Ids enum value for a custom addSpell-created ability, resolved via
   * creature.spell(id)/creature.ability(id). Exactly one of `spell`/`abilityId` must be set.
   */
  abilityId?: number;
  insertBefore?: AbilityAnchor;
  insertAfter?: AbilityAnchor;
  insertFirst?: true;
  insertLast?: true;
}
```

- [ ] **Step 2: Add `pendingAbilityEntries` to `Creature`**

In `lib/src/model/creature/creature.ts`, add to the imports:

```ts
import { AbilityEntry } from "./ability";
```

Add a new field on the `Creature` class, next to `valid?: boolean;`:

```ts
  valid?: boolean;
  pendingAbilityEntries?: AbilityEntry[];
```

- [ ] **Step 3: Typecheck**

Run: `npm run build`
Expected: exits with no errors (these are purely additive changes).

- [ ] **Step 4: Commit**

```bash
git add lib/src/model/creature/ability.ts lib/src/model/creature/creature.ts
git commit -m "feat: add AbilityEntry/AbilityAnchor types for auto-ordered abilities"
```

---

## Task 2: `SPELL_PRIORITY_ORDER` canonical list

**Files:**
- Create: `lib/config/spell-priority-order.ts`
- Test: `lib/config/spell-priority-order.test.ts`

**Interfaces:**
- Produces: `SPELL_PRIORITY_ORDER: string[]` — consumed by `AbilityOrderService` in Task 4+.

Seeded by flattening the existing `ABILITY_PRESETS` category arrays (`lib/config/presets/*.ts`) in a fixed category sequence: buffs/cure first (self-preparation), then crowd control (charm/confusion/disabling/hold/sleep/fear), then debuffs, then offense (damage/damage-aoe/death), then situational (dispel/summon) last. This is hand-tunable afterward by editing the array directly.

- [ ] **Step 1: Write the failing test**

Create `lib/config/spell-priority-order.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { SPELL_PRIORITY_ORDER } from "./spell-priority-order";
import { SPELLS } from "./spells/spell-names";

describe("SPELL_PRIORITY_ORDER", () => {
  it("is a non-empty list containing spells seeded from the ability presets", () => {
    expect(SPELL_PRIORITY_ORDER.length).toBeGreaterThan(0);
    expect(SPELL_PRIORITY_ORDER).toContain(SPELLS.Priest.Sanctuary.file);
    expect(SPELL_PRIORITY_ORDER).toContain(SPELLS.Priest.FingerOfDeath.file);
  });

  it("ranks buffs (e.g. Sanctuary) before death spells (e.g. Finger of Death)", () => {
    const buffIndex = SPELL_PRIORITY_ORDER.indexOf(SPELLS.Priest.Sanctuary.file);
    const deathIndex = SPELL_PRIORITY_ORDER.indexOf(SPELLS.Priest.FingerOfDeath.file);
    expect(buffIndex).toBeLessThan(deathIndex);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/config/spell-priority-order.test.ts`
Expected: FAIL — `Cannot find module './spell-priority-order'`.

- [ ] **Step 3: Create `spell-priority-order.ts`**

```ts
import { BUFF_PRESETS } from "./presets/buff-presets";
import { CURE_PRESETS } from "./presets/cure-presets";
import { CHARM_PRESETS } from "./presets/charm-presets";
import { CONFUSION_PRESETS } from "./presets/confusion-presets";
import { DISABLING_PRESETS } from "./presets/disabling-presets";
import { HOLD_PRESETS } from "./presets/hold-presets";
import { SLEEP_PRESETS } from "./presets/sleep-presets";
import { FEAR_PRESETS } from "./presets/fear-presets";
import { DEBUFF_PRESETS } from "./presets/debuff-presets";
import { DAMAGE_PRESETS } from "./presets/damage-presets";
import { DAMAGE_AOE_PRESETS } from "./presets/damage-aoe-presets";
import { DEATH_PRESETS } from "./presets/death-presets";
import { DISPEL_PRESETS } from "./presets/dispel-presets";
import { SUMMON_PRESETS } from "./presets/summon-presets";

// Hand-tune this list directly to change cast order - AbilityOrderService sorts every
// auto-derived registry-spell ability by each spell's index here.
export const SPELL_PRIORITY_ORDER: string[] = [
  ...BUFF_PRESETS,
  ...CURE_PRESETS,
  ...CHARM_PRESETS,
  ...CONFUSION_PRESETS,
  ...DISABLING_PRESETS,
  ...HOLD_PRESETS,
  ...SLEEP_PRESETS,
  ...FEAR_PRESETS,
  ...DEBUFF_PRESETS,
  ...DAMAGE_PRESETS,
  ...DAMAGE_AOE_PRESETS,
  ...DEATH_PRESETS,
  ...DISPEL_PRESETS,
  ...SUMMON_PRESETS,
].map((p) => p.preset);
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/config/spell-priority-order.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/config/spell-priority-order.ts lib/config/spell-priority-order.test.ts
git commit -m "feat: add SPELL_PRIORITY_ORDER canonical ability-ordering list"
```

---

## Task 3: `CreatureService.memorizedSpellFiles()`

**Files:**
- Modify: `lib/src/services/creature.service.ts`
- Test: `lib/src/services/creature.service.test.ts`

**Interfaces:**
- Consumes: existing private `getSpellGroups(creature: Creature): { label: string; files: string[] }[]`.
- Produces: `memorizedSpellFiles(creature: Creature): string[]` — the deduped union of every memorized spell file across `data.spells.memorized`, all `data.spells.spellbooks[]` variants, and every adjustment's memorized spells. Consumed by `AbilityOrderService` in Task 4.

- [ ] **Step 1: Write the failing test**

Add to `lib/src/services/creature.service.test.ts`, after the `checkSpellAbilities` describe block (reuses the existing `fakeSpellCreature` helper already defined in this file):

```ts
describe("memorizedSpellFiles", () => {
  it("returns the deduped union of default memorized, spellbook variants, and adjustment spells", () => {
    const creature = fakeSpellCreature({
      memorized: [{ file: "sppr101" }, { file: "sppr101" }],
      spellbooks: [{ mod: "FaithsAndPowers", memorized: [{ file: "sppr201" }] }],
      adjustmentsMemorized: [[{ file: "sppr301" }]],
    });
    expect(creatureService.memorizedSpellFiles(creature)).toEqual(["sppr101", "sppr201", "sppr301"]);
  });

  it("returns an empty array when nothing is memorized", () => {
    const creature = fakeSpellCreature({});
    expect(creatureService.memorizedSpellFiles(creature)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/src/services/creature.service.test.ts -t memorizedSpellFiles`
Expected: FAIL — `creatureService.memorizedSpellFiles is not a function`.

- [ ] **Step 3: Implement `memorizedSpellFiles`**

In `lib/src/services/creature.service.ts`, add this public method to `CreatureService` (e.g. right before the existing `checkSpellAbilities` method):

```ts
  memorizedSpellFiles(creature: Creature): string[] {
    return [...new Set(this.getSpellGroups(creature).flatMap((g) => g.files))];
  }
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/src/services/creature.service.test.ts -t memorizedSpellFiles`
Expected: PASS (2 tests).

- [ ] **Step 5: Run the full test file to check for regressions**

Run: `npx vitest run lib/src/services/creature.service.test.ts`
Expected: PASS, all tests (existing `checkSpellAbilities` tests untouched).

- [ ] **Step 6: Commit**

```bash
git add lib/src/services/creature.service.ts lib/src/services/creature.service.test.ts
git commit -m "feat: extract CreatureService.memorizedSpellFiles from getSpellGroups"
```

---

## Task 4: `AbilityOrderService.resolve()` — auto-derivation only

**Files:**
- Create: `lib/src/services/baf/ability-order.service.ts`
- Test: `lib/src/services/baf/ability-order.service.test.ts`

**Interfaces:**
- Consumes: `creatureService.memorizedSpellFiles(creature)` (Task 3), `SPELL_PRIORITY_ORDER` (Task 2).
- Produces: `abilityOrderService.resolve(creature: Creature): RawCreatureAbility[]` — consumed by Task 5 (extended), Task 6 (extended), and `CreatureFactory` in Task 8. This task ignores `creature.pendingAbilityEntries` entirely (ordered auto-derivation from `data.spells` only); Task 5 adds entries handling.

- [ ] **Step 1: Write the failing test**

Create `lib/src/services/baf/ability-order.service.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Creature } from "../../model/creature/creature";
import { MainCreatureData } from "../../model/creature/data";
import abilityOrderService from "./ability-order.service";
import { SPELL_PRIORITY_ORDER } from "../../../config/spell-priority-order";

function fakeCreature(p: { memorized?: { file: string }[] } = {}): Creature {
  const creature = new Creature(1);
  creature.name = "common.potion.use";
  creature.data = { spells: { memorized: p.memorized ?? [] } } as unknown as MainCreatureData;
  creature.adjustments = [];
  return creature;
}

describe("resolve", () => {
  it("orders memorized spells by their SPELL_PRIORITY_ORDER index", () => {
    SPELL_PRIORITY_ORDER.push("test-priority-a", "test-priority-b");
    try {
      const creature = fakeCreature({
        memorized: [{ file: "test-priority-b" }, { file: "test-priority-a" }],
      });
      expect(abilityOrderService.resolve(creature)).toEqual([
        { preset: "test-priority-a" },
        { preset: "test-priority-b" },
      ]);
    } finally {
      SPELL_PRIORITY_ORDER.pop();
      SPELL_PRIORITY_ORDER.pop();
    }
  });

  it("returns an empty array when nothing is memorized", () => {
    const creature = fakeCreature();
    expect(abilityOrderService.resolve(creature)).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/src/services/baf/ability-order.service.test.ts`
Expected: FAIL — `Cannot find module './ability-order.service'`.

- [ ] **Step 3: Implement `AbilityOrderService.resolve` (auto-derivation only)**

Create `lib/src/services/baf/ability-order.service.ts`:

```ts
import { SPELL_PRIORITY_ORDER } from "../../../config/spell-priority-order";
import { RawCreatureAbility } from "../../model/creature/ability";
import { Creature } from "../../model/creature/creature";
import creatureService from "../creature.service";

class AbilityOrderService {
  resolve(creature: Creature): RawCreatureAbility[] {
    const memorizedFiles = creatureService.memorizedSpellFiles(creature);
    return memorizedFiles
      .map((file) => ({ file, index: SPELL_PRIORITY_ORDER.indexOf(file) }))
      .filter(({ index }) => index !== -1)
      .sort((a, b) => a.index - b.index)
      .map(({ file }): RawCreatureAbility => ({ preset: file }));
  }
}

const abilityOrderService = new AbilityOrderService();
export default abilityOrderService;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/src/services/baf/ability-order.service.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/baf/ability-order.service.ts lib/src/services/baf/ability-order.service.test.ts
git commit -m "feat: add AbilityOrderService with auto-derived priority ordering"
```

---

## Task 5: `AbilityOrderService.resolve()` — entries (spell exceptions + custom abilities)

**Files:**
- Modify: `lib/src/services/baf/ability-order.service.ts`
- Modify: `lib/src/services/baf/ability-order.service.test.ts`

**Interfaces:**
- Consumes: `creature.pendingAbilityEntries?: AbilityEntry[]` (Task 1), `creature.spell(id)`/`creature.ability(id)` (existing `AbstractCreature` methods).
- Produces: `resolve()` now also honors `spell` exceptions (removed from the auto block, re-inserted per their own directive) and `abilityId` custom entries, via `insertFirst`/`insertLast`/`insertBefore`/`insertAfter`. Consumed unchanged by Task 6/8.

**Important identity rule:** an entry's position in the working list is tracked by an `identity` string — for a `spell` entry that's `spell.file`; for an `abilityId` entry that's `creature.spell(abilityId).file` (the custom spell's own generated file), **not** whatever file its resolved `ability.preset`/`ability.spell.resource` happens to reference. Several custom abilities in this codebase (e.g. `GreaterMummyFearAura` in `undead.ts`) borrow another spell's preset purely for its trigger/exclusion config while force-casting a different resource — using that borrowed value as the identity would make anchors silently fail to match.

- [ ] **Step 1: Write the failing tests**

Extend the `fakeCreature` helper and add tests to `lib/src/services/baf/ability-order.service.test.ts`. Add `AbilityEntry` to the existing `import { RawCreatureAbility } from "../../model/creature/ability";`-style import at the top of the file (there isn't one yet from Task 4 — add `import { AbilityEntry, RawCreatureAbility } from "../../model/creature/ability";`). Replace the existing `fakeCreature` function with:

```ts
function fakeCreature(
  p: {
    memorized?: { file: string }[];
    entries?: AbilityEntry[];
    customSpells?: { id: number; file: string; ability: RawCreatureAbility }[];
  } = {},
): Creature {
  const creature = new Creature(1);
  creature.name = "common.potion.use";
  creature.data = { spells: { memorized: p.memorized ?? [] } } as unknown as MainCreatureData;
  creature.adjustments = [];
  creature.pendingAbilityEntries = p.entries;
  creature.spells = (p.customSpells ?? []).map((s) => ({
    id: s.id,
    file: s.file,
    ability: s.ability,
  })) as unknown as Creature["spells"];
  return creature;
}
```

Add these tests inside the existing `describe("resolve", ...)` block:

```ts
  it("excludes a spell-exception's file from the auto block and inserts it via its own directive", () => {
    SPELL_PRIORITY_ORDER.push("test-priority-c", "test-priority-d");
    try {
      const creature = fakeCreature({
        memorized: [{ file: "test-priority-c" }, { file: "test-priority-d" }],
        entries: [{ spell: { file: "test-priority-d" }, insertFirst: true }],
      });
      expect(abilityOrderService.resolve(creature)).toEqual([
        { preset: "test-priority-d" },
        { preset: "test-priority-c" },
      ]);
    } finally {
      SPELL_PRIORITY_ORDER.pop();
      SPELL_PRIORITY_ORDER.pop();
    }
  });

  it("appends a custom abilityId entry at the end with insertLast", () => {
    const creature = fakeCreature({
      memorized: [],
      customSpells: [{ id: 7, file: "custom-spell-file", ability: { preset: "custom-ability-preset" } }],
      entries: [{ abilityId: 7, insertLast: true }],
    });
    expect(abilityOrderService.resolve(creature)).toEqual([{ preset: "custom-ability-preset" }]);
  });

  it("inserts a custom abilityId entry before a memorized spell via insertBefore", () => {
    SPELL_PRIORITY_ORDER.push("test-priority-e");
    try {
      const creature = fakeCreature({
        memorized: [{ file: "test-priority-e" }],
        customSpells: [
          { id: 9, file: "custom-spell-file-2", ability: { preset: "custom-ability-preset" } },
        ],
        entries: [{ abilityId: 9, insertBefore: "test-priority-e" }],
      });
      expect(abilityOrderService.resolve(creature)).toEqual([
        { preset: "custom-ability-preset" },
        { preset: "test-priority-e" },
      ]);
    } finally {
      SPELL_PRIORITY_ORDER.pop();
    }
  });

  it("resolves an insertAfter anchor pointing at a custom abilityId entry by its own spell file, not its ability's preset field", () => {
    SPELL_PRIORITY_ORDER.push("test-priority-h");
    try {
      const creature = fakeCreature({
        memorized: [{ file: "test-priority-h" }],
        customSpells: [
          // this custom ability's own generated file differs from what it actually casts
          // (preset borrows another spell's config) - the GreaterMummyFearAura pattern.
          { id: 13, file: "custom-spell-file-a", ability: { preset: "unrelated-borrowed-preset" } },
          { id: 14, file: "custom-spell-file-b", ability: { preset: "second-custom-preset" } },
        ],
        entries: [
          { abilityId: 13, insertFirst: true },
          { abilityId: 14, insertAfter: 13 },
        ],
      });
      expect(abilityOrderService.resolve(creature)).toEqual([
        { preset: "unrelated-borrowed-preset" },
        { preset: "second-custom-preset" },
        { preset: "test-priority-h" },
      ]);
    } finally {
      SPELL_PRIORITY_ORDER.pop();
    }
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/services/baf/ability-order.service.test.ts`
Expected: the 4 new tests FAIL (entries are currently ignored entirely by `resolve`), the 2 existing tests still PASS.

- [ ] **Step 3: Implement entries handling**

Replace the full contents of `lib/src/services/baf/ability-order.service.ts`:

```ts
import { SPELL_PRIORITY_ORDER } from "../../../config/spell-priority-order";
import { AbilityAnchor, AbilityEntry, RawCreatureAbility } from "../../model/creature/ability";
import { Creature } from "../../model/creature/creature";
import creatureService from "../creature.service";

interface OrderedAbility {
  identity: string;
  ability: RawCreatureAbility;
}

class AbilityOrderService {
  resolve(creature: Creature): RawCreatureAbility[] {
    const entries = creature.pendingAbilityEntries ?? [];
    const explicitFiles = new Set(
      entries.filter((e) => e.spell).map((e) => e.spell!.file),
    );
    const memorizedFiles = creatureService.memorizedSpellFiles(creature);
    const autoFiles = memorizedFiles.filter((file) => !explicitFiles.has(file));

    const ordered: OrderedAbility[] = autoFiles
      .map((file) => ({ identity: file, index: SPELL_PRIORITY_ORDER.indexOf(file) }))
      .filter(({ index }) => index !== -1)
      .sort((a, b) => a.index - b.index)
      .map(({ identity }): OrderedAbility => ({ identity, ability: { preset: identity } }));

    for (const entry of entries) {
      const identity = entry.spell ? entry.spell.file : creature.spell(entry.abilityId!).file;
      const ability: RawCreatureAbility = entry.spell
        ? { preset: entry.spell.file }
        : creature.ability(entry.abilityId!);
      this.splice(ordered, { identity, ability }, entry, creature);
    }

    return ordered.map((o) => o.ability);
  }

  private splice(
    ordered: OrderedAbility[],
    item: OrderedAbility,
    entry: AbilityEntry,
    creature: Creature,
  ): void {
    if (entry.insertFirst) {
      ordered.unshift(item);
      return;
    }
    const anchor = entry.insertBefore ?? entry.insertAfter;
    if (anchor === undefined) {
      ordered.push(item);
      return;
    }
    const anchorIdentity = this.resolveAnchor(anchor, creature);
    const anchorIndex = ordered.findIndex((o) => o.identity === anchorIdentity);
    ordered.splice(entry.insertBefore !== undefined ? anchorIndex : anchorIndex + 1, 0, item);
  }

  private resolveAnchor(anchor: AbilityAnchor, creature: Creature): string {
    if (typeof anchor === "number") return creature.spell(anchor).file;
    if (typeof anchor === "string") return anchor;
    return anchor.file;
  }
}

const abilityOrderService = new AbilityOrderService();
export default abilityOrderService;
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/src/services/baf/ability-order.service.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/baf/ability-order.service.ts lib/src/services/baf/ability-order.service.test.ts
git commit -m "feat: support spell/abilityId entries with position directives in AbilityOrderService"
```

---

## Task 6: `AbilityOrderService` — validation (missing spell, bad anchor, malformed entry)

**Files:**
- Modify: `lib/src/services/baf/ability-order.service.ts`
- Modify: `lib/src/services/baf/ability-order.service.test.ts`

**Interfaces:**
- Consumes: `logService.error` (`lib/src/services/log.service.ts`), `translationService.from` (`lib/src/services/translation.service.ts`).
- Produces: `resolve()` now logs an error and skips the ability when a memorized file is missing from `SPELL_PRIORITY_ORDER`; logs an error and appends at the end when an `insertBefore`/`insertAfter` anchor doesn't resolve; throws a plain `Error` when an entry sets neither/both of `spell`/`abilityId`, or more than one position directive.

- [ ] **Step 1: Write the failing tests**

Add to `lib/src/services/baf/ability-order.service.test.ts` (add `vi` and `logService` imports at the top: `import { describe, expect, it, vi } from "vitest";` and `import logService from "../log.service";`):

```ts
  it("errors and skips a memorized spell missing from SPELL_PRIORITY_ORDER", () => {
    const creature = fakeCreature({ memorized: [{ file: "not-in-priority-order" }] });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    expect(abilityOrderService.resolve(creature)).toEqual([]);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("not-in-priority-order"));
    errorSpy.mockRestore();
  });

  it("errors and appends at the end when an insertBefore anchor doesn't resolve", () => {
    const creature = fakeCreature({
      memorized: [],
      customSpells: [{ id: 20, file: "custom-file", ability: { preset: "custom-preset" } }],
      entries: [{ abilityId: 20, insertBefore: "does-not-exist" }],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    expect(abilityOrderService.resolve(creature)).toEqual([{ preset: "custom-preset" }]);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("does-not-exist"));
    errorSpy.mockRestore();
  });

  it("throws when an entry sets neither spell nor abilityId", () => {
    const creature = fakeCreature({ entries: [{ insertFirst: true }] });
    expect(() => abilityOrderService.resolve(creature)).toThrow(/exactly one/);
  });

  it("throws when an entry sets both spell and abilityId", () => {
    const creature = fakeCreature({
      entries: [{ spell: { file: "x" }, abilityId: 1, insertFirst: true }],
    });
    expect(() => abilityOrderService.resolve(creature)).toThrow(/exactly one/);
  });

  it("throws when an entry sets more than one position directive", () => {
    const creature = fakeCreature({
      entries: [{ spell: { file: "x" }, insertFirst: true, insertLast: true }],
    });
    expect(() => abilityOrderService.resolve(creature)).toThrow(/at most one/);
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/services/baf/ability-order.service.test.ts`
Expected: the 5 new tests FAIL (missing spells are silently dropped with no error today; a bad anchor produces `ordered.splice(-1, 0, item)`, corrupting order instead of erroring; malformed entries don't throw).

- [ ] **Step 3: Add validation**

In `lib/src/services/baf/ability-order.service.ts`, add imports:

```ts
import logService from "../log.service";
import translationService from "../translation.service";
```

Replace the `resolve` method:

```ts
  resolve(creature: Creature): RawCreatureAbility[] {
    const entries = creature.pendingAbilityEntries ?? [];
    this.validateEntries(entries);
    const explicitFiles = new Set(
      entries.filter((e) => e.spell).map((e) => e.spell!.file),
    );
    const memorizedFiles = creatureService.memorizedSpellFiles(creature);
    const autoFiles = memorizedFiles.filter((file) => !explicitFiles.has(file));

    const ordered: OrderedAbility[] = autoFiles
      .map((file) => ({ identity: file, index: SPELL_PRIORITY_ORDER.indexOf(file) }))
      .filter(({ identity, index }) => {
        if (index === -1) {
          logService.error(
            `${translationService.from(creature.name)}: spell '${identity}' is memorized but is missing from SPELL_PRIORITY_ORDER - add it there to auto-order this ability.`,
          );
        }
        return index !== -1;
      })
      .sort((a, b) => a.index - b.index)
      .map(({ identity }): OrderedAbility => ({ identity, ability: { preset: identity } }));

    for (const entry of entries) {
      const identity = entry.spell ? entry.spell.file : creature.spell(entry.abilityId!).file;
      const ability: RawCreatureAbility = entry.spell
        ? { preset: entry.spell.file }
        : creature.ability(entry.abilityId!);
      this.splice(ordered, { identity, ability }, entry, creature);
    }

    return ordered.map((o) => o.ability);
  }

  private validateEntries(entries: AbilityEntry[]): void {
    for (const entry of entries) {
      if ((entry.spell !== undefined) === (entry.abilityId !== undefined)) {
        throw new Error(
          `Ability entry must set exactly one of 'spell' or 'abilityId': ${JSON.stringify(entry)}`,
        );
      }
      const positions = [entry.insertBefore, entry.insertAfter, entry.insertFirst, entry.insertLast];
      if (positions.filter((p) => p !== undefined).length > 1) {
        throw new Error(
          `Ability entry must set at most one of insertBefore/insertAfter/insertFirst/insertLast: ${JSON.stringify(entry)}`,
        );
      }
    }
  }
```

Replace the `splice` method:

```ts
  private splice(
    ordered: OrderedAbility[],
    item: OrderedAbility,
    entry: AbilityEntry,
    creature: Creature,
  ): void {
    if (entry.insertFirst) {
      ordered.unshift(item);
      return;
    }
    const anchor = entry.insertBefore ?? entry.insertAfter;
    if (anchor === undefined) {
      ordered.push(item);
      return;
    }
    const anchorIdentity = this.resolveAnchor(anchor, creature);
    const anchorIndex = ordered.findIndex((o) => o.identity === anchorIdentity);
    if (anchorIndex === -1) {
      logService.error(
        `${translationService.from(creature.name)}: ability anchor '${anchorIdentity}' not found - appending '${item.identity}' at the end instead.`,
      );
      ordered.push(item);
      return;
    }
    ordered.splice(entry.insertBefore !== undefined ? anchorIndex : anchorIndex + 1, 0, item);
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/src/services/baf/ability-order.service.test.ts`
Expected: PASS (11 tests).

- [ ] **Step 5: Commit**

```bash
git add lib/src/services/baf/ability-order.service.ts lib/src/services/baf/ability-order.service.test.ts
git commit -m "feat: validate ability entries and error on missing priority-order/anchor lookups"
```

---

## Task 7: `CreatureService.checkDuplicateAbilities()`

**Files:**
- Modify: `lib/src/services/creature.service.ts`
- Modify: `lib/src/services/creature.service.test.ts`

**Interfaces:**
- Produces: `checkDuplicateAbilities(creature: Creature): void` — logs an error for two abilities in `creature.behavior.abilities` sharing the same resolved spell file (`resource`) and the same trigger/target signature. Consumed by `CreatureFactory.validate` in Task 8.

- [ ] **Step 1: Write the failing tests**

Add to `lib/src/services/creature.service.test.ts`, after the `memorizedSpellFiles` describe block. Add this helper near the existing `fakeAbility`/`fakeIdCastAbility` helpers:

```ts
function fakeFullAbility(
  resource: string | undefined,
  triggers: unknown[] = [],
  targets: unknown[] = [],
): CreatureAbility {
  return { resource, actions: [], triggers, targets } as unknown as CreatureAbility;
}
```

```ts
describe("checkDuplicateAbilities", () => {
  it("errors when two abilities share the same resource and the same trigger/target signature", () => {
    const creature = fakeSpellCreature({
      abilities: [fakeFullAbility("sppr101", [{ name: "Global" }]), fakeFullAbility("sppr101", [{ name: "Global" }])],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkDuplicateAbilities(creature);
    expect(errorSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining("sppr101"));
    errorSpy.mockRestore();
  });

  it("does not error when the same spell has a different trigger signature", () => {
    const creature = fakeSpellCreature({
      abilities: [
        fakeFullAbility("sppr101", [{ name: "Global" }]),
        fakeFullAbility("sppr101", [{ name: "SpellCastOnMe" }]),
      ],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkDuplicateAbilities(creature);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });

  it("does not error when abilities are all distinct", () => {
    const creature = fakeSpellCreature({
      abilities: [fakeFullAbility("sppr101"), fakeFullAbility("sppr102")],
    });
    const errorSpy = vi.spyOn(logService, "error").mockImplementation(() => {});
    creatureService.checkDuplicateAbilities(creature);
    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/services/creature.service.test.ts -t checkDuplicateAbilities`
Expected: FAIL — `creatureService.checkDuplicateAbilities is not a function`.

- [ ] **Step 3: Implement `checkDuplicateAbilities`**

Add to `lib/src/services/creature.service.ts`, next to `checkSpellAbilities`:

```ts
  checkDuplicateAbilities(creature: Creature): void {
    const seen = new Set<string>();
    for (const ability of creature.behavior.abilities) {
      const signature = JSON.stringify({
        resource: ability.resource,
        triggers: ability.triggers,
        targets: ability.targets,
      });
      if (seen.has(signature)) {
        const spellName = ability.resource ? spellService.getSpellName(ability.resource) : undefined;
        const spellText = spellName ? ` (${spellName})` : "";
        logService.error(
          `${translationService.from(creature.name)}: duplicate ability for '${ability.resource ?? ability.name}'${spellText} - the same spell and trigger context is listed twice.`,
        );
        continue;
      }
      seen.add(signature);
    }
  }
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/src/services/creature.service.test.ts -t checkDuplicateAbilities`
Expected: PASS (3 tests).

- [ ] **Step 5: Run the full test file to check for regressions**

Run: `npx vitest run lib/src/services/creature.service.test.ts`
Expected: PASS, all tests.

- [ ] **Step 6: Commit**

```bash
git add lib/src/services/creature.service.ts lib/src/services/creature.service.test.ts
git commit -m "feat: add CreatureService.checkDuplicateAbilities"
```

---

## Task 8: Wire `CreatureFactory.setBehavior` and `validate`

**Files:**
- Modify: `lib/src/model/creature/behavior.ts`
- Modify: `lib/src/factories/creature.factory.ts`
- Modify: `lib/src/factories/creature.factory.test.ts`

**Interfaces:**
- Consumes: `AbilityEntry` (Task 1), `abilityOrderService.resolve` (Task 6), `creatureService.checkDuplicateAbilities` (Task 7).
- Produces: `PartialCreatureBehavior.abilities` now accepts `{ entries: AbilityEntry[] }` as an alternative to the raw array; `CreatureFactory.resolvePendingAbilities(cre: Creature): void` (new, public, directly testable); `validate()` calls it before `checkSpellAbilities`, and calls `checkDuplicateAbilities` after.

This task must land as one commit: widening the `abilities` type and updating `setBehavior`'s body are inseparable for the build to typecheck (the existing `abilityService.getAbilities(behavior.abilities)` call only accepts an array).

- [ ] **Step 1: Write the failing tests**

Add to `lib/src/factories/creature.factory.test.ts`. Add imports at the top:

```ts
import abilityOrderService from "../services/baf/ability-order.service";
```

Add these describe blocks at the end of the file:

```ts
describe("setBehavior", () => {
  it("stores entries as pendingAbilityEntries without resolving them immediately", () => {
    const creature = fakeCreature();
    const entries = [{ spell: { file: "sppr101" }, insertFirst: true as const }];
    creatureFactory.setBehavior(creature, { abilities: { entries } });
    expect(creature.pendingAbilityEntries).toBe(entries);
    expect(creature.behavior.abilities).toEqual([]);
  });

  it("still resolves a plain array eagerly, unchanged from today", () => {
    const creature = fakeCreature();
    creatureFactory.setBehavior(creature, {
      abilities: [{ name: "common.potion.use", triggers: [], targets: [] }],
    });
    expect(creature.behavior.abilities).toHaveLength(1);
    expect(creature.pendingAbilityEntries).toBeUndefined();
  });
});

describe("resolvePendingAbilities", () => {
  it("does nothing when there are no pending entries", () => {
    const creature = fakeCreature();
    creature.behavior = { abilities: [] } as unknown as Creature["behavior"];
    creatureFactory.resolvePendingAbilities(creature);
    expect(creature.behavior.abilities).toEqual([]);
  });

  it("resolves pending entries via AbilityOrderService and appends them to behavior.abilities", () => {
    const creature = fakeCreature();
    creature.behavior = { abilities: [] } as unknown as Creature["behavior"];
    creature.pendingAbilityEntries = [{ spell: { file: "sppr101" }, insertFirst: true }];
    const resolveSpy = vi
      .spyOn(abilityOrderService, "resolve")
      .mockReturnValue([{ name: "common.potion.use", triggers: [], targets: [] }]);
    creatureFactory.resolvePendingAbilities(creature);
    expect(resolveSpy).toHaveBeenCalledWith(creature);
    expect(creature.behavior.abilities).toHaveLength(1);
    resolveSpy.mockRestore();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/src/factories/creature.factory.test.ts`
Expected: FAIL to even compile — `{ abilities: { entries } }` isn't assignable to `PartialCreatureBehavior` yet, and `resolvePendingAbilities` doesn't exist.

- [ ] **Step 3: Widen the `abilities` type**

In `lib/src/model/creature/behavior.ts`, add to the imports:

```ts
import { AbilityEntry, CreatureAbility, RawCreatureAbility, RawCreatureSequencerAbility } from "./ability";
```

(replacing the existing `CreatureAbility, RawCreatureAbility, RawCreatureSequencerAbility` import line). Replace `PartialCreatureBehavior`:

```ts
export type PartialCreatureBehavior = Omit<
  Partial<CreatureBehavior>,
  "abilities" | "customCodes"
> & {
  abilities?: (RawCreatureAbility | RawCreatureSequencerAbility)[] | { entries: AbilityEntry[] };
  customCodes?: PartialCustomCode[];
};
```

- [ ] **Step 4: Update `CreatureFactory.setBehavior` and `validate`**

In `lib/src/factories/creature.factory.ts`, add to the imports:

```ts
import abilityOrderService from "../services/baf/ability-order.service";
```

Replace `setBehavior`:

```ts
  setBehavior(cre: Creature, behavior: PartialCreatureBehavior) {
    this.checkValidation(cre);
    // behavior is a definite-assignment field (always set by the time a Creature is used), but
    // this is the method that does that first assignment - cre.behavior is genuinely undefined
    // here on a creature that hasn't had setBehavior called yet.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const current: CreatureBehavior = cre.behavior ?? structuredClone(BEHAVIOR_DEFAULT);
    // these four fields are pulled out only to exclude them from the `...others` spread below
    // (each is merged in separately via its own push()); the destructured names go unused.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { abilities, customCodes, additionalCodes, dialog, ...others } = behavior;
    cre.behavior = {
      ...current,
      ...others,
    };
    if (abilities && !Array.isArray(abilities)) {
      cre.pendingAbilityEntries = abilities.entries;
    } else {
      cre.behavior.abilities.push(...abilityService.getAbilities(abilities));
    }
    cre.behavior.customCodes.push(...abilityService.getCustomCodes(behavior.customCodes));
    cre.behavior.additionalCodes.push(...(behavior.additionalCodes ?? []));
    cre.behavior.dialog.push(...(behavior.dialog ?? []));
  }

  resolvePendingAbilities(cre: Creature): void {
    if (!cre.pendingAbilityEntries) return;
    cre.behavior.abilities.push(...abilityService.getAbilities(abilityOrderService.resolve(cre)));
  }
```

In `validate`, change:

```ts
    creatureService.check(creature);
    creatureService.checkSpellAbilities(creature);
    immunityService.handleImmunities(creature);
```

to:

```ts
    creatureService.check(creature);
    this.resolvePendingAbilities(creature);
    creatureService.checkSpellAbilities(creature);
    creatureService.checkDuplicateAbilities(creature);
    immunityService.handleImmunities(creature);
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run lib/src/factories/creature.factory.test.ts`
Expected: PASS, all tests.

- [ ] **Step 6: Run the full test suite and typecheck**

Run: `npm test`
Expected: PASS, no regressions across the whole suite.

Run: `npm run build`
Expected: exits with no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/src/model/creature/behavior.ts lib/src/factories/creature.factory.ts lib/src/factories/creature.factory.test.ts
git commit -m "feat: wire AbilityOrderService and duplicate-ability check into CreatureFactory"
```

---

## Task 9: Migrate Greater Mummy (`lib/creatures/undead.ts`)

**Files:**
- Modify: `lib/creatures/undead.ts:1847-1904`

**Interfaces:**
- Consumes: the full mechanism from Tasks 1-8.

This is the flagship case: three mod-conditional spellbooks (~25-30 spells each), currently one hand-ordered array of ~50 `this.preset(...)` calls covering their union.

- [ ] **Step 1: Replace the `abilities` array with auto-derivation**

In `lib/creatures/undead.ts`, find this block (as of this plan, `undead.ts:1847-1903`):

```ts
    greater.setBehavior({
      restHeal: true,
      abilities: [
        this.ability(Ids.GreaterMummyFearAura),
        this.preset(FNP_SPELLS.Priest.GreaterMalison.file),
        this.preset(SPELLS.Priest.Sanctuary.file),
        this.preset(SPELLS.Priest.FingerOfDeath.file),
        this.preset(SPELLS.Priest.Wither.file),
        this.preset(SPELLS.Priest.DolorousDecay.file),
        this.preset(SPELLS.Priest.Harm.file),
        this.preset(SPELLS.Priest.MagicResistance.file),
        this.preset(FNP_SPELLS.Priest.SummonShadows.file),
        this.preset(FNP_SPELLS.Priest.Chaos.file),
        this.preset(FNP_SPELLS.Priest.CloudOfPestilence.file),
        this.preset(SPELLS.Priest.MassCauseLightWounds.file),
        this.preset(FNP_SPELLS.Priest.Shades.file),
        this.preset(SPELLS.Priest.SlayLiving.file),
        this.preset(SPELLS.Priest.WavesOfAgony.file),
        this.preset(SPELLS.Priest.GreaterCommand.file),
        this.preset(FNP_SPELLS.Priest.Emotion.file),
        this.preset(SPELLS.Priest.Poison.file),
        this.preset(FNP_SPELLS.Priest.WavesOfFatigue.file),
        this.preset(FNP_SPELLS.Priest.DemiShadowMonsters.file),
        this.preset(FNP_SPELLS.Priest.CauseCriticalWounds.file),
        this.preset(FNP_SPELLS.Priest.AnimateDead.file),
        this.preset(SPELLS.Priest.AnimateDead.file),
        this.preset(FNP_SPELLS.Priest.CircleOfBones.file),
        this.preset(FNP_SPELLS.Priest.ShadowMonsters.file),
        this.preset(FNP_SPELLS.Priest.CauseSeriousWounds.file),
        this.preset(FNP_SPELLS.Priest.Shield.file),
        this.preset(SPELLS.Priest.SymbolDeath.file),
        this.preset(SPELLS.Priest.AerialServant.file),
        this.preset(SPELLS.Priest.BladeBarrier.file),
        this.preset(SPELLS.Priest.TrueSeeing.file),
        this.preset(SPELLS.Priest.RighteousMagic.file),
        this.preset(SPELLS.Priest.FlameStrike.file),
        this.preset(SPELLS.Priest.HolyPower.file),
        this.preset(SPELLS.Priest.MentalDomination.file),
        this.preset(SPELLS.Priest.DrawUponHolyMight.file),
        this.preset(SPELLS.Priest.ProtectionFromLightning.file),
        this.preset(SPELLS.Priest.Bless.file),
        this.preset(SPELLS.Priest.Chant.file),
        this.preset(SPELLS.Priest.Silence.file),
        this.preset(SPELLS.Priest.HoldPerson.file),
        this.preset(SPELLS.Priest.DispelMagic.file),
        this.preset(SPELLS.Priest.UnholyBlight.file),
        this.preset(SPELLS.Priest.GlyphOfWarding.file),
        this.preset(SPELLS.Priest.CauseSeriousWounds.file),
        this.preset(FNP_SPELLS.Priest.RigidThinking.file),
        this.preset(FNP_SPELLS.Priest.Forbiddance.file),
        this.preset(FNP_SPELLS.Priest.Shatter.file),
        this.preset(FNP_SPELLS.Priest.CauseDisease.file),
        this.preset(FNP_SPELLS.Priest.Doom.file),
        this.preset(SPELLS.Priest.Command.file),
      ],
      dialog: ["mumgre01"],
    });
```

Replace it with:

```ts
    greater.setBehavior({
      restHeal: true,
      abilities: {
        entries: [{ abilityId: Ids.GreaterMummyFearAura, insertFirst: true }],
      },
      dialog: ["mumgre01"],
    });
```

Every `this.preset(SPELLS.X.file)` / `this.preset(FNP_SPELLS.X.file)` entry that was previously hand-listed is now derived automatically from the union of the three `data.spells.spellbooks` variants already defined earlier in `greaterMummy()` (lines 1683-1815) — none of it needs to be restated. `GreaterMummyFearAura` is the one exception: it's a custom `addSpell`-created ability (created via `createMummyFearAura(true)`, `undead.ts:746-801`), not part of any memorized spellbook, so it still needs an explicit `entries` item — `insertFirst: true` matches its current position at the front of the array.

- [ ] **Step 2: Typecheck**

Run: `npm run build`
Expected: exits with no errors.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: PASS, no regressions.

- [ ] **Step 4: Run the generator and verify no new errors/warnings for Greater Mummy**

Run: `npm run atweaks`
Expected: the run completes (no `process.exit(1)`, no "Generator finished with errors" message). Search `generator.log` for "Greater Mummy" / "mumgre" and confirm there are no new error or warning lines compared to a run against the pre-migration code (in particular: no "missing from SPELL_PRIORITY_ORDER" errors, confirming every spell across all three spellbook variants was already covered by the `ABILITY_PRESETS`-seeded list from Task 2, and no duplicate-ability errors).

- [ ] **Step 5: Commit**

```bash
git add lib/creatures/undead.ts
git commit -m "refactor: auto-derive Greater Mummy's abilities from its spellbooks"
```

---

## Task 10: Migrate the rest of `lib/creatures/undead.ts`

**Files:**
- Modify: `lib/creatures/undead.ts` (every other `setBehavior` call with an `abilities:` array — as of this plan, roughly 20 more call sites beyond Greater Mummy)

**Interfaces:**
- Consumes: the mechanism from Tasks 1-8, and the Greater Mummy conversion in Task 9 as the worked pattern to follow.

**Conversion rule** (apply per `setBehavior` call in this file that has an `abilities:` array):

1. Find the creature's `data.spells.memorized` and every `data.spells.spellbooks[].memorized` entry (if any).
2. Any ability in the current array that is `this.preset(X.file)` where `X.file` also appears in one of those memorized lists → **delete it**; it will be auto-derived. If it's missing from `SPELL_PRIORITY_ORDER`, add it there in a sensible category-consistent position (follow the seeded category order from Task 2) rather than leaving it to error.
3. Any ability that is `this.preset(X.file)` where `X.file` is **not** memorized anywhere for this creature, or that is `this.ability(Ids.X)` (a custom `addSpell`-created ability) → **keep it**, rewritten as an `entries` item:
   - `this.preset(X.file)` → `{ spell: X, insertBefore/insertAfter/insertFirst/insertLast: ... }` (rare — only for a registry spell whose default priority-order position needs a deliberate override).
   - `this.ability(Ids.X)` → `{ abilityId: Ids.X, insertBefore/insertAfter/insertFirst/insertLast: ... }`.
   - Preserve the original relative ordering intent: if the ability was first in the array, use `insertFirst: true`; if last, `insertLast: true`; if adjacent to a specific spell that's staying in the array, use `insertBefore`/`insertAfter` pointing at that spell's `SpellReference` (or the neighboring custom ability's `Ids` value).
4. If, after this, the `entries` list would be empty and every ability in the original array was auto-derivable, replace `abilities: [...]` with `abilities: { entries: [] }` only if the creature also has memorized spells (otherwise leave `abilities` unset entirely, matching how creatures with no abilities already omit the field).
5. If the original array has fewer than 5 abilities and none of them reference a memorized/spellbook spell (i.e., nothing would be auto-derived, purely custom `addSpell` abilities with no natural priority-order anchor), it is acceptable to leave it as the plain array form — it now gets duplicate-checked automatically per Task 7. Don't force a conversion that adds no value.

- [ ] **Step 1: Apply the conversion rule to every remaining `setBehavior` call with an `abilities:` array in `lib/creatures/undead.ts`**

- [ ] **Step 2: Typecheck**

Run: `npm run build`
Expected: exits with no errors.

- [ ] **Step 3: Run the full test suite**

Run: `npm test`
Expected: PASS, no regressions.

- [ ] **Step 4: Run the generator and verify no new errors/warnings**

Run: `npm run atweaks`
Expected: run completes successfully; `generator.log` shows no new errors or warnings for any undead creature compared to the pre-migration baseline.

- [ ] **Step 5: Commit**

```bash
git add lib/creatures/undead.ts
git commit -m "refactor: auto-derive abilities for the remaining undead creatures"
```

---

## Task 11: Migrate `lib/creatures/ogres.ts`

**Files:**
- Modify: `lib/creatures/ogres.ts` (6 `setBehavior` calls with `abilities:` arrays, combined with `memorized`/`spellbooks` usage)

**Interfaces:**
- Consumes: the mechanism from Tasks 1-8, applying the identical conversion rule defined in Task 10, Step "Conversion rule".

- [ ] **Step 1: Apply the Task 10 conversion rule to every `setBehavior` call with an `abilities:` array in `lib/creatures/ogres.ts`**
- [ ] **Step 2: Typecheck** — Run: `npm run build` — Expected: no errors.
- [ ] **Step 3: Run the full test suite** — Run: `npm test` — Expected: PASS, no regressions.
- [ ] **Step 4: Run the generator and verify no new errors/warnings** — Run: `npm run atweaks` — Expected: run completes successfully; `generator.log` shows no new errors/warnings for any ogre creature.
- [ ] **Step 5: Commit**

```bash
git add lib/creatures/ogres.ts
git commit -m "refactor: auto-derive abilities for ogre creatures"
```

---

## Task 12: Migrate `lib/creatures/spiders.ts`

**Files:**
- Modify: `lib/creatures/spiders.ts` (8 `setBehavior` calls with `abilities:` arrays)

**Interfaces:**
- Consumes: the Task 10 conversion rule.

- [ ] **Step 1: Apply the Task 10 conversion rule to every `setBehavior` call with an `abilities:` array in `lib/creatures/spiders.ts`**
- [ ] **Step 2: Typecheck** — Run: `npm run build` — Expected: no errors.
- [ ] **Step 3: Run the full test suite** — Run: `npm test` — Expected: PASS, no regressions.
- [ ] **Step 4: Run the generator and verify no new errors/warnings** — Run: `npm run atweaks` — Expected: run completes successfully; `generator.log` shows no new errors/warnings for any spider creature.
- [ ] **Step 5: Commit**

```bash
git add lib/creatures/spiders.ts
git commit -m "refactor: auto-derive abilities for spider creatures"
```

---

## Task 13: Migrate `lib/creatures/feys.ts`

**Files:**
- Modify: `lib/creatures/feys.ts` (4 `setBehavior` calls with `abilities:` arrays)

**Interfaces:**
- Consumes: the Task 10 conversion rule. Note: `feys.ts` also uses the `insertBefore`/`insertAfter` `CustomCode` mechanism (`lib/src/model/script/script.ts`'s `CustomCodeType`, at `feys.ts:194/318/654`) — that is a different, unrelated mechanism (splicing raw statements around fixed script *stages*) and is out of scope; do not touch `customCodes` blocks.

- [ ] **Step 1: Apply the Task 10 conversion rule to every `setBehavior` call's top-level `abilities:` array in `lib/creatures/feys.ts` (leave `customCodes[].abilities` untouched)**
- [ ] **Step 2: Typecheck** — Run: `npm run build` — Expected: no errors.
- [ ] **Step 3: Run the full test suite** — Run: `npm test` — Expected: PASS, no regressions.
- [ ] **Step 4: Run the generator and verify no new errors/warnings** — Run: `npm run atweaks` — Expected: run completes successfully; `generator.log` shows no new errors/warnings for any fey creature.
- [ ] **Step 5: Commit**

```bash
git add lib/creatures/feys.ts
git commit -m "refactor: auto-derive abilities for fey creatures"
```

---

## Task 14: Migrate `lib/creatures/slimes.ts`

**Files:**
- Modify: `lib/creatures/slimes.ts` (9 `setBehavior` calls with `abilities:` arrays)

**Interfaces:**
- Consumes: the Task 10 conversion rule.

- [ ] **Step 1: Apply the Task 10 conversion rule to every `setBehavior` call with an `abilities:` array in `lib/creatures/slimes.ts`**
- [ ] **Step 2: Typecheck** — Run: `npm run build` — Expected: no errors.
- [ ] **Step 3: Run the full test suite** — Run: `npm test` — Expected: PASS, no regressions.
- [ ] **Step 4: Run the generator and verify no new errors/warnings** — Run: `npm run atweaks` — Expected: run completes successfully; `generator.log` shows no new errors/warnings for any slime/pudding/jelly creature.
- [ ] **Step 5: Commit**

```bash
git add lib/creatures/slimes.ts
git commit -m "refactor: auto-derive abilities for slime creatures"
```

---

## Task 15: Migrate `lib/creatures/golems.ts`

**Files:**
- Modify: `lib/creatures/golems.ts` (7 `setBehavior` calls with `abilities:` arrays)

**Interfaces:**
- Consumes: the Task 10 conversion rule.

- [ ] **Step 1: Apply the Task 10 conversion rule to every `setBehavior` call with an `abilities:` array in `lib/creatures/golems.ts`**
- [ ] **Step 2: Typecheck** — Run: `npm run build` — Expected: no errors.
- [ ] **Step 3: Run the full test suite** — Run: `npm test` — Expected: PASS, no regressions.
- [ ] **Step 4: Run the generator and verify no new errors/warnings** — Run: `npm run atweaks` — Expected: run completes successfully; `generator.log` shows no new errors/warnings for any golem creature.
- [ ] **Step 5: Commit**

```bash
git add lib/creatures/golems.ts
git commit -m "refactor: auto-derive abilities for golem creatures"
```

---

## Task 16: Migrate `lib/creatures/constructs.ts`

**Files:**
- Modify: `lib/creatures/constructs.ts` (4 `setBehavior` calls with `abilities:` arrays)

**Interfaces:**
- Consumes: the Task 10 conversion rule. Note: like `feys.ts`, this file also uses `insertBefore`/`insertAfter`/`replace` `CustomCode` at `constructs.ts:159` — unrelated mechanism, out of scope, leave `customCodes` untouched.

- [ ] **Step 1: Apply the Task 10 conversion rule to every `setBehavior` call's top-level `abilities:` array in `lib/creatures/constructs.ts` (leave `customCodes[].abilities` untouched)**
- [ ] **Step 2: Typecheck** — Run: `npm run build` — Expected: no errors.
- [ ] **Step 3: Run the full test suite** — Run: `npm test` — Expected: PASS, no regressions.
- [ ] **Step 4: Run the generator and verify no new errors/warnings** — Run: `npm run atweaks` — Expected: run completes successfully; `generator.log` shows no new errors/warnings for any construct creature.
- [ ] **Step 5: Commit**

```bash
git add lib/creatures/constructs.ts
git commit -m "refactor: auto-derive abilities for construct creatures"
```

---

## Task 17: Migrate `lib/creatures/bears.ts`

**Files:**
- Modify: `lib/creatures/bears.ts` (4 `setBehavior` calls with `abilities:` arrays)

**Interfaces:**
- Consumes: the Task 10 conversion rule. Note: this file also uses `insertBefore`/`insertAfter` `CustomCode` at `bears.ts:443/482/515` — unrelated mechanism, out of scope, leave `customCodes` untouched.

- [ ] **Step 1: Apply the Task 10 conversion rule to every `setBehavior` call's top-level `abilities:` array in `lib/creatures/bears.ts` (leave `customCodes[].abilities` untouched)**
- [ ] **Step 2: Typecheck** — Run: `npm run build` — Expected: no errors.
- [ ] **Step 3: Run the full test suite** — Run: `npm test` — Expected: PASS, no regressions.
- [ ] **Step 4: Run the generator and verify no new errors/warnings** — Run: `npm run atweaks` — Expected: run completes successfully; `generator.log` shows no new errors/warnings for any bear creature.
- [ ] **Step 5: Commit**

```bash
git add lib/creatures/bears.ts
git commit -m "refactor: auto-derive abilities for bear creatures"
```

---

## Task 18: Review the custom-ability-only files against the new duplicate check

**Files:**
- Review (no `data.spells` usage, so no auto-derivation applies): `lib/creatures/ankhegs.ts`, `lib/creatures/minotaurs.ts`, `lib/creatures/dogs.ts`, `lib/creatures/basilisks.ts`, `lib/creatures/wolves.ts`, `lib/creatures/ettin.ts`

**Interfaces:**
- Consumes: `creatureService.checkDuplicateAbilities` (Task 7), applied automatically to every creature (both forms) once Task 8 landed — no code change is required for this to take effect.

These 6 files' `abilities:` arrays are all custom `addSpell`/attack-effect abilities with no `data.spells.memorized`/`spellbooks` usage (confirmed: none of them appear in the "files using `memorized:`" set) — so `SPELL_PRIORITY_ORDER`-based auto-derivation doesn't apply to them, and per the Global Constraints, arrays this small are the intended use of the plain-array escape hatch. This task is a verification pass, not a rewrite: the new duplicate-ability check (Task 7) already runs against every creature's `behavior.abilities` regardless of which form it's declared in, so simply running the generator confirms none of these files' arrays contain an accidental duplicate that went unnoticed before this check existed.

- [ ] **Step 1: Run the generator**

Run: `npm run atweaks`
Expected: run completes successfully.

- [ ] **Step 2: Check for new duplicate-ability errors in these 6 files' creatures**

Search `generator.log` for `"duplicate ability"`. Expected: no matches for any creature defined in `ankhegs.ts`, `minotaurs.ts`, `dogs.ts`, `basilisks.ts`, `wolves.ts`, or `ettin.ts`.

- [ ] **Step 3: If a duplicate is found**

Fix it directly in the relevant file (remove the redundant entry, or if the two abilities are meant to have different trigger contexts, adjust one so its `triggers`/`targets` genuinely differ) and re-run Step 1.

- [ ] **Step 4: If no changes were needed, note it — no commit required for this task**

If Step 3 wasn't needed, this task produces no diff; nothing to commit.

---

## Self-Review Notes

- **Spec coverage:** `SPELL_PRIORITY_ORDER` (Task 2), `AbilityEntry`/`insertBefore`/`insertAfter`/`insertFirst`/`insertLast` (Tasks 1, 5), auto-derivation from `data.spells` (Tasks 3-4), deferred resolution at validate-time (Task 8), duplicate-check with same-spell-different-trigger allowed (Task 7), missing-from-priority-list validation (Task 6), legacy plain-array escape hatch preserved (Task 8, unchanged branch + Task 18's explicit non-conversion), full 15-file migration minus the `common.ts` false positive found during planning (`common.ts`'s only `abilities:` match is an unrelated empty-array `CustomCode` template constant, not a creature spellbook — Tasks 9-18 cover the real 14 files) — all covered.
- **Placeholder scan:** no TBD/TODO; Tasks 10-17 intentionally state a mechanical rule instead of a pre-written diff (per the explicitly agreed migration-scope decision), but the rule itself, its acceptance criteria, and every command are fully specified — not vague.
- **Type consistency:** `AbilityEntry`/`AbilityAnchor` (Task 1) → consumed identically in Tasks 5, 6, 8; `resolve(creature: Creature): RawCreatureAbility[]` signature is identical across Tasks 4, 5, 6, and its Task 8 call site; `memorizedSpellFiles(creature: Creature): string[]` (Task 3) signature matches its Task 4 call site; `resolvePendingAbilities(cre: Creature): void` (Task 8) name matches its `validate()` call site.
