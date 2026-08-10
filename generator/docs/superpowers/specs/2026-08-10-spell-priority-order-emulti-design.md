# Deriving SPELL_PRIORITY_ORDER from emulti.baf

**Status:** Applied — see `spell-priority-order.ts` history for the
resulting order.

**Amendment history.** The design below has been corrected twice; the
sections that follow describe the *final* implemented behaviour, and this
block records what changed and why.

*Round 1 (during implementation).* The extraction regex originally
specified as `Spell(Myself, TOKEN)` only matches self-targeted casts (heals,
self-buffs). Offensive/CC/debuff spells in `emulti.baf` target
`LastSeenBy(Myself)`, `NearestEnemyOf(Myself)`, or occasionally bare
`LastSeenBy()` — none of these contain a comma, so the implemented pattern
became `Spell\([^,]*,([A-Z_][A-Z0-9_]*)\)` (any target expression, still
keyed on the spell token after the comma). This was caught during the Task 1
manual review: the initial run flagged ~80 common spells as "never cast in
emulti.baf," which was implausible on its face. `WIZARD_MAGIC_MISSILE`
(`Spell(LastSeenBy(Myself),WIZARD_MAGIC_MISSILE)`, line 19269) and
`CLERIC_HOLD_PERSON` (`Spell(LastSeenBy(),CLERIC_HOLD_PERSON)`, line 18470,
the bare-`LastSeenBy()` form) are two spells recovered only by that
widening. Round 1 also added a fallback to the merge: when an unranked
entry's two nearest original-order neighbours had baf ranks that disagreed
in relative order, it placed the entry just before the earlier of the two
rather than at their arithmetic mean.

*Round 2 (final whole-branch review).* Two further defects, both fixed by
re-deriving the whole array from scratch off the original hand-tuned list
rather than patching the previous output:

- **Numeric-id casts were never matched.** `emulti.baf` also casts by bare
  4-digit `spell.ids` code (`Spell(LastSeenBy(Myself),1719)`) — the same
  class of bug as Round 1, a whole category of real cast syntax invisible
  to the ranking. Extraction now matches both forms; see *Extraction*.
- **The Round 1 fallback was directionally biased.** `min(prev, next)`
  always places an ambiguous entry as early as possible, which threw
  `SPELLS.Priest.FindTraps` and `FNP_SPELLS.Priest.CloakOfFear` roughly a
  hundred positions forward on no evidence whatsoever. Replaced by ordinal
  placement; see *Merge algorithm*, which also records why the
  monotonic-envelope alternative was measured and rejected.

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

`generator/assets/emulti.baf` (committed to the repo as part of this work,
so the derivation stays reproducible) is Greg
Hodgson/Eric Kerr's "eMulti" AI script — a mature, widely-used BG2 generic
spellcaster AI (the same family SCS-era mods derive from). Its body is
exactly the same shape `AbilityOrderService` assumes for generated output:
a flat sequence of `IF...THEN...Spell(Myself, SPELL_ID)...END` blocks,
evaluated top-to-bottom, block position = priority. That makes it real,
battle-tested evidence for cast order rather than a guess — a strictly
better source than the current hand-authored seed.

## Design

### Extraction: first-occurrence line order, minus one exclusion

Scan `emulti.baf` top-to-bottom for every `Spell(...)` call. The script uses
two patterns, because emulti.baf casts spells in two syntaxes:

| form | pattern | example |
| --- | --- | --- |
| symbolic `spell.ids` token | `Spell\([^,]*,([A-Z_][A-Z0-9_]*)\)` | `Spell(LastSeenBy(Myself),WIZARD_MAGIC_MISSILE)` |
| bare numeric `spell.ids` code | `Spell\([^,]*,(\d{4})\)` | `Spell(LastSeenBy(Myself),1719)` |

The target expression is deliberately unconstrained (`[^,]*`): casts target
`Myself`, `LastSeenBy(Myself)`, `NearestEnemyOf(Myself)`, bare
`LastSeenBy()`, or `PlayerN`, and none of those contain a comma. `Spell(`
is the only cast action in the file — there are no `ForceSpell`,
`ReallyForceSpell`, `ApplySpell`, or `SpellNoDec` calls to account for
(verified by grep), and `HaveSpell(TOKEN)` has no comma so it can't match.

A numeric code is 4 digits: the first selects the resource prefix and the
remaining three are the spell number, zero-padded — `1`→`SPPR` (priest),
`2`→`SPWI` (wizard), `3`→`SPIN` (innate), `4`→`SPCL` (special/kit). So
`1719`→`SPPR719`, `2326`→`SPWI326`, `2302`→`SPWI302`.

Both patterns are merged into a single map keyed on the **resource file**,
not on the `spell.ids` token — symbolic hits are translated to a file via
the registry's `id` field, numeric hits via the table above. Keying on file
is what lets the two syntaxes merge at all, and it sidesteps needing a
correct `id` field for spells that only ever appear numerically. Record the
line number of each file's **first** occurrence across both patterns
combined; later repeats (the same spell re-cast under a different trigger
context elsewhere in the script) don't change its rank. This produces
`Map<file, line>`.

