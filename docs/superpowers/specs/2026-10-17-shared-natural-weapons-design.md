# Shared natural weapons: design

Sub-project 2 of the [monster entries & types roadmap](2026-10-16-monster-entries-roadmap.md).
Brainstormed 2026-10-17.

## Goal

Natural weapons (jaws, claws, fists...) are built by 18 near-identical helpers spread over family
classes. Give them one shared implementation on `Creature`, so that:

- defaults per weapon kind live in one place;
- any creature can add a natural weapon of any kind (a Wraith Spider can have undead claws without
  being an `Undead`), which sub-project 4 needs when family classes go away.

The generated mod must stay **byte-identical**.

## Findings that set the scope

- **Abilities are out of scope.** Cone of Cold and Fear Aura are already shared (`lib/spells/`); the
  creature methods only pass values. The Juggernaut's and the Minotaur's Charge are different
  mechanics with the same name.
- **The 18 helpers** are thin wrappers around `addWeapon`/`addItem`:

| Helper                       | Files                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------ |
| `createJaws`                 | basilisks, bears, cats, dogs, snakes, spiders, undead-creature, wolves, wyvern |
| `createPaws`                 | bears, cats                                                                    |
| `createFists`                | golems, ogre-creature                                                          |
| `createClaws`, `createTouch` | undead-creature                                                                |
| `createStinger`              | wyvern                                                                         |
| `createPseudopod`            | slimes                                                                         |
| `createBranch`               | plants                                                                         |

- What varies **by kind**: damage type, icon. What varies **by creature**: name key
  (`monster.<family>.weapon.<kind>`, texts identical across families), speed (2 to 8), slot (`WEAPON1`,
  `SHIELD`, none), and add-ons (poison, grab, on-hit spells, effects, immunities, doc, id, range,
  projectile, swing animation, damage bonus).

## Design

### Kind table: `lib/config/natural-weapons.ts`

```ts
export type NaturalWeaponKind =
  "jaws" | "claws" | "fists" | "touch" | "stinger" | "pseudopod" | "branch";
```

| Kind        | Damage type | Default icon                |
| ----------- | ----------- | --------------------------- |
| `jaws`      | Piercing    | `MonsterItemIconEnum.Jaws`  |
| `claws`     | Slashing    | `MonsterItemIconEnum.Wolf`  |
| `fists`     | Crushing    | `MonsterItemIconEnum.Fist`  |
| `touch`     | Crushing    | `MonsterItemIconEnum.Fist`  |
| `stinger`   | Piercing    | `MonsterItemIconEnum.Wolf`  |
| `pseudopod` | Crushing    | `MonsterItemIconEnum.Jelly` |
| `branch`    | Crushing    | `MonsterItemIconEnum.Golem` |

Every natural weapon is a melee header with `abilityflags: [AddStrengthBonus]`. Paws are the
`claws` kind (the code already names cat paws `monster.cat.weapon.claws`).

### `Creature.addNaturalWeapon(kind, options)`

- **Required**: `stringRef`, `diceThrown`, `diceSize`, `speed` (explicit: it varies per creature, a
  default would hide that).
- **Optional**:
  - `slot?: ItemSlot | null`: default `"WEAPON1"`; `null` = not equipped (empty `equippedSlot`).
  - `id`.
  - Header overrides: `damageType`, `damageBonus`, `effects`, `range`, `projectile`,
    `animationSwing`. Item overrides: `icon`, `immunities`, `doc`.
  - Add-ons: `castSpells`, `poison?: { poisonType, saveBonus }` (converted with
    `poisonService.getSpell`, as today), `grab`.
- Cast spells: the poison spell first, then `castSpells` (today's spider order).
- Builds the `PartialWeapon` and calls the existing `this.addWeapon({ weapon, castSpells, grab })`.
  `addWeapon` without cast spells or grab is exactly `addItem`, so the three helpers that call
  `addItem` directly (cat paws, ogre fists, plant branch) can use it too.

### The 18 helpers

Keep their names and signatures. Each body becomes one `addNaturalWeapon(...)` call with its
creature's values. Creature-specific logic stays in the wrapper and is passed as options: the cat's
rear-claw effect (scales with Strength), the bear hug cast spell, the golem's damage-type override.

**Unchanged**: the ~112 call sites, translation keys, item creation order (resource numbers derive
from it), all values (speeds, slots, icons).

## Verification

- Byte-hash manifest of the full pipeline output (temporary, untracked harness, as in sub-project 1):
  **zero differing files**, `docs/` included. Any difference is diffed to find the moved field
  (e.g. `castSpells: undefined` vs `[]`, or an object key order that leaks into output) and fixed.
- Unit tests for `addNaturalWeapon`: kind defaults applied; options override them; `slot: null`
  gives no equipped slot; poison spell before other cast spells; `grab` passed through.

## Out of scope

- Merging the per-family name keys into shared keys: a later step, once this refactor is proven
  harmless (it renumbers every string in the mod).
- Removing the wrappers: sub-project 4, with the family classes.
- Abilities (already shared or not duplicates).
