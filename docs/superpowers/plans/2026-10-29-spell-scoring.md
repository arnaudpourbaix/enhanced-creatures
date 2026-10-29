# Spell Scoring (Rule-based Priority, Phase 2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the hand-ordered `SPELL_PRIORITY_ORDER` with a per-creature cast order and per-spell probability computed from spell profiles (role, level, casting time, saves, keywords) and the caster's level.

**Architecture:** Spells gain a `tier` (`great`, `good`, `decent`: how valuable the spell is within its role). A profile lookup (`SpellProfileService`) gives every castable file - database, FNP, mod-created, combo, creature custom spell - one `SpellProfile`. A pure scorer (`SpellScoringService`) turns a profile and a caster reference into a score and a probability, with every weight in one tunable config. A planner builds the order (reactive first, great protections, then defensive/offensive alternation, shapeshift last, useless out) and `AbilityOrderService.resolve()` uses it instead of the list. Each creature's order is written to generator.log for review.

**Tech Stack:** TypeScript, vitest.

**Spec:** `docs/superpowers/specs/2026-10-29-rule-based-spell-priority-design.md` (sections Rules, Spell data, What it replaces). At-will brakes (cooldowns) and the protected phase are later plans: here at-will powers only get scored on the same scale.

## Global Constraints

- The randomness rolls on every cast: each ability keeps its own independent `RandomNumGT` (existing `probability` mechanism in `AbilityService`); no per-fight state.
- `reactive` spells come first, probability 100.
- `useless` spells are never cast: no ability, and no "memorized but never cast" error for them.
- `shapeshift` is never treated as a buff: placed after every other spell for now (its own rule is a later plan).
- Explicit placements (`AbilityEntry` insertBefore/insertAfter/insertFirst/insertLast) keep working on top of the computed order; enemy contingencies keep coming first; self contingencies stay precast.
- Every weight lives in `lib/config/spell-scoring.ts`, so tuning never touches logic.
- `tier`: `great`, `good` or `decent` (default, never written). The extraction guesses it for protections only; every other tier is set by hand and never overwritten. Sanctuary and Invisibility are never guessed `great` (the protected phase decides them).
- Innates and at-will powers sit on the same level scale as spells, by their own level, compared against the creature's highest spell level overall; wizard/priest spells compare against the highest level memorized in their own class.
- No creature test files: test the services; verify creatures through generator.log and the generated mod.

## Review Focus

1. A creature memorizing only innates or at-will powers (no wizard/priest book) - expect a caster reference from those levels, not a crash or division by zero. Tested in Task 3.
2. A memorized file with no profile anywhere (a spell outside every database) - expect the upfront `Memorized spell 'X' has no spell profile` error, as today's "not in the spell database". Tested in Task 2.
3. Only defensive spells memorized (or only offensive) - expect the alternation to just list them by score. Tested in Task 4.
4. Two spells with equal scores - expect a stable order (profile file name as tiebreak), so regenerating twice gives the same scripts. Tested in Task 4.
5. A sequencer whose contained spells include a `useless` or unprofiled one - expect the sequencer scored from its scorable spells only. Tested in Task 2.

---

### Task 1: Spell tiers, FNP spells and custom spells

**Files:**
- Modify: `scripts/extract-spell-profile.ts` (also profile FNP_SPELLS, written into `lib/config/spells/fnp-spell-database.ts`)
- Modify: `lib/config/spells/spell-role.ts` (`SpellTier = "great" | "good" | "decent"`), `lib/src/model/spell-item/spell-reference.ts` (`tier?: SpellTier`)
- Modify: `scripts/lib/spell-profile.ts` (`classifyTier`), `scripts/lib/spell-profile.test.ts`
- Modify: `lib/src/model/spell-item/spell-item.ts` (`BaseSpell` gains `role?: SpellRole`, `secondaryRoles?: SpellRole[]`, `tier?: SpellTier`)
- Modify: `lib/config/spells/fnp-spell-database.ts` (generated fields)
- Create: `lib/config/spells/new-spell-profiles.ts`
- Modify: `lib/creatures/vampire/vampire.ts` (Domination declares `role: "disable"`)
- Test: `lib/src/services/main.service.test.ts`

**Interfaces:**
- Produces: FNP entries carry `role`/`castingTime`/`secondaryRoles`/`duration` like SPELLS ones. `NEW_SPELL_PROFILES: Record<string, { level: number; type: SpellTypeEnum; role: SpellRole; secondaryRoles?: SpellRole[]; castingTime: number }>` keyed by NEW_SPELLS file (`jasc0000`: Symbol of Pain, level 8 wizard, `disable`, its real casting time read from its generated SPL definition). `checkSpellProfiles` also covers FNP_SPELLS and NEW_SPELL_PROFILES (every NEW_SPELLS value has an entry).