Of the 129 entries in the list, 91 get a rank this way. Three of them —
`SPELLS.Priest.SymbolDeath` (`SPPR719`), `SPELLS.Wizard.DispelMagic`
(`SPWI326`) and `SPELLS.Wizard.RemoveMagic` (`SPWI302`) — are reachable
*only* through the numeric pattern.

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
matching required. That map is inverted to `id → file` so extraction can
key everything on file (see above).

`FNP_SPELLS.*` entries (`fnp-spell-names.ts`) have no `id` field and mostly
cannot appear in a 2006 script, since Faiths & Powers didn't exist yet. One
of them in this list nonetheless points at a *vanilla* resource:
`FNP_SPELLS.Priest.Doom` is `SPPR113`, the same file as
`SPELLS.Priest.Doom`, so it does pick up a real rank. That is correct — it
is literally the same spell resource — and it is not new behaviour
introduced by the file-keying change (the previous `file → id → baf` lookup
resolved it the same way).

### Merge algorithm

Every current `SPELL_PRIORITY_ORDER` entry falls into one of two buckets:

1. **Baf-ranked** — an entry whose resource file was found in the extracted
   map. Final position = baf line order. This is the "reorder
   where they disagree" case: if the current list has this spell in a
   different relative position than the baf evidence implies, the baf wins.
2. **Unranked** — an `FNP_SPELLS.*` entry, a vanilla spell genuinely absent
   from `emulti.baf` (e.g. an EE-only addition post-dating the 2006 script),
   or the synthetic `PRESET_NAMES.DimensionDoorOffscreen` marker. No direct
   evidence exists for these.

Unranked entries keep their **relative position with respect to the ranked
ones**, counted rather than interpolated. Let `S` be the ascending list of
the `m = 91` baf line numbers belonging to ranked entries, and for each
original index `i` let `p(i)` be how many ranked entries precede `i` in the
hand-tuned list. An unranked entry is given the synthetic rank
`(S[p-1] + S[p]) / 2` (or `S[0] - 1` when `p = 0`, `S[m-1] + 1` when
`p = m`), and the whole list is then sorted by rank with ties broken by
original index.

In words: *the hand list placed this spell after `p` of the baf-ranked
spells, so keep it after exactly `p` of them.* This has a useful closed
form — every unranked entry ends up at **exactly its original index**, and
the ranked entries fill the remaining slots in baf order. It is total (no
undefined or degenerate case), monotone (unranked entries never reorder
among themselves), and carries no directional bias: nothing pushes an
ambiguous entry earlier or later than where the hand list had it.

**Why not interpolate in baf-line space.** Two variants were implemented
and measured against the real data before this one was chosen:

- *Nearest-neighbour bracket* (the Round 1 implementation). For 18 of the
  38 unranked entries the two nearest ranked neighbours are inverted
  (`prev > next`) or one-sided, so the bracket is contradictory or missing
  and a tie-break decides the placement. `min(prev, next)` resolves every
  one of those the same direction — as early as possible — which is why
  `FindTraps` (a non-combat utility spell sitting at original index 126)
  landed at position 24, ahead of every summon, and the FNP `CloakOfFear`
  landed at position 4 while its vanilla twin sat at 95, ninety positions
  later.
- *Monotonic envelope* (`L[i]` = running max of ranked ranks to the left,
  `R[i]` = running min to the right). This looks at all the evidence on
  each side rather than one neighbour, which is the right instinct, but it
  fails on this particular pair of orderings: Spearman's ρ between original
  index and baf line is only **0.175**, so `L` saturates at 20060 by index
  40 and `R` saturates at 972 by index 70. The envelope is inverted for 36
  of the 38 entries — worse than the nearest-neighbour bracket, since
  looking at *all* prior/later evidence just means saturating on the
  single most extreme outlier on each side. It collapses to a tie-break
  rule, and the whole point was to stop having the tie-break decide the
  answer.

Both failures share a root cause: the hand list's order and emulti.baf's
order are nearly uncorrelated, so a baf *line number* borrowed from a
neighbour says almost nothing about where an unranked entry belongs.
Counting ranked neighbours instead of reading their line numbers is robust
to exactly that, and it is a faithful reading of the original intent
("unranked entries keep their current relative position").

**What this does and does not preserve.** It keeps the unranked half of a
hand-built FNP/vanilla pair at its original index, so a pair whose vanilla
anchor doesn't move far stays close (`SPELLS.Priest.CloakOfFear` 97→92 vs
`FNP_SPELLS.Priest.CloakOfFear` 98→98). It does **not** guarantee exact
adjacency: the vanilla half moves to wherever the baf puts it, and if that
is far away the pair separates (`FNP_SPELLS.Priest.GreaterMalison` stays at
4 while `SPELLS.Wizard.GreaterMalison` moves 5→87). No interpolation scheme
can guarantee otherwise without overriding the evidence, so the pairing is
a tendency here, not an invariant.

