# Strength damage survey

Data for a later decision on how creature strength adds to melee damage. Collected 2026-11-07
from the built creatures (`buildAllCreatures`) at commit `74283a0b`. Nothing here is decided:
see the open questions at the end and the roadmap item "Strength on natural attacks" in
[TODO_ROADMAP.md](../../TODO_ROADMAP.md).

## The problem

The engine adds the creature's strength damage bonus to every melee hit whose header has
`AddStrengthBonus`, and `addNaturalWeapon` sets it on every natural weapon
([creature.ts](../../lib/src/model/creature/creature.ts)). Three sources meet:

|                        | 2e                           | 5e                             | This mod                           |
| ---------------------- | ---------------------------- | ------------------------------ | ---------------------------------- |
| Natural dice           | big, the monster's whole hit | smaller, strength added on top | 2e dice                            |
| Strength score         | none for most monsters       | e.g. STR 20 for a polar bear   | 3e/5e scores                       |
| Damage bonus at STR 20 | —                            | +5                             | +8 (the engine reads the 2e table) |

So a creature gets 2e dice plus a 3e/5e strength score read through the steeper 2e table.

2e strength damage bonus (the engine's table): 16–17 +1, 18 +2, 18/01–50 +3, 18/51–75 +3,
18/76–90 +4, 18/91–99 +5, 18/00 +6, 19 +7, 20 +8, 21 +9, 22 +10, 23 +11, 24 +12.

Decisions and remarks so far (user):

- Strength should stay consistent: natural weapons not getting strength while manufactured ones
  do would be an inconsistency. The mod mixes 2e and 3e+ on purpose.
- 3.5e stats are absurd: **5e is the reference**, not 3.5e.
- In 3e/5e, bigger bears get bigger dice _and_ more strength: dice alone don't carry strength.
- Option on the table: bears with 2 attacks per round (5e's bite + claws) instead of 2e's
  claw/claw/bite.

## Bears in detail

Maximum damage of one round, hug and grab not counted (random). Paws are the main hand, jaws the
off-hand slot: the engine adds the off-hand attack, so a stored APR 2 plays 3 attacks.

### Actual (mod today): 2e dice, 3 attacks, 2e strength table

| Bear    | STR (bonus) | Claw   | Claw   | Bite   | Round max             |
| ------- | ----------- | ------ | ------ | ------ | --------------------- |
| Black   | 15 (+0)     | 1d3    | 1d3    | 1d6    | 3 + 3 + 6 = **12**    |
| Brown   | 19 (+7)     | 1d6+7  | 1d6+7  | 1d8+7  | 13 + 13 + 15 = **41** |
| Cave    | 20 (+8)     | 1d8+8  | 1d8+8  | 1d12+8 | 16 + 16 + 20 = **52** |
| Grizzly | 20 (+8)     | 1d12+8 | 1d12+8 | 2d6+8  | 20 + 20 + 20 = **60** |
| Polar   | 20 (+8)     | 1d10+8 | 1d10+8 | 2d6+8  | 18 + 18 + 20 = **56** |

### 5e (reference): 2 attacks, 5e modifier

5e has no separate grizzly or cave bear (brown and polar bear stats).

| Bear            | STR (modifier) | Bite  | Claws | Round max        |
| --------------- | -------------- | ----- | ----- | ---------------- |
| Black           | 15 (+2)        | 1d6+2 | 2d4+2 | 8 + 10 = **18**  |
| Brown (grizzly) | 19 (+4)        | 1d8+4 | 2d6+4 | 12 + 16 = **28** |
| Polar (cave)    | 20 (+5)        | 1d8+5 | 2d6+5 | 13 + 17 = **30** |

### Options

- **3 attacks, 5e dice split, converted strength:** claws = 5e claws dice split over the two
  claws (2d6 → 1d6 each), bite = 5e bite, strength score replaced by the 2e score giving the 5e
  bonus (STR 15 → 18 for +2, 19 → 18/76 for +4, 20 → 18/91 for +5).
- **A. 2 attacks, 5e dice, strength unchanged** (2e table).
- **B. 2 attacks, 5e dice, converted strength:** exactly 5e.
- **C. 2 attacks, current 2e dice (one claw + bite), strength unchanged.**

| Bear    | Actual | 3 attacks, 5e split | A   | B   | C   | 5e  |
| ------- | ------ | ------------------- | --- | --- | --- | --- |
| Black   | 12     | 20                  | 14  | 18  | 9   | 18  |
| Brown   | 41     | 32                  | 34  | 28  | 28  | 28  |
| Grizzly | 60     | 32                  | 36  | 28  | 40  | 28  |
| Cave    | 52     | 35                  | 36  | 30  | 36  | 30  |
| Polar   | 56     | 35                  | 36  | 30  | 38  | 30  |

Side effects to keep in mind:

- Converted strength shows 18/76, 18/91 on the sheet and lowers to-hit (+2 instead of +3).
- 5e merges grizzly into brown and cave into polar: distinct bears need their own dice.
- With 2 attacks, one paw attack per round: the hug (cast on a paw hit) triggers half as often.
- To verify in game: a 2-attack bear makes one main-hand (claws) and one off-hand (jaws) attack.
- XP damage rows stay mostly the same (polar bear B: 30, still "30+ per round").

## Every creature with 18+ strength

All 64 creature/file rows with STR 18 or more and a weapon this mod creates. Adjustments that set
their own strength or attacks get their own row ("base" = the creature's own data).

- **Attacks**: per round, the engine's off-hand attack included.
- **Round max**: the XP formula's model: each weapon once, strongest first, extra attacks repeat
  the weakest.
- **Not counted**: on-hit extras (hug, enzymes, poison) and game weapons equipped from the
  original CRE, such as an ogre's own club.
- **Kind**: natural (no item category), weapon (manufactured, †) or mixed.
- **Strength share**: what strength adds to the dice-only round.

| Creature           | Files                                                                | STR    | Bonus | Attacks | Kind    | Weapons            | Dice only | With STR | Strength share |
| ------------------ | -------------------------------------------------------------------- | ------ | ----- | ------- | ------- | ------------------ | --------- | -------- | -------------- |
| VampireAbomination | base                                                                 | 24     | +12   | 3       | natural | 1d6, 1d6, 1d6      | 18        | 54       | +200%          |
| VampireAbomination | PPBODHI4                                                             | 22     | +10   | 3       | natural | 1d6, 1d6, 1d6      | 18        | 48       | +167%          |
| GreaterWyvern      | base                                                                 | 21     | +9    | 2       | natural | 1d6                | 12        | 30       | +150%          |
| VampireAbomination | PPBODHI3                                                             | 21     | +9    | 3       | natural | 1d6, 1d6, 1d6      | 18        | 45       | +150%          |
| VampireAbomination | OHB3BODH                                                             | 21     | +9    | 3       | natural | 1d6, 1d6, 1d6      | 18        | 45       | +150%          |
| VampirePatriarch   | base                                                                 | 21     | +9    | 1       | natural | 1d6                | 6         | 15       | +150%          |
| VampireEminent     | base                                                                 | 20     | +8    | 1       | natural | 1d6                | 6         | 14       | +133%          |
| VampireEminent     | NEVM4                                                                | 20     | +8    | 3       | natural | 1d6                | 18        | 42       | +133%          |
| Ghast              | AC#DT01L, LACEDO02                                                   | 19     | +7    | 3       | natural | 1d4, 1d8           | 16        | 37       | +131%          |
| VampireAncient     | base                                                                 | 19     | +7    | 1       | natural | 1d6                | 6         | 13       | +117%          |
| Ghast              | GRON, GMAYOR, THESHAL, GHASTGSU, WICULT1                             | 18/100 | +6    | 3       | natural | 1d4, 1d8           | 16        | 34       | +112%          |
| BrownBear          | base                                                                 | 19     | +7    | 3       | natural | 1d6, 1d8           | 20        | 41       | +105%          |
| VampireOld         | base                                                                 | 18/100 | +6    | 1       | natural | 1d6                | 6         | 12       | +100%          |
| VampireVeryOld     | base                                                                 | 18/100 | +6    | 1       | natural | 1d6                | 6         | 12       | +100%          |
| Hellcat            | base                                                                 | 21     | +9    | 3       | natural | 2d4, 2d6           | 28        | 55       | +96%           |
| DisplacerBeast     | BDDISPBP                                                             | 19     | +7    | 2       | natural | 2d4                | 16        | 30       | +88%           |
| CaveBear           | base                                                                 | 20     | +8    | 3       | natural | 1d8, 1d12          | 28        | 52       | +86%           |
| GreaterBasilisk    | base                                                                 | 20     | +8    | 3       | natural | 1d6, 2d8           | 28        | 52       | +86%           |
| Ogrillon           | GNARL, HAIRTO                                                        | 18/95  | +5    | 2       | natural | 1d6                | 12        | 22       | +83%           |
| VampireMature      | base                                                                 | 18/91  | +5    | 1       | natural | 1d6                | 6         | 11       | +83%           |
| HalfOgre           | ARGHAI                                                               | 18/100 | +6    | 1       | natural | 2d4                | 8         | 14       | +75%           |
| PolarBear          | base                                                                 | 20     | +8    | 3       | natural | 1d10, 2d6          | 32        | 56       | +75%           |
| GrizzlyBear        | base                                                                 | 20     | +8    | 3       | natural | 1d12, 2d6          | 36        | 60       | +67%           |
| VampireFledgling   | base                                                                 | 18/76  | +4    | 1       | natural | 1d6                | 6         | 10       | +67%           |
| ZombieJuju         | base                                                                 | 20     | +8    | 1       | natural | 3d4                | 12        | 20       | +67%           |
| ZombieJuju         | L#RVZDOE                                                             | 20     | +8    | 2       | natural | 3d4                | 24        | 40       | +67%           |
| ZombieJuju         | ESXSERM                                                              | 20     | +8    | 3       | natural | 3d4                | 36        | 60       | +67%           |
| Ogre               | CBELHOE                                                              | 19     | +7    | 2       | natural | 1d10, 2d6          | 22        | 36       | +64%           |
| Wyvern             | base                                                                 | 19     | +7    | 2       | natural | 1d6, 2d8           | 22        | 36       | +64%           |
| Ogre               | base                                                                 | 19     | +7    | 1       | natural | 1d10, 2d6          | 12        | 19       | +58%           |
| OgreMage           | KAHRK                                                                | 19/100 | +7    | 1       | weapon  | 1d12†              | 12        | 19       | +58%           |
| Ettin              | base                                                                 | 21     | +9    | 2       | weapon  | 3d6†, 2d8†         | 34        | 52       | +53%           |
| Treant             | base                                                                 | 23     | +11   | 2       | natural | 4d6, 3d6, 2d8, 2d6 | 42        | 64       | +52%           |
| HalfOgre           | BDOGRE04                                                             | 18/83  | +4    | 1       | natural | 2d4                | 8         | 12       | +50%           |
| Mummy              | BDMUMMY                                                              | 18/100 | +6    | 1       | natural | 1d12               | 12        | 18       | +50%           |
| OgreMage           | base                                                                 | 18/100 | +6    | 1       | weapon  | 1d12†              | 12        | 18       | +50%           |
| FleshGolem         | base                                                                 | 19     | +7    | 2       | natural | 2d8                | 32        | 46       | +44%           |
| GreaterMummy       | OHHKUNG                                                              | 20     | +8    | 1       | natural | 3d6                | 18        | 26       | +44%           |
| OgreBerserker      | BDOGREDS, D9OGRGA2, X3HOGREC, BDOGRE06, BDARBING, BDCHESKI, BDWAVE13 | 19     | +7    | 1       | weapon  | 2d8†               | 16        | 23       | +44%           |
| Treant             | JACM1902, BDTREANT, WITREANT                                         | 21     | +9    | 2       | natural | 4d6, 3d6, 2d8, 2d6 | 42        | 60       | +43%           |
| StoneGolem         | base                                                                 | 22     | +10   | 1       | natural | 3d8                | 24        | 34       | +42%           |
| Shadow             | BDSHAD02, L#GNOAL, L#GNOEN                                           | 18     | +2    | 1       | natural | 1d4+1, 1d4+1       | 5         | 7        | +40%           |
| Ghast              | AC#DTLAC, LACEDO01, SAHLACE                                          | 18     | +2    | 3       | natural | 1d4, 1d8           | 16        | 22       | +38%           |
| HalfOgre           | GORF                                                                 | 18/50  | +3    | 1       | natural | 2d4                | 8         | 11       | +38%           |
| OgreBerserker      | base                                                                 | 18/100 | +6    | 1       | weapon  | 2d8†               | 16        | 22       | +38%           |
| Treant             | JACM1901                                                             | 20     | +8    | 2       | natural | 4d6, 3d6, 2d8, 2d6 | 42        | 58       | +38%           |
| Treant             | JACM1900                                                             | 19     | +7    | 2       | natural | 4d6, 3d6, 2d8, 2d6 | 42        | 56       | +33%           |
| WaxGolem           | base                                                                 | 18/90  | +4    | 1       | natural | 2d6                | 12        | 16       | +33%           |
| AdamantiteGolem    | base                                                                 | 24     | +12   | 1       | natural | 4d10               | 40        | 52       | +30%           |
| IronGolem          | base                                                                 | 24     | +12   | 1       | natural | 4d10               | 40        | 52       | +30%           |
| SnowGolem          | base                                                                 | 19     | +7    | 2       | natural | 2d12               | 48        | 62       | +29%           |
| ClayGolem          | base                                                                 | 20     | +8    | 1       | natural | 3d10               | 30        | 38       | +27%           |
| GhoulLord          | base                                                                 | 18     | +2    | 3       | natural | 1d6, 1d10          | 22        | 28       | +27%           |
| DireWolf           | A#FERA04                                                             | 18     | +2    | 1       | natural | 2d4                | 8         | 10       | +25%           |
| DisplacerBeast     | base                                                                 | 18     | +2    | 2       | natural | 2d4                | 16        | 20       | +25%           |
| DisplacerBeast     | JY_00DB                                                              | 18     | +2    | 4       | natural | 2d4                | 32        | 40       | +25%           |
| HalfOgre           | TAZOK, D9TAZOK, D9TAZOKX                                             | 18     | +2    | 1       | natural | 2d4                | 8         | 10       | +25%           |
| WinterWolf         | base                                                                 | 18     | +2    | 1       | natural | 2d4                | 8         | 10       | +25%           |
| SpottedLion        | base                                                                 | 18     | +2    | 3       | natural | 2d4, 1d12, 2d4     | 28        | 34       | +21%           |
| DreadWolf          | base                                                                 | 18     | +2    | 1       | natural | 1d10               | 10        | 12       | +20%           |
| JuggernautGolem    | base                                                                 | 22     | +10   | 2       | natural | 10d10, 2d6         | 112       | 132      | +18%           |
| GargantuanSpider   | base                                                                 | 18     | +2    | 1       | natural | 2d6                | 12        | 14       | +17%           |
| Minotaur           | base                                                                 | 18     | +2    | 2       | mixed   | 1d10+2†, 4d4       | 28        | 32       | +14%           |
| Minotaur           | OHBMIN01, OHBMINSU, OHNGHALL, HLMAFER, GAROCK, ROCK                  | 18     | +2    | 1       | mixed   | 1d10+2†, 4d4       | 16        | 18       | +12%           |

## Observations

- The problem is 2e's steep top end (+6 at 18/00, +7 at 19, +8 at 20, up to +12 at 24) on small
  natural dice. At STR 18 (+2) the change is small, whatever the dice.
- Hit hardest (strength doubles the round or more): vampires (1d6 bite), the greater wyvern (one
  1d6), ghasts, brown bear. Then the cats, cave and polar bears, greater basilisk, juju zombie.
- Golems and treants barely move: big dice, even +10 to +12 adds only 30–50%.
- Some 2e monsters do list a strength (from memory of the Monstrous Manual, to check): vampires
  hit for 1d6+4 (the fledgling's 18/76), ogres get +6 with a weapon (18/00). For them strength
  on top of the dice is the PnP rule. Older vampires go further because their strength keeps
  rising (up to 24, +12).
- The juju zombie's 3d4 fists depend on strength: without it, it can't reach 20 damage a hit.

## Open questions

1. Reference per creature: 5e (decided for bears so far) everywhere, or 2e where 2e lists a
   strength (vampires, ogres)?
2. Strength scale: keep the 2e-table scores, or convert 3e/5e scores to the 2e score giving the
   same bonus (20 → 18/91)?
3. Attack count: keep 2e attack counts, or follow 5e (bears: 2 attacks)?
4. XP: the formula counts strength today; it should follow whatever the game does.

## 2e strengths found (reviewed with the user, 2026-11-07)

Sources: the 2e Monstrous Manual text (AD&D Core Rules 2.0 Expansion CD, mirrored on
discmaster.textfiles.com, `webhelp/mm`), the Ravenloft vampire age table (quoted on the Beamdog
forum), and the user's rulings. Everything not listed has no 2e strength found and keeps its
3e/5e value.

| Creature            | 2e strength                                                                   | To-hit correction                 | Source                                                        |
| ------------------- | ----------------------------------------------------------------------------- | --------------------------------- | ------------------------------------------------------------- |
| Ogre                | 18/00                                                                         | −1 (MM +2 to hit, 18/00 gives +3) | MM: "1-10 (or by weapon +6)", "Strength bonus of +2 to hit"   |
| Ogre leader         | 18/00                                                                         | —                                 | MM: "+6 with weapon", +3 to hit                               |
| Ogre chieftain      | 18/00                                                                         | +1 (MM +4 to hit)                 | MM: "+6 with weapon", +4 to hit                               |
| Ogre shaman         | 18/00                                                                         | −1                                | user: just an ogre                                            |
| Ogre berserker      | 18/00                                                                         | +1                                | user: not in the MM, as a chieftain                           |
| Half-ogre           | 18                                                                            | —                                 | MM: "an additional 2 points of damage, due to his mass"       |
| Ogrillon            | 17                                                                            | —                                 | MM: punch 1d6+1 (16 also fits; user: 17 for its size)         |
| Ogre mage           | 18/00                                                                         | —                                 | inferred (user): MM says taller than ogres                    |
| Minotaur            | 18                                                                            | —                                 | MM: "equivalent human Strength of 18", weapon "+2"            |
| Elder minotaur      | 18/50                                                                         | —                                 | MM: "elder minotaur with 18/50 Strength"                      |
| Vampire (fledgling) | 18/76                                                                         | —                                 | MM: "18/76, receiving a bonus of +2 to hit and +4 to damage"  |
| Vampire ages        | mature 18/91, old 18/00, very old 18/00, ancient 19, eminent 20, patriarch 21 | —                                 | Ravenloft age table (forum quote); the mod already matches it |
| Death knight        | 18/00                                                                         | —                                 | MM: "A death knight has a strength of 18(00)"                 |
| Skeleton warrior    | no damage bonus                                                               | — (its +3 is in its trait)        | MM: "By weapon (+3 to attack roll)", "an innate ability"      |
| Juju zombie         | no damage bonus                                                               | —                                 | MM: damage "3-12" (3d4), no strength                          |
| Monster skeleton    | no damage bonus                                                               | —                                 | MM: giant weapons "without any Strength bonuses"              |

Not in the Monstrous Manual, no 2e value found: wax golem (Ravenloft), helmed horror, battle
horror, Doom Guard, Doom Sayer, vampire abomination (the mod's own boss).

Mod values that differ from 2e today: ogre 19 (leader and chieftain inherit it), ogre shaman 18,
berserker chieftain variant 19, half-ogre 17, skeleton warrior 18/40, juju zombie 20, monster
skeleton 17.
