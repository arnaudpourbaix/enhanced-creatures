# Auto-cloning weapons per adjustment enchant bracket — design

**Status: shelved.** Approved in design review but not scheduled for implementation - keeping
this spec so the design doesn't need to be re-derived when the backlog below is worth automating.

## Purpose

`weaponService.checkEnchantment` computes a weapon's `+N` enchantment from `EnchantmentTable`
based on creature level, but a weapon is a single shared `.ITM` resource. When a creature has
adjustments (alternate CRE files reusing the same base definition at a different level - see
`CreatureAdjustment`), only adjustments that explicitly re-equip their own dedicated weapon (via
`items.equipped`, e.g. Treant's per-hit-dice branches, Ogre's leader weapon, Shadow's soul weapon)
get correctly enchanted for their own level - this was fixed in `creatureService.getWeaponLevel`
(commit `35f1634`).

Adjustments that only change `level1` (or other stats) *without* providing their own weapon still
silently share the base creature's `.ITM` file, so that weapon is stuck at the base's enchant
bracket even when a tougher adjustment would need a higher one (or a weaker one would need lower).
Fixing this today means hand-authoring a dedicated weapon + `items.equipped` override per
creature, per adjustment bracket, replicating the Treant/Ogre/Shadow pattern by hand. As of this
writing that backlog is **37 adjustments across 16 creatures** (Ankheg, GreaterBasilisk, CaveBear,
PolarBear, CarrionCrawler, GiantLynx, MountainLion, DisplacerBeast, Sirine, Ogre, Ogrillon,
OgreMage, OgreBerserker, PhaseSpider, Ghast, Shadow).

Manual authoring means every creature file has to encode `EnchantmentTable`'s bracket logic by
hand (which bracket a given level needs) - knowledge that belongs in the service layer and can
change over time. This design moves that responsibility into `weaponService`/`creatureService` so
it never needs to be re-derived per creature, now or for any future creature/adjustment added
later.

## Non-goals

- Not a one-time codegen/backfill tool that writes overrides into `lib/creatures/*.ts` - the
  allocation logic must run on every `npm run generate`, not just once (see rationale above).
- Does not change how *explicit* ownership already works (base's default equip, or an adjustment
  with its own `items.equipped` entry for a weapon) - that path, fixed in `35f1634`, is untouched.
- Does not touch weapons on creatures with `autoGenerate.enchantment === false` - same scope as
  today's `checkEnchantment`.
- Does not attempt to give cloned weapons distinct display names/descriptions - docs already
  render `+N` dynamically from `item.enchantment` (confirmed via `monsters.html` diffs), so a
  clone reuses the original's `stringRef` untouched, exactly like Treant's branches all being
  named "Branch".

## Core allocation rule

For each weapon on a creature, gather every "requester": the base creature (if it equips this
weapon by default) plus every non-`noWeapon` adjustment. Compute each requester's bracket via the
existing `EnchantmentTable` lookup (base creature's `bonusHp`, consistent with today - no creature
in the codebase overrides `bonusHp` per adjustment).

Split requesters into:

- **Explicit owners** - the base's default equip, or an adjustment with its own `items.equipped`
  entry for this weapon. This group's resolution is unchanged from the existing fix and continues
  to govern the *existing* item file's enchantment.
- **Implicit requesters** - adjustments that never mention this weapon at all (today's 37-row
  backlog), so they'd otherwise silently inherit the base's item.

For every implicit requester whose bracket differs from the existing item's bracket: clone the
weapon **once per distinct differing bracket** (dedupe - e.g. Ogre's `HACK` (level 11 → +4) and
`LARZE` (level 13 → +4) share a single +4 clone), and wire the clone into `items.equipped` for
every adjustment needing that bracket.

An adjustment that already overrides this weapon's slot with a *different*, unrelated item (e.g.
Ogre's `AC#FP2OT,BDSOGR1,BDSOGR2` equipping `BLUN07`, a morning star swap) is out of scope
entirely - it was never sharing this weapon and must never be touched.

## Cloning mechanics

New method on `weaponService`, e.g. `cloneWithEnchantment(creature: Creature, original: Weapon,
enchantment: number): Weapon`:

- Deep-clones `original`: same `header` (damage dice, speed, range, effects, abilities), same
  `icon`/`copyFrom`, same `stringRef` (shared display name, per Non-goals).
- New unique `file`, generated the same way `AbstractCreature.addItem` does today -
  `getItemFilename(creature.items.length, creature.id, creature.fileType)` evaluated at clone
  time (after any earlier clones in the same pass have already been pushed, so numbering stays
  unique).
- Sets `.enchantment` to the target bracket and adds the `Magical` flag under the same condition
  `checkEnchantment` already uses (`item.enchant && !weapon.flags?.includes(Magical)`) - single
  source of truth for "what a +N weapon looks like," reused rather than duplicated.
- Pushes the clone into `creature.items`. Because `creatureFactory.validate()` runs `checkWeapons`
  *before* `descriptionService.generateCreatureItems` and the WeiDU/doc generation steps, the
  clone is picked up by both automatically - no additional wiring needed there.

For every adjustment needing this bracket, set (replacing any stale entry for the same slot, not
blindly pushing a duplicate) an `items.equipped` entry pointing at the clone's file, in whichever
slot the original weapon occupies (read off the equipped-list entry used to determine the base is
an explicit owner).

**Mutation safety:** compute the full set of needed clones from a snapshot of `creature.items`
taken before any mutation, then apply all clones/wiring afterward. This avoids iterating an array
while appending to it, and guarantees a clone is never itself reprocessed as if it needed further
splitting (it wouldn't be, since `enchantment` is set directly at creation and `checkEnchantment`
already early-returns once `weapon.enchantment !== undefined`).

## Edge cases & guardrails

- **Deliberate slot override**: adjustment has its own `items.equipped` entry for that slot
  pointing at a different file → never a requester, never touched.
- **`noWeapon: true`**: skipped entirely, as today - never a requester, never gets a clone.
- **Scope**: only runs when `creature.autoGenerate.enchantment` is true.
- **`summon: true` adjustments**: still treated as normal implicit requesters - `summon` governs
  script/behavior, not combat balance; no special-casing.
- **Idempotency**: a clone's `enchantment` is set directly at creation, so it can never itself be
  flagged as needing a further clone.
- **`bonusHp`**: read from the base creature only, matching current behavior.

## Testing

Unit tests in `creature.service.test.ts`, extending the existing `checkWeapons` describe block:

1. An implicit requester with a higher level gets a new clone, equipped only for that adjustment;
   the original item and any other owners are untouched.
2. Two adjustments needing the *same* differing bracket share one clone (only one new item
   created, both adjustments' `items.equipped` point at it).
3. An adjustment that already overrides the slot with an unrelated item is left alone (no clone,
   no wiring).
4. A `noWeapon` adjustment is never a requester, even if it would otherwise imply a different
   bracket.
5. Regression: today's explicit-owner behavior (Treant/Ogre/Shadow-style) is unaffected.

Integration: regenerate `mod/` and expect the golden test to show *new* item blocks for the 16
backlog creatures (new `.tpa` entries per cloned `.ITM`, plus the corresponding `items.equipped`
overrides in each affected adjustment's conditional block) - review that output manually before
committing, same as every other generator-output change.

## Open backlog (as of 2026-08-12)

37 adjustments across 16 creatures would get a clone under this design; see conversation history
or rerun the analysis (walk `State.creatures` after `mainService.generateCreatures()`, compare
each adjustment's `level1`-derived bracket against its weapon's current `enchantment`) for the
current, up-to-date list - creature data changes over time and this snapshot will go stale.
