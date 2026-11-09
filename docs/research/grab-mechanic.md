# Grab mechanic

How a creature seizes a victim and holds it round after round. Code:
`lib/src/services/effects/grab.service.ts` (`attachGrabToWeapon` builds everything), config in
`lib/src/model/creature/grab.ts`, immune creatures in `lib/config/creatures.ts`. Rules marked
_(in game)_ were found by testing in BG2EE, not read from the engine docs.

## What the player sees

- A hit seizes the victim. The combat log shows "Grabbed" once, on that hit only.
- While held, the victim can't move, loses its Dexterity bonus to AC, gets -4 AC and -4 THAC0,
  and shows the Entangled icon and a constriction visual.
- Every round the victim makes a save (vs. paralyze/poison/death by default). A failure keeps it
  held another round and makes it take the grip's damage, if the grip deals any. A success frees it
  unharmed.
- The grabber can't move while it holds. If the grip deals damage, the grip is its attack: its
  attacks per round drop to 0, unless it grips with one hand (`freeHand`).
- The grab ends when the victim saves, when the grabber dies, or when the grabber kills the
  victim. In that last case the grabber moves and attacks again at once.
- None of the grab's spells writes its name in the combat log.

## Configuration

A natural weapon gets a grab with `grab: CreatureGrabConfig`:

| Field                   | Meaning                                                                                                                           |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `trigger`               | `"probability"`: the hit holds at once, no save. `"save"`: every hit, with a save. `"both"` (default): a probability, then a save |
| `probability`           | chance per hit (default 100)                                                                                                      |
| `damagePerRound`        | the grip's damage, one entry per damage type (ankheg: 3d6 crushing + 1d4 acid)                                                    |
| `addStrengthBonus`      | adds the grabber's Strength damage bonus to the first damage entry                                                                |
| `freeHand`              | the grabber keeps its attacks while the grip deals damage (ettin revenant)                                                        |
| `onlyGrabProneTarget`   | the save is 4 harder                                                                                                              |
| `saveType`, `saveBonus` | override the save; by default it is computed (below)                                                                              |

**The save.** The bonus is `-(Strength hit bonus + size modifier + 4 if onlyGrabProneTarget)`.
The size modifier is the grabber's `grabModifier`: Tiny -8, Small -4, Medium 0, Large +4,
Huge +8, Gargantuan +12, Colossal +16.

**First round.** With `trigger: "probability"`, the hit holds without a save, so the grip's
damage starts from the next round. The hit itself deals the weapon's own damage. The description
says so (`spell.grab.damageNextRound`).

Current users:

| Creature       | Trigger             | Grip                                 |
| -------------- | ------------------- | ------------------------------------ |
| Ankheg         | probability         | 3d6+1 crushing + 1d4 acid, no attack |
| Revenant       | probability         | 2d8 + STR crushing, no attack        |
| Ettin revenant | probability         | 2d8 + STR crushing, free hand        |
| Hell hound     | probability, 5%     | no damage                            |
| Vampiric wolf  | both, prone targets | no damage                            |

## Who can't be grabbed

The hold is skipped, without a message, when the victim is one of these:

- **Immune by kind**: mimics, slimes, flying, incorporeal and gargantuan creatures
  (`GRAB_IMMUNE_CREATURES`). A Large grabber can't hold Huge or Large kinds either, and a Huge
  grabber can't hold Huge kinds (`HUGE_CREATURES`, `LARGE_CREATURES`), matched by race or class.
- **Held** (paralyzed). Every attack hits a held creature anyway. The grip's damage comes with a
  save, so grabbing a held victim would make it _easier_ to survive.
- **Dead**: killed by the very hit that grabs (see below).

Each skip is an op 318 (protection from resource) against the spell itself, placed before its
other effects. One op 318 per race, class or state, so no EFF file is needed.

## The spell chain

A round is one spell application. A spell's identical saves roll once, so a save every round
needs a new spell every round. Six spells per grab (five when the hit has a save: no seize):

| Spell   | Cast by                                            | Effects                                                                                                  |
| ------- | -------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| seize   | the hit, just before the hold                      | skips (immune, held, dead, already grabbed), then the "Grabbed" message                                  |
| check   | the hold, one round later (the hit, with a save)   | the save: on a failure, casts the hold and deals the grip's damage, both on the same save                |
| hold    | the hit (probability) or the check                 | removes the previous round's hold, skips, sound, the victim's effects, casts the grip and the next check |
| grip    | the hold, at the victim                            | lands on the grabber: removes the previous grip, grabbing state, no movement, no attacks if damaging     |
| release | the grabber's `Die()` trait contingency            | removes the hold, and its pending check, from creatures within 10 feet                                   |
| let go  | the grabber's `Killed([ANYONE])` trait contingency | removes the grabber's own grip                                                                           |

The victim's effects and the grip last a round plus 1 second (`HOLD_OVERLAP`), so the next
check renews them before they run out. A victim who saves stays held that extra second.

The states are spell states: `JA_GRAPPLED` on the victim, `JA_GRAPPLING` on the grabber. AI
scripts target a grabbed creature with `CheckSpellState(..., JA_GRAPPLED)` (the "Grabbed"
target status).

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
