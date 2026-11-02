# Category Rolls and Mirror Image Counters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Spells the scored cast order places share one random roll per category (role plus delivery) so a much weaker spell is never cast while a stronger one of its kind is castable, and casters clear Mirror Image before aiming single-target spells at a mirrored enemy.

**Architecture:** `CastOrderService.plan` gains two extra passes (image counters after the opening, a last resort before shapeshifts) and gives each cast a category roll range with chances capped so they never rise within a category. `AbilityOrderService` turns those passes into abilities carrying two new build-time fields, `rollRange` and `mirrorTarget`, which `AbilityService` turns into the shared `RandomNumGT` range and a per-target-list `STATE_MIRRORIMAGE` check.

**Tech Stack:** TypeScript, vitest, ts-node generator (`npm run generate`), WeiDU BAF output in `mod/`.

**Spec:** `docs/superpowers/specs/2026-11-02-category-rolls-mirror-image-design.md`

## Global Constraints

- Game data from `C:/Games/BG2EE` only, never `C:/Games/BG2EETest`.
- Only abilities the PnP monster has; never recreate or copy another mod's resources.
- No `lib/creatures/<creature>.test.ts` files: test generic code in services and factories, check creatures through generated output.
- No `!HaveSpell` ordered lists: dependence between spells only through a shared `RandomNumGT` range.
- Weapon (700) and summon (701) shared ranges stay as they are; per-ability ranges start at 800, potions use 200-299.
- Only casts placed by `CastOrderService.plan` change. Hand-written abilities, custom codes, `insertBefore`/`insertAfter`/`insertFirst`/`insertLast` entries and the covered phase (`resolveCovered`) keep their own rolls and chances (memory `never-weaken-bosses`).
- `npm run generate` finishes with no new warning (in particular no "has a better chance than the spells above it"), `npx vitest run` passes, the golden test passes after regenerating `mod/`.
- Melee targeting is unchanged.

## Review Focus

1. A creature memorizing several copies of one remover, or a remover that is also its strongest single-target damage (Magic Missile): one counter block per file, and the regular and last-resort blocks still present.
2. A caster whose only single-target spells are removers: no last-resort block for them (their counter covers mirrored targets).
3. An at-will power entry placed by score (`scoredEntries`) that is single-target: it gets the avoid check and a last-resort copy built from its own ability, not a preset.
4. `insertBefore`/`insertAfter` anchored on a file that now appears three times in the plan: the entry lands next to the regular pass, not the counter.
5. A sequencer (`profile.combo`) of Magic Missiles: unchanged, no avoid check, no counter, no last resort.

---

### Task 1: Category roll ranges

**Files:**
- Modify: `lib/src/services/baf/memorized-checks.ts`
- Test: `lib/src/services/baf/memorized-checks.test.ts`

**Interfaces:**
- Consumes: `SpellProfile` (`lib/src/services/spell-profile.service.ts`), `sharedRoll`.
- Produces:
  - `export type SpellDelivery = "single" | "area" | "self"`
  - `export function spellDelivery(keywords: SpellKeyword[]): SpellDelivery` - `area` keyword gives `"area"`, else `castOnSelf` gives `"self"`, else `"single"`.
  - `export function categoryRoll(profile: SpellProfile): number | undefined` - the shared range of the profile's category; `undefined` for `reactive`, `summon` and `useless` roles and for any file `sharedRoll` already covers.
  - `export function isSingleTargetHostile(profile: SpellProfile): boolean` - role `damage`, `kill` or `disable`, delivery `"single"`, no `friendly` keyword, no `combo`.
  - `sharedRollOutOfOrder` covers every category range too.

