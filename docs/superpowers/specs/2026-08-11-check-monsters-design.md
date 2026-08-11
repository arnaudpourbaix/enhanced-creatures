# Check-monsters command — design

## Purpose

A new CLI command that walks every `MonsterEnum` member and reports two categories, giving a
standing todo list instead of relying on noticing gaps by eye:

- **Missing** — the enum member has no `create()`/`createFrom()` call reachable from any family
  (never referenced anywhere, or its `addCreature()` line is commented out — e.g. today's
  uncommitted `Feyr`, the long-standing `Tiger`/`MutatedSpider`, and the 7 undead stubs in
  `undead.ts`).
- **Unvalidated** — the enum member *is* built (some family calls `create()`/`createFrom()` for
  it), but the resulting `Creature.valid` is not `true` — it failed `creatureFactory.validate()`
  (bad/duplicate files, family mismatch, invalid dialog, ...) or the build itself threw.

Invoked as `npm run check-monsters`.

## Non-goals

- Not a CI gate — this is an advisory/informational report ("recurring todo list"), not a
  pass/fail check. The command exits `0` even when both lists are non-empty; only an unexpected
  crash produces a non-zero exit, same as `generate`/`copy`/`release`'s existing error handling.
- Does not generate or write any mod output (no WeiDU/BAF/doc generation, no filesystem writes
  under `mod/`) — it only builds in-memory `Creature` objects to inspect their `id`/`valid`.
- Does not surface *why* a monster is unvalidated in the console output beyond a pointer to the
  log file — the existing `creatureFactory.validate()` warnings already land in that log for
  free (see "How validation reasons surface" below), so no new reason-tracking plumbing is added.

## CLI surface

New commander command in `lib/src/index.ts`, following the existing `generate`/`copy`/`release`
pattern:

```
npm run check-monsters
```

- No arguments/options.
- Backed by a new `lib/src/services/check-monsters.service.ts`.
- Logs to `check-monsters.log` via the existing `logService` (same convention as `copy.log` /
  `release.log`).

## How it determines "built vs missing"

Calling each `familyFactories` entry directly already runs the exact same validation `generate`
runs, because `CreatureFamily.addCreature()` calls `creatureFactory.validate()` synchronously
while the family's constructor builds its creature list — this is the same mechanism
`mainService.generateCreatures()` relies on for its own `.valid` checks. The new service reuses
this instead of re-implementing anything, and skips the WeiDU/doc-generation steps that write
files, since this command is read-only.

`CheckMonstersService.check()`:

1. `logService.init()` — fresh `check-monsters.log`. Because `creatureFactory.validate()`'s
   existing `logService.warn()` calls ("No files defined", "Family doesn't match", duplicate
   files, etc.) run unchanged, they land in this log as the "why" behind each unvalidated entry,
   at no extra engineering cost.
2. `await stateService.init()` — required: `validate()` → `immunityService.handleImmunities()`
   reads `State.immunities`, which only `stateService.init()` populates.
3. `mainService.checkPresets()` then `mainService.checkSpells()` — required so ability-preset
   spell IDs are resolved *before* creature validation runs, matching `generateAll()`'s call
   order. Skipping this could make `check-monsters`' results diverge from what `npm run generate`
   would actually report.
4. Loop `familyFactories`, call each factory function, and collect every built creature's
   `id -> valid` from each returned `Family.creatures`.
5. Feed the id/valid pairs into a pure, separately-testable diff function alongside every numeric
   `MonsterEnum` value, producing `{ missing: MonsterEnum[]; unvalidated: MonsterEnum[] }`
   (both sorted alphabetically by enum member name for stable, readable output).

## Output

Console summary, following the `chalk`-based style already used in `index.ts`:

```
Checking monsters...

Missing (N) - declared in MonsterEnum, not implemented anywhere:
  <Name>, <Name>, ...

Unvalidated (N) - implemented but failed validation, see check-monsters.log for details:
  <Name>, <Name>, ...

<total - N - N> of <total> monsters OK.
```

If both lists are empty, print a single green "All monsters OK." line instead. Exit code is
always `0` on a normal run (see Non-goals); an uncaught exception still goes through `index.ts`'s
existing `handleError()` path and exits `1`, same as every other command.

## Error handling

- No preflight checks needed (no arguments, no external state to validate up front).
- If a family factory throws outside of `addCreature()`'s own try/catch (a genuine bug, not a
  per-creature validation failure), the command aborts via `handleError()` like `generate` does
  today — this command doesn't attempt to make a broken family "partially reportable".

## Testing

- **Diff logic** (pure function) — unit tested directly with fake `{ id, valid }` pairs against
  the real `MonsterEnum`, no mocking required: members present with `valid: true` are omitted,
  present with `valid: false`/`undefined` go to `unvalidated`, absent members go to `missing`.
- **`CheckMonstersService.check()` orchestration** — tested with the same stub pattern
  `main.service.test.ts` uses for `generateAll()` (`vi.spyOn` on `stateService.init`,
  `mainService.checkPresets`/`checkSpells`, `logService.init`), confirming the call order and
  that the diff function receives the right data.
