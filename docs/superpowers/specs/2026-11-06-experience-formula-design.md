# Experience from the 2e DMG formula — design

## Why

Adjustments (the per-file overrides in `lib/creatures/**`, `adjust` entries and variants) carry
`xpv` values with no consistent basis (some hand-picked, some copied from the original game
file such as Bodhi's 91000), and adjustments without `xpv` silently inherit the base creature's XP
even when they are many Hit Dice stronger. The goal is a principled, automated XP for every
adjustment, using the AD&D 2e DMG rule, and a dashboard view to see what changes.

## Goals

- Compute XP for every adjustment automatically from the AD&D 2e DMG rule (Tables 31 + 32 below).
- Remove the hand-picked `xpv` values from adjustments; the formula drives them.
- Base creatures keep their explicit Monstrous Manual `xpv`, but the formula also runs on them and
  every disagreement is listed (Base XP conflicts) so they can be reviewed one by one.
- A new **Experience** tab in the existing dashboard (`npm run dashboard`, `scripts/dashboard.ts`,
  `scripts/lib/dashboard-html.ts`).

## Non-goals / anti-goals

- No per-creature hand-declared ability lists as the main mechanism — detection must be automated.
  (A small optional declaration exists only for what cannot be detected; see below.)
- Not the 1e system (no XP per hit point).
- Never change zero-XP files: summons, files deliberately set to `xpv = 0` (e.g. the
  `applyCsvSummonFiles` patch in `creature-group.ts`) and files worth 0 in game stay 0.
- Base creature `xpv` values are not changed by this work; conflicts are only reported.
- Never lower a file's in-game XP in this work (see `drop`); the boss rule is a later decision.
- Not decided here: how bosses are defined/handled automatically.

## The rule (user-supplied, authoritative)

**Table 31 — Creature XP values.** Look up the final Hit Dice value:

| Hit Dice or Level | XP Value |
|---|---|
| Less than 1-1 | 7 |
| 1-1 to 1 | 15 |
| 1+1 to 2 | 35 |
| 2+1 to 3 | 65 |
| 3+1 to 4 | 120 |
| 4+1 to 5 | 175 |
| 5+1 to 6 | 270 |
| 6+1 to 7 | 420 |
| 7+1 to 8 | 650 |
| 8+1 to 9 | 975 |
| 9+1 to 10+ | 1,400 |
| 11 to 12+ | 2,000 |
| 13+ | 3,000 + 1,000 per additional Hit Die over 13 |

Reading: whole HD `n` falls in the row ending in `n`; `n+x` (x > 0) moves to the next row, i.e.
counts as `n + 1`. So 4 HD → 120, 4+1 → 175. Rows "9+1 to 10+" and "11 to 12+" mean 10+x still
gives 1,400 and 12+x still gives 2,000; 13 → 3,000, 14 → 4,000, etc. (13+x counts as 13.)

**Table 32 — Hit Dice value modifiers.** Each ability the creature has adds its modifier to the
HD value before the Table 31 lookup:

| Ability | HD modifier |
|---|---|
| Armor Class 0 or lower | 1 |
| Blood drain | 1 |
| Breath weapon | 2 |
| Causes disease | 1 |
| Energy drain | 3 |
| Flies | 1 |
| Four or more attacks a round | 1 |
| Greater than normal hit points | 1 |
| High Intelligence | 1 |
| Hit only by magical/silver weapons | 1 |
| Immunity to any spell | 1 |
| Immunity to any weapon, including ½ damage | 1 |
| Invisible at will | 1 |
| Level 2 or lower spells | 1 |
| Level 3 or greater spells (not cumulative with previous) | 2 |
| Magic resistance | 2 |
| Missile weapons | 1 |
| Multiple attacks causing 30+ points of damage | 2 |
| Paralysis | 2 |
| Petrification | 3 |
| Poison | 2 |
| Possesses magical items usable against PCs | 1 |
| Regeneration | 1 |
| Single attack causing 20+ points of damage | 2 |
| Special defense form, unlisted | 1 |
| Special magical attack form, unlisted | 2 |
| Special non-magical attack form, unlisted | 1 |
| Swallows whole | 2 |
| Weakness or fear | 2 |

Each ability counts once regardless of how many sources grant it. Spells: highest spell level
decides between +1 and +2, never both.

**Worked check:** ogre is 4+1 HD → row 5, +1 modifier → 6 → 270, matching its Monstrous Manual
value in `lib/creatures/ogre/ogre.ts`.

## Design

### Where XP is computed

A new service (e.g. `lib/src/services/experience.service.ts`) computes, for any creature data
state (base creature, or a file's effective adjustment):

- `hitDice`: whole HD plus whether there is a "+" — from the PnP Hit Dice (`level1.pnpValue`) and
  `bonusHp > 0` for the "+". For adjustments, the effective level from
  `adjustmentService`'s `EffectiveAdjustment` (per file, per game scope).
- `modifiers`: the list of detected Table 32 abilities, each `{ ability, value, source }` where
  `source` is a short human reason (e.g. "AC -2", "SPWI304 Fireball", "weapon poison effect").
- `total` HD value and resulting `xp`.

The breakdown is a first-class output: the dashboard prints it, and it is how detection gets
debugged.

### Detection (automated)

Every Table 32 row should be detected from data the generator already holds wherever possible —
effective stats (`ac`, `apr`, `resistMagic`, `immunities`, resist fields, `hp` vs normal for its
HD), spells/abilities (levels are known on abilities and in `assets/spells/*.csv`), effects (e.g.
opcode 98 regeneration), equipped items and their on-hit effects (poison, paralysis, level drain,
petrification, disease, fear/weakness), movement/flying flags, attack damage, Intelligence, and
missile weapons. Adjustments inherit everything the base creature has unless the adjustment
removes it (they are folded through the same effective-data path).

Rows that cannot be detected reliably get an optional declaration on the creature (shared by all its
adjustments and variants, overridable per adjustment). Expected candidates: flies (if no data
signal), "special defense / magical / non-magical attack form, unlisted", swallows whole.

### Applying it

Every file gets exactly one **status**, which decides its XP and is shown (and filterable) on the
dashboard:

| Status | When | XP written |
|---|---|---|
| `zero` | summon (CSV summon files, explicit `xpv: 0`) **or** in-game XP is 0 in `creatures.csv` (e.g. Black Pits `OHBVMP01-03`, `BPOGRE01`) | 0 — untouched |
| `book` | base creature (no adjustment for the file) | the creature's explicit Monstrous Manual `xpv`, as today |
| `unchanged` | adjusted, but the adjustment changes nothing the formula reads (e.g. script/items only, like skeleton `SKELPETR`) | the base creature's book XP, as an unadjusted copy would get |
| `formula` | adjusted, changes something the formula reads (HD, AC, apr, spells, detected ability…), and formula ≥ in-game XP | formula value |
| `drop` | would be `formula`, but formula < current in-game XP (`creatures.csv`) | **in-game XP kept** — not applied |

- Explicit `xpv` values in adjustment and variant data are removed from `lib/creatures/**`;
  variants count as adjustments. (Removing `L#HAUSK`'s `xpv: 3000` is covered by `zero`: it is 0
  in game.)
- `drop` is the interim, safe handling of bosses/story creatures (Bodhi `C6BODHI` 91000,
  `FINBODH`, `OHB3BODH`, zombie `ESXSERM` 2250 copy original game values). The user reviews the
  drop list on the dashboard and **decides later** on an automated rule for them; there is no
  boss definition and no per-file marker in this work. The end state must be fully automated.
- Per-game effectives (bg1 / bg2 scopes) each get their own value and status.

### Dashboard — Experience tab

Added alongside Overview / Stats report / Missing in `scripts/lib/dashboard-html.ts`, following
the existing table style (sortable `table.counts`, filter box, light/dark):

1. **All files** — one row per creature file (per game scope where they differ): monster, file,
   status (filterable, with its reason, e.g. "script only"), in-game XP (from
   `assets/creatures.csv` `xpv` column — read only), new XP, difference, and the formula
   breakdown (e.g. `8+2 HD → 9, +1 AC 0, +2 poison, +2 level 3+ spells = 14 → 4,000`), shown for
   every non-`zero` file even when the formula is not applied. `zero` files are greyed, without a
   difference.
2. **XP drops to review** — every `drop` file: monster, file, in-game XP, formula XP, breakdown.
   This is the material for the later boss decision.
3. **Base XP conflicts** — every base creature whose explicit Monstrous Manual `xpv` differs from
   the formula: monster, book XP, formula XP, breakdown. Used to review detection gaps or wrong
   book values one at a time.

Overview gets a headline count (files changed, drops, conflicts), like the stats report.

## Constraints

- `assets/creatures.csv` is read only (source of truth, never edited).
- No `lib/creatures/<creature>.test.ts` files; test the service generically, verify creatures via
  generated output and the dashboard.
- Output changes are expected (adjusted files' XP), so the golden test will need re-approval;
  review the diff via the dashboard table.
- Documentation already shows an XP change on adjustment cards (`adjustment.service.ts`
  `effective.xpv`); it should now show the computed value.

## Left to the builder

- Exact detection signal per Table 32 row, and which rows need the optional declaration.
- What counts as "greater than normal hit points" (suggested: effective HP above the PnP maximum
  for its HD, or `bonusHpPerHitDie` / `specialBonusHp` present) and "high Intelligence"
  (suggested: Intelligence ≥ 13, the MM "High" band).
- Damage thresholds ("single attack 20+", "multiple attacks 30+") from max weapon damage × apr.
- Service/API shape and naming.