- [ ] **Step 1: Write the failing tests** in `memorized-checks.test.ts` (build profiles with a small local helper over `SpellProfile`):
  - `categoryRoll` gives the same range to a `kill` single-target and a `damage` single-target profile.
  - It gives different ranges to `damage` single, `damage` area and `damage` self, and to `damage` single and `disable` single.
  - It returns `undefined` for roles `reactive`, `summon`, `useless`, and for `SPELLS.Priest.SpiritualHammer.file` (a weapon: `sharedRoll` is 700).
  - Every range it returns is in 702-799.
  - `isSingleTargetHostile` is true for `SPELLS.Wizard.FlameArrow`'s profile, false with `area`, with `castOnSelf`, with `friendly`, with role `buff`, and with `combo` set.
  - `sharedRollOutOfOrder` reports the block raising the chance on a category range: `"RandomNumGT(702,300)"` for `[[RandomNumGT(702,600)], [RandomNumGT(702,300)]]`, and `undefined` for `[[RandomNumGT(702,300)], [RandomNumGT(702,600)]]`.

- [ ] **Step 2: Run** `npx vitest run lib/src/services/baf/memorized-checks.test.ts` - Expected: FAIL, the new exports don't exist.

- [ ] **Step 3: Implement** in `memorized-checks.ts`. Ranges: `CATEGORY_ROLL_BASE = 702`, one fixed offset per `(role, delivery)` pair over the roles `protection`, `buff`, `disable`, `damage` (`kill` maps to `damage`), `shapeshift` and the three deliveries, so a category always gets the same number. Replace the `range === WEAPON_ROLL || range === SUMMON_ROLL` filter in `sharedRollOutOfOrder` with a check against the set of every shared range.

- [ ] **Step 4: Run** the same command - Expected: PASS.

- [ ] **Step 5: Commit** `feat(ai): category roll ranges`.

### Task 2: `rollRange` and `mirrorTarget` on abilities

**Files:**
- Modify: `lib/src/model/creature/ability.ts` (`RawCreatureAbility`)
- Modify: `lib/src/services/baf/ability.service.ts` (`getAbility`, `appendSpellCheckTriggers` caller)
- Test: `lib/src/services/baf/ability.service.test.ts`

**Interfaces:**
- Produces on `RawCreatureAbility`, both build-time only:
  - `rollRange?: number` - the `RandomNumGT` range to use instead of the ability's own; a `sharedRoll` range (weapons, summons) still wins.
  - `mirrorTarget?: "avoid" | "require"` - appended to every target list's `triggers` as `StateCheck(<token>, STATE_MIRRORIMAGE)`, negated for `"avoid"`.

- [ ] **Step 1: Write the failing tests:**
  - an ability `{ preset: SPELLS.Wizard.FlameArrow.file, probability: 60, rollRange: 705 }` gets `RandomNumGT(705, 282)`;
  - `{ preset: SPELLS.Priest.SpiritualHammer.file, probability: 60, rollRange: 705 }` still gets range 700;
  - `mirrorTarget: "avoid"` puts `{ name: "StateCheck", params: [ScriptTarget.token, "STATE_MIRRORIMAGE"], negation: true }` in every target list's `triggers`, and `"require"` the same without `negation`;
  - an ability without targets and `mirrorTarget: "avoid"` keeps no targets.

- [ ] **Step 2: Run** `npx vitest run lib/src/services/baf/ability.service.test.ts` - Expected: FAIL.

- [ ] **Step 3: Implement.** Document both fields on `RawCreatureAbility` in the file's comment style. In `getAbility`: `const num = sharedRoll(...) ?? ability.rollRange ?? own`; add the mirror check to the target lists next to the spell checks, before `dedupeTargetLists`.

- [ ] **Step 4: Run** the same command - Expected: PASS.

- [ ] **Step 5: Commit** `feat(ai): roll range and mirror image checks on abilities`.

### Task 3: Image removers

**Files:**
- Create: `lib/config/spells/mirror-counters.ts`
- Modify: `lib/config/presets/dispel-presets.ts` (export `KEEP_PLAYERS_DISABLED`)
- Modify: `lib/config/presets/damage-presets.ts:49-58`
- Test: `lib/src/services/baf/ability-order.service.test.ts` (covered in Task 5)

