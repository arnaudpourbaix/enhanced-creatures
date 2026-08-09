# Isolate per-creature errors so one bad creature doesn't kill the whole run

## Problem

Any `throw new Error(...)` reached while building or generating a single
creature currently propagates all the way up to `index.ts`'s `handleError`,
which logs one line and calls `process.exit(1)` — stopping the entire run,
even though hundreds of other creatures were unaffected. This happens in two
places:

- **Construction**: each family's constructor (e.g. `BasiliskFamily` in
  `lib/creatures/basilisks.ts`) synchronously calls
  `this.addCreature(this.lesser())`, `this.addCreature(this.greater())`, etc.
  A throw inside a builder method (`lesser()`, `greater()`, ...) or inside
  `Creature.validate()` (called from `CreatureFamily.addCreature`) aborts the
  family's constructor immediately — so every creature *after* the broken one
  in that family, and every family after it in `familyFactories`, never gets
  built at all.
- **Generation**: `MainService.generateCreature()`
  (`lib/src/services/main.service.ts`) calls `bafGeneratorService.generate()`
  and `weiduCreatureService.generateWeiduScript()` for each already-built,
  already-valid creature. A throw here aborts the whole `generateCreatures()`
  loop the same way.

The codebase already has a working "invalid creature" concept
(`Creature.valid: boolean | undefined`, checked by
`MainService.isCreatureValid()` before generation) and a working error-count
mechanism (`LogService.error()` / `hasErrors()`, which already drives the
final `process.exit(1)` in `index.ts` after a full run). This feature wires
uncaught per-creature exceptions into that existing machinery instead of
letting them exit the process directly.

**Out of scope**: errors from setup/global steps that aren't tied to a single
creature — `MainService.checkPresets()`, `checkSpells()`, the
duplicate-family-id check in `generateCreatures()`, `generateCommonCode()`,
`generateTranslations()`, documentation/changelog generation, and the
`copy` command — keep throwing straight out to `handleError` and exit(1)
immediately, since there's no single creature to blame or skip.

## Design

### `CreatureFamily.addCreature()` (`lib/src/model/creature/family.ts`)

Change the signature from taking an already-built creature to taking a
builder thunk:

```ts
// before
addCreature(creature: T) {
  creature.validate(this.id);
}

// after
addCreature(build: () => T) {
  let creature: T | undefined;
  try {
    creature = build();
    creature.validate(this.id);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    const label = creature ? translationService.from(creature.name) : "creature";
    logService.error(`Failed to build ${label}: ${message}`);
    if (e instanceof Error && e.stack) logService.log(e.stack);
    if (creature) creature.valid = false;
  }
}
```

Notes:

- If `build()` throws before `create()`/`createFrom()` ran, `creature` stays
  `undefined` and the log falls back to the generic label `"creature"` — the
  preceding `logService.header("Creating ...")` line (written by
  `create()`/`createFrom()`) is what normally supplies context in
  `generator.log` for errors that happen after that point.
- If `build()` succeeds but `validate()` throws partway through, the creature
  object was already pushed into `family.creatures` by `create()`/
  `createFrom()` (which push immediately, before `validate()` runs) — so it's
  still present in `family.creatures` with `valid` left `undefined`/whatever
  `validate()` had set before throwing. Explicitly setting
  `creature.valid = false` in the catch removes any ambiguity and produces
  the accurate "is not valid" warning (instead of the misleading
  "has not been validated, you must call validate" one) when
  `isCreatureValid()` later checks it.
- No re-throw: the family constructor continues to the next `addCreature()`
  call, and `generateCreatures()`'s `for (const factory of familyFactories)`
  loop continues to the next family.

### Call-site migration (`lib/creatures/*.ts`)

Every active call site changes from passing a built creature to passing a
thunk:

```ts
// before
this.addCreature(this.lesser());

// after
this.addCreature(() => this.lesser());
```

This is a mechanical one-line edit at all 85 active call sites across the 19
family files under `lib/creatures/`. Commented-out call sites (e.g. the
disabled undead entries in `undead.ts`) are left untouched since they don't
compile either way.

### `MainService.generateCreature()` (`lib/src/services/main.service.ts`)

Wrap the two generation calls in try/catch:

```ts
generateCreature(creature: Creature) {
  if (!this.isCreatureValid(creature)) return;
  try {
    bafGeneratorService.generate(creature);
    weiduCreatureService.generateWeiduScript(creature);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    logService.error(
      `${translationService.from(creature.name)}: failed to generate - ${message}`,
    );
    if (e instanceof Error && e.stack) logService.log(e.stack);
    creature.valid = false;
  }
}
```

`creature.valid = false` here is mostly documentary at this point in the
pipeline (nothing re-checks it later in the same run), but keeps the field
accurate in case anything downstream (or a future caller) inspects it.

### End-to-end behavior

`logService.hasErrors()` already returns `true` once any `logService.error()`
call has happened, and `index.ts`'s `runGenerate()` already checks it after
the full pipeline runs and exits with code 1 if so. No changes are needed
there: a run with N broken creatures now logs N clear errors (each with a
stack trace) to `generator.log`, produces full output for every unaffected
creature and family, and still ends the process with exit code 1 — so
CI/build tooling still sees the run as failed, but a human gets a complete
log and a fully-generated mod for everything that *did* work.

## Testing

- `lib/src/model/creature/family.test.ts`: new tests for `addCreature` —
  builder throws before `create()` (logs with the generic "creature" label,
  no creature added), builder throws after `create()` (logs with the
  creature's name, creature present in `family.creatures` with
  `valid === false`), `validate()` throws (same as above), and the
  happy-path (no throw, creature validated and added) keeps working.
- `lib/src/services/main.service.test.ts`: new test for `generateCreature` —
  `bafGeneratorService.generate` (or `weiduCreatureService.generateWeiduScript`)
  throwing logs an error and sets `creature.valid = false`, without
  propagating the exception.
- Manual run: temporarily make one real creature's builder throw, run the
  generator, and confirm `generator.log` shows the error with a stack trace,
  the rest of the mod still gets generated (baf/tp2 files for other
  creatures present), and the process exits with code 1.
