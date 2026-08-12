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

## Governing rule

**A field only appears in the adjustments block if it already has a rendering path in the main
per-creature block today.** Concretely, that's: ability scores, Hit Dice (level + hp), Armor
Class, THAC0, Attacks per Round, Movement, Morale, Alignment, Size, XP Value, Attacks
(`items.equipped`), Traits (`immunities`), and Abilities/Spellbooks (`spells.memorized`). Any field
without an existing doc rendering - `class`/`kit`/`race`/`general`, `bonusHp`/`specialBonusHp`,
`proficiencies`, colors, `script`, `gender`, `ea`, sub-type ACs/saves/resistances,
`hideShadow`/`moveSilent`, `doubleApr` - is never shown directly, full stop, no generic fallback.
If such a field affects a *shown* field (e.g. `bonusHp` feeding into `hp`/`thac0`, confirmed below)
that effect surfaces through the shown field itself.

A shown field is only included in a given line if its value **actually differs from the base
creature's own value** for that field - not merely "is it set." This distinction matters because
`creatureService.check()` runs the same auto-generation pass on every adjustment that it runs on
the base creature (`creature.service.ts:34-56`): for each entry in `creature.adjustments`, it
calls `checkData({ creature, base: a, isAdjustment: true })`, which fills in `hp`/`thac0`
(`autogenerateHitPoints`/`autogenerateThac0`) and applies dexterity-AC-bonus/movement/APR
transforms, falling back to the base creature's own fields when the adjustment doesn't set them
(confirmed by `hit-point.service.test.ts:145`, "falls back to the parent's
constitution/bonusHp/class"). So `hp`/`thac0`/`ac` are basically always set on every adjustment
once autogeneration runs - checking "is it set" would show noise on files that never actually
changed. Diffing against the base creature's own final value is what correctly captures "this file
is different," and is also exactly how `bonusHp` ends up represented: it's never shown as its own
line, but its effect on `hp`/`thac0` is, whenever that effect makes them differ from the base.

## Non-goals

- Not a generic formatter for arbitrary `CreatureData` fields (`CREATURE_DATA_FIELDS`,
  `lib/src/model/creature/data.ts:210+`) - see the Governing rule above; anything without a doc
  presence is simply omitted, never dumped as a raw key/value fallback.
- Does not change WeiDU generation (`weidu-creature.service.ts`) at all - this is a pure read of
  already-computed `creature.adjustments`, docs-only.
- Does not render `scriptName` or `summon` in any form - `scriptName` is an internal engine detail
  (writes the CRE's own resref into its Script Name field for area/dialogue scripting) with no
  player/modder-facing meaning here; `summon` is likewise omitted.
- Does not add a name field to `CreatureAdjustment`/`CreatureData` - names come from a lookup
  described below, authoring in `lib/creatures/*.ts` is untouched.
- Attacks per Round's diff uses the raw `apr`/`doubleApr` fields, not the dual-wielding `+1`
  adjustment `getEffectiveApr` applies for the base creature (`documentation.service.ts:117-120`) -
  no adjustment in the codebase today changes weapon loadout in a way that flips dual-wielding
  status, so this approximation is accepted rather than re-deriving `creature.attack.dualWielding`
  per adjustment.

## Effective-adjustment computation

`creature.adjustments` is a flat, ordered list of entries as authored - `setAdjustments`
(`creature.factory.ts:73-88`) pushes each one as-is, with no merging - but by the time
documentation generation runs, each entry's `.data` has already been through the same
`creatureService.check()` pass as the base creature's own data (see Governing rule above), so
`hp`/`thac0`/movement/APR are already fully computed, not raw partial input. Multiple entries can
target the same file cumulatively (confirmed real example: Ogre's `BDSOGR1`/`BDSOGR2` are touched
by three separate entries - a "chieftain" stat block, a weapon swap with `noWeapon: true`, and a
class/proficiency change - see `lib/creatures/ogres.ts:463-493`).

New pure function, e.g. `getEffectiveAdjustments(creature: Creature): EffectiveAdjustment[]` in a
new `lib/src/services/doc/adjustment.service.ts`:

1. Collect the union of every file id across all of `creature.adjustments[].files`.
2. For each file, fold every adjustment entry whose `files` includes it, **in authored order**:
   later entries' explicitly-set fields overwrite earlier ones for that file. `noWeapon` becomes
   `true` for the file if *any* folded entry set it.
3. Group files whose folded result is deep-equal into one `EffectiveAdjustment` (`{ files:
   string[], noWeapon: boolean, data: CreatureData }`). This is what naturally produces
   `BDSOGR1, BDSOGR2` as one line (identical folded result) while `AC#FP2OT` (only in the
   weapon-swap entry) becomes its own line.

## Which fields are shown

For each `EffectiveAdjustment`, compare its folded data against `creature.data` (the base) field
by field, per the Governing rule's list, and render only the ones that differ:

- Ability scores, THAC0, Movement, Morale, Alignment, Size, XP Value, and Hit Dice
  (level + hp) → direct value compare, reusing existing labels/formatting already used for the
  base stat block (e.g. `formatEnumLabel` for alignment).
- Armor Class → `creatureService.getFinalArmorClass(base)` (`creature.service.ts:240-244`) already
  takes a plain `{ data }` shape (`BaseCreature`, which `CreatureAdjustment` satisfies), so it's
  called directly on both the folded adjustment data and the base creature's data and compared.
- Attacks per Round → raw `apr`/`doubleApr` compare (see Non-goals).
- `items.equipped` (non-empty on the folded result) → resolve each entry's `file` against
  `State.items` the same way `getCreatureAttacks` does (`documentation.service.ts:146-150`) and
  show the item's name if found, else the raw file id.
- `immunities` (non-empty on the folded result) → resolve each name against `State.immunities`
  the same way `getCreatureTraits` does (`documentation.service.ts:340-347`) and show its
  translated trait label.
- `spells.memorized` (non-empty on the folded result) → shown the same way `getCreatureSpell`
  already renders a memorized entry (`documentation.service.ts:461-500`), reusing that method.
- `noWeapon: true` → literal string `"uses his own weapon"`, appended after the data-derived
  changes.

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
      <li><strong>BDSOGR1, BDSOGR2</strong> — Level 7, AC 2, XP 975,
        uses his own weapon</li>
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
  result (the Ogre `BDSOGR1`/`BDSOGR2`/`AC#FP2OT` case), an adjustment that only sets `bonusHp`
  shows a change only when the computed `hp`/`thac0` actually differ from the base creature's own
  (not merely because they were set), `noWeapon` becoming `"uses his own weapon"`,
  `scriptName`/`summon` never appearing in output, an unlisted field (e.g. `class`) never
  appearing even when it differs from the base.
- `monster-files.service.test.ts`: extend with `parseFileNamesCsv` / `getName` cases (found name
  differs from creature name → returned; not found → `undefined`).
- `documentation.service.test.ts` (already exists): a creature with no adjustments produces an
  empty `{{adjustments}}` replacement; one with adjustments produces the expected `<details>`
  block.

Manual: regenerate `mod/docs/monsters.html` and visually check the Ogre and Skeleton (`KNIGHTSK`)
entries render the expected grouped lines and names.
