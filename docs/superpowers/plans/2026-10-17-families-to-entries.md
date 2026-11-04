# Families → Entries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entries replace families as the unit that builds creatures; kins own material shared by
several entries; types own code behavior (turn level, hit dice). Families disappear.

**Architecture:** A framework (`CreatureEntry`, `CreatureKin`, registries, type modules, index
generation) is added alongside families; families are migrated in batches with a shared recipe and
a normalised output comparison after each batch; then type behaviors move, families are removed,
and `copy` learns entries and kins.

**Tech Stack:** TypeScript, vitest, Python 3 (verification scripts in the scratchpad).

**Spec:** `docs/superpowers/specs/2026-10-17-families-to-entries-design.md`
**Migration recipe (read by Tasks 3–7):** `docs/superpowers/plans/2026-10-17-families-to-entries-recipe.md`

## Global Constraints

- Entry = one monster in several versions; every creature belongs to exactly one entry. Kin exists
  only when several entries share code or resources. Types own code only.
- Scopes: `m` monster, `e` entry, `k` kin, `c` common; `f` removed at the end (Task 9).
- Code layout: `lib/creatures/<kin>/kin.ts` + `<entry-kebab>.ts`; kin-less `lib/creatures/<entry-kebab>.ts`;
  types `lib/creatures/types/<type>.ts`; registries `lib/creatures/kins.ts`, `lib/creatures/entries.ts`.
- Mod layout: `mod/lib/pnp-monster/kin/<kin>/` (generated `main.tpa`, hand-written `common.tpa`,
  `assets/`); `mod/lib/pnp-monster/<entry-kebab>/` (generated `main.tpa`, `<code>.tpa`, `jabm*.baf`,
  `assets/`); `pnp-monster/common/` unchanged; generated `pnp-monster/index.tpa` (kins then entries,
  registry order) and `pnp-monster/index.json` (entry → kin or null).
- Values, creation orders and translation keys preserved. Only Task 8 may change gameplay, and only:
  wyverns ×3, Wraith Spider, Dread Wolf, Vampiric Wolf → d12; those 3 creatures + zombie-ankheg
  adjustments turnable.
- Every task: normalised output comparison against the previous task's dump; `npx tsc -p . --noEmit`;
  scoped eslint; `npx prettier --check --end-of-line auto`; `git mv` for hand-written files; never
  `git stash`; full suite green except the pre-existing `pipeline.golden.test.ts` setup failure.

## Review Focus

- A creature built twice (still in a family and in an entry) or not at all during migration →
  duplicate or missing `<code>.tpa`. Covered by the normaliser (MISSING/EXTRA) every task.
- Install order inside an entry (base before variants) → Task 3–7 normaliser checks the entry's
  `main.tpa` order.
- A moved asset referenced by an old path in a hand-written tpa → install failure. Grep each task.
- Copy `--entry` forgetting the entry's kin → missing shared spells. Test in Task 10.
- Turn level on an adjustment adding undead to a non-undead base. Test in Task 8.

---

### Task 1: Harness, baseline, normaliser v2

**Files (untracked):** `lib/src/services/output-manifest.tmp.test.ts` (from sub-project 3: full
pipeline into a temp dir, `MANIFEST_OUT`, `MANIFEST_DUMP_DIR`); `$SCRATCH/normalise_entries.py`.

- [ ] Harness as in sub-project 3 (copies `mod/lib/pnp-monster`, `mod/CHANGELOG.md`,
      `mod/enhanced_creatures.tp2` into the temp dir). **Clear the generated files of the copied
      `lib/pnp-monster` tree before generating** (keep only `common.tpa`, `assets/`, `common/`), so the
      dump holds exactly what this run generates.
