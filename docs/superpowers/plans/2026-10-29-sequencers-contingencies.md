# Sequencers and Contingencies Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wizards built from a spellbook automatically get the sequencers and contingencies their
caster level allows, picked from a shared registry. In game these are generated SPLs.

**Architecture:**
- A registry (`SPELL_COMBOS`) of named entries, each one of 4 kinds.
- Picking happens inside `spellService.buildMemorized`. Each pick adds one memorized innate SPL
  per entry (on top of the caster's slots), per mod variant.
- The SPLs are generated once (`spellComboService`) and written into `core.tpa`.
- Script side:
  - Sequencers are ordinary memorized abilities with a generated preset.
  - Self contingencies are precast.
  - Enemy contingencies are first-priority abilities gated by their condition.

**Tech Stack:** TypeScript, vitest, WeiDU output (`npm run generate`).

**Spec:** [docs/superpowers/specs/2026-10-29-sequencers-contingencies-design.md](../specs/2026-10-29-sequencers-contingencies-design.md)

## Global Constraints

- Kind rules (caster level / contained spells):
  - minor sequencer: CL 7, exactly 2 spells of level 1–2;
  - spell sequencer: CL 13, exactly 3 spells of level 1–4;
  - contingency: CL 12, exactly 1 spell of level ≤ floor(CL ÷ 3), and never above 8;
  - chain contingency: CL 18, 1–3 spells of level 1–8.
- The CL thresholds are derived from `MageSpellTable`: the first caster level with a slot of spell
  level 4 / 7 / 6 / 9 respectively. A test pins them to 7 / 13 / 12 / 18.
- At most one pick per kind per caster.
- Picked entries never take a spell slot. They are memorized as **innate** level-1 SPLs, on top of
  the slots.
- Contained spells are never memorized.
- Contingency conditions are exactly `hit`, `seeEnemy`, `hp50`, `hp25`, `hp10`, `helpless`,
  `poisoned` (the existing `ContingencyTrigger` type).
- Engine condition texts, which `getCastSpellOnConditionValue` already maps:
  - `hit` → `HitBy([ANYONE])`
  - `seeEnemy` → `See([EVILCUTOFF])`
  - `hp50` → `HPPercentLT(Myself,50)`, and the same for `hp25` and `hp10`
  - `helpless` → `StateCheck(Myself,STATE_HELPLESS)`
  - `poisoned` → `StateCheck(Myself,STATE_POISONED)`
- Generated combo SPL names: `getResourceName("s", "c", 1, counter)`, i.e. `jasc01NN`. The
  counter goes in registry order, then in `spellBookVariants` order for distinct per-mod content.
  Owner `00` stays reserved for `NEW_SPELLS`.
- Never copy another mod's spells (SCS included).
- Never add `lib/creatures/<creature>.test.ts`. Test generic code in services and factories, and
  verify creatures through generated output.
- New translation keys renumber `.tra` strings mod-wide. Only add the 2 needed
  (`ability.Contingency`, `ability.ChainContingency`). `ability.MinorSequencer` and
  `ability.Sequencer` already exist.

## Review Focus

1. **Picking per adjustment:** a creature whose adjustments rebuild the same book at a different
   CL (vampire D9BGUARD CL 14 vs DX#DALID CL 16) must get each CRE's own picks, not the base
   monster's. Covered by a test in Task 3.
2. **Fallback to the next entry:** a contingency whose spell is level 5 must be skipped at CL 12–14
   and the next entry picked. When nothing fits, a warning must say which kind and which CL.
   Covered in Task 3.
3. **Different files per mod:** a contained spell that resolves to different files in Vanilla and
   AllSpellMods must yield 2 SPLs with different contents, not one shared SPL. Covered in Task 2.
4. **Contingency not yet triggered:** an already-cast self contingency must not be recast while
   still pending. It must be removed from memory on cast and only come back after rest. Covered in
   Task 5.
5. **Mixed targets:** a self buff mixed with an enemy spell in one entry must stop generation with
   an error naming the entry. Covered in Task 4.

---

### Task 1: Registry model, helpers and static validation

**Files:**
- Create: `lib/src/model/spell-item/spell-combo.ts`
- Create: `lib/config/spells/spell-combos.ts`
- Test: `lib/src/model/spell-item/spell-combo.test.ts`

**Interfaces:**
- Produces, in `spell-combo.ts`:
  - `type SpellComboKind = "minorSequencer" | "spellSequencer" | "contingency" | "chainContingency"`
  - `interface SpellCombo { key: string; kind: SpellComboKind; spells: SpellReference[]; condition?: ContingencyTrigger }`.
    `key` is the registry key, filled in by `registerCombos`.
  - Helpers `minorSequencer(spells)`, `spellSequencer(spells)`, `contingency(condition, spells)` and
    `chainContingency(condition, spells)`, each returning `Omit<SpellCombo, "key">`. The doc comment
    on `contingency` holds the CL → max level table (12–14 → 4, 15–17 → 5, 18–20 → 6, 21–23 → 7,
    24+ → 8).
  - `COMBO_RULES: Record<SpellComboKind, { spellLevel: number; minCasterLevel: number; count: [min, max]; maxContainedLevel: number }>`.
    `minCasterLevel` is derived from `MageSpellTable`.
  - `contingencyMaxLevel(casterLevel: number): number`, which returns `Math.min(8, Math.floor(casterLevel / 3))`.
  - `validateCombo(combo: SpellCombo): void`, which throws on: wrong count, a spell without
    `level`, a contained level over `maxContainedLevel`, or a missing or unknown `condition` (or a
    condition on a sequencer).
  - `registerCombos(entries: Record<string, Omit<SpellCombo,"key">>): Record<string, SpellCombo>`.
    It sets `key`, runs `validateCombo`, and throws on duplicates: same kind, same spell files in
    order, same condition.
- Produces, in `spell-combos.ts`, matching the spec:
  - `SEQUENCERS = registerCombos({ DoubleMagicMissiles: minorSequencer([s.MagicMissiles, s.MagicMissiles]) })`.
    This is the one seed entry, used end to end in Task 6.
  - `CONTINGENCIES = registerCombos({})`.
  - `SPELL_COMBOS = [...Object.values(SEQUENCERS), ...Object.values(CONTINGENCIES)]`. Duplicate
    detection runs over this combined list too.
  - Later tasks iterate `SPELL_COMBOS`.
- `ContingencyTrigger` moves from `spellcaster.ts` to `spell-combo.ts`.

- [ ] **Step 1: Write the failing tests** in `spell-combo.test.ts`:
  - `COMBO_RULES` `minCasterLevel` equals `{ minorSequencer: 7, spellSequencer: 13, contingency: 12, chainContingency: 18 }`.
  - `contingencyMaxLevel`: 12 → 4, 14 → 4, 15 → 5, 18 → 6, 30 → 8.
  - `validateCombo` throws for:
    - a minor sequencer of 3 spells;
    - a minor sequencer containing `SPELLS.Wizard.Slow` (level 3);
    - a spell sequencer containing a level-5 spell;
    - a contingency with 2 spells;
    - a contingency holding a level-9 spell;
    - a chain contingency with 4 spells;
    - a contingency with no condition;
    - a sequencer with a condition.
  - `validateCombo` accepts `minorSequencer([MagicMissiles, MagicMissiles])`.
  - `registerCombos` throws on 2 entries `minorSequencer([MM, MM])` under different keys, and does
    not throw for the same spells with different kinds or conditions.
- [ ] **Step 2: Run** `npx vitest run lib/src/model/spell-item/spell-combo.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3: Implement** `spell-combo.ts` and `spell-combos.ts` as above.
- [ ] **Step 4: Run** the same command. Expected: PASS.
- [ ] **Step 5: Commit** `feat(combos): spell combo registry and validation`.

### Task 2: Generated combo SPLs

**Files:**
- Create: `lib/src/services/spell-combo.service.ts`
- Modify: `lib/src/services/weidu/weidu-core.service.ts` (new `generateSpellCombos()`)
- Modify: `lib/src/services/main.service.ts` (call it in `generateCommonCode` before `writeFile`)
- Modify: `lib/translations/en/ability.ts` (add `Contingency`, `ChainContingency`)
- Test: `lib/src/services/spell-combo.service.test.ts`

**Interfaces:**
- Consumes: `SpellCombo`, `SPELL_COMBOS` (Task 1); `resolveForMod`, `MOD_LAYER_ORDER`;
  `spellService.getSpell`; `getResourceName`.
- Produces: `spellComboService` with:
  - `comboFile(combo: SpellCombo, mod: SpellbookModName): string`. It returns the SPL a caster
    memorizes for this combo under `mod`. Built lazily and cached, keyed by
    `combo.key + resolved files`, so mods with identical content share one SPL.
  - `isSelf(combo: SpellCombo): boolean`. A stub returning `false` until Task 4 replaces it.
  - `allSpells(): Spell[]`, which returns every generated SPL, for writing.
  - `comboOfFile(file: string): SpellCombo | undefined`.
  - `reset()`, for tests.
- SPL shapes:
  - All SPLs are innate, level 1, `name` = `ability.MinorSequencer` / `ability.Sequencer` /
    `ability.Contingency` / `ability.ChainContingency`.
  - **Sequencer:** one header whose effects are one `EffectTypeEnum.CastSpell` per contained
    spell (type `CastInstantlyAtCasterLevel`) in listed order, plus the release visual. The header
    targets the caster when `isSelf`, otherwise a creature at range = the smallest `range` among
    the contained spells, or 30 when none is set.
  - **Self contingency:** a set-up SPL targeting the caster, with one `CastSpellOnCondition`
    effect (`conditionTarget` Myself, `condition` text from Global Constraints, permanent until
    triggered). Its resource is a wrapper SPL whose header casts the contained spells as above.
    `comboFile` returns the set-up SPL.
  - **Enemy contingency:** only the wrapper SPL. It is shaped like a sequencer, targets a
    creature, and is the one `comboFile` returns.

- [ ] **Step 1: Write the failing tests:**
  - `comboFile` of `DoubleMagicMissiles` for `"Vanilla"` matches `/^jasc01[0-9a-z]{2}$/` and
    equals the result for `"AllSpellMods"`.
  - A test combo whose spell has a `variants` entry for AllSpellMods returns 2 different files,
    and each SPL's `CastSpell` resources equal that mod's resolved file.
  - The sequencer SPL has 2 `CastSpell` effects with resource `SPWI112` (Magic Missile's file), in
    order.
  - A self-target contingency (stub `isSelf` → true via `vi.spyOn`) gives a set-up SPL with
    exactly one `CastSpellOnCondition` effect whose `parameter2` is `"3"` for `hp25`, and whose
    resource is a second SPL with the `CastSpell` effects.
  - `allSpells()` contains each generated SPL once.
- [ ] **Step 2: Run** `npx vitest run lib/src/services/spell-combo.service.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `spellComboService`, `weiduCoreService.generateSpellCombos()` (one
  `weiduSpellService.createSpell(lines, spell, 0)` per `allSpells()` entry) and the 2 translation
  keys.
- [ ] **Step 4: Run** the test file and `npx vitest run lib/src/services/weidu`. Expected: PASS.
- [ ] **Step 5: Commit** `feat(combos): generate sequencer and contingency spells`.

### Task 3: Picking in spellbooks and on creatures

**Files:**
- Modify: `lib/src/model/spell-item/spellbook.ts` (`SpellBook.sequencers?: SpellCombo[]` and
  `SpellBook.contingencies?: SpellCombo[]`, each ordered by preference; `pickCombos` receives
  their concatenation)
- Modify: `lib/src/services/spell.service.ts` (`buildMemorized` and `createSpellbook(s)`)
- Modify: `lib/src/model/creature/data.ts` (creature spells data: `combos?: SpellCombo[]`)
- Modify: `lib/src/services/weidu/weidu-creature.service.ts` (memorize declared `combos` as-is)
- Test: `lib/src/services/spell.service.test.ts`

**Interfaces:**
- Consumes: `COMBO_RULES`, `contingencyMaxLevel` (Task 1); `spellComboService.comboFile` (Task 2).
- Produces: `spellService.pickCombos(combos: SpellCombo[], casterLevel: number, mod: SpellbookModName, bookName: string): MemorizedSpell[]`.
  - It returns at most one `{ file, memorizedCount: 1 }` per kind: the first entry of that kind that
    fits.
  - For a kind the CL allows with no fitting entry, it calls `logService.warn(\`${bookName}: caster level ${cl} allows a ${kind} but none fits\`)`.
  - `buildMemorized` calls it only for `type === "mage"`, with the variant's mod, and appends the
    result.
  - The warning fires for every mage book, including books with no `combos`.
- Creature-declared `combos` (no spellbook): `weidu-creature.service` memorizes
  `comboFile(combo, mod)` for each, per mod variant, with no level check.

- [ ] **Step 1: Write the failing tests** (on a test book with `combos`):
  - At CL 12, `[contingency(hp50,[a level-5 spell]), contingency(hp50,[Stoneskin])]` picks the
    Stoneskin one.
  - At CL 15 it picks the first.
  - At CL 6, nothing is picked and there's no warning.
  - At CL 13, the result has one minor-sequencer file and one sequencer file.
  - A book without combos at CL 13 warns twice (minor sequencer, sequencer), checked with
    `vi.spyOn(logService, "warn")`.
  - `createSpellbooks` for the same book at CL 14 and at CL 16 returns different memorized combo
    files when the only contingency holds a level-5 spell (absent at 14, present at 16). This
    proves picks follow each adjustment's CL.
  - Combo files are memorized with `memorizedCount: 1` and don't change the count of any normal
    slot (compare against the same book without combos).
- [ ] **Step 2: Run** `npx vitest run lib/src/services/spell.service.test.ts`. Expected: FAIL.
- [ ] **Step 3: Implement** `pickCombos`, the `buildMemorized` wiring, `SpellBook.combos`, and the
  creature `combos` emission.
- [ ] **Step 4: Run** the test file. Expected: PASS.
- [ ] **Step 5: Commit** `feat(combos): pick sequencers and contingencies by caster level`.

### Task 4: Target classification, combo presets and target validation

**Files:**
- Modify: `lib/src/services/spell-combo.service.ts` (real `isSelf`, `checkTargets`)
- Modify: `lib/src/factories/preset.factory.ts` (`createCombos`)
- Modify: `lib/config/ability-presets.ts` (append combo presets)
- Modify: `lib/src/services/main.service.ts` (`checkSpellCombos()` in `generateAll`, after
  `checkPresets`)
- Test: `lib/src/services/spell-combo.service.test.ts`, `lib/src/factories/preset.factory.test.ts`

**Interfaces:**
- Consumes: the other preset arrays (not `ABILITY_PRESETS` itself, to avoid a cycle).
- Produces:
  - `spellComboService.isSelf(combo, presets)`. A spell is **self** when its preset has no
    `targets`, sets `spell.castOnSelf`, has the `castOnSelf` keyword, or when every one of its
    target-list names starts with `Myself` (e.g. `MyselfAndNearestAllies`). Otherwise it is
    **enemy**.
  - `spellComboService.checkTargets(combo, presets): void`.
    - It throws `\`Spell combo ${key} mixes self and enemy spells\`` when a combo has both.
    - It warns when an enemy combo's spells have different preset `targets` lists (compared by
      their names). Repeating the same spell never warns.
  - `presetFactory.createCombos(combos: SpellCombo[], presets: AbilityPreset[]): AbilityPreset[]`
    gives one preset per generated combo file.
    - Self: no targets, with `spell.castOnSelf: true`.
    - Enemy: the first contained spell's preset `targets`, `keywords` = union of the contained
      spells', `level` = highest contained level, `saves` = `mergeSaves` of all.
    - All of them: `spellcasting: true`, `requireVocal: false`, `spell.type: "force"`,
      `spell.remove: true`.
    - Enemy contingencies also get the condition triggers listed in Task 5.
    - Self contingency set-up files get no preset; Task 5 precasts them.

- [ ] **Step 1: Write the failing tests:**
  - `isSelf` is true for `[ImprovedInvisibility]` and `[Stoneskin]`, and false for
    `[MagicMissiles]` and `[Horror]`.
  - `checkTargets` throws for `minorSequencer([Shield, Horror])`, warns for
    `spellSequencer([Slow, Contagion, Horror])`, and stays silent for `[MagicMissiles, MagicMissiles]`.
  - The enemy combo preset for `[Slow(3), Horror(2)]` has `level` 3, and its `keywords` contain each
    spell's keywords.
- [ ] **Step 2: Run** the 2 test files. Expected: FAIL.
- [ ] **Step 3: Implement** them, wire the presets into `ABILITY_PRESETS`, and add
  `checkSpellCombos()`, which runs `checkTargets` over `SPELL_COMBOS`.
- [ ] **Step 4: Run** the 2 test files. Expected: PASS.
- [ ] **Step 5: Commit** `feat(combos): combo presets and target validation`.

### Task 5: Script: precast self contingencies, condition-gated enemy contingencies, priority errors

**Files:**
- Modify: `lib/src/services/baf/statement-builder.service.ts` (new handler `precastContingencies`,
  registered right before `precastLongDurationSpells`)
- Modify: `lib/src/services/baf/ability-order.service.ts`
- Modify: `lib/src/services/main.service.ts` (`checkSpellCombos` also checks the priority order)
- Test: `lib/src/services/baf/statement-builder.service.test.ts`,
  `lib/src/services/baf/ability-order.service.test.ts`

**Interfaces:**
- Consumes: `spellComboService.comboOfFile`, `isSelf`, `comboFile` (Tasks 2 and 4).
- Produces:
  - **`precastContingencies`:** for each self-contingency file memorized by the creature or any
    adjustment, it emits a block:
    - triggers: `Global(disableSpellcasting,0)` and `HaveSpellRES(file)`. No precast global, so a
      contingency still pending isn't recast: the SPL is gone until rest.
    - actions: `ReallyForceSpellRES(file, Myself)`, `RemoveSpellRES(file)`, `Continue`.
  - **Enemy contingency abilities:** their preset triggers by condition:
    - `hit` → `HitBy([ANYONE], 0)` (the `DamageIdentifier` for any damage; check `triggers.ts`)
    - `seeEnemy` → `See(NearestEnemyOf(Myself))`
    - `hp50` / `hp25` / `hp10` → `HPPercentLT(Myself, 50 / 25 / 10)`
    - `helpless` → `StateCheck(Myself, STATE_HELPLESS)`
    - `poisoned` → `StateCheck(Myself, STATE_POISONED)`
  - **`AbilityOrderService.resolve`:** enemy-contingency files sort before everything else.
  - **`checkSpellCombos`:** an error when a sequencer combo file is missing from
    `SPELL_PRIORITY_ORDER`.

- [ ] **Step 1: Write the failing tests:**
  - A creature with a memorized self-contingency file gets a statement with exactly those triggers
    and actions, placed before the first long-duration precast statement.
  - An enemy contingency on `hp25` produces an ability whose triggers include
    `HPPercentLT(Myself,25)`, resolved first by `AbilityOrderService`.
  - `checkSpellCombos` throws for a sequencer file missing from `SPELL_PRIORITY_ORDER`.
- [ ] **Step 2: Run** the 2 test files. Expected: FAIL.
- [ ] **Step 3: Implement** them, and add the `DoubleMagicMissiles` file(s) to
  `SPELL_PRIORITY_ORDER` right after `SPELLS.Wizard.MagicMissiles.file`, through
  `spellComboService.comboFile` for each mod in `MOD_LAYER_ORDER`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS, except the golden test, which is handled in Task 6.
- [ ] **Step 5: Commit** `feat(combos): script contingencies and sequencer priority`.

### Task 6: Remove old code, generate, verify

**Files:**
- Delete: `lib/src/model/creature/spellcaster.ts`, and `behavior.spellcaster` in `behavior.ts`
- Modify: `lib/src/services/baf/ability.service.ts` (remove `getMinorSequencer`, `getSequencer`,
  `generateSequencer`, their tests in `ability.service.test.ts`, and `RawCreatureSequencerAbility`
  with its `parseAbilitySpells` path)
- Modify: `lib/src/model/creature/creature-group.ts` (remove `sequencer`/`minorSequencer`)
- Modify: `lib/config/generate.ts` (remove the `minorSequencer` / `sequencer` constants)

- [ ] **Step 1:** Remove the code above. Run `npm run build` and `npm run lint`. Expected: no errors.
- [ ] **Step 2:** Run `npm run generate`. Expected: success.
  - `generator.log` shows the missing-combo warnings for the mage books at CL 7+.
  - `core.tpa` contains the `DoubleMagicMissiles` SPL.
  - No creature memorizes it, since no book references it yet.
- [ ] **Step 3:** Run `npm test`. The golden test changes only by `core.tpa`'s new SPL. Inspect the
  diff, and update the golden only if that's the sole difference.
- [ ] **Step 4:** Temporarily add `sequencers: [SEQUENCERS.DoubleMagicMissiles]` to
  `VampireNecromancerSpellbook`, then generate. Check that DX#DALID (CL 16) memorizes the
  `jasc01..` file as innate and that its script has the sequencer block, ordered right after Magic
  Missile. Revert the change. This is a manual end-to-end check; adding references to books is
  out of scope.
- [ ] **Step 5: Commit** `refactor(combos): drop the old sequencer helpers`.
