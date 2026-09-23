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

Global protections like **Minor Globe of Invulnerability** don't fit that model:
whether they block a spell depends on the spell's **level**, not on any
fire/charm/hold-style property. `MINORGLOBE` is already hand-written as a trigger
in ~35 preset call sites (`triggerFactory.checkStatGT(0, "MINORGLOBE", true)`)
because it was never wired into the keyword system. More protections of this kind
are coming (Globe of Invulnerability, Minor Spell Deflection, Shield of the
Archons), each with a different level cutoff (or none at all), and hand-tagging
every affected spell for every new protection doesn't scale.

`assets/spells/001_vanilla.csv` (and the mod-specific siblings
`002_spell_rev.csv`, `003_stratagems_iwd.csv`, `004_stratagems_newspells.csv`)
already carry a real `level` column per spell file, sourced from actual spell.ids
snapshots - the same kind of authoritative data source already used for
`assets/spells/bypass-magic-resistance.csv`. `SpellReference.level` exists on the
type today but is populated nowhere.

## Goals

- Let a level-gated protection (Minor Globe now; others later) apply to every
  spell it covers automatically, with no per-spell hand-tagging for the common
  case.
- Still allow a per-spell exception (a spell that needs the keyword despite not
  matching the level rule - e.g. an innate ability whose assigned `level` doesn't
  reflect a real castable spell level).
- Backfill `SpellReference.level` from real game data, not guesswork.
- Remove the ~35 existing hand-written `MINORGLOBE` triggers once they're
  redundant, same as the `magicResistance`/`shield`/`missile` cleanup earlier
  this project.

## Non-goals

- Wiring up Globe of Invulnerability, Minor Spell Deflection, or Shield of the
  Archons now - their tracking stats aren't implemented yet. The design must make
  adding them later a one-line table entry, but doing so is out of scope here.
- A fully general predicate system (school, damage type, innate-vs-learned, ...).
  Nothing known today needs more than a level cutoff (or no cutoff). Revisit if a
  real protection needs it.

## Design

### `LEVEL_GATED_PROTECTIONS` table

New file `lib/config/spells/level-gated-protection.ts`:

```typescript
import { SpellKeyword } from "./keyword";

export const LEVEL_GATED_PROTECTIONS: Partial<Record<SpellKeyword, { maxLevel?: number }>> = {
  minorGlobe: { maxLevel: 3 },
};

export function levelGatedKeywords(level: number | undefined): SpellKeyword[] {
  return (Object.entries(LEVEL_GATED_PROTECTIONS) as [SpellKeyword, { maxLevel?: number }][])
    .filter(([, rule]) => rule.maxLevel === undefined || (level !== undefined && level <= rule.maxLevel))
    .map(([keyword]) => keyword);
}
```

`maxLevel` omitted means the protection blocks every level unconditionally
(future case: Shield of the Archons). This table only decides *keyword
membership by level* - the actual trigger (`CheckStatGT(..., "MINORGLOBE",
negation: true)`) stays in `SPELL_CHECK_TRIGGERS`, and its `spellProtections`
categorization stays in `SPELL_CHECK_CONFIG_KEYWORDS`, both unchanged.

`"minorGlobe"` is added to the `SpellKeyword` union
(`lib/config/spells/keyword.ts`), doc'd as "Blocked by Minor Globe of
Invulnerability (spell levels 1-3)".

### Merging with manual keywords

`keywordsForFile` (`lib/src/model/spell-item/spell-reference.ts`) - consumed by
both `PresetFactory.create` and `AbilityService.applyPreset` - changes from
returning `spell.keywords` verbatim to unioning it with
`levelGatedKeywords(spell.level)`:

```typescript
export function keywordsForFile(spells: SpellCollection, file: string): SpellKeyword[] | undefined {
  const target = file.toUpperCase();
  const spell = getAllSpells(spells).find((s) => spellFiles(s).some((f) => f.toUpperCase() === target));
  if (!spell) return undefined;
  const merged = [...new Set([...(spell.keywords ?? []), ...levelGatedKeywords(spell.level)])];
  return merged.length ? merged : undefined;
}
```

Consequences:
- A level 1-3 spell with no manual keywords at all now gets `minorGlobe` for
  free.
- A spell manually tagged with a keyword the level rule wouldn't derive (e.g.
  Moon Dog Howl's `minorGlobe`, despite its CSV-assigned level of 6) keeps
  working - the manual tag is additive, never overridden.
- An unbounded protection (`maxLevel` omitted) would apply regardless of whether
  `level` is even set (relevant once Shield of the Archons is added).

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
   left without `level` - they simply don't participate in level-gated
   auto-derivation, same as today.

### Migrating the existing `MINORGLOBE` call sites

For each of the ~35 preset call sites hand-writing
`triggerFactory.checkStatGT(0, "MINORGLOBE", true)`:

- If the spell's backfilled `level` is ≤ 3, `minorGlobe` now auto-derives - the
  hand-written trigger is deleted (same rule as the `magicResistance`/`shield`/
  `missile` cleanup: don't leave a hand-written trigger duplicating a
  keyword-covered check).
- Moon Dog Howl (`SPELLS.Innate.MoonDogHowl`, level 6) is the one exception:
  its hand-written trigger is migrated into an explicit `"minorGlobe"` entry in
  its `keywords` array (alongside existing `fear`, `magicResistance`) instead of
  being deleted, preserving current behavior.

`dispel-presets.ts:68`'s `checkStatGT(0, "MINORGLOBE")` (no negation, used to
pick a valid dispel target rather than to skip a protected one) is a different
semantic and stays untouched, consistent with buff/dispel-presets being excluded
from earlier keyword sweeps.

**Expected side effect:** backfilling `level` will likely make some level 1-3
attack spells that never had the hand-written `MINORGLOBE` trigger (an omission
in the original hand-curation, not a deliberate exclusion) start getting
`minorGlobe` for the first time. This is the intended fix, not a bug, but - same
as the `magicResistance` rollout - worth the user's review once implemented.

### Testing

- `levelGatedKeywords`: boundary at `maxLevel` (equal/below/above), the
  unbounded-rule case, and `level: undefined`.
- `keywordsForFile`: union of manual + derived keywords, manual-only spell
  (level undefined or no rule matches), derived-only spell (no manual
  keywords).
- `PresetFactory.create` / `AbilityService.applyPreset`: existing keyword
  auto-resolution tests still pass with the union behavior.
- Full verification pass: `npx tsc --noEmit`, `npx eslint`, `npx prettier
  --check`, `npx vitest run` (expect the same 9 pre-existing, unrelated
  failures noted in `verify-generator-refactor` memory, none new).

## Open questions / future work

- Globe of Invulnerability, Minor Spell Deflection, and Shield of the Archons:
  add as one-line `LEVEL_GATED_PROTECTIONS` entries plus a `SPELL_CHECK_TRIGGERS`
  entry once their tracking stats exist. Shield of the Archons will need its
  `maxLevel` omitted (applies to every level, including innate abilities).