### Output

Same flat `string[]` shape (no structural change to
`spell-priority-order.ts` — `AbilityOrderService` and its test are
unaffected). The `// TODO: to sort` marker comment is removed once every
entry has gone through this pass. A file-level doc comment on the const
records the provenance: ranked entries are ordered by first-cast line,
unranked entries hold their pre-derivation index.

On top of that, **a subset** of the unranked entries carries a per-entry
comment:

```
// no reliable baf evidence bracketing this position - not vetted for priority.
```

The condition that triggers it is *not* "absent from emulti.baf" — that
would be all 38 unranked entries, and would say nothing useful. It is
specifically: **the nearest baf-ranked entries on either side of this entry
in the source list disagree about relative order (`prev > next`), or one
side has none at all.** Those are the entries where even the weak, local,
indirect evidence contradicts itself, so nothing at all vouches for the
slot they occupy. 18 of the 38 meet that bar and are marked; the other 20
sit inside a locally consistent run of evidence and are left unmarked.
Note the flag is a confidence annotation only — it does not influence
placement, which is purely ordinal (see *Merge algorithm*).

### Verification

- Both existing invariants in `spell-priority-order.test.ts` must still
  hold: non-empty, and `Sanctuary` ranked before `FingerOfDeath`. **This
  invariant is not backed by direct evidence and must be checked, not
  assumed.** `CLERIC_SANCTUARY` is never cast anywhere in `emulti.baf` — it
  appears only in two `//` comment lines (4657 and 11632), so
  `SPELLS.Priest.Sanctuary` is one of the 38 unranked entries and its
  position is entirely placement-driven. It holds because the hand list put
  Sanctuary after only 4 of the 91 ranked spells, which keeps it at index 6,
  while `FingerOfDeath` has a real cast at line 13586 that puts it at index
  66. The script asserts this explicitly and throws if it ever stops
  holding.
- Named regression checks printed by the script and read manually, because
  they are the cases the ordering is most easily wrong about:
  `SPELLS.Priest.FindTraps` 126→126, `FNP_SPELLS.Priest.CloakOfFear` 98→98
  (vanilla twin 97→92), `SPELLS.Priest.Sanctuary` 6→6,
  `SPELLS.Priest.FingerOfDeath` 7→66.
- Coverage check: every entry currently present in `SPELL_PRIORITY_ORDER`
  must still be present after the pass (the merge reorders, it never drops
  entries).
- `npm run build` and `npm test` (full suite) must pass. The array feeds
  `AbilityOrderService`, so a reordering *does* change generated output:
  re-run `npm run generate` and commit the regenerated golden fixtures
  (`docs/monsters.html` and the affected `lib/pnp-monster/**/*.baf`) as a
  separate commit before the suite will pass.

### Tooling

**Amendment (post-migration):** the extraction/merge logic was originally a
throwaway script, deleted after the one-time migration this doc describes.
It has since been reinstated as a permanent, committed tool -
`scripts/derive-spell-priority-order.ts` - for ongoing maintenance: adding
a new `SPELLS.*`/`FNP_SPELLS.*`/`PRESET_NAMES.*` entry later just means
dropping the line in anywhere and re-running the script. The two
"properties that mattered for reproducibility" below describe the
*original one-time migration* and no longer describe the permanent tool,
which deliberately differs on the first point (see the script's own header
comment for why re-reading the current file, rather than a pinned git
revision, is the correct behaviour for incremental additions). The
duplicate-collapsing step (a later addition, prompted by the FNP resref
case-normalization fix producing two array entries for one resource) is
new behaviour not described below either.

Executed via `ts-node` from `generator/`, since it needs to import the
real `SPELLS`/`FNP_SPELLS`/`PRESET_NAMES` registries rather than
re-parsing them with regex.

Two properties of the *original migration* mattered for reproducibility:

- **Its input was the pre-derivation hand-tuned list**, read from git
  (`git show <commit-before-the-derivation>:generator/lib/config/spell-priority-order.ts`),
  not the current file. Re-running against its own output would re-derive
  from an already-derived order and is not the documented algorithm.
- **It wrote `lib/config/spell-priority-order.ts` directly** rather than
  printing a block to hand-copy. The committed file is therefore verbatim
  script output, with no post-hoc manual adjustment; an earlier round drifted
  from the documented process precisely because the array was hand-copied.
  It also wrote a side report (proposed order, original→new index diff,
  entries ranked only numerically, and named regression checks) for manual
  sanity review. The permanent tool keeps the direct-write behaviour and
  the report, but prints the report to the console rather than a file.

Neither `SPELL.IDS` nor any other `spell.ids` dump is read: the only inputs
are `assets/emulti.baf` and the registries.

## Out of scope

`ABILITY_PRESETS` (`lib/config/presets/*.ts`) category groupings are not
touched in this pass. The same `emulti.baf` segment structure (defences →
summons → buffs → antimage → charms → attacks → disablers) is a good
future reference for auditing those categories, but that's a separate
follow-up, not bundled here.
