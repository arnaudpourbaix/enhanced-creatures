# Bodhi

Work in progress (2026-10-24): her CRE files, a progression proposal, and her
own scripts compared with ours (see "Her scripts vs our patriarch script").

**Built (2026-10-26)** from
[the design](docs/superpowers/specs/2026-10-26-bodhi-abomination-design.md)
and [the plan](docs/superpowers/plans/2026-10-26-bodhi-abomination.md):

- **Files:** the Abomination age (`4o.tpa`, `jabm4o00.baf`) patches 11
  files. CUBODHI, DRBOD and X#BODHI were dropped from `creatures.csv`.
- **Per encounter:**
  - Spellhold is lowered, but never below its own files' values (stats,
    THAC0, saves, drain, regeneration).
  - Ch6 and ToB get the +12 blood item and the drain-5 + 4-magic claws.
  - Black Pits 2 keeps 60 HP/round and immunity to level 1–2 spells.
- **Holy water:** C6BWEAK destroys the blood item, so the vial takes her from
  24 to 12 HP/round.
- **SCS powers:** her SCS spells (`ibodhi4`–`7`) are cast by our script,
  memorized only when `ibodhi5.spl` exists.
- **Her own scripts:** BODHI2, C6BODHI, finbodhi and ppbodhi4 are stripped
  to their story blocks at install. `dw#chbod` is removed.
- **VVBODHI's `vvvamesc` stays (2026-10-26):** it drives the thieves who help
  the party, even though its "attack whoever hit me" block takes over from
  ours once she's hit.
- **Saving throws (2026-10-26):** the fighter table, like every vampire (3/5/4/4/6 at
  level 25, 5/7/6/5/8 in Spellhold). Her files' better saves come from their
  Fighter/Thief class, which isn't true to a vampire.
- **Not tested in game yet.**

