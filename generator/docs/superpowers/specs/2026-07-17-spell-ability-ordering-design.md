# Automatic spell-ability ordering

## Problem

`creature.behavior.abilities` is a flat array, and array position is exactly
the order `StatementBuilderService.parseAbilities`
(`statement-builder.service.ts:860-871`) emits `IF ... THEN ... END` blocks
into the generated BAF script. Because the Infinity Engine evaluates a
script's blocks top-to-bottom every AI tick, this order is not cosmetic: an
ability placed too late means every block above it burns a trigger
evaluation (memorization check, exclusion checks, IDS lookups) before the
engine even gets there, and if two abilities could both fire the same tick,
whichever is earlier wins. Getting the order right is a real correctness-
and-performance concern, but nothing today helps with it — authors hand-order
the array and hope they got it right.

This is worst for creatures with large spellbooks. Greater Mummy
(`lib/creatures/undead.ts`) defines three mod-conditional spellbook variants
(`FaithsAndPowers`, `SpellRevisions`, `Vanilla`, ~25-30 spells each) but a
single hand-ordered `abilities` array of ~50 `this.preset(file)` calls
covering the union of all three — entirely manually sequenced, with no tooling
to check the order is sensible or even complete (that part is covered
separately by `checkSpellAbilities`, see
[[2026-07-15-spell-ability-consistency-design]]).

## Design

### `SPELL_PRIORITY_ORDER` — new canonical ordering list

New file `lib/config/spell-priority-order.ts`:

```ts
export const SPELL_PRIORITY_ORDER: SpellReference[] = [
  SPELLS.Priest.Sanctuary,
  FNP_SPELLS.Priest.GreaterMalison,
  SPELLS.Priest.FingerOfDeath,
  // ... every SPELLS/FNP_SPELLS entry that's ever cast as a creature ability,
  // in the order it should be checked/cast, most preferred first
];
```

A single flat, hand-maintained, global list — not a numeric priority field on
each spell (harder to keep consistent), not split by class/category (no clear
rule for combining split lists when a creature draws from more than one).
`SPELLS`/`FNP_SPELLS` key order stays irrelevant, as today; this is a
separate list.

Seeding: bootstrap the initial contents from the existing `ABILITY_PRESETS`
category groupings (`lib/config/ability-presets.ts` — `BUFF_PRESETS`,
`DEBUFF_PRESETS`, `DISABLING_PRESETS`, `FEAR_PRESETS`, `HOLD_PRESETS`,
`SLEEP_PRESETS`, `CONFUSION_PRESETS`, `CHARM_PRESETS`, `CURE_PRESETS`,
`DAMAGE_PRESETS`, `DAMAGE_AOE_PRESETS`, `DEATH_PRESETS`, `DISPEL_PRESETS`,
`SUMMON_PRESETS`), concatenated in a reasonable default category sequence.
Every spell usable via `this.preset()` already lives in exactly one of those
files (`applyPreset` throws `Unknown preset` otherwise), so this gives a real
starting order to hand-tune rather than starting from nothing.

### `AbilityEntry` — new declarative form for `behavior.abilities`

New types in `lib/src/model/creature/ability.ts`:

```ts
export type AbilityAnchor = SpellReference | number | string;
// SpellReference -> resolved via .file
// number -> a local Ids enum value, resolved via creature.spell(id).file
// string -> a raw resref, for the rare case neither applies

export interface AbilityEntry {
  spell?: SpellReference; // registry spell: overrides its auto position and/or config
  ability?: RawCreatureAbility; // custom addSpell-created ability: always hand-written
  insertBefore?: AbilityAnchor;
  insertAfter?: AbilityAnchor;
  insertFirst?: true;
  insertLast?: true;
}
```

Runtime-validated (mirrors how `RawCreatureAbility` itself is a soft `Partial`
validated inside `ability.service.ts`, not a discriminated union): exactly one
of `spell`/`ability` must be set, and at most one of
`insertBefore`/`insertAfter`/`insertFirst`/`insertLast`.

`PartialCreatureBehavior.abilities` (`lib/src/model/creature/behavior.ts:69-75`)
gains a second accepted shape:

```ts
abilities?: (RawCreatureAbility | RawCreatureSequencerAbility)[] | { entries: AbilityEntry[] };
```

Usage (Greater Mummy, illustrative):

```ts
greater.setBehavior({
  restHeal: true,
  abilities: {
    entries: [
      { spell: SPELLS.Priest.FingerOfDeath, insertFirst: true },
      { ability: this.ability(Ids.GreaterMummyFearAura), insertFirst: true },
      { spell: FNP_SPELLS.Priest.GreaterMalison, insertBefore: SPELLS.Priest.Sanctuary },
    ],
  },
  dialog: ["mumgre01"],
});
```

Every memorized registry spell not mentioned in `entries` is derived and
placed automatically. `entries` only lists: exceptions to the default
priority-order placement, per-spell config overrides, and every
`addSpell`-created (custom) ability — which always needs a position directive
since it has no registry entry to rank by (defaults to `insertLast` if
omitted, since most custom abilities in practice are asymmetric enough that a
silent wrong-but-plausible default would be worse than a very visible one —
revisit if this default causes friction in practice).

### Where resolution happens — deferred to validation time

Every creature file follows the same call order: `setBehavior(...)` runs
before `setAdjustments(...)` (confirmed across all 15 creature files using
`abilities`, e.g. `slimes.ts:243-247`). Since the auto-derived spell list must
include adjustment-only memorized spells (matching what `checkSpellAbilities`
already checks against, via `getSpellGroups`), resolving `entries` eagerly
inside `setBehavior` would miss any adjustment added afterward. So unlike
today's eager `abilityService.getAbilities()` call inside
`CreatureFactory.setBehavior` (`creature.factory.ts:128`), the new object form
is not resolved immediately:

- `CreatureFactory.setBehavior`, when given `{ entries: [...] }`, stores it
  verbatim (e.g. `cre.pendingAbilityEntries = behavior.abilities.entries`)
  instead of pushing into `cre.behavior.abilities`.
- A new `AbilityOrderService.resolve(creature): RawCreatureAbility[]` runs
  from `CreatureFactory.validate()`, alongside the existing
  `creatureService.checkSpellAbilities(cre)` call (both need the fully-set
  `data`/`adjustments`), and its output is pushed through the existing
  `abilityService.getAbilities()` into `cre.behavior.abilities`.
- The legacy plain-array form is unaffected — still resolved eagerly inside
  `setBehavior`, exactly as today.

`AbilityOrderService.resolve` algorithm:

1. Collect `memorizedFiles` — the deduped union of
   `data.spells.memorized`, every `data.spells.spellbooks[].memorized`, and
   every adjustment's `data.spells.memorized`. This union is already computed
   today by `CreatureService`'s private `getSpellGroups`
   (`creature.service.ts:110-123`) for `checkSpellAbilities` — extract it into
   a shared helper (e.g. `memorizedSpellFiles(creature): string[]`) reused by
   both, instead of duplicating the traversal.
2. Partition `entries` into spell-exceptions (`entry.spell` set) and custom
   abilities (`entry.ability` set). Build a `Set` of files already covered by
   spell-exceptions.
3. For every file in `memorizedFiles` not covered by a spell-exception, look
   up its index in `SPELL_PRIORITY_ORDER`. Missing → `logService.error`
   (see Validation below) and skip it (consistent with the "collect
   everything, report at the end" pattern in
   [[2026-07-15-spell-ability-consistency-design]]). Sort the remainder by
   that index and map each to `{ preset: file }`.
