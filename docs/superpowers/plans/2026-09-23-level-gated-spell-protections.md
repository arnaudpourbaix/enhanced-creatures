# Level-Gated Spell Protections Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let any level-based global protection (Minor Globe, Globe of Invulnerability, Spell Deflection, Spell Turning, Spell Immunity, Shield of the Archons, and any future one) automatically skip an immune target for every attack spell, using the engine's native `ImmuneToSpellLevel` trigger driven by the spell's own level - no per-spell or per-protection hand-tagging.

**Architecture:** `SpellReference.level` gets backfilled from real spell.ids data (the CSVs in `assets/spells/`). `RawCreatureAbility` gains a parallel `level` field, auto-resolved from the matching `SPELLS` entry the same way `keywords` already is (explicit override always wins). `AbilityService.appendSpellCheckTriggers` appends `ImmuneToSpellLevel(target, level)` to every target list whenever a level is known, independently of the existing `SpellKeyword` system. The ~35 preset call sites hand-writing a `MINORGLOBE` stat check become redundant and are removed.

**Tech Stack:** TypeScript, the TS Compiler API (for the one-off data-backfill codemod), vitest.

**Spec:** `docs/superpowers/specs/2026-09-23-level-gated-spell-protections-design.md`

## Global Constraints

- This mechanism is independent of `SpellKeyword`/`SPELL_CHECK_TRIGGERS`/`SPELL_CHECK_CONFIG_KEYWORDS` - no keyword is added for it, per the spec's Non-goals.
- The new `ImmuneToSpellLevel` check is gated by `GLOBAL_CONFIG.spellChecks.spellProtections` (reuse the existing toggle, don't add a new one).
- `dispel-presets.ts:68`'s `checkStatGT(0, "MINORGLOBE")` (no negation, dispel-target selection, not "avoid an immune target") is a different semantic and must NOT be touched by this plan.
- Every preset file edited must still pass `npx tsc --noEmit`, `npx eslint <file>`, and `npx prettier --check <file>` afterward.
- Commit after each task, per the project's established pattern (see recent commits on `new-spell-system`), ending every commit message with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

---

### Task 1: Backfill `SpellReference.level` from the spell CSVs

**Files:**
- Create (temporary, deleted at the end of this task): `scripts/tmp-add-spell-level.ts`
- Modify: `lib/config/spells/spell-database.ts` (every `WIZARD_SPELLS`/`PRIEST_SPELLS`/`INNATE_SPELLS`/`CLASS_SPELLS` entry gains a `level` field where a confident match exists)

**Interfaces:**
- Consumes: `assets/spells/001_vanilla.csv`, `002_spell_rev.csv`, `003_stratagems_iwd.csv`, `004_stratagems_newspells.csv` (each `file;level;type;ids;name`, semicolon-delimited, header row first).
- Produces: `SpellReference.level: number` populated on the `SPELLS` entries later tasks depend on (see the exact list in Task 6-13's verification steps).

- [ ] **Step 1: Write the codemod script**

Create `scripts/tmp-add-spell-level.ts`:

```typescript
import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";

const ROOT = path.resolve(__dirname, "..");
const SPELL_DB_PATH = path.join(ROOT, "lib/config/spells/spell-database.ts");
const CSV_PATHS = [
  "assets/spells/001_vanilla.csv",
  "assets/spells/002_spell_rev.csv",
  "assets/spells/003_stratagems_iwd.csv",
  "assets/spells/004_stratagems_newspells.csv",
];

interface CsvRow {
  level: number;
  name: string;
}

function parseCsv(relPath: string): Map<string, CsvRow> {
  const text = fs.readFileSync(path.join(ROOT, relPath), "utf8");
  const map = new Map<string, CsvRow>();
  for (const line of text.split(/\r?\n/).slice(1)) {
    if (!line.trim()) continue;
    const [file, level, , , name] = line.split(";");
    if (file && level) {
      map.set(file.trim().toUpperCase(), {
        level: Number(level.trim()),
        name: (name ?? "").trim(),
      });
    }
  }
  return map;
}

const csvMaps = CSV_PATHS.map(parseCsv);

function normalizeWords(text: string): string[] {
  return text
    .replace(/([a-z])([A-Z])/g, "$1 $2") // split camelCase
    .toLowerCase()
    .replace(/[^a-z\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length >= 4);
}

/**
 * True when `key` (a SPELLS entry's own property name, e.g. "ObscuringMist") and a CSV row's
 * spell name plausibly refer to the same spell - shares at least one word of 4+ letters. Guards
 * against a file code that means a different spell under a different CSV/game (e.g. SPWI228 is
 * Darkness 15' Radius in this SPELLS entry, but Decastave in the Stratagems IWD spell list).
 */
function namesLikelyMatch(key: string, csvName: string): boolean {
  const keyWords = normalizeWords(key);
  const csvWords = normalizeWords(csvName);
  return keyWords.some((w) => csvWords.includes(w));
}

function resolveLevel(key: string, file: string): number | undefined {
  const upper = file.toUpperCase();
  for (const map of csvMaps) {
    const row = map.get(upper);
    if (row && namesLikelyMatch(key, row.name)) return row.level;
  }
  return undefined;
}

function unwrapObjectLiteral(node: ts.Expression): ts.ObjectLiteralExpression | undefined {
  if (ts.isObjectLiteralExpression(node)) return node;
  if (ts.isSatisfiesExpression(node) || ts.isAsExpression(node)) {
    return unwrapObjectLiteral(node.expression);
  }
  return undefined;
}

function findProp(
  obj: ts.ObjectLiteralExpression,
  name: string,
): ts.PropertyAssignment | undefined {
  return obj.properties.find(
    (p): p is ts.PropertyAssignment =>
      ts.isPropertyAssignment(p) && ts.isIdentifier(p.name) && p.name.text === name,
  );
}

function getStringProp(obj: ts.ObjectLiteralExpression, name: string): string | undefined {
  const prop = findProp(obj, name);
  return prop && ts.isStringLiteral(prop.initializer) ? prop.initializer.text : undefined;
}

const source = fs.readFileSync(SPELL_DB_PATH, "utf8");
const sourceFile = ts.createSourceFile(SPELL_DB_PATH, source, ts.ScriptTarget.Latest, true);

interface Insertion {
  position: number;
  text: string;
}
const insertions: Insertion[] = [];
const skipped: string[] = [];
let updated = 0;

function visitEntry(key: string, entry: ts.ObjectLiteralExpression) {
  if (findProp(entry, "level")) return;
  const file = getStringProp(entry, "file");
  if (!file) return;
  let level = resolveLevel(key, file);
  if (level === undefined) {
    const variantsProp = findProp(entry, "variants");
    if (variantsProp && ts.isArrayLiteralExpression(variantsProp.initializer)) {
      for (const el of variantsProp.initializer.elements) {
        if (ts.isObjectLiteralExpression(el)) {
          const variantFile = getStringProp(el, "file");
          if (variantFile) {
            level = resolveLevel(key, variantFile);
            if (level !== undefined) break;
          }
        }
      }
    }
  }
  if (level === undefined) {
    skipped.push(`${key} (${file})`);
    return;
  }
  const anchor = findProp(entry, "id") ?? findProp(entry, "file");
  if (!anchor) return;
  insertions.push({ position: anchor.getEnd(), text: `, level: ${level}` });
  updated++;
}

function visit(node: ts.Node) {
  if (
    ts.isVariableDeclaration(node) &&
    node.initializer &&
    ts.isIdentifier(node.name) &&
    /_SPELLS$/.test(node.name.text)
  ) {
    const obj = unwrapObjectLiteral(node.initializer);
    if (obj) {
      for (const prop of obj.properties) {
        if (
          ts.isPropertyAssignment(prop) &&
          ts.isIdentifier(prop.name) &&
          ts.isObjectLiteralExpression(prop.initializer)
        ) {
          visitEntry(prop.name.text, prop.initializer);
        }
      }
    }
  }
  ts.forEachChild(node, visit);
}
visit(sourceFile);

insertions.sort((a, b) => b.position - a.position);
let output = source;
for (const { position, text } of insertions) {
  output = output.slice(0, position) + text + output.slice(position);
}
fs.writeFileSync(SPELL_DB_PATH, output);

console.log(`Backfilled level on ${updated} entries.`);
console.log(`Skipped ${skipped.length} entries with no confident CSV match:`);
for (const s of skipped) console.log(`  - ${s}`);
```

- [ ] **Step 2: Run the codemod**

Run: `npx ts-node scripts/tmp-add-spell-level.ts`

Expected: prints `Backfilled level on N entries.` followed by a `Skipped ...` list. Note the skipped list - Task 11 needs to know whether `Darkness15Radius` is on it (it should be, per the script's own name-match guard against the SPWI228/Decastave collision).

- [ ] **Step 3: Reformat and typecheck**

Run: `npx prettier --write lib/config/spells/spell-database.ts && npx tsc --noEmit`

Expected: prettier reformats the newly-inserted `level:` fields into the file's existing style; `tsc` reports no errors (every inserted value is a plain `number` literal, always valid against `SpellReference.level?: number`).

- [ ] **Step 4: Spot-check a handful of entries**

Read `lib/config/spells/spell-database.ts` and confirm:
- `WIZARD_SPELLS.MagicMissiles` (`SPWI112`) has `level: 1`
- `WIZARD_SPELLS.Domination` (`SPWI506`) has `level: 5`
- `WIZARD_SPELLS.ObscuringMist` (`SPWI106`) has `level: 1` (not `Blindness`'s row - both are level 1 here, but confirms the name-match guard picked the right CSV row, not just the first file-code match)
- `INNATE_SPELLS.MoonDogHowl` (`SPIN891`) has `level: 6`
- `WIZARD_SPELLS.Darkness15Radius` (`SPWI228`) has **no** `level` field (correctly skipped - see Task 11)

- [ ] **Step 5: Run the full test suite**

Run: `npx vitest run`

Expected: same pass/fail counts as the pre-existing baseline (9 known unrelated failures, per the `verify-generator-refactor` memory) - this task only adds data, no behavior changed yet.

- [ ] **Step 6: Delete the script and commit**

```bash
rm scripts/tmp-add-spell-level.ts
git add lib/config/spells/spell-database.ts
git commit -m "$(cat <<'EOF'
feat: backfill SpellReference.level from the spell CSVs

One-off codemod (not committed) reads assets/spells/*.csv and inserts a
level field on every SPELLS entry it can confidently match by file code
and spell name, skipping any file-code collision across CSVs (e.g.
SPWI228 is Darkness 15' Radius here but Decastave under Stratagems IWD).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Add `RawCreatureAbility.level` and `levelForFile()`

**Files:**
- Modify: `lib/src/model/creature/ability.ts` (add `level?: number` to `BaseCreatureAbility`)
- Modify: `lib/src/model/spell-item/spell-reference.ts` (add `levelForFile`)
- Test: `lib/src/model/spell-item/spell-reference.test.ts`

**Interfaces:**
- Consumes: `SpellCollection`, `getAllSpells`, `spellFiles` (all already in `spell-reference.ts`).
- Produces: `levelForFile(spells: SpellCollection, file: string): number | undefined`; `BaseCreatureAbility.level?: number`.

- [ ] **Step 1: Write the failing tests**

In `lib/src/model/spell-item/spell-reference.test.ts`, add after the `keywordsForFile` describe block:

```typescript
describe("levelForFile", () => {
  const spells: SpellCollection = {
    Wizard: {
      Horror: { file: "SPWI205", level: 3 },
      DimensionDoor: {
        file: "SPWI402",
        variants: [{ mod: "AllSpellMods", file: "SPWI127" }],
        level: 4,
      },
    },
    Priest: {
      Bless: { file: "SPPR101" },
    },
  };

  it("returns the level of the entry whose own file matches", () => {
    expect(levelForFile(spells, "SPWI205")).toBe(3);
  });

  it("matches case-insensitively", () => {
    expect(levelForFile(spells, "spwi205")).toBe(3);
  });

  it("matches a variant's file, not just the base file", () => {
    expect(levelForFile(spells, "SPWI127")).toBe(4);
  });

  it("returns undefined for an entry with no level field", () => {
    expect(levelForFile(spells, "SPPR101")).toBeUndefined();
  });

  it("returns undefined when no entry matches at all", () => {
    expect(levelForFile(spells, "NOT_A_REAL_FILE")).toBeUndefined();
  });
});
```

Add `levelForFile` to the existing import at the top of the file:

```typescript
import {
  keywordsForFile,
  levelForFile,
  resolveForMod,
  spellFiles,
  type SpellCollection,
  type SpellReference,
} from "./spell-reference";
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/src/model/spell-item/spell-reference.test.ts`
Expected: FAIL - `levelForFile` is not exported.

- [ ] **Step 3: Implement `levelForFile`**

In `lib/src/model/spell-item/spell-reference.ts`, add right after `keywordsForFile`:

```typescript
/**
 * The `level` of whichever SPELLS-registry entry's `file` - or one of its `variants[].file` -
 * matches `file` (case-insensitive), or undefined when no entry matches or it has no `level`.
 * Backs the automatic level resolution in PresetFactory.create and AbilityService.applyPreset,
 * mirroring keywordsForFile: a preset built from a real SPELLS entry gets its level for free, so
 * an explicit `level` field on a preset is only needed for a one-off ability with no SPELLS entry
 * of its own (e.g. a spell declared directly on a monster, or one only present in FNP_SPELLS).
 */
export function levelForFile(spells: SpellCollection, file: string): number | undefined {
  const target = file.toUpperCase();
  return getAllSpells(spells).find((spell) =>
    spellFiles(spell).some((f) => f.toUpperCase() === target),
  )?.level;
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/src/model/spell-item/spell-reference.test.ts`
Expected: PASS (all `levelForFile` cases, plus every pre-existing test in the file still green).

- [ ] **Step 5: Add the `level` field to `BaseCreatureAbility`**

In `lib/src/model/creature/ability.ts`, right after the existing `keywords?: SpellKeyword[];` field (and its doc comment) in `BaseCreatureAbility`:

```typescript
  /**
   * The spell's level (e.g. SPELLS.Wizard.Horror.level) - ability.service.ts auto-appends an
   * ImmuneToSpellLevel(target, level) trigger to every target list whenever this is known, so a
   * preset never needs its own hand-written globe/spell-deflection/etc. check. Independent of
   * `keywords` above - this mechanism doesn't use SpellKeyword/SPELL_CHECK_TRIGGERS at all, since
   * ImmuneToSpellLevel already covers whatever protection is actually active on the target.
   */
  level?: number;
```

- [ ] **Step 6: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint lib/src/model/creature/ability.ts lib/src/model/spell-item/spell-reference.ts lib/src/model/spell-item/spell-reference.test.ts`
Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add lib/src/model/creature/ability.ts lib/src/model/spell-item/spell-reference.ts lib/src/model/spell-item/spell-reference.test.ts
git commit -m "$(cat <<'EOF'
feat: add RawCreatureAbility.level and levelForFile()

Mirrors the existing keywords field/keywordsForFile pair, laying the
groundwork for auto-resolving a preset's spell level from SPELLS.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Auto-resolve `level` in `PresetFactory.create`

**Files:**
- Modify: `lib/src/factories/preset.factory.ts`
- Test: `lib/src/factories/preset.factory.test.ts`

**Interfaces:**
- Consumes: `levelForFile` (Task 2), `SPELLS` (`lib/config/spells/spell-database.ts`).
- Produces: `PresetFactory.create(names, ability)` now also resolves `ability.level` the same way it resolves `ability.keywords`.

- [ ] **Step 1: Write the failing tests**

In `lib/src/factories/preset.factory.test.ts`, add at the end of the `describe("create", ...)` block (after the existing keywords tests):

```typescript
  it("auto-resolves level from a real SPELLS entry when the ability doesn't set it", () => {
    const [result] = presetFactory.create([SPELLS.Priest.CloakOfFear.file], {
      name: DEFAULT_ABILITY_NAME,
    });
    expect(result.ability.level).toBe(SPELLS.Priest.CloakOfFear.level);
  });

  it("resolves level once and shares it across every name, even one that isn't a SPELLS entry", () => {
    const results = presetFactory.create(["NOT_IN_SPELLS", SPELLS.Priest.CloakOfFear.file], {
      name: DEFAULT_ABILITY_NAME,
    });
    expect(results[0].ability.level).toBe(SPELLS.Priest.CloakOfFear.level);
    expect(results[1].ability.level).toBe(SPELLS.Priest.CloakOfFear.level);
  });

  it("leaves level unset when no name resolves to a SPELLS entry", () => {
    const [result] = presetFactory.create(["NOT_IN_SPELLS"], { name: DEFAULT_ABILITY_NAME });
    expect(result.ability.level).toBeUndefined();
  });

  it("keeps an explicit ability.level instead of auto-resolving", () => {
    const [result] = presetFactory.create([SPELLS.Priest.CloakOfFear.file], {
      name: DEFAULT_ABILITY_NAME,
      level: 99,
    });
    expect(result.ability.level).toBe(99);
  });
```

(`SPELLS.Priest.CloakOfFear` is a real, plain preset already used by the existing keywords tests in this same file - it now has a real `level` too, from Task 1.)

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/src/factories/preset.factory.test.ts`
Expected: FAIL - `result.ability.level` is `undefined` where a real number is expected.

- [ ] **Step 3: Implement the resolution**

Replace the body of `preset.factory.ts`'s `create` method:

```typescript
  create(names: string[], ability: RawCreatureAbility): AbilityPreset[] {
    const keywords = ability.keywords ?? names.map((n) => keywordsForFile(SPELLS, n)).find(Boolean);
    const level =
      ability.level ?? names.map((n) => levelForFile(SPELLS, n)).find((l) => l !== undefined);
    const merged: RawCreatureAbility = { ...ability };
    if (keywords) merged.keywords = keywords;
    if (level !== undefined) merged.level = level;
    const results: AbilityPreset[] = names.map((n) => ({
      preset: n,
      ability: structuredClone(merged),
    }));
    return results;
  }
```

Update the import line to add `levelForFile`:

```typescript
import { keywordsForFile, levelForFile } from "../model/spell-item/spell-reference";
```

Also update the class doc comment above `create` (currently explains the keywords resolution) to mention level too:

```typescript
  /**
   * Builds one AbilityPreset per file variant sharing the same ability body (e.g. a spell's
   * vanilla file and its Faiths & Powers equivalent) - see AbilityPreset.
   *
   * `ability.keywords` and `ability.level` are auto-resolved here (once, shared by every variant)
   * when not already set: the first name that matches a real SPELLS entry wins. Resolving once up
   * front - rather than per variant in AbilityService.applyPreset - matters because not every
   * variant is itself a SPELLS entry (e.g. FNP_SPELLS has no `keywords`/`level` field compatible
   * with SpellCollection), so resolving per variant would silently leave some of them unprotected
   * even though they're the same spell. An explicit `ability.keywords`/`ability.level` (for an
   * ability with no SPELLS entry of its own) always wins over this.
   */
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/src/factories/preset.factory.test.ts`
Expected: PASS - all new level tests, and every pre-existing keywords test still green (unaffected by the rewrite, since `merged` only sets `keywords`/`level` when resolved, exactly matching the old ternary's behavior for the no-resolution case).

- [ ] **Step 5: Typecheck and lint**

Run: `npx tsc --noEmit && npx eslint lib/src/factories/preset.factory.ts lib/src/factories/preset.factory.test.ts`
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/src/factories/preset.factory.ts lib/src/factories/preset.factory.test.ts
git commit -m "$(cat <<'EOF'
feat: auto-resolve ability.level in PresetFactory.create

Mirrors the existing ability.keywords auto-resolution.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Auto-resolve `level` in `AbilityService.applyPreset`

**Files:**
- Modify: `lib/src/services/baf/ability.service.ts`
- Test: `lib/src/services/baf/ability.service.test.ts`

**Interfaces:**
- Consumes: `levelForFile` (Task 2).
- Produces: `applyPreset` result now carries a resolved `level` the same way it already carries `keywords`.

- [ ] **Step 1: Write the failing tests**

In `lib/src/services/baf/ability.service.test.ts`, add right after the existing `describe("applyPreset - auto-resolves keywords from SPELLS", ...)` block:

```typescript
describe("applyPreset - auto-resolves level from SPELLS", () => {
  it("resolves level from the preset name when neither the preset nor the override set it", () => {
    const result = service.applyPreset({}, SPELLS.Wizard.Domination.file);
    expect(result.level).toBe(SPELLS.Wizard.Domination.level);
  });

  it("keeps the override's own level instead of resolving from the preset name", () => {
    const result = service.applyPreset({ level: 1 }, SPELLS.Wizard.Domination.file);
    expect(result.level).toBe(1);
  });

  it("leaves level unset when the preset name matches no SPELLS entry", () => {
    ABILITY_PRESETS.push({
      preset: "JA#TEST_UNREGISTERED_PRESET_LEVEL",
      ability: { name: DEFAULT_ABILITY_NAME },
    });
    try {
      const result = service.applyPreset({}, "JA#TEST_UNREGISTERED_PRESET_LEVEL");
      expect(result.level).toBeUndefined();
    } finally {
      ABILITY_PRESETS.pop();
    }
  });
});
```

(Uses `SPELLS.Wizard.Domination` - already the fixture the keywords test above it uses - which now has a real `level` too, from Task 1.)

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run lib/src/services/baf/ability.service.test.ts -t "auto-resolves level"`
Expected: FAIL - `result.level` is `undefined` where `SPELLS.Wizard.Domination.level` is a real number.

- [ ] **Step 3: Implement the resolution**

In `ability.service.ts`'s `applyPreset`, right after the existing line:

```typescript
    result.keywords ??= keywordsForFile(SPELLS, presetName);
```

add:

```typescript
    // Same fallback as keywords above, for the ImmuneToSpellLevel mechanism (see
    // BaseCreatureAbility.level) - independent of the keywords/SpellKeyword system.
    result.level ??= levelForFile(SPELLS, presetName);
```

Update the import line:

```typescript
import { keywordsForFile, levelForFile, SpellVariant } from "../../model/spell-item/spell-reference";
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run lib/src/services/baf/ability.service.test.ts -t "auto-resolves level"`
Expected: PASS.

- [ ] **Step 5: Run the whole file's suite and typecheck**

Run: `npx vitest run lib/src/services/baf/ability.service.test.ts && npx tsc --noEmit && npx eslint lib/src/services/baf/ability.service.ts lib/src/services/baf/ability.service.test.ts`
Expected: all green, no errors.

- [ ] **Step 6: Commit**

```bash
git add lib/src/services/baf/ability.service.ts lib/src/services/baf/ability.service.test.ts
git commit -m "$(cat <<'EOF'
feat: auto-resolve ability.level in AbilityService.applyPreset

Mirrors the existing ability.keywords auto-resolution.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Inject `ImmuneToSpellLevel` via `appendSpellCheckTriggers`

**Files:**
- Modify: `lib/src/factories/trigger.factory.ts` (add `immuneToSpellLevel`)
- Modify: `lib/src/services/baf/ability.service.ts` (`appendSpellCheckTriggers`, `getAbility`, `generateSequencer`)
- Test: `lib/src/factories/trigger.factory.test.ts`, `lib/src/services/baf/ability.service.test.ts`

**Interfaces:**
- Consumes: `GLOBAL_CONFIG.spellChecks.spellProtections`, `ScriptTarget.token`.
- Produces: `triggerFactory.immuneToSpellLevel(level: number, negation = false): Triggers.Trigger`; `appendSpellCheckTriggers(targets, keywords, level)` (new third parameter).

- [ ] **Step 1: Write the failing trigger.factory test**

In `lib/src/factories/trigger.factory.test.ts`, add a new `describe`:

```typescript
describe("immuneToSpellLevel", () => {
  it("builds a CheckStatGT-shaped ImmuneToSpellLevel trigger against the target token", () => {
    expect(triggerFactory.immuneToSpellLevel(3)).toEqual({
      name: "ImmuneToSpellLevel",
      params: [ScriptTarget.token, 3],
      negation: false,
    });
  });

  it("supports negation", () => {
    expect(triggerFactory.immuneToSpellLevel(3, true)).toEqual({
      name: "ImmuneToSpellLevel",
      params: [ScriptTarget.token, 3],
      negation: true,
    });
  });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `npx vitest run lib/src/factories/trigger.factory.test.ts -t immuneToSpellLevel`
Expected: FAIL - `triggerFactory.immuneToSpellLevel` is not a function.

- [ ] **Step 3: Implement `immuneToSpellLevel`**

In `trigger.factory.ts`, add right after `checkStat`:

```typescript
  /**
   * True when the target is immune to spells of `level` for any reason currently active on it
   * (Minor Globe, Globe of Invulnerability, Spell Deflection, Spell Turning, Spell Immunity,
   * Shield of the Archons, ...) - the engine's own generic spell-level-immunity check, so this
   * needs no protection-specific stat or SpellKeyword (see BaseCreatureAbility.level).
   */
  immuneToSpellLevel(level: number, negation = false): Triggers.Trigger {
    return { name: "ImmuneToSpellLevel", params: [ScriptTarget.token, level], negation };
  }
```

- [ ] **Step 4: Run it to verify it passes**

Run: `npx vitest run lib/src/factories/trigger.factory.test.ts`
Expected: PASS (new tests plus every pre-existing test in the file).

- [ ] **Step 5: Write the failing ability.service tests**

In `lib/src/services/baf/ability.service.test.ts`, add a new `describe` right after `describe("getAbilities - auto spellChecks via ability.keywords", ...)`:

```typescript
describe("getAbilities - auto ImmuneToSpellLevel via ability.level", () => {
  afterEach(() => {
    GLOBAL_CONFIG.spellChecks.spellProtections = true;
  });

  it("appends ImmuneToSpellLevel to every target list when the ability has a level", () => {
    ABILITY_PRESETS.push({
      preset: "JA#TEST_LEVEL_PRESET",
      ability: {
        name: DEFAULT_ABILITY_NAME,
        level: 3,
        targets: [{ name: "Players" }, { name: "PCs", triggers: [{ name: "See", params: [] }] }],
        spell: { id: SPWI001 },
      },
    });
    try {
      const [ability] = abilityService.getAbilities([{ preset: "JA#TEST_LEVEL_PRESET" }]);
      expect(ability.targets).toEqual([
        { name: "Players", triggers: [{ name: "ImmuneToSpellLevel", params: ["{Target}", 3], negation: true }] },
        {
          name: "PCs",
          triggers: [
            { name: "See", params: [] },
            { name: "ImmuneToSpellLevel", params: ["{Target}", 3], negation: true },
          ],
        },
      ]);
    } finally {
      ABILITY_PRESETS.pop();
    }
  });

  it("leaves targets untouched when the ability has no level", () => {
    const [ability] = abilityService.getAbilities([
      { name: DEFAULT_ABILITY_NAME, targets: [{ name: "Players" }] },
    ]);
    expect(ability.targets).toEqual([{ name: "Players" }]);
  });

  it("respects GLOBAL_CONFIG.spellChecks.spellProtections - disabling it drops the check", () => {
    GLOBAL_CONFIG.spellChecks.spellProtections = false;
    ABILITY_PRESETS.push({
      preset: "JA#TEST_LEVEL_DISABLED_PRESET",
      ability: {
        name: DEFAULT_ABILITY_NAME,
        level: 3,
        targets: [{ name: "Players" }],
        spell: { id: SPWI001 },
      },
    });
    try {
      const [ability] = abilityService.getAbilities([{ preset: "JA#TEST_LEVEL_DISABLED_PRESET" }]);
      expect(ability.targets).toEqual([{ name: "Players" }]);
    } finally {
      ABILITY_PRESETS.pop();
    }
  });

  it("combines with keyword-driven checks on the same target list", () => {
    ABILITY_PRESETS.push({
      preset: "JA#TEST_LEVEL_AND_KEYWORDS_PRESET",
      ability: {
        name: DEFAULT_ABILITY_NAME,
        level: 3,
        keywords: ["acid"],
        targets: [{ name: "Players" }],
        spell: { id: SPWI001 },
      },
    });
    try {
      const [ability] = abilityService.getAbilities([
        { preset: "JA#TEST_LEVEL_AND_KEYWORDS_PRESET" },
      ]);
      expect(ability.targets).toEqual([
        {
          name: "Players",
          triggers: [
            ...SPELL_CHECK_TRIGGERS.acid,
            { name: "ImmuneToSpellLevel", params: ["{Target}", 3], negation: true },
          ],
        },
      ]);
    } finally {
      ABILITY_PRESETS.pop();
    }
  });
});
```

Note: `"{Target}"` is `ScriptTarget.token`'s literal value (see `lib/src/model/constants.ts`), written out directly above since `ability.service.test.ts` doesn't import `ScriptTarget` and has no other test in the file that needs it added.

- [ ] **Step 6: Run the tests to verify they fail**

Run: `npx vitest run lib/src/services/baf/ability.service.test.ts -t "ImmuneToSpellLevel"`
Expected: FAIL - `ability.targets` doesn't include the new trigger yet.

- [ ] **Step 7: Implement the injection**

In `ability.service.ts`, replace `appendSpellCheckTriggers`:

```typescript
  /**
   * Appends trigger.factory.spellChecks()'s triggers for `keywords`, and an
   * ImmuneToSpellLevel(target, level) check when `level` is known, to every target list's own
   * `triggers` - not the ability's top-level triggers - since a target list is what actually
   * restricts an offensive ability to a subset of targets, so "skip protected targets" belongs
   * there. The two are independent: an ability can have either, both, or neither. A no-op when
   * there's nothing to add.
   */
  private appendSpellCheckTriggers(
    targets: TargetList[] | undefined,
    keywords: SpellKeyword[] | undefined,
    level: number | undefined,
  ): TargetList[] | undefined {
    if (!targets) return targets;
    const checks = triggerFactory.spellChecks(keywords);
    if (level !== undefined && GLOBAL_CONFIG.spellChecks.spellProtections) {
      checks.push(triggerFactory.immuneToSpellLevel(level, true));
    }
    if (!checks.length) return targets;
    return targets.map((t) => ({ ...t, triggers: [...(t.triggers ?? []), ...checks] }));
  }
```

Update its two call sites. In `getAbility`:

```typescript
    targets = this.appendSpellCheckTriggers(targets, ability.keywords, ability.level);
```

In `generateSequencer`:

```typescript
      const targets = this.appendSpellCheckTriggers(rawAb.targets, rawAb.keywords, rawAb.level);
```

- [ ] **Step 8: Run the tests to verify they pass**

Run: `npx vitest run lib/src/services/baf/ability.service.test.ts`
Expected: PASS - all new tests, and every pre-existing test in the file (including the `keywords`-only tests, which pass `level: undefined` implicitly and see no behavior change).

- [ ] **Step 9: Typecheck, lint, and full suite**

Run: `npx tsc --noEmit && npx eslint lib/src/factories/trigger.factory.ts lib/src/factories/trigger.factory.test.ts lib/src/services/baf/ability.service.ts lib/src/services/baf/ability.service.test.ts && npx vitest run`
Expected: no errors; same pass/fail counts as the Task 1 baseline (9 known unrelated failures, none new).

- [ ] **Step 10: Commit**

```bash
git add lib/src/factories/trigger.factory.ts lib/src/factories/trigger.factory.test.ts lib/src/services/baf/ability.service.ts lib/src/services/baf/ability.service.test.ts
git commit -m "$(cat <<'EOF'
feat: auto-inject ImmuneToSpellLevel from ability.level

appendSpellCheckTriggers now appends an ImmuneToSpellLevel(target, level)
check to every target list whenever an ability's level is known (gated by
GLOBAL_CONFIG.spellChecks.spellProtections), independent of the
keywords/SpellKeyword mechanism. This is the generic replacement for the
~35 hand-written MINORGLOBE checks removed in the next tasks.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Remove hand-written `MINORGLOBE` triggers - `charm-presets.ts`

**Files:**
- Modify: `lib/config/presets/charm-presets.ts`

**Interfaces:**
- Consumes: Task 1's backfilled `level` on `SPELLS.Wizard.DireCharm`, `SPELLS.Wizard.CharmPerson`, `SPELLS.Priest.CharmPersonOrAnimal`; Task 5's injection.

- [ ] **Step 1: Verify the backfilled levels**

Read `lib/config/spells/spell-database.ts` and confirm `DireCharm` (`SPWI316`), `CharmPerson` (`SPWI104`), and `CharmPersonOrAnimal` (`SPPR204`) each have a `level` field (3, 1, and 2 respectively, per the CSVs). If any is missing, stop and handle it like Task 11 handles `Darkness15Radius` (a manual `level` on the SPELLS entry) instead of removing its trigger blindly.

- [ ] **Step 2: Remove the three redundant triggers**

In `lib/config/presets/charm-presets.ts`, for `DireCharm`, `CharmPerson`, and `CharmPersonOrAnimal` (all three follow the identical shape), replace:

```typescript
      targets: targetService.combineListWithTriggers(CHARM_TARGET_LISTS, [
        triggerFactory.checkStatGT(0, "MINORGLOBE", true),
      ]),
```

with:

```typescript
      targets: CHARM_TARGET_LISTS,
```

(three occurrences - `DireCharm` at line 32-34, `CharmPerson` at line 50-52, `CharmPersonOrAnimal` at line 72-74 as originally read; re-locate by searching for `triggerFactory.checkStatGT(0, "MINORGLOBE", true)` since line numbers shift as earlier occurrences are removed).

`triggerFactory` stays imported - `triggerFactory.haveSpellRES(...)` is still used further down in the same three presets. `targetService`, however, was only ever used via the three `combineListWithTriggers` calls just removed, so it's now a dead import. Remove this line from the top of the file:

```typescript
import targetService from "../../src/services/baf/target.service";
```

- [ ] **Step 3: Typecheck, lint, format**

Run: `npx tsc --noEmit && npx eslint lib/config/presets/charm-presets.ts && npx prettier --check lib/config/presets/charm-presets.ts`
Expected: no errors.

- [ ] **Step 4: Run the full suite**

Run: `npx vitest run`
Expected: same pass/fail counts as the Task 5 baseline.

- [ ] **Step 5: Commit**

```bash
git add lib/config/presets/charm-presets.ts
git commit -m "$(cat <<'EOF'
refactor: remove redundant MINORGLOBE triggers from charm-presets.ts

Covered automatically now by ImmuneToSpellLevel via each spell's
backfilled level.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Remove hand-written `MINORGLOBE` triggers - `fear-presets.ts`

**Files:**
- Modify: `lib/config/presets/fear-presets.ts`

**Interfaces:**
- Consumes: Task 1's backfilled `level` on `SPELLS.Wizard.Horror` (2), `SPELLS.Wizard.Spook` (1), `SPELLS.Innate.MoonDogHowl` (6).

- [ ] **Step 1: Verify the backfilled levels**

Read `lib/config/spells/spell-database.ts` and confirm `Horror` (`SPWI205`), `Spook` (`SPWI125`), and `MoonDogHowl` (`SPIN891`) each have a `level` field.

- [ ] **Step 2: Remove the three redundant triggers**

For `Horror` and `Spook` (identical shape), replace:

```typescript
      targets: targetService.combineListWithTriggers(FEAR_TARGET_LISTS, [
        triggerFactory.checkStatGT(0, "MINORGLOBE", true),
      ]),
```

with:

```typescript
      targets: FEAR_TARGET_LISTS,
```

For `MoonDogHowl`, replace:

```typescript
    targets: targetService.combineListWithTriggers(FEAR_TARGET_LISTS, [
      triggerFactory.checkStatGT(0, "MINORGLOBE", true),
      triggerFactory.alignment("MASK_EVIL"),
    ]),
```

with:

```typescript
    targets: targetService.combineListWithTriggers(FEAR_TARGET_LISTS, [
      triggerFactory.alignment("MASK_EVIL"),
    ]),
```

(`MoonDogHowl` still needs `combineListWithTriggers` since `alignment` stays - don't collapse it to a bare `FEAR_TARGET_LISTS` like the other two.)

- [ ] **Step 3: Typecheck, lint, format**

Run: `npx tsc --noEmit && npx eslint lib/config/presets/fear-presets.ts && npx prettier --check lib/config/presets/fear-presets.ts`
Expected: no errors.

- [ ] **Step 4: Run the full suite**

Run: `npx vitest run`
Expected: same pass/fail counts as the Task 6 baseline.

- [ ] **Step 5: Commit**

```bash
git add lib/config/presets/fear-presets.ts
git commit -m "$(cat <<'EOF'
refactor: remove redundant MINORGLOBE triggers from fear-presets.ts

Covered automatically now by ImmuneToSpellLevel via each spell's
backfilled level (Moon Dog Howl's real level is 6, used as-is).

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Remove hand-written `MINORGLOBE` triggers - `damage-aoe-presets.ts`

**Files:**
- Modify: `lib/config/presets/damage-aoe-presets.ts`

**Interfaces:**
- Consumes: Task 1's backfilled `level` on `Fireball` (3), `SkullTrap` (3), `GlyphOfWarding` (3), `HolySmite` (3), `BurningHands` (1), `LightningBolt` (3), `AgannazarScorcher` (2), `UnholyBlight` (3).

- [ ] **Step 1: Verify the backfilled levels**

Read `lib/config/spells/spell-database.ts` and confirm each of the eight spells above has a `level` field.

- [ ] **Step 2: Remove the redundant triggers**

For `Fireball`, `SkullTrap`, `GlyphOfWarding`, `HolySmite`, `BurningHands`, and `AgannazarScorcher` (all six share this shape), replace:

```typescript
          triggers: [triggerFactory.checkStatGT(0, "MINORGLOBE", true)],
```

with nothing - remove the `triggers` line entirely from each of these six target-list objects (leaving the surrounding object without a `triggers` key, same as e.g. the `Cloudkill` entry already does).

For `LightningBolt`, replace:

```typescript
          triggers: [
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            // triggerFactory.hasBounceEffects(true),
          ],
```

with:

```typescript
          triggers: [
            // triggerFactory.hasBounceEffects(true),
          ],
```

For `UnholyBlight`, replace:

```typescript
          triggers: [
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            triggerFactory.alignment("MASK_GOOD"),
          ],
```

with:

```typescript
          triggers: [triggerFactory.alignment("MASK_GOOD")],
```

- [ ] **Step 3: Typecheck, lint, format**

Run: `npx tsc --noEmit && npx eslint lib/config/presets/damage-aoe-presets.ts && npx prettier --check lib/config/presets/damage-aoe-presets.ts`
Expected: no errors.

- [ ] **Step 4: Run the full suite**

Run: `npx vitest run`
Expected: same pass/fail counts as the Task 7 baseline.

- [ ] **Step 5: Commit**

```bash
git add lib/config/presets/damage-aoe-presets.ts
git commit -m "$(cat <<'EOF'
refactor: remove redundant MINORGLOBE triggers from damage-aoe-presets.ts

Covered automatically now by ImmuneToSpellLevel via each spell's
backfilled level.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Remove hand-written `MINORGLOBE` triggers - `damage-presets.ts`

**Files:**
- Modify: `lib/config/presets/damage-presets.ts`

**Interfaces:**
- Consumes: Task 1's backfilled `level` on `MagicMissiles` (1), `ChromaticOrb` (1), `CallLightning` (3), `CauseDisease` (via `presetFactory.create`, already resolves), `MelfAcidArrow` (2), `FlameArrow` (3), `Combust` (2), `VampiricTouch` (3). `FNP_SPELLS.Priest.Shatter` (level 2) needs an explicit override, since it has no `SPELLS` counterpart at all (only in `FNP_SPELLS`).

- [ ] **Step 1: Verify the backfilled levels**

Read `lib/config/spells/spell-database.ts` and confirm `MagicMissiles` (`SPWI112`), `ChromaticOrb` (`SPWI118`), `CallLightning` (`SPPR302`), `CauseDisease` (`SPPR329`), `MelfAcidArrow` (`SPWI211`), `FlameArrow` (`SPWI303`), `Combust` (`SPWI231`), and `VampiricTouch` (`SPWI314`) each have a `level` field.

- [ ] **Step 2: Remove the redundant triggers**

For `MagicMissiles`, replace:

```typescript
        [
          triggerFactory.checkStatGT(0, "MINORGLOBE", true),
          // triggerFactory.hasBounceEffects(true),
        ],
```

with:

```typescript
        [
          // triggerFactory.hasBounceEffects(true),
        ],
```

For `ChromaticOrb`, replace:

```typescript
          triggers: [
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            // triggerFactory.hasBounceEffects(true),
          ],
```

with:

```typescript
          triggers: [
            // triggerFactory.hasBounceEffects(true),
          ],
```

For `CallLightning`, replace:

```typescript
          triggers: [
            triggerFactory.areaType("OUTDOOR"),
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
          ],
```

with:

```typescript
          triggers: [triggerFactory.areaType("OUTDOOR")],
```

For `CauseDisease`, replace:

```typescript
        triggers: [
          triggerFactory.checkStatGT(12, "STRENGTH_MODIFIER"),
          triggerFactory.checkStatGT(0, "MINORGLOBE", true),
        ],
```

with:

```typescript
        triggers: [triggerFactory.checkStatGT(12, "STRENGTH_MODIFIER")],
```

For `MelfAcidArrow`, replace:

```typescript
        [triggerFactory.checkStatGT(0, "MINORGLOBE", true)],
```

with:

```typescript
        [],
```

For `FlameArrow`, replace:

```typescript
          triggers: [
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            // triggerFactory.hasBounceEffects(true),
          ],
```

with:

```typescript
          triggers: [
            // triggerFactory.hasBounceEffects(true),
          ],
```

For `Combust` and `VampiricTouch` (identical shape), remove the `triggers` line entirely:

```typescript
          triggers: [triggerFactory.checkStatGT(0, "MINORGLOBE", true)],
```

- [ ] **Step 3: Handle `Shatter` (FNP-only, no SPELLS entry)**

Replace:

```typescript
  {
    preset: FNP_SPELLS.Priest.Shatter.file,
    ability: {
      name: FNP_SPELLS.Priest.Shatter.name,
      targets: [
        {
          name: "NearestEnemies",
          triggers: [
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
            // magicResistance not wired here: FNP_SPELLS' BaseSpell type has no `keywords` field,
            // so this file variant can't opt into the auto spellChecks() mechanism yet.
          ],
        },
      ],
      spell: {},
      timer: { name: "Shatter", value: 4 * Durations.round },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
```

with:

```typescript
  {
    preset: FNP_SPELLS.Priest.Shatter.file,
    ability: {
      name: FNP_SPELLS.Priest.Shatter.name,
      // Explicit level (not auto-resolved): FNP_SPELLS' BaseSpell type isn't a SpellCollection
      // entry, so levelForFile(SPELLS, ...) can't find it - same gap already noted for keywords.
      level: FNP_SPELLS.Priest.Shatter.level,
      targets: [{ name: "NearestEnemies" }],
      spell: {},
      timer: { name: "Shatter", value: 4 * Durations.round },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
```

- [ ] **Step 4: Typecheck, lint, format**

Run: `npx tsc --noEmit && npx eslint lib/config/presets/damage-presets.ts && npx prettier --check lib/config/presets/damage-presets.ts`
Expected: no errors.

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run`
Expected: same pass/fail counts as the Task 8 baseline.

- [ ] **Step 6: Commit**

```bash
git add lib/config/presets/damage-presets.ts
git commit -m "$(cat <<'EOF'
refactor: remove redundant MINORGLOBE triggers from damage-presets.ts

Covered automatically now by ImmuneToSpellLevel via each spell's
backfilled level. Shatter (FNP-only, no SPELLS entry) gets an explicit
level override instead, since it can't auto-resolve one.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Remove hand-written `MINORGLOBE` triggers - `debuff-presets.ts`

**Files:**
- Modify: `lib/config/presets/debuff-presets.ts`

**Interfaces:**
- Consumes: Task 1's backfilled `level` on `SPELLS.Priest.Doom` (via `presetFactory.create`, already resolves).

- [ ] **Step 1: Verify the backfilled level**

Read `lib/config/spells/spell-database.ts` and confirm `Doom` (`SPPR113`) has a `level` field.

- [ ] **Step 2: Remove the redundant trigger**

Replace:

```typescript
      {
        name: "Players",
        triggers: [
          triggerFactory.checkSpellState("DOOM", true),
          triggerFactory.checkStatGT(0, "MINORGLOBE", true),
        ],
        randomOrder: true,
      },
```

with:

```typescript
      {
        name: "Players",
        triggers: [triggerFactory.checkSpellState("DOOM", true)],
        randomOrder: true,
      },
```

- [ ] **Step 3: Typecheck, lint, format**

Run: `npx tsc --noEmit && npx eslint lib/config/presets/debuff-presets.ts && npx prettier --check lib/config/presets/debuff-presets.ts`
Expected: no errors.

- [ ] **Step 4: Run the full suite**

Run: `npx vitest run`
Expected: same pass/fail counts as the Task 9 baseline.

- [ ] **Step 5: Commit**

```bash
git add lib/config/presets/debuff-presets.ts
git commit -m "$(cat <<'EOF'
refactor: remove redundant MINORGLOBE trigger from debuff-presets.ts

Covered automatically now by ImmuneToSpellLevel via Doom's backfilled
level.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 11: Remove hand-written `MINORGLOBE` triggers - `disabling-presets.ts`

**Files:**
- Modify: `lib/config/presets/disabling-presets.ts`

**Interfaces:**
- Consumes: Task 1's backfilled `level` on `ObscuringMist` (1), `Silence` (2), `MiscastMagic`/`SPELLS.Priest.MiscastMagic` (3), `RigidThinking` (via `presetFactory.create`), `SummonInsects` (3), `Entangle` (1), `Slow` (3), `PowerWordBlind` (8), `StinkingCloud` (2). `Darkness15Radius` needs a manual `level` on its `SPELLS` entry (Task 1 skips it - file-code collision with IWD's Decastave). `FNP_SPELLS.Priest.Forbiddance` (level 2) and the FNP-only `MiscastMagic` preset (level 2) need explicit overrides, same reasoning as `Shatter` in Task 9.

- [ ] **Step 1: Verify the backfilled levels, and add `Darkness15Radius`'s manually**

Read `lib/config/spells/spell-database.ts` and confirm `ObscuringMist` (`SPWI106`), `Silence` (`SPPR211`), `SPELLS.Priest.MiscastMagic` (`SPPR310`), `RigidThinking` (`SPPR311`), `SummonInsects` (`SPPR319`), `Entangle` (`SPPR105`), `Slow` (`SPWI312`), `PowerWordBlind` (`SPWI815`), and `StinkingCloud` (`SPWI213`) each have a `level` field, and that `Darkness15Radius` (`SPWI228`) does **not** (per Task 1's printed skip list).

For `Darkness15Radius`, add a manual `level` directly on the SPELLS entry - it's a well-known 2nd-level wizard spell (Darkness, 15' Radius), the CSVs just don't have a reliable row for this exact file across the games this project targets (SPWI228 means a different spell, Decastave, under the Stratagems IWD CSVs). In `lib/config/spells/spell-database.ts`, replace:

```typescript
  Darkness15Radius: {
    file: "SPWI228",
    id: "WIZARD_DARKNESS_15_FOOT",
    name: "spell.Darkness15Radius.name",
    keywords: ["blind", "magicResistance"],
    hiddenIn: "AllSpellMods",
  },
```

with:

```typescript
  Darkness15Radius: {
    file: "SPWI228",
    id: "WIZARD_DARKNESS_15_FOOT",
    name: "spell.Darkness15Radius.name",
    // Not backfilled from the CSVs (scripts/tmp-add-spell-level.ts skipped it): SPWI228 is a
    // different spell (Decastave) under the Stratagems IWD spell lists, so the file code alone
    // isn't reliable here. 2 is Darkness, 15' Radius's real, well-known spell level.
    level: 2,
    keywords: ["blind", "magicResistance"],
    hiddenIn: "AllSpellMods",
  },
```

- [ ] **Step 2: Remove the redundant triggers**

For `Darkness15Radius`, `ObscuringMist`, `MiscastMagic` (the `SPELLS.Priest.MiscastMagic`-based one), `RigidThinking`, and `SummonInsects` (all five share this shape), remove the `triggers` line entirely:

```typescript
          triggers: [triggerFactory.checkStatGT(0, "MINORGLOBE", true)],
```

For `Silence`, replace:

```typescript
          triggers: [
            triggerFactory.range(20, true),
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
          ],
```

with:

```typescript
          triggers: [triggerFactory.range(20, true)],
```

For `Entangle`, replace:

```typescript
          triggers: [
            triggerFactory.checkStatGT(0, "ENTANGLE", true),
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
          ],
```

with:

```typescript
          triggers: [triggerFactory.checkStatGT(0, "ENTANGLE", true)],
```

For `Slow`, replace:

```typescript
        [triggerFactory.checkStatGT(0, "MINORGLOBE", true)],
```

with:

```typescript
        [],
```

For `PowerWordBlind` and `StinkingCloud` (identical shape), remove the `triggers` line entirely:

```typescript
          triggers: [triggerFactory.checkStatGT(0, "MINORGLOBE", true)],
```

- [ ] **Step 3: Handle `Forbiddance` (FNP-only, no SPELLS entry)**

Replace:

```typescript
  {
    preset: FNP_SPELLS.Priest.Forbiddance.file,
    ability: {
      name: FNP_SPELLS.Priest.Forbiddance.name,
      targets: [
        {
          name: "NearestEnemies",
          triggers: [triggerFactory.checkStatGT(0, "MINORGLOBE", true)],
        },
      ],
      spell: {},
      timer: { name: "Forbiddance", value: 2 * Durations.round },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
```

with:

```typescript
  {
    preset: FNP_SPELLS.Priest.Forbiddance.file,
    ability: {
      name: FNP_SPELLS.Priest.Forbiddance.name,
      // Explicit level (not auto-resolved): FNP_SPELLS' BaseSpell type isn't a SpellCollection
      // entry, so levelForFile(SPELLS, ...) can't find it - same gap already noted for keywords.
      level: FNP_SPELLS.Priest.Forbiddance.level,
      targets: [{ name: "NearestEnemies" }],
      spell: {},
      timer: { name: "Forbiddance", value: 2 * Durations.round },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
```

- [ ] **Step 4: Handle the FNP-only `MiscastMagic` preset (distinct from `SPELLS.Priest.MiscastMagic`)**

Replace:

```typescript
  {
    preset: FNP_SPELLS.Priest.MiscastMagic.file,
    ability: {
      name: FNP_SPELLS.Priest.MiscastMagic.name,
      targets: [
        {
          name: "PCSpellcasters",
          triggers: [
            triggerFactory.checkSpellState("MISCAST_MAGIC", true),
            triggerFactory.checkStatGT(0, "MINORGLOBE", true),
          ],
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
```

with:

```typescript
  {
    preset: FNP_SPELLS.Priest.MiscastMagic.file,
    ability: {
      name: FNP_SPELLS.Priest.MiscastMagic.name,
      // Explicit level (not auto-resolved): FNP_SPELLS' BaseSpell type isn't a SpellCollection
      // entry, so levelForFile(SPELLS, ...) can't find it - same gap already noted for keywords.
      level: FNP_SPELLS.Priest.MiscastMagic.level,
      targets: [
        {
          name: "PCSpellcasters",
          triggers: [triggerFactory.checkSpellState("MISCAST_MAGIC", true)],
        },
      ],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
```

- [ ] **Step 5: Typecheck, lint, format**

Run: `npx tsc --noEmit && npx eslint lib/config/presets/disabling-presets.ts lib/config/spells/spell-database.ts && npx prettier --check lib/config/presets/disabling-presets.ts lib/config/spells/spell-database.ts`
Expected: no errors.

- [ ] **Step 6: Run the full suite**

Run: `npx vitest run`
Expected: same pass/fail counts as the Task 10 baseline.

- [ ] **Step 7: Commit**

```bash
git add lib/config/presets/disabling-presets.ts lib/config/spells/spell-database.ts
git commit -m "$(cat <<'EOF'
refactor: remove redundant MINORGLOBE triggers from disabling-presets.ts

Covered automatically now by ImmuneToSpellLevel via each spell's
backfilled level. Darkness 15' Radius gets a manually-set level (the CSVs
can't tell it apart from Decastave, which reuses its file code under
Stratagems IWD). Forbiddance and the FNP-only MiscastMagic preset (no
SPELLS entry) get an explicit level override instead.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 12: Remove hand-written `MINORGLOBE` triggers - `hold-presets.ts`

**Files:**
- Modify: `lib/config/presets/hold-presets.ts`

**Interfaces:**
- Consumes: Task 1's backfilled `level` on `HoldPerson` (via `presetFactory.create`, resolves from `SPELLS.Priest.HoldPerson`, level 2), `HoldPersonOrAnimal` (3), `Web` (2).

- [ ] **Step 1: Verify the backfilled levels**

Read `lib/config/spells/spell-database.ts` and confirm `Priest.HoldPerson` (`SPPR208`), `HoldPersonOrAnimal` (`SPPR305`), and `Web` (`SPWI215`) each have a `level` field.

- [ ] **Step 2: Remove the three redundant triggers**

Replace, for `HoldPerson`:

```typescript
  ...presetFactory.create([SPELLS.Priest.HoldPerson.file, SPELLS.Wizard.HoldPerson.file], {
    name: SPELLS.Priest.HoldPerson.name,
    targets: targetService.combineListWithTriggers(HOLD_TARGET_LISTS, [
      triggerFactory.checkStatGT(0, "MINORGLOBE", true),
    ]),
    spell: {},
    requireVocal: true,
    probability: DEFAULT_SPELL_PROBABILITY,
  }),
```

with:

```typescript
  ...presetFactory.create([SPELLS.Priest.HoldPerson.file, SPELLS.Wizard.HoldPerson.file], {
    name: SPELLS.Priest.HoldPerson.name,
    targets: HOLD_TARGET_LISTS,
    spell: {},
    requireVocal: true,
    probability: DEFAULT_SPELL_PROBABILITY,
  }),
```

For `HoldPersonOrAnimal` and `Web` (identical shape), replace:

```typescript
      targets: targetService.combineListWithTriggers(HOLD_TARGET_LISTS, [
        triggerFactory.checkStatGT(0, "MINORGLOBE", true),
      ]),
```

with:

```typescript
      targets: HOLD_TARGET_LISTS,
```

- [ ] **Step 3: Remove now-dead imports**

Every use of `triggerFactory` and `targetService` in this file was one of the three removed calls - both imports are now dead. Remove these two lines from the top of the file:

```typescript
import triggerFactory from "../../src/factories/trigger.factory";
import targetService from "../../src/services/baf/target.service";
```

(Confirm first with `grep -n "triggerFactory\.\|targetService\." lib/config/presets/hold-presets.ts` - expect no matches before removing.)

- [ ] **Step 4: Typecheck, lint, format**

Run: `npx tsc --noEmit && npx eslint lib/config/presets/hold-presets.ts && npx prettier --check lib/config/presets/hold-presets.ts`
Expected: no errors.

- [ ] **Step 5: Run the full suite**

Run: `npx vitest run`
Expected: same pass/fail counts as the Task 11 baseline.

- [ ] **Step 6: Commit**

```bash
git add lib/config/presets/hold-presets.ts
git commit -m "$(cat <<'EOF'
refactor: remove redundant MINORGLOBE triggers from hold-presets.ts

Covered automatically now by ImmuneToSpellLevel via each spell's
backfilled level. triggerFactory/targetService imports removed too,
since every use in this file was one of the removed calls.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 13: Remove hand-written `MINORGLOBE` triggers - `sleep-presets.ts`

**Files:**
- Modify: `lib/config/presets/sleep-presets.ts`

**Interfaces:**
- Consumes: Task 1's backfilled `level` on `PowerWordSleep` (2), `Sleep` (1), `Command` (1).

- [ ] **Step 1: Verify the backfilled levels**

Read `lib/config/spells/spell-database.ts` and confirm `PowerWordSleep` (`SPWI220`), `Sleep` (`SPWI116`), and `Command` (`SPPR102`) each have a `level` field.

- [ ] **Step 2: Remove the redundant triggers**

For `PowerWordSleep`, replace:

```typescript
      targets: targetService.combineListWithTriggers(SLEEP_TARGET_LISTS, [
        triggerFactory.checkStatGT(0, "MINORGLOBE", true),
        triggerFactory.hplt(20),
      ]),
```

with:

```typescript
      targets: targetService.combineListWithTriggers(SLEEP_TARGET_LISTS, [
        triggerFactory.hplt(20),
      ]),
```

For `Sleep` and `Command` (identical shape), replace:

```typescript
      targets: targetService.combineListWithTriggers(SLEEP_TARGET_LISTS, [
        triggerFactory.checkStatGT(0, "MINORGLOBE", true),
      ]),
```

with:

```typescript
      targets: SLEEP_TARGET_LISTS,
```

- [ ] **Step 3: Typecheck, lint, format**

Run: `npx tsc --noEmit && npx eslint lib/config/presets/sleep-presets.ts && npx prettier --check lib/config/presets/sleep-presets.ts`
Expected: no errors.

- [ ] **Step 4: Run the full suite**

Run: `npx vitest run`
Expected: same pass/fail counts as the Task 12 baseline.

- [ ] **Step 5: Commit**

```bash
git add lib/config/presets/sleep-presets.ts
git commit -m "$(cat <<'EOF'
refactor: remove redundant MINORGLOBE triggers from sleep-presets.ts

Covered automatically now by ImmuneToSpellLevel via each spell's
backfilled level.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 14: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Confirm no `MINORGLOBE` skip-triggers remain outside `dispel-presets.ts`**

Run: `grep -rn 'checkStatGT(0, "MINORGLOBE", true)' lib/config/presets/`
Expected: no matches anywhere (all removed across Tasks 6-13).

Run: `grep -rn 'MINORGLOBE' lib/config/presets/`
Expected: exactly one match, `dispel-presets.ts:68`'s un-negated `checkStatGT(0, "MINORGLOBE")` - untouched, per the Global Constraints.

- [ ] **Step 2: Full project verification**

Run: `npx tsc --noEmit && npx eslint lib/ && npx prettier --check lib/ && npx vitest run`
Expected: no type errors, no lint errors, prettier reports everything formatted, and vitest shows the same 9 pre-existing unrelated failures as the Task 1 baseline (none new).

- [ ] **Step 3: Regenerate and diff the pipeline output (per the `verify-generator-refactor` memory)**

If this project has a pipeline-output generation script (check `package.json` scripts, e.g. `npm run generate` or similar), run it before and after this plan's changes from a clean `git stash` baseline, and diff a byte-hash manifest of the output - not the golden test, which has known pre-existing failures. Confirm the diff only touches the `.baf` files for monsters using one of the affected presets (the same ~35 spells), and that the diff is additive (new `ImmuneToSpellLevel` triggers appearing, not existing content disappearing beyond the removed `MINORGLOBE` checks).

- [ ] **Step 4: Report to the user**

Summarize: which spells gained `ImmuneToSpellLevel` protection for the first time (any level 1-9 attack spell that never had a hand-written `MINORGLOBE` check before - the "expected side effect" the spec calls out), and the four special-cased spells (`Shatter`, `Forbiddance`, the FNP-only `MiscastMagic`, `Darkness15Radius`) that needed a manual/explicit `level` instead of full auto-resolution. This is the user's cue for the review they asked for.