Values below are the original CRE files, read from `C:/Games/BG2EE/override`
(our mod isn't installed there).

X#BODHI (BGEE, BG1 NPC mod, Bodhi disguised as "Arel") is left out: she isn't
meant to be fought.

## Current CRE files, in order of appearance

APR 5/2 is the game's "8" value. F/T means Fighter/Thief 25/25.
AC is the CRE's natural AC field: the engine adds the DEX bonus on top, so the
final AC is lower (e.g. −4 with DEX 24 is a final −10). The generator's `ac` is
the final value.

| # | CRE | When / where | Lvl | HP | STR | DEX | AC | APR | MR | Phys res | Cold/Elec | Weapon (levels drained) | Weapon immunity | Regen | What else she can use |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | BODHI | Ch2, Graveyard, dialogue | 25 | 102 | 24 | 24 | −1 | 3 | 75 | 0 | 100 | VAMP (2) | +2 | **none** | — |
| 2 | BODHIAMB | Ch2–3, Graveyard ambush + NPC cutscenes | 25 | 102 | 24 | 24 | −1 | 3 | 75 | 0 | 100 | VAMP (2) | +2 | **none** | — |
| 3 | BODHI2 | Ch3, AR0801 "lesson" fight | 25 F/T | 183 | 24 | 24 | −4 | 3 | 75 | 25 | 100 | VAMP1 (3) | +3 | 12 HP/round (VAMPREG2) | SCS wolf/bat forms, blood drain (−3 CON), Domination; 50% magic damage resistance, immune to Death, see invisible; Touch of Death, Sleep |
| 4 | PPBODHI3 | Ch4, Spellhold (vanilla) | 14 | 102 | 20 | 20 | −1 | 5/2 | 0 | 0 | 50 | VAMP3 (5) | +2 | 12 HP/round (VAMPREG2) | — |
| 5 | PPBODHI4 | Ch4, Spellhold maze (UB "Cat and Mouse") | 14 F/T | 120 | 22 | 21 | −1 | 5/2 | 0 | 0 | 50 | VAMP1 (3) | +3 | 12 HP/round (VAMPREG2) | SCS forms + blood drain, Domination, Control Undead |
| 6 | VVBODHI | ? ("VV" mod, `vampsttp.bcs`) | 14 F/T | 120 | 22 | 21 | −1 | 5/2 | 0 | 0 | 50 | VAMP3 (5) | **none** ⚠ | 12 HP/round (VAMPREG2) | SCS forms + blood drain, Domination |
| 7 | CUBODHI | ? no spawn found, no script (cutscene?) | 25 | 85 | 24 | 24 | 1 | 3 | 75 | 0 | 100 | VAMP (2) | +3 | none | — |
| 8 | C6BODHI | Ch6, her lair (AR0809) | 25 F/T | 183 | 24 | 24 | −4 | 3 | 75 | 25 | 100 | BODHI (5, +4 magic dmg) | +3 | 24 HP/round (VAMPREG2 ×2) | SCS forms + blood drain, Domination, the same three protections; every `ibodhi` spell |
| 9 | CBBODH66 | Check the Bodies mod | 25 | 102 | 24 | 24 | −1 | 3 | 75 | 0 | 100 | VAMP (2) + a "Skull" shield | +2 | none | — |
| 10 | DRBOD | ? no spawn, no script, no items, 0 XP | 25 | 85 | 24 | 24 | 1 | 3 | 75 | 0 | 100 | none | none | none | display only |
| 11 | CHEVIL08 | ToB, Pocket Plane challenge | 25 F/T | 183 | 24 | 24 | −4 | 3 | 75 | 25 | 100 | BODHI (5) | +3 | 12 HP/round (VAMPREG2) | like C6BODHI, but the weaker blood drain (−1 CON); Spell Warding amulet, Boots of Speed, healing potion |
| 12 | FINBODH | ToB, Ascension final battle | 25 F/T | 183 | 24 | 24 | −4 | 3 | 75 | 25 | 100 | BODHI (5) | +3 | 24 HP/round (VAMPREG2 ×2) | like C6BODHI, without the minimum-HP item |
| — | OHB3BODH | Black Pits 2 (separate campaign) | 25 | 200 | 21 | 20 | −4 | 3 | 75 | 25 | 50 | VAMP3 (5) | +3 | 60 HP/round (10 HP/s) | immune to level 1–2 spells, 50% magic damage resistance, see invisible |

Regeneration: VAMPREG2 is 12 HP/round (2 HP/s); several equipped rings stack.
VAMPREG/VAMPREG1 (op 98 at 1/3) aren't on any of her files.

Weapons: VAMP (+2, 1d6, drain 2), VAMP1 (+4, drain 3), VAMP2 (+4, drain 4,
unused), VAMP3 (+4, drain 5), BODHI (+4, drain 5, +4 magic damage).
SCS extras: DW#BLDD3 / DW#BLDD (blood drain, −3 / −1 CON), DW#VMWOL (wolf
form), DW#VMBAT (bat form).

Where each one appears was found by searching the area and cutscene scripts
in `BG2EE/override`. CUBODHI and DRBOD are spawned by none of them. VVBODHI's
mod hasn't been identified.

## Wrong numbers and broken items

- ~~She gets weaker in Spellhold~~ — **intended** (user, 2026-10-26): in Ch2
  she isn't meant to be attacked, let alone defeated, so she's at full
  strength (at level 14 the party could kill her). In Spellhold she hunts the
  party and tries to kill them but isn't meant to succeed. At level 25 she
  probably would, so she's level 14 there (MR 0, 50% cold resistance).
- **Drain jumps around:** 2 levels in Ch2, 3 in Ch3, 5 in Spellhold, 3 again
  in the maze hunt, then 5.
- **STR is all over the place:** 20, 22, 24, and 21 in Black Pits 2. HP
  likewise: 85, 102, 120, 183, 200.
