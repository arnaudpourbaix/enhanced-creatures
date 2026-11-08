# Experience rules

How the mod decides the XP a creature is worth. Code: `lib/src/services/experience/`
(`experience.service.ts` decides each file, `experience-detection.ts` finds the abilities,
`experience-table.ts` scores them). Every rule below marked _(user)_ is a ruling beyond the DMG.
The dashboard's Experience tab shows every decision with its breakdown.

## What a file is worth

Each creature file (one row per game when the games disagree on its in-game XP) gets one status:

| Status  | When                                                   | XP written                       |
| ------- | ------------------------------------------------------ | -------------------------------- |
| zero    | a summon, an adjustment with `xpv: 0`, or 0 XP in game | 0                                |
| book    | a base file (no adjustment), with `experience2e` on    | the creature's book XP (`xpv2e`) |
| as base | the adjustment changes nothing the formula reads       | the base creature's XP           |
| formula | an adjustment, or a base file with `experience2e` off  | the formula score                |
| drop    | the score is below the in-game XP                      | the in-game XP (kept)            |

Rules:

- **Never below the in-game XP** _(user)_: a formula or "as base" score below the file's in-game
  XP keeps the in-game value (a drop, listed for review on the dashboard).
- **Adjustments never set their own XP** except `xpv: 0` (worth nothing): the generator refuses
  any other value (`checkAdjustmentXp`).
- **Base creatures keep their book XP** in `xpv2e` (the Monstrous Manual value). The switch
  `PLAYER_CONFIG.experience2e` picks what they play: `true` (default) the book XP, `false` the
  formula, like adjustments. The Base XP conflicts compare the formula with the book XP either way.

## The formula (2e DMG Tables 31 and 32)

