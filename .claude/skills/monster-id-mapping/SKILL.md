---
name: monster-id-mapping
description: Use when generator/assets/creatures.csv needs its MonsterId/ValidatedMonsterId columns computed or refreshed - after adding or editing monster definitions in generator/lib/creatures/*.ts, or after merging new creature rows into creatures.csv (e.g. via the extract-creatures skill). Maps each creature row to the MonsterEnum value it represents, using direct file-list matches plus a conservative general/race/class/animation guess for everything else.
---

# Monster ID Mapping

## What it does

Adds/refreshes two columns on `generator/assets/creatures.csv`:

- **MonsterId** - the `MonsterEnum` member name (from `generator/lib/creatures/monster.ts`) this
  creature row represents, e.g. `Wolf`, `DireWolf`, `BlackBear`. Blank if the row isn't part of
  any monster family the generator currently implements (most rows - dragons, demons, human
  NPCs, etc. - are out of scope by design).
- **ValidatedMonsterId** - `true` if the filename was found directly in that monster's defined
  `files` list (ground truth - no need to double check), `false` if it's an algorithmic guess
  (needs a skeptical read in an editor), or blank if there's no MonsterId at all.

## When to run it

- After adding a new monster (or new files for an existing monster) to `generator/lib/creatures/*.ts`.
- After merging new creature rows into `creatures.csv` (e.g. via the `extract-creatures` skill) -
  new rows won't have a MonsterId until this runs.
- For a sibling project targeting another game (e.g. a BG1EE equivalent of this generator) - see
  "Reusing on another project" below.

## How the matching works

1. `scripts/extract-monster-defs.ts` statically parses `generator/lib/creatures/*.ts` for
   `this.create({...})` / `this.createFrom({...})` calls, extracting each `MonsterEnum` value's
   `files` list and canonical `general`/`race`/`class`. It only keeps monsters whose creation
   method is actually invoked (non-commented) from their family's constructor -
   `// this.addCreature(this.wight())`-style commented-out lines are automatically excluded, so
   unfinished/stub monster definitions never pollute the mapping. Output: `monster-defs.json`
   (gitignored, regenerated each run).
2. `scripts/build-monster-id.ts` does the matching in two passes:
   - **Direct**: row's `file` appears in some monster's `files` list -> `MonsterId=<name>`,
     `ValidatedMonsterId=true`.
   - **Guess** (everything else): candidates are restricted to monsters whose `race` matches the
     row's `race` exactly. Race (or race+general) alone is *not* enough to accept a guess -
     many unrelated rows share a race (every demon shares Hellcat's race `DEMONIC`, for example).
     A candidate is only eligible if `class` also matches, or the row's `anim` value was actually
     seen among that monster's direct-matched rows. Among eligible candidates, score by:
     class match (+3, or +1 if the class is a generic D&D role token like `FIGHTER`/`MAGE`/
     `CLERIC`/combos thereof, since that doesn't distinguish monsters), general match (+1),
     animation match (+2). Highest score wins; a tie leaves `ValidatedMonsterId=false` like any
     guess, but is also printed in the console's "ambiguous" report - review those first.

## Re-run safety (important)

`build-monster-id.ts` **never touches a row whose `ValidatedMonsterId` is already `true`** -
whether that came from a previous direct-file match (deterministic, harmless either way) or from
you manually reviewing a guess in an editor and confirming/correcting it. To lock in a manual
correction so future re-runs can't clobber it, set that row's `ValidatedMonsterId` to `true`
yourself. Anything left `false` or blank is fully recomputed on the next run.

## Procedure

From `generator/`:

```
npx ts-node scripts/extract-monster-defs.ts
npx ts-node scripts/build-monster-id.ts
```

Both accept `--generator <path>` (default: cwd) if you're not running from `generator/` itself.
`build-monster-id.ts` also accepts `--defs <path>` (default: `<generator>/monster-defs.json`) and
`--csv <path>` (default: `<generator>/assets/creatures.csv>`).

Read the console summary after `build-monster-id.ts`: counts of locked/direct/guessed/ambiguous/
none, plus the full list of ambiguous ties. `git diff` the CSV afterward to review.

## Reusing on another project (e.g. a BG1EE generator)

These scripts must run using the target project's own `node_modules` (they `import "typescript"`,
resolved relative to the script's own location) - copy `scripts/extract-monster-defs.ts` and
`scripts/build-monster-id.ts` into that project's own `generator/scripts/` (or wherever it has
`ts-node`/`typescript` installed) rather than invoking this repo's copies against a different
`--generator` path. The target project needs the same shape: `lib/creatures/*.ts` family
definitions with the same `this.create({monster, files, data: {general, race, class}})` pattern,
and `assets/creatures.csv` with the same 9-column header this repo uses.

## Known gaps in this repo (as of the last run)

- `Tiger` and `MutatedSpider` are declared in `MonsterEnum` but never implemented anywhere -
  they will never get a MonsterId.
- `undead.ts` has 7 commented-out/unfinished monsters with placeholder, copy-pasted data
  (`DeathKnight`, `DeathShade`, `Wight`, `Wraith`, `Zombie`, `ZombieJuju`, `ZombieSea`) - excluded
  from matching until their source definitions are finished.
- ~472 of the ~633 filenames referenced across `lib/creatures/*.ts` don't appear anywhere in
  `creatures.csv` (e.g. the source lists `ANKHEG`, but the real file is `ANKHEG01`). This is
  likely BG1 vs BG2 resref differences or stale references in the source - those creatures fall
  back to the guess pass instead of getting a direct match. Worth a source cleanup pass someday.
