# Per-game creature values — design

## Purpose

`weidu-creature.service.ts` generates one game-agnostic set of `.tpa` files from
`assets/creatures.csv` + the hand-authored creature definitions in `lib/creatures/*.ts`. It has
worked so far because testing was BG1-only. In BG2 the same `.cre` resref often names a
**different or differently-statted creature** than in BG1, and the generator currently patches it
with the BG1 values in both games.

`assets/creatures.csv` has gained a `game` column (`""` = both games, `bg1`, `bg2`), and duplicate
rows now exist: one `file` resref can appear once per game with different values. Examples from the
current data:

| resref | BG1 | BG2 | `MonsterId` |
| --- | --- | --- | --- |
| `GORF` | L9, class `OGRE`, anim `OGRE` | L5, class `FIGHTER`, anim `HALF_OGRE` | `Ogre` (both) |
| `SPIDFGSU` | Kitthix, L2 | Kitthix, L8 | `GiantSpider` (both) |
| `ORC04` | "Orc Leader", `FIGHTER` | "Orc Mage", `MAGE` | *(unmapped today)* |

Two sub-problems:

1. **Same monster, different values per game.** The resref maps to one creature in both games
   (`GORF` → `Ogre`) but needs different field values. This is live today and mis-patched in BG2.
2. **Different monster per game.** The resref is conceptually a different creature per game
   (`ORC04`). Every such row currently has an empty `MonsterId`, so nothing touches it, **and**
   `creatureFactory.validate()` forbids one file belonging to two validated creatures — so this
   case is currently unrepresentable. The design makes it *representable* (validation + generation
   become game-aware) without requiring any such mapping to be authored now.

The install game is known only at install time (`GAME_IS`), not at generation time, so the
solution gates game-specific output with `ACTION_IF` / `PATCH_IF GAME_IS` inside a single
generated mod rather than generating per-game trees.

## Non-goals

- **No per-game generation.** The generator keeps producing one mod; no `--game` flag, no
  `mod/.../{bg1,bg2}/` split, no tp2 restructuring.
- **No per-game *base* creature data.** A creature's `create({ data })` stays single-valued.
  Per-game value differences are expressed as `game`-tagged adjustments (§3). Base fields that a
  game-specific file inherits unchanged and that no adjustment overrides may therefore be
  technically wrong for that game (e.g. `GORF` in BG2 keeps base `Ogre` `general`/`race`); this is
  accepted — adjustments cover everything that matters in practice.
- **No consumption of the csv `level` column** by the generator. It remains report-only; per-game
  levels are authored in `data.level1` on `game`-tagged adjustments.
- **No IWD/PST support.** The mod is BG-only (`ENGINE_IS ~bgee bg2ee~`). `Game` is exactly
  `"bg1" | "bg2"`.
- **EET gets no dedicated handling.** It is folded into `bg1` (§5) so its behaviour does not
  regress; nothing more.
- `getDialogRows` / `getName` in `monster-files.service.ts` are **not** made game-aware in this
  pass (dialog validation and name lookup tolerate the extra rows).

## Data model

```ts
// lib/src/model/creature/game.ts  (new)
export type Game = "bg1" | "bg2";          // absent ⇒ both games
export interface CreatureFile {
  name: string;
  game?: Game;
}
```

### `Creature.files`

`BaseCreature` currently declares `files: string[]` and is implemented by `Creature` **and**
extended by `CreatureAdjustment`. Split it:

- `BaseCreature` keeps only `{ data: CreatureData }` (drop `files`). The one real reader of
  `BaseCreature.files` is `creature.service.ts:50` (a debug log) — it becomes `p.base` type-guarded
  or the log is adjusted.
- `Creature.files: CreatureFile[]` — normalized (see §2).
- `CreatureAdjustment.files: string[]` — declared directly on the interface, unchanged.

Add a getter for the many call sites that only want names:

```ts
get fileNames(): string[] { return this.files.map((f) => f.name); }
```

Call sites switched to `fileNames` (names only, no behaviour change):
`creature.factory.ts:160` (length), `creature.service.ts:183` (`checkAdjustmentFiles`),
`documentation.service.ts:681`, `family.ts:121` area (reads `a.files` — that's an adjustment, no
change). `weidu-creature.service.ts` is the one place that needs the `game` info (§5).

### Input type

`create({ files })`, `createFrom({ files })`, and `notEnforceFiles` accept
`(string | CreatureFile)[]`. A bare string ⇒ both games. `CreatureNewFile.files` is unrelated
(new files the mod creates) and stays `string[]`.

## CSV → creature files

### `monster-files.service.ts`

- All CSV parsers read the new `game` column (index lookup, like the existing columns).
- `parseMonsterFilesCsv` / `getFiles(monster)` → `CreatureFile[]`: **one entry per matching CSV
  row**, so `GORF` (two rows, both `MonsterId=Ogre`) yields `[{name:"GORF",game:"bg1"},
  {name:"GORF",game:"bg2"}]`; a `game=""` row yields `{name, game: undefined}`.