XP = Table 31 (Hit Dice value + the Table 32 modifiers of the creature's abilities).

### Hit Dice value

The Hit Dice, plus one when they have a plus (bonus hit points) and are below 10: 4+1 HD is 5,
10+ HD is 10.

### Table 31

| Value   | XP  | Value | XP                               |
| ------- | --- | ----- | -------------------------------- |
| below 1 | 7   | 7     | 420                              |
| 1       | 15  | 8     | 650                              |
| 2       | 35  | 9     | 975                              |
| 3       | 65  | 10    | 1,400                            |
| 4       | 120 | 11    | 2,000                            |
| 5       | 175 | 12    | **2,500** _(user)_               |
| 6       | 270 | 13+   | 3,000 + 1,000 per point above 13 |

The DMG's "11 to 12+: 2,000" row is smoothed _(user)_: 12 is halfway to 13, so a stronger
creature on the plateau is worth more (a cave bear's 12 against a brown bear's 11).

### Table 32 modifiers

Each ability counts once, whatever number of sources it has.

| Ability                                    | Mod               | Detected from                                                                                                                                                                                              |
| ------------------------------------------ | ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC 0 or lower                              | +1                | effective AC                                                                                                                                                                                               |
| 4+ attacks a round                         | +1                | attacks per round (half-attack codes decoded; a 2.5 round counts 3)                                                                                                                                        |
| High intelligence                          | +1                | Intelligence 13+                                                                                                                                                                                           |
| Extra hit points                           | +1                | special or per-Hit-Die bonus hit points                                                                                                                                                                    |
| Regeneration                               | +1                | a regeneration effect                                                                                                                                                                                      |
| Hit only by magical weapons                | +1                | a magical-weapons-only immunity                                                                                                                                                                            |
| Weapon immunity                            | +1                | any weapon immunity or any physical damage resistance, even 25% _(user)_, counted once                                                                                                                     |
| Spell immunity                             | +1                | spell immunities, including the nested ones of an undead trait _(user)_ (not hover's)                                                                                                                      |
| Magic resistance 50%+                      | +2                | resistMagic or a magic resistance effect, or a full magic immunity _(user tier)_                                                                                                                           |
| Magic resistance 20-49%                    | +1                | same _(user tier)_; under 20% counts nothing                                                                                                                                                               |
| Flies                                      | +1                | the `hover` trait, or a tagged at-will Fly (ogre mage) _(user)_                                                                                                                                            |
| Missile weapons                            | +1                | a wielded ranged weapon (bow, crossbow, sling, dart, quiver item), not `attack.ranged` _(user)_                                                                                                            |
| Invisible at will                          | +1                | invisibility memorized at will, or an own power making the caster invisible                                                                                                                                |
| Spells                                     | +1 / +2 / +3 / +4 | highest spell level 1-2 / 3-4 / 5-6 / 7-9 _(user tiers)_, only the top tier                                                                                                                                |
| Single attack over 20                      | +2                | one hit's maximum damage 20+                                                                                                                                                                               |
| Multiple attacks over 30                   | +2                | a round's maximum damage 30+                                                                                                                                                                               |
| Breath weapon                              | +2                | a tagged power                                                                                                                                                                                             |
| Paralysis                                  | +2                | paralyze or hold effects                                                                                                                                                                                   |
| Weakness or fear                           | +2                | panic, or a strength-lowering effect                                                                                                                                                                       |
| Causes disease                             | +1                | disease effects                                                                                                                                                                                            |
| Energy drain                               | +3                | level drain                                                                                                                                                                                                |
| Petrification                              | +3                | petrification                                                                                                                                                                                              |
| Poison                                     | +3 / +2 / +1      | fatal (E, F, J, N) / strong (D, I) / weak (A, B, C, G, H, K, L, M, R, S) _(user tiers)_; O, Q = paralysis, P = weakness; only the strongest                                                                |
| Special defense                            | +1                | an own protection power, or a tagged one (forms, splits, astral shift)                                                                                                                                     |
| Special magical attack                     | +2                | an own killing or summoning power, or a tagged one                                                                                                                                                         |
| Special attack                             | +1                | an own damaging, disabling, buff or grab power; any harmful on-hit effect without its own row (stun, sleep, slow, blind, confusion, charm, silence, web, entangle, maze, imprisonment, polymorph, slay...) |
| Blood drain, swallows whole, magical items | +1 / +2 / +1      | only declared (`xpAbilities`) or tagged                                                                                                                                                                    |
| Slow movement                              | -1                | PnP movement 9 or less _(user)_                                                                                                                                                                            |
| Fast movement                              | +1                | PnP movement 15 or more _(user)_                                                                                                                                                                           |

Movement counts only for a creature that walks into melee _(user)_: never for a flier (its speed
is the flight's, already "flies") or a missile wielder. Spells and breath weapons don't exempt a
creature: vampires, hell hounds and golems still kill up close.

### Damage rows

- The **maximum** damage, not the average _(user)_.
- A round: each weapon once, strongest first; extra attacks repeat the weakest one. The off-hand
  weapon's attack (engine-added) is counted.
- A melee hit adds the creature's strength damage bonus, as the engine does. The strength is the
  one that plays (see `PLAYER_CONFIG.strengthEdition`): in 2e mode, a creature without a 2e
  strength hits for its dice alone.
- On-hit damage adds to the weapon's maximum: damage effects on the weapon (a flaming sword, ooze
  acid) and damage of spells the hit casts (ankheg enzymes, bear hug). That's extra damage, not a
  special attack.
- A diceless weapon that deals no damage (mist form) is no attack.

### Own powers and spells

- A power counts by what it is: listed effects (paralysis, poison...) give their rows; a power
  already giving a listed row isn't also a special attack (a web that holds is paralysis only).
- **Tags win**: `xpAbility` on a created spell counts as that ability only, as a whole (a breath,
  an aura with several outcomes); `xpAbility: null` counts nothing.
- **Power level**: a created innate spell needs a `worthLevel` (it's spell-like, and counts in
  the spell tiers at that level) or an explicit `xpAbility` (a body attack form). The generator
  refuses neither.
- A power typed as a wizard or priest spell counts only through its spell level.
- Spells and abilities gated on a memorized spell (HaveSpell) count only where it's memorized.
- Never a spell: class and kit abilities (SPCL), Dimension Door (SPWI402, Spell Revisions'
  SPWI128: a once-a-day teleport).
- Shared powers and items count for every member: entry, kin and member spells, and a
  `createFrom` copy's source items and traits.
- Powers detection can't see are declared on the creature (`xpAbilities`, e.g. the vampires'
  forms and attacks).

## Where the values live

| Value                | Where                                                        |
| -------------------- | ------------------------------------------------------------ |
| Book XP              | `xpv2e` on the base creature's data                          |
| A file worth nothing | `xpv: 0` on its adjustment, or a summon                      |
| Declared abilities   | `xpAbilities` on the creature's data                         |
| A power's ability    | `xpAbility` / `worthLevel` on the created spell              |
| The switch           | `PLAYER_CONFIG.experience2e` (`lib/config/player-config.ts`) |

## Threat system (opt-in, weights provisional)

A second way to score XP, from how hard a creature is to beat rather than from the DMG tables.
Full design: [the spec](../superpowers/specs/2026-11-07-threat-experience-design.md). Code:
`lib/src/services/experience/threat/`.

- **The setting**: `PLAYER_CONFIG.experienceSystem` is `"dmg"` (default, the formula above) or
  `"threat"`. Everything else is shared: statuses, "never below the in-game XP", zero files.
  `experience2e` still decides book XP against a computed score for base creatures.
- **The reference** (`reference.ts`): a fighter and an archer of the creature's own level.
  Fighter: 13 HP per level up to 9 then +3, Strength 18/50, two d8 swords, specialization,
  2.5 attacks a round (3 at 7, 3.5 at 13), enchantment +0 to +3, AC 10 down to -5 at 20, 2e
  warrior THAC0 and saves. Archer: Dexterity +2, two arrows a round, AC 4 better.
- **Two duels** (`combat-profile.ts`, `duel.ts`): the rounds the creature needs to drop the
  reference against the rounds the reference needs to drop it, once against the fighter and once
  against the archer. The threat T is their weighted geometric mean, melee^0.75 x ranged^0.25
  (user: a party mostly melees, and against 3 to 10 enemies an archer is rarely safe to kite; the
  ranged duel only discounts a slow melee brute), x 1.2 when invisible at will and x 1.1 per
  ability the creature declares. Only a monster slower than the archer (movement under 12) is
  kited; at equal speed it closes in.
- **XP** (`threat-xp.ts`) = Table 31 value x s x T^k, rounded to 10, never below the in-game XP.
- **The fit** (`threat-fit.ts`): s and k are fitted on the base creatures' book XP. Committed fit:
  s = 2.116, k = 0.25 (clamped at its lower limit), 107 samples. Total on those monsters: threat
  342,700 against book 342,665. Refit with `npm run fit-threat`
  (`scripts/fit-threat.ts`) after any change to the weights.
- **Where to read it**: the dashboard's Experience tab, XP proposals view, shows threat against
  book per creature.
- **Far from book, to review**: greater basilisk 3110 (book 7000), ghoul lord 790 (3000),
  ghast 350 (650), ghoul 70 (175).

The weights are provisional: tune them on the proposals view, then refit.