**Interfaces:**
- Produces:
  - `export interface MirrorCounter { spell: SpellReference; triggers?: Triggers.Trigger[] }`
  - `export const MIRROR_COUNTERS: MirrorCounter[]`, in the spec's order: `SPELLS.Wizard.DispelMagic` (with `triggers: KEEP_PLAYERS_DISABLED`), `SPELLS.Priest.DispelMagic`, `SPELLS.Class.DispelMagic`, `SPELLS.Wizard.RemoveMagic`, `SPELLS.Wizard.TrueSeeing`, `SPELLS.Priest.TrueSeeing`, `FNP_SPELLS.Priest.TrueSeeing`, `SPELLS.Class.TrueSight`, `SPELLS.Class.TrueSightSPCL732`, `SPELLS.Wizard.Oracle`, `SPELLS.Wizard.DetectIllusion`, `SPELLS.Wizard.MagicMissiles`, `SPELLS.Wizard.MordenkainenForceMissiles`, `SPELLS.Wizard.FlameArrow`.
  - `export const MIRRORED_ENEMY_TARGETS: TargetList[]` - one `NearestEnemies` list, `randomOrder: true`, triggers `ExcludeUnwantedTargetsTriggers` plus `triggerFactory.stateCheck("STATE_MIRRORIMAGE")`.
  - `export function mirrorCounterOf(file: string): MirrorCounter | undefined` - matches every file of the spell (`spellFiles`), case-insensitively.

