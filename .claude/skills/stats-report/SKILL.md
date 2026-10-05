---
name: stats-report
description: Use when the user wants to compare creature hp / thac0 / apr between assets/creatures.csv (vanilla/mod CRE values) and what the generated documentation shows, e.g. to catch a creature the mod accidentally made much weaker or stronger. Produces assets/stats-report.html, grouped by monster, listing only relevant differences.
---

# Stats report (creatures.csv vs documentation)

## What it does

`scripts/report-stats.ts` builds every creature family (same pipeline as `check-monsters`, no
WeiDU/doc files written) and, for every file a valid creature documents, compares the
`hp` / `thac0` / `apr` columns of `assets/creatures.csv` with the values the documentation shows
for that file. Output: `assets/stats-report.html`.

Doc values come from `adjustmentService.getEffectiveForGame` - the same fold the adjustment and
variant cards use, so they already account for:

- adjustment / variant overrides of level, hp, thac0, apr, class, proficiencies, equipped weapon
- the fighter apr bonus (proficiency rank + level, `creatureService.getFighterAttackBonus`)
- the +1 off-hand attack when dual wielding, `doubleApr`
- the constitution hp bonus re-added for PC-classed creatures (display hp, not raw CRE hp)

A file with no adjustment gets the base creature card's values.

## Matching rules

- csv rows are matched by `file` (case-insensitive) and filtered by the creature's own file
  game scope (`CreatureFile.game`).
- A csv row with a `game` is compared against the doc as that game sees it (untagged adjustments
  plus that game's tagged ones).
- A game-less csv row whose file has game-tagged adjustments is compared once per tagged game.
- Documented files with no csv row (or empty hp/thac0/apr, e.g. the WHEELS `DW#*` creatures)
  are listed under "Not compared".

## Thresholds (constants at the top of the script)

| stat | flagged when | constant |
| --- | --- | --- |
| thac0 | `|doc - csv| > 3` | `THAC0_TOLERANCE` |
| apr | any difference | - |

The csv `apr` is the raw CRE byte; it is decoded through `AttackPerRoundTable`
(`lib/src/model/game-data/attack-per-round.ts`, non-`doubleApr` entries: 6 = 0.5, 7 = 1.5,
8 = 2.5, ...) before comparing.

hp is deliberately not a criterion (the mod reworks hp almost everywhere), but it is still shown.
A file appears in the report only if thac0 or apr is flagged. Each row shows level, hp, thac0
and apr as `csv → doc (difference)`, flagged cells highlighted; level and hp are context only.

The page (rendered by `scripts/lib/stats-report-html.ts`) is self-contained: monster sidebar,
summary tiles, collapsible per-monster tables with APR/THAC0 count chips, an APR/THAC0 filter
and a text filter on monster/file/name. Open it in a browser.

## Procedure

From the repo root:

```bash
npx ts-node scripts/report-stats.ts          # --assets <dir> to point elsewhere
```

Build logs go to `report-stats.log`. Then read `assets/stats-report.html` and summarize for the
user: the summary counts, the monsters with apr flags first (critical), then thac0.
Point out patterns (a whole family flagged identically usually means a deliberate design choice
in `lib/creatures/*.ts`; a single outlier file usually means a missing or wrong adjustment).

## Prerequisites

`creatures.csv` must carry the `hp`, `thac0`, `apr` columns (sourced from `assets/bg1.csv` /
`assets/bg2.csv` extractions, matched on `file` + `game`). If those extractions are refreshed,
re-merge the columns first.