- [ ] Baseline: `MANIFEST_DUMP_DIR=$SCRATCH/fe-dump-0`.
- [ ] `normalise_entries.py BEFORE AFTER --map MAP.json`: compares trees after mapping. MAP.json
      holds `paths` (old relative path prefix or file → new) and `names` (old resource name → new).
      Rules built in: a `lib/pnp-monster/<x>/<code>.tpa` or `jabm<code>NN.baf` file is matched by file
      name across folders when no explicit path mapping exists (codes are unique); `main.tpa` files are
      compared as the **union of their INCLUDE lines** across all `main.tpa`/`index.tpa` (order checked
      per entry `main.tpa` only); `index.tpa`/`index.json` are listed but not compared. Prints MISSING,
      EXTRA, DIFF with a short diff; exits 1 on any.
- [ ] Sanity: normaliser on `fe-dump-0` vs itself → identical.

No commit.

---

### Task 2: Framework alongside families

**Files:**

- Create: `lib/creatures/kin.ts` (`KinEnum`), extend `lib/creatures/entry.ts` (`EntryEnum` for
  every creature, `ENTRY_NAMES`, `ENTRY_FOLDERS` = kebab-case of the key), `lib/src/model/creature/entry.ts`
  (`CreatureEntry`), `lib/src/model/creature/kin.ts` (`CreatureKin`), `lib/creatures/kins.ts`,
  `lib/creatures/entries.ts` (empty registries), `lib/src/services/creature-type-hooks.service.ts`
  (type registry, no hooks yet), `lib/src/services/weidu/weidu-index.service.ts` (index.tpa/json).
- Modify: `lib/src/services/utils/misc.func.ts` (`ResourceScope` gains `k`), `abstract-creature.ts`
  (`fileType` typed as `ResourceScope`), `main.service.ts` (after families: generate kins then
  entries, then the index), `documentation.service.ts` (accept entries' creatures like families'),
  `mod/enhanced_creatures.tp2` (add `INCLUDE "%MOD_FOLDER%/lib/pnp-monster/index.tpa"` after the
  family INCLUDE lines in component 999).
- Tests for each new unit.

**Interfaces (produced):**

```ts
// lib/creatures/kin.ts
export enum KinEnum {
  Bear = 1,
  Cat,
  Construct,
  Dog,
  Fey,
  Golem,
  Ogre,
  Ooze,
  Spider,
  Wolf,
  Ghoul,
  Skeleton,
  Spectral,
  Zombie,
}
export const KIN_FOLDERS: Record<KinEnum, string>; // "bear", "cat", ...

// lib/creatures/entry.ts (existing ids 1-9 kept, single entries appended from 10)
export enum EntryEnum {
  Basilisk = 1,
  ClayGolem = 2,
  /* ... */ Zombie = 9,
  Ankheg = 10 /* every other creature */,
}
export const ENTRY_NAMES: Record<EntryEnum, TranslationKey>; // single entries: the creature's name key
export const ENTRY_FOLDERS: Record<EntryEnum, string>; // kebab-case: "clay-golem"

// lib/src/model/creature/kin.ts
export abstract class CreatureKin extends AbstractCreature {
  // fileType "k"; id = KinEnum
  constructor(id: KinEnum);
}
// lib/src/model/creature/entry.ts
export abstract class CreatureEntry<T extends Creature> extends AbstractCreature implements Family {
  // fileType "e"; id = EntryEnum; same create/createFrom/addCreature/creature()/spell()/item()
  // API as CreatureFamily (move the shared logic into a base both extend, don't duplicate it)
  constructor(id: EntryEnum, kin?: CreatureKin);
  kin?: CreatureKin;
  abstract createCreature(id: MonsterEnum): T;
}
// lib/creatures/kins.ts / entries.ts
export const kinFactories: (() => CreatureKin)[] = [];
export const entryFactories: ((kins: Map<KinEnum, CreatureKin>) => CreatureEntry<Creature>)[] = [];
```