- [ ] **Step 0: Tier guess, test first.** `classifyTier(effects: RawEffect[], role: SpellRole | undefined): SpellTier | undefined` - only for `protection`: `great` for Stoneskin (218), Mirror Image (119), spell level immunity (102: Globes), weapon immunity (120: Mantles), Spell Turning (200), Spell Deflection (201) on the caster; `good` for Blur (65), projectile immunity (83), resistances (27-31, 84-89, 166) and opcode immunities (101); otherwise `decent` (returned as undefined: never written). Never `great` with Sanctuary (153) or Invisibility (20). Tests: Stoneskin → great, Globe → great, Blur → good, Shield (AC only) → undefined, Sanctuary-like (153) → not great, a damage spell → undefined. The script writes `tier` after `secondaryRoles`/`role` when the guess isn't decent; the report gets a Tier column.
- [ ] **Step 1:** Extend the script: run the same profile/report/`--write` pass over `getAllFnpSpells()` into fnp-spell-database.ts (same writer; FNP types are on the entry, so `minCasterLevel` keeps reading the SPL). Report gets a separate "Faiths and Powers" section.
- [ ] **Step 2:** Run `npx ts-node scripts/extract-spell-profile.ts --write`, prettier both databases; hand-pick any unclassified FNP spell with a `// role: hand-picked, <reason>` comment. Set the user's tiers by hand: Haste and Improved Haste `good`, Berserker Rage `great`.
- [ ] **Step 3: Failing test** in main.service.test.ts: `checkSpellProfiles` lists an FNP-shaped spell (`{ file: "D5PTEST", type: SpellTypeEnum.Priest, level: 1 }`) missing role and castingTime; lists a NEW_SPELLS file without a NEW_SPELL_PROFILES entry.
- [ ] **Step 4:** Implement: `checkSpellProfiles(spells = getAllSpells(SPELLS), fnpSpells = getAllFnpSpells(), newSpells = Object.values(NEW_SPELLS))`. Run `npx vitest run lib/src/services/main.service.test.ts` → PASS.
- [ ] **Step 5:** Add `BaseSpell.role`/`secondaryRoles` with doc comments; Domination (`domination()` in vampire.ts) declares `role: "disable"`. `npx tsc -p . --noEmit` clean; `npm run generate` → "Finished!" and `git status mod/` unchanged (nothing consumes them yet).
- [ ] **Step 6: Commit** - `feat(spells): profile FNP, mod-created and at-will spells`

### Task 2: SpellProfileService

**Files:**
- Create: `lib/src/services/spell-profile.service.ts`
- Test: `lib/src/services/spell-profile.service.test.ts`

**Interfaces:**
- Consumes: SPELLS (category → type: Wizard → `SpellTypeEnum.Wizard`, Priest → Priest, Class and Innate → Innate), FNP_SPELLS, NEW_SPELL_PROFILES, `creature.spells` (BaseSpell: level, type, role, secondaryRoles, casting time = `headers[0].speed`), `spellComboService`.
- Produces:
  ```ts
  interface SpellProfile {
    file: string; level: number; type: SpellTypeEnum; role: SpellRole;
    secondaryRoles: SpellRole[]; castingTime: number; tier: SpellTier; // decent when unset
    keywords: SpellKeyword[]; saves?: SpellSaves;
    /** sequencers: how many spells it casts at once */ spellCount: number;
  }
  spellProfileService.profileOf(file: string, creature: Creature): SpellProfile | undefined
  ```
  A database file matching a `variants[].file` takes its entry's profile. A sequencer's profile: the best-scored contained spell's profile (role, level, keywords, saves; via `SpellScoringService` is not available yet - use highest level, then role order kill > damage > disable > summon > protection > buff) with `spellCount` = number of scorable contained spells; contained `useless` or unprofiled spells are skipped. Custom spells without a role → `undefined` (entries keep today's behaviour).

