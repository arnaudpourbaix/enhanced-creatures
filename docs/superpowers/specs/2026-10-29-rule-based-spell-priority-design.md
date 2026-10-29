# Rule-based spell priority

Replaces the hand-ordered `SPELL_PRIORITY_ORDER` (lib/config/spell-priority-order.ts) with rules that
compute each creature's cast order from spell data, plus a per-fight random factor and a protected
phase under Sanctuary/Invisibility.

## Why

`SPELL_PRIORITY_ORDER` is a flat list of ~310 files, now required to cover every spell of the
database (`MainService.checkSpellPriorities`). Placing a spell means judging it against 300 others
it rarely competes with, and the result is still wrong in ways a single list can't fix:

- **One order fits no caster.** A level 4 offensive spell is a great opener for a level 7 wizard and
  a waste of a turn for a level 15 one.
- **Situation changes priority.** Draw Upon Holy Might is a bad first cast for an exposed level 5+
  cleric (long casting time, low level) but the right cast under Sanctuary.
- **Predictability is a weakness.** A player who retreats and comes back already knows the
  wizard's sequence and counters it. Randomizing the order each fight is the caster's only card.
  Spellbooks (which spells) and `enableRandomTargetOrder` (target order, baked at release) already
  make two similar casters differ; the cast order is the missing per-fight layer.

A good caster balances five things: protection, buffs, disabling, summoning and damage. It can't
spend a whole fight protecting itself, and it must stay useful to its allies.

## Goals

- A creature's cast order is computed from spell data and the caster's level, never placed by hand.
- A new spell gets a sensible position from its data alone.
- Every cast rolls: each spell has a chance to be skipped, so the best fit sometimes yields to the
  second best. Rolling per cast (not a fixed order per fight) is the user's choice: simpler, and
  enough to make each fight play out differently.
- At-will powers are ordered by the same rules as the spellbook (see At-will powers).
- Under Sanctuary or Invisibility, the caster uses a protected order of protections and buffs.
- Spell role and casting time are extracted/classified automatically; the user reviews and adjusts.

## Non-goals

- Changing which spells a creature has (spellbooks) or target selection.
- Computing remaining protection time: no timers on Sanctuary/Invisibility.
- Changing precasting of long-duration spells (they are already up before combat and don't compete
  for turns).

## Anti-goals

- A caster that spends the fight only protecting itself.
- A high-level caster opening with a low-level offensive spell (a level 15 wizard opening with a
  level 1-4 offensive spell).
- An order the player can learn and counter after one encounter.
- An at-will power used every round because it outclasses the spellbook.
- Another hand-maintained list of every spell.

## Spell data

Added to `SpellReference` (lib/src/model/spell-item/spell-reference.ts) and filled in
spell-database.ts (and FNP / NEW_SPELLS where they take part in ordering):

