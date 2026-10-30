# At-will Powers (Rule-based Priority, Phase 3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** An at-will power gets a cooldown whenever using it costs the creature something better - its spellbook, or its melee attacks when the power is slow to cast - and vampire powers take their place in the scored cast order instead of being hand-placed.

**Architecture:** A pass after a creature's abilities are built (`AtWillService.applyCooldowns`) gives every ability casting an at-will power a `timer` when the rule below says so, whether the ability is hand-written (Death Knight) or planned. At-will = memorized `memorizedCount >= AT_WILL`, or a creature spell with that count. The vampire's Domination and Control Undead move from its hand-written list to `entries` without a position, so the planner scores them.

**Tech Stack:** TypeScript, vitest.

**Spec:** `docs/superpowers/specs/2026-10-29-rule-based-spell-priority-design.md`, section "At-will powers".

## Global Constraints

- An at-will power gets a cooldown when either (user's rules):
  - the creature has a spellbook (memorizes a spell that isn't at-will): the power takes the round's single spell slot;
  - the creature fights and the power's casting time is above what its fighting affords (`SPELL_SCORING.atWillCooldown.affordedCastingTime`): 2 in melee (`creature.attack.melee`), 4 at range only (`ranged`, rarer) - a slow power costs its attacks (Death Knight's Wall of Ice, speed 4), a fast one barely slows it (vampire Domination, speed 1). (User.)
- Otherwise no cooldown: a non-mage vampire dominates as often as needed.
- Cooldown: `timer: { name: "ATWILL_" + FILE, value: rounds * 6 }` (seconds), rounds = `atWillCooldown.base` (1) + ceil(level × `perLevel` (0.5)): Domination (level 5) 4 rounds, Wall of Ice / Darkness (level 2 or so) 2 rounds. An ability already declaring a `timer` keeps its own.
- Casting time: the database's `castingTime`, or a creature spell's first header `speed`.
- Bodhi keeps her powers as they are (unique boss): out of scope.
- No creature test files: test the service; verify creatures through the generated scripts.

## Review Focus

1. A non-mage vampire (no spellbook, melee, Domination speed 1) - expect no cooldown. Tested in Task 1.
2. Death Knight's Wall of Ice (hand-written list, melee, speed 4) - expect a cooldown. Tested in Task 1.
3. A creature that neither fights nor has a spellbook (an at-will caster only) - expect no cooldown. Tested in Task 1.
4. Two at-will powers on one creature - expect one timer each, never shared. Tested in Task 1.
5. An at-will ability already declaring its own `timer` (polymorph-like) - expect it kept. Tested in Task 1.

---

### Task 1: AtWillService.applyCooldowns

**Files:**
- Modify: `lib/config/spell-scoring.ts` (`atWillCooldown: { base: 1, perLevel: 0.5, affordedCastingTime: { melee: 2, ranged: 4 } }`)
- Create: `lib/src/services/at-will.service.ts`
- Modify: `lib/src/factories/creature.factory.ts` (call it after `resolveAbilities`)
- Test: `lib/src/services/at-will.service.test.ts`

**Interfaces:**
- Consumes: `creature.behavior.abilities` and `customCodes[].abilities` (CreatureAbility, `resource` = cast file, `timer`), `creature.data.spells` (memorized, spellbook variants), `creature.spells`, `spellProfileService.profileOf`, `AT_WILL`.
- Produces: `atWillService.applyCooldowns(creature: Creature): void`.

- [ ] **Step 1: Failing tests** (fake creatures, as in ability-order tests): melee creature with a speed-4 at-will custom spell (level 2) → its ability gets `timer { name: "ATWILL_<FILE>", value: 12 }`; melee creature with a speed-2 at-will power, no spellbook → no timer; ranged-only creature with a speed-4 power → no timer, speed 5 → timer; same creature plus a normally memorized spell → timer (`value` 24 for level 5); non-fighting creature with only at-will powers → no timer; two at-will powers → two distinct timers; an ability with its own `timer` keeps it.
- [ ] **Step 2:** `npx vitest run lib/src/services/at-will.service.test.ts` → FAIL.
- [ ] **Step 3:** Implement; wire it in `CreatureFactory` right after `resolveAbilities`.
- [ ] **Step 4:** Run → PASS; `npm run generate` → "Finished!"; the Death Knight's script checks `GlobalTimerExpired("ATWILL_...")` on Wall of Ice.
- [ ] **Step 5: Commit** - `feat(ai): cooldown for at-will powers that cost the creature something better`, mod/ included after the golden test passes.

### Task 2: Vampire powers join the scored order

**Files:**
- Modify: `lib/creatures/vampire/vampire.ts`

- [ ] **Step 1:** Control Undead declares `role: "disable"`; Domination drops its hand-set `probability: 50`.
- [ ] **Step 2:** Move `dominate` and `control` out of the plain `abilities` array into `setBehavior({ abilities: { entries: [{ abilityId: dominate.id }, { abilityId: control.id }] } })`.
- [ ] **Step 3:** `npx tsc -p . --noEmit` clean; `npm run generate` → "Finished!"; generator.log shows Domination in the vampires' "Cast order" lines; mage vampires' scripts have its cooldown, non-mage ones none.
- [ ] **Step 4:** `npx vitest run` → all green with the regenerated mod/.
- [ ] **Step 5: Commit** - `feat(vampire): Domination and Control Undead scored with the spellbook`, mod/ included.