- [ ] **Step 1: Failing tests**: Fireball → `{ level: 3, type: Wizard, role: "damage", castingTime: 3 }` (from the database values); a FNP file → priest profile; `jasc0000` → NEW_SPELL_PROFILES values; a variant file (spell_rev Obscuring Mist SPWI106 resolves per its entry); a creature custom spell with `role: "disable"`, level 5, header speed 1 → castingTime 1; a custom spell without role → undefined; a minor sequencer of two Magic Missiles → role damage, level 1, `spellCount: 2`; a sequencer containing a useless spell → `spellCount` counts only scorable ones; an unknown file → undefined.
- [ ] **Step 2:** Run `npx vitest run lib/src/services/spell-profile.service.test.ts` → FAIL.
- [ ] **Step 3:** Implement; build the database maps once (lazily) from SPELLS/FNP.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** - `feat(ai): one spell profile per castable file`

### Task 3: Scoring config and SpellScoringService

**Files:**
- Create: `lib/config/spell-scoring.ts`
- Create: `lib/src/services/spell-scoring.service.ts`
- Test: `lib/src/services/spell-scoring.service.test.ts`

**Interfaces:**
- Consumes: `SpellProfile` (Task 2).
- Produces:
  ```ts
  interface CasterReference { wizard?: number; priest?: number; overall: number } // highest memorized spell level
  spellScoringService.casterReference(profiles: SpellProfile[]): CasterReference
  spellScoringService.score(profile: SpellProfile, caster: CasterReference): number
  spellScoringService.probability(profile: SpellProfile, score: number): number // 1-100
  ```

Score (all constants in `SPELL_SCORING`, values below are the starting point the user tunes):
- `base` 10 + per level below the caster's best for this type: −2 for offensive roles (kill/damage/disable/summon), −1 for protection and buff (a low-level protection keeps doing its job); reference = `wizard`/`priest` for those types, `overall` for everything else, falling back to `overall` when the class reference is missing; `overall` falls back to the profile's own level when nothing is memorized.
- role: kill +2, damage 0, disable 0, summon −1 (+2 more from spell level 6), protection 0, buff −1.
- offensive (kill/damage/disable): `area` keyword +1.5; save-negated (`saves` non-empty) −1, plus −(lowest save bonus)/2 (Domination −6 → +3); `charm` keyword +1.
- casting time: + (5 − castingTime) / 2.
- +1 per secondary role; friendly area buff (`friendly` + `area`) +1.
- tier: great +3, good +1.5, decent 0. A `great` spell counts as `good` once the caster's best level for its type is `SPELL_SCORING.tierDecayGap` (4) or more above its own level (Mirror Image, level 2: great up to a best level of 5, good from 6); only great decays, by one step.
- sequencer: +1 per extra contained spell (`spellCount − 1`).

Probability: reactive 100; otherwise clamp(50 + 4 × score, 30, 90).

- [ ] **Step 1: Failing tests** (one `it` each, profiles built inline with real database levels/casting times/saves; assertions are orderings, not exact numbers):
  - level 15 wizard (wizard 7): Finger of Death > Fireball.
  - level 16+ wizard (wizard 8): Abi-Dalzim's Horrid Wilting > Finger of Death.
  - level 7 wizard (wizard 4): Minor Globe and Fireball within 2 points of each other.
  - level 7 wizard: a level 4 summon scores above every level 1-2 offensive spell, below Fireball.
  - mage vampire (wizard 8, overall 8): Domination (innate level 5, disable, charm, save −6, speed 1) within 2 points of Abi-Dalzim's; the wizard Domination spell (level 5, save 0, speed 5) more than 4 below a level 8 damage spell.
  - level 15 wizard: Magic Missile's probability < 50, Finger of Death's ≥ 85; reactive always 100.
  - same level and role: a `great` spell scores 3 above its `decent` twin, a `good` one 1.5 above.
  - Mirror Image (level 2, great): scored as great for wizard best level 5, as good for 6.
  - level 15 wizard (wizard 7): a good level 7 protection outscores Mirror Image; Mirror Image outscores a level 2 damage spell.
  - `casterReference` of only innates → `{ overall: <their max> }` and scoring an innate doesn't throw.
- [ ] **Step 2:** Run `npx vitest run lib/src/services/spell-scoring.service.test.ts` → FAIL.
- [ ] **Step 3:** Implement exactly the formula above.
- [ ] **Step 4:** Run → PASS (adjust only config values if an ordering test fails, never the tests).
- [ ] **Step 5: Commit** - `feat(ai): score spells for the cast order`

### Task 4: Cast order planner

**Files:**
- Create: `lib/src/services/baf/cast-order.service.ts`
- Test: `lib/src/services/baf/cast-order.service.test.ts`

