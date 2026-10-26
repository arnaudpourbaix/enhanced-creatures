# Bodhi as an "Abomination" vampire: design

Date: 2026-10-26. Background, raw data and the reasoning behind each decision
are in [BODHI.md](../../../BODHI.md) at the repo root. This document is what
gets built.

## Intent

Bodhi is BG2's main vampire boss. Today she's handled as one more Patriarch
vampire file, which goes wrong in three ways:

- Her 13 CRE files (one per encounter, plus mod copies) disagree with each
  other (STR 20–24, HP 85–200, drain 2–5 levels, regeneration on some and not
  others), and the Patriarch template sits *below* most of them, so our
  patch weakens her.
- Her own SCS-generated scripts stay in higher-priority slots than ours, so
  in a fight she mostly runs her own AI and our script barely gets in.
- Our patch breaks a game mechanic: the Elven Holy Water poured in her lair's
  blood pool is supposed to take away her regeneration, but it destroys a
  VAMPREG2 ring that we've already removed.

The goal is a single, coherent Bodhi: a dedicated vampire age above Patriarch,
with per-encounter values that follow the story, her signature powers cast by
our generated script, and her own scripts reduced to the story.

## Goals

1. A new vampire age, **Abomination**, above Patriarch, used by Bodhi only.
2. Per-encounter stats that **never weaken her** compared with the original
   CRE files (see rule below).
3. Her signature SCS powers become Abomination abilities in our generated
   script.
4. Her own scripts keep only their story blocks.
5. The holy-water mechanic works again, and takes her down to her innate
   regeneration.

## Non-goals

- Other vampires above Patriarch (Black Pits 2's OHB3VMP*, the D9 memory
  vampires, Tanova…). Abomination is Bodhi only for now; they may join later.
- Making her stronger in ToB than in Ch6 (she died in her lair; SCS doesn't
  either).
- A "remove Protection from Undead scrolls" tweak. It's a possible future
  component, outside this work.
- Re-balancing which powers each encounter gets. That stays as in the
  originals for now.
- X#BODHI (BGEE, BG1 NPC mod, Bodhi as "Arel") isn't part of Abomination.

## Anti-goals (a failure even if it technically works)

- **Any value below what the original CRE has for that encounter.** The
  "never weaken a boss" rule is never broken.
- A story beat that no longer fires: her dialogues at low HP, the mist form
  on death and the coffin, the Spellhold hunt, the Ascension ending.
- Bodhi killed for good before the story allows it (the MINHP items must
  stay).
- Holy water that does nothing: pouring Elven Holy Water into her lair's
  pool (AR0809) must still weaken C6BODHI. Her regeneration goes 24 → 12,
  and she gets the permanent Slow, STR −2 and 20 acid damage. With our
  current patch, the regeneration part silently does nothing.

## Rules

- **Never weaken.** For each stat of each encounter, the value is the best of
  (a) the Patriarch template, (b) that encounter's own original CRE files and
  (c) the previous encounter, except where the story weakens her on purpose.
  There, (c) doesn't apply, but (a) and (b) always do. Spellhold is the one
  such case: she must hunt the party without winning, so she's level 14
  there. In Ch2 she must not be defeated, so she's at full strength.
- **Derived values are not set by hand:** HP comes from our formula
  (level × 12, `hit-point.service.ts`), THAC0 from level.
- **Level cap 25** (`VAMPIRE_MAX_LEVEL`).

## The Abomination age

A seventh entry in `VAMPIRE_AGES` (`lib/creatures/vampire.ts`), after
Patriarch, with its own `MonsterEnum` value (`VampireAbomination`) and its
own translation key for the age name (`monster.vampire.name.abomination`,
"Abomination"). The new key shifts `.tra` numbering mod-wide. That's accepted.

Its base values are her **Ch2–3** values (the lowest full-strength tier):

