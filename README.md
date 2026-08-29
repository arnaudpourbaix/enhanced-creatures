# Enhanced Creatures

![GitHub release (latest by date)](https://img.shields.io/github/v/release/arnaudpourbaix/enhanced-creatures)

Enhanced Creatures for Baldur's Gate EE and Baldur's Gate 2 EE.

Its main purpose is to bring all monsters as close as possible to P&P using a mix of 2e and 3e edition rules.

This mod has a long history, I have worked on it between 2005 and 2011 but it was a huge project and I couldn't reach the quality I expected due to a lack of time.
In 2025, I have started from scratch using new ideas. First, I took aTweaks as strong basis but most of the code has been refactored. I was even thinking of releasing it under aTweaks name but I'm not sure to cover it entirely (other tweaks) so I changed my mind.

All the monsters are described in Typescript files to get something strongly-typed, clear, and readable. Then, a generator will create all the WEIDU's code, BAF scripts, and documentation.

`creatures.csv` contains all monsters for BG1, BG2, and many popular mods. It means that any unreferenced monster will not be modified. In this csv file, there is `MonsterId` column which references `MonsterEnum`. However, to prevent mistakes, each cre file need to be manually validated, hence with the `ValidatedMonsterId` column.

Each monster will gather its validated cre files inside `creatures.csv`. Most monsters have more powerful versions like named or variants. It is handled with adjustments, they will take care of changes like more hit dices, special powers, and so on.

The generator doesn't need to be installed and executed, unless you want to change stuff in the generator folder.

I have spent a lot of times to categorize monsters using general, race, class, animation, weapons, and even dialog. However, if you think I made some mistakes, feel free to tell me and I'll make a review.

[Documentation](https://arnaudpourbaix.github.io/enhanced-creatures)

## Install 

[Download](https://github.com/arnaudpourbaix/enhanced-creatures/releases/tag/latest)

Currently, WEIDU is not shipped with the release, so you have to use your own at the moment.

It should be installed very late and especially after SCS.

## Compatibility

Don't use [Use BG Walking Speeds] from The Tweaks Anthology, as it will break monster's movement calculations.

## Generator

Code generator (WEIDU, BAF) for Infinity Engine

### Install

- Install nodejs: https://nodejs.org/en/download. It is quick and easy.
- Install dependencies with `npm i` shell command in root folder.

### Generate

Generate mod's files with `npm run generate`.

#### Random ordering for targets

Since random ordering is generating target lists by using Fisher–Yates shuffle, it will alter all scripts on each generation.
Purpose of this is to reduce target prediction. By comparaison, SCS is using a stable random order for everything, so once you know the order, you can predict quite easily. Here, each list will be randomize, so if you have 5 spells with the same list, you will get 5 different orders.

Note: random targetting is disabled because it changes too many files. However, it is activated when doing a release, but only for the files in the zip.

To activate it in a local build, edit `lib\config\generate.ts` and set enableRandomTargetOrder to true. Then, just run the previous generate command.

#### Secondary types

Some new spells are classified with secondary types like fear, poison, and disease.
They need to be added in spells that provide cure or immunity, this is really important.

Note: it is disabled because it slows down installation's time by a huge margin. However, it is activated when doing a release, but only for the files in the zip.

To activate it in a local build, edit `lib\config\generate.ts` and set enableSecondaryTypes to true. Then, just run the previous generate command.

### Copy (local testing)

To copy the mod's files into local BG1/BG2, create `paths.local.json` from `paths.example.json` with your install paths, then run `npm run copy`. Pass `npm run copy -- --bg1` or `npm run copy -- --bg2` to copy to only one of them.

### Customize

If you want to make easy edits, you can edit files inside config folder. Strong typings should prevent you to make errors, but it can still happen if you don't know what you are doing.

## Credits

aVENGER and Wisp for of aTweaks. Many files have been taken from aTweaks as said in the introduction. I have only changed prefixes for consistency.

Salk, initial supporter.

Many modders for all the common WEIDU functions and help in the forums.

## License

This work is licensed under the Creative Commons Attribution-Noncommercial-Share Alike 3.0 Unported License. To view a copy of this license, visit http://creativecommons.org/licenses/by-nc-sa/3.0/ or send a letter to Creative Commons, 171 Second Street, Suite 300, San Francisco, California, 94105, USA.

