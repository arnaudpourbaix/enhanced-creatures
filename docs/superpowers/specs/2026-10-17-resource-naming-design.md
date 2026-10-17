# Resource naming: design

Sub-project 3 of the [monster entries & types roadmap](2026-10-16-monster-entries-roadmap.md).
Brainstormed 2026-10-17.

## Goal

One naming rule for every `ja` resource in the mod, generated or handwritten, so that a monster's
code (its id in base 36) finds all its files: tpa, scripts, spells, items, summons, assets. The log
and the docs show that code.

Today's scheme (`ja` + kind + counter in 1 hex + `m`/`f` + id in hex, e.g. `jas1m3`) breaks at
monster id 256, allows 16 resources per kind per owner, uses three number formats (decimal in code,
hex in files, free-form handwritten names), and nothing prevents an SPL and an ITM from sharing a
name (an effect referencing that name can pick the wrong one).

## The scheme

```
ja  k  s  oo  nn      always 8 characters
    │  │  │   └─ counter: base 36, 2 chars, zero-padded (00–zz, 1296 values)
    │  │  └───── owner id: base 36, 2 chars, zero-padded
    │  └──────── scope: m = monster (MonsterEnum), f = family (MonsterFamilyEnum, until
    │            sub-project 4), e = entry (reserved), c = common (owner 00)
    └─────────── kind: s = spl (its .pro/.eff reuse the name), i = itm, p = standalone pro,
                 b = bcs script, c = cre, a = bam, v = vvc
```

- **Code** of an id: `toCode(id)` = base 36, 2 chars, zero-padded. Fledgling Vampire 153 → `49`,
  Construct family 8 → `08`. One helper; every name and display uses it.
- **One naming function**: `getResourceName(kind, scope, ownerId, counter)` in
  `lib/src/services/utils/misc.func.ts`, replacing `getFilename`. It throws when the owner id or the
  counter exceeds `zz` (1295).
- **Scripts**: kind `b`, counter `00` = main script, `01` = summon script (more if ever needed):
  `jabm4900.baf`, `jabm4901.baf`.

### Examples (Fledgling Vampire, 153 → `49`)

| Today                                  | New                             |
| -------------------------------------- | ------------------------------- |
| `jas099` (spell #0)                    | `jasm4900`                      |
| `jai199` (item #1)                     | `jaim4901`                      |
| `jam99.baf` / `jam99su.baf`            | `jabm4900.baf` / `jabm4901.baf` |
| `99.tpa`, WeiDU function `jam99_patch` | `49.tpa`, `jam49_patch`         |

## Generated resources

Every place that builds a name uses `getResourceName` / `toCode`:

- spells, items, projectiles (`abstract-creature.ts` `addSpell/addItem/addProjectile`), effects and
  spell projectiles keep reusing their spell's name;
- the grab spell (`grab.service.ts`) keeps reserving the next spell counter;
- creature scripts (`weidu-creature.service.ts`), creature `.tpa` file names and the `_patch`
  function name;
- the log (`family.ts`: `Creating Fledgling Vampire (49)...`);
- the docs: each card title shows the code after the name as a small `#49`.

## Handwritten resources

All handwritten `ja` resources (43, counting each asset file once) move into the scheme (the `ja_wilderness` literal in `feys.ts` is not
a resource and stays).

- **Owned** by one monster or family: scope `m`/`f` with that owner's code. Rule: a resource used
  by one monster belongs to that monster; an asset copied by a family's `common.tpa` belongs to the
  family. Examples: Treant summons `jatrea1`–`jatrea4` and their template `jatrean.cre` →
  `jacm19..` (Treant 45 → `19`); Dryad/Hamadryad summons; the pudding, jelly and slime split/template
  creatures under each ooze; `jasnake.cre`/`jagpsnak` under the Giant Poisonous Snake; `jazombie.cre`
  under Zombie; `jaenkis.bam`, `jafspkp.bam`, `jaskiss.vvc` under the Fey family (copied by
  `fey/common.tpa`); `jaicew.bam` under the Undead family.
- **Shared**: scope `c`, owner `00`, counter per kind: trait items `jai1`–`jai19` and `ja6`–`ja8` →
  `jaic0000`…; Symbol of Pain `jaspain` → `jasc0000`; Area of Sight `jasight` → `japc0000`.
- The exact old → new table is fixed in the implementation plan. Values live in their existing
  constants (`ITEMS`, `CREATURES`, `config/spells`, the projectiles enum, `copyFrom`/`icon`
  literals), so most renames are one value each.
- Asset files are renamed on disk (the 14 `ja` files under the families' `assets/` folders, plus the 3 Symbol of Pain icons
  `jaspainA/B/C.BAM` in `pnp-spell/symbol_pain/`), and their
  references in the three hand-written tpa files: `common/core.tpa`, `fey/common.tpa`,
  `undead/common.tpa`, `pnp-spell/symbol_pain/main.tpa`.
- Symbol of Pain's icons are built today as `${spell}B` / `${spell}C` (`jaspainB`, `jaspainC`):
  with an 8-character spell name that would give 9 characters, so its icons get their own names
  (`jaac0000`–`jaac0002`) and `lib/spells/symbol_pain.ts` names them explicitly.
- `woodland_beings` (not installed: commented out in the tp2) keeps its old `ja#` names.
- `jadryad.cre` embeds two stale names (`ja#1m41`, `ja#i5`); the generated tpa overrides its
  scripts and items at install, so they are left as they are.

## Icon suffix rule

`spell.service.ts` appends `C` (spell) / `B` (header) to an icon ending in 3 digits, for vanilla
names (`SPWI305` → `SPWI305C`). New names often end in 3 digits (`jaac0000`), so the rule skips
names starting with `ja`.

## Guards

- **Scheme test**: every `ja` resource name, in the code's resource constants/literals and in the
  file names under `assets/` and `pnp-monster/common/`, matches `^ja[sipbcav][mfec][0-9a-z]{4}$`. A
  short allowlist holds non-resource names (`ja_wilderness`).
- **SPL/ITM clash check** at the end of generation: every SPL and ITM base name (case-insensitive,
  handwritten ones included) is collected; a name used by both fails the run and lists the culprits.

## Cleaning generated output

Generation only writes files. Before writing a family folder, it now deletes the files it generates
there: creature `.tpa` files, `main.tpa`, root-level `.baf` files. It keeps `common.tpa`, `assets/`,
and the whole `pnp-monster/common/` folder. This removes the old hex-named files and, from now on,
files of removed or renamed creatures.

## Unchanged

Translation numbering, file contents apart from names, `MonsterEnum`/`MonsterFamilyEnum` values,
directory layout.

## Verification

- Unit tests: `toCode`/`getResourceName` (padding, base 36, the `zz` limit), the SPL/ITM clash
  check, the cleaner (deletes generated files, keeps hand-written ones), the scheme test itself.
- Output: every resource is renamed, so a plain manifest diff is useless. Compare manifests with
  names normalised: map each old name to its new one (file paths and file contents), then the
  normalised before and after must be identical. That proves only names changed.
- Two steps, each verified: (1) handwritten resources renamed; (2) generated resources renamed.
- `mod/CHANGELOG.md`: existing installs need a full reinstall (uninstall the previous version
  first); saved games may lose items with old names.

## Out of scope

Entry-owned resources (`e` scope, sub-project 4); merging per-family weapon name keys (separate
step from sub-project 2); folder layout.
