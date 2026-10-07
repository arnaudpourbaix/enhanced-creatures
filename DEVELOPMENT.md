# Development

Player-facing documentation (install, compatibility, credits) is written in [PLAYER.md](PLAYER.md). `npm run generate` renders it into `mod/docs/index.html` (via `lib/templates/home.html`), which is shipped as the mod's README and published to [GitHub Pages](https://arnaudpourbaix.github.io/enhanced-creatures). Keep player content there only, and don't edit `mod/docs/index.html` by hand. Text before the first `##` becomes the hero banner, and each `##` becomes its own section.

The generator doesn't need to be installed and executed, unless you want to change stuff in the generator.

## Overview

All the monsters are described in Typescript files to get something strongly-typed, clear, and readable. Then, a generator will create all the WEIDU's code, BAF scripts, and documentation (`mod/docs/monsters.html`, `mod/docs/changelog.html`).

`creatures.csv` contains all monsters for BG1, BG2, and many popular mods. It means that any unreferenced monster will not be modified. In this csv file, there is `MonsterId` column which references `MonsterEnum`. However, to prevent mistakes, each cre file need to be manually validated, hence with the `ValidatedMonsterId` column.

Each monster will gather its validated cre files inside `creatures.csv`. Most monsters have more powerful versions like named or variants. It is handled with adjustments, they will take care of changes like more hit dices, special powers, and so on.

You can check differences between before and after install [here](assets/stats-report.html) but bear in mind
that it also depends on your installed mods.

## Install

- Install nodejs: https://nodejs.org/en/download. It is quick and easy.
- Install dependencies with `npm i` shell command in root folder.

I highly recommend [Visual Studio Code](https://code.visualstudio.com/) with these extensions:

- BGforge MLS
- Claude Code for VS Code (if you have a subscription)

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

## Customize

If you want to make easy edits, you can edit files inside the `lib/config` folder. Strong typings should prevent you to make errors, but it can still happen if you don't know what you are doing.
