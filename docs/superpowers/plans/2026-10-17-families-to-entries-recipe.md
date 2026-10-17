# Migration recipe: one family → entries (+ kin)

Read with the spec (`docs/superpowers/specs/2026-10-17-families-to-entries-design.md`). Every
migration task (Tasks 3–7 of the plan) applies this recipe to the families it lists.

## 1. Decide the units

- **Entries**: one per monster (identity rule), using the `EntryEnum` values added in Task 2. A
  multi-member entry (`addEntry` today) keeps its members and order.
- **Kin**: only if several entries of the family share code or resources: a family-level
  resource (built in the family constructor: `this.addSpell/addItem/addProjectile` or a
  `this.createX()` that does), a helper method of the family's creature subclass used by several
  entries, or a module-level helper used by several entries. Write the decision (kin or not, and
  which entries) into the task report with the shared things that justify it.

## 2. Move the code

- Kin: `lib/creatures/<kin>/kin.ts` holds the `CreatureKin` subclass (constructor creates the
  shared resources, in the same order as the old family constructor), the creature subclass
  (e.g. `Cat extends Creature` with its helpers), and shared module-level helpers. One file per
  entry next to it: `lib/creatures/<kin>/<entry-kebab>.ts`, exporting `create<Entry>Entry(kin)`
  (or the factory shape Task 2 defined).
- No kin: `lib/creatures/<entry-kebab>.ts` with the entry class (or a plain `CreatureEntry`
  instance) and, if needed, its creature subclass.
- Entry-only shared resources (used by several members of one entry, e.g. the Basilisk's
  petrification) go in the entry constructor: scope `e`.
- Keep every value, every creation order (spells/items counters, creature order), every
  translation key. Move code, don't rewrite it.
- Register kins in `lib/creatures/kins.ts` and entries in `lib/creatures/entries.ts`, in the
  family's old position (entries in their old registration order). Remove the family from
  `familyFactories`.

## 3. Move the mod files

- `git mv` hand-written files: the family's `common.tpa` and `assets/` go to the kin folder
  (`mod/lib/pnp-monster/kin/<kin>/`) when there is a kin, else to the entry that uses them.
  Assets used by one entry only (creature templates, `.baf` game-script overrides) go to that
  entry's `assets/`: decide each file by grepping which creature references it, and list the
  mapping in the report. Update the hand-written tpa paths that reference moved files.
- Generated files are not moved by hand: regeneration writes them in the new folders. Delete the
  old family folder's generated files only if the plan's task says so (the final removal task
  deletes whole old family folders).

## 4. Resources

- Family-scoped names (`ja?f<fam>nn`) become kin-scoped (`ja?k<kin>nn`) or entry-scoped
  (`ja?e<entry>nn`) with the same counter. Record the old → new list in the report and add it to
  the normaliser's map.

## 5. Verify

- Dump with the harness into `$SCRATCH/dump-<task>`; run the normaliser from the previous task's
  dump with the task's path/name map (old family folder → new entry/kin folder per file, old
  family-scoped names → new). Expected: identical, except `index.tpa`/`index.json` content and the
  root/family `main.tpa` split (the union of INCLUDE lines must match). Paste the output.
- Unit tests and `npx tsc -p . --noEmit` green; scoped eslint; prettier `--end-of-line auto`.
