# Spell Profile Data (Rule-based Priority, Phase 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every SPELLS database entry a `castingTime` and an auto-classified `role`, and fill `duration` for protections, buffs and summons, extracted from a game install into spell-database.ts for the user to review.

**Architecture:** A pure library (`scripts/lib/spell-profile.ts`) reads SPL casting speed and effect durations and classifies a role from effect opcodes + existing keywords, with the evidence behind each guess. A script (`scripts/extract-spell-profile.ts`), modelled on `scripts/extract-spell-saves.ts`, writes a review report and, with `--write`, adds the fields to entries that don't declare them (never overwriting). The generator then checks every database entry has the data. Scoring rules, at-will brakes and the protected phase are later plans; `SPELL_PRIORITY_ORDER` stays untouched here.

**Tech Stack:** TypeScript, ts-node, vitest.

**Spec:** `docs/superpowers/specs/2026-10-29-rule-based-spell-priority-design.md` (section "Spell data").

## Global Constraints

- Roles: `reactive`, `protection`, `buff`, `disable`, `summon`, `damage` (more only if classification needs them, flagged in the report).
- Extracted duration reuses the existing `duration` field (`long` = hours, `mid` = turns, `short` = rounds to one turn), filled **only for `protection`, `buff` and `summon` roles**: `duration` also drives precasting (`StatementBuilderService.precastSpells`), which is right for those (Stoneskin, Animate Dead's 8 hours) and wrong for offensive spells (Web). Newly `long` entries become precast: an intended change, listed in the report for review. (User's decision.)
- `--write` never overwrites a declared field: declared values are the user's decisions.
- Default game dir `C:/Games/BG2EETest`, overridable with `--game <dir>` (as extract-spell-saves).
- Read both states: BIFs only (vanilla) and with override (modded); variant files only exist modded.
- No creature test files; test the library, verify data via the report.

## Review Focus

1. A spell whose real effects are relayed (opcode 146/148/326 cast spell, 177 apply EFF) - expect role and duration from the relayed effects, as `saveEffects` already follows relays. Tested in Task 2.
2. A spell with both damage and a disable (e.g. a cloud that damages and slows) - expect `damage` (Task 3 rule order), with both evidences listed so the user can overrule it. Tested in Task 3.
3. A self-cast spell that plays visuals plus one real buff opcode - expect visuals ignored, role from the real opcode. Tested in Task 3.
4. A spell with several extended headers (per caster level) whose casting speed differs - expect the first (lowest-level) header's value, and the report's "Casting time spread" section to list it.
5. An entry whose modded spell differs from vanilla (Spell Revisions) - expect the modded state's profile, and the report's "States disagree" section to list it.

---

### Task 1: Spell profile fields on SpellReference

**Files:**
- Create: `lib/config/spells/spell-role.ts`
- Modify: `lib/src/model/spell-item/spell-reference.ts:97-101`

**Interfaces:**
- Produces: `export type SpellRole = "reactive" | "protection" | "buff" | "disable" | "summon" | "damage";` and `export type SpellDurationClass = "long" | "mid" | "short";` in spell-role.ts. `SpellReference` gains `castingTime?: number` and `role?: SpellRole`; the existing `duration` field's type becomes `SpellDurationClass` (same values).

- [ ] **Step 1: Add the types and fields**, each field with a doc comment: `castingTime` = SPL casting speed (lower is faster; also interruption risk), extend `duration`'s comment: also used by the priority rules, only set on protection/buff/summon spells since it drives precasting, `role` = what the spell is for in the cast order (auto-classified by scripts/extract-spell-profile.ts, reviewed by hand).
- [ ] **Step 2: Typecheck** - Run: `npx tsc -p . --noEmit` - Expected: no output.
- [ ] **Step 3: Commit** - `feat(spells): add castingTime and role to spell references`

### Task 2: Read casting time and effect durations from SPL/EFF

**Files:**
- Modify: `scripts/lib/spell-saves.ts` (RawEffect, readSplEffects, readEffEffect)
- Create: `scripts/lib/spell-profile.ts`
- Test: `scripts/lib/spell-saves.test.ts`, `scripts/lib/spell-profile.test.ts`

**Interfaces:**
- Produces: `RawEffect` gains `timingMode: number` and `duration: number` (seconds). In spell-profile.ts: `readSplCastingTimes(spl: Buffer): number[]` (one per extended header, header order); `durationClass(seconds: number): SpellDurationClass | undefined`; `spellEffects(source: EffectSource, file: string): RawEffect[] | undefined` - the spell's effects with relays followed (same relay rules as `saveEffects`, effects not reduced to saves).

SPL offsets: extended header casting speed is a word at header + 0x12. Feature block: timing mode byte at fx + 0x0C, duration dword at fx + 0x0E. EFF V2.0: timing mode dword at 0x24, duration dword at 0x28.

