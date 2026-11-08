# Threat experience system

Status: design for review (2026-11-07). Related: [experience rules](../../research/experience-rules.md)
(the DMG system this sits next to).

## Why

XP should measure how much a monster threatens the party (user). The DMG formula (Table 31 + the
flat +1/+2 rows of Table 32) doesn't: its yes/no rows can't tell a 34-damage round from a 76-damage
one, it ignores attacks per round, to-hit, AC and hit points, and it inflates the totals (+45% over
the in-game XP for base creatures, +58% for every file). A polar bear can't go from its book 1400 to
4000 or 6000: XP drives the party's level progression, and inflating it breaks the game's balance
(user).

## Goals

- A second XP system, **threat**, selectable next to the DMG one; the DMG system stays.
- Threat follows what makes a monster dangerous to a party (user's list): its resistances, attacks
  per round, damage that lands, on-hit effects (paralysis, poison), kill effects (death,
  petrification, more in an area), level drain, charm, spells and spell-like powers, invisibility,
  special moves (a sword spider's leap), how hard it is to kill (AC, hit points, physical damage
  resistance), and whether it can be kited (speed) or not (ranged attacks).
- The scale stays the book's: totals close to the 2e book XP, no inflation; a creature far from its
  book value moves, in the direction of its real threat.
- Judged on real values first: base creatures in the dashboard's XP proposals view, adjustments next.

## Non-goals

- Simulating a whole party, the AI's tactics or the engine's combat rules exactly.
- Hand-set per-creature corrections (the user rejects per-creature flags): the system reads each
  creature's data.
- Replacing the DMG system or the book XP: both stay, the settings pick.

## Anti-goals

- XP climbing across the mod (inflation of the party's progression).
- A weaker creature worth more than a stronger one of its family (bears out of order, a variant
  below its base when it is stronger).

## Settings

> 2026-11-08 (user): the `experienceSystem` setting was removed. XP is always the DMG formula; the
> threat system stays as a comparison in the dashboard's XP proposals view. The "never below the
> in-game XP" floor was removed the same day: the formula wins unless an adjustment sets
> `keepInGameXp` (see docs/research/experience-rules.md).

- `PLAYER_CONFIG.experienceSystem: "dmg" | "threat"`, default `"dmg"` (nothing changes).
- `PLAYER_CONFIG.experience2e` keeps its meaning in both systems: true, base creatures play their
  book XP (`xpv2e`); false, they play the selected system's score.
- Everything else of the XP pipeline is shared: the per-file statuses, never below the in-game XP,
  `xpv: 0` and summons worth nothing, the XP patches, the dashboard.

## The reference fighter

A monster is measured against a fighter of its own level (user: monsters are designed to meet a
similar level party; fighters melee most of them). Its level is its Hit Dice value (Hit Dice, +1
with a plus below 10), capped at 20. The fighter, by level (user's values; my calls marked):

- HP: 13 per level (10, the usual maximum, + 3 Con) up to 9, then +3 per level.
- AC: 10 at levels 1-2, 3 (plate) around 4, 1 (full plate) around 6, magic items down to -5 at 20
  (user); 6 at level 3 and linear from 6 to 20 (my calls).
- Strength 18/50 (between the usual 17 and 18/00: +1 to hit, +3 damage) (user's range, my pick).
- Two d8 swords: 2 attacks a round, +1/2 at 7 and at 13 (user); weapon specialization +1 to hit,
  +2 damage, +1/2 attack (my call, from BG's proficiencies).
- Enchantment +0 at 1-4, +1 at 5-8, +2 at 9-12, +3 at 13+ (my call).
- THAC0 and saving throws: the 2e warrior tables.

### The reference archer

The same fight with a bow (user: usually 17-18 Dexterity, highly damaging early and hard for a
monster to counter). Same level, HP and saves as the fighter; my calls on the rest:

- Dexterity 18: +2 to hit with missiles, -4 AC on top of the fighter's armor progression.
- A longbow: 2 attacks a round, arrows 1d6, specialization +1 to hit and +2 damage, the swords'
  enchantment schedule on the arrows, no strength bonus.
- Movement 12 (PnP).

The spike's table (`scripts/lib/experience-threat-reference.ts`) has the fighter; it gets the
archer and becomes the system's data.

## The duels

Threat compares the rounds the fighter needs to kill the monster with the rounds the monster needs
to take him out (my call: a ratio of rounds, not a chance to win, which flattens near 100% with the
mod's high hit points and stops telling a ghoul from a ghast). Two duels: against the reference
fighter in melee, and against the reference archer (below).

### Monster's side: rounds to take the fighter out

Per round, a hazard `h`: the share of the fighter the monster takes out that round.

- **Attacks**: the round the XP damage rows already build (each weapon once, strongest first,
  extra attacks repeat the weakest, the engine's off-hand attack counted). Chance to hit:
  P(hit) = (21 − (THAC0 − AC)) / 20, clamped to 5%..95%, with the monster's melee THAC0 (its strength
  to-hit included, `getMeleeThac0`) against the fighter's AC.
- **Damage**: each attack's average damage (dice average + strength damage + on-hit damage) ×
  P(hit). A chance-based extra counts at its chance: a 10% hug adds a tenth of its damage (user). Damage
  hazard = round damage ÷ the fighter's HP. Poison adds its damage over its duration.
- **Duel-ending effects** (user: once paralyzed, the fighter dies without help): paralysis and
  hold, stun, sleep, petrification, death and kill opcodes, charm. Each attack's chance:
  P(hit) × P(failed save) × the effect's own chance; the round's: 1 − Π(1 − each attack's).
  Saves are the fighter's, with the effect's save bonus. Duel-ending hazard = that chance.
- **Powers**: a creature's own powers and spells add a hazard for the rounds they last: an ending
  effect (a gaze, a charm, a death spell) as above against the save it allows; a damage power or
  spell at its average damage ÷ HP. Limited uses spread over the duel (my call: a power with N
  uses counts N ÷ the fighter's rounds to kill it, R_f, of a round's hazard, at most 1 per round). An area effect is
  worth more than its hazard against one fighter (my call: × 1.5, it hits the party).
- **Level drain**: each drained level counts as damage worth a level of the fighter's HP (my call).
- **Invisibility at will**: +2 to hit on every attack and × 1.2 on the threat for its unpredictable
  target (my call; the user: you can't predict who it attacks, and attacks from invisibility get a
  bonus).
- **Special moves** (a leap, a charge): their expected damage, spread over their cooldown.
- **Other harmful effects** (user's rules, my weights): a confused fighter still attacks his
  enemy in a duel, so confusion costs nothing in melee, but he can't kite or run, so it breaks
  the archer's kiting (the monster reaches him). A frightened fighter runs: for its duration he
  deals no damage, and a melee monster's damage is halved (my call: a fleeing target is hard to
  melee) while a ranged one hits at full rate. Blindness, slow, web and entangle count half (my
  call: they cut his damage or give the monster free rounds); strength drain and disease count
  as damage, like level drain (my call); silence counts nothing against a fighter; polymorph ends
  the duel (my call).
- **Tagged and declared abilities** (my call): in the threat system a tagged power (a breath, an
  aura) is scored from its own effects, not its tag; a declared ability (`xpAbilities`: the
  vampires' forms, blood drain, swallow whole, magical items) adds a fixed × 1.1 to the threat.
- **Game spells** (my call): the generator has no damage data for the game's own spells, so they
  count from a table by spell level and role (damage, disable, kill...), against the save their
  profile gives. Reading the SPL files from the install can come later if casters look wrong.
- h = damage hazard + duel-ending hazard + powers' hazard (they add up, my call), capped at 1.
  Rounds to take the fighter out: R_m = 1 ÷ h.

### Fighter's side: rounds to kill the monster

- His damage per round: attacks × P(hit) against the monster's AC × damage per hit, cut by the
  monster's slashing resistance (his swords), zero when a weapon immunity needs more enchantment
  than he has.
- Regeneration is taken off his damage per round.
- Rounds: R_f = the monster's HP ÷ that damage, capped at 30 rounds (my call: "can't be killed by
  a fighter of its level" saturates).
- Immunities to the party's usual answers (paralysis, stun, charm, fear...) multiply R_f: × 1.2
  for the undead's (the `undead` immunity: the user's "undead are particularly nasty") and × 1.15
  for the constructs' (the `construct` immunity: the user's "almost as good as undead") (my
  weights; the duel itself doesn't use those answers). A golem with full magic immunity gets both
  factors.
- Magic resistance and spell immunity play no part in the duels, but in a real fight the party's
  casters can't land their spells and become almost useless (user: a cave full of golems). They
  multiply R_f as a party factor (my weights: casters are about a third of a party's power): full
  magic immunity × 1.5, partial magic resistance × (1 + magic resistance ÷ 2), a spell immunity
  (a school or a type of spell) × 1.1.

### The ranged duel

The archer's side is the fighter's with his bow (his attacks, to-hit and damage; arrows are
piercing, so the monster's piercing and missile resistances apply). The monster's side depends on
reaching him (my calls):

- **It can be kited** (PnP movement under 12, slower than the archer, it fights in melee): its melee never lands; only
  its ranged attacks, ranged powers and spells count. The archer shoots at half rate while kiting.
- **It's as fast or faster** (12 or more; user, 2026-11-08: at equal speed nobody gains distance): one free round of arrows, then the melee duel against the
  archer (his AC, his bow damage).
- **It's ranged** (a wielded missile weapon, ranged powers, a breath): it shoots back as in melee,
  kiting doesn't help.

Speed and range come out of this duel instead of flat factors: a slow melee brute is kited (the
user's greater basilisk: protected from petrification, a bow wins), a fast or ranged one isn't.

### Threat

- Each duel's ratio: R_f ÷ R_m (the archer's rounds ÷ the monster's for the ranged duel). About 1
  is an even fight for its level, above 1 needs preparation.
- Threat T = melee ratio^0.75 × ranged ratio^0.25 (user, 2026-11-08: a party mostly melees, and
  against 3 to 10 enemies an archer is rarely safe, he can barely kite one of two; the ranged duel
  only discounts a slow melee brute like the greater basilisk; the 0.25 weight is my call) × 1.2 with invisibility at will (above).

## From threat to XP

XP = Table 31 (its Hit Dice value) × s × T^k, rounded to 10.

- s and k are fitted on the base creatures that have both a book and an in-game XP (my call): k by
  least squares on log(book ÷ Table 31) = log s + k log T, then s so their XP total equals their
  book total, before the never-below-in-game floor. k is kept within 0.25..1, so threat moves XP
  without exploding it.
- The fit runs once and is stored as constants (my call), shown on the dashboard, with a command to
  refit: a change to one creature then doesn't shift every other creature's XP.
- Never below the in-game XP, as every file today.

## Dashboard

- The XP proposals view gets the threat columns per base creature: both duels' R_m and R_f, T and
  the threat XP,
  with the fitted s and k shown, next to in-game, book and the DMG formula; its totals line
  shows the threat total against the in-game and book totals.
- A breakdown per creature, in the DMG breakdown's style: "duel: monster 1.3 rounds (77%
  paralysis a round), fighter 2 rounds = 1.5; fast × 1.15 = 1.7; 120 × s × 1.7^k = ...".
- With `experienceSystem: "threat"`, every other Experience view (XP changed, drops, conflicts, all
  files) shows the threat decisions.
- Adjustments are scored per file from the start (my call: the model reads a file scope like the
  DMG detection); "as base" is the same threat as the base creature. The proposals view shows base
  creatures first (user), adjustments next.

## Checks

- The ghoul against a level 2 fighter: 77% paralysis a round (60% to hit, 65% failed save, three
  attacks) + 17% damage (7.5 average × 60% ÷ 26 HP), so R_m ≈ 1.06; the fighter needs 24 ÷ 11.9 ≈
  2.0 rounds, × 1.2 for undead ≈ 2.4: a melee duel ratio of about 2.3.
- The bears in order in both strength editions: black < brown < cave < polar and grizzly.
- The greater basilisk (slow, melee, petrifying) lower against the archer than against the
  fighter.
- The base creatures' threat XP total within a few percent of their book total.
- Tests on the service with fixtures (no creature test files): P(hit) and its clamp, a round's
  ending chance, R_m and R_f, the caps, the reach factors, the fit of s and k.

## Left to the builder

- Where the duel's code lives (next to the DMG detection, reusing its attack round, immunities
  and power detection), and how its breakdown text is built.
- The exact list of opcodes per effect category, from the DMG detection's lists.
