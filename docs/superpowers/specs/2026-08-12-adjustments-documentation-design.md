# Showing per-file adjustments in the generated docs — design

## Purpose

`docs/monsters.html` (built by `documentation.service.ts` from `lib/templates/monster.html`)
shows every creature's base stats, attacks, traits, abilities and spellbooks, but never reads
`creature.adjustments` (`CreatureAdjustment[]`, see `lib/src/model/creature/adjustment.ts`) - the
per-`.cre`-file overrides authored throughout `lib/creatures/*.ts` (e.g. a named unique like
`KNIGHTSK`, a summoned variant, a "chieftain" stat block for specific Ogre files). A reader of the
docs currently has no way to know these variants exist or what's different about them.

Adding every adjustment inline would clutter the page for the common case (no adjustments) and
bury the primary stat block for creatures that have many. This design adds one collapsed
`<details>` block per creature, shown only when it has adjustments, using the same native
disclosure pattern already used for the sidebar family menu (`getFamilyMenu`,
`documentation.service.ts:45-56`) - no new JS.

## Non-goals

- Not a generic formatter for all 60+ `CreatureData` fields (`CREATURE_DATA_FIELDS`,
  `lib/src/model/creature/data.ts:210+`). Explicit, labeled handling is scoped to the fields that
  actually appear in today's adjustments (`level1`/`level2`/`level3`, `hp`, `bonusHp`, `ac`,
  `thac0`, `apr`, `xpv`, `class`, `kit`, `race`, `general`, `alignment`, `morale`,
  `proficiencies`, `items.equipped`, `script.remove`, `immunities`, `spells.memorized`). Any other
  field that's ever set falls back to a generic `camelCase → Title Case: value` line rather than
  being silently dropped.
- Does not change WeiDU generation (`weidu-creature.service.ts`) at all - this is a pure read of
  already-computed `creature.adjustments`, docs-only.
- Does not render `scriptName` or `summon` in any form (confirmed in review) - `scriptName` is an
  internal engine detail (writes the CRE's own resref into its Script Name field for area/dialogue
  scripting) with no player/modder-facing meaning here; `summon` is likewise omitted.
- Does not add a name field to `CreatureAdjustment`/`CreatureData` - names come from a lookup
  described below, authoring in `lib/creatures/*.ts` is untouched.

## Effective-adjustment computation

`creature.adjustments` is a flat, ordered list of raw entries as authored - `setAdjustments`
(`creature.factory.ts:73-88`) pushes each one as-is, with no merging. Multiple entries can target
the same file cumulatively (confirmed real example: Ogre's `BDSOGR1`/`BDSOGR2` are touched by
three separate entries - a "chieftain" stat block, a weapon swap with `noWeapon: true`, and a
class/proficiency change - see `lib/creatures/ogres.ts:463-493`).

New pure function, e.g. `getEffectiveAdjustments(creature: Creature): EffectiveAdjustment[]` in a
new `lib/src/services/doc/adjustment.service.ts`:

1. Collect the union of every file id across all of `creature.adjustments[].files`.
2. For each file, fold every adjustment entry whose `files` includes it, **in authored order**:
   later entries' explicitly-set fields overwrite earlier ones for that file (this matches how
   `CreatureData` fields are only ever set when explicitly provided - see `getData`,
   `creature.factory.ts:39-59` - so "changed" simply means "set on the folded result", no diffing
   against the base creature's own data is needed). `noWeapon` becomes `true` for the file if
   *any* folded entry set it.
3. Group files whose folded result is deep-equal into one `EffectiveAdjustment` (`{ files:
   string[], noWeapon: boolean, data: CreatureData }`). This is what naturally produces
   `BDSOGR1, BDSOGR2` as one line (identical folded result) while `AC#FP2OT` (only in the
   weapon-swap entry) becomes its own line.

## Field formatting

For each `EffectiveAdjustment`, produce a list of human-readable change strings:

- Scalar fields in the explicit list above render as `"<Label> <value>"` (e.g. `"Level 7"`,
  `"XP 975"`), reusing existing formatting where it already exists (e.g. `formatEnumLabel` for
  `alignment`).
- `proficiencies` (non-empty array) → one entry per proficiency, `"<Label>: <value>"`.
- `items.equipped` (non-empty array) → resolve each entry's `file` against `State.items` the same
  way `getCreatureAttacks` does (`documentation.service.ts:146-150`) and show the item's name if
  found, else the raw file id.
- `noWeapon: true` → literal string `"uses his own weapon"`, appended after the data-derived
  changes.
- Any other non-default field → generic fallback (`camelCase → Title Case: value`).

## Name lookup

`assets/creatures.csv` has a `name` column keyed by file resref, independent of the owning
creature's own name (confirmed: `KNIGHTSK` → "Undead Knight" even though its owning creature's own
name is generic "Skeleton"; `KALDRAN` → "Kaldran the Bear"). Extend
`lib/src/services/monster-files.service.ts` (same lazy CSV-parse-once pattern as `getFiles` /
`getSummonFiles`) with:

- `parseFileNamesCsv(raw: string): Map<string, string>` - keyed by the raw `file` column
  (uppercased, matching how `setAdjustments` uppercases `files`), value is the `name` column.
- `MonsterFilesService.getName(file: string): string | undefined`.

For each `EffectiveAdjustment`, look up a name for its first file. If found and it differs
(case-insensitive, trimmed) from the creature's own displayed name (`translationService.from(
creature.name)`), show it next to the file id list; otherwise omit it as redundant.

## Rendering

`getCreatureAdjustments(template, creature)` in `documentation.service.ts`, called from
`addCreature` right after `getCreatureTraits` (`documentation.service.ts:106`), building:

```html
<div class="detail-section adjustments">
  <details>
    <summary>Adjustments ({{count}})</summary>
    <ul class="adjustment-list">
      <li><strong>BDSOGR1, BDSOGR2</strong> — Level 7, Bonus HP 4, AC 2, XP 975,
        uses his own weapon, Class: Fighter</li>
      ...
    </ul>
  </details>
</div>
```

Add the `{{adjustments}}` token to `lib/templates/monster.html` between `{{traits}}` and
`{{abilities}}`. When `creature.adjustments` is empty, `replace` is still called (matching the
existing pattern for `special`/`traits`/`attacks`, which always call `replace` even with `""`) but
with an empty string, so no block - not even a collapsed empty one - is rendered.

New CSS in `mod/docs/monsters.css` styles `.adjustments summary` as a small button-like disclosure
(distinct from the sidebar-scoped `.sidebar .family > details > summary` rule at
`monsters.css:75`, which doesn't apply outside the sidebar).

## Testing

Unit tests for the new pure logic, following this project's existing `*.test.ts` pattern:

- `adjustment.service.test.ts`: folding order (later entry wins per file), grouping by deep-equal
  result (the Ogre `BDSOGR1`/`BDSOGR2`/`AC#FP2OT` case), `noWeapon` becoming `"uses his own
  weapon"`, `scriptName`/`summon` never appearing in output, generic fallback for an unhandled
  field.
- `monster-files.service.test.ts`: extend with `parseFileNamesCsv` / `getName` cases (found name
  differs from creature name → returned; not found → `undefined`).
- `documentation.service.test.ts` (already exists): a creature with no adjustments produces an
  empty `{{adjustments}}` replacement; one with adjustments produces the expected `<details>`
  block.

Manual: regenerate `mod/docs/monsters.html` and visually check the Ogre and Skeleton (`KNIGHTSK`)
entries render the expected grouped lines and names.