- [ ] **Step 1: Write the failing tests**
  - spell-saves.test.ts: extend the `effect()` helper defaults with `timingMode: 0, duration: 0`; add `it("reads each effect's timing mode and duration")` building an SPL buffer (reuse the file's existing buffer builder, or add one) with one effect `timingMode 0, duration 60` and asserting `readSplEffects(buf)[0]` has `{ timingMode: 0, duration: 60 }`; same for an EFF buffer at 0x24/0x28.
  - spell-profile.test.ts:
    - `readSplCastingTimes` returns `[3, 1]` for an SPL with two headers of speed 3 and 1.
    - `durationClass`: `undefined` for 0 (instant), `"short"` for 6 and 60, `"mid"` for 61 and 299, `"long"` for 300 and 3600 (thresholds: short ≤ 60 s = one turn, long ≥ 300 s = one game hour).
    - `spellEffects` follows a 146 relay to another SPL and a 177 relay to an EFF, and doesn't loop on a cycle.
- [ ] **Step 2: Run** `npx vitest run scripts/lib/spell-saves.test.ts scripts/lib/spell-profile.test.ts` - Expected: FAIL (missing fields/exports).
- [ ] **Step 3: Implement.** Extract the relay-following of `saveEffects` into a shared `followRelays(source, effects, seen): RawEffect[]` in spell-saves.ts and have both `saveEffects` and `spellEffects` use it, so the relay rules (including the GENDER filter skip) live in one place.
- [ ] **Step 4: Run** the same command - Expected: PASS, and `npx vitest run scripts` all green.
- [ ] **Step 5: Commit** - `feat(scripts): read SPL casting times and effect durations`

### Task 3: Role classification

**Files:**
- Modify: `lib/src/model/spell-item/effect.type.ts` (add missing opcodes)
- Modify: `scripts/lib/spell-profile.ts`
- Test: `scripts/lib/spell-profile.test.ts`

**Interfaces:**
- Consumes: `RawEffect`, `SpellRole`, `SpellKeyword`.
- Produces: `classifyRole(effects: RawEffect[], keywords: SpellKeyword[]): { role: SpellRole | undefined; evidence: string[] }`. `evidence` lists what matched, e.g. `["opcode 12 Damage (enemy)", "keyword area"]`.

Add to `EffectTypeEnum` the opcodes the classifier needs that are missing (verify each against IESDP before adding): CurrentHPBonus 17, Silence 38, Paralyze 109, RemoveInvisibility 116, MirrorImage 119, SummonMonsters 127, Sanctuary 153, MagicResistanceBonus 166, HoldII 185, SpellTurning 200, SpellDeflection 201, Imprisonment 211, Stoneskin 218, SummonCreature2DA 331, ProjectileImmunity 83.

Rules, first match wins (effects on the caster = target 1, or any effect when the spell has `castOnSelf`/`friendly`, count as "self"):
1. `reactive`: keyword `cureWounds` or `curePoison`; or opcodes CurrentHPBonus, DispelEffects, RemoveInvisibility, InvisibilityDetection, Teleport.
2. `summon`: SummonCreature, SummonMonsters, SummonCreature2DA.
3. Self effects: `protection` if any of ProtectionFromWeapons, ProtectionFromSpellLevels, ProtectionFromOpcode, ProtectionFromSpell, SpellTurning, SpellDeflection, Stoneskin, MirrorImage, Blur, Invisibility, Sanctuary, ProjectileImmunity, ArmorClassBonus, MagicResistanceBonus; else `buff` if any other non-cosmetic self effect.
4. Enemy effects: `damage` if Damage or KillTarget/DeathKill60HP; else `disable` if any of CharmCreature, CharmControlCreature, Sleep, Sleep20HP, Stun, Stun90HP, Silence, Blindness, Feeblemindedness, Confusion, Hold, HoldII, Paralyze, Slow, Panic, Petrification, Web, EntangleOverlay, Maze, Imprisonment.
5. Otherwise `undefined` (report lists it as unclassified for the user).

Cosmetic opcodes (PlayVisualEffect 215, 141 lighting, 174 sound, 139 display string, 142 portrait icon) never count.

- [ ] **Step 1: Write failing tests**, one `it` per rule: Fireball-like (12 enemy + `area`) → `damage`; Finger-of-Death-like (13) → `damage`; Hold Person-like (175) → `disable`; Stoneskin-like (218 self) → `protection`; Draw-Upon-Holy-Might-like (44 + 278 self) → `buff`; Monster Summoning-like (127) → `summon`; Cure-Light-Wounds-like (17 + keyword cureWounds) → `reactive`; Dispel Magic (58) → `reactive`; only 215 + 174 → `undefined`; evidence for Fireball-like contains `"opcode 12 Damage (enemy)"`; damage + Slow (12 + 40 enemy) → `damage` with evidence listing both opcodes; self 215 + 44 → `buff` with no evidence for 215.
- [ ] **Step 2: Run** `npx vitest run scripts/lib/spell-profile.test.ts` - Expected: FAIL.
- [ ] **Step 3: Implement `classifyRole`** as specified.
- [ ] **Step 4: Run** - Expected: PASS.
- [ ] **Step 5: Commit** - `feat(scripts): classify spell roles from their effects`

### Task 4: Extraction script, report and database writer

**Files:**
- Create: `scripts/extract-spell-profile.ts`
- Create: `scripts/lib/spell-database-writer.ts`
- Modify: `scripts/lib/spell-saves.ts` (`addSavesToDatabase` delegates to the writer)
- Test: `scripts/lib/spell-database-writer.test.ts` (move the `addSavesToDatabase` placement tests' logic here; keep one delegation test in spell-saves.test.ts)

**Interfaces:**
- Produces: `addFieldToDatabase(database: string, field: string, values: Map<string, string>): string` - for each file → TS source value, inserts `    <field>: <value>,` after the entry's `level` line (or last), skipping entries that already declare `<field>`; throws when a file is owned by 0 or several entries (same contract as today's `addSavesToDatabase`).
- Script output: `assets/spells/spell-profile-report.md`; with `--write`, adds `castingTime` and `role` to entries lacking them, and `duration` to entries lacking it whose role (declared, or just classified) is `protection`, `buff` or `summon`.

Per entry the script takes, for each file (own then variants), modded state when present, else vanilla: casting time = first header's (lowest level) speed; duration = class of the longest non-permanent duration (timing mode 0) across non-cosmetic effects; role = `classifyRole(spellEffects, entry.keywords ?? [])`.

Report sections, in order: "Unclassified" (no role), "States disagree" (vanilla vs modded role or casting time differ), "Casting time spread" (headers differ), "Duration vs declared" (where `duration` is declared and the extracted class differs - calibration for the thresholds), "Newly precast" (entries that `--write` makes `long`, or `mid`, which precasting will pick up), then "All entries" table: Spell | File | Role | Evidence | Casting time | Extracted duration | Declared duration.

- [ ] **Step 1: Write failing writer tests**: inserts after `level`; inserts last without `level`; skips an entry already declaring the field; throws for a file owned by two entries.
- [ ] **Step 2: Run** `npx vitest run scripts/lib/spell-database-writer.test.ts` - Expected: FAIL.
- [ ] **Step 3: Implement** `addFieldToDatabase`, make `addSavesToDatabase` call it with `savesSource`, then write the script (arguments as extract-spell-saves: `[--write] [--game <dir>]`).
- [ ] **Step 4: Run** `npx vitest run scripts` - Expected: PASS. Then `npx ts-node scripts/extract-spell-profile.ts` - Expected: prints counts (entries, unclassified, disagreeing) and writes the report.
- [ ] **Step 5: Commit** script, libs, tests and the report - `feat(scripts): extract spell casting time, duration and role`

### Task 5: Fill the database and check it upfront

**Files:**
- Modify: `lib/config/spells/spell-database.ts` (generated by `--write`)
- Modify: `lib/src/services/main.service.ts` (new check), `lib/src/services/main.service.test.ts`

**Interfaces:**
- Produces: `MainService.checkSpellProfiles(spells: SpellReference[] = getAllSpells(SPELLS))`, called in `generateAll` right after `checkSpellPriorities`. Throws when any entry lacks `role` or `castingTime`, message `Spells missing role/castingTime (N):` then one line per entry `  - <file> (<id>): role, castingTime` naming only what's missing. `duration` is not checked (offensive and instant spells have none).

- [ ] **Step 1: Run** `npx ts-node scripts/extract-spell-profile.ts --write`, then `npx prettier --write lib/config/spells/spell-database.ts`.
- [ ] **Step 2: Fill by hand** the entries still missing a role (the report's "Unclassified" section) with the most plausible role, each with a `// role: hand-picked, <reason>` comment, so the check can pass; list them for the user.
- [ ] **Step 3: Write failing tests** for `checkSpellProfiles`: accepts a complete entry; lists two incomplete entries one per line naming the missing fields. Add `checkSpellProfiles` to the `stubPipeline` spies in the `generateAll` tests.
- [ ] **Step 4: Run** `npx vitest run lib/src/services/main.service.test.ts` - Expected: FAIL, then implement, then PASS.
- [ ] **Step 5: Verify** `npm run generate` finishes with "Finished!" and `git diff --stat mod/` changes only precast statements of creatures memorizing a "Newly precast" spell (`role`/`castingTime` aren't consumed yet), and `npx vitest run` has no new failures.
- [ ] **Step 6: Commit** - `feat(spells): profile every database spell and check it upfront`

**Hand-off to the user:** point them at `assets/spells/spell-profile-report.md` (Unclassified / States disagree / Duration vs declared first) and the hand-picked roles; their corrections go straight into spell-database.ts. Phase 2 (scoring rules replacing `SPELL_PRIORITY_ORDER`, covering FNP_SPELLS, NEW_SPELLS, sequencers and at-will powers' effective level) is planned after that review.
