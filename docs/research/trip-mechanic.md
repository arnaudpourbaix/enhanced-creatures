# Trip mechanic

How a creature's hit knocks its victim down for a round. Code:
`lib/src/services/effects/trip.service.ts` (`attachTripToWeapon` builds everything), config in
`lib/src/model/creature/trip.ts`, immune creatures in `lib/config/creatures.ts`, size limit in
`lib/src/services/effects/size-immunity.ts` (shared with the grab). Rules marked _(in game)_ were
found by testing in BG2EE, not read from the engine docs.

## What the player sees

- A hit trips the victim unless it saves (vs. paralyze/poison/death by default). The combat log
  shows "Tripped" only when it falls. The trip spell's name never shows.
- The victim falls, lies helpless and gets up: this takes the round, and it can't act meanwhile.
  It wakes early if it takes damage, but stays prone for the rest of the round.
- While prone, the victim can't move and gets -4 AC. Its portrait shows the Sleep icon.
- A victim immune to sleep still falls prone: it can't move and has -4 AC, but it acts at once.
- A victim tripped again stays down for a new round. The trips don't stack.

## Configuration

A natural weapon trips with `trip: CreatureTripConfig`:

| Field       | Meaning                                                                |
| ----------- | ---------------------------------------------------------------------- |
| `saveType`  | the victim's save; a success keeps it standing (default vs. paralysis) |
| `saveBonus` | bonus to that save (default 0)                                         |
| `noSave`    | every hit trips                                                        |

`trip: {}` is the default trip. Global values are in `TRIP_DEFAULT_CONFIG`: the spell state
(`JA_PRONE`), the save, the duration (one round), the portrait icon (Sleep) and the texts.

Users: vampiric wolf. Its bite trips, and its other jaws grasp a prone victim's arm (see
[grab-mechanic.md](grab-mechanic.md)).

## Who can't be tripped

- `TRIP_IMMUNE_CREATURES`: the grab's immune kinds (mimics, slimes, flying and incorporeal
  creatures).
- Creatures bigger than the attacker (`getTooBigCreatures`, without the grab's limb reach).
  Sizes come from the LARGE/HUGE/GARGANTUAN lists. An unlisted creature counts as Medium or less.

Both are op 318 protections at the start of the spell, so the spell is blocked before any of its
effects applies.

## The spell

The hit casts one spell (op 146). After the protections, every effect shares one save, so it rolls
once (identical saves in one spell roll once): the victim falls or stays standing. The effects,
in order:

1. removes the previous trip (op 321), so a new trip restarts the round without stacking;
2. spell state `JA_PRONE` (op 328), which the scripts check;
3. movement set to 0 (op 176, which Free Action doesn't stop);
4. AC -4 (attackers get +4 against a prone target);
5. Sleep (op 39) for the round: wakes on damage (parameter2 0), with the Sleep icon in `special`;
6. the Sleep portrait icon (op 142);
7. the "Tripped" text.

The spell has no racial sleep resistance (`addRacialResistances: false`): it is a fall, not sleep
magic, so an elf's resistance doesn't keep it standing.

## Targeting

The "Prone" target status (`CheckSpellState(JA_PRONE)`) is in a creature's default status order
(after "Grabbed") only when it wields a trip. A creature can attack prone victims first
(`targetPriorities`) and switch weapons on them (`targetStatusWeaponSlot`). The vampiric wolf
grasps with WEAPON2 on a prone victim.

## Engine rules learned the hard way

- **Sleep, not a pose** _(in game)_. Op 138 `SEQ_SLEEP` lies the victim down, but acting stands it
  up at once, and an idle victim stays down for good. No delayed stand-up looked right in both
  cases: `SEQ_AWAKE` replays the get-up on a victim already up, and `SEQ_READY` snaps. Sleep gives
  the engine's own fall, helplessness and get-up. Its drawback, sleep immunity, only removes the
  helplessness: the rest of the trip still applies, so a grab still reaches the victim.
- **The Sleep needs an icon** _(in game)_. A sleeper without a portrait icon moves to the back
  list: `NearestEnemyOf` skips it, and the attackers can't find their tripped victim. An op 39 with
  an icon in `special` (EE) sets the engine's PRONE state and keeps the sleeper targetable.
- **Op 39 parameter2 (EE)**: 0 wakes on damage, 1 doesn't. Don't infer it from the game's own
  SPWI116, which uses 1.
- **No visual** _(in game)_. None of the game's fit: `SPDUSTY2` dust looked awful, and Sleep's
  `SPNWCHRM`, played once as Sleep plays it, was poor and too short. A visual made for the mod (a
  BAM + VVC) is the remaining option.
- **Known glitch** _(in game)_: a victim sometimes stands up and falls again. It also happens when
  no attacker hits it, so it is likely the engine's.

## Experience

The trip spell is the weapon's attack form (`xpAbility: "specialAttack"`).
