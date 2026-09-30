# Level-gated spell protections

Date: 2026-09-23
Status: Approved, ready for implementation plan

## Context

`enhanced-creatures` already has a `SpellKeyword` system (see
`lib/config/spells/keyword.ts`, `spell-check.ts`, `spell-check-config.ts`): each
`SPELLS` entry can declare a `keywords` array, and `AbilityService`/`PresetFactory`
auto-inject the matching `SPELL_CHECK_TRIGGERS` onto an ability's target-list
triggers so a monster's attack spells automatically skip targets protected against
that effect (fire resistance, charm immunity, magic resistance, etc.). Keywords are
hand-tagged per spell in `SPELLS`, which is the right model for keywords tied to
*what a spell does* (its damage/effect type).

Global protections like Minor Globe of Invulnerability, Globe of Invulnerability,
Spell Deflection, Spell Turning, Spell Immunity, and Shield of the Archons don't
fit that model: whether they block a spell depends on the spell's **level**, not
on what the spell does. Only Minor Globe ever got a hand-written trigger
(`triggerFactory.checkStatGT(0, "MINORGLOBE", true)`, in ~35 preset call sites) -
a partial, "easy win" implementation done before a better mechanism was known
about; the other protections were never wired up at all.

The engine already exposes exactly the right primitive for this:
`ImmuneToSpellLevel(Object, Level)` (`lib/src/model/script/triggers.ts`) returns
true if the target object is immune to spells of the given level, for *any*
reason - it reads whatever protection is actually active on the target, the same
information the game engine itself would use to decide whether a cast gets
blocked. This makes every one of the protections above (and any future one) a
non-issue: one generic, level-driven check replaces the need for a
protection-specific stat or keyword per protection entirely.

`assets/spells/001_vanilla.csv` (and the mod-specific siblings
`002_spell_rev.csv`, `003_stratagems_iwd.csv`, `004_stratagems_newspells.csv`)
already carry a real `level` column per spell file, sourced from actual spell.ids
snapshots - the same kind of authoritative data source already used for
`assets/spells/bypass-magic-resistance.csv`. `SpellReference.level` exists on the
type today but is populated nowhere. Innate abilities (SPCL/SPIN files) have a
real level value there too (e.g. Moon Dog Howl / `SPIN891` is level 6) - it's
their genuine spell.ids level, not an approximation, and is used as-is with no
special-casing.

## Goals

- Let any level-based global protection apply to every spell it covers
  automatically, with no per-spell or per-protection hand-tagging.
- Backfill `SpellReference.level` from real game data, not guesswork.
- Remove the ~35 existing hand-written `MINORGLOBE` triggers, fully subsumed by
  the generic check (not migrated to a keyword - there's no keyword for this at
  all, see Design).

## Non-goals

- A `SpellKeyword`/`SPELL_CHECK_TRIGGERS` entry for globes or any other
  level-based protection - the whole point is that this doesn't need one.
- Changing how the existing damage/effect-type keywords (fire, charm, hold, ...)
  work. This is an independent, parallel mechanism.

## Design

### The check itself

`ImmuneToSpellLevel` takes the target and a spell level, and is true if the
target is immune to spells of that level for any reason currently active on
them. So the check for a given ability is simply:

```typescript
{ name: "ImmuneToSpellLevel", params: [ScriptTarget.token, level], negation: true }
```

where `level` is the ability's own spell level. No table, no per-protection
stat, no keyword - one check, parametrized by the spell being cast.

### `RawCreatureAbility.level` and auto-resolution

`level?: number` is added to `BaseCreatureAbility`/`RawCreatureAbility`
(`lib/src/model/creature/ability.ts`), mirroring the existing `keywords?:
SpellKeyword[]`.

A new `levelForFile(spells: SpellCollection, file: string): number | undefined`
is added to `lib/src/model/spell-item/spell-reference.ts`, mirroring
`keywordsForFile`: it looks up the `SPELLS` entry whose `file` (or any
`variants[].file`) matches, and returns its `level`.

Both `PresetFactory.create` and `AbilityService.applyPreset` auto-resolve
`ability.level` the same way they already auto-resolve `ability.keywords`: an
explicit `level` on the ability/override always wins; otherwise it's resolved
from the matching `SPELLS` entry.

### Injection

`AbilityService.appendSpellCheckTriggers` (and the equivalent path in
`generateSequencer`) gains the `level` parameter alongside `keywords`. Whenever
`level !== undefined` and `GLOBAL_CONFIG.spellChecks.spellProtections` is
enabled, the `ImmuneToSpellLevel` trigger above is appended to every target
list's triggers - unconditionally, independent of whatever `SpellKeyword`s the
ability has (this mechanism runs in parallel with, not through,
`triggerFactory.spellChecks`).

### Backfilling `SpellReference.level`

One-off codemod (`scripts/tmp-add-spell-level.ts`, deleted after running, same
pattern as the earlier `magicResistance` import):

1. Parse `001_vanilla.csv` into a `Map<file, level>` (case-insensitive file
   match). Fall back to `002_spell_rev.csv`, then `003_stratagems_iwd.csv`, then
   `004_stratagems_newspells.csv` in order for any file not found in vanilla.
2. Walk the `SPELLS` AST (TS Compiler API, reusing the `unwrapObjectLiteral`
   helper from the earlier codemod to see through `satisfies`/`as` wrappers) and,
   for each entry missing `level`, resolve it via the entry's base `file` first,
   then each `variants[].file`, inserting `level: N` after `file`/`id`.
   Comments and formatting are preserved, as before.
3. Entries whose file isn't found in any CSV (custom/monster-only spells) are
   left without `level` - they simply don't get the automatic check, same as
   today.

### Migrating the existing `MINORGLOBE` call sites

Every preset call site hand-writing `triggerFactory.checkStatGT(0, "MINORGLOBE",
true)` gets that trigger deleted outright - not migrated to anything, since the
generic level-driven check covers it (and more) automatically once `level` is
backfilled for that spell. No exceptions: e.g. Moon Dog Howl's real level (6) is
used as-is, with no override, since it's a genuine spell.ids level, not an
approximation.

`dispel-presets.ts:68`'s `checkStatGT(0, "MINORGLOBE")` (no negation, used to
pick a valid dispel target rather than to skip a protected one) is a different
semantic, still keyed off the old custom stat, and stays untouched - it was
never part of the "avoid attacking an immune target" concern this design
addresses.

**Expected side effect:** the generic check applies to every spell with a
backfilled `level`, not just the ~35 that had the hand-written `MINORGLOBE`
check before, and it protects against every level-based immunity effect, not
just globes. Attack spells that never had any such check before will start
getting one. This is the intended fix, not a bug, but worth the user's review
once implemented, same as the `magicResistance` rollout.

### Testing

- `levelForFile`: matches the entry's own file, a variant's file, case
  insensitivity, and returns undefined when no entry matches or the matched
  entry has no `level`.
- `PresetFactory.create` / `AbilityService.applyPreset`: `level` auto-resolves
  the same way `keywords` does (explicit override wins; resolves once and is
  shared across preset name variants).
- `AbilityService`: an ability with a resolved `level` gets `ImmuneToSpellLevel`
  appended to its target-list triggers; one without `level` doesn't; disabling
  `GLOBAL_CONFIG.spellChecks.spellProtections` suppresses it.
- Full verification pass: `npx tsc --noEmit`, `npx eslint`, `npx prettier
  --check`, `npx vitest run` (expect the same 9 pre-existing, unrelated
  failures noted in `verify-generator-refactor` memory, none new).
