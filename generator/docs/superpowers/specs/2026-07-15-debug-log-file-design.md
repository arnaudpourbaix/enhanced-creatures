# Debug log file (replacing console.log)

## Problem

The generator scatters ~40 `console.log`/`console.warn` calls across services and
factories to trace what happens during a run (creature creation, validation
warnings, weapon/AC/THAC0 calculations, spell/projectile registration, etc.).
This floods the terminal and isn't organized for reading after the fact. We want
a single readable log file instead, with a quiet terminal.

## Design

### `LogService` (`lib/src/services/log.service.ts`)

A singleton, same pattern as `translationService`/`utilsService`. Writes
directly to disk on every call via `fs.appendFileSync` (no in-memory buffer/flush
step), so a partial log survives a crash. Tracks one piece of state: the current
indent prefix.

- `init()` — truncates/creates `generator.log` at `process.cwd()` (the generator
  project root when run via `npm run atweaks`), resets indent to `""`. Called
  first thing in `index.ts`, before `stateService.init()`.
- `section(title: string)` — blank line, `title`, then a `-` underline matching
  the title's length. Resets indent to `""` (top-level).
- `header(title: string)` — blank line, then `title` (no underline). Sets indent
  to 4 spaces so subsequent `log()` calls nest underneath, until the next
  `section()`/`header()` call.
- `log(message: string)` — writes `message` with the current indent prefixed on
  every line (message may be multi-line).

Callers keep embedding `figureSet.warning`/`figureSet.arrowRight` symbols
(from the `figures` package) directly in their message text — those are plain
Unicode and render fine in a text file. Any `chalk.*` color wrapping is dropped
at the call site since a plain text file has no use for ANSI codes.

### Phase sections in `index.ts`

`index.ts` wraps each of the 5 `mainService` calls with a new `section()` call
that doesn't exist as a log line today — added purely for readability:

```ts
logService.init();
logService.section("Checking presets");
mainService.checkPresets();
logService.section("Checking spells");
mainService.checkSpells();
logService.section("Generating creatures");
mainService.generateCreatures();
logService.section("Generating common code");
mainService.generateCommonCode();
logService.section("Generating translations");
mainService.generateTranslations();
```

`console.log(chalk.green("\nFinished!"))` and
`console.error(chalk.red(\`\nError: ...\`))` stay on the terminal (per the
"errors + final summary only" console policy below), but each also gets a
matching `logService.log(...)` call so the file ends with a complete record
("Finished!" or the error message) instead of stopping mid-run.

### Console output policy

During a normal run the terminal only prints:

- the fatal error handler in `index.ts` (`console.error`), if the run throws
- the final `"Finished!"` line

Everything else that's currently `console.log`/`console.warn` for debugging
purposes moves to `logService.log(...)` and is file-only.

### Example output

```
Generating creatures
---------------------

Creating Ogre...
    -> dual wielding detected
    ! Family doesn't match: Ogre <-> Troll

Creating Ogre Berserker from Ogre...
    -> movement increased to 12 (barbarian)
```

### Call-site migration

Every active debugging `console.log`/`console.warn` call converts to
`logService.log(...)` (or `logService.header(...)` for the two "Creating..."
banners in `family.ts`):

- `lib/src/model/creature/family.ts` — 2 "Creating..." banners → `header()`;
  `"autogenerate", cre.autoGenerate` → `log(\`autogenerate: ${JSON.stringify(...)}\`)`
- `lib/src/factories/creature.factory.ts` — 6 calls (slot conflict, family
  mismatch, no files, duplicate files, no attack, no behavior)
- `lib/src/services/main.service.ts` — 3 calls (`isCreatureValid` x2, `checkPresets` x1)
- `lib/src/services/creature.service.ts` — 6 calls, including the bare
  `console.log(p.base.files)` which becomes a labeled
  `log(\`base files: ${JSON.stringify(p.base.files)}\`)`
- `lib/src/services/weapon.service.ts` — 3 calls
- `lib/src/services/hit-point.service.ts` — 1 call
- `lib/src/services/effects/immunity.service.ts` — 3 calls (drop chalk color)
- `lib/src/services/effects/grab.service.ts` — 1 call
- `lib/src/services/effects/poison.service.ts` — 1 active call (the commented-out
  one stays commented, untouched)
- `lib/src/services/spell.service.ts` — 2 calls
- `lib/src/services/item.service.ts` — 1 call
- `lib/src/services/doc/documentation.service.ts` — 1 call
- `lib/src/model/creature/creature.ts` — 1 call
- `lib/src/services/weidu/weidu-creature.service.ts` — 1 `console.warn` call
- `lib/src/services/doc/description.service.ts` — 1 `console.warn` call

**Out of scope:** the commented-out `console.log` lines in
`lib/src/services/baf/target.service.ts` and `lib/src/services/utils/utils.service.ts`
are dead code and stay as-is.

### Test updates

`main.service.test.ts`, `creature.factory.test.ts`, and
`weidu-creature.service.test.ts` currently spy on `console.log`/`console.warn`
to assert on warning text. They switch to `vi.spyOn(logService, "log")`, keeping
the same `expect(...).toHaveBeenCalledWith(expect.stringContaining(...))`
assertions.
