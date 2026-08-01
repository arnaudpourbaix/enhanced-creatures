# ie-code-generator
Code generator (WEIDU, BAF) for Infinity Engine

## Install

- Install nodejs: https://nodejs.org/en/download. It is quick and easy.
- Install dependencies with `npm i` shell command in generator folder.

## Generate

Generate aTweaks files with `npm run aTweaks`.

Since random ordering is generating target lists by using Fisher–Yates shuffle, it will alter all scripts on each generation.
Purpose of this is to reduce target prediction. By comparaison, SCS is using a stable random order for everything, so once you know the order, you can predict quite easily. Here, each list will be randomize, so if you have 5 spells with the same list, you will get 5 different orders.

## Customize

If you want to make easy edits, you can edit files inside config folder. Strong typings should prevent you to make errors, but it can still happen if you don't know what you are doing.