- [ ] **Step 1: Create the file** with the exports above. A counter's triggers replace its preset's (True Seeing's preset waits for an invisible PC; that's not this pass's condition).
- [ ] **Step 2: Export** `KEEP_PLAYERS_DISABLED` from `dispel-presets.ts`.
- [ ] **Step 3: In `damage-presets.ts`,** give Magic Missile and Force Missiles plain `CommonTargetLists.Enemies`: their mirrored-spellcaster list would contradict the avoid check, and the counter pass replaces it.
- [ ] **Step 4: Run** `npx tsc --noEmit -p .` - Expected: no error.
- [ ] **Step 5: Commit** `feat(ai): image removers`.

### Task 4: Passes and capped chances in the cast order

**Files:**
- Modify: `lib/src/services/baf/cast-order.service.ts` (`PlannedCast`, `plan`)
- Test: `lib/src/services/baf/cast-order.service.test.ts`

**Interfaces:**
- Consumes: Task 1's `categoryRoll`, `isSingleTargetHostile`; Task 3's `mirrorCounterOf`, `MIRROR_COUNTERS`.
- Produces on `PlannedCast`:
  - `pass: "regular" | "counter" | "lastResort"`
  - `rollRange?: number`
  - `mirrorTarget?: "avoid" | "require"`

`plan` returns `[...reactive, ...opening, ...counters, ...rest, ...lastResort, ...shapeshifts]`:
- **counters:** one per memorized file with a `MIRROR_COUNTERS` entry, in that list's order, `pass: "counter"`, `rollRange: categoryRoll(profile)`, probability = the highest probability among the plan's casts sharing that range, or its own when it has none.
- **regular casts** keep today's order; `rollRange: categoryRoll(profile)` except reactive and opening casts (`undefined`); `mirrorTarget: "avoid"` when `isSingleTargetHostile(profile)` and the file isn't a remover.
- **lastResort:** a copy of every regular cast with `mirrorTarget: "avoid"`, in the same order, with `mirrorTarget: "require"`, `pass: "lastResort"`.
- **cap:** walking the final list, a cast's probability becomes the lowest of its own and every earlier probability with the same `rollRange`.

- [ ] **Step 1: Write the failing tests** (profiles built as the file's existing tests do):
  - Flame Arrow, Magic Missile and Fireball: the order is `MagicMissiles(counter), FlameArrow(counter), <regular casts>, FlameArrow(lastResort)`; Magic Missile gets no last resort; Fireball has no `mirrorTarget`.
  - Flame Arrow and Magic Missile share a `rollRange`; Fireball's differs.
  - The counter Magic Missile's probability equals the highest probability of its category.
  - With a level 8 single-target damage spell scored above a level 2 one with a higher raw probability, the level 2's planned probability is capped at the level 8's.
  - Reactive and opening casts have no `rollRange`; a summon has none either.
  - Without any mirror-related spell, the plan's files and order are the same as before (`pass: "regular"` everywhere).

- [ ] **Step 2: Run** `npx vitest run lib/src/services/baf/cast-order.service.test.ts` - Expected: FAIL.

- [ ] **Step 3: Implement** in `plan`; keep `coveredPlan` unchanged (it calls `plan` for reactive spells only: they get no `rollRange`, so it needs no change).

- [ ] **Step 4: Run** the same command - Expected: PASS.

- [ ] **Step 5: Commit** `feat(ai): category rolls and mirror image passes in the cast order`.

### Task 5: Abilities for every pass

**Files:**
- Modify: `lib/src/services/baf/ability-order.service.ts` (`resolve`)
- Test: `lib/src/services/baf/ability-order.service.test.ts`

**Interfaces:**
- Consumes: Task 4's `PlannedCast` fields, Task 2's ability fields, Task 3's `mirrorCounterOf`, `MIRRORED_ENEMY_TARGETS`.
- Produces: `OrderedAbility.identity` is the file for regular casts, `<file>#counter` and `<file>#lastResort` for the others, so anchors keep landing next to the regular pass.

Per pass:
- **regular / lastResort:** today's ability (preset, or the scored entry's own ability) plus `probability`, `rollRange` and `mirrorTarget` from the cast. The summon wait timer only on the regular pass.
- **counter:** the remover's preset ability (`ABILITY_PRESETS`, matched on the file) with `triggers` replaced by the counter's own (`[]` when it has none), `targets: MIRRORED_ENEMY_TARGETS`, `spell.resource` set to the file and no `preset` field, plus the cast's `probability` and `rollRange`.

- [ ] **Step 1: Write the failing tests:**
  - A creature memorizing Flame Arrow resolves to three Flame Arrow abilities: a counter with `targets` equal to `MIRRORED_ENEMY_TARGETS`, a regular one with `mirrorTarget: "avoid"`, a last resort with `mirrorTarget: "require"`.
  - A creature memorizing wizard Dispel Magic gets a counter whose triggers are `KEEP_PLAYERS_DISABLED`, and its reactive block is unchanged.
  - An `insertAfter` entry anchored on Flame Arrow's file lands right after the regular Flame Arrow, not after the counter.
  - A hand-written ability casting Flame Arrow (the file is in `explicitFiles`) produces no counter and no last resort.

- [ ] **Step 2: Run** `npx vitest run lib/src/services/baf/ability-order.service.test.ts` - Expected: FAIL.

- [ ] **Step 3: Implement** in `resolve`.

- [ ] **Step 4: Run** the same command - Expected: PASS.

- [ ] **Step 5: Commit** `feat(ai): abilities for the mirror image passes`.

### Task 6: Generated output

**Files:**
- Modify: `mod/` (regenerated), `lib/pnp-monster` golden data if the golden test reads it there
- Modify: memory `shared-random-roll.md`, `preset-review-roadmap.md`

- [ ] **Step 1: Run** `npm run generate` - Expected: `Finished!`, and `generator.log` has no new warning compared to before the change (save the old warning lines first and diff).
- [ ] **Step 2: Check one caster by hand** in `mod/`: a script casting Flame Arrow or Magic Missile has the counter block (`StateCheck(LastSeenBy(Myself),STATE_MIRRORIMAGE)`) before its regular attacks, the regular block with `!StateCheck(...STATE_MIRRORIMAGE)`, the last resort after every other spell block, and same-category spells sharing one `RandomNumGT` range with thresholds not decreasing down the script.
- [ ] **Step 3: Measure size:** `wc -l` on every changed `.baf`, before and after. Report the growth to the user; if a script grows by more than a third, stop and ask before going on.
- [ ] **Step 4: Run** `npx vitest run` - Expected: every test passes, golden included.
- [ ] **Step 5: Update memory:** `shared-random-roll.md` (category ranges, the cap) and the roadmap (done, and the spec's in-game tests added to "Still to test in game").
- [ ] **Step 6: Commit** `feat(ai): regenerate for category rolls and mirror image counters`.