- `parseMonsterSummonFilesCsv` / `getSummonFiles(monster)` → `CreatureFile[]` likewise, so
  `applyCsvSummonFiles` can tag its synthetic summon adjustments (§3).
- `getUnvalidatedFiles` → `CreatureFile[]` (used only for a warn message; include game in the
  text).

### `family.ts` `resolveFiles()`

New signature: `resolveFiles(monster, backupFiles: (string | CreatureFile)[] = []): CreatureFile[]`.

1. Collect CSV entries (`getFiles`) + normalized backup entries (string ⇒ `{name}`), uppercasing
   every `name`.
2. **Collapse by name.** For each distinct name, the effective `game` is:
   - `undefined` (both) if any entry for that name has `game === undefined`, **or** the entries
     for that name together include both `"bg1"` and `"bg2"`;
   - otherwise the single `Game` value present.
3. Result: one `CreatureFile` per name, deduped.

So `GORF` → `{name:"GORF"}` (patched in both games; per-game *values* handled by adjustments); a
BG1-only summon resref → `{name:"X", game:"bg1"}` (patched only under `GAME_IS ~bgee eet~`).

`applyCsvSummonFiles` (`family.ts`) uses the same collapse for `getSummonFiles`, and the synthetic
`setAdjustments([{ files: [name], summon: true }])` gains `game` when the collapsed entry is
game-scoped.

## Adjustment `game` property

```ts
// lib/src/model/creature/adjustment.ts
export interface CreatureAdjustment extends BaseCreature {
  files: string[];
  game?: Game;          // absent ⇒ both games
  summon: boolean;
  noWeapon: boolean;
  scriptName: boolean;
  stringRef?: StringReference;
}
```

`game` is optional on `PartialCreatureAdjustment` and passed through verbatim by
`creatureFactory.setAdjustments` (alongside the existing `files`/`noWeapon`/… normalization).

**Semantics:** `game` gates the *entire* adjustment entry — its `data`, `summon`, `scriptName`,
`stringRef`, movement, everything `handleAdjustment` emits. It is independent of csv file
membership: an adjustment can be `game:"bg2"` even though the file exists in both games (the `GORF`
case — one entry `game:"bg1"` with the L9 block, a second `game:"bg2"` with the L5 block).

Authoring example (`lib/creatures/ogres.ts`, replacing the current single `GORF` L9 entry):

```ts
{ files: ["GORF","AC#WRIM1","HACK","LARZE"], game: "bg1",
  data: { level1: 9, strength: 19, class: "FIGHTER", xpv: 2000, /* … */ } },
{ files: ["GORF"], game: "bg2",
  data: { level1: 5, /* BG2 Gorf the Squisher */ } },
```

## Validation

### File uniqueness within a game (`creature.factory.ts` `validate`)

Current check flags any file name shared between two creatures:

```ts
const existingFiles = creature.files.filter((f) =>
  State.creatures.some((c) => c.files.includes(f)));
```

New rule: a conflict exists only when the two entries' game scopes **overlap** —

```ts
const gamesOverlap = (a?: Game, b?: Game) => a === undefined || b === undefined || a === b;
```

so `{ORC04, bg1}` on one creature and `{ORC04, bg2}` on another is allowed; `{ORC04}` (both) vs
anything named `ORC04` is a conflict, as is `{X, bg1}` vs `{X, bg1}`. Warning text names the
offending game(s).

### Adjustment `game` sanity (`creature.service.ts` `checkAdjustmentFiles`)

Already verifies `adjustment.files ⊆ creature.fileNames` (case-insensitive). Add: when
`adjustment.game` is set, each of its files must be available in that game — i.e. the creature's
collapsed entry for that name has `game === undefined` or `game === adjustment.game`. Otherwise
`logService.error` (a `game:"bg2"` adjustment on a BG1-only file is an authoring mistake).

## WEIDU generation (`weidu-creature.service.ts`)

### `GAME_IS` mapping

```ts
const GAME_IS: Record<Game, string> = { bg1: "GAME_IS ~bgee eet~", bg2: "GAME_IS ~bg2ee~" };
```

`bg1` includes `eet` so EET keeps the BG1 content it gets today (`comp_vars.tpa` sets `BG1=1` for
eet). A `Game`-scoped block for `bg2` is simply absent on EET.

### `patchCreatures` — file loop partitioning

Today: one `ACTION_FOR_EACH ~file~ IN "<all names>" BEGIN … END` whose body does
`FILE_EXISTS_IN_GAME` → `COPY_EXISTING` → effect/spell/item/proficiency/immunity removal & adds →
`patchCreature` → `patchScripts` → `handleAdjustments` → `BUT_ONLY_IF_IT_CHANGES`.

Change:

1. Partition `creature.files` into `both` (`game === undefined`), `bg1`, `bg2`.
2. Extract the current loop body into `patchCreatureFileLoop(lines, tab, creature, names: string[])`.
3. Emit:
   - `patchCreatureFileLoop(…, both)` unconditionally (byte-identical to today when a creature has
     no game-scoped files — the common case).
   - if `bg1.length`: `ACTION_IF GAME_IS ~bgee eet~ BEGIN` + `patchCreatureFileLoop(…, bg1)` + `END`.
   - if `bg2.length`: `ACTION_IF GAME_IS ~bg2ee~ BEGIN` + `patchCreatureFileLoop(…, bg2)` + `END`.

