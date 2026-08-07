# ie-code-generator

Code generator (WEIDU, BAF) for Infinity Engine

## Install

- Install nodejs: https://nodejs.org/en/download. It is quick and easy.
- Install dependencies with `npm i` shell command in generator folder.

## Generate

Generate aTweaks files with `npm run aTweaks`.

Since random ordering is generating target lists by using Fisher–Yates shuffle, it will alter all scripts on each generation.
Purpose of this is to reduce target prediction. By comparaison, SCS is using a stable random order for everything, so once you know the order, you can predict quite easily. Here, each list will be randomize, so if you have 5 spells with the same list, you will get 5 different orders.

## Copy (local testing)

To copy the mod's `enhanced_creatures.tp2`, `lib/`, `languages/`, and `docs/` into local BG1/BG2 installs for testing, copy `paths.example.json` to `paths.local.json` and fill in your install paths, then run `npm run copy`. Pass `npm run copy -- --bg1` or `npm run copy -- --bg2` to copy to only one of them (the `--` is required so npm forwards the flag to the script instead of consuming it).

Everything lands inside an `enhanced_creatures/` subfolder in the destination (e.g. `<BG1 path>/enhanced_creatures/enhanced_creatures.tp2`, `.../enhanced_creatures/lib/`, `.../enhanced_creatures/languages/`, `.../enhanced_creatures/docs/`) — this matches where the tp2's own `%MOD_FOLDER%` references expect to find them, since `%MOD_FOLDER%` resolves to whichever folder the tp2 itself sits in. Run the tp2 from inside that subfolder (e.g. `weidu enhanced_creatures/enhanced_creatures.tp2` from the game root). This does not delete anything already in the destination — it only overwrites matching files inside `enhanced_creatures/`.

## Customize

If you want to make easy edits, you can edit files inside config folder. Strong typings should prevent you to make errors, but it can still happen if you don't know what you are doing.