- **No regeneration on four files:** BODHI, BODHIAMB, CUBODHI and CBBODH66.
- **VVBODHI has no weapon immunity:** her IMMUNE3 ring sits in her inventory,
  not in a ring slot.

## Proposal

Rules:

- **Never weaken a boss (decided 2026-10-24).** Each value is the best of:
  the patriarch template (level 14, STR 21, DEX 20, INT 20, CHA 19, MR 30, +3
  weapons to hit her), every original CRE in that tier, and the tier before it.
  So she never gets weaker from one chapter to the next. **The rule is never
  broken** (user, 2026-10-26). Spellhold isn't an exception to it: its floor
  is its own CRE files plus the template, so Spellhold Bodhi ends up between
  Patriarch and Abomination, a weaker Abomination. The story reason for the
  lower values is above.
- **Derived values:** HP and THAC0 aren't set by hand. HP comes from our
  formula, level × 12 (`hit-point.service.ts`, undead d12). It ends up above
  every original file (300 against 102–183).
- **Level cap:** level stays at 25 (`VAMPIRE_MAX_LEVEL`).

| Tier | CREs | Lvl | HP (auto) | STR | DEX | AC | APR | MR | Phys res | Cold/Elec | Drain | Regen / round | Extras |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Ch2–3 | BODHI, BODHIAMB, CUBODHI, BODHI2 | 25 | 300 | 24 | 24 | −4 | 3 | 75 | 25 | 100 | 3 | 12 | 50% magic damage resistance, immune to Death, see invisible (from BODHI2) |
| Spellhold | PPBODHI3, PPBODHI4, VVBODHI | 14 | 168 | 21–22 | 20–21 | −1 | 5/2 | 30 | 0 | 50 | 3–5 (her own weapon) | 12 | between Patriarch and Abomination: template + each file's own values, never below them (STR 22 / DEX 21 on PPBODHI4 and VVBODHI) |
| Ch6 | C6BODHI, CBBODH66 | 25 | 300 | 24 | 24 | −4 | 3 | 75 | 25 | 100 | 5 (+4 magic) | 24 | same + the BODHI weapon's magic damage |
| ToB | CHEVIL08, FINBODH, DRBOD | 25 | 300 | 24 | 24 | −4 | 3 | 75 | 25 | 100 | 5 (+4 magic) | 24 | same as Ch6; CHEVIL08 keeps her equipment |
| BP2 | OHB3BODH | 25 | 300 | 21 | 20 | −4 | 3 | 75 | 25 | 50 | 5 | 60 | own campaign: her CRE + template; keeps immunity to level 1–2 spells |

Notes:

- **What's left to grow:** Ch2–3 already has the best values of every later
  file, so under this rule she's at her cap from Ch2. From there, only drain
  (3 → 5), regeneration (12 → 24 HP/round from Ch6) and the Ch6 weapon's
  magic damage still grow. Anything beyond that
  (for ToB, say) would have to be added on purpose. That's still an open
  question.
- Drain per tier would need one claw item per tier, because today our claws
  (`jaim4m00`) always drain 2 levels.
- The current work-in-progress adjustment in `patriarchVampire()` lists
  `OHB3BODH` and `PPBODHI3`. The generated `4m.tpa` patches them under bg2ee,
  but nobody has checked that the adjustment itself carries the right game
  scope.

## Decision: a new "Abomination" vampire age (2026-10-25)

