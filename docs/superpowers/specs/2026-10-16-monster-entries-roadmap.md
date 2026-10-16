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

### 3. ☐ Resource naming scheme

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

### 4. ☐ Families → entries in code

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
  for testing. `--family` will need revisiting in sub-project 4.
