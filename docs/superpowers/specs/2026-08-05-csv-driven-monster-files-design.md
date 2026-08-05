# CSV-driven monster `files:` lists

## Context

Each monster definition in `generator/lib/creatures/*.ts` calls `this.create({ monster, files, data, ... })`
(or `this.createFrom({ ... })`). The `files: string[]` array is hand-maintained and lists every
`.cre` resref in the game that this monster's generated WeiDU patch should overwrite.

`generator/assets/creatures.csv` is a separately-maintained inventory of every creature file across
all installed mods, extracted via the `extract-creatures` skill. The `monster-id-mapping` skill
computes a `MonsterId`/`ValidatedMonsterId` column pair on that CSV, mapping each row to the
`MonsterEnum` member it represents — but today that mapping is read-only documentation; nothing in
the generator consumes it. The two lists (hand-authored `files:` arrays and the CSV mapping)
have to be kept in sync manually, and as of the last `monster-id-mapping` run, 49 hardcoded
filenames across `undead.ts`, `feys.ts`, `dogs.ts`, and `wolves.ts` don't exist in the CSV at all
(mods not currently installed/extracted).

This spec makes `creatures.csv` the source of truth for monster file membership, with the
hand-authored arrays demoted to a backup list for files the CSV doesn't (and may never) know about.

## Goals

- `create()`/`createFrom()` pull a monster's file list primarily from `creatures.csv`.
- Hand-authored `files:` arrays remain as a fallback for filenames absent from the CSV entirely
  (uninstalled/unextracted mods).
- Zero risk of a wrong/unverified guess silently overwriting the wrong creature's `.cre` file.
- `setAdjustments()` and `notEnforceFiles` are completely unaffected — still 100% hand-authored.

## Non-goals

- Changing how `monster-id-mapping` itself computes `MonsterId`/`ValidatedMonsterId`.
- Automatically re-populating the CSV when new mods are installed (that's `extract-creatures`'s job).
- Preserving direct-match precision in `monster-id-mapping` for filenames removed from the TS
  source by this change (see Trade-offs).

## Design

### Runtime: `MonsterFilesService`

New file: `generator/lib/src/services/monster-files.service.ts`.

- On first use, synchronously reads `assets/creatures.csv` (relative to cwd, consistent with the
  existing `lib/templates/*` read pattern in `changelog.service.ts`/`documentation.service.ts`) and
  parses it with the same `;`-split approach `scripts/build-monster-id.ts` uses (no new CSV
  dependency).
- Builds `Map<string, string[]>` keyed by `MonsterId`, populated only from rows where
  `ValidatedMonsterId === "true"`. Unvalidated/guessed rows are never consumed — an incorrect guess
  (e.g. one of the 255 ambiguous ties from the last mapping run) must never drive a real file patch
  until a human confirms it in the CSV.
- Exposes `getFiles(monster: MonsterEnum): string[]`, keyed by `MonsterEnum[monster]` (the enum
  member's string name, which is exactly what `MonsterId` stores).
- Parsed once and memoized for the process lifetime (13.7k rows; generation constructs ~85 monsters).

### `family.ts` changes

`create()` and `createFrom()` (`generator/lib/src/model/creature/family.ts`):

- `files` becomes optional (default `[]`), matching the existing optional `notEnforceFiles`/`newFiles`.
- `cre.files = dedupe([...monsterFilesService.getFiles(p.monster), ...(p.files ?? [])])` — CSV-sourced
  files first, hand-authored backup entries appended, duplicates collapsed via `Set`. Order isn't
  semantically meaningful to WeiDU; this ordering just keeps output deterministic (stable git diffs).

### Cross-monster collision check (already exists — no new code)

`creature.factory.ts`'s `validate()` (called via `family.ts`'s `addCreature()`, right after
`create()`/`createFrom()` populates `cre.files`) already does this check today, at
`creature.factory.ts:163-173`: it filters the creature's `files` against every previously-validated
creature's `files` in `State.creatures`, and if any overlap, logs a warning and marks the creature
`valid = false` — `mainService.generateCreature()` then skips generating it (`isCreatureValid()`).
This is a warning, not a hard build failure (`logService.warn` doesn't affect
`logService.hasErrors()`'s exit-1 check), and it operates on whatever's in `creature.files` at
validation time — so it automatically extends to CSV-sourced files once `create()` merges them in,
with zero new code required. The safety net against a file being claimed both by CSV (for monster X)
and a stale hand-authored backup entry (for monster Y) is therefore already in place; the
implementation plan just needs a test proving it still fires when the collision comes from a
CSV-sourced file.

### Migration: trimming the hand-authored arrays

Because `monster-id-mapping`'s direct-match pass has absolute priority over guessing, every
hardcoded `files:` entry that has *any* row in `creatures.csv` (case-insensitive) is already
`MonsterId=<that exact monster>, ValidatedMonsterId=true` as of the last run. So trimming is
unambiguous and mechanical:

For every `files:` array literal inside a `this.create(...)`/`this.createFrom(...)` call across
`generator/lib/creatures/*.ts`, remove each string-literal element whose uppercase form appears
anywhere in `creatures.csv`'s `file` column; keep the rest as the backup list.

Implemented as a one-off script, `generator/scripts/trim-monster-files.ts`, extending the TS
compiler-API AST walk already used in `scripts/extract-monster-defs.ts` to precisely locate each
`files:` array literal and its element nodes, then splicing out matched elements (including their
own source line and any trailing `// comment`) from the original file text — not a full AST
reprint, to keep the diff minimal and preserve formatting/comments on untouched lines. Only the
`files:` property that's a direct argument to `create()`/`createFrom()` is touched; `notEnforceFiles`
and any `files:` arrays inside `setAdjustments(...)` calls are structurally distinct call sites and
are left alone.

This is a one-time run, not part of the regular `monster-id-mapping` skill loop — re-running it
later is safe (it's idempotent: already-trimmed arrays have nothing left to remove) but not
expected to be a recurring step.

### Test impact

Checked: no existing test actually asserts on a real creature's `.files` built through
`create()`/`createFrom()`. `baf-generator.service.golden.test.ts` builds a real Ankheg via
`createAnkhegs()` but only asserts on BAF *script* text (`bafGeneratorService.buildContent`), which
doesn't reference `creature.files`; `weidu-creature.service.test.ts` constructs fake `Creature`-like
objects directly with hand-set `.files`, bypassing `create()` entirely. So no existing snapshot
needs updating — the full suite should pass unchanged once `family.ts` is wired up, which itself is
a useful regression signal. New tests are still needed (see plan) to actually cover the merge
behavior, since nothing does today.

## Trade-offs

Trimming the hand-authored arrays means `monster-id-mapping`'s future direct-match pass loses some
precision: if a *new* CSV row later appears (e.g. after installing a mod) with a resref that
happens to match one of the now-removed hardcoded entries, it will fall to the guess pass instead
of getting an instant direct match, since that filename no longer exists anywhere in the TS source
for `extract-monster-defs.ts` to find. This only matters for coincidental resref collisions across
mods, which should be rare. Not solved here — revisit if it causes real friction.

## Open items for implementation plan

- Exact CSV column parsing shared/duplicated between `monster-files.service.ts` (runtime) and
  `scripts/build-monster-id.ts` (offline tooling) — likely stays duplicated since one runs under
  `ts-node` from `generator/scripts` and the other is part of the compiled `lib/` runtime, unless a
  shared parsing module is worth extracting.
