# Dialog / deathVar validation against creatures.csv

## Context

Creature definitions in `generator/lib/creatures/*.ts` can call `setBehavior({ dialog: [...] })`
to declare that a creature initiates dialog — `CreatureBehavior.dialog: string[]` accumulates
across `setBehavior()` calls (`generator/lib/src/model/creature/behavior.ts`,
`creature.factory.ts:137`). Today nothing checks that a creature claiming a dialog actually has
the supporting data in `generator/assets/creatures.csv`: the `deathvar` and `dialog` columns for
that creature's rows.

`creatures.csv` is `;`-delimited with columns
`file; general; race; class; anim; deathvar; dialog; origin; name; MonsterId; ValidatedMonsterId`.
`MonsterId`/`ValidatedMonsterId` are computed offline by the `monster-id-mapping` skill
(`generator/scripts/build-monster-id.ts`), mapping each row to the `MonsterEnum` member it
represents. `monster-files.service.ts` already reads this CSV at runtime and exposes
`getFiles(monster: MonsterEnum): string[]`, keyed by `MonsterId`, restricted to rows where
`ValidatedMonsterId === "true"` — this spec follows that exact lookup pattern for dialog/deathVar
data instead of just filenames.

## Goals

- When a creature's `behavior.dialog` is non-empty, validate that `creatures.csv` backs it up:
  at least one validated CSV row for that creature has a non-empty `deathvar` whose value equals
  that row's `dialog` value.
- Any validated CSV row for the creature that *does* have a `deathvar` set, but whose `dialog`
  doesn't match it, is a data error — the CSV is internally inconsistent for that row.
- Rows with no `deathvar` at all are irrelevant to this check and are silently ignored (they may
  be plain filler/adjustment file rows with no dialog significance).
- Creatures whose `behavior.dialog` is empty are unaffected — no dialog claimed, nothing to check.
- A failure here marks the creature invalid (`creature.valid = false`), so a creature with a
  broken dialog/deathVar pairing is skipped by `mainService.generateCreature()`
  (`main.service.ts:42`, via `isCreatureValid()`) instead of generating a broken WeiDU patch.

## Non-goals

- Validating dialog/deathVar for CSV rows that aren't yet `ValidatedMonsterId === "true"` (same
  scope restriction `monster-files.service.ts` already applies elsewhere).
- Changing how `MonsterId`/`ValidatedMonsterId` themselves are computed.
- Checking that the `.dlg` file named in `dialog` actually exists on disk, or that `deathvar` is a
  well-formed game variable — purely a CSV-internal consistency check (`dialog === deathvar`) plus
  presence.

## Design

### CSV lookup — `monster-files.service.ts`

Add a new parser alongside `parseMonsterFilesCsv`, same row filter (`ValidatedMonsterId ===
"true"` and `MonsterId` set), but capturing `deathvar`/`dialog` per row instead of just `file`:

```ts
export function parseMonsterDialogCsv(
  raw: string,
): Map<string, { file: string; deathvar: string; dialog: string }[]>
```

Expose it via a cached `monsterFilesService.getDialogRows(monster: MonsterEnum): { file: string;
deathvar: string; dialog: string }[]`, memoized the same way as `filesByMonster`/
`unvalidatedFilesByMonster`.

### The check — `creature.service.ts`

```ts
checkDialog(creature: Creature): boolean {
  if (!creature.behavior.dialog.length) return true;
  const rows = monsterFilesService.getDialogRows(creature.id).filter((r) => r.deathvar);
  if (!rows.length) {
    logService.error(
      `${translationService.from(creature.name)}: behavior defines dialog but creatures.csv ` +
        `has no entry with a deathVar for this creature.`,
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

- Filter-then-check, per the two goals above: rows without `deathvar` are discarded first: they
  don't participate in the pass/fail decision at all. Every surviving row must have
  `dialog === deathvar`; if none survive, that's also a failure ("dialog claimed but nothing in
  the CSV supports it").

### Wiring — `creature.factory.ts` `validate()`

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

This is a deliberate deviation from the neighboring `checkSpellAbilities`/
`checkDuplicateAbilities` calls, which only `logService.error` without affecting `valid` (their
errors fail the overall build via `logService.hasErrors()`, but don't stop that specific creature
from generating). `checkDialog`'s result is folded into `creature.valid` directly, so a broken
dialog/deathVar pairing also suppresses generation for that one creature, not just the build exit
code.

### Test impact

Existing test files to extend, no new files needed:

- `monster-files.service.test.ts` — cases for `parseMonsterDialogCsv`: validated row with matching
  `deathvar`/`dialog`, mismatched row, row with empty `deathvar`, row filtered out by
  `ValidatedMonsterId !== "true"`.
- `creature.service.test.ts` — cases for `checkDialog`: empty `behavior.dialog` short-circuits
  true; matching row passes; mismatched row fails with an error logged; all rows lacking
  `deathvar` fails (no supporting entry); mix of a discarded row (no `deathvar`) and a valid
  matching row passes.
- `creature.factory.test.ts` — `validate()` sets `creature.valid = false` when `checkDialog`
  fails, even though the family/files/duplicate checks all pass.

## Trade-offs

Scoping the lookup to `ValidatedMonsterId === "true"` rows only (matching `getFiles()`'s existing
restriction) means a creature whose CSV rows haven't been confirmed by `monster-id-mapping` yet
will always fail this check the moment it declares `dialog` in `behavior` — there's no
in-between "not yet checked" state. This mirrors the existing precedent (`monster-id-mapping`'s
own design already treats unvalidated rows as unusable for anything that drives real output) and
keeps this check simple; revisit only if that ordering (write `dialog:` before running
`monster-id-mapping`) turns out to be common in practice.

## Open items for implementation plan

- None — scope is a single new parser function + service method, one new `CreatureService`
  method, and a two-line change to `validate()`'s call sequence and final assignment.
