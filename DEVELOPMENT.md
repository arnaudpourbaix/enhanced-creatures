# Development

Player-facing documentation (install, compatibility, credits) is written in [PLAYER.md](PLAYER.md). `npm run generate` renders it into `mod/docs/index.html` (via `lib/templates/home.html`), which is shipped as the mod's README and published to [GitHub Pages](https://arnaudpourbaix.github.io/enhanced-creatures). Keep player content there only, and don't edit `mod/docs/index.html` by hand. Text before the first `##` becomes the hero banner, and each `##` becomes its own section.

The generator doesn't need to be installed and executed, unless you want to change stuff in the generator.

## Overview

All the monsters are described in Typescript files to get something strongly-typed, clear, and readable. Then, a generator will create all the WEIDU's code, BAF scripts, and documentation (`mod/docs/monsters.html`, `mod/docs/changelog.html`).

`creatures.csv` contains all monsters for BG1, BG2, and many popular mods. It means that any unreferenced monster will not be modified. In this csv file, there is `MonsterId` column which references `MonsterEnum`. However, to prevent mistakes, each cre file need to be manually validated, hence with the `ValidatedMonsterId` column.

Each monster will gather its validated cre files inside `creatures.csv`. Most monsters have more powerful versions like named or variants. It is handled with adjustments, they will take care of changes like more hit dices, special powers, and so on.

`npm run dashboard` builds [mod/docs/dashboard.html](mod/docs/dashboard.html), a page of the mod docs (linked from the site nav, so players can consult it too) with the `creatures.csv` MonsterId counts, the stats report, and the missing monsters (with how many `creatures.csv` rows each one already has, to help prioritize).

The stats report tab shows the differences between before and after install, but bear in mind that it also depends on your installed mods.

## Install

- Install nodejs: https://nodejs.org/en/download. It is quick and easy.
- Install dependencies with `npm i` shell command in root folder.

I highly recommend [Visual Studio Code](https://code.visualstudio.com/) with these extensions:

- BGforge MLS
- Claude Code for VS Code (if you have a subscription)

## Dashboard

A dashboard can be generated with `npm run dashboard`.
It will create `mod/docs/dashboard.html`, which is shipped and published with the rest of the docs. This dashboard shows several interesting things.

## Generate

Generate mod's files with `npm run generate`.

### Random ordering for targets

Since random ordering is generating target lists by using Fisher–Yates shuffle, it will alter all scripts on each generation.
Purpose of this is to reduce target prediction. By comparaison, SCS is using a stable random order for everything, so once you know the order, you can predict quite easily. Here, each list will be randomize, so if you have 5 spells with the same list, you will get 5 different orders.

Note: random targetting is disabled because it changes too many files. However, it is activated when doing a release, but only for the files in the zip.

To activate it in a local build, edit `lib\config\generate.ts` and set enableRandomTargetOrder to true. Then, just run the previous generate command.

### Secondary types

Some new spells are classified with secondary types like fear, poison, and disease.
They need to be added in spells that provide cure or immunity, this is really important.

Note: it is disabled because it slows down installation's time by a huge margin. However, it is activated when doing a release, but only for the files in the zip.

To activate it in a local build, edit `lib\config\generate.ts` and set enableSecondaryTypes to true. Then, just run the previous generate command.

## Copy (local testing)

To copy the mod's files into local BG1/BG2, create `paths.local.json` from `paths.example.json` with your install paths, then run `npm run copy`. Pass `npm run copy -- --bg1` or `npm run copy -- --bg2` to copy to only one of them.

The copy can be narrowed to speed up testing (the repo's `mod/` is never modified, only the copied install files):

- `--entry <names...>`: only install these entries (folder names, e.g. `dryad`, `doom-sayer`), plus their kin.
- `--kin <names...>`: only install these kins (e.g. `fey`) with all their entries.
- `--monster <names...>`: only install creatures whose name contains one of these, case-insensitive (e.g. `vampire` keeps every vampire age). Alone it keeps every entry with a match; combined with `--entry`/`--kin` it narrows the creatures of those.

Whatever is kept also keeps what it needs: the kin of each kept entry and, transitively, the entries it depends on (from `lib/pnp-monster/index.json`), whole even if `--monster` would narrow them. Unknown names are rejected with the list of valid ones. The former `--family` option is gone: use `--entry` (one monster) or `--kin` (a group of related monsters).

Example: `npm run copy -- --bg2 --entry nereid --monster nereid`.

## Adding a monster

A monster is an **entry**: one monster in one or more versions (rank, age, size). Related entries can share material through a **kin**.

1. **Code.** Create `lib/creatures/<entry>.ts`, or `lib/creatures/<kin>/<entry>.ts` when it belongs to a kin. The file exports a factory `create<Name>Entry` that builds a `CreatureEntry` (see `ankheg.ts` for the simplest one, `ghoul.ts` for several creatures).
2. **Id.** Add a value to `EntryEnum` in `lib/creatures/entry.ts` and a row to its `ENTRIES` table (translation key of the name, and the member `MonsterEnum` values in install/docs order). The pnp-monster folder is the kebab-case of the enum key (`ClayGolem` -> `clay-golem`); ids are stable because they name the entry's resources.
3. **Register.** Add the factory to `entryFactories` in `lib/creatures/entries.ts`. The order is the install order: an entry must come after the entries it depends on.
4. **Kin (optional).** Create a kin when several entries share code or resources: `lib/creatures/<kin>/kin.ts`, a value in `KinEnum` (`lib/creatures/kin.ts`) and its factory in `lib/creatures/kins.ts` (kins install before all entries). The entry factory receives the kins and passes its own to the constructor (`kins.get(KinEnum.Fey)`).
5. **Dependencies.** Declare `.requires(EntryEnum.Other)` on the entry whenever it:
   - `createFrom`s a creature of another entry,
   - uses resources (spells, projectiles, ...) owned by another entry,
   - summons a creature whose file belongs to another entry,
   - uses an asset stored in another entry's folder.

   Calls accumulate. The list is written to `index.json`, which `copy` uses to keep what an entry needs.

6. **Types.** Creature types (undead, construct, ...) come from traits; their behavior lives in the type modules of `lib/creatures/types/`, so there is nothing to add per entry.
7. **Tests.** `lib/creatures/entry.test.ts` guards the registration: a full build must match `ENTRY_MEMBERS` exactly (every built creature in exactly one entry), and the dependency test lists every entry with a dependency, so a new `.requires` must be added to its `expected` list on purpose. Then run `npm run generate` and commit the regenerated `mod/`.

## Customize

If you want to make easy edits, you can edit files inside the `lib/config` folder. Strong typings should prevent you to make errors, but it can still happen if you don't know what you are doing.