| Field | Value |
|---|---|
| level1 | 25 (HP 300 from the formula) |
| STR / DEX | 24 / 24 |
| INT / CHA | 20 / 19 (template; her files have 15 / 14, the template is higher) |
| AC | final −10: her files' natural −4 plus DEX 24 (the generator's `ac` is final) |
| APR | 3 |
| Magic resistance | 75 |
| Physical resistance (slash/crush/pierce/missile) | 25 |
| Cold / electricity resistance | 100 |
| Magic damage resistance | 50 |
| Immunities | Death (opcode 13), see invisible, turn undead (as in the current WIP adjustment) |
| Weapon immunity | +3 (template) |
| Regeneration | 12 HP/round innate (the age's `regeneration`, in the traits item; Patriarch has 5). Her Ch2–3 files already have 12 |
| Claws | drain 3 levels |
| Domination | Will, save bonus −6 (Patriarch −5) |
| Movement | 27 (Patriarch 24, already double a player's speed; a small step up) |
| turnAs | irrelevant: she's immune to turn undead. Set to whatever the age type needs (e.g. lich) |
| Sunlight | immune, as Patriarch |
| xpv | each file keeps the higher of its own XP and the template's (never lower) |

Its files: every Bodhi CRE in BG2EE/EET: BODHI, BODHIAMB, CUBODHI, BODHI2,
PPBODHI3, PPBODHI4, VVBODHI, C6BODHI, CBBODH66, DRBOD, CHEVIL08, FINBODH,
OHB3BODH. They leave the Patriarch age (`patriarchVampire()`'s current WIP
Bodhi adjustment is replaced by this age).

**`creatures.csv` is the user's.** The builder adds the enum value and the
age in code. The user remaps those rows' MonsterId to `VampireAbomination`.
The builder never edits the CSV.

None of her files gets renamed: they all keep "Bodhi".

## Per-encounter values

All are adjustments on top of the age. Only the differences are listed.

| Tier | Files | Changes from the age |
|---|---|---|
| Ch2–3 | BODHI, BODHIAMB, CUBODHI, BODHI2 | none (the age is this tier) |
| Spellhold | PPBODHI3, PPBODHI4, VVBODHI | **lowered**: level 14 (HP 168), STR 21 (PPBODHI3) / 22 (PPBODHI4, VVBODHI), DEX 20 / 21, AC −1, APR 5/2, MR 30, physical resistance 0, cold/electricity 50, no magic damage resistance, no Death immunity, no see invisible; drain 5 (PPBODHI3, VVBODHI) / 3 (PPBODHI4), as their own weapons |
| Ch6 | C6BODHI, CBBODH66 | drain 5 + 4 magic damage (as the BODHI item); blood item +12 (24 HP/round in total) |
| ToB | CHEVIL08, FINBODH, DRBOD | same as Ch6, blood item included (24 HP/round; there's no pool there, so it simply stays). CHEVIL08 keeps its own equipment (Spell Warding amulet, Boots of Speed, healing potion) and its ENEMY allegiance |
| BP2 | OHB3BODH | STR 21, DEX 20, cold/electricity 50, regeneration 60 HP/round in total, immunity to level 1–2 spells (as its CRE) |

Every value in this table must be checked against BODHI.md's "Current CRE
files" table: none may be below its own file's.

## Abilities

- **From the vampire kit:** Domination (Will, save −6), Bat Swarm (its new
  duration, 1 + 1 per 2 levels, gives 13 rounds at level 25), Control Undead,
  wolf / bat / gaseous / vampire forms, level-drain claws.
- **SCS abilities, only with SCS:** her signature powers are SCS's own spells,
  created by Stratagems component #8080 "Improved Bodhi"
  (`stratagems/bodhi/bodhi.tpa`, `bodhi_spells`). **We don't recreate or copy
  them:** they belong to SCS, so recreating them could raise licence issues.
  Our script casts SCS's own `ibodhi*` resources by name, and each one only
  when that file exists in the game (install-time check). Without SCS #8080
  (or the older Tactics "Improved Bodhi", which also creates `ibodhi*`), she
  has none of them, like vanilla Bodhi. What they do, for targeting (decoded
  in BODHI.md, "Her extra abilities"):
  - **Touch of Death** (`ibodhi5`): on a target below 25% HP, or a level 9+
    summon. 36 magic damage and a slay, no save; Bodhi gets +36 max HP for
    300 s. 4-round timer. Skips Casiel's Soul (`plat16`) wearers.
  - **Sepulchral Sleep** (`ibodhi6`): sleep for 9 rounds, save vs spell; elves
    90% immune, half-elves 30%; skips sleep-immune targets.
  - **Chill of the Grave** (`ibodhi4`): 16d8 cold in a Horrid Wilting-style
    area (`PWILT`); a save vs spell negates it. Once per fight; targets level
    9+ with under 50% cold resistance.
  - **Deathly Shroud** (`ibodhi7`): the hardest difficulty only. 4 APR,
    immunity to level 1–2 spells, 50% cold resistance, cold aura (`ibodhi7d`:
    −1 to all saves, 1d8 cold).
- **Which tier has what** (as the originals): BODHI2 has Touch of Death and
  Sleep only; Spellhold has none of them; Ch6 and ToB have all of them;
  Deathly Shroud is cast only on the hardest difficulty.
- **Dropped:** Cloud of Bats (`ibodhi1`) and Abyssal Darkness (`ibodhi2`), both
  replaced by Bat Swarm, the
  anti-scroll `dw#nprun`, `dw#hprem`, and `ibodhi3` / `ibodhi8` (never cast;
  covered by Bat Swarm's slow and by Control Undead).
- These abilities live on the Abomination group, cast by `jabm4??` like any
  other age power, with the existing ability/targeting framework. They don't
  come from her own scripts.
- **Targeting comes from our framework**, modelled on SCS's script
  conditions (timers, target filters). The spells themselves stay SCS's,
  untouched.

## Her own scripts: story only

These are her scripts in the current install (`assets/bodhi/` holds copies):
BODHI2, C6BODHI, dw#chbod, finbodhi, PPBODHI4. Each keeps only the blocks
below; every combat, movement, spell, weapon-switch and bat-form block goes.

| Script | Story blocks to keep |
|---|---|
| BODHI2 | the init / "educational" 10-round timer → dialogue; HP < 25% → dialogue |
| C6BODHI | HP < 10% → cutscene + dialogue (and HPLT 10 → Heal on herself + dialogue, `Death` local); `Die()` → `BODHI_MIST_FORM_CHANGE` (SPIN809) and `VAMPIRE_GAS_FORM_CHANGE` (SPIN964); the Grimward Archer spawns (`DMWW_Bodhi_Init`, AR0809) |
| dw#chbod | nothing: **remove the script entirely** from CHEVIL08 (its override script `chalDIE` handles the challenge on its own; check it still works) |
| finbodhi | `STATE_REALLY_DEAD` → visual effects + `DestroySelf()` |
| PPBODHI4 | the whole hunt plot (`J#RealBodhi`, `J#BodhiHunts`, `J#BodhiSpawned`, spawn waves, the ultimatum on ar1514, `NumberOfTimesTalkedTo` dialogue), the `!Allegiance(Myself,ENEMY)` guard |

- **Why her spells don't stay in her scripts** (decided 2026-10-26): her
  scripts run before ours, so her spell blocks would pre-empt our whole
  script, survival included (the gaseous-form escape below 35% HP). They'd
  run on a separate round timer (`castspell` vs `JA_ROUND`), so she could
  cast twice a round. And they ignore our form states (`ForceSpellRES` as a
  bat or as mist). In our script there's one ordered list and one timer.
  Story blocks are the opposite case: they must win, and rarely fire, so
  they stay ahead of ours.
- **Scripts we don't touch:** `C6BWEAK` (C6BODHI's override, the holy water
  — see below), `chalDIE`, `SHOUTINV`, `INIT1`, and the scripts of the
  dialogue/cutscene files (BODHI, BODHIAMB, PPBODHI3, VVBODHI's `vvvamesc` /
  `vvbodhi`, CBBODH66). The builder checks each of those for combat blocks
  that would pre-empt ours, and reports any.
- **Order:** her stripped scripts stay in their slots, and ours goes into the
  first free slot (current `patchCreatureScript` behaviour). Story blocks
  that don't end in `Continue()` and fire every tick in a fight must not
  shadow ours. The builder adds `Continue()` or narrows their triggers where
  needed.
- **Installs vary:** the scripts in `assets/bodhi/` are the SCS "Improved
  Bodhi" versions. Without SCS they're vanilla (in the BIFFs), and PPBODHI4
  only exists with UB's "Cat and Mouse". The result must be right for each of
  those: vanilla story blocks on a vanilla install, and SCS's additions (the
  Grimward Archer spawns) only where SCS put them. Install-time stripping
  gets this for free; shipped BAFs need one per variant, chosen at install.
- **Game scope:** these files exist in BG2EE and EET (BG2 part) only.
- **How:** the repo already ships hand-made BAFs compiled only when the game
  has the script (`assets/*.BAF` + `ACTION_IF FILE_EXISTS_IN_GAME … COMPILE`
  in `main.tpa`). Ship story-only BAFs the same way, made from the copies in
  `assets/bodhi/`. That's the builder's call over install-time block
  stripping; either is fine as long as the result is the same.

## The blood pools (holy water)

- **Kept:** `BLPOOL3` (AR0809) sets `BodhiWeakened`. `C6BWEAK` then destroys
  VAMPREG2, swaps MINHP1 for MONHP1, casts `C6BODHI_WEAKNESS` (SPIN817:
  permanent Slow, STR −2, 20 acid damage) and swaps MINHP1 back.
- **Change:** a "blood" regeneration item (+12 HP/round, its own new item,
  destroyable) replaces VAMPREG2 as what C6BWEAK destroys. It's on the Ch6
  and ToB files (24 HP/round in total, like C6BODHI's two VAMPREG2 today), but
  only C6BODHI has a pool and C6BWEAK. Patch C6BWEAK's
  `DestroyItem("VAMPREG2")` to destroy the blood item. After a vial she's at
  her innate 12 HP/round: what SCS's two rings give today (24 → 12).
  **Confirmed by the user (2026-10-26): same as SCS.**
- Her innate 12 HP/round stays in the traits item (`jaim4m01`-like), which
  can't be destroyed: it also carries her immunities.
- Our traits must not make her immune to Slow (opcode 40), or the weakness
  fails.
- `C6WEAK` / `C6WEAK2` (the other lair vampires) are kept as they are.
- VAMPREG/VAMPREG2 stay removed from every vampire: no other script refers
  to them (searched in override and every BIFF).

## Items to clean up

- Remove `DW#BLDD3` and `DW#BLDD` (SCS blood-drain weapons), `DW#VMWOL`,
  `DW#VMBAT` and VAMP/VAMP1/VAMP3/BODHI from her files. Our claws and forms
  replace them. Today `DW#BLDD3` survives our patch.
- Keep: MINHP1 / MINHP20 / MONHP1 (story), HELMNOAN, CHEVIL08's equipment,
  and the SPIN883 she knows (vanilla Domination: check whether ours replaces
  it).

## Left to the builder

- The age's tpa file code (Patriarch is `4m`) and every new resource name.
- How claws and the blood item vary per tier: one item per distinct profile,
  or adjustments that swap them.
- Whether story-only scripts ship as BAFs or get stripped at install time.
- Keeping the work in reviewable steps (the age, then abilities, then
  scripts, then the holy water).
- Verification: regenerate `mod/`, keep the golden test passing, and check
  each file's generated values against the "never weaken" table.

## X#BODHI leaves the mod

X#BODHI (BGEE) is a story transition, like a scripted animation: she's never
meant to be attacked. She must not be patched at all: no age, no stats, no
items, no script. Today the Patriarch age patches her through her
`creatures.csv` row. Exclude her in code (the CSV stays the user's).
