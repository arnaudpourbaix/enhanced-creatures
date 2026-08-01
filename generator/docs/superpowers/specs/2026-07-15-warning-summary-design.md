# Warning count summary in generator.log

## Problem

`generator.log` (added by the debug-log-file feature) has no way to tell at a
glance whether a run produced any warnings — you have to scroll the whole
file. The generator also has no explicit "warning" concept today: messages
are all logged as plain text via `logService.log(...)`, with some prefixed
with a ⚠ symbol (`figureSet.warning`) purely as visual flavor.

## Design

### `LogService` additions (`lib/src/services/log.service.ts`)

- A private `warningCount` counter, reset to `0` in `init()` (alongside the
  existing indent reset).
- `warn(message: string): void` — behaves exactly like `log()` (writes
  `message` with the current indent prefix, one line per `\n`-split line) but
  also increments `warningCount`. Message text passed to `warn()` keeps
  embedding its own `figureSet.warning` symbol where one already exists
  today — `warn()` does not add or strip any symbol itself, it only counts.
- `summary(): void` — calls `this.section("Summary")`, then writes one line:
  `"No warnings"` if `warningCount === 0`, `"1 warning"` if `1`, or
  `"${warningCount} warnings"` otherwise.

### `index.ts`

Add `logService.summary();` immediately before the existing
`logService.log("Finished!");` call, so a run ends with:

```
Generating translations
-------------------------

Summary
-------
3 warnings
Finished!
```

The terminal is unaffected — `summary()` writes to the file only, consistent
with the existing console-output policy (only the fatal error handler and
the final `"Finished!"` line print to the terminal).

### Call-site migration: `.log(...)` → `.warn(...)`

The messages classified as warnings are exactly the ones that were already
semantically warnings before this feature: the 11 call sites already marked
with the ⚠ (`figureSet.warning`) symbol, plus the 2 call sites that were
`console.warn` before the debug-log-file migration (and have no symbol).
Message text at every site stays byte-for-byte identical — only the method
name changes.

- `lib/src/factories/creature.factory.ts` (6): `equipItem`'s slot-conflict
  warning; `validate`'s family-mismatch, no-files, existing-files,
  no-attack, and no-behavior warnings.
- `lib/src/services/main.service.ts` (2): `isCreatureValid`'s
  not-yet-validated and invalid warnings.
- `lib/src/services/creature.service.ts` (1): the THAC0 mismatch warning in
  `autogenerateThac0`.
- `lib/src/services/weapon.service.ts` (1): the default-weapon-speed
  warning in `checkWeaponSpeed`.
- `lib/src/services/effects/grab.service.ts` (1): the creature-size-needed
  warning in `getGrabImmuneEffects`.
- `lib/src/services/weidu/weidu-creature.service.ts` (1): the
  no-slot-defined warning.
- `lib/src/services/doc/description.service.ts` (1): the unknown-duration
  warning.

**Out of scope:** every other `logService.log(...)` call stays as `.log(...)`
— including the ⚠-free info/action messages, and the arrow-marked
(`figureSet.arrowRight`) messages in `effects/immunity.service.ts` and
elsewhere, per your choice not to count those as warnings.

### Test updates

Four existing test files spy on `logService.log` for a message that is one
of the 13 warning sites above, and must retarget that specific spy to
`logService.warn` (other spies in the same file that cover non-warning
messages are unaffected):

- `lib/src/factories/creature.factory.test.ts` — the 2 `equipItem` tests
  that spy on the slot-conflict warning.
- `lib/src/services/main.service.test.ts` — the 3 `isCreatureValid`/
  `generateCreature` tests.
- `lib/src/services/effects/grab.service.test.ts` — the "warns when the
  creature has no size" test.
- `lib/src/services/doc/description.service.test.ts` — the blanket
  `beforeEach` silencer and the "warns and falls back to raw seconds" test.

`lib/src/services/effects/immunity.service.test.ts`'s spy stays targeting
`.log` — its covered messages (helmet/skipping) are arrow-marked, not in the
warning list.

### `log.service.test.ts`

New tests are added (following the existing real-file-I/O style, no mocks)
covering: `warn()` writes the same as `log()` (indent-prefixed), `warn()`
increments the count while `log()` does not, `summary()` writes `"No
warnings"` when none were logged, `"1 warning"` for exactly one, and
`"N warnings"` for more than one, and `init()` resets the count across runs.