**Interfaces:**
- Consumes: `SpellProfile`, `spellScoringService`.
- Produces:
  ```ts
  interface PlannedCast { file: string; score: number; probability: number }
  castOrderService.plan(profiles: SpellProfile[]): PlannedCast[]
  ```

Order: `reactive` (by score) → opening protections (`protection` with tier `great` or `good`, after decay, and score ≥ `SPELL_SCORING.openingProtection`, 8; by score) → the rest, merged from a defensive queue (protection, buff) and an offensive queue (kill, damage, disable, summon), each by score: take the higher head, but never two defensive in a row while offensive spells remain → `shapeshift` (by score) last. `useless` profiles are dropped. Ties: by file name.

- [ ] **Step 1: Failing tests**: reactive first at 100%; opening protections before a higher-scored damage spell; for a level 15 wizard a good level 7 protection opens before Mirror Image, which opens before any offensive spell; a decent protection never opens; after it, two buffs and two damage spells alternate (no two buffs adjacent) even when both buffs outscore the damage; only defensive spells → listed by score; shapeshift last even with the highest score; useless absent; equal scores → file name order, and `plan` twice gives the same result.
- [ ] **Step 2:** Run `npx vitest run lib/src/services/baf/cast-order.service.test.ts` → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** - `feat(ai): plan a creature's cast order`

### Task 5: Use the plan in AbilityOrderService, useless spells out

**Files:**
- Modify: `lib/src/services/baf/ability-order.service.ts` (replace `memorizedPriority`; drop the unused `sortByPriority`/`priorityIndex`)
- Modify: `lib/src/services/creature.service.ts` (`checkSpellAbilities` skips useless files)
- Modify: `lib/src/services/main.service.ts` (log each creature's plan)
- Test: `lib/src/services/baf/ability-order.service.test.ts`, `lib/src/services/creature.service.test.ts`

**Interfaces:**
- Consumes: `spellProfileService.profileOf`, `castOrderService.plan`.
- Produces: `resolve()` returns `{ preset: file, probability }` for each planned file (enemy contingencies still first, unchanged); a memorized file without profile throws `Memorized spell '<file>' has no spell profile`. Unplaced entries (no position directive) whose custom spell has a profile are inserted by score into the planned order; others are appended as today. generator.log gets, under each creature, `Cast order: <file> <name> <score> <probability>%`, one line per spell.

- [ ] **Step 1: Failing tests** (rewrite the SPELL_PRIORITY_ORDER-based ones in ability-order.service.test.ts against real database spells): a creature memorizing Fireball, Stoneskin, Cure Light Wounds and Find Traps resolves to [Cure Light Wounds 100%, Stoneskin, Fireball] with Find Traps absent; each ability carries its planned probability; an unplaced entry with a scored custom spell lands by score; an `insertFirst` entry still lands first; unknown memorized file throws "has no spell profile". creature.service.test: a memorized useless spell raises no "never be cast" error.
- [ ] **Step 2:** Run both test files → FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run → PASS; `npx vitest run` → only the golden test fails (order changed).
- [ ] **Step 5: Commit** - `feat(ai): cast spells in their scored order`

### Task 6: Retire SPELL_PRIORITY_ORDER and regenerate

**Prerequisite:** the user's in-progress combo work in `lib/config/spell-priority-order.ts`, `spell-combos.ts` and `vampire-mage.ts` is committed or set aside - this task deletes the list file. Ask before starting if it is still uncommitted.

**Files:**
- Delete: `lib/config/spell-priority-order.ts`, `lib/config/spell-priority-order.test.ts`
- Modify: `lib/src/services/main.service.ts` (drop `checkSpellPriorities` and the priority half of `checkSpellCombos`), `lib/src/services/main.service.test.ts`, docs mentioning the list (`spell-reference.ts` comment, spec "What it replaces" marked done)
- Regenerate: `mod/`

- [ ] **Step 1:** Delete and clean references; `npx tsc -p . --noEmit` clean; `grep -rn SPELL_PRIORITY_ORDER lib scripts` → only historical docs.
- [ ] **Step 2:** `npm run generate` → "Finished!", no `error:` in generator.log.
- [ ] **Step 3:** `npx vitest run` → all green, golden included (fresh mod/).
- [ ] **Step 4:** Extract the cast orders of: a level 7 wizard, a level 15 wizard, a fighter/cleric, a summoner cleric, a mage vampire (from generator.log) into the hand-off message for the user's review.
- [ ] **Step 5: Commit** - `feat(ai): rule-based cast order replaces SPELL_PRIORITY_ORDER`, mod/ included.