Bodhi gets a new age above Patriarch, "Abomination", rather than patriarch
adjustments or a `variant()`. Reasons (the user's): 13 CRE files is a lot for
one boss, and a variant would mean listing every CRE in the variant and again
in its adjustments. A dedicated age is simpler. Its cost (a new `MonsterEnum`
value, remapping her `creatures.csv` rows, a doc section, a new translation
key that shifts `.tra` numbering) is accepted.

All her files go under Abomination, Spellhold included (decided 2026-10-26).
Spellhold (PPBODHI3, PPBODHI4, VVBODHI) gets a lowering adjustment on top of
the age, down to that tier's values but never below those files' own. That's
rather than leaving them on Patriarch with raising adjustments: it keeps every
Bodhi file in one age.

Abomination is for Bodhi only for now (2026-10-26). Other vampires above
Patriarch (Black Pits 2's OHB3VMP*, the D9 memory vampires, Tanova…) haven't
been reviewed yet; they may join later if it fits.

## Open questions

1. ~~Can she be weaker than the original files?~~ No: we don't weaken a boss.
2. ~~Should she still grow in ToB?~~ No (2026-10-26): she died in her lair,
   so she comes back as she was in Ch6. SCS doesn't make her stronger either.
   It could be revisited later.
3. ~~Her special scripts?~~ Decided (2026-10-26): her `ibodhi` spells become
   Abomination abilities (Abyssal Darkness, Chill of the Grave, Touch of
   Death, Sepulchral Sleep, Deathly Shroud; not Cloud of Bats), cast by our
   generated script like any other age power. Her own scripts are reduced to
   their story blocks only: no combat, movement, spell or bat-form blocks left.

## Ability review (2026-10-26)

- **Powers per tier (2026-10-26):** each tier keeps the powers its original
  encounter had, for now: BODHI2 only Touch of Death and Sleep; Spellhold
  none; Ch6 and ToB all of them; Deathly Shroud only on the hardest
  difficulty. To be revisited later if needed.

- **Bat Swarm rework (all vampires, not just Bodhi):**
  - **Duration (done 2026-10-26):** 1 round + 1 per 2 caster levels instead
    of a fixed 5 rounds: 5 for a Fledgling, 8 for a Patriarch, 13 for Bodhi
    (level 25). 9 headers (levels 8, 10, …, 24), each with its own projectile
    (`jape0700`–`jape0708`), since a cloud's lifetime is its projectile's
    trigger count.
  - ~~The bats follow their victims~~ — **dropped** (2026-10-26). With no
    save and no dispel, 25 rounds of following bats would blind a whole party
    for the whole fight. PnP gives a 20-foot radius, so it stays a fixed
    20-foot area: leaving it is the way out, and kiting is accepted.
- **Abyssal Darkness (`ibodhi2`): dropped (2026-10-26).** Bat Swarm already blinds
  for longer and over an area. Darkness is single-target (save vs spell −4),
  but lasts 100 rounds.
- **Chill of the Grave (`ibodhi4`):** 16d8 cold (average 72, max 128); a
  successful save vs spell negates it. Projectile `PWILT`, the Horrid Wilting
  area. Script: once per fight (the `chill` timer is 1000 s); only targets
  level 9+ with under 50% cold resistance. To review.
- **Anti-scroll (`dw#nprun`): dropped.** It makes no sense for Bodhi to strip
  Protection from Undead. The scroll is overpowered, but that belongs in its
  own optional tweak ("remove Protection from Undead scrolls"), not in her
  AI.
- **`ibodhi3` (slow-like) and `ibodhi8` (Control Undead):** already covered,
  by Bat Swarm's slow and by our Control Undead.

## Her scripts vs our patriarch script (`jabm4m00`)

Compared on 2026-10-24 with the scripts saved in
`mod/lib/pnp-monster/vampire/assets/bodhi/`. Each one belongs to a different
CRE, one per encounter (found by grepping `BG2EE/override` area scripts):

| Script | CRE | Slot | Encounter |
| --- | --- | --- | --- |
| BODHI2 | BODHI2 | override | Chapter 3, Graveyard (AR0801): a short "lesson" fight that ends in dialogue (10 rounds or <25% HP); she isn't meant to die |
| C6BODHI | C6BODHI | race (under C6BWEAK, SHOUTINV) | Chapter 6, her lair (AR0809): the real fight; at <10% HP she heals and talks, mist form on death, Grimward archers |
| dw#chbod | CHEVIL08 | class (under chalDIE) | ToB Pocket Plane, first challenge, evil path (AR4500): past foes come back; no plot |
| finbodhi | FINBODH | override | Ascension's final battle (AR6200); `DestroySelf()` once really dead |
| PPBODHI4 | PPBODHI4 | override | Chapter 4–5, the hunt in the Spellhold maze (AR1501–1516); several Bodhis, one `J#RealBodhi`, spawn waves |

The first four come from one SCS-style template (DMWW Bodhi/Ascension
difficulty INI), so they're 95% identical, with each encounter's plot blocks
added. PPBODHI4 is a plain domination and Control Undead script plus the hunt
plot. The other Bodhi CREs (BODHI, BODHIAMB, CUBODHI, DRBOD, PPBODHI3,
VVBODHI, OHB3BODH, CBBODH66) are dialogue, cutscene or mod copies; their
scripts haven't been looked at yet.

### 🔴 Which script actually runs

- ☐ `patchCreatureScript` drops none of these scripts. They stay in their
  higher-priority slots and `jabm4m00` goes into the first empty slot below
  them. Each of them ends with an unconditional
  `See(NearestEnemyOf) → AttackOneRound` fallback, and the spell blocks don't
  require `ActionListEmpty()`. So in a fight Bodhi mostly runs her own AI
  (including the `ibodhi*` spells), and our blocks only get in when none of
  hers match. **Decided (2026-10-24):** patch her scripts so they work
  together with `jabm4m00`. Keep her plot blocks and her own abilities (except
  Cloud of Bats), and leave melee, movement and bat form to ours.
- ☐ Her script picks weapons with `SelectWeaponAbility(SLOT_WEAPON0..3)`.
  SLOT_WEAPON3 is the bat form. `jam4m_patch` removes `dw#vmwol`/`dw#vmbat`,
  so those blocks now fail quietly: the "Shapeshifts Bat" string shows, she
  retreats or moves without the bat form, and at <10% HP outdoors she still
  calls `EscapeArea()`. `DW#BLDD3` (on BODHI2, C6BODHI, FINBODH, PPBODHI4,
  VVBODHI) isn't in the `REMOVE_CRE_ITEM` list, which only has `dw#bldd`,
  `dw#bldd1` and `dw#bldd2`. Check whether it should be removed too.

### Plot blocks to keep if her combat blocks are removed

- ☐ HP thresholds → `StartDialogueNoSet(Player1)`: BODHI2 at <25% HP (plus
  the "educational" ten-round timer); C6BODHI at <10% (cutscene, Heal on
  herself, `Death` local). The CRE's MINHP1 item has to stay for these.
- ☐ `Die()` → `ReallyForceSpellDead(BODHI_MIST_FORM_CHANGE / SPIN809)` in
  C6BODHI, next to SPIN964. Ours only casts SPIN964 through the traits item
  (op 232). Check that SPIN809 isn't the one the plot needs.
- ☐ C6BODHI: spawns Grimward Archers (`DMWW_Bodhi_Init` on AR0809).
- ☐ finbodhi: `STATE_REALLY_DEAD` → visual effects + `DestroySelf()`.
- ☐ PPBODHI4: the whole hunt plot (`J#RealBodhi`, `J#BodhiHunts`, spawn
  waves, ultimatum dialogue on ar1514). It runs before its combat blocks.

### Blood pools: Elven Holy Water weakens her (Ch6)

Read from the game's own scripts (`DATA/SCRIPTS.BIF`, decompiled with WeiDU):

- **Pools:** `BLPOOL2` (AR0808) and `BLPOOL3` (AR0809) are blood pools. Using
  one with Elven Holy Water (`MISCAU`, from Elhan) in the party takes one vial,
  cleanses it ("the vampires can no longer draw energy from the blood") and
  sets `VampiresWeakened` (AR0808) or `BodhiWeakened` (AR0809) to 1.
- **Bodhi:** `C6BWEAK`, C6BODHI's override script, waits for `BodhiWeakened`.
  It then calls `DestroyItem("VAMPREG2")`, swaps MINHP1 for MONHP1 and casts
  `C6BODHI_WEAKNESS` (SPIN817) on her. Its effects: permanent Slow, STR −2,
  20 acid damage, and a removal of secondary type 18. There's also a DEX −2
  whose 0-second duration means it never lasts, probably a vanilla bug. Then
  MINHP1 goes back.
- **The other lair vampires:** `C6WEAK` / `C6WEAK2` (on C6HAREI, C6MERE,
  C6SALIA, C6DEL, C6VFLM01, C6TANOV, C6VALEN) wait for `VampiresWeakened`
  and cast `C6VAMPIRE_WEAKNESS` (SPIN818): permanent Slow, STR −5. No regen
  loss for them.
- **The vanilla intent:** the holy water takes away her regeneration. In
  this install it only halves it. SCS gave C6BODHI a second VAMPREG2 (amulet
  slot), and `DestroyItem` removes only one: 24 → 12 HP/round.

What this means for us:

- ☐ **Our patch breaks the regen loss.** `jam4m_patch` removes VAMPREG2 and
  puts her regeneration in the traits item (`jaim4m01`), so `DestroyItem("VAMPREG2")`
  finds nothing and the holy water no longer touches her regen. Fix: put
  her regen on its own item and either name it in a patched C6BWEAK or have
  C6BWEAK destroy it. The traits item can't be destroyed: it also carries
  her immunities.
- ☐ Keep C6BWEAK and C6WEAK. `patchCreatureScript` doesn't remove them
  today; it has to stay that way. Check that our traits give no immunity to
  Slow (opcode 40), or the weakness would fail.
- **Decided (2026-10-25):** keep 24 HP/round from Ch6. That much makes her
  nearly unkillable, which pushes players to use the holy water (the game's
  own mechanic), so it's treated as intended.
- **Final model (2026-10-26, replaces the 5 + 7 / 19 split):** the
  Abomination age has 12 HP/round innate (Patriarch has 5), in the
  undestroyable traits item. The Ch6 and ToB files add a +12 "blood" item
  (24 in total). The holy water destroys it in her lair, 24 → 12, the same
  as SCS's two rings today. ToB has no pool, so she keeps 24 there; FINBODH
  already has 24, and CHEVIL08 goes from 12 to 24 because she returns as she
  was in Ch6. Regeneration effects stack (tested in game). Other
  vampires don't need the blood item: no script but C6BWEAK references any
  VAMPREG ring.
- **Where 24 HP/round comes from:** in the vanilla BIFF files, C6BODHI has a
  single VAMPREG2 (amulet slot), so 12 HP/round, and BODHI2 has none (0).
  SCS "Improved Vampires" (`stratagems/vampire/vampire_shared.tph`,
  `vampire_14`: "the strongest vampires") gives every top vampire
  `remove_items=>~immune2 vampreg~ add_items=>~immune3 vampreg2~`. That's
  generic: it removes VAMPREG (not VAMPREG2) and adds a VAMPREG2 to a ring
  slot without checking the amulet. C6BODHI ends up with two (24), BODHI2 with
  one (12). It looks like an unintended side effect rather than a choice made
  for Bodhi (it also halves what the holy water removes), but nothing in the
  SCS code says so either way.

### Tactics worth porting (PnP-legal)

- ☐ **Protection from Undead.** Every SCS Bodhi script applies `dw#nprun` to
  Player1-6 once per hour, an SCS counter to the Protection from Undead
  scroll. `jabm4m00` has nothing for `SCROLL_OF_PROTECTION_FROM_UNDEAD`.
  At minimum, skip such targets in melee and target them with domination or
  Bat Swarm instead.
- ☐ **Attack only what the weapon can hurt.** Her melee blocks check
  `WeaponEffectiveVs`/`WeaponCanDamage` (refreshed by a `seedefences`
  timer), and a `LastTargetedBy` block cancels an attack on a target the
  weapon can't hurt (`ClearActions`). We already check
  `WeaponCanDamage`/`WeaponEffectiveVs` on targets. The cancel-on-retarget
  part is missing.
- ☐ **Drain-victim filter.** Her bat dive skips `Kit(Blackguard)` on top of
  `UNDEADHUNTER` / `LEVEL_DRAIN_IMMUNITY` / `ITEM_LEVELDRAIN`. Check whether
  EE Blackguards are immune to level drain, and if so add it to `DRAINABLE`.
- ☐ **Victim priority.** Her bat dive prefers WorstAC, then mages, thieves,
  bards, clerics, then any PC. Ours dives toward the nearest drainable enemy.
  Consider WorstAC/class ordering for the dive target.
- ☐ **Bat retreat.** Below 50% HP: bat form, run 60, then stay out of 20 range
  (random walk). Ours has bat flee at 65% and gaseous form at 35%. Probably
  covered; compare the distances.
- ☐ Doors: she opens a nearby closed door indoors when no enemy is within 30
  (`RR#NOPND`). We have an "Open door" block; check that its conditions match.

### Her extra abilities (no PnP vampire equivalent)

Decoded from the `BG2EE/override` SPL files. They keep firing as long as her
script stays in place (see "Which script actually runs").

| Spell | Name | Effect | Used by | Ours |
| --- | --- | --- | --- | --- |
| `ibodhi1` | Cloud of Bats | casts `sppr717d` → `SPPR717A` swarm; prefers casters/bards; ~1000 s timer | C6/chbod/fin | ☐ **remove**: ours replaces it |
| `ibodhi2` | Abyssal Darkness | blind 100 rounds, save vs spell −4; prefers fighters/rangers/paladins/thieves | C6/chbod/fin | ☐ none |
| `ibodhi4` | Chill of the Grave | 16d8 cold, save vs spell; targets level 9+, skips 50%+ cold resist | C6/chbod/fin | ☐ none |
| `ibodhi5` | Touch of Death | target <25% HP (or a level 9+ summon): 36 magic damage + slay, no save; Bodhi +36 max HP for 300 s; 4-round timer; skips Casiel's Soul (`plat16`) wearers | all four | ☐ none (closest: level drain) |
| `ibodhi6` | Sepulchral Sleep | sleep 9 rounds, save vs spell; elves 90% immune, half-elves 30%; skips sleep-immune | all four | ☐ none |
| `ibodhi7` | Deathly Shroud | Insane / difficulty 5 only: 4 APR, immune to level 1–2 spells, 50% cold resist, cold aura `ibodhi7d` (−1 all saves, 1d8 cold) | C6/chbod/fin | ☐ none |
| `dw#nprun` | anti-scroll | removes `dw#proun` (protection from undead) from the party and blocks it for 300 s | all four | ☐ none |
| `ibodhi3`, `ibodhi8` | slow-like debuff; Control Undead | in override but never cast by these scripts | — | — |

BODHI2 only has `ibodhi5` and `ibodhi6`. `dw#hprem` just removes the Shroud
when difficulty drops. **Decided (2026-10-24):** Bodhi keeps all of these as
her signature powers (an exception to the PnP-only rule) except Cloud of Bats,
which our Bat Swarm replaces. Their blocks have to keep working once her
melee/movement blocks are gone.

PPBODHI4's domination target filter (Cloak of Mirroring, Helm of Charm
Protection, Corthala armor, Shield of Harmony, the charm-immunity weapons,
monk, Inquisitor) is already covered by our
`CHARM_IMMUNITY`/`ImmuneToSpellLevel`/spell-protection checks.

### Side note

The uncommitted Bodhi adjustment in `patriarchVampire()` (level 25,
STR/DEX 24, 3 APR, MR 75…) isn't in the generated `4m.tpa` yet, because
`mod/` was last regenerated before it was added.
