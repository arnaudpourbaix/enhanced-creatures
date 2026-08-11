# Release command — design

## Purpose

A standalone script that cuts a GitHub release for Enhanced Creatures: validates the target
version, regenerates the mod, bumps version metadata, rolls the changelog, commits/tags/pushes,
packages the mod, and publishes a GitHub release with that package attached.

Invoked as `npm run release -- <version>`, e.g. `npm run release -- 0.2.0`.

Bundled with this: a bug fix to the existing `copy` command, which the `2026-08-11 refactor:
reorganize files structure` commit broke (see "Bug fix: copy.service.ts" below), and a one-time
alignment of `package.json` and the tp2's `VERSION` line, which are currently out of sync
(`0.0.1` vs `v0.1`).

## Non-goals

- Not a Claude Code slash command — a plain script, runnable without Claude in the loop.
- Not cross-platform packaging (zip via the `archiver` npm package is cross-platform in practice,
  but the script itself assumes a dev running it locally on their own machine, same as `generate`
  and `copy` today).
- Does not manage GitHub CLI installation/auth — the operator installs `gh` and runs
  `gh auth login` once, out of band.

## One-time setup (part of this work, not the script itself)

`package.json` (`0.0.1`) and `mod/enhanced_creatures.tp2`'s `VERSION ~v0.1~` line are currently
out of sync. Both are set to `0.1.0` (tp2 canonical, since that's the version players actually
see) as part of implementing this feature, so the release script's "versions must match" precheck
passes on first use.

## CLI surface

New commander command in `lib/src/index.ts`, following the existing `generate`/`copy` pattern:

```
npm run release -- <version>
```

- `<version>` — required, plain semver `X.Y.Z` (no `v` prefix, no prerelease/build metadata).
- Backed by a new `lib/src/services/release.service.ts`, mirroring `copy.service.ts`'s shape
  (a class instance exported as a singleton, methods called from `index.ts`'s `runRelease`).
- Logs to `release.log` via the existing `logService` (same convention as `copy`'s `copy.log`).

## Flow

1. **Preflight checks** — run first, before anything touches the working tree, so they only ever
   need to reason about a clean starting state:
   - `<version>` matches `X.Y.Z` (three numeric parts).
   - Current branch is `master`.
   - Working tree is clean (`git status --porcelain` empty).
   - Local `master` is up to date with `origin/master` (`git fetch`, then compare
     `git rev-parse master` vs `git rev-parse origin/master`).
   - `gh auth status` succeeds (CLI installed and authenticated).
   - `package.json`'s `version` and the tp2's `VERSION ~vX.Y.Z~` line parse to the same semver
     (source-of-truth-must-match rule agreed for this feature). If they don't match, abort with a
     message telling the operator to reconcile them manually.
   - `<version>` is strictly greater than the current version (tuple comparison: major, then
     minor, then patch).

   Any failure here aborts with no side effects.

2. **Run generate** — invoke the same logic `runGenerate()` in `index.ts` uses (checks presets,
   checks spells, generates creatures/common code/translations). This is expected to change files
   under `mod/` on essentially every run, because generation uses Fisher–Yates shuffle for target
   ordering (see README) — that's normal, not a sign something's wrong. If generation reports
   errors (`logService.hasErrors()`), abort before touching version files; nothing has been
   committed yet.

3. **Update version files:**
   - `package.json` → `"version": "X.Y.Z"`.
   - `mod/enhanced_creatures.tp2` → `VERSION ~vX.Y.Z~`.
   - `mod/CHANGELOG.md` → rename `## [Unreleased]` to `## [X.Y.Z] - <today, YYYY-MM-DD>`, then
     insert a fresh, empty `## [Unreleased]` heading above it. The text captured between the old
     `## [Unreleased]` heading and the next `## [...]` heading (or EOF) is retained in memory as
     the GitHub release notes body.

4. **Commit** — stage `package.json`, `mod/enhanced_creatures.tp2`, `mod/CHANGELOG.md`, and
   whatever `generate` changed under `mod/`, as one commit: `chore: release vX.Y.Z`.

5. **Tag and push** — create annotated tag `vX.Y.Z` on that commit; `git push origin master
   --follow-tags`.

6. **Package** — zip the entire contents of `mod/` (whatever's there: tp2, `lib/`, `languages/`,
   `docs/`, `CHANGELOG.md`, anything added later — no hardcoded file list) into
   `dist/enhanced_creatures-vX.Y.Z.zip`, rooted under a top-level `enhanced_creatures/` folder so
   the zip extracts directly into a game's install directory. `dist/` is already gitignored.
   Uses the `archiver` npm package (new dependency) for zip creation.

7. **Publish** — `gh release create vX.Y.Z dist/enhanced_creatures-vX.Y.Z.zip --title vX.Y.Z
   --notes-file <tmp file containing the captured changelog section>`.

## Re-run safety

Steps 4–5 (commit/tag/push) happen before steps 6–7 (package/publish). If packaging or `gh
release create` fails after the push, the repo is left with a pushed, tagged release commit but
no GitHub release yet. Re-running the script with the same version must not fail on "tag already
exists" in that state — if the tag already exists and points at current `master` HEAD, skip
straight to packaging/publishing instead of erroring.

## Bug fix: copy.service.ts

The `73bceff refactor: reorganize files structure` commit moved this file from
`generator/lib/src/services/copy.service.ts` to `lib/src/services/copy.service.ts` (one directory
shallower) without updating its path math, so `copy` is currently broken:

- `repoRoot = path.resolve(__dirname, "..", "..", "..", "..")` now resolves to the *parent* of
  the repo root (one `..` too many for the file's new location).
- `configPath`/`exampleConfigPath` still look for `paths.local.json` under a `generator/`
  subfolder that no longer exists (it now lives at the repo root).
- The hardcoded `MOD_ITEMS = ["enhanced_creatures.tp2", "lib", "languages", "docs"]` list copies
  from the repo root, but those now live under `mod/`.

Fix, and generalize per this feature's requirement that "copy takes everything inside the mod
folder":

- Correct `repoRoot` to 3 `..` from `lib/src/services/`.
- Point `configPath`/`exampleConfigPath` at the repo root directly (no `generator/` prefix).
- Replace the per-item `MOD_ITEMS` loop with a single
  `fs.promises.cp(MOD_DIR, dest, { recursive: true, force: true, filter })` call, where
  `MOD_DIR = path.join(repoRoot, "mod")`. This copies whatever is under `mod/` without needing
  the list updated when files are added — the same property the release zip needs. The existing
  `docs/superpowers` exclusion filter is kept as a defensive no-op (that path doesn't currently
  exist under `mod/`, since dev-process specs live at the repo root's `docs/superpowers/`, not
  `mod/docs/superpowers/`).

## Error handling

- Preflight failures: abort, no side effects, clear message naming which check failed.
- Generate failures (step 2): abort before any version/changelog/git changes; point at
  `release.log`/`generator.log`.
- Failures after push (steps 6–7): report clearly that the commit/tag/push succeeded but
  packaging/publishing did not, and that re-running the script will resume from packaging.

## Testing

- `copy.service.test.ts` — update for the fixed paths and the wholesale-copy behavior.
- `release.service.ts` — unit tests for the pure-logic pieces with git/gh/fs mocked:
  - semver parsing and comparison (valid/invalid formats, greater/equal/lesser).
  - changelog section rename + notes extraction (including the "insert fresh `## [Unreleased]`"
    behavior).
  - tag-already-exists-at-HEAD re-run detection.
