# Deriving SPELL_PRIORITY_ORDER from emulti.baf

## Problem

`lib/config/spell-priority-order.ts` is the canonical ordering list consumed
by `AbilityOrderService` (see
[[2026-07-17-spell-ability-ordering-design]]) to auto-sequence a creature's
memorized spells into `IF...THEN...END` blocks. It was seeded by
concatenating `ABILITY_PRESETS` category arrays in a fixed, hand-picked
category sequence (buffs → cure → CC → debuffs → damage → death → dispel →
summon), then hand-tuned. The bottom ~75 lines are still under a
`// TODO: to sort` marker, and even the "sorted" top section is only as good
as the hand-tuning that produced it — there's no real evidence backing the
ordering beyond "seemed reasonable at the time."

`generator/assets/emulti.baf` (newly added to the repo) is Greg
Hodgson/Eric Kerr's "eMulti" AI script — a mature, widely-used BG2 generic
spellcaster AI (the same family SCS-era mods derive from). Its body is
exactly the same shape `AbilityOrderService` assumes for generated output:
a flat sequence of `IF...THEN...Spell(Myself, SPELL_ID)...END` blocks,
evaluated top-to-bottom, block position = priority. That makes it real,
battle-tested evidence for cast order rather than a guess — a strictly
better source than the current hand-authored seed.

## Design

### Extraction: first-occurrence line order, minus one exclusion

Scan `emulti.baf` top-to-bottom for every `Spell(Myself, TOKEN)` call
(`TOKEN` is a `spell.ids` symbolic name, e.g. `CLERIC_SANCTUARY`, or
occasionally a bare number for polymorph/kit powers not in the registry —
those never match anything and are naturally ignored). Record the line
number of each token's **first** occurrence only; later repeats (the same
spell re-cast under a different trigger context elsewhere in the script)
don't change its rank. This produces `Map<token, line>`.

**Exclusion:** lines 2871–5055 (`gs_HotKeyS_Mage_HighLevel.baf` through
`gs_HotKeyB_Warrior.baf`) are player-hotkey-triggered manual-cast macros,
not autonomous AI decision-making. They sit early in the file for reasons
unrelated to combat priority and would falsely inflate the rank of whatever
spell a hotkey macro happens to list first. Strip this range before
building the map.

The rest of the file's segment structure (confirmed by reading every
`Segment Name:` marker) already encodes a coherent priority shape that this
extraction captures for free, with no per-segment modeling needed: self-cure
→ heal self → heal other → counterspells → **defences → summons → buffs,
cascading spell-tier TL4 down to TL1** → **antimage → charms → attacks →
disablers → pre-attack, cascading TL4 down to TL1** → shapechange/polymorph.
Notably, *all* buffs (even weak TL1 ones) outrank *all* attacks (even
powerful TL4 ones) — secure your own state before going on the offensive.
This is a more nuanced shape than the current flat category-concatenation
seed.

### Mapping baf tokens to the registry

Every `SPELLS.*` entry (`lib/config/spells/spell-names.ts`) carries an `id`
field in the exact `spell.ids` naming convention the baf uses (e.g.
`WIZARD_AGANNAZAR_SCORCHER`) — a direct key match, no fuzzy/string-distance
matching required. `FNP_SPELLS.*` entries (`fnp-spell-names.ts`) have no
`id` field and structurally cannot appear in a 2006 script, since Faiths &
Powers didn't exist yet.

### Merge algorithm

Every current `SPELL_PRIORITY_ORDER` entry falls into one of two buckets:

1. **Baf-ranked** — a vanilla `SPELLS.*` entry whose `id` was found in the
   extracted map. Final position = baf line order. This is the "reorder
   where they disagree" case: if the current list has this spell in a
   different relative position than the baf evidence implies, the baf wins.
2. **Unranked** — an `FNP_SPELLS.*` entry, a vanilla spell genuinely absent
   from `emulti.baf` (e.g. an EE-only addition post-dating the 2006 script),
   or the synthetic `PRESET_NAMES.DimensionDoorOffscreen` marker. No direct
   evidence exists for these.

Unranked entries keep their **current relative position**, interpolated
between the nearest baf-ranked entries that bracket them in today's list.
Concretely: walk the current list once, assign each baf-ranked entry its
real baf line number, assign each unranked entry a synthetic rank
interpolated between the nearest preceding and following baf-ranked
neighbors' line numbers (ties broken by current list index), then sort the
whole list by that combined rank.

This preserves the existing hand-built pattern of pairing an FNP spell
directly adjacent to its vanilla counterpart (e.g. `FingerOfDeath` next to
`FNP_SPELLS...FingerOfDeath`) — the pair moves together to wherever the
baf-ranked anchor now lands, rather than the FNP half drifting off
independently. Entries with no nearby baf-ranked neighbor at all (rare —
mostly deep in the current `// TODO: to sort` tail) keep their current
absolute position unchanged, since there's nothing to interpolate against.

### Output

Same flat `string[]` shape (no structural change to
`spell-priority-order.ts` — `AbilityOrderService` and its test are
unaffected). The `// TODO: to sort` marker comment is removed once every
entry has gone through this pass. Individual entries that remain unranked
(no baf evidence at all) get a per-entry comment, extending the existing
convention already on `FNP_SPELLS.Priest.CauseModerateWounds.file`
("FNP-only, no vanilla sibling to anchor next to - position not vetted for
priority.") rather than one blanket TODO block.

### Verification

- Both existing invariants in `spell-priority-order.test.ts` must still
  hold: non-empty, and `Sanctuary` ranked before `FingerOfDeath`. This is
  expected to hold well within margin — buffs land in the defences/buffs
  segment block, which the baf's own structure places entirely before the
  attacks segment block containing `FingerOfDeath`.
- Coverage check: every file currently present in `SPELL_PRIORITY_ORDER`
  must still be present after the pass (the merge reorders, it never drops
  entries).
- `npm run build` and `npm test` (full suite) must pass — this is a
  content-only change to one config file, so no other test should be
  affected.

### Tooling

The extraction/merge logic is implemented as a throwaway script (not
committed — deleted once its output is hand-copied into
`spell-priority-order.ts`), run via `ts-node` from `generator/`, since it
needs to import the real `SPELLS`/`FNP_SPELLS` registries rather than
re-parsing them with regex. It prints the proposed new order plus a diff
against the current file (which entries moved, by how much, and which are
unranked) for manual sanity review before the file is hand-edited — this
is a one-time data-curation pass, not a mechanism that ships or runs again.

## Out of scope

`ABILITY_PRESETS` (`lib/config/presets/*.ts`) category groupings are not
touched in this pass. The same `emulti.baf` segment structure (defences →
summons → buffs → antimage → charms → attacks → disablers) is a good
future reference for auditing those categories, but that's a separate
follow-up, not bundled here.
