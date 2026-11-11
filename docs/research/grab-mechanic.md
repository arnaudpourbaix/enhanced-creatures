# Grab mechanic

How a creature seizes a victim and holds it round after round. Code:
`lib/src/services/effects/grab.service.ts` (`attachGrabToWeapon` builds everything), config in
`lib/src/model/creature/grab.ts`, immune creatures in `lib/config/creatures.ts`. Rules marked
_(in game)_ were found by testing in BG2EE, not read from the engine docs.

## What the player sees

- A hit seizes the victim. The combat log shows "Grabbed" once, on that hit only.
- While held, the victim can't move, loses its Dexterity bonus to AC, gets -4 AC and -4 THAC0,
  and shows the Entangled icon and a constriction visual.
- With `escape: "save"`, the victim makes a save every round (vs. paralyze/poison/death by
  default). A failure keeps it held another round and makes it take the grip's damage, if the grip
  deals any. A success frees it unharmed. With `escape: "strength"`, the victim makes a Strength
  check instead: 1d20 at or under its Strength frees it. Without either (the default, `"none"`),
  the victim can't break free: it stays held, and takes the grip's damage, every round.
- With `victimNoAttack`, the grip holds the victim's weapon arm: its attacks per round drop to 0,
  and it can't cast wizard or priest spells (no gesture, op 145). Innate abilities stay.
- The grabber can't move while it holds. If the grip deals damage, the grip is its attack: its
  attacks per round drop to 0, unless it grips with one hand (`freeHand`).
- The grab ends when the grabber dies, when the grabber kills the victim, or when the victim
  saves or makes its Strength check. In that last case the grabber moves and attacks again at once.
- None of the grab's spells writes its name in the combat log.

## Configuration

A natural weapon gets a grab with `grab: CreatureGrabConfig`:

| Field                   | Meaning                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `trigger`               | `"probability"`: the hit holds at once, no save. `"save"`: every hit, with a save. `"both"` (default): a probability, then a save |
| `escape`                | `"none"` (default): never breaks free. `"save"`: a save every round frees it. `"strength"`: a Strength check every round frees it |
| `victimNoAttack`        | the grip holds the victim's weapon arm: it can't attack nor cast spells (vampiric wolf)                                           |
| `lifeDrain`             | the grabber heals as much as the grip's damage, on the same save (vampiric wolf)                                                  |
| `limb`                  | the grab seizes a limb (an arm, a leg): it reaches a victim one size bigger (vampiric wolf)                                       |
| `probability`           | chance per hit (default 100)                                                                                                      |
| `damagePerRound`        | the grip's damage, one entry per damage type (ankheg: 3d6 crushing + 1d4 acid)                                                    |
| `addStrengthBonus`      | adds the grabber's Strength damage bonus to the first damage entry                                                                |
| `freeHand`              | the grabber keeps its attacks while the grip deals damage (ettin revenant)                                                        |
| `onlyGrabProneTarget`   | the save is 4 harder                                                                                                              |
| `saveType`, `saveBonus` | override the save (on the hit and to escape); by default it is computed (below)                                                   |

**The save.** The bonus is `-(Strength hit bonus + size modifier + 4 if onlyGrabProneTarget)`.
The size modifier is the grabber's `grabModifier`: Tiny -8, Small -4, Medium 0, Large +4,
Huge +8, Gargantuan +12, Colossal +16.

**First round.** With `trigger: "probability"`, the hit holds without a save, so the grip's
damage starts from the next round. The hit itself deals the weapon's own damage. The description
says so (`spell.grab.damageNextRound`).

Current users:

| Creature       | Trigger                | Escape   | Grip                                                                     |
| -------------- | ---------------------- | -------- | ------------------------------------------------------------------------ |
| Ankheg         | probability            | none     | 3d6+1 crushing + 1d4 acid, no attack                                     |
| Revenant       | probability            | none     | 2d8 + STR crushing, no attack                                            |
| Ettin revenant | probability            | none     | 2d8 + STR crushing, free hand                                            |
| Hell hound     | probability, 5%        | none     | no damage                                                                |
| Vampiric wolf  | probability, -4 to hit | strength | 8 + STR piercing, heals as much, no attack; victim can't attack nor cast |

## Who can't be grabbed

The hold is skipped, without a message, when the victim is one of these:

- **Immune by kind**: mimics, slimes, flying and incorporeal creatures (`GRAB_IMMUNE_CREATURES`).
- **Too big** (PnP): a grab holds a target the grabber's size or smaller, or one size bigger on a
  limb (`limb`). Known sizes: `LARGE_CREATURES`, `HUGE_CREATURES`, `GARGANTUAN_CREATURES`, matched
  by race or class; anyone else counts as Medium or smaller (`getTooBigCreatures` in
  `size-immunity.ts`, shared with the trip). So a Small grabber can still hold an unlisted Medium
  creature. Before 2026-11-11 the rule was inverted: Small and Medium grabbers had no size limit.
- **Held** (paralyzed). Every attack hits a held creature anyway. The grip's damage comes with a
  save, so grabbing a held victim would make it _easier_ to survive.
- **Dead**: killed by the very hit that grabs (see below).

Each skip is an op 318 (protection from resource) against the spell itself, placed before its
other effects. One op 318 per race, class or state, so no EFF file is needed.

## The spell chain

