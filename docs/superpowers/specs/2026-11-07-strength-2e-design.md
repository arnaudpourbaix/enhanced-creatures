# 2e strength, kept next to the 3e/5e one

Status: design for review (2026-11-07). Data: [strength damage survey](../../research/strength-damage-survey.md).

## Goal

Most creature strength scores come from 3e/5e stat blocks; a few monsters have a strength (or an
explicit "no strength bonus") in their 2e entry. Record the 2e value next to today's, and let one
global setting pick which one plays, so both can be compared in game and on the XP dashboard
without losing either.

Out of scope here: what to do with creatures that have no 2e value (bears, cats, golems...). They
keep their 3e/5e strength in both modes. That decision comes after comparing.

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
   * through THAC0: an ogre chieftain +1 (MM +4, 18/00 gives +3), an ogre -1, a skeleton warrior +3
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
GLOBAL_CONFIG.strengthEdition: "3e+" | "2e" // default "3e+": nothing changes
```

- `"3e+"`: today's values everywhere. `strength2e` is only data (and documentation).
- `"2e"`: every creature, variant or adjustment with `strength2e` plays it:
  - `strength` and `exceptionalStrength` take the 2e score;
  - without a 2e score (no bonus), the strength becomes a neutral one with no to-hit or damage
    bonus (see open question 1);
  - `hit` lowers THAC0 by that much (the engine adds the strength to-hit on top of the CRE THAC0,
    see `getMeleeThac0`).

Untouched in both modes:

- creatures without `strength2e`;
- adjustments that set their own `strength` (game-file values such as the GNARL ogrillons'
  18/95): an explicit adjustment strength wins over the 2e one.

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
monster skeleton). The elder minotaur is already an adjustment setting 18/50 (the MM value): its
own strength wins in both modes, nothing to add.

## Tests

No creature test files: the resolution is tested in the service/factory with fixtures (each mode,
with and without `strength2e`, an adjustment's own strength winning, the no-bonus case, the THAC0
correction). With the default `"3e+"`, the golden test proves the generated mod is unchanged.

## Open questions

1. **Neutral strength for "no bonus"**: which score? 2e's 8–15 all give +0/+0; 15 keeps the most
   for everything else that reads strength (grabs, hugs, bend bars, carrying). Alternative: keep
   the score and cancel its bonus with an effect (more work, strength checks unchanged).
2. **Natural weapons of 2e creatures**: the MM ogre hits for "1-10" bare and "+6" only with a
   weapon, but its fists get the strength bonus in the engine. Keep that (consistent strength,
   the user's preference so far) or let a 2e creature's natural weapons follow its entry?
3. **Default**: stays `"3e+"` until the in-game comparison (roadmap step 5).
