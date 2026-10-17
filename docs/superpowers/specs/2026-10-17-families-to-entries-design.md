# Families → entries: design

Sub-project 4 of the [monster entries & types roadmap](2026-10-16-monster-entries-roadmap.md).
Brainstormed 2026-10-17.

## Goal

Make the code match the docs: the **entry** (one monster in several versions) becomes the unit that
builds creatures, everywhere. Material shared by several entries belongs to a **kin**. Behavior
shared by a whole creature type (turn level, hit dice) belongs to the **type**. Families
(`MonsterFamilyEnum`, `CreatureFamily`) disappear.

Chosen over a lighter "keep families as kins" option for the exact one-to-one match between docs
and code and folder-per-entry navigation.

## Model

### Entries

- `EntryEnum` covers **every** creature (~100 values, stable numeric ids). The 9 existing
  multi-member entries keep their ids; single-member entries are appended.
- `CreatureEntry<T extends Creature>` replaces `CreatureFamily<T>`: same building API (`create`,
  `createFrom`, `addCreature`, `createCreature(id)`); members in declaration order (= install
  order).
- Entry-owned spells/items/projectiles use scope `e` and the entry's code (e.g. the Basilisk's
  petrification `jase0100`).
- Optional `kin?: KinEnum`.

### Kins

- A kin exists **only when several entries really share code or resources**. Starting point from
  today's families: Bear, Cat, Construct, Dog, Fey, Golem, Ogre, Ooze, Spider, Wolf; Undead splits
  into Ghoul (Ghoul, Ghast), Skeleton (Skeleton, Archer Skeleton, Skeleton Monster, Baneguard,
  Bonebat, Skeleton Warrior?), Spectral (Banshee, Spectre, Ghost, Wraith, Shadow?), Zombie (Zombie,
  Ju-ju Zombie, Sea Zombie). The exact undead membership is fixed in the plan by reading what each
  file actually shares.
- No kin (single entries): Ankheg, Basilisk, Carrion Crawler, Ettercap, Ettin, Minotaur, Treant,
  Giant Poisonous Snake, Wyvern, Mummy, Vampire, Death Knight, Wight.
- `KinEnum` with stable ids. `CreatureKin` owns shared spells/items/projectiles (scope `k`,
  replacing `f`: e.g. `jask0800`); entries reach them through their kin.
- A kin's creature subclass (`Cat` with leap/paws, `Ooze` with split/pseudopod...) lives in the
  kin's `kin.ts` and is used by its entries. An entry without a kin uses `Creature` or its own
  subclass in its file.

### Types

- `lib/creatures/types/<type>.ts`, one module per type with behavior:
  `{ type, hitDie?, afterBuild?(creature) }` plus helpers callable from any entry (undead
  `touch`/`claws`/`jaws` via `addNaturalWeapon`).
- A type registry runs the hooks for every creature having the type (derived types: direct,
  nested, trait item), in `TYPE_TRAITS` order, where `CreatureFamily.afterBuild` ran.
- The `Undead` subclass goes away: `turnAs` becomes an optional `Creature` field; its helpers move
  to the undead type module.
- Types own **code only**. Install material goes to the entry that uses it: Symbol of Pain
  (include) and the `jaaf0i00` icon to Death Knight; each `.baf` game-script override in today's
  `undead/assets/` (`BDGHOST`, `CB3579DK`, `DVDEATHK`, `DW#DEATH`, `SAHAMB01`) to its creature's
  entry, mapped in the plan by reading each script.

### Removed

`MonsterFamilyEnum`, `CreatureFamily`, `Creature.family`, `utils.getFamilyFolder`.
Scopes become `m` monster, `e` entry, `k` kin, `c` common (`f` disappears).

## Layout

- **Code**: `lib/creatures/<kin>/kin.ts` + one file per entry (`fey/kin.ts`, `fey/dryad.ts`...);
  kin-less entries `lib/creatures/<entry>.ts`; types `lib/creatures/types/<type>.ts`. Registries
  `lib/creatures/kins.ts` (kin factories) and `lib/creatures/entries.ts` (entry factories, install
  order) replace `familyFactories`.
