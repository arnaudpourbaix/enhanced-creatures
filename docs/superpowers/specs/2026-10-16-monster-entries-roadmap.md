# Roadmap: monster entries & types

Status legend: ☐ not started · ◐ in progress · ✅ done

## Why

"Family" was inherited from the original mod's install grouping and currently does four jobs at once:

- **Install unit**: obsolete. The mod ships one component (`@999`), and families can't be installed
  independently anyway (Nereid summons a snake, Nymph calls woodland beings, variants reuse their
  base creature's resources).
- **Code unit**: folder, base class (`Undead`, `Ogre`...), `common.tpa`, family-level spells/items
  (resources named after the family id, e.g. `jas0f12`).
- **Type behavior**: `UndeadFamily.afterBuild` applies turn level, and `hp.ts` gives hit dice by
  family for Undead/Fey/Ooze/Dragon.
- **Docs navigation**: one sidebar section per family.

It mixes race-based families (Ogre, Wolf) with type-based ones (Undead, Fey, Construct). Undead is a
type (a Wraith Spider and the zombie ankhegs are undead but live in their race family). In the docs,
32 undead creatures sit under one heading, and the 7 vampire ages are 7 unrelated cards.

## Target model

- **Entry**: a real monster, as in the Monster Manual: Basilisk (Lesser, Greater), Vampire
  (7 ages), Golem (Flesh, Clay...), Ettin. Each age/variant keeps its own MonsterId, which is
  cleaner than variants and adjustments, and matches `creatures.csv`.
- **Type**: a tag, not a container: Undead, Fey, Construct, Giant, Animal, Magical Beast, Ooze,
  Plant, Extraplanar... A creature can have several (Wraith Spider: Animal + Undead). Types drive
  shared behavior (hit dice, turn level) and the docs filter.
- **Family**: removed.

## Decisions taken (brainstorm 2026-10-16)

| Topic                   | Decision                                                                                                                                                                                                                                                                                                              |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Install granularity     | One "PnP monsters" component. Families are no longer an install boundary.                                                                                                                                                                                                                                             |
| MonsterIds              | One MonsterId per age/variant stays. Entries group them.                                                                                                                                                                                                                                                              |
| Entry rendering in docs | **B2**: the entry header holds a "Common to all <members>" box with everything identical across members (stats, common ability scores such as CON/WIS, the attack description, traits, abilities). Each card keeps only what differs. An attack that differs only by its bonus shows as "Enchantment +N" on the card. |
| Docs navigation         | Sidebar: entries A–Z. Multi-member entries fold open; single-member entries are plain links. No family level.                                                                                                                                                                                                         |
| Type filter             | **C2**: chips in a sticky toolbar under the page title, not in the sidebar. A type tag on each entry title applies the same filter. Filtering works per member (Undead keeps Spider, showing only Wraith Spider).                                                                                                     |
| Code architecture       | **Entry becomes the code unit**, and types become behavior keyed on the type (not on folder or inheritance). Common weapons/abilities move into a shared library.                                                                                                                                                     |

Mockups (real generated cards) live in `.superpowers/brainstorm/` (gitignored): `vampire-entry-v4.html`
(B2) and `entries-filter.html` (C2).

## Sub-projects

### 1. ✅ Entries & types in the docs

Delivers the designed docs on today's code (families stay in code for now). Design:
[2026-10-16-docs-entries-types-design.md](2026-10-16-docs-entries-types-design.md).

- An entry is one monster in several versions (identity, not resemblance). Declared with
  `addEntry(EntryEnum.X, [...])` in the family.
- Types are the D&D 3e creature types, declared as traits (`TYPE_TRAITS`). New docs-only traits:
  aberration, animal, dragon, monstrousHumanoid, outsider.
- "Common to all" is computed from the model, field by field, over all members.

### 2. ✅ Shared natural weapons

Design: [2026-10-17-shared-natural-weapons-design.md](2026-10-17-shared-natural-weapons-design.md).

- One `Creature.addNaturalWeapon(kind, options)` with a kind table (damage type, icon); the 18
  family helpers become thin wrappers; output byte-identical.
- Abilities dropped from scope: Cone of Cold and Fear Aura are already shared, the two Charges are
  different mechanics.
- Follow-up step: merge the per-family weapon name keys into shared keys once proven harmless
  (renumbers every string).

### 3. ✅ Resource naming scheme

Design: [2026-10-17-resource-naming-design.md](2026-10-17-resource-naming-design.md). Decided:
counter on 2 characters (always 8), scripts as kind `b` with counters, base 36 for mod files too,
handwritten resources brought into the scheme, generation cleans its own output.

Game filenames are 8 characters, and ours must start with `ja`, which leaves 6. Today's scheme
(`ja` + kind + counter in 1 hex + `m`/`f` + id in hex, e.g. `jas1m3`) breaks at monster id 256
(the highest is 166) and allows only 16 resources per kind per owner (the Construct family is at
12 spells).

- One naming function for every generated resource: `ja` + kind + scope + owner (base 36) +
  counter (base 36).
  - Kind: `s` spl (its pro/eff may reuse the spell's name, which is safe), `i` itm...
  - Scope: `m` monster, `e` entry, `c` common.
  - Owner: monsters keep their MonsterEnum value. Entries get a stable numeric id.
- Base 36 (`0-9a-z`, `(166).toString(36) === "4m"`) gives 1296 owners on 2 characters.
- Open: counter on 1 character (36 per kind, 7 characters, 1 spare for suffixes such as `su`) or
  2 (1296, always 8).
- A generation-time check fails when an SPL and an ITM share a name, handwritten names included
  (`jasight`, `jaspain`, `jazombie`...). Only SPL/ITM collisions are a real risk: an effect
  referencing a resource can pick the wrong one.
- Generation only writes files, it never deletes. Before regenerating with the new names, the
  generated files under `mod/lib/pnp-monster` must be removed (keeping hand-written ones: each
  family's `common.tpa` and `assets/`, and `common/`), or old hex-named `.tpa`/`.baf` files stay
  next to the new ones. Consider making generation clean its own output.
- Every generated resource is renamed: existing installs need a full reinstall, and saved games
  can lose items with old names. Acceptable pre-1.0, with a changelog note.
- Readability: base-36 ids can't be read at a glance (vampire 153 is `49`). The docs or the file
  search could show the base-36 id or resource names.

### 4. ✅ Families → entries in code

Design: [2026-10-17-families-to-entries-design.md](2026-10-17-families-to-entries-design.md).
Decided: full migration; kins own material shared by several entries (scope `k`); types own code
behavior only; hit dice by type (largest die); `copy --entry`/`--kin`.

Makes the code match the docs. Builds on 1 (metadata becomes structure), helped by 2, and needs 3
(entries own resources under the `e` scope).

- An entry replaces a family as the code unit: typed base class (`CreatureEntry<T>`), entry-level
  spells/items, its own tpa folder `lib/pnp-monster/<entry>/`.
- Type-driven behavior: hit dice by type in `hp.ts` (already supports `type`), turn level for every
  undead-typed creature (today the Wraith Spider and the zombie ankhegs miss it), and the
  `common.tpa` and assets that undead uses today.
- Open: what holds material shared by related entries that is not a whole type (great cats' leap
  and pounce, oozes' split and pseudopod)? That is what family classes were actually good for, and
  entries are small (one monster each). Options: a shared module per kin, or a base class the
  entries reuse.
- Migrate one family at a time, then delete `MonsterFamilyEnum`.
- `copy --entry <name>` replaces `copy --family`. `--monster` keeps working as long as each
  `main.tpa` keeps its `// <Name>` comments. Filtering by entry also keeps a base creature and its
  variants together.

## Related, already done

- `npm run copy -- --family <names> --monster <text>` (2026-10-16) installs only part of the mod
  for testing. Replaced in sub-project 4 by `--entry` / `--kin` / `--monster`.

## Follow-ups

Collected from the four sub-projects' reviews and rulings (2026-10-17). ☐ open · ✅ done.

### Needs a decision or an in-game check

- ✅ **Ettin**: finished (confirmed 2026-10-18), stays installed.
- ✅ **Turn Undead**: tested in game (2026-10-18): turning needs CRE `General=UNDEAD`. The undead
  type hook now sets it (with the turn level) on every undead creature and on adjustments making
  one undead: fixes Wraith Spider, Dread Wolf (was ANIMAL), zombie ankhegs, and Shadow / Greater
  Shadow (were MONSTER, though the game's files are UNDEAD).
- ✅ **Install test**: the reorganised mod installs fine (2026-10-18).
- ☐ **Docs page in a browser**: "Common to all" boxes (✅ 2026-10-18), type filter (desktop and narrow window: the
  sticky bar's 52px offset is a guess), type tags and `#code` in titles, popovers in the shared box,
  a type tag clicked in an adjustments title must not open the panel.

### Structure

- ✅ Move single-use material out of kins into their entry. Kin resources used by one entry moved
  (Improved Stream of Frost → Polar Bear; Priest Dimension Door, Blinding Beauty → Nymph; Entangle
  → Hamadryad; Charm Song, Fog Cloud, Touch of Tranquility → Sirine; Longsword → Doom Guard):
  renamed `k` → `e`. Single-use methods of the shared creature classes moved to a subclass in their
  entry file (no output change). Detect Traps (Dryad's wilderness helper) and Flaming Sword
  (Helmed Horror, Battle Horror, Doom Sayer) are shared and stay.
- ✅ Move `SAHAMB01.baf` from the Zombie entry to `pnp-monster/common/scripts/` (compiled by
  `common.tpa`): Ghast and Skeleton Warrior no longer depend on the Zombie entry.
- ✅ `ENTRY_MEMBERS` dropped (only tests read it): members are what each entry builds; `ENTRY_NAMES`
  keeps only the 9 multi-member entries' docs names.
- ✅ `lib/creatures/undead/` removed: the shared `Ids` enum split into one per entry file (ids don't
  name resources), and `UndeadEntry`, which had nothing undead, became the generic
  `SimpleEntry` (`lib/src/model/creature/simple-entry.ts`).
- ✅ Per-kin weapon name keys merged into `common.naturalWeapon.*` (jaws, claws, paws, fists, touch,
  stinger, pseudopod, branch); each kind defaults its name, so `addNaturalWeapon` calls only pass
  `paws`. Same texts, 13 fewer strings (1143 -> 1130), .tra renumbered.
- ✅ Natural weapon variant layer: not needed. Since the key merge, undead claws only override the icon
  (Ghoul, in the undead `createClaws` helper); `addNaturalWeapon`'s optional `icon` covers it.

### Bugs and gaps found along the way

- ✅ `pipeline.golden.test.ts` fails at setup: fixed (copies the tp2); the full suite is green and
  the test fails when the committed `mod/` is stale.
- ✅ `pnp-spell/scribe_scrolls/`: an uninstalled component copied from another mod (missing its
  files); deleted.
- ✅ `jacm1500.cre` (Dryad summon) embedded dead rings (`ja#1m41`, `ja#i5`) and RR# spells from
  the original mod; stripped from the asset (the install adds the real items and spells).
- ✅ `.gitattributes`: `mod/lib/pnp-monster/** text eol=crlf` corrupted binary assets on checkout
  (LF → CRLF in 12 `.cre`/`.bam`/`.vvc`); game binaries are now marked `binary`.
- ☐ `pnp-spell/woodland_beings` (not installed) still uses old `ja#` names and summons the Dryad,
  Hamadryad and Treant entries' creatures: update when the component is plugged in.

### Tests

- ✅ docOnly function test: add a positive control (an immunity that does appear).
- ✅ Translation test for a `doc.types.*` key (multi-line text).
- ✅ Weapon "No enchantment" branch of the docs cards; pass-through of `id`, `range`, `projectile`,
  `animationSwing`, `damageBonus`, `immunities`, `doc` in `addNaturalWeapon`.
- ✅ `entry-common` tests never populate abilities / trait lines.
- ✅ Cleaner: no test for a missing folder.
- ✅ Undead type coming only from a trait item, through the type hook (Dread Wolf case).
- ✅ Dependency closure: explicit cycle test.
- ✅ Docs chip-count test regex is brittle.

### Cosmetic

- ✅ `addSpecial` is dead in production (kept for its tests).
- ✅ `definedOnly` comment overstates (the risk is in `itemService.setHeader`'s header spread).
- ✅ `NaturalWeaponOptions.icon` typed `string` → `MonsterItemIconEnum`.
- ✅ `hp.ts` comment repeats the type dice values: `HitDiceTable` removed (empty, unused).
- ✅ Unchecked `kins.get(KinEnum.X) as XKin` casts in fey entries.
- ✅ Death Knight copies `jaae2q00.bam`, used only by a commented-out line.
- ✅ Leftover "family" wording in some tests and comments (`log.service.test.ts`, `pipeline.golden.test.ts`).
- ✅ Malformed `index.json` reports "old format".
- ✅ Sidebar groups opened by the type filter stay open after "All"; a global `[hidden]` guard as
  insurance.
- ✅ `getAdjustmentTypes` recomputes creature types per adjustment; services import content via a
  lazy getter. (Types computed once per creature now; the lazy getter stays: it breaks the
  import cycle between the type modules and the services they use.)
