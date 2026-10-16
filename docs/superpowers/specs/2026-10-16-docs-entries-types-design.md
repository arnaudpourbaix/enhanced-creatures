# Docs entries & types: design

Sub-project 1 of the [monster entries & types roadmap](2026-10-16-monster-entries-roadmap.md).
Brainstormed 2026-10-16. Mockups (real generated cards) are in `.superpowers/brainstorm/`
(gitignored): `vampire-entry-v4.html` (entry layout B2) and `entries-filter.html` (filter C2).

## Goal

Make `docs/monsters.html` read like a monster book:

- An entry groups the versions of one monster (Vampire and its 7 ages).
- The sidebar lists entries A–Z instead of families.
- Types (Undead, Animal...) are tags you can filter by.

The code keeps its families. This sub-project adds metadata and changes the docs. The generated mod
(tpa/baf/resources) must not change, except for the INCLUDE reordering described in
[Verification](#verification) and the six creatures in
[Gameplay changes](#gameplay-changes-separate-commit).

## Entries

### Rule

An entry is **one monster in several versions**: the same base monster with a rank, age or size
qualifier. Identity decides, not resemblance or shared content: Lesser and Greater Basilisk are
both basilisks, while Ghast and Ghoul are two monsters. Anything else is a single-member entry.

| Entry (`EntryEnum`) | Members, in declaration order                                                                                 |
| ------------------- | ------------------------------------------------------------------------------------------------------------- |
| `Basilisk`          | LesserBasilisk, GreaterBasilisk                                                                               |
| `ClayGolem`         | ClayGolem, LesserClayGolem, GreaterClayGolem                                                                  |
| `Ghoul`             | Ghoul, GhoulLord                                                                                              |
| `Mummy`             | Mummy, GreaterMummy                                                                                           |
| `Shadow`            | Shadow, GreaterShadow                                                                                         |
| `StoneGolem`        | StoneGolem, LesserStoneGolem                                                                                  |
| `Vampire`           | VampireFledgling, VampireMature, VampireOld, VampireVeryOld, VampireAncient, VampireEminent, VampirePatriarch |
| `Wyvern`            | Wyvern, BabyWyvern, GreaterWyvern                                                                             |
| `Zombie`            | Zombie, ZombieLord                                                                                            |

Explicitly **separate monsters** (decided): Ghast, Ju-ju Zombie, Sea Zombie, Archer Skeleton,
Skeleton Monster, Giant/Huge/Gargantuan Spider, Dire Wolf, War Dog/Wild Dog, Olive Slime/Olive
Slime Creature, and every golem other than Clay and Stone.

### Declaration

- `lib/creatures/entry.ts`: `export enum EntryEnum { ... }` with stable numeric ids, for
  multi-member entries only. Sub-project 4 extends it to every entry when entries start owning
  resources (see the roadmap, sub-project 3: resource naming).
- `CreatureFamily.addEntry(id: EntryEnum, builders: (() => T)[])` calls `addCreature(build)` for
  each builder, then sets `creature.entry = id` on the creature it built (including one left
  `valid = false`). Build, validation and log capture are the existing `addCreature` path.
- `Creature.entry?: EntryEnum`. A creature registered with plain `addCreature` has no entry and is
  a single-member entry named after itself.
- **Member order = declaration order = registration order** (it drives the `main.tpa` INCLUDE
  order). A base creature whose resources its variants reuse is declared first: Clay Golem before
  Lesser/Greater Clay Golem (`golem/6d.tpa` uses resources created in `golem/18.tpa`).
- Entry names: a new translation section `lib/translations/en/entry.ts`, registered in
  `i18n.ts` as `entry` (key `entry.<camelCaseName>`, e.g. `entry.clayGolem` → "Clay Golem").
  `EntryEnum` maps to its key through one `Record<EntryEnum, TranslationKey>`.

## Types

### Rule

A creature's types are its **D&D 3e creature types**, declared as traits (`data.immunities`).
A type is a trait listed in `TYPE_TRAITS`:

`aberration`, `animal`, `construct`, `dragon`, `elemental`, `fey`, `giant`, `magicalBeast`,
`monstrousHumanoid`, `ooze`, `outsider`, `plant`, `undead`, `vermin`

- Subtypes and features are not types: `extraplanar`, `skeletal`, `incorporeal`, `hover`, `cat`,
  `spider`, `airAffinity`, `earthAffinity`, `blindsight`... In 3e, `extraplanar` is a subtype: most
  outsiders are extraplanar, but a native outsider is not.
- **Derived, not stored**: `creature.types` = the creature's traits plus the traits nested in their
  `immunities` (transitively), filtered by `TYPE_TRAITS`, in `TYPE_TRAITS` order. Nesting means
  "is a": the `spider` trait includes `vermin` so that a spider carries one trait item instead of two
  (creature item slots are scarce). A spider is therefore Vermin.

### New traits

`aberration`, `animal`, `dragon`, `monstrousHumanoid`, `outsider`: each gets an immunity-config
entry with `type: "trait"`, `stringRef`/`description` in `common.ts` `traits` (rules text in the
style of the existing undead/construct descriptions), **no `itemSlot` and no immunities**. They are
docs-only in this sub-project, so the game is unchanged. Whether they should give an in-game trait
item like `undead` (`jai17`) is a later decision. If they do, they must respect the slot economy:
nest into an existing trait item rather than add a second item to a creature.

The new type traits are added **directly on each creature**, not nested into a feature trait. For
example, `animal` is not nested into `cat`, because a feature trait
doesn't imply a type: the Displacer Beast had `cat` but is a Magical Beast.

### Per-creature types (to review)

Types follow **D&D 3e only**. 5e types (Beast, Monstrosity...) are not mixed in, because 2e,
the main source, has no creature types. Basis: **code** = the type is already a trait today (fact).
**3e** = proposed from D&D 3e, to confirm. A creature with no type shows no tag and only
appears under "All".

| Creature                                                                            | Type(s)               | Basis                                     |
| ----------------------------------------------------------------------------------- | --------------------- | ----------------------------------------- |
| Ankheg, Lesser/Greater Basilisk, Blink Dog, Winter Wolf, Worg                       | Magical Beast         | code                                      |
| Phase Spider                                                                        | Magical Beast, Vermin | code (`spider` nests `vermin`), confirmed |
| Gargantuan, Ghostwalk, Giant, Hairy, Huge, Sword, Vortex Spider                     | Vermin                | code (`spider` nests `vermin`)            |
| Wraith Spider                                                                       | Vermin, Undead        | code                                      |
| Helmed Horror, Battle Horror, Doom Sayer, Doom Guard, all golems                    | Construct             | code                                      |
| Dryad, Hamadryad, Nymph, Sirine, Nereid                                             | Fey                   | code                                      |
| Ettin, Ogre, Ogrillon, Half Ogre, Ogre Mage, Ogre Berserker, Ogre Shaman            | Giant                 | code                                      |
| All puddings, jellies, slimes, Gray Ooze, Slithering Tracker                        | Ooze                  | code                                      |
| Treant                                                                              | Plant                 | code                                      |
| All 30 creatures of the Undead family                                               | Undead                | code                                      |
| Black, Brown, Cave, Grizzly, Polar Bear                                             | Animal                | 3e                                        |
| Cheetah, Giant Lynx, Jaguar, Leopard, Lion, Mountain Lion, Spotted Lion, Wild Tiger | Animal                | 3e (Giant Lynx confirmed)                 |
| Wild Dog, War Dog, Wolf, Dire Wolf, Giant Poisonous Snake                           | Animal                | 3e                                        |
| Displacer Beast                                                                     | Magical Beast         | decided, see Gameplay changes             |
| Hellcat                                                                             | Outsider              | 3e (already `extraplanar`)                |
| Hell Hound, Moon Dog                                                                | Outsider              | decided, see Gameplay changes             |
| Carrion Crawler, Ettercap                                                           | Aberration            | 3e                                        |
| Minotaur                                                                            | Monstrous Humanoid    | 3e                                        |
| Wyvern, Baby Wyvern, Greater Wyvern                                                 | Dragon                | 3e                                        |
| Spectral Hound                                                                      | Magical Beast         | decided, see Gameplay changes             |
| Dread Wolf, Vampiric Wolf                                                           | Undead                | decided, see Gameplay changes             |

Adding a type trait to a creature is a one-line `immunities` change in its creature file.

### Gameplay changes (separate commit)

Six creatures get **existing, mechanical** traits. This changes them in game (trait items and
immunities), so it is a separate commit with its own expected diff:

| Creature       | Decided type                                    | Traits added              | Current immunities to reconcile                                                              |
| -------------- | ----------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------- |
| Spectral Hound | Magical Beast (comes from the Astral Plane)     | `magicalBeast` (`jai12`)  | to check                                                                                     |
| Dread Wolf     | Undead                                          | `undead` (`jai17`)        | `charm`, `hold` likely covered by `undead`. Keep `cold`, `coldSpells`, `lightningResistance` |
| Vampiric Wolf  | Undead                                          | `undead` (`jai17`)        | `sleep`, `charm`, `hold` likely covered by `undead`. Keep `nonSilverNonMagicalWeapons`       |
| Hell Hound     | Outsider (Evil, Extraplanar, Fire)              | `outsider`, `extraplanar` | `fire`, `backstab`, `seeInvisible`: check against `extraplanar`                              |
| Moon Dog       | Outsider (Extraplanar, Good, native of Elysium) | `outsider`, `extraplanar` | `backstab`, `infravision`, `plusOneWeapons`, `fear`: check against `extraplanar`             |

Displacer Beast (Magical Beast, decided): **swap** `cat` for `magicalBeast` and add `backstab`
directly. Adding `magicalBeast` next to `cat` would equip a second trait item that only grants
infravision, which `cat` already gives. The swap keeps one item and the same immunities
(infravision + backstab). The card shows "Magical Beast" instead of "Cat".

- Remove the immunities the new trait already provides, so nothing is applied twice.
- Check that each creature has a free slot for the new trait item (Spectral Hound, both wolves).
- Expected diff: these 6 creatures' generated files only.
- Dread/Vampiric Wolf get no turn level yet. Turn level is applied only by `UndeadFamily` until it
  becomes type-driven in sub-project 4.

## Shared section ("Common to all")

Computed from the **creature model**, field by field, over the entry's **valid** members. A value
is common only if **every** valid member has it (6 of 7 stays on the cards).

| Element                                         | Common when                                 | Card shows otherwise                                          |
| ----------------------------------------------- | ------------------------------------------- | ------------------------------------------------------------- |
| Each stat (AC, APR, Morale, Alignment, Size...) | present on every member with the same value | the stat                                                      |
| Ability scores                                  | **per score** (e.g. CON 18, WIS 15)         | the remaining scores                                          |
| Weapon                                          | all fields equal except `enchantment`       | "Enchantment +N", or the full weapon if anything else differs |
| Each trait (`Undead`, "Resistance to cold 50%") | present on every member                     | the trait                                                     |
| Each ability                                    | same name **and** same description          | the ability                                                   |

No "same text except a number" heuristic. Further near-matches become new explicit splits. When
nothing is common, there is no box.

## Rendering (`docs/monsters.html`)

- **Pipeline**: `documentationService.addFamily()` only collects creatures. `generate()` groups
  them by entry, sorts entries A–Z by translated name, and renders. Families no longer appear in
  the docs.
- **Header filter (C2)**: a sticky toolbar under the page title, with chips "All" + each type that
  has at least one documented creature, and counts of members. One active type at a time.
  Filtering hides members without the type. A multi-member entry stays if at least one member
  matches, showing only those members.
- **Sidebar**: entries A–Z. A multi-member entry is a collapsible group of its members (declaration
  order). A single-member entry is a plain link. The file search box is unchanged.
- **Multi-member entry (B2)**: header with entry name, type tags (clickable, same filter as the
  chips) and "N members". Then the "Common to all" box. Then member cards showing only what is not
  common.
- **Single-member entry**: today's card, with type tags next to its title.
- **Anchors**: cards keep `#m<id>`. Multi-member entries get `#e<EntryEnum>`.
- **Unchanged**: file search index, adjustments panel, trait popovers.
- **Invalid creatures**: skipped as today. An entry with no valid member is not rendered.

## Verification

- **Unit tests**:
  - shared-section computation: per stat, per score, weapon/enchantment split, traits,
    abilities by name+description, the all-members rule, missing fields, invalid members excluded;
  - type derivation: direct, nested (`spider` → `vermin`), ordering, non-type traits ignored;
  - `addEntry` stamping and the single-member default;
  - A–Z grouping and sorting.
- **Documentation service tests**: entry header, shared box, reduced cards, type tags, toolbar,
  sidebar groups, anchors.
- **Generated mod unchanged**: hash manifest of the pipeline output from a clean `git stash`
  baseline (the golden test has pre-existing failures). Expected differences:
  - `docs/` files;
  - `lib/pnp-monster/undead/main.tpa`: INCLUDE lines reordered, same set, because `addEntry`
    registers members contiguously (Ghoul Lord moves next to Ghoul, Zombie Lord next to Zombie).
    No undead creature uses another's resources, so install order doesn't matter there.

  - the six creatures of [Gameplay changes](#gameplay-changes-separate-commit), in their own
    commit.

  Anything else differing is a bug.

- **Visual check** of the regenerated `docs/monsters.html`.

## Out of scope

- Families in code, tpa layout, resource names: sub-projects 3 and 4.
- In-game trait items for the new types.
- `copy --entry` (sub-project 4).

## Noticed while designing (not fixed here)

- `ghostVisual1` in `immunity-config.ts` uses `ITEMS.Vermin` as its item. Possibly a copy-paste
  slip, to check separately.