- **Mod**:
  - `mod/lib/pnp-monster/kin/<kin>/`: generated `main.tpa` (shared resources), plus the kin's
    hand-written `common.tpa` and `assets/` (e.g. the fey icons).
  - `mod/lib/pnp-monster/<entry>/` (kebab-case of the enum key: `vampire/`, `clay-golem/`,
    `ettin/`): generated `main.tpa` (one INCLUDE per creature, `// <Name>` kept), `<code>.tpa`,
    `jabm<code>NN.baf`, and the entry's `assets/` (creature templates, `.baf` game-script overrides
    compiled only if the game has the script).
  - `mod/lib/pnp-monster/common/`: unchanged.
  - Generated `pnp-monster/index.tpa`: INCLUDE every kin's `main.tpa`, then every entry's, in
    registry order. The root tp2's family INCLUDE lines become one `INCLUDE …/index.tpa`.
  - Generated `pnp-monster/index.json`: entry → kin (`{ "vampire": null, "dryad": "fey" }`), read
    by `copy`.
- **Cleaning** runs on entry and kin folders (generated root `.tpa`/`.baf`; never `common.tpa`,
  `assets/`). Old family folders are removed once by the migration.

## Copy

- `copy --entry <names>`: keeps those entries' and their kins' lines in `index.tpa`.
- `copy --kin <names>`: a kin and all its entries.
- `--monster` keeps working on entries' `main.tpa` comments. `--family` is removed.

## Type behaviors

- **Hit dice by type**: fey d6, undead d12, dragon d12, ooze d10, construct d10, magical beast d10,
  d8 otherwise; per-monster rows stay possible. Several types → the **largest** die. Adjustments
  keep their base creature's die (the zombie ankhegs stay d10).
- **Turn level**: the undead module's `afterBuild` runs `applyTurnLevel` for every undead-typed
  creature, and for adjustments that add the undead type to a non-undead creature (zombie ankhegs).
- **Gameplay changes** (CHANGELOG): Wyvern, Baby Wyvern, Greater Wyvern d8 → d12; Wraith Spider,
  Dread Wolf, Vampiric Wolf d8 → d12 and now turnable; zombie ankheg adjustments now turnable.

## Logs

`Creating kin Fey...`, `Creating entry Vampire...`, `Creating Fledgling Vampire (49)...`.

## Migration and verification

Steps, each verified before the next:

1. Framework without behavior change: `CreatureEntry`, `CreatureKin`, `KinEnum`, full
   `EntryEnum`, type modules and registry, scopes `k`/`e`, index generation, registries. Families
   keep working alongside.
2. Migrate kin by kin, then the kin-less entries: code into the new layout, mod files into the new
   folders, resources `f` → `k`/`e`.
3. Type behaviors (hit dice, turn level) from families to types: the only gameplay change.
4. Remove families; root tp2 includes the index; old family folders deleted.
5. Copy `--entry`/`--kin`; `--family` removed.
6. CHANGELOG; regenerate `mod/`.

- Each step: dump the generated tree before/after; a normaliser maps old paths (`<family>/` →
  `<entry>/` or `kin/<kin>/`) and old names (`ja?f<fam>nn` → `k`/`e`); contents must be identical
  after normalisation, except install order inside `index.tpa` (steps 1, 2, 4, 5) and, in step 3,
  only the listed creatures' HP and turn-level fields.
- Unit tests: entry/kin building and scopes, type registry (hooks per type, largest die), turn level
  on adjustments adding undead, index generation, copy `--entry`/`--kin` with kin inclusion.
- Scheme test scopes become `[mekc]`.

## Risks

- Install order changes (kins first, then entries in registry order). Cross-entry references
  (Nereid → snake summon, woodland beings) resolve at runtime; inside an entry, base creatures stay
  before their variants.
- Longest piece of the roadmap: the plan is split along the steps above with a verification gate
  at each.
