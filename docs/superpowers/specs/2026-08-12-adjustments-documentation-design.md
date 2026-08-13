# Showing per-file adjustments in the generated docs — design

## Purpose

`docs/monsters.html` (built by `documentation.service.ts` from `lib/templates/monster.html`)
shows every creature's base stats, attacks, traits, abilities and spellbooks, but never reads
`creature.adjustments` (`CreatureAdjustment[]`, see `lib/src/model/creature/adjustment.ts`) - the
per-`.cre`-file overrides authored throughout `lib/creatures/*.ts` (e.g. a named unique like
`KNIGHTSK`, a summoned variant, a "chieftain" stat block for specific Ogre files). A reader of the
docs currently has no way to know these variants exist or what's different about them.

This design adds, to each creature's name header, a small badge/disclosure control that expands
into a full-width panel below the header. That panel shows one **complete mini stat block per
effective adjustment** - the same stat-grid/Attacks/Traits/Abilities-Spellbooks layout used for
the creature's own base block - rather than a terse diff line. Fields that differ from the base
creature's own value are visually called out (a highlight chip); fields the adjustment inherits
unchanged from the base render exactly like the main block. This supersedes an earlier revision of
this design that rendered only a comma-separated line of the fields that changed - that approach
read as a changelog, not as "what does this file actually look like," which is what's wanted here.

## Governing rule

**A field only appears on an adjustment's card if it already has a rendering path in the main
per-creature block today.** Concretely, that's: ability scores, Hit Dice (level + hp), Armor
Class, THAC0, Attacks per Round, Movement, Morale, Alignment, Size, XP Value, Attacks
(`items.equipped`), Traits (`immunities`), and Abilities/Spellbooks (`spells.memorized`). Any field
without an existing doc rendering - `class`/`kit`/`race`/`general`, `bonusHp`/`specialBonusHp`,
`proficiencies`, colors, `script`, `gender`, `ea`, sub-type ACs/saves/resistances,
`hideShadow`/`moveSilent`, `doubleApr` (as its own line - it still folds into the APR value) - is
never shown directly, full stop, no generic fallback. If such a field affects a *shown* field (e.g.
`bonusHp` feeding into `hp`/`thac0`, confirmed below) that effect surfaces through the shown field
itself.