- `Creature.entry` (exists) is set by `CreatureEntry` for its members.
- Generation of an entry/kin writes into `ENTRY_FOLDERS`/`KIN_FOLDERS` paths
  (`lib/pnp-monster/<folder>/`, `lib/pnp-monster/kin/<folder>/`) through the same weidu services
  families use: extract a "folder" parameter instead of `getFamilyFolder(family)` (keep
  `getFamilyFolder` working for families until Task 9). The generated-files cleaner runs on entry and
  kin folders too, and a folder's hand-written `common.tpa` is included in its `main.tpa` the same
  way family folders do today.
- `ENTRY_NAMES` for the 9 existing entries keep their `doc.entry.*` keys; new single entries use the
  creature's name key (no new translations).

- [ ] TDD: tests for `CreatureEntry` (build, scope `e` names, members stamped with `entry`),
      `CreatureKin` (scope `k` names), index generation (order: kins then entries; json map),
      `ENTRY_FOLDERS` kebab-case, registries empty → output unchanged.
- [ ] Verify: dump `fe-dump-2`; normaliser vs `fe-dump-0` → identical apart from the new
      (empty-ish) `index.tpa`/`index.json` and the tp2 line.
- [ ] Commit `feat: entry/kin framework alongside families`.

---

### Task 3: Migrate kin-less families

Families: Ankheg, Basilisk, Carrion Crawler, Ettercap, Ettin, Minotaur, Plant (Treant), Snake,
Wyvern. Delete Elementals (empty family: no creature). Apply the recipe. Basilisk's petrification
spell + projectile become entry-scoped (`e`). Snake: its `assets/jacm3701.cre` stays with the Giant
Poisonous Snake entry; Treant's template with Treant.

- [ ] Recipe steps 1–5; dump `fe-dump-3`; normaliser vs `fe-dump-2` with the map → identical.
- [ ] Commit `refactor: kin-less families become entries`.

### Task 4: Migrate Bear, Cat, Dog, Wolf

Kins per the recipe (expected: Bear kin with its shared spell; Cat kin with leap/pounce/paws subclass;
Dog, Wolf kins with their subclasses — confirm each by the sharing rule). Wolf `assets/` and Cat
`common.tpa` move per recipe step 3.

- [ ] Recipe; dump `fe-dump-4`; normaliser vs `fe-dump-3` → identical.
- [ ] Commit `refactor: bears, cats, dogs, wolves become kins and entries`.

### Task 5: Migrate Construct, Golem, Ogre

Construct kin owns its 4 items (`f06` → `k`); Clay Golem and Stone Golem entries keep their members
and order; Ogre kin from `lib/creatures/ogres/`.

- [ ] Recipe; dump `fe-dump-5`; normaliser vs `fe-dump-4` → identical.
- [ ] Commit `refactor: constructs, golems, ogres become kins and entries`.

### Task 6: Migrate Fey, Ooze, Spider

Fey kin owns its 13 spells (`f08` → `k`) and the fey `common.tpa` + icons/vvc; Ooze kin owns its
spell (`f0c` → `k`) and split/pseudopod subclass; its `assets/` creature templates go to the entries
that use them. Spider kin.

- [ ] Recipe; dump `fe-dump-6`; normaliser vs `fe-dump-5` → identical.
- [ ] Commit `refactor: feys, oozes, spiders become kins and entries`.

### Task 7: Migrate Undead

