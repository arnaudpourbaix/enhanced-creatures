# Spell / ability consistency check

## Problem

A creature's AI (`behavior.abilities`) only casts a spell if there is an
explicit `CreatureAbility` entry for it in the compiled BAF script. Nothing
today checks that every spell the creature actually has memorized (via
`data.spells.memorized`, `data.spells.spellbooks[].memorized`, or an
adjustment's own memorized list) has a matching ability. When one is
missing, the creature silently never casts that spell in-game.

Concrete case: Greater Mummy (`lib/creatures/undead.ts`) defines three
mod-conditional spellbook variants (`FaithsAndPowers`, `SpellRevisions`,
`Vanilla`) but a single hand-written `abilities` list that matches only the
`FaithsAndPowers` variant. Under `SpellRevisions` or `Vanilla`, spells like
`Bless`, `Silence`, `HoldPersonCleric`, `FlameStrike`, `TrueSeeing`,
`BladeBarrier`, etc. are memorized but have no ability at all.

## Design

### `LogService` — new `error()` level (`lib/src/services/log.service.ts`)

Generic addition, usable by any future check, alongside the existing
`warn()`:

- A private `errorCount` counter, reset to `0` in `init()` (next to the
  existing `warningCount` reset).
- `error(message: string): void` — same behavior as `warn()` (indent-prefixed
  write, one line per `\n`-split line) but increments `errorCount` instead of
  `warningCount`.
- `summary()` gains an errors line, printed above the warnings line:
  `"No errors"` / `"1 error"` / `"N errors"`, then the existing
  `"No warnings"` / `"1 warning"` / `"N warnings"` line.
- New `hasErrors(): boolean` — returns `errorCount > 0`. Used by `index.ts` to
  decide the process exit code.

### `index.ts` — fail the run on errors

After the existing `logService.summary();` call, add:

```ts
if (logService.hasErrors()) {
  console.error(chalk.red(`\nGenerator finished with errors, see generator.log`));
  process.exit(1);
}
```

This runs after all creatures have been generated (consistent with the
existing "collect everything, report at the end" pattern), so a single run
surfaces every error, not just the first one. `logService.log("Finished!")`
and the green success message are skipped in this branch since the run
didn't actually succeed.

### New check: `CreatureService.checkSpellAbilities(creature)`

New method in `lib/src/services/creature.service.ts`, called from
`creatureFactory.validate()` (`creature.factory.ts:178`) right next to the
existing `creatureService.check(creature)` / `checkWeapons(creature)` calls.

**Step 1 — collect memorized-spell groups.** Each group is `{ label: string,
files: string[] }`:

- `"default"` ← `creature.data.spells.memorized[].file` (this is also the
  WeiDU fallback used when no listed spellbook mod is installed, per
  `SpellbookVariant`'s doc comment in `data.ts`).
- one group per `creature.data.spells.spellbooks[]` entry, labeled by
  `variant.mod` (e.g. `"FaithsAndPowers"`) ← `variant.memorized[].file`.
- one group per non-empty `creature.adjustments[i].data.spells.memorized`,
  labeled `"adjustment #i"` ← same shape. (Adjustments have no `behavior` of
  their own — `CreatureAdjustment` only carries `data` — so their memorized
  spells are checked against the same shared `behavior.abilities`.)

Groups with an empty `files` list are skipped entirely.

**Step 2 — collect ability resources.** `creature.behavior.abilities` is
scanned for every entry with `resource` defined. Confirmed by tracing
`ability.service.ts`/`ABILITY_PRESETS`: for the preset-driven path (used by
virtually every spellcasting ability in this codebase, e.g.
`this.preset(SPELLS.Priest.FingerOfDeath.file)`), `resource` ends up equal to
the spell's `.file` — the same string used in `MemorizedSpell.file`. Abilities
with no `resource` (non-spell abilities like a fear aura) are ignored by both
directions of this check.

**Step 3 — compare, per group:**

- **Error** (`logService.error`) for every file in the group not present in
  the ability-resource set:
  `` `${figureSet.cross} ${translationService.from(creature.name)}: spell '<file>' is memorized in '<group label>' but has no matching ability - it will never be cast.` ``
- **Warning** (`logService.warn`) for every ability resource not present in
  the union of *all* groups' files (computed once per creature, not
  per-group, to avoid duplicate warnings):
  `` `${figureSet.warning} ${translationService.from(creature.name)}: ability references spell '<file>' which isn't memorized in any spellbook variant.` ``

No exemption/opt-out mechanism, and no special-casing for creatures using
`behavior.spellcaster` (sequencer/contingency/chain-contingency) — those only
add sequencer/contingency *triggers* on top of existing per-spell abilities,
they don't replace the need for one.

### Testing

- `log.service.test.ts` — mirror the existing `warn()`/`summary()` coverage
  for `error()`: increments count, `summary()` output with 0/1/N errors,
  `hasErrors()` true/false, `init()` resets the counter.
- `creature.service.test.ts` — new `checkSpellAbilities` tests:
  - memorized spell with matching ability → no log calls.
  - memorized spell (in `data.spells.memorized`) with no matching ability →
    one `error()` call naming `"default"`.
  - a `spellbooks` variant with a spell missing its ability → one `error()`
    call naming that variant's `mod`.
  - an adjustment's memorized spell missing its ability → one `error()` call
    naming `"adjustment #<i>"`.
  - an ability resource not memorized anywhere → one `warn()` call, and it
    fires only once even if referenced across multiple groups.
  - an ability with no `resource` (e.g. a fear-aura-style ability) → no
    warning.
- `index.ts` has no existing test file (checked: none present) — this spec
  does not add one, consistent with the rest of that file's untested
  bootstrap code.