- **`castingTime`**: the SPL ability's casting speed (0-9+). Extracted from a game install by a
  script modelled on scripts/extract-spell-saves.ts (reads BIFs and override, writes a report under
  assets/spells/, `--write` fills entries that don't declare one, never overwrites a declared one).
- **`role`**: one of `reactive`, `protection`, `buff`, `disable`, `summon`, `damage`, `kill` (see
  Rules for `reactive`; `kill` is an outright kill, all or nothing, usually stronger than damage), or `useless`: no use in a fight, never cast by a script nor precast (Dancing
  Lights, Find Traps, Detect Evil). (User.)
- **`shapeshift`** role: the caster takes another form (Polymorph Self, druid and avenger forms,
  vampire bat/gas forms), usually losing its spellcasting for a new attack and sometimes abilities.
  Never a buff, never precast: great for attacking, but phase 2 needs its own rule for when a
  caster should shift (e.g. once its spells are spent or when melee pays off). (User.)
- **`tier`**: `great`, `good` or `decent` (default): how valuable the spell is within its role,
  independent of its level (Mirror Image is a great protection even for a level 15 wizard). Guessed
  for protections from their effects (Stoneskin, Mirror Image, Globes, Mantles, Spell Turning and
  Deflection great), set by hand elsewhere (Haste good, Berserker Rage great). The tier adds to
  every spell's score, and a great spell counts as good once the caster has clearly outgrown it
  (Mirror Image stays good, never less). Protections lose value more slowly with level than
  offensive spells. The opening protections (the user's "critical protections") are the great and
  good ones scoring high enough, by score: a good high-level protection can open before Mirror
  Image. (User.)
- **`secondaryRoles`** (optional): what else the spell really does, adding to its value - Battering
  Ram is a damage spell that also puts its target to sleep. The `role` decides which group the spell
  competes in, decided per spell on review; secondary roles only add value in the scoring. (User.)
  Classified automatically from the spell's effects (opcodes: damage, summon/creature creation,
  hold/sleep/confusion/charm/etc., AC/saves/attack bonuses, spell protections/immunities...) and
  existing keywords (`friendly`, `castOnSelf`, `cureWounds`...). The script writes its guess and the
  evidence behind it to the report; the user reviews and corrects entries by hand. A declared role
  is never overwritten.
- **`duration`** (long = hours, mid = turns, short = rounds to one turn) is reused, not duplicated:
  extraction fills it **only for protection, buff and summon spells**. `duration` also drives
  `StatementBuilderService.precastSpells`, which force-casts every memorized long (and, behind a
  flag, mid) spell before combat: right for those roles (Stoneskin, Animate Dead's 8 hours), wrong
  for offensive spells like Web. Newly precast spells are an intended change, listed for review.
  A declared `duration` is never overwritten. (User's decision.)

Existing data the rules also use: `level`, the `area` keyword, and `saves` (a save that only halves
damage vs one that negates the spell entirely - see `negatingSaves`).

The upfront check (`checkSpellPriorities`) changes from "listed in SPELL_PRIORITY_ORDER" to "has the
data the rules need" (role, casting time, level), all missing ones listed one per line.

## Rules

The rules give each spell, for a given caster, a **position** and a **probability** of firing when
its turn comes. The generated script tries spells in position order; each one passes its own
independent random roll (the existing `probability` → `RandomNumGT` mechanism in
`AbilityService`, which already gives each ability its own range so rolls don't share a result).
The roll happens on every cast: when a spell fails it, the next one that passes fires on that same
tick, and the skipped spell can win a later round.

**Reactive spells come first, always fire.** Spells gated by a condition so they only fire when
needed (Vocalize when silenced, healing and Regenerate when wounded, Dispel / Remove Magic, True
Seeing / Detect Invisibility against an invisible enemy, escapes like Dimension Door and Shadow
Door) form a separate `reactive` group: before every other role, probability 100%. (User agreed.)

What the user stated, to be turned into a scoring function by the builder:

- **Area before single-target, at similar levels.** It is a strong weight, not an absolute rule:
  a big level difference outweighs it. Finger of Death (single target, level 7, kills outright)
  beats Fireball (area, level 3); Abi-Dalzim's Horrid Wilting (area, level 8) beats Finger of Death.
  Randomness may occasionally break it like any other preference.
- **Save-for-half beats save-negates** as an opener: Fireball still hurts on a save, Sleep /
  Confusion / Slow do nothing.
- **Charms weigh more than their level suggests**: turning an enemy against its allies can be worth
  more than some area spells. It is a moderate bonus, not a trump card: the plain wizard
  Domination spell is still vastly outclassed by a level 8 spell. (User.)
- **Save penalty raises a save-negated spell's value**: a spell whose target saves at a big
  penalty is far less of a gamble. (User.)
- **Casting time is also interruption risk**: a long cast can be broken by a hit, a short one
  rarely. (User.)
- These combine: high-level vampire Domination (charm, save -6, short casting time) can end up
  level with Abi-Dalzim's Horrid Wilting, which does massive damage to everyone but is easier to
  interrupt; a classic Domination spell (normal save, normal casting time) cannot. (User.)
- **Strength relative to the caster**: a spell near the top of the caster's available levels scores
  high; low-level offensive spells sink for high-level casters and get no chance to open. The
  reference is the highest spell level the creature memorizes **in the same class** (wizard spells
  against its wizard spells, priest against priest): the creature model has no caster level, and
   multi-class casters (fighter/cleric, mage/cleric) have one book per class. (My call, from the
  builder check.)
- **Innates and at-will powers sit on the same level scale as spells**, by their own effective
  level: vampire Domination counts as a level 5 spell (6 for stronger versions), so a mage
  vampire's level 8 spells still come before it. Placing innates is case by case (user): the
  effective level is declared per power and can be adjusted by hand, and explicit placements
  (`insertBefore`/`insertAfter`) remain available when the rules get one wrong.
- **Fast casting time** pushes a spell earlier, weighted by power: Stoneskin, the Mantles and
  Absolute Immunity (casting time 1, strong defenses) belong very early even at low level.
- **Summons**: rarely first. A summon near the top of the caster's range (spell level 4 for a level
  7 wizard) can be close to first, still below a strong area damage spell. Summons of spell level
  6-9 can turn a battle (a cleric's Death Knight) and compete for the first turns.
- **Typical opening**: disable and summon, then damage; a very strong area damage spell can open.
  Short protections (Minor Globe) compete with area damage on the first turns: either can be right.
- **Balance**: protection and buffs are important but must not crowd out disabling, summoning and
  damage.
- **Buff strength**: a buff affecting all allies weighs more than a self buff, and speed is worth
  a lot: Haste and Improved Haste are strong buffs, since faster creatures are harder to kite in
  melee and reach casters sooner. (User.) An AC bonus or an immunity on the side doesn't make
  them protections. Berserker Rage is a very strong buff: its temporary hit points matter as
  much as its immunities (charm, hold, fear, stun) and attack bonuses. (User.)
- **Every spell keeps a chance to be skipped** (e.g. best fit at 90%), so a less perfect but less
  predictable action sometimes happens - except reactive spells, and except where that breaks the
  anti-goals above.

Exact weights and thresholds are left to the builder; they must be easy to tune in one place, and
the generated order must be inspectable (see Verification).

## At-will powers

Some creatures have unlimited-use powers next to their spellbook, e.g. vampire Domination: a level
5 disable declared with `memorizedCount: AT_WILL` (lib/creatures/vampire/vampire.ts), placed today
by hand (`insertBefore`/`insertAfter`) with a hand-set `probability: 50`. A mage vampire must weigh
it against its level 1-4 spells: still very powerful, but not cast every round.

- At-will powers are scored by the same rules as spells, from their own level and role, and take
  their place in the same order. Hand-set placement and probability go away for them.
- **The brake only applies when the power competes with a spellbook.** Since it never runs out, a
  power that outclasses the spellbook would otherwise fire every round. A creature with a spellbook
  gets a **cooldown** on each at-will power (rounds before it can be used again), growing with its
  level, using the existing per-ability `timer`; between uses it casts from its spellbook or
  fights. (The cooldown approach is my call; the curve is the builder's to tune.)
- **Without a spellbook, no brake.** A vampire without mage abilities uses Domination as often as
  necessary (still subject to its own triggers and the usual random skip). (User's rule.)

## Protected phase

While the caster is under Sanctuary or is invisible (`STATE_INVISIBLE`, and whatever check
identifies Sanctuary), the script uses a separate order containing only protections and buffs
(casting an offensive spell would break the cover):

- **Most valuable first.** Sanctuary lasts 6 rounds (nerfed), about 6 casts at best, so value
  decides which buffs make it; Invisibility lasts long but can be dispelled, so important buffs go
  first rather than being saved. Both covers use the same order.
- **Duration breaks ties: mid before short.** Among buffs of similar value, short ones (Draw Upon
  Holy Might) come last so they land closest to the end of the cover and are still active when the
  fight resumes. No timer.
- Long-duration buffs are left out: they are already precast before combat. (My call.)
- The random skip applies here too: the caster may sometimes cast something less important, by
  design.
- **When to leave the cover depends on whether it can be renewed** (user):
  - **Cover is limited** (Invisibility or Sanctuary from the spellbook, a few casts at most): the
    caster neither attacks nor casts offensive spells until it is ready, i.e. its protected-phase
    buffs are done. Breaking the cover early wastes it.
  - **Cover is at will** (e.g. an innate invisibility the creature can use again): the caster
    attacks as soon as its critical protections are up (the ones a reasonable caster wouldn't
    fight without, e.g. Stoneskin, Mirror Image, a Globe), since it can go back under cover later.
- **After the critical protections, alternate.** The remaining buffs don't all come before the
  first offensive spell: they interleave with offensive spells, as a player would. This holds in
  the main order too, and is how the Balance rule is met. (User.) How the interleaving is
  expressed (score bands, alternating slots, a buff counter...) is the builder's call.
- Matters most for casters that also fight (fighter/clerics): attack boosts at the end of the cover.

Casters that can melee already attack between spells (one spell per round via the global round
timer, attack otherwise); that stays as is.

## What it replaces

- `SPELL_PRIORITY_ORDER` and its uses: `AbilityOrderService.resolve()` and `sortByPriority()`,
  `MainService.checkSpellCombos` (sequencer files need a priority), `checkSpellPriorities`.
- The list also holds FNP_SPELLS, NEW_SPELLS (Symbol of Pain) and sequencer files
  (`spellComboService.filesOf(SEQUENCERS.X)`); the rules must cover them. A sequencer's position
  derives from its spells (builder's call how). Enemy contingencies keep coming first.
- Explicit placements (`AbilityEntry` insertBefore/insertAfter/insertFirst/insertLast) keep working
  on top of the computed order.

## Verification

- Golden test / fresh `mod/` regeneration shows the order changes, which are expected here; the
  builder produces a readable per-creature dump of the computed order with each spell's position and
  probability so the user can review a few casters (level 7 wizard, level 15 wizard, fighter/cleric,
  a summoner cleric, a mage vampire with Domination) against the rules above.
- Unit tests on the scoring rules in the service (not per creature).
- In-game test by the user for the protected phase.

## Left to the builder

- The scoring formula, weights and probability curve.
- How the classification script maps effects to roles, and the report format.
- How Sanctuary is detected in script.
- Whether the protected phase is a separate block of statements or extra triggers on existing ones.
- Migration order: data first (extraction + review), then rules, then removing the list.
