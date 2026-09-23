import * as fs from "fs";
import * as path from "path";
import { SPELLS, type SpellReference } from "../lib/config/spells/spell-names";
import { parseCsv } from "./lib/build-creatures";
import {
  findAvailabilityGaps,
  findFileCollisions,
  findIdentityMismatches,
  loadSnapshot,
  renderSpellCollisionsReport,
  type RegistryEntry,
} from "./lib/spell-collisions";

// Cross-checks SPELLS (lib/config/spells/spell-names.ts) against the two spell-identity states
// this pack actually supports (see the spellbook-availability design discussion): 001_vanilla (none
// of Spell Revisions/Stratagems installed) and 004_stratagems_newspells (all of them installed
// together - partial combinations aren't supported, so 002/003's intermediate snapshots are kept on
// disk as historical evidence but aren't compared against here). A mod can repurpose a file's slot
// for a different spell - e.g. Spell Revisions turns SPWI106 from Blindness into Obscuring Mist,
// and SPELLS currently has both Blindness and ObscuringMist pinned to that same (file, id) pair,
// each only correct in one of the two states.
//
// Writes assets/spells/spell-collisions-report.md listing:
//  - file collisions: two SPELLS entries sharing a file, and which state(s) each one is actually
//    correct in ("disjoint" is a real gap - the entry never says which mod state it needs;
//    "same-state conflict" or "dangling entry" are outright bugs).
//  - identity mismatches: any SPELLS entry whose declared id stops matching the file's actual
//    spell.ids constant in the other state, whether or not another entry collides with it.
//
// Run: ts-node scripts/report-spell-collisions.ts   (pass --assets <dir> to point elsewhere)

const SNAPSHOT_FILES = ["001_vanilla.csv", "004_stratagems_newspells.csv"];

/** Which snapshot each SpellbookModName's content appears in - matches SNAPSHOT_FILES' order. */
const MOD_INTRODUCED_AT: Partial<Record<string, string>> = {
  AllSpellMods: "004_stratagems_newspells",
};

function parseArgs(): { assetsDir: string } {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--assets");
  const assetsDir = path.resolve(
    idx >= 0 ? args[idx + 1] : path.join(process.cwd(), "assets", "spells"),
  );
  return { assetsDir };
}

function readCsv(file: string) {
  if (!fs.existsSync(file)) {
    console.error(`Missing input: ${file}`);
    process.exit(1);
  }
  return parseCsv(fs.readFileSync(file, "utf-8"));
}

/** Qualifies each SPELLS key as "<group>.<key>" (e.g. "Wizard.AcidFog") so same-named keys across
 * groups (both Wizard and Priest define a "DispelMagic") don't get confused in the report. */
function registryEntries(): RegistryEntry[] {
  const entries: RegistryEntry[] = [];
  for (const [group, spells] of Object.entries(SPELLS)) {
    for (const [key, spell] of Object.entries(spells as Record<string, SpellReference>)) {
      entries.push({
        key: `${group}.${key}`,
        file: spell.file,
        id: spell.id,
        variantFiles: spell.variants?.map((v) => v.file),
        requiresFromSnapshot: spell.requiresMod ? MOD_INTRODUCED_AT[spell.requiresMod] : undefined,
      });
    }
  }
  return entries;
}

const { assetsDir } = parseArgs();
const snapshots = SNAPSHOT_FILES.map((file) =>
  loadSnapshot(file.replace(".csv", ""), readCsv(path.join(assetsDir, file))),
);

const entries = registryEntries();
const mismatches = findIdentityMismatches(entries, snapshots);
const collisions = findFileCollisions(entries, snapshots);
const gaps = findAvailabilityGaps(entries, snapshots);

const reportPath = path.join(assetsDir, "spell-collisions-report.md");
fs.writeFileSync(reportPath, renderSpellCollisionsReport(mismatches, collisions, gaps), "utf-8");

console.log(
  `Wrote ${mismatches.length} identity mismatch(es), ${collisions.length} file collision(s) and ` +
    `${gaps.length} availability gap(s) to ${path.relative(process.cwd(), reportPath)}`,
);
const bugs = collisions.filter((c) => c.sameStateConflict || c.hasDanglingEntry);
if (bugs.length > 0) {
  console.log(
    `${bugs.length} collision(s) look like real bugs (same-state conflict or dangling entry):`,
  );
  for (const c of bugs) console.log(`  ${c.file}: ${c.entries.map((e) => e.key).join(", ")}`);
}
const modGated = gaps.filter((g) => !g.availableFromStart);
const wrongFile = gaps.filter((g) => g.availableFromStart && !g.fileConsistent);
if (modGated.length > 0) {
  console.log(
    `${modGated.length} entr${modGated.length === 1 ? "y is" : "ies are"} mod-gated (not in vanilla):`,
  );
  for (const g of modGated) console.log(`  ${g.key} (${g.id})`);
}
if (wrongFile.length > 0) {
  console.log(
    `${wrongFile.length} entr${wrongFile.length === 1 ? "y" : "ies"} declared file doesn't hold ` +
      "for every snapshot the id is available in:",
  );
  for (const g of wrongFile) {
    const where = g.availableIn.map((a) => `${a.snapshot}: ${a.file}`).join(", ");
    console.log(`  ${g.key} (declared ${g.declaredFile}) - ${where}`);
  }
}
