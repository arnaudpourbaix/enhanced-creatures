# Copy-mod command

## Problem

Testing a generated mod currently requires manually copying files into local
BG1/BG2 install folders. We want a CLI command that does this copy, kept
separate from `generate` so generation and deployment stay independent steps
(a combined "generate + copy" command can be added later on top of this).

## Scope

Not a production/release packaging step — this is for local testing only, so
a simple merge-copy (overwrite matching files, leave any extra destination
files alone) is sufficient. No cleaning, no zipping, no versioning.

## CLI wiring

`generator/lib/src/index.ts` currently ignores commander's parsed args
entirely — `main()` runs unconditionally regardless of argv. This changes to
real subcommands:

- `generate` — today's pipeline (`main()`'s body), registered as the default
  command so `npm run generate` (no args) keeps working unchanged.
- `copy [--bg1] [--bg2]` — new, runs only the copy step, independent of
  generation.

## What gets copied

Per the mod's `enhanced_creatures.tp2` (`%MOD_FOLDER%` resolves to the tp2's
own directory, i.e. the repo root), the following are copied as a unit:

- `enhanced_creatures.tp2`
- `lib/`
- `languages/`

from the repo root into each selected destination game folder.

## Destination configuration

A local, gitignored config file `generator/paths.local.json`:

```json
{
  "bg1": "C:/Games/Baldur's Gate",
  "bg2": "C:/Games/Baldur's Gate II"
}
```

Both keys are optional. A committed template `generator/paths.example.json`
documents the shape for first-time setup.

- Config file missing entirely → error, pointing at `paths.example.json` as
  the template to copy.
- A selected target (`bg1`/`bg2`) with no path configured, or a configured
  path that doesn't exist on disk → warning via `logService.warn`, that
  target is skipped, not a hard failure.

`generator/paths.local.json` is added to the root `.gitignore` (alongside the
existing `generator/monster-defs.json` entry).

## Target selection

- `copy` with no flags → copies to both `bg1` and `bg2`, whichever are
  configured (per above, missing ones are skipped with a warning).
- `copy --bg1` → only `bg1`.
- `copy --bg2` → only `bg2`.
- `copy --bg1 --bg2` → same as no flags (both).

## Implementation

New `generator/lib/src/services/copy.service.ts`:

- Resolves the repo root via `path.resolve(__dirname, "../../..")` (not
  `process.cwd()`), so the command works regardless of invocation directory.
- Reads and validates `paths.local.json`.
- For each selected, configured, existing target: copies the three items
  above using `fs.promises.cp(src, dest, { recursive: true, force: true })`.
- Logs progress through the existing `logService` (section headers,
  warn/error, summary), matching `generate`'s output conventions.

`generator/package.json` gets a new script:

```json
"copy": "ts-node lib/src/index.ts copy"
```

## Testing

`copy.service.test.ts` alongside the service, following the existing vitest +
mocked `fs` pattern used in `utils.service.test.ts`: verifies target
selection logic (both/--bg1/--bg2), missing-config-file error, unconfigured/
missing-path warning-and-skip behavior, and that `fs.promises.cp` is called
with the right source/destination pairs for each configured target.

## Out of scope (for this change)

- A combined `generate`-then-`copy` command (explicitly deferred by the
  user — a natural follow-up once this command exists).
- Cleaning/deleting stale destination files before copying.
- Copying anything beyond tp2 + lib + languages (e.g. `docs/`, `backup/`).
