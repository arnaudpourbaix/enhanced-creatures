# Variant Scripts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Variants that bring new spells or abilities get their own BAF script, so plain files
stop running spellbooks they don't have, and adding new spells outside a variant becomes a
generation error.

**Architecture:** A creature gets a *script plan*: a list of scripts (base `00`/`01`, then one per
scripted variant, `02`+). Each script carries a *view*: an object that inherits from the creature
(`Object.create(creature)`) but has its own `adjustments` (only those touching the script's files)
and its own resolved `behavior`. The existing BAF statement builder runs unchanged on each view.
WeiDU assigns each script to its files. A creature without scripted variants keeps using the
creature itself as its only view, so its output is byte-identical.

**Tech Stack:** TypeScript, vitest, ts-node generator (`npm run generate`), WeiDU output.

**Spec:** `docs/superpowers/specs/2026-11-02-variant-scripts-design.md`

## Global Constraints

- Script names: `getResourceName("b", "m", creature.id, counter)`. `00` base, `01` base summon
  (kept even when unused), scripted variants `02`, `03`… in declaration order, depth first (a
  sub-variant right after its parent). A scripted variant's summon script takes the next counter
  right after its own.
- A spell is "new" only when its file isn't already memorized by the parent (base data for a root
  variant, the parent variant's merged data otherwise). More uses of a known spell are not new.
  Removals never count.
- Files with `script.location: "None"` are exempt from the error and left out of every script's
  files and views. Summon files are not exempt.
- A file in two unrelated scripted variant chains is an error.
- Option A (user decided): in a view, explicit abilities whose cast spell no file of that script
  memorizes are dropped, except abilities with `memorizedSpellCheck: false`.
- Creatures without scripted variants: byte-identical output (golden test).
- Never weaken bosses: a converted file keeps every spell, stat and ability it has today.
- No `lib/creatures/<creature>.test.ts` files. Test generic code in factories/services.
- Variant labels stay plain strings (no `t()` keys).
- Checks per task: `npx vitest run <test files>`, `npx tsc -p . --noEmit`, `npx eslint <changed files>`.

## Review Focus

- A sub-variant without spells of its own under a scripted variant runs its parent's script, not
  the base one. Test in Task 2.
- A plain (non-variant) adjustment that renames or retunes a scripted variant's member (the
  vampire `renamed` stringRef entry covers DX#DALID) must be in that variant's view as well as the
  base view, and must not make the base view hold the variant's spells. Test in Task 3.
- A `script.location` adjustment on a variant member assigns the variant's script, not `00`.
  Test in Task 4.
- An at-will power whose cooldown depends on a spellbook (`applyCooldowns`) must be computed per
  view: the base view of a creature whose only book moved to a variant gets no `JA_SPELLBOOK`
  brake. Test in Task 3.
- Hand-written abilities mutated by `applyCooldowns` (`ability.timer = …`) must not leak between
  views: each view gets its own clones. Test in Task 3.

---

### Task 1: Variant spells, behavior and the `scripted` flag

**Files:**
- Modify: `lib/src/model/creature/variant.ts` (`VariantInput.behavior`, `Variant.behavior`, `Variant.scripted`)
- Modify: `lib/src/factories/variant.factory.ts`
- Modify: `lib/src/services/creature.service.ts` (new `declaredSpellFiles`)
- Test: `lib/src/factories/variant.factory.test.ts`, `lib/src/services/creature.service.test.ts`

**Interfaces:**
- Produces:
  - `creatureService.declaredSpellFiles(data: CreatureData): Set<string>`: uppercased files of
    `spells.memorized`, every `spells.spellbooks[].memorized`, and `spells.combos` files
    (`spellComboService.filesOf`).
  - `VariantInput.behavior?: PartialCreatureBehavior`
  - `Variant.behavior?: PartialCreatureBehavior` (this variant's own input only, not merged)
  - `Variant.scripted: boolean`
  - `Variant.newSpellFiles: string[]` (sorted, for messages and logs)

- [ ] **Step 1: Write failing tests**
  - `creature.service.test.ts` › `declaredSpellFiles` › "collects memorized, spellbook and combo files uppercased": data with `memorized: [{file:"spwi112"}]`, a spellbook with `SPWI212`, a combo → set contains `SPWI112`, `SPWI212` and the combo's files.
  - `variant.factory.test.ts`:
    - "a variant adding a spell file the base lacks is scripted": base memorizes `SPWI112`; variant data memorizes `SPWI112` and `SPWI212` → `scripted === true`, `newSpellFiles` equals `["SPWI212"]`.
    - "more uses of a base spell is not scripted": variant memorizes `SPWI112` with a higher `memorizedCount` → `scripted === false`.
    - "a variant declaring behavior is scripted": `behavior: { abilities: [] }` → `scripted === true`.
    - "a sub-variant inheriting its parent's spells is not scripted": scripted parent with `SPWI212`, child with `data: { level1: 12 }` → child `scripted === false`.
    - "an adjust entry adding a spell the variant lacks throws": message matches `/variant "necro": 'DX#DALID' adds spells SPWI212 - declare a sub-variant/`.
    - "an adjust entry giving more uses of a variant spell is allowed".

  The fake creature in `variant.factory.test.ts` needs `data.spells` (use `creatureFactory.createEmptyData()` as base). Tests that check `scripted` must not mock `setAdjustments`.

- [ ] **Step 2: Run tests, confirm they fail**

Run: `npx vitest run lib/src/factories/variant.factory.test.ts lib/src/services/creature.service.test.ts`
Expected: FAIL (`declaredSpellFiles` is not a function, `scripted` undefined).

- [ ] **Step 3: Implement**
  - `declaredSpellFiles` in `creature.service.ts`. Reuse it inside `getSpellGroups` only if that leaves its output identical. Otherwise leave `getSpellGroups` alone.
  - In `variantFactory.add`:
    - Resolve the variant's spell files with `creatureService.declaredSpellFiles(creatureFactory.getData(undefined, base, true))`.
    - Compare them against the parent's: `parent ? the parent's resolved files : declaredSpellFiles(cre.data)`, unioned with `cre.data`'s in both cases.
    - `newSpellFiles` = the difference. `scripted = newSpellFiles.length > 0 || input.behavior !== undefined`.
  - In `buildAdjustments`, for each `adjust` entry with `data`: spell files of the merged entry data minus (variant files ∪ base data files) → throw the message above when non-empty.
  - Pass `input.behavior` to the `Variant` constructor.

- [ ] **Step 4: Run tests, confirm they pass**

Run: same command. Expected: PASS. Then `npx vitest run lib/src/factories` to confirm nothing else moved.

- [ ] **Step 5: Commit**

```bash
git add lib/src/model/creature/variant.ts lib/src/factories/variant.factory.ts lib/src/factories/variant.factory.test.ts lib/src/services/creature.service.ts lib/src/services/creature.service.test.ts
git commit -m "feat(variants): detect variants bringing new spells or abilities"
```

### Task 2: Script plan

**Files:**
- Create: `lib/src/services/baf/script-plan.service.ts`
- Modify: `lib/src/model/creature/creature.ts` (field `scripts: CreatureScript[] = []`)
- Test: `lib/src/services/baf/script-plan.service.test.ts`

**Interfaces:**
- Consumes: `Variant.scripted`, `Variant.files`, `Variant.children`, `Creature.variants`, adjustments' `summon` and `data.script.location`.
- Produces:

```ts
export interface CreatureScript {
  /** e.g. "jabm4j02" */
  name: string;
  /** Present when the script has summon files: "jabm4j01" for the base, the next counter for a variant */
  summonName?: string;
  /** undefined for the base script */
  variant?: Variant;
  /** Uppercased files running `name` (for the base script, see below) */
  files: string[];
  /** Uppercased summon files running `summonName` */
  summonFiles: string[];
  /** Filled by Task 3; the creature itself when the creature has no scripted variant */
  view: Creature;
}
scriptPlanService.plan(creature: Creature): CreatureScript[]  // base first
```

Base script `files`: every creature file not claimed by a scripted variant, minus `None` files
and base summon files. Base `summonFiles`: today's summon files (summon adjustments without a
scripted variant). `summonName` for the base is always `…01`, set only when it has summon files.

- [ ] **Step 1: Write failing tests** (fake creatures built like `variant.factory.test.ts`'s)
  - "a creature without scripted variants has only the base script": one entry, name `jabm0100`, `variant` undefined.
  - "scripted variants take 02, 03 depth first": root A (scripted) with child B (scripted), root C (scripted) → names `…02` (A), `…03` (B), `…04` (C).
  - "a scripted variant's summon script takes the next counter": A has one summon file → A `summonName` `…03`, the next scripted variant gets `…04`.
  - "a non-scripted sub-variant's files run its scripted parent's script".
  - "a scripted sub-variant's files leave its parent's script".
  - "None files run no script": a member with an adjustment `script.location: "None"` is in no script's `files`.
  - "a file claimed by two unrelated scripted variants throws": `/'X' is in scripted variants "A" and "C"/`.

- [ ] **Step 2: Run, confirm FAIL** — `npx vitest run lib/src/services/baf/script-plan.service.test.ts`

- [ ] **Step 3: Implement `scriptPlanService.plan`**, with `view: creature` for every entry for now.

- [ ] **Step 4: Run, confirm PASS**

- [ ] **Step 5: Commit** — `feat(scripts): plan one script per scripted variant`

### Task 3: Script views

**Files:**
- Create: `lib/src/services/baf/script-view.service.ts`
- Modify: `lib/src/factories/creature.factory.ts` (`validate`)
- Test: `lib/src/services/baf/script-view.service.test.ts`

**Interfaces:**
- Consumes: `CreatureScript` (Task 2), `creatureFactory.resolveAbilities`, `atWillService.applyCooldowns`, `abilityService.getAbilities`, `abilityService.getCustomCodes`.
- Produces: `scriptViewService.build(creature: Creature, script: CreatureScript, handWritten: HandWrittenBehavior): Creature`, plus `snapshot(creature): HandWrittenBehavior`. That's a deep copy of `behavior` and `pendingAbilityEntries` taken before `resolveAbilities` (use `structuredClone`; if a field holds functions, copy that field by spreading arrays of cloned entries).

Flow in `creatureFactory.validate`:
1. If no variant is scripted: unchanged, then `creature.scripts = scriptPlanService.plan(creature)` (every `view` is the creature).
2. Otherwise:
   - Take the snapshot before `resolveAbilities(creature)`.
   - Keep the creature's own resolution and checks (union, for docs and `checkSpellAbilities`).
   - After `applyCooldowns`, build one view per planned script and store it in `script.view`.

A view:
- `Object.create(creature)` with own `adjustments`: adjustments having at least one file in `script.files ∪ script.summonFiles`.
- Own `behavior` / `pendingAbilityEntries`: the snapshot, then each variant in the chain root → script variant applied like `creatureFactory.setBehavior`. Ability entries from variants are **appended** to the base entries (no "already declared" throw for views).
- Then `creatureFactory.resolveAbilities(view)` and `atWillService.applyCooldowns(view)`.
- Then drop, from `abilities`, `coveredAbilities` and custom code abilities, every ability whose cast files (`creatureService.getAbilityCastFiles`) are all outside `creatureService.memorizedSpellFiles(view)`, unless it has `memorizedSpellCheck: false` or casts nothing.

- [ ] **Step 1: Write failing tests**
  - "the base view leaves out a scripted variant's spells": base `SPWI112`, variant adds `SPWI212` → `memorizedSpellFiles(baseView)` excludes `SPWI212`, `memorizedSpellFiles(variantView)` includes both.
  - "a plain adjustment on a variant member is in both views but brings no variant spell to the base": plain stringRef adjustment on `[PLAIN, NECRO]` is in both views' `adjustments`. The base view's spells exclude the variant's.
  - "a base ability for a spell only the variant memorizes is dropped from the base view": raw ability casting `SPWI212` → absent from base view's `behavior.abilities`, present in the variant view's.
  - "an ability with memorizedSpellCheck false is kept".
  - "variant behavior entries are appended to the base entries in the variant view only".
  - "views don't share mutated abilities": after building both views, setting `timer` on a base-view ability leaves the variant view's copy untouched.
  - "the base view gets no spellbook brake when the only book moved to a variant": `baseView.behavior.spellbookFiles` is undefined.

- [ ] **Step 2: Run, confirm FAIL** — `npx vitest run lib/src/services/baf/script-view.service.test.ts`
- [ ] **Step 3: Implement** `script-view.service.ts` and the `validate` wiring.
- [ ] **Step 4: Run, confirm PASS**, then `npx vitest run lib/src/factories lib/src/services/baf`.
- [ ] **Step 5: Commit** — `feat(scripts): build a creature view per script`

### Task 4: Generate and assign every script

**Files:**
- Modify: `lib/src/services/baf/baf-generator.service.ts` (`generate`, `buildContent`)
- Modify: `lib/src/services/weidu/weidu-creature.service.ts` (`compileScripts`, `patchScripts`, `getScriptName`)
- Test: `lib/src/services/baf/baf-generator.service.test.ts`, `lib/src/services/weidu/weidu-creature.service.test.ts`

**Interfaces:**
- Consumes: `creature.scripts` (Tasks 2–3).
- Produces: one `.baf` per script and summon script, `COMPILE` lines for each, and assignments.
  - Base: the current code path, with every scripted variant's files and summon files added to the base `skipFiles`.
  - Variants: per scripted variant, `patchScript({ files: script.files, script: script.name, … })` and, when summon files exist, `patchScript({ files: script.summonFiles, script: script.summonName, … })`.
  - Location adjustments use the script that runs the adjustment's files, not always `scriptName`.

Header comment: base `// <creature name>`, variant `// <creature name> (<variant label>)`. A
variant summon script has no header, like today's summon scripts. Game-tagged summon files inside
a scripted variant: throw `variant "<label>": game-tagged summon files are not supported` (YAGNI,
none exist).

- [ ] **Step 1: Write failing tests**
  - baf: "writes one file per planned script": a creature with one scripted variant writes `jabm0100.baf` and `jabm0102.baf` (spy on `utils.writeFile`). The `02` content starts with `// <name> (necro)`.
  - weidu: "compiles every planned script": output contains `COMPILE ~%MOD_FOLDER%/…/jabm0102.baf~`.
  - weidu: "the base assignment skips scripted variant files and each variant assigns its own": base `PATCH_DEFINE_ARRAY skipFiles` contains `NECRO`, followed by `PATCH_DEFINE_ARRAY files BEGIN NECRO END` and `script=jabm0102`.
  - weidu: "a location adjustment on a variant member assigns the variant script": `script=jabm0102` with `slot=`.
  - weidu: "a creature without scripted variants is unchanged": an existing snapshot-style test still passes (no new assertion needed, run the whole file).

- [ ] **Step 2: Run, confirm FAIL** — `npx vitest run lib/src/services/baf/baf-generator.service.test.ts lib/src/services/weidu/weidu-creature.service.test.ts`
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run, confirm PASS.** Then run the golden test: `npx vitest run lib/src/services/pipeline.golden.test.ts`. Expected PASS: no creature has a scripted variant yet. If it fails before your change, regenerate on a clean commit first (memory `verify-generator-refactor`).
- [ ] **Step 5: Commit** — `feat(scripts): generate and assign one script per scripted variant`

### Task 5: The error for spells outside variants

**Files:**
- Modify: `lib/src/services/creature.service.ts` (new `checkAdjustmentSpells`)
- Modify: `lib/src/factories/creature.factory.ts` (`validate`: call it next to `creatureService.check`; it throws)
- Test: `lib/src/services/creature.service.test.ts`

**Interfaces:**
- Consumes: `declaredSpellFiles` (Task 1).
- Produces: `creatureService.checkAdjustmentSpells(creature: Creature): void`. For each adjustment without `variant` whose files aren't all `None`-script files, `declaredSpellFiles(a.data)` minus `declaredSpellFiles(creature.data)` must be empty. Otherwise throw:
  `<creature name>: adjustment for 'F1, F2' adds spells SPWI212, SPWI412 - declare a variant so they get their own script`.

- [ ] **Step 1: Write failing tests**
  - "throws when a plain adjustment adds a spell file the base lacks" (message above).
  - "allows more uses of a base spell" (SPCL321 in both).
  - "allows spells on files that run no script" (adjustment with `script.location: "None"` on the same files).
  - "ignores variant adjustments" (an adjustment with `variant` set).
- [ ] **Step 2: Run, confirm FAIL.**
- [ ] **Step 3: Implement and wire it into `validate`.**
- [ ] **Step 4: Run, confirm PASS.** Then `npm run generate` and list the `Failed to build` lines in `generator.log`: these are the offenders for Task 6. **Don't commit `mod/` yet.**
- [ ] **Step 5: Commit** the code only — `feat(variants): refuse new spells outside a variant`

### Task 6: Convert the offenders

**Files:** the creature files behind each `Failed to build` line from Task 5. The spec's table lists
the expected ones:

| Creature | Likely file |
|---|---|
| vampires 4j (DX#DALID), 4m, 4o (Bodhi) | `lib/creatures/vampire/vampire.ts`, `lib/creatures/vampire/bodhi.ts` |
| skeleton-monster, archer-skeleton, skeleton | `lib/creatures/skeleton/*.ts` |
| ogre-mage | `lib/creatures/ogre/ogre-mage.ts` |
| sirine | `lib/creatures/fey/sirine.ts` |
| zombie | `lib/creatures/zombie.ts` |
| sword-spider | `lib/creatures/spider/sword-spider.ts` |

ogre-berserker and half-ogre (SPCL321 uses) are expected **not** to fail. If they do, the "new
spell" rule is wrong: stop and fix Task 1/5, don't convert them.

For each offender:
- Move the spell-bringing adjustment into `cre.variant(label, { files, data, adjust })`, with a plain English label (e.g. `"necromancer"` for DX#DALID).
- Files sharing one spell set share a variant. Files with different new spells get separate variants or sub-variants.
- Keep non-spell fields where they are.

- [ ] **Step 1: Baseline.** On the commit before Task 5, in a separate worktree, run `npm run generate` and keep its `mod/lib/pnp-monster` tree as the baseline (memory `verify-generator-refactor`: one consistent reference point, no bare `git stash`).
- [ ] **Step 2: Convert one creature, regenerate, check.** `npm run generate`, then:
  - no `Failed to build` for it;
  - diff its `.tpa` against the baseline. Only the script assignment lines (`skipFiles`, `files`, `script=`, `COMPILE`) and the move of its patch blocks may change, with every `ADD_MEMORIZED_SPELL`, stat write and item line still present for every file;
  - its new `jabm<id>02.baf` exists, and `00` shrank.
- [ ] **Step 3: Repeat Step 2** for every offender, committing each creature separately: `refactor(<creature>): spellcasting files as a scripted variant`.
- [ ] **Step 4: Measure.** `wc -l mod/lib/pnp-monster/vampire/*.baf`. Expected: `jabm4j00` about 10k lines, DX#DALID's `jabm4j02` about 52k. Same pattern for 4m and 4o. Write the before/after line counts into the final commit message.
- [ ] **Step 5: Commit regenerated `mod/`** — `chore: regenerate mod with variant scripts`. Then run the golden test: PASS.

### Task 7: Remove the shared-script spellbook brake if dead

**Files:** `lib/src/services/at-will.service.ts`, `lib/src/services/baf/statement-builder.service.ts` (`spellbookCheck`), `lib/src/model/creature/behavior.ts` (`spellbookFiles`) and their tests.

- [ ] **Step 1:** `grep -rl JA_SPELLBOOK mod/lib/pnp-monster`. If any script still uses it, stop here: keep the mechanism, and say which creature uses it in the final report.
- [ ] **Step 2:** If none does, remove `spellbookFiles`, `spellbookCheck`, `SPELLBOOK_GLOBAL` and the `unlessGlobalUnset: SPELLBOOK_GLOBAL` branch of `applyCooldowns`. Also remove the tests covering them, and replace them with one test: "an at-will power gets no cooldown from a spellbook it lacks".
- [ ] **Step 3:** `npx vitest run`, `npx tsc -p . --noEmit`, `npm run generate`, then the golden test after committing `mod/`. Expected: no `.baf` change.
- [ ] **Step 4: Commit** — `refactor(at-will): drop the shared-script spellbook brake`

### Task 8: Wrap up

- [ ] Update memory `creature-variants.md`: variants with new spells or `behavior` get their own script (`02`+), new spells outside variants are an error, `None` files are exempt, and views drop unmemorized abilities.
- [ ] Full checks: `npx vitest run`, `npx tsc -p . --noEmit`, `npx eslint lib`.