A round is one spell application. A spell's identical saves roll once, so a save every round
needs a new spell every round. Without an escape save the same chain runs, its check just has no
save. Six spells per grab: the sixth is the seize when the hit holds at once, the attempt when the
hit has a save but the victim can't escape, none when the hit's save is the round's check. A
Strength check adds a seventh and an eighth, its failure and its success:

| Spell   | Cast by                                            | Effects                                                                                                                                         |
| ------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| seize   | the hit, just before the hold                      | skips (immune, held, dead, already grabbed), then the "Grabbed" message                                                                         |
| check   | the hold, one round later (the hit, with a save)   | the save (`escape: "save"`): on a failure, casts the hold and deals the grip's damage, both on the same save; without it, does both every round |
| attempt | the hit, when it has a save but no escape save     | the check with the hit's save: the round's own check has none                                                                                   |
| failed  | the Strength check, through op 326                 | the check without a save: casts the hold, deals the grip's damage and says "Strength check failed"                                              |
| freed   | the Strength check, through op 326                 | the "Strength check successful" message (the hold, not renewed, runs out)                                                                       |
| hold    | the hit (probability) or the check                 | removes the previous round's hold, skips, sound, the victim's effects, casts the grip and the next check                                        |
| grip    | the hold, at the victim                            | lands on the grabber: removes the previous grip, grabbing state, no movement, no attacks if damaging                                            |
| release | the grabber's `Die()` trait contingency            | removes the hold, and its pending check, from creatures within 10 feet                                                                          |
| let go  | the grabber's `Killed([ANYONE])` trait contingency | removes the grabber's own grip                                                                                                                  |

The victim's effects and the grip last a round plus 1 second (`HOLD_OVERLAP`), so the next
check renews them before they run out. A victim who saves stays held that extra second.

The states are spell states: `JA_GRAPPLED` on the victim, `JA_GRAPPLING` on the grabber. AI
scripts target a grabbed creature with `CheckSpellState(..., JA_GRAPPLED)` (the "Grabbed"
target status).

**The Strength check.** One op 326 (apply effects list) failure per Strength value 1–19, on a
new SPLPROT row `STRENGTH_EQUAL` (`STR = n`, added at install): the victim's own Strength alone
matches, with a (20 − S) × 5% chance to apply the failure. Strength 18 10%, 10 50%, 5 75%, 20 and
more never. Exceptional Strength counts as 18. Each failure has a success twin on the rest of the
roll (the freed spell's message), and Strength 20+ always succeeds (row 124, `STR >= n`).
_In game_: a first version cut one roll into 5% slices on `STR < n` (row 125), relying on the
effects sharing the spell's roll; a Strength 5 victim broke free within 3 rounds every time,
which fits slices rolling on their own (54% held instead of 75%). One failure per Strength gives
the right odds either way. The message is exact only if the effects share the roll; otherwise it
may show with a renewed hold, or not at all. Tested in game (Strength 3): the hold now lasts as
the odds say.

Chance to break free, one check a round from the round after the grab (exceptional Strength
counts as 18):

| Strength | Chance to break free per check |
| -------- | ------------------------------ |
| 3        | 15%                            |
| 5        | 25%                            |
| 8        | 40%                            |
| 10       | 50%                            |
| 12       | 60%                            |
| 14       | 70%                            |
| 16       | 80%                            |
| 18       | 90%                            |
| 20+      | 100%                           |

## Engine rules learned the hard way

- **Seize, not a message on the hit** _(in game)_. A display string on the weapon also showed
  on held, immune or already-grabbed victims. Seize carries the hold's skips, plus one on
  `JA_GRAPPLED`, so a hit that only renews a grab says nothing. The hit casts it before the
  hold, so a victim seized by this hit isn't grabbed yet. Both casts share the hit's
  probability, which rolls once.
- **Cast the grip at the victim, never at the grabber** _(in game)_. The hold's op 318 only
  guards the victim. A grip cast straight at the grabber (target 9) went through even when the
  hold was blocked: the grabber lost its attacks next to a victim it never held. Cast at the
  victim, it is blocked with the hold, and its effects use target 9 to land on the grabber.
- **No contingency renewed every round** _(in game)_. A new op 232 from the same spell is
  refused while the previous one lasts: the combat log shows "You cannot cast multiple instances
  of the same contingency spell on yourself" (strref 24154). Both contingencies (release, let go)
  are in the grabber's trait, applied once.
- **A grabbing hit can kill** _(in game)_. The hit's damage lands first. The kill's let go then
  runs before the hold, whose grip would bind the grabber to a corpse for the rest of the round.
  The hold skips a `STATE_DEAD` victim.
- **Release by area**. Creatures of the same kind share their spell files, so a dying ankheg
  also frees the victims of another ankheg within 10 feet. It is rare enough to keep, which is
  why let go is a separate self-only spell and not the release spell again.

## Experience

Seize, grip, release and let go are worth nothing (`xpAbility: null`). The spell the hit casts
(the check, or the hold with a probability trigger) is the grab's attack form
(`xpAbility: "specialAttack"`). The grip's damage counts in the round's damage, and the Strength
bonus counts only on weapons with the AddStrengthBonus flag.

## Trip

A trip knocks the victim prone for a round. The vampiric wolf trips first, then grasps a prone
victim. See [trip-mechanic.md](trip-mechanic.md).