Inner helpers (`removeAllEffects`, `removeEffects`, `patchScripts`, `getNoWeaponFiles`, …) keep
scanning the **full** `creature.fileNames` when building `%SOURCE_RES%` `PATCH_IF` / excluded-file
conditions: a name that isn't in the current loop's `IN` list simply never matches, so their output
stays correct without threading the partition through them. Only the `IN` list and the
`ACTION_FOR_EACH ~file~` at `weidu-creature.service.ts:145` move.

`compileScripts` (compiles the mod's own `jam<id>.baf`) is unaffected — those scripts are assigned
to files inside `patchScripts`, which runs within the partitioned loop.

### `handleAdjustment` — per-entry game gate

`handleAdjustments` iterates `creature.adjustments`. When `adjustment.game` is set, wrap the entry's
emitted block:

```
PATCH_IF <GAME_IS[adjustment.game]> BEGIN
  <existing startConditionalSourceRes(files) … END block>
END
```

This nests inside the surrounding PATCH context (`COPY_EXISTING ~%file%.cre~ ~override~ …`);
`GAME_IS` is a valid patch predicate. No `game` ⇒ emitted exactly as today.

### `patchScripts` edge case

`patchScripts` builds `summonFiles` / `locationFiles` / `noScriptFiles` arrays from *all*
adjustments and emits `PATCH_DEFINE_ARRAY` + `LPF patchCreatureScript`. A `game`-scoped adjustment
that also sets `script.location` (or is a `game`-scoped summon) would contribute its files to those
arrays unconditionally.

Decision for this pass: **filter those arrays by the install game too** — a `game`-scoped
adjustment's files are added to the script arrays only inside the matching `ACTION_IF GAME_IS`
branch of the partitioned loop, OR (simpler) `patchScripts` splits each array into
both/bg1/bg2 and emits up to three `patchCreatureScript` calls. If this proves fiddly, the
fallback is to **document `game` + `script.location`/`game` + `summon` as unsupported** and
`logService.warn` when an authored adjustment combines them. The plan will pick one after a
closer read; no creature currently combines them.

## Docs / report / tests

- `scripts/report-game-adjustments.ts` (already present) stays the cross-check: csv rows whose
  per-game values differ but which no `game`-tagged adjustment covers. Extend it to also flag a
  `game`-tagged adjustment whose csv row does **not** actually differ (noise / mis-tag).
- `adjustment.service.ts` / `documentation.service.ts`: an adjustment's `game` should show in the
  generated docs panel (a small `bg1` / `bg2` chip on the adjustment card). Low priority; the plan
  may split this to a follow-up task.
- Tests:
  - `monster-files.service.test.ts` — `game` column parsed; `getFiles` returns per-row entries.
  - `family.test.ts` — collapse rule: both-game rows collapse to `{name}`; single-game →
    `{name, game}`; manual `CreatureFile` backup entries merge.
  - `creature.factory.test.ts` — same name across two creatures with non-overlapping games is
    valid; overlapping games still fails.
  - `creature.service.test.ts` — `checkAdjustmentFiles` errors on a `game`-tagged adjustment naming
    a wrong-game file.
  - `weidu-creature.service.test.ts` — partitioned `ACTION_FOR_EACH` loops wrapped in
    `ACTION_IF GAME_IS`; `game`-tagged adjustment wrapped in `PATCH_IF GAME_IS`; a creature with no
    game-scoped files and no game-tagged adjustments produces byte-identical output to before.

## Files touched

| File | Change |
| --- | --- |
| `lib/src/model/creature/game.ts` | new — `Game`, `CreatureFile` |
| `lib/src/model/creature/creature.ts` | `Creature.files: CreatureFile[]`, `fileNames` getter, `BaseCreature` loses `files` |
| `lib/src/model/creature/adjustment.ts` | `game?: Game`; `files: string[]` declared directly |
| `lib/src/model/creature/data-input.ts` / `family.ts` | `files` input `(string | CreatureFile)[]` |
| `lib/src/services/monster-files.service.ts` | parse `game`; `getFiles`/`getSummonFiles`/`getUnvalidatedFiles` → `CreatureFile[]` |
| `lib/src/model/creature/family.ts` | `resolveFiles` collapse rule; `applyCsvSummonFiles` game tagging |
| `lib/src/factories/creature.factory.ts` | pass `game` through `setAdjustments`; game-aware uniqueness in `validate` |
| `lib/src/services/creature.service.ts` | `checkAdjustmentFiles` game sanity; `fileNames` |
| `lib/src/services/weidu/weidu-creature.service.ts` | `GAME_IS` map; partitioned file loops; `handleAdjustment` gate; `patchScripts` |
| `scripts/report-game-adjustments.ts` | extend cross-check |
| `lib/creatures/*.ts` | tag existing per-game adjustments (`ogres.ts` `GORF`, others per the report) |
| tests | as above |
