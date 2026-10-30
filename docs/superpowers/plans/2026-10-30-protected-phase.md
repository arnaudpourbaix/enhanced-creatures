# Protected Phase (Rule-based Priority, Phase 4) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Under Sanctuary or Invisibility, a caster first casts its protections and buffs - most valuable first, short ones last - without attacking in between, and only then acts (breaking the cover).

**Architecture:** `CastOrderService.coveredPlan()` orders a creature's protections and buffs for the covered phase. `AbilityOrderService.resolve()` stores them as `creature.behavior.coveredAbilities` when the creature memorizes a cover spell. A new statement builder handler, right before the creature's abilities, writes them with a "covered" trigger, then a hold that stops the creature from attacking between those casts.

**Tech Stack:** TypeScript, vitest.

**Spec:** `docs/superpowers/specs/2026-10-29-rule-based-spell-priority-design.md`, section "Protected phase".

## Global Constraints

- Covered = `StateCheck(Myself, STATE_INVISIBLE)` or `CheckStatGT(Myself, 0, SANCTUARY)` (the stat the scripts already check on targets; it also catches an ally's Sanctuary). (User.)
- Covered block: protections and buffs (roles `protection`, `buff`) the creature casts, except `long` durations (precast before combat). Most valuable first (highest score); at an equal score, `mid` before `short` (short buffs like Draw Upon Holy Might land last, still active when the fight resumes). The random skip applies (each keeps its planned probability).
- Hold: while covered and the round timer is running (a spell was just cast), the creature does nothing - no attack, which would break the cover. Once no protective spell is left, it acts as usual: its first spell or attack ends the cover.
- Only creatures memorizing a cover spell (Sanctuary, Invisibility, Invisibility Sphere, Mass Invisibility - `COVER_SPELLS`, by database entry) get the block: no script growth elsewhere.
- At-will cover (attack once great protections are up) is left out: no creature has a cover both at will and broken by attacking (the moon dog's Improved Invisibility isn't). Kept in the spec.
- No creature test files.

## Review Focus

1. A creature memorizing a cover spell but no protection or buff - expect no covered block and no hold (nothing to wait for). Tested in Task 2.
2. The cover spell itself (Invisibility is a protection) - expect it left out of the covered block: casting it again while covered is pointless. Tested in Task 1.
3. Reactive spells (healing) - expect them unaffected: still first in the normal order, also while covered. Tested in Task 3 (hold only while the round timer runs).
4. Two protections with equal scores but mid vs short duration - expect mid first. Tested in Task 1.
5. Long-duration buffs (Stoneskin) - expect them out of the covered block (precast). Tested in Task 1.

---

### Task 1: Covered plan

**Files:**
- Modify: `lib/src/services/spell-profile.service.ts` (`SpellProfile.duration?: SpellDurationClass`, from the entry's `duration`)
- Modify: `lib/src/services/baf/cast-order.service.ts`
- Create: `lib/config/spells/cover-spells.ts` (`COVER_SPELLS: string[]`, the four files with their variants)
- Test: `lib/src/services/baf/cast-order.service.test.ts`, `lib/src/services/spell-profile.service.test.ts`

**Interfaces:**
- Produces: `castOrderService.coveredPlan(profiles: SpellProfile[]): PlannedCast[]` - protections and buffs, not long, not cover spells; score desc, then mid before short (undefined duration after short), then file.

- [ ] **Step 1: Failing tests:** profile carries Stoneskin's `duration: "long"`; coveredPlan keeps only protection/buff, drops a long one and Invisibility itself, orders by score, then mid before short at an equal score.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement. **Step 4:** Run → PASS.
- [ ] **Step 5: Commit** - `feat(ai): plan the covered phase's protections and buffs`

### Task 2: Covered abilities on the creature

**Files:**
- Modify: `lib/src/model/creature/behavior.ts` (or wherever `CreatureBehavior` lives: `coveredAbilities: CreatureAbility[]`, default `[]`)
- Modify: `lib/src/services/baf/ability-order.service.ts` (`resolveCovered(creature): RawCreatureAbility[]`)
- Modify: `lib/src/factories/creature.factory.ts` (fill `behavior.coveredAbilities` after `resolveAbilities`, before at-will cooldowns so they get theirs)
- Modify: `lib/src/services/at-will.service.ts` (also covers `coveredAbilities`)
- Test: `lib/src/services/baf/ability-order.service.test.ts`

**Interfaces:**
- Produces: `abilityOrderService.resolveCovered(creature): RawCreatureAbility[]` - `{ preset: file, probability }` per covered cast, `[]` without a memorized cover spell or without protection/buff.

- [ ] **Step 1: Failing tests:** a creature memorizing Sanctuary, Bless and Draw Upon Holy Might gets both buffs (Draw Upon Holy Might last); without Sanctuary, none; with Sanctuary but no protection/buff, none.
- [ ] **Step 2-4:** RED, implement, GREEN.
- [ ] **Step 5: Commit** - `feat(ai): covered abilities for creatures with a cover spell`

### Task 3: Covered block and hold in the script

**Files:**
- Modify: `lib/src/services/baf/statement-builder.service.ts` (handler `coveredAbilities`, executed right before `creatureAbilities`)
- Modify: `lib/src/factories/trigger.factory.ts` (`covered(): Triggers.Trigger` - the Or of both checks)
- Test: `lib/src/services/baf/statement-builder.service.test.ts`

**Interfaces:**
- Consumes: `creature.behavior.coveredAbilities` (CreatureAbility, built like the others).

- [ ] **Step 1: Failing tests:** each covered ability's statement carries the covered trigger; after them, a hold statement `IF covered, GlobalTimerNotExpired(round) THEN NoAction`; no block and no hold without covered abilities.
- [ ] **Step 2-4:** RED, implement (reuse `parseAbilities` with the extra trigger), GREEN.
- [ ] **Step 5:** `npm run generate` → "Finished!"; a Sanctuary cleric's script shows the covered block before its abilities; `npx vitest run` green with the regenerated mod/.
- [ ] **Step 6: Commit** - `feat(ai): under cover, protect and buff before acting`, mod/ included.
