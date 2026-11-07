# 2e strength, kept next to the 3e/5e one

Status: design for review (2026-11-07). Data: [strength damage survey](../../research/strength-damage-survey.md).

## Goal

Most creature strength scores come from 3e/5e stat blocks; a few monsters have a strength (or an
explicit "no strength bonus") in their 2e entry. Record the 2e value next to today's, and let one
global setting pick which one plays, so both can be compared in game and on the XP dashboard
without losing either.

In 2e, strength only comes from 2e (decision 4): every known 2e strength is recorded, so a
creature without one (bears, cats, golems...) has no strength bonus in 2e.

## Data

`strength` and `exceptionalStrength` stay as they are: the 3e/5e value (or whatever the creature
has today).

A new optional field on the creature data, also settable on variants and adjustments:

```ts
interface Strength2e {
  /** The 2e score; absent when the 2e entry gives no strength bonus at all */
  strength?: number;
  exceptionalStrength?: number;
  /**
   * To-hit the 2e table can't give with that score (the MM's own value minus the score's), applied
   * through THAC0: an ogre chieftain +1 (MM +4, 18/00 gives +3), an ogre -1 (not a to-hit the creature already has, like the skeleton warrior's trait +3)
   */
  hit?: number;
  /** Where it comes from: an MM quote, or "inferred: ..." for a judgment */
  source: string;
}

strength2e?: Strength2e;
```

"No strength bonus" (skeleton warrior, juju zombie, monster skeleton) is `strength2e` without
`strength`: the 2e entry says the damage is the dice alone.

## Setting

```ts
PLAYER_CONFIG.strengthEdition: "3e+" | "2e" // default "3e+": nothing changes
```

- `"3e+"`: today's values everywhere. `strength2e` is only data (and documentation).
- `"2e"`: a creature plays its `strength2e`, else no bonus (15); an adjustment or variant plays
  its own `strength2e`, else the creature's (its own `strength` doesn't play):
  - `strength` and `exceptionalStrength` take the 2e score;
  - without a 2e score (no bonus), the strength becomes a neutral one with no to-hit or damage
    bonus: 15 (decision 3);
  - `hit` lowers THAC0 by that much (the engine adds the strength to-hit on top of the CRE THAC0,
    see `getMeleeThac0`).

`strength` (on a creature or an adjustment) is a 3e/5e or hand-chosen value: it plays in `"3e+"`
only. An adjustment whose own value is a 2e one records it as its `strength2e` (the elder
minotaur's 18/50).

## One resolution point

The effective strength (and THAC0) is resolved once, where creature data is built, before
anything reads it: the CRE patch, the doc (sheet, attack damage), the XP formula
(`strengthDamage`) and the AI (`getMeleeThac0`). No consumer looks at `strength2e` itself, so the
two modes can't disagree between the game, the doc and the XP.

## Docs and dashboard

- The monster doc shows the strength that plays (as today).
- The dashboard gets a small table: creature, 3e+ value, 2e value, source, so the record is
  visible without reading code.

## Values to record

The table "2e strengths found" in the survey: the ogre family, minotaur and elder minotaur, the
vampire ages, the death knight, and the three "no bonus" undead (skeleton warrior, juju zombie,
monster skeleton), and the elder minotaur's 18/50 on its adjustment.

## Tests

No creature test files: the resolution is tested in the service/factory with fixtures (each mode,
with and without `strength2e`, an adjustment's own strength winning, the no-bonus case, the THAC0
correction). With the default `"3e+"`, the golden test proves the generated mod is unchanged.

## Decisions (user, 2026-11-07)

1. **Default**: `"3e+"` until the in-game comparison (roadmap step 5).
2. **Natural weapons keep the strength bonus**: strength belongs to the creature, so a 2e ogre
   (18/00) hits 1d10+6 with its fists too, though the MM lists "1-10" bare and "+6" with a weapon.
3. **"No bonus" plays strength 15** (skeleton warrior, juju zombie, monster skeleton): the engine
   needs a score, and 2e's 8-15 all give +0/+0. Grab, hug, bend bars and carrying checks don't
   matter for monsters; 15 because most monsters fight like fighters. The juju zombie: 20 -> 15,
   3d4 as in the MM.
4. **In 2e, strength only comes from 2e**: a creature plays its `strength2e` or no bonus (15), an
   adjustment its own `strength2e` or the creature's. Every known 2e strength is recorded, so any
   other `strength` is a 3e/5e or hand-chosen value (game-file adjustments such as the GNARL
   ogrillons' 18/95 included).