Each shown field displays the file's **effective value**: whatever the folded adjustment sets, or
the base creature's own value when the adjustment doesn't touch that field. A field is flagged as
*changed* (gets the highlight treatment, see Highlighting below) only when that effective value
actually differs from the base creature's own displayed value - not merely "did some adjustment set
it." This distinction matters because `creatureService.check()` runs the same auto-generation pass
on every adjustment that it runs on the base creature (`creature.service.ts:28-57`): for each entry
in `creature.adjustments`, it calls `checkData({ creature, base: a, isAdjustment: true })`, which
fills in `hp`/`thac0` (`hitPointService`'s autogeneration, e.g. `hit-point.service.ts:38-44`, using
`p.data.X ?? p.parent?.X` fallbacks) and applies dexterity-AC-bonus/movement/APR transforms - but
only for those *derived* fields. Plain data fields (ability scores, `alignment`, `size`, `morale`,
`xpv`, etc.) are **not** back-filled onto the adjustment's own `.data` by `checkData` - they stay
`undefined` there unless the file's authoring code sets them explicitly. So the effective-value
merge (adjustment's folded value, falling back to the base creature's `.data`) has to happen at
render time for every field, not just the auto-generated ones; the auto-generated fields simply
arrive at that merge already resolved.

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
- If an adjustment ever sets its own `dexterity` (none does today, as far as a `dexterity:` grep
  across `lib/creatures/*.ts` suggests - most hits are base creatures' own `setData` calls), its
  folded `ac` already reflects the bonus `checkDexterityArmorClassBonus` computed from that
  adjustment's own `dexterity` (per the Armor Class rule below) - no extra handling is needed, this
  is called out only because it wasn't exhaustively verified adjustment-by-adjustment.

## Effective-adjustment computation

`creature.adjustments` is a flat, ordered list of entries as authored - `setAdjustments`
(`creature.factory.ts:73-88`) pushes each one as-is, with no merging - but by the time
documentation generation runs, each entry's `.data` has already been through the same
`creatureService.check()` pass as the base creature's own data (see Governing rule above), so
`hp`/`thac0`/movement/APR are already fully computed, not raw partial input. Multiple entries can
target the same file cumulatively (confirmed real example: Ogre's `BDSOGR1`/`BDSOGR2` are touched
by three separate entries - a "chieftain" stat block, a weapon swap with `noWeapon: true`, and a
class/proficiency change - see `lib/creatures/ogres.ts:463-493`).

Unchanged from the prior revision, in `lib/src/services/doc/adjustment.service.ts`:

1. Collect the union of every file id across all of `creature.adjustments[].files`.
2. For each file, fold every adjustment entry whose `files` includes it, **in authored order**:
   later entries' explicitly-set fields overwrite earlier ones for that file. `noWeapon` becomes
   `true` for the file if *any* folded entry set it.
3. Group files whose folded result is deep-equal into one entry (`{ files: string[], noWeapon:
   boolean, data: CreatureData }`). This is what naturally produces `BDSOGR1, BDSOGR2` as one card
   (identical folded result) while `AC#FP2OT` (only in the weapon-swap entry) becomes its own card.

## Effective data & change tracking

This is the part that changes from the prior revision. For each folded-and-grouped adjustment
entry, build an `EffectiveAdjustment` carrying, for every field in the Governing rule's list:

- **`value`**: the folded adjustment's own value if set, else the base creature's own value for
  that field (`foldedData[field] ?? creature.data[field]`).
- **`changed`**: `true` when that effective value actually differs from the base creature's own
  *displayed* value, using the same per-field comparison rules as before:
  - Ability scores, THAC0, Movement, Morale, Alignment, Size, XP Value, Hit Dice (level + hp) →
    direct value compare.
  - Armor Class → compare against `creatureService.getFinalArmorClass(creature)` (the base's own
    displayed value), not a raw field compare - `checkData` already ran
    `checkDexterityArmorClassBonus` on the adjustment's own data using only that adjustment's own
    `dexterity`, so the folded `ac` is already a finished value (see Non-goals for the one
    unverified edge case).
  - Attacks per Round → compare the raw `apr * (doubleApr ? 2 : 1)` product against the base's own
    (see Non-goals on why this doesn't reuse `getEffectiveApr`'s dual-wielding bonus).
- List fields (`items.equipped`, `immunities`, `spells.memorized`) don't reduce to a single
  `value`/`changed` pair - see below.

**`items.equipped`**: the effective set is the base creature's `items.equipped`, with each slot
overridden by whatever the folded adjustment sets for that slot (same slot-keyed overlay the prior
revision used for its diff, just no longer filtered down to only the changed slots). Every slot
renders, the same way `getCreatureAttacks` resolves each entry's `file` against `State.items`
today; a slot whose resolved item differs from the base's own item in that slot is flagged changed.

**`immunities`**: the effective set is the union of the base creature's `immunities` and whatever
the folded adjustment grants. Every entry renders, resolved against `State.immunities` the same way
`getCreatureTraits` does; entries not present on the base creature are flagged changed.

**`spells.memorized`**: the effective set is the base creature's `spells.memorized`, overlaid
per-`file` by whatever the folded adjustment sets. Every entry renders the same way
`getCreatureSpell` already renders a memorized entry; an entry whose `memorizedCount` differs from
the base's own is flagged changed.

**`noWeapon`**: not a field with a base-creature counterpart, so it has no "unchanged" state - if
the folded entry sets it, the card shows it, always in the changed/highlighted treatment.

## Highlighting

A changed field's rendered value gets wrapped in a highlight-chip style: bold weight plus a light
translucent background tint in the site's existing red accent (`--color-red`, `main.css`), applied
via a new class (e.g. `.adjustment-changed`) on the `<dd>`/list-entry that carries it. An unchanged
field renders with no extra class - visually identical to how the same field renders in the main
stat block. This was chosen (over an italic treatment, and over a colored-text-only treatment)
specifically because plain italics were too subtle against the parchment background to scan
quickly; the chip's background fill is what makes changed fields jump out at a glance even in a
card where most fields are inherited.

## Rendering

**Header.** `addCreature` (`documentation.service.ts:70-108`) currently emits `<h3>{{name}}</h3>`
unconditionally. When `creature.adjustments` is non-empty, that's replaced with a `<details>`
element styled to look identical to the plain `<h3>` (same font, color, border-bottom) whose
`<summary>` is a flex row: the creature name on the left, a small badge on the right reading `"{{
count}} adjustments ▾"`. This reuses the native disclosure pattern already used for the sidebar
family menu (`getFamilyMenu`, `documentation.service.ts:45-56`) - no new JS. When there are no
adjustments, the header renders exactly as it does today - nothing added, nothing to expand.

**Panel.** Opening the `<details>` reveals, directly below the header, a full-width region (the
same width as the `.creature` card, not a narrow sidebar) containing one card per
`EffectiveAdjustment`, in the order the union-of-files walk in the Effective-adjustment computation
step produced them. Each card:

```html
<details class="creature-adjustments">
  <summary>
    <span>Ankheg</span>
    <span class="adjustments-badge">5 adjustments ▾</span>
  </summary>
  <div class="adjustment-cards">
    <div class="adjustment-card">
      <h4>BDANKH01</h4>
      <dl class="stat-grid">
        <div class="stat"><dt>Hit Dice</dt><dd class="adjustment-changed">10 (100 hp)</dd></div>
        <div class="stat"><dt>Armor Class</dt><dd>4</dd></div>
        <div class="stat"><dt>THAC0</dt><dd class="adjustment-changed">11</dd></div>
        <!-- ...remaining stat-grid fields, same order as the main block... -->
      </dl>
      <div class="detail-section"><h4>Attacks</h4>...</div>
      <div class="detail-section">...traits...</div>
      <!-- ...abilities/spellbooks if any... -->
    </div>
    <!-- ...one .adjustment-card per EffectiveAdjustment... -->
  </div>
</details>
```

Each card's own `<h4>` header is the file-list-plus-optional-name label described below (e.g.
`BDANKH01`, or `KNIGHTSK — Undead Knight` when a name resolves and differs from the creature's own
name). The card body reuses the main block's existing per-field rendering helpers
(`formatEnumLabel`, the stat-grid markup, `getCreatureAttacks`/`getCreatureTraits`/
`getCreatureSpell`'s formatting) applied to the effective data instead of the base creature's,
with the `changed` flag from the previous section controlling whether `adjustment-changed` is added
to that field's element.

New CSS in `mod/docs/monsters.css` styles `.creature-adjustments summary` to look like the plain
`<h3>` it replaces (matching the existing `.sidebar .family > details > summary` disclosure
affordance at `monsters.css:75`, which doesn't apply outside the sidebar), `.adjustments-badge` as
a small pill, `.adjustment-card` as a bordered sub-panel echoing `.creature` itself but
smaller/nested, and `.adjustment-changed` per the Highlighting section above.

## Name lookup

Unchanged from the prior revision. `assets/creatures.csv` has a `name` column keyed by file resref,
independent of the owning creature's own name (confirmed: `KNIGHTSK` → "Undead Knight" even though
its owning creature's own name is generic "Skeleton"; `KALDRAN` → "Kaldran the Bear"). Extend
`lib/src/services/monster-files.service.ts` (same lazy CSV-parse-once pattern as `getFiles` /
`getSummonFiles`) with:

- `parseFileNamesCsv(raw: string): Map<string, string>` - keyed by the raw `file` column
  (uppercased, matching how `setAdjustments` uppercases `files`), value is the `name` column.
- `MonsterFilesService.getName(file: string): string | undefined`.

For each `EffectiveAdjustment`, look up a name for every one of its files. If every file resolves
to the same name (case-insensitive, trimmed) and that name differs from the creature's own
displayed name (`translationService.from(creature.name)`), show it next to the file id list (e.g.
`KRYSKEL1, ... , KRYSKEL6 — Rick`); if the files' names disagree (a real case: Kryskel's six files
resolve to six different individual names - Rick/Shane/Daryl/Glenn/Lori/Hagar) or no name resolves,
show the bare file list with no name suffix.

## Testing

Unit tests for the new pure logic, following this project's existing `*.test.ts` pattern:

- `adjustment.service.test.ts`: folding order (later entry wins per file) and grouping by
  deep-equal result are unchanged from the prior revision and keep their existing coverage. New
  coverage needed for the effective-data merge: a field untouched by any adjustment shows the
  base creature's own value with `changed: false`; a field the adjustment sets to the *same* value
  as the base still shows `changed: false`; a field the adjustment actually changes shows the new
  value with `changed: true`; `hp`/`thac0` driven purely by `bonusHp` autogeneration show `changed`
  only when the computed value actually differs from the base's own; `items.equipped`/
  `immunities`/`spells.memorized` each return the *full* effective set (base entries included) with
  per-entry `changed` flags, not just the changed subset; `noWeapon` always reports changed when
  set; `scriptName`/`summon` never appear in output; an unlisted field (e.g. `class`) never appears
  even when it differs from the base.
- `monster-files.service.test.ts`: `parseFileNamesCsv`/`getName` cases are unchanged from the prior
  revision.
- `documentation.service.test.ts`: a creature with no adjustments renders a plain `<h3>{{name}}</h3>`
  with no badge and no `<details>`; a creature with adjustments renders the badge and, per card,
  the full stat-grid/Attacks/Traits markup with `adjustment-changed` on exactly the fields that
  differ from the base; the multi-file name-agreement case (all names agree → suffix shown; names
  disagree → bare file list) keeps its existing coverage.

Manual: regenerate `mod/docs/monsters.html` and visually check the Ogre and Skeleton (`KNIGHTSK`)
entries render the expected per-file cards with the right fields highlighted, and that the Kryskel
family (six differently-named files) falls back to the bare file list.