Kins Ghoul, Skeleton, Spectral, Zombie by the sharing rule, reading `ghouls.ts`, `skeletons.ts`,
`skeletons-warrior.ts`, `spectral.ts`, `zombies.ts` (note: `zombies.ts` also defines Wight); single
entries Mummy, Vampire, Death Knight, Wight and any undead without shared code. The `Undead`
subclass stays for now (Task 8 removes it) — kins/entries may use it. `UndeadFamily.afterBuild`
(turn level) must keep running for exactly the same creatures: call `applyTurnLevel` from each
undead entry's `afterBuild` for now. `undead/common.tpa` content: Symbol of Pain include and the
`jaaf0i00` icon go to the Death Knight entry (its own hand-written `common.tpa` in its folder, which
the generator includes like family `common.tpa` today); each `.baf` in `undead/assets/` to the entry
whose creature uses that game script (grep the creature files' script lists; list the mapping).

- [ ] Recipe; dump `fe-dump-7`; normaliser vs `fe-dump-6` → identical.
- [ ] Commit `refactor: undead become kins and entries`.

### Task 8: Type behaviors

**Files:** `lib/creatures/types/undead.ts` (hook: `applyTurnLevel`; helpers moved from the `Undead`
subclass: `createTouch`, `createClaws`, `createJaws` as functions on a `Creature` via
`addNaturalWeapon`), `creature-type-hooks.service.ts` (run `afterBuild` for each of the creature's
types, in `TYPE_TRAITS` order; `hitDie` per type), `lib/src/model/game-data/hp.ts` (type rows only:
fey 6, undead 12, dragon 12, ooze 10, construct 10, magicalBeast 10), `hit-point.service.ts` (largest
die among the creature's derived types; adjustments use the base creature), `turn-level.ts`
(also adjustments that add `undead` to a non-undead creature), `Creature.turnAs?` (moved from
`Undead`), undead entries (drop their temporary `applyTurnLevel` calls and the `Undead` subclass).

- [ ] TDD: hook runs once per type; largest die wins (Wraith Spider → 12); adjustment adding undead
      gets a turn level (fixture: non-undead base + adjustment with `immunities: ["undead"]`).
- [ ] Verify: dump `fe-dump-8`; normaliser vs `fe-dump-7`: the only differences are HP/hit-dice and
      turn-level fields of Wyvern, Baby Wyvern, Greater Wyvern, Wraith Spider, Dread Wolf, Vampiric
      Wolf, and the zombie-ankheg adjustments' turn level. List each diff in the report.
- [ ] Commit `feat: type-driven hit dice and turn level`.

### Task 9: Remove families

Remove `MonsterFamilyEnum`, `CreatureFamily`, `Creature.family`, `utils.getFamilyFolder`,
`familyFactories`, `Creature.validate(family)`'s family check, `ResourceScope` `f`, the family loop
in `main.service.ts`, `weiduFamilyService` family-only code (keep what entries/kins use, renamed if
needed). Root tp2 component 999: replace the family INCLUDE lines with the single index INCLUDE
(keep `common/common.tpa`). Delete old family folders under `mod/lib/pnp-monster/` (now empty of
hand-written files; `git rm`). Scheme test scopes `[mekc]`. Update `lib/src/services/copy.service.ts`
only enough to compile (Task 10 redoes it).

- [ ] Dump `fe-dump-9`; normaliser vs `fe-dump-8` → identical except tp2/index lines.
- [ ] Commit `refactor: remove families`.

### Task 10: Copy `--entry` / `--kin`

`copy.service.ts` + `lib/src/index.ts`: filters on `index.tpa` lines using `index.json` (entry → kin).
`--entry <names>` keeps those entries plus their kins; `--kin <names>` keeps kins plus their
entries; `--monster` filters creature lines in the kept entries' `main.tpa` (and implies their
entries + kins); `--family` removed; unknown names → error listing valid ones. Names = folder names
(kebab-case), case-insensitive.

- [ ] TDD with fixtures (index.tpa, index.json, two entries, one kin). Test: `--entry dryad` keeps the
      `fey` kin line.
- [ ] Commit `feat: copy --entry and --kin`.

### Task 11: Finish

- [ ] CHANGELOG `[Unreleased]`: gameplay changes of Task 8; internal layout change note for mod
      authors is not needed (players don't see it).
- [ ] `npm run generate`; commit regenerated `mod/` (`git status` must show moves into entry/kin
      folders, no hand-written file lost).
- [ ] Full suite, tsc, scoped eslint, prettier. Delete the harness. Roadmap sub-project 4 ✅.
- [ ] Commit `chore: regenerate mod; sub-project 4 done`.
