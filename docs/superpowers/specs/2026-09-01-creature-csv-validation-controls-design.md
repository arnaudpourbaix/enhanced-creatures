# Creature CSV validation controls — design

## Purpose

Three new advisory checks that compare each generated creature against its source row(s) in
`assets/creatures.csv`, so drift between the extracted `.cre` data and the hand-authored
creature definition is surfaced in `generator.log` instead of going unnoticed:

- **Persisting items** — a weapon or piece of gear that the source `.cre` carries
  (`helmet;shield;lring;rring;amulet;weapon1;weapon2;weapon3;weapon4`) but the definition never
  removes via `data.items.remove`. Such an item stays equipped in-game.
- **Level gap** — the source `level` column and the definition's `level1` differ by more than 2.
- **Original scripts retained** — the source `.cre` has one or more BAF scripts
  (`overrideScript;classScript;raceScript;generalScript;defaultScript`) that the definition
  neither lists in `data.script.remove` nor gets stripped by the generic-script removal pass, so
  the original AI is still (partly) active.

Each finding can be acknowledged per source row by setting a new boolean column in
`creatures.csv` to `true`, after which that row no longer contributes to the finding.

## Non-goals

- **Not a CI/validation gate.** All three are `logService.warn` / `logService.info` only.
  `Creature.valid` is untouched — consistent with the existing `checkSpellAbilities` /
  `checkDuplicateAbilities` / `checkWeapons` advisory checks.
- **No change to generated output.** No new `.tpa` / `.baf` / doc content; the generator's item,
  level and script handling is unchanged. This is log-only.
- **Re-equipping does not count as handling an item.** Per decision below, only
  `data.items.remove` clears a persisting-item finding — an item put back via
  `data.items.equipped` still counts as persisting (it was never removed, just re-added).
- **No automatic write-back during generation.** The `creatures.csv` boolean columns are filled
  once by a dedicated one-shot script and thereafter maintained by hand.

## Decisions (from brainstorming)

| Question | Decision |
|---|---|
| Item cleared by remove *or* re-equip? | **Only `data.items.remove`.** |
| Level: which value on the definition side? | `data.level1.pnpValue`, effective per file. |
| Level: adjustments? | Always checked. For a given file, the **last** adjustment (in `adjustments` order) that lists the file *and* sets its own `data.level1` wins; otherwise the base `level1`. |
| Level: threshold | `abs(csvLevel - effectiveLevel) > 2`. |
| Script finding suppressed by? | Script present in the effective `data.script.remove` set **or** in `GLOBAL_CONFIG.tpaConstants.genericScriptsToRemove`. `None` (any case) and blank columns are ignored. |
| Severity | Warnings only (`info` for scripts). `Creature.valid` unchanged. |
| Log granularity | **One line per creature**, listing the offending files inline. |
| Acknowledgement granularity | **Per `creatures.csv` row** (i.e. per source `.cre` file, per `game` variant). |
| Column semantics | Literal `true` suppresses; anything else (blank) does not. |
| Baseline fill | One-shot script, seeded from current state; never downgrades `true`→blank; rows with no built creature stay blank. |
| Rebuild survival | The three columns are added to `CARRIED_COLUMNS`. |

## Schema change — `assets/creatures.csv`

Three columns inserted immediately after `ValidatedMonsterId`:

```
… ; MonsterId ; ValidatedMonsterId ; ValidatedLevel ; ValidatedItems ; ValidatedScript ; game ; name
```

- One value per row. `true` ⇒ that row is excluded from the matching finding. Blank / anything
  else ⇒ the row contributes normally.
- All existing rows get an empty value initially; the baseline script (below) fills them.
- `name` stays last (it is unquoted and may contain `;`), enforced by `withNameLast`.

### `CARRIED_COLUMNS` — `scripts/lib/build-creatures.ts`

`CARRIED_COLUMNS` becomes `["summon", "MonsterId", "ValidatedMonsterId", "ValidatedLevel",
"ValidatedItems", "ValidatedScript"]`.

The carry mechanism (`indexMonsterIds` → `MonsterIds` → `attachCarriedColumns`) is currently
hardcoded to the two id fields. It is generalised so the three new columns are copied from the
chosen `old-creatures.csv` row for that `file` (same row-selection rule as today: first row for
the file, upgraded to one that has a non-empty `MonsterId`). Missing column in
`old-creatures.csv` ⇒ empty value, exactly as an un-filled row would be.

`scripts/add-duplicate-columns.ts` picks the new columns up for free — it already iterates
`CARRIED_COLUMNS`.

## CSV row access — `lib/src/services/monster-files.service.ts`

New export `parseCreatureRowsCsv(raw): Map<string, CreatureCsvRow[]>`, keyed by
**uppercase `file`**. The value is an array because a file can have `game`-tagged duplicate rows
(`game` = `bg1` / `bg2` / empty).