4. Build each `entries` item's `RawCreatureAbility` (`spell` → `{ preset:
   spell.file }`, merged with any other fields on the entry; `ability` → used
   as-is), then splice it into the list from step 3 per its position
   directive: `insertFirst`/`insertLast` at the ends; `insertBefore`/
   `insertAfter` resolve the anchor (`AbilityAnchor` → file, via
   `SpellReference.file`, `creature.spell(id).file` for a number, or the raw
   string) and insert relative to the first list entry whose resolved
   identity matches. Anchor not found → `logService.error` and skip the
   splice (append at the end instead, so the run still completes).
5. Return the fully merged, ordered `RawCreatureAbility[]`.

### Validation

Two additions, both `logService.error` (fails the run, per
[[2026-07-15-spell-ability-consistency-design]]'s existing `hasErrors()`
mechanism — not a new severity):

- **Missing from `SPELL_PRIORITY_ORDER`**: a memorized registry spell with no
  matching `entries` exception and no entry in `SPELL_PRIORITY_ORDER`.
- **Duplicate ability**: two resolved abilities (from any source — auto-
  derived, `entries`, or the legacy array) with the *same resolved spell file
  and the same trigger/target signature* (compare `CreatureAbility.resource`
  plus a normalized comparison of `triggers`/`targets` after
  `abilityService.getAbility` has run). Same spell file with a genuinely
  different trigger/target signature is allowed — this is what makes "same
  spell at two positions with different triggers" (not needed yet, but
  anticipated) work with no extra flag.

`checkSpellAbilities`'s two existing checks (`creature.service.ts:69-95`)
still run unchanged. For creatures using the new object form, the "memorized
but no ability" half becomes structurally unreachable (every memorized file
always gets a derived or explicit entry), so it stays relevant only for
creatures still using the legacy plain-array form.

### Legacy plain-array form

`abilities: [...]` (today's form) keeps working exactly as-is — same eager
resolution inside `setBehavior`, same manual ordering. It gains only the
duplicate check from Validation above (applied post-hoc to
`cre.behavior.abilities` in `CreatureFactory.validate()`, so it covers both
forms with one implementation). This stays the intentional escape hatch for
small creatures (fewer than ~5 abilities) where reasoning about anchors would
be more overhead than just writing the final order directly.

## Migration

All 15 creature files currently using `abilities:` are converted to the new
object form as part of this work (not staged as separate follow-up), so the
plain-array escape hatch is only ever reached by deliberate choice, not by
default:

1. Build the mechanism (`SPELL_PRIORITY_ORDER`, `AbilityEntry`,
   `AbilityOrderService`, the two new validations, the shared
   `memorizedSpellFiles` extraction).
2. Seed `SPELL_PRIORITY_ORDER` from the `ABILITY_PRESETS` category groupings.
3. Migrate `lib/creatures/undead.ts` first, starting with Greater Mummy (the
   motivating case — 3 spellbook variants, ~50 hand-ordered entries today) —
   this is the clearest proof the mechanism earns its keep and will surface
   any gaps in `SPELL_PRIORITY_ORDER` early.
4. Migrate the remaining 7 files that combine `memorized`/`spellbooks` with
   `abilities` (`ogres.ts`, `spiders.ts`, `feys.ts`, `slimes.ts`,
   `golems.ts`, `constructs.ts`, `bears.ts`) — each surfaces more entries for
   `SPELL_PRIORITY_ORDER`.
5. Migrate the remaining 7 `abilities`-only files (`ankhegs.ts`,
   `minotaurs.ts`, `dogs.ts`, `common.ts`, `basilisks.ts`, `wolves.ts`,
   `ettin.ts`) — mostly custom (`addSpell`-created) abilities, so mainly
   converting existing manual arrays into `entries` with explicit position
   directives rather than exercising the priority-order path.

## Testing

- `ability-order.service.test.ts` (new): `resolve()` covers — pure auto
  derivation (no `entries`) in `SPELL_PRIORITY_ORDER` order; a spell
  exception overriding position; a custom ability with each of
  `insertFirst`/`insertLast`/`insertBefore`/`insertAfter`; adjustment-only
  memorized spells included in the derived set; a memorized spell missing
  from `SPELL_PRIORITY_ORDER` → `logService.error` and the run still
  completes; an anchor that doesn't resolve → `logService.error` and the
  entry still appended.
- `creature.service.test.ts`: new duplicate-ability check — same
  file+trigger signature twice → one `error()`; same file with different
  trigger/target → no error; mirrors the existing `checkSpellAbilities` test
  style already in this file.
- `creature.factory.test.ts`: `setBehavior` given the object form stores
  `pendingAbilityEntries` and does not touch `cre.behavior.abilities`
  immediately; the legacy array form behaves exactly as today (regression
  coverage); `validate()` resolves pending entries into
  `cre.behavior.abilities` in the expected order.
