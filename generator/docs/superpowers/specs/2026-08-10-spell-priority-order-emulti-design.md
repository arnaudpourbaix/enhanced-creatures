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

*Round 3 (user feedback after the tool became permanent).* Two related
problems with interleaving unranked entries among ranked ones at all,
raised independently:

- **The inline "not vetted" flag comment degraded to near-vacuous on a
  second run.** Its condition (do the nearest ranked neighbours, by source
  order, disagree?) meant something on the original, near-random hand list
  (ρ = 0.175 with real baf order — see *Merge algorithm*'s history below),
  but once the array is derived once, its ranked entries are already
  globally sorted, so that local check trivially passes almost everywhere.
  Flags silently dropped from 18 to 1 between two runs with no underlying
  change. First fixed by replacing the scattered inline comments with one
  reference block listing every unranked entry — better, but still didn't
  address the root question below.
- **Ordinal placement — "keep this spell after however many ranked spells
  happened to precede it in the old hand list" — was never a real order.**
  It's a carry-over of a list this whole project's premise says is
  untrustworthy (ρ = 0.175 with real evidence), presented at a specific
  array index that looks exactly as confident as a genuinely evidence-
  ranked neighbour. `FNP_SPELLS.Priest.SummonShadows` sitting at index 12,
  a few slots from `SPELLS.Wizard.Stoneskin` (real evidence, index 7), implies
  a relationship between them that doesn't exist — nothing ordered
  `SummonShadows` relative to `Stoneskin` at all; a Faiths & Powers spell
  structurally can never appear in this 2006 script (see *Out of scope*
  → no, see the reply to "how can you order it" — captured below), so no
  script run will ever produce real evidence for it.

Resolved by removing interleaving entirely: `SPELL_PRIORITY_ORDER_RANKED`
(real evidence, sorted by first-cast line) and `SPELL_PRIORITY_ORDER_UNVETTED`
(no evidence, order not derived from anything) are now two separate
exported lists, concatenated — ranked first — into `SPELL_PRIORITY_ORDER`
for `AbilityOrderService`. See *Merge algorithm* and *Output* for the
current shape; the interpolation-in-baf-line-space discussion is kept
below as design history, since the reasoning ("borrowed evidence from a
weakly-correlated neighbour is worse than no evidence") is what motivated
dropping interleaving altogether, not just fixing its formula.

*Round 4 (manual curation began).* Once Round 3 shipped, hand-reviewing
the unvetted list turned out to be worth doing incrementally rather than
all at once: entries get moved into the main list as soon as there's a
considered opinion on where they belong, not held back until every last
one is reviewed. Two changes followed from that:

- **`SPELL_PRIORITY_ORDER_RANKED` renamed back to `SPELL_PRIORITY_ORDER`.**
  Once a human places a no-evidence entry in the main list, "ranked" no
  longer describes it — the list is a mix of evidence-sorted and
  human-anchored entries. The *merge algorithm* is extended accordingly:
  entries in `SPELL_PRIORITY_ORDER` with real evidence still sort by
  first-cast line; entries without evidence that are *already in this
  list* are anchored — their position relative to their neighbours never
  changes, even as evidence-backed entries sort in and out around them.
  This is the Round 1/2 "ordinal placement" idea again, but scoped: it
  only ever applies to entries a human chose to place here, never invented
  wholesale for everything lacking evidence (that's still what
  `SPELL_PRIORITY_ORDER_UNVETTED` is for).
- **`AbilityOrderService` was reading only `SPELL_PRIORITY_ORDER`, not the
  union of both lists.** This was a real, previously-latent gap in the
  Round 3 design surfaced by the rename: once `SPELL_PRIORITY_ORDER`
  became a plain, independently-edited array instead of a concatenation of
  both lists, any memorized-but-still-unvetted spell became invisible to
  ordering — `ability-order.service.ts:34-40` treats "missing from
  `SPELL_PRIORITY_ORDER`" as a hard error, and 11 of Greater Mummy's
  Faiths & Powers spells (`SummonShadows`, `CauseSeriousWounds`,
  `CircleOfBones`, `ShadowMonsters`, `Forbiddance`, `Shatter`,
  `CauseDisease`, `CloudOfPestilence`, `WavesOfFatigue`,
  `DemiShadowMonsters`, `Shades`) hit exactly that and would never be
  cast. Fixed in `ability-order.service.ts`, not `spell-priority-order.ts`:
  `resolve()` now concatenates `[...SPELL_PRIORITY_ORDER,
  ...SPELL_PRIORITY_ORDER_UNVETTED]` fresh on every call (not once at
  module load, so it still holds up when a test mutates either array via
  `push`/`pop` after import).

**Consequence:** `spell-priority-order.test.ts`'s
Sanctuary-before-FingerOfDeath assertion no longer holds — `Sanctuary` has
no direct evidence, so it now sits in the unvetted list, after every
ranked entry including `FingerOfDeath`. Replaced with an assertion using
two entries that both have real evidence (`Stoneskin` before
`FingerOfDeath`), plus a direct assertion that `Sanctuary` is unvetted.
This is a deliberate, accepted trade: no automatic placement, however
plausible-looking, for spells with zero supporting evidence.

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

### Merge algorithm (current, post-Round-3)

Every entry, wherever it's declared, falls into one of two buckets purely
by evidence — never by which list it happened to be typed into:

1. **Ranked** — its resource file was found in the extracted map. Position
   = ascending baf line order. Lives in `SPELL_PRIORITY_ORDER_RANKED`.
2. **Unvetted** — no direct evidence: an `FNP_SPELLS.*` entry (mostly
   structurally incapable of appearing in a 2006 script — Faiths & Powers
   didn't exist yet), a vanilla spell genuinely absent from `emulti.baf`
   (e.g. an EE-only addition), or the synthetic
   `PRESET_NAMES.DimensionDoorOffscreen` marker. Lives in
   `SPELL_PRIORITY_ORDER_UNVETTED`, in whichever relative order its entries
   already had in that list — the script never invents an order for them,
   it only preserves whatever a human last gave them there.

`SPELL_PRIORITY_ORDER` is `[...SPELL_PRIORITY_ORDER_RANKED,
...SPELL_PRIORITY_ORDER_UNVETTED]` — every ranked entry outranks every
unvetted one, unconditionally.

**Why not interleave unvetted entries among ranked ones at all** (the
Round 1/2 approach, "ordinal placement": keep an unvetted entry after
however many ranked entries preceded it in the old hand list). Two
interpolation-in-baf-line-space variants were tried and measured against
the real data before ordinal placement replaced them, and are kept here as
history because the reasoning is what later motivated dropping
interleaving altogether, not just tuning its formula:

- *Nearest-neighbour bracket* (Round 1). For 18 of the 38 unranked entries
  the two nearest ranked neighbours (by source order) were inverted
  (`prev > next`) or one-sided, so the bracket was contradictory or
  missing and a tie-break decided the placement. `min(prev, next)`
  resolved every one of those the same direction — as early as possible —
  which is why `FindTraps` (a non-combat utility spell sitting at original
  index 126) landed at position 24, ahead of every summon, and the FNP
  `CloakOfFear` landed at position 4 while its vanilla twin sat at 95,
  ninety positions later.
- *Monotonic envelope* (`L[i]` = running max of ranked ranks to the left,
  `R[i]` = running min to the right). Looks at all the evidence on each
  side rather than one neighbour, the right instinct, but it failed on
  this particular pair of orderings: Spearman's ρ between original index
  and baf line is only **0.175**, so `L` saturates at 20060 by index 40
  and `R` saturates at 972 by index 70. The envelope was inverted for 36
  of the 38 entries — worse than the nearest-neighbour bracket, since
  looking at *all* prior/later evidence just means saturating on the
  single most extreme outlier on each side.

Both failures share a root cause: **the hand list's order and emulti.baf's
order are nearly uncorrelated, so a baf line number borrowed from a
neighbour says almost nothing about where an unranked entry belongs** —
and neither does that neighbour's mere presence nearby. Ordinal placement
(Round 2) fixed the *formula* (no more directional bias, no borrowed line
numbers) but kept the underlying premise: an unvetted entry still ends up
sitting at a specific array index, indistinguishable in the source from a
genuinely evidence-ranked neighbour, implying a relationship to that
neighbour that was never derived from anything. Round 3's fix is to stop
implying it — unvetted entries get their own list, entirely below the
ranked ones, so nothing about their position looks like a claim.

### Output

`spell-priority-order.ts` declares three exports:

```ts
export const SPELL_PRIORITY_ORDER_RANKED: string[] = [ /* 91 entries, baf order */ ];
export const SPELL_PRIORITY_ORDER_UNVETTED: string[] = [ /* 37 entries, hand order */ ];
export const SPELL_PRIORITY_ORDER: string[] = [
  ...SPELL_PRIORITY_ORDER_RANKED,
  ...SPELL_PRIORITY_ORDER_UNVETTED,
];
```

`AbilityOrderService` and its callers are unaffected — they only ever
consumed `SPELL_PRIORITY_ORDER`, which still has the same shape
(`string[]`) and still contains every entry. The `// TODO: to sort` marker
and the old inline "not vetted" flag comments (Round 1/2) are both gone;
there is nothing left to flag inline, since the unvetted list *is* the
flag now — every entry in it has no direct evidence, unconditionally, so
a per-entry comment repeating that fact would be noise.

### Verification

- Both existing invariants in `spell-priority-order.test.ts`: non-empty,
  and containing both `Sanctuary` and `FingerOfDeath` (in either list).
- `SPELL_PRIORITY_ORDER` equals the concatenation of the two sub-lists —
  guards against something bypassing them and editing the combined array
  directly.
- `SPELLS.Wizard.Stoneskin` (ranked, real evidence) precedes
  `SPELLS.Priest.FingerOfDeath` (ranked, real evidence) — replaces the old
  Sanctuary-before-FingerOfDeath check, which no longer holds:
  `CLERIC_SANCTUARY` is never cast anywhere in `emulti.baf` (only two `//`
  comment lines, 4657 and 11632), so `Sanctuary` is now in
  `SPELL_PRIORITY_ORDER_UNVETTED`, after every ranked entry including
  `FingerOfDeath`. This is the direct, intended consequence of Round 3, not
  a regression.
- `SPELL_PRIORITY_ORDER_UNVETTED` contains `Sanctuary` and
  `SPELL_PRIORITY_ORDER_RANKED` does not — makes the Round 3 trade-off an
  explicit, checked fact rather than an implicit one.
- Coverage check (in the script, not the test suite): every entry present
  before a run is still present after — the merge reorders and
  reclassifies, it never drops entries. Duplicate resource files across
  the two lists (two registry paths resolving to the same file) are
  collapsed to one line, favouring whichever copy is ranked.
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
