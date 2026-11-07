# Threat Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A second XP system, `threat`, selectable next to the DMG one: a monster's duels against a fighter and an archer of its level, mapped onto the book's XP scale.

**Architecture:** A new `lib/src/services/experience/threat/` folder. `reference.ts` holds the reference fighter and archer; `combat-profile.ts` turns a file scope into plain numbers (reusing experience-detection's internals, exported for it); `duel.ts` is pure math over a profile and a reference; `threat-xp.ts` maps a threat to XP with a fitted `s` and `k` stored in `threat-fit.ts`. `experience.service` scores with the system `PLAYER_CONFIG.experienceSystem` picks; everything else of the pipeline is shared. The dashboard's spike view shows the threat columns.

**Tech Stack:** TypeScript, vitest, `npm run generate`, `npm run dashboard`.

**Spec:** [docs/superpowers/specs/2026-11-07-threat-experience-design.md](../specs/2026-11-07-threat-experience-design.md)

## Global Constraints

- Default `PLAYER_CONFIG.experienceSystem = "dmg"`: with it, the golden test passes and mod/ doesn't change.
- P(hit) = (21 − (THAC0 − AC)) / 20, clamped to 0.05..0.95. A save succeeds on d20 ≥ save − bonus: P(fail) = clamp((save − bonus − 1) / 20, 0, 1).
- R_f capped at 30 rounds; R_m = 1 ÷ h, h capped at 1, R_m capped at 30 when h is 0.
- XP = Table 31 (Hit Dice value) × s × T^k, rounded to 10; k within 0.25..1; never below the in-game XP (the existing floor).
- The user's working tree has uncommitted changes (`lib/config/constants.ts`, `lib/config/player-config.ts` with `experience2e: false`, `lib/creatures/skeleton-warrior.ts`) and the spike (`scripts/lib/experience-proposals.ts`, `scripts/lib/experience-threat-reference.ts`, their wiring in `scripts/lib/experience-report*.ts`, `lib/src/model/creature/creature.ts` `baseScore`, `experience.service.ts` `adjusted`): stage explicit paths only, never the user's three files; before regenerating mod/ for a commit, set those aside (`git stash push -- <the three files>`) and restore them after.
- No `lib/creatures/<creature>.test.ts`: test the services with fixtures.
- The post-commit hook adds a CHANGELOG line: remove it for internal commits (amend).

## Review Focus

- A creature with no weapon at all (a caster, an ooze with only powers): the melee duel must still score (h from its powers, R_m capped), not crash.
- A monster the fighter can't hurt (weapon immunity above his enchantment): R_f is the 30-round cap, not Infinity or NaN.
- A power at will (`memorizedCount` AT_WILL = 90) against a limited one: uses capped at R_f casts, one cast a round in descending hazard order.
- An adjustment scope reads its own data (folded adjustments), so a stronger variant's threat is above its base's.
- `experienceSystem: "threat"` with `experience2e: true`: base files still play their book XP; only computed rows use threat.

---

### Task 1: Reference fighter and archer

**Files:**

- Create: `lib/src/services/experience/threat/reference.ts` (from the spike's `scripts/lib/experience-threat-reference.ts`, which then re-exports it or is deleted in Task 6)
- Test: `lib/src/services/experience/threat/reference.test.ts`

**Interfaces:**

- Produces: `interface ReferenceCombatant { level: number; ac: number; hp: number; thac0: number; apr: number; damage: number; saveDeath: number; savePolymorph: number; saveBreath: number; saveSpell: number; saveWand: number; movement: number }`; `referenceFighter(level: number): ReferenceCombatant`, `referenceArcher(level: number): ReferenceCombatant` (level clamped to 1..20); `saveOf(ref, type: SaveTypeEnum): number` (Spell → saveSpell, Breath → saveBreath, ParalyzePoisonDeath → saveDeath, RodStaffWand → saveWand, PetrifyPolymorph → savePolymorph; several types: the best, i.e. the lowest).

- [ ] **Step 1: Failing tests**: `referenceFighter(1)` → `{ ac: 10, hp: 13, thac0: 18, apr: 2.5, damage: 9.5, saveDeath: 14 }`; `referenceFighter(9)` → `{ ac: 0, hp: 117, thac0: 8, apr: 3 }`; `referenceFighter(25)` equals level 20's; `referenceArcher(4)` → `{ ac: -1, hp: 52, apr: 2, damage: 5.5, movement: 12 }` and its thac0 = 21 − 4 − (2 Dex + 1 specialization + 0 enchantment) = 14; `saveOf(referenceFighter(2), SaveTypeEnum.ParalyzePoisonDeath)` = 14; warrior wand saves 16, 15, 13, 12, 10, 9, 7, 6, 5 from levels 1, 3, 5, ..., 17.
- [ ] **Step 2: Run, see them fail**: `npx vitest run lib/src/services/experience/threat/reference.test.ts`
- [ ] **Step 3: Implement**: the spike's fighter values; the archer: same level, HP and saves, AC = fighter's − 4, THAC0 = 21 − level − (2 + 1 + enchantment), 2 attacks, damage 3.5 + 2 + enchantment, movement 12; the fighter's movement 12 too.
- [ ] **Step 4: Run, pass**
- [ ] **Step 5: Commit** `feat(threat): reference fighter and archer`

---

### Task 2: Combat profile

**Files:**

- Modify: `lib/src/services/experience/experience-detection.ts` (export what the profile reuses: `effectiveOf`, `immunitiesOf`, `wieldedItems`, `attacksPerRound`, `strengthDamage`, `diceOf`, `targetEffects`, `ownSpells`, `memorizedFiles`, `allSpells`, `permanentEffects`, `rangedGameWeapons`, `QUIVER_SLOTS`, `CAST_OPCODES`; no behavior change)
- Create: `lib/src/services/experience/threat/combat-profile.ts`
- Test: `lib/src/services/experience/threat/combat-profile.test.ts`

**Interfaces:**

- Consumes: `ExperienceScope`, `detectHitDice`, `hitDiceValue`.
- Produces:

  ```ts
  type EffectKind =
    "ending" | "fear" | "confusion" | "half" | "drain" | "strengthDrain" | "disease" | "poison";
  interface HitEffect {
    kind: EffectKind;
    chance: number;
    saves: SaveTypeEnum[];
    saveBonus: number;
    amount: number;
    duration: number;
  }
  interface ProfileAttack {
    name: string;
    average: number;
    ranged: boolean;
    effects: HitEffect[];
  }
  interface ProfilePower {
    name: string;
    uses: number;
    ranged: boolean;
    area: boolean;
    average: number;
    effects: HitEffect[];
    level?: number;
    role?: SpellRole;
  }
  interface CombatProfile {
    level: number;
    hp: number;
    ac: number;
    thac0: number;
    apr: number;
    movement: number;
    attacks: ProfileAttack[];
    powers: ProfilePower[];
    invisibleAtWill: boolean;
    flies: boolean;
    resist: { slashing: number; piercing: number; missile: number; magic: number };
    weaponEnchantment: number;
    regeneration: number;
    undead: boolean;
    construct: boolean;
    magicImmune: boolean;
    spellImmunity: boolean;
    declared: number;
  }
  function combatProfile(scope: ExperienceScope): CombatProfile;
  ```

  `level` = Hit Dice value; `thac0` = melee THAC0 with the strength to-hit (`creatureService.getMeleeThac0` on the effective data); `attacks` = the XP round (`roundAttacks` order, `apr` long); `average` = dice average (thrown × (size + 1) ÷ 2 + bonus) + strength damage on melee + the average on-hit damage of the weapon's effects and cast spells, each cast weighted by its effect's `probability1` ÷ 100 (a 10% hug: a tenth); a game missile weapon (`rangedGameWeapons`, a quiver item) adds two `ranged` attacks of 3.5; `uses` = `memorizedCount`, Infinity at `AT_WILL`; `weaponEnchantment` = the enchantment its weapon immunity needs (`nonMagicalWeapons` 1, `plusOneWeapons` 2, ... from the immunity names; 0 without one); `regeneration` = HP a round from opcode 98; `declared` = `xpAbilities` length.
  Effect kinds from opcodes: ending = Paralyze, Hold, HoldCreatureSpell, Stun, Sleep, Petrification, Slay, KillTarget, CharmCreature, PolymorphIntoSpecific, Imprisonment, Maze; fear = Panic; confusion = Confusion; half = Blindness, Slow, Web, EntangleOverlay; drain = LevelDrain (amount = levels); strengthDrain = StrengthBonus with a negative Increment (amount = points); disease = Disease; poison = Poison (amount × duration = its damage). `chance` = the effect's `probability1` ÷ 100 (1 when unset).
  Game spells memorized (not the mod's own): a `ProfilePower` per file from `spellProfileService` (level, role, saves), `average` and effects filled by Task 3's table.

- [ ] **Step 1: Failing tests** with fixture creatures (the experience-detection tests' fixture style): a ghoul-like creature (2 HD, 24 HP, AC 6, THAC0 19, 3 attacks 1d3/1d3/1d6 with a Paralyze effect saving vs ParalyzePoisonDeath) gives `{ level: 2, hp: 24, ac: 6, thac0: 19, apr: 3 }`, three attacks with averages 2, 2, 3.5 and one `ending` effect each; a weapon casting a 10% 3d6 hug spell adds 1.05 to that attack's average; a `nonMagicalWeapons` immunity gives `weaponEnchantment: 1`; an `undead` trait gives `undead: true`; a 25% slashing resistance gives `resist.slashing: 0.25`; an AT_WILL power has `uses: Infinity`.
- [ ] **Step 2: Run, fail**: `npx vitest run lib/src/services/experience/threat/combat-profile.test.ts`
- [ ] **Step 3: Implement** `combatProfile`, exporting the detection internals it needs (no detection test may change).
- [ ] **Step 4: Run, pass**, then `npx vitest run lib/src/services/experience` (all pass).
- [ ] **Step 5: Commit** `feat(threat): combat profile of a creature file`

---

### Task 3: The duels

**Files:**

- Create: `lib/src/services/experience/threat/duel.ts`
- Test: `lib/src/services/experience/threat/duel.test.ts`

**Interfaces:**

- Consumes: `CombatProfile`, `ReferenceCombatant`, `saveOf`.
- Produces:

  ```ts
  interface DuelResult {
    monsterRounds: number;
    fighterRounds: number;
    ratio: number;
    notes: string[];
  }
  function pHit(thac0: number, ac: number): number;
  function pFail(save: number, bonus: number): number;
  function meleeDuel(p: CombatProfile, ref: ReferenceCombatant): DuelResult;
  function rangedDuel(p: CombatProfile, archer: ReferenceCombatant): DuelResult;
  function threat(p: CombatProfile): { threat: number; melee: DuelResult; ranged: DuelResult };
  const GAME_SPELL_HAZARD: Record<
    SpellRole,
    (level: number) => { average: number; ending: boolean }
  >;
  ```

  Monster's hazard per round against `ref` (spec "Monster's side"): damage hazard = Σ attacks average × pHit ÷ ref.hp (poison: its damage; drain: levels × 13 HP; strengthDrain: 1.3 HP a point; disease: 13 HP, my calls in the spec); ending hazard = 1 − Π(1 − pHit × pFail × chance) over the attacks' ending effects; half effects add half their chance; fear: chance f → the fighter's damage × (1 − f) and melee damage × (1 − f ÷ 2), for a ranged attack fear counts as ending; confusion: nothing in melee. Powers: per cast hazard (average ÷ ref.hp + ending chance vs `saveSpell` or the effect's saves, × 1.5 for an area), casts = min(uses, fighterRounds) in descending hazard order, one a round: powers hazard = Σ cast hazards ÷ fighterRounds. Invisibility: +0.1 on every pHit. h = sum, capped at 1.
  Fighter's side: damage = ref.apr × pHit(ref.thac0, p.ac) × ref.damage × (1 − resist.slashing), 0 when `weaponEnchantment` exceeds the reference's (enchantment +1 per 4 levels, from Task 1); minus regeneration; fighterRounds = min(30, p.hp ÷ damage) (30 when damage ≤ 0); × 1.2 undead, × 1.15 construct, × 1.5 magic immune, else × (1 + resist.magic ÷ 2), × 1.1 spell immunity.
  Ranged duel: the archer's damage uses resist.piercing and resist.missile (the larger); the monster can be kited when movement ≤ 12 and it has no ranged attack or power: its melee never lands, the archer's damage is halved, and a confusion chance c breaks the kiting for min(1, c × fighterRounds) of the fight (weighted mix with the next case); faster: one free round of arrows (fighterRounds − 1, at least 0.5 of a round) then the melee hazard against the archer's AC and HP; a ranged monster: its hazard as in melee, kiting doesn't help.
  threat = √(melee.ratio × ranged.ratio) × (1.2 invisible at will) × 1.1^declared.
  GAME_SPELL_HAZARD (my calls): damage: average 3.5 × (level + 1) × 2 (an area: true); disable and kill: ending; other roles: average 0, not ending.

- [ ] **Step 1: Failing tests**: `pHit(19, 10)` = 0.6, `pHit(30, -5)` = 0.05, `pHit(1, 10)` = 0.95; `pFail(14, 0)` = 0.65; the ghoul profile of Task 2 against `referenceFighter(2)`: `monsterRounds` ≈ 1.057, `fighterRounds` ≈ 2.425 (24 ÷ 11.875 × 1.2), `ratio` ≈ 2.29 (toBeCloseTo, 2 digits); a monster the fighter can't hurt: `fighterRounds` 30; a profile with no attacks and no powers: `monsterRounds` 30; a movement 6 melee-only profile: ranged duel `monsterRounds` 30 (kited); the same with movement 15: finite; an AT_WILL ending power counts at most `fighterRounds` casts.
- [ ] **Step 2: Run, fail**: `npx vitest run lib/src/services/experience/threat/duel.test.ts`
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run, pass**
- [ ] **Step 5: Commit** `feat(threat): melee and ranged duels`

---

### Task 4: From threat to XP, the fit

**Files:**

- Create: `lib/src/services/experience/threat/threat-xp.ts`, `lib/src/services/experience/threat/threat-fit.ts`
- Test: `lib/src/services/experience/threat/threat-xp.test.ts`

**Interfaces:**

- Consumes: `xpForHitDiceValue`.
- Produces: `interface ThreatFit { s: number; k: number; samples: number }`; `THREAT_FIT: ThreatFit` (in threat-fit.ts, generated; initial `{ s: 1, k: 0.5, samples: 0 }`); `threatXp(hitDiceValue: number, threat: number, fit?: ThreatFit): number` (Table 31 × s × T^k, rounded to 10); `fitThreat(samples: { hitDiceValue: number; threat: number; book: number }[]): ThreatFit` (k: least-squares slope of log(book ÷ Table 31) on log T, clamped to 0.25..1; s: Σ book ÷ Σ Table 31 × T^k).

- [ ] **Step 1: Failing tests**: `threatXp(4, 1, { s: 1, k: 0.5, samples: 0 })` = 120; `threatXp(4, 4, { s: 1, k: 0.5, samples: 0 })` = 240; samples made from book = Table 31 × 2 × T^0.6 give `k` ≈ 0.6 and `s` ≈ 2; samples with a slope of 3 clamp k to 1; the fitted XP total equals the book total (toBeCloseTo).
- [ ] **Step 2: Run, fail**: `npx vitest run lib/src/services/experience/threat/threat-xp.test.ts`
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run, pass**
- [ ] **Step 5: Commit** `feat(threat): threat to XP and its fit`

---

### Task 5: The experienceSystem setting

**Files:**

- Modify: `lib/config/player-config.ts` (`experienceSystem: ExperienceSystem`, `export type ExperienceSystem = "dmg" | "threat"`, default `"dmg"`, a comment pointing to the spec) — commit only this hunk, the user's `experience2e: false` stays out
- Modify: `lib/src/services/experience/experience.service.ts` (`score()` picks the system; "as base" in threat compares `xp` and `breakdown`)
- Test: `lib/src/services/experience/experience.service.test.ts`

**Interfaces:**

- Consumes: `combatProfile`, `threat`, `threatXp`, `THREAT_FIT`.
- Produces: in threat, `score(scope)` returns an `ExperienceScore` with `hitDice`, `hitDiceValue`, `abilities: []`, `total` = the Hit Dice value, `xp` = `threatXp`, and `breakdown` in the spec's style: `duel: monster 1.06 rounds, fighter 2.43 = 2.29; archer: monster 30, archer 4.85 = 0.16; threat 0.61 → 120 × s × 0.61^k = N`.

- [ ] **Step 1: Failing tests** (setting `PLAYER_CONFIG.experienceSystem = "threat"`, restored after): a fixture file with an adjustment that raises the level scores `formula` with the threat XP and a breakdown starting `duel:`; with `experience2e: true` a base file stays `book`; a script-only adjustment is `asBase` (same threat); the default `"dmg"` rows are unchanged (the existing tests).
- [ ] **Step 2: Run, fail**: `npx vitest run lib/src/services/experience/experience.service.test.ts`
- [ ] **Step 3: Implement**
- [ ] **Step 4: Run** the service tests, then `npx vitest run` (all pass; golden unchanged in `"dmg"`).
- [ ] **Step 5: Commit** `feat(xp): experienceSystem setting, the threat system`

---

### Task 6: The fit command and the dashboard

**Files:**

- Create: `scripts/fit-threat.ts` (`npm run fit-threat`: builds the creatures, computes the base creatures' threat with both a book and an in-game XP, writes `threat-fit.ts` with `fitThreat`'s result)
- Modify: `package.json` (the script)
- Modify: `scripts/lib/experience-proposals.ts` (per base creature: melee R_m and R_f, ranged R_m and R_f, threat, threat XP; the totals line gets the threat total; the fit's s, k and samples shown; the reference fighter and archer tables from `reference.ts`; the C, D and E columns removed; `scripts/lib/experience-threat-reference.ts` deleted)
- Test: `scripts/lib/experience-proposals.test.ts`

- [ ] **Step 1: Failing test**: a fake creature with `baseScore`, `experience` rows and a threat value renders a row with its threat XP and the fit line `s = …, k = …`; the reference section lists both the fighter and the archer.
- [ ] **Step 2: Run, fail**: `npx vitest run scripts/lib/experience-proposals.test.ts`
- [ ] **Step 3: Implement**; then run `npm run fit-threat` and check `threat-fit.ts` has `samples` > 50 and k within 0.25..1.
- [ ] **Step 4: Run** `npx vitest run`, `npm run dashboard`; check the proposals view: the bears in order (black < brown < cave < polar, grizzly), the greater basilisk's ranged duel below its melee duel, the threat total close to the book total.
- [ ] **Step 5: Commit** `feat(threat): fit command, threat columns in the proposals view` (with the generated `threat-fit.ts` and `mod/docs/dashboard.html` regenerated with the user's three files set aside).

---

### Task 7: Docs

**Files:** Modify `docs/research/experience-rules.md` (a "Threat system" section: the setting, the references, the duels, the fit, pointing to the spec) and `TODO_ROADMAP.md` (the XP section: threat built, adjustments review next).

- [ ] **Step 1: Edit and commit** `docs(xp): the threat system`, removing the hook's CHANGELOG line.