```ts
export interface CreatureCsvRow {
  file: string;
  game?: Game;                                   // undefined when the column is blank ("both")
  level: number | undefined;                     // parseInt; undefined if blank or NaN
  items: { slot: string; file: string }[];       // non-empty values of the 9 slot columns
  scripts: { slot: string; value: string }[];    // the 5 script columns, in canonical order
  validatedLevel: boolean;                       // field === "true"
  validatedItems: boolean;
  validatedScript: boolean;
}
```

- `SLOT_COLUMNS = ["helmet","shield","lring","rring","amulet","weapon1","weapon2","weapon3","weapon4"]`
- `SCRIPT_COLUMNS = ["overrideScript","classScript","raceScript","generalScript","defaultScript"]`
  — `scripts` preserves this order; blank entries are dropped, `None` entries are **kept** here
  and filtered by the check (so the check owns the "None = irrelevant" rule).
- Naive `line.split(";")` is fine: every column consumed here precedes `name`.

New method:

```ts
getCreatureRow(file: string, game: Game | undefined): CreatureCsvRow | undefined
```

Resolution precedence (matches the intent of the existing per-monster parsers): exact `game`
match → untagged row (`game === undefined`) → first row. Result cached like the other
`…ByMonster` maps.

## Check methods — `lib/src/services/creature.service.ts`

Three pure methods that return per-file findings and do **no** logging or suppression (so the
baseline script can reuse them):

```ts
export interface CsvFinding {
  file: string;
  game?: Game;
  detail: string;   // human-readable fragment for the aggregated log line
}

findPersistingItems(creature: Creature): CsvFinding[]
findLevelGaps(creature: Creature): CsvFinding[]
findOriginalScripts(creature: Creature): CsvFinding[]
```

All three iterate `creature.files` (each `{ name, game }`), resolve the row via
`monsterFilesService.getCreatureRow(name, game)`, and skip files with no row.

### `findPersistingItems`

For each file, build the **effective remove set** (uppercased):

```
base            = creature.data.items.remove
fromAdjustments = flatMap(creature.adjustments where adj.files ∋ file) => adj.data.items.remove
effectiveRemove = new Set([...base, ...fromAdjustments].map(toUpperCase))
```

For every `row.items` entry whose `file.toUpperCase()` is **not** in `effectiveRemove`, record it.
Detail fragment: `` `${file} (${persisting.map(i => `${i.file} ${i.slot}`).join(", ")})` ``.

### `findLevelGaps`

For each file, compute the effective level:

```ts
let level = creature.data.level1.pnpValue;
for (const adj of creature.adjustments)                 // in declaration order
  if (adj.files (ci) ∋ file && adj.data.level1 !== undefined)
    level = adj.data.level1.pnpValue;                   // last writer wins
```

Skip if `row.level === undefined`. If `Math.abs(row.level - level) > 2`, record.
Detail fragment: `` `${file} (csv ${row.level} / def ${level})` ``.

### `findOriginalScripts`

For each file, build the **removed set** (uppercased):

```
base            = creature.data.script.remove
fromAdjustments = flatMap(creature.adjustments where adj.files ∋ file) => adj.data.script.remove
generic         = GLOBAL_CONFIG.tpaConstants.genericScriptsToRemove
removed          = new Set([...base, ...fromAdjustments, ...generic].map(toUpperCase))
```

Walk `row.scripts` in canonical order; keep an entry when its `value` is non-blank,
`value.toUpperCase() !== "NONE"`, and `value.toUpperCase()` is not in `removed`.
If any survive, record. Detail fragment:
`` `${file} (${kept.map(s => `${s.slot}=${s.value}`).join(", ")})` ``.

Import note: `GLOBAL_CONFIG` from `lib/config/generate.ts` — path `../../config/generate` from
`creature.service.ts`.

## Wiring

### `lib/src/services/creature.service.ts` — `checkAgainstCsv`

A public method that runs all three `find*`, drops acknowledged findings, and emits one line
each. Keeps `creature.factory.ts` free of any new import (it already calls
`creatureService.check*` the same way for spells/abilities/weapons).

```ts
checkAgainstCsv(creature: Creature): void {
  this.reportCsvFinding(creature, this.findPersistingItems(creature),
    "validatedItems",  "warn", "unremoved source items");
  this.reportCsvFinding(creature, this.findLevelGaps(creature),
    "validatedLevel",  "warn", "level gap > 2 vs creatures.csv");
  this.reportCsvFinding(creature, this.findOriginalScripts(creature),
    "validatedScript", "info", "original scripts retained");
}

private reportCsvFinding(
  creature: Creature,
  findings: CsvFinding[],
  column: "validatedItems" | "validatedLevel" | "validatedScript",
  level: "warn" | "info",
  label: string,
): void {
  const shown = findings.filter((f) => {
    const row = monsterFilesService.getCreatureRow(f.file, f.game);
    return !row?.[column];
  });
  if (!shown.length) return;
  const name = translationService.from(creature.name);
  logService[level](`${name}: ${label} — ${shown.map((f) => f.detail).join("; ")}`);
}
```

Example output:

```
warning: Abela the Nymph: unremoved source items — ABELA (wtrunsgt weapon1)
warning: Skeleton: level gap > 2 vs creatures.csv — 0XUDDG (csv 6 / def 10)
info: Piece of Nightmare: original scripts retained — 9XEA (overrideScript=9XEA)
```

### `lib/src/factories/creature.factory.ts`

One line in `validate()`, after `creatureService.checkWeapons(creature)`:

```ts
creatureService.checkAgainstCsv(creature);
```

## Baseline script — `scripts/build-validation-columns.ts`

One-shot, idempotent. Usage: `ts-node scripts/build-validation-columns.ts` (optionally
`--assets <dir>`), mirroring `add-duplicate-columns.ts`.

Steps:

1. `parseCsv(assets/creatures.csv)`. Add the three columns to the header after
   `ValidatedMonsterId` if missing; default every row's value to its current value or `""`.
2. Build state like `check-monsters.service.ts`: `logService.init()`, `await stateService.init()`,
   `mainService.checkPresets()`, `mainService.checkSpells()`.
3. For each `familyFactories` entry, call it and collect every `family.creatures` entry.
4. For each built creature, run the three `find*` methods. Accumulate, per check, the set of
   acknowledged-independent findings keyed by the resolved source row
   (`getCreatureRow(file, game)` identity, i.e. uppercase file + resolved `game`).
5. Also accumulate the set of **owned rows**: every `(file, game)` a built creature references.
6. Rewrite each row / each of the three columns:

   ```
   current === "true"            -> "true"          (never downgrade)
   row is owned && no finding     -> "true"
   otherwise                      -> ""             (finding present, or row unowned)
   ```

7. `serializeCsv(withNameLast(header), rows)` back to `assets/creatures.csv`.
8. Print a summary: rows total, and per column how many `true` / blank / newly-set.

Row/finding matching reuses the same file+game resolution as `getCreatureRow` so a finding and
its row agree on which `game` variant they refer to.

## Testing

### `lib/src/services/monster-files.service.test.ts`
- `parseCreatureRowsCsv`: slot/script column extraction and order; `level` parse (`"6"` → 6,
  `""` → undefined, junk → undefined); `Validated*` parse (`"true"` → true, `""`/`"false"` →
  false); `game`-tagged duplicate rows grouped into the array.
- `getCreatureRow`: exact-game wins over untagged; untagged fallback; missing file → undefined.

### `lib/src/services/creature.service.test.ts`
Using the existing `fakeCreature` helper plus a `vi.spyOn(monsterFilesService, "getCreatureRow")`:
- **items**: base `remove` clears; adjustment `remove` clears for that adjustment's files only;
  re-equipped-but-not-removed still reported; item not in any slot column → nothing.
- **level**: base gap > 2 reported, gap == 2 not; adjustment `level1` overrides for its files;
  same file in two adjustments — last one that sets `level1` wins; blank csv `level` skipped.
- **scripts**: `None` skipped; script in `data.script.remove` skipped; script in
  `genericScriptsToRemove` skipped; surviving script reported with its column label; multiple
  columns kept in canonical order.
- all three: file with no csv row → skipped silently.

### `lib/src/services/creature.service.test.ts` — `checkAgainstCsv`
- `ValidatedItems="true"` on the row suppresses that file from the line; a mix of acknowledged
  and unacknowledged files shows only the latter; all acknowledged → no line at all.
- aggregated line format (`<name>: <label> — <f1>; <f2>`); `warn` vs `info` channel per check.

### `scripts/lib/build-creatures.test.ts`
- `CARRIED_COLUMNS` round-trips the three new columns; `attachCarriedColumns` copies their values
  from the indexed `old` rows; missing column in `old` → empty string.

### `scripts/build-validation-columns` (new test file, pure-logic extracted)
- keep-`true`, fill-clean-owned-row-`true`, leave-warning-row-blank, leave-unowned-row-blank.

## Files touched

| File | Change |
|---|---|
| `assets/creatures.csv` | +3 columns (baseline script) |
| `scripts/lib/build-creatures.ts` | `CARRIED_COLUMNS` + generalise carry of the 3 fields |
| `scripts/lib/build-creatures.test.ts` | carry tests |
| `scripts/build-validation-columns.ts` | **new** one-shot baseline script |
| `scripts/build-validation-columns.test.ts` | **new** (or fold logic into `lib/`) |
| `lib/src/services/monster-files.service.ts` | `parseCreatureRowsCsv`, `getCreatureRow`, `CreatureCsvRow` |
| `lib/src/services/monster-files.service.test.ts` | parser/getter tests |
| `lib/src/services/creature.service.ts` | `findPersistingItems` / `findLevelGaps` / `findOriginalScripts` + `checkAgainstCsv` + `reportCsvFinding` + `CsvFinding` |
| `lib/src/services/creature.service.test.ts` | check + suppression + aggregation tests |
| `lib/src/factories/creature.factory.ts` | one `creatureService.checkAgainstCsv(creature)` call in `validate()` |
