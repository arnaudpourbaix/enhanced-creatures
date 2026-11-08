import * as fs from "fs";
import * as path from "path";
import { getAllFnpSpells } from "../lib/config/spells/fnp-spell-database";
import { SPELLS } from "../lib/config/spells/spell-database";
import { getAllSpells, spellFiles } from "../lib/src/model/spell-item/spell-reference";
import { parseCsv } from "./lib/csv";
import { addFieldToDatabase } from "./lib/spell-database-writer";
import { ResourceReader } from "./lib/spell-saves";
import { schoolOf, schoolOfType, type SchoolRow } from "./lib/spell-school";

// Adds the primary school (SPL 0x25) of each SPELLS entry (lib/config/spells/spell-database.ts)
// and Faiths and Powers spell (lib/config/spells/fnp-spell-database.ts) from the `school` column of
// assets/spells/spells_source.csv, matched on file and ids (see schoolOf). An entry the CSV doesn't
// hold - a file a mod repurposed (Blindness), a spell missing from spell.ids (Faiths and Powers) -
// takes the school of its SPL in the game install, as shipped then with the install's mods. A
// declared school is never changed, and a spell of no school declares none.
//
// Run: ts-node scripts/extract-spell-schools.ts [--write] [--game <dir>]

const DEFAULT_GAME = "C:/Games/BG2EE";
const SOURCE = path.join("assets", "spells", "spells_source.csv");
const DATABASE = path.join("lib", "config", "spells", "spell-database.ts");
const FNP_DATABASE = path.join("lib", "config", "spells", "fnp-spell-database.ts");
const SPL_TYPE = 0x3ee;

function parseArgs(): { gameDir: string; write: boolean } {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--game");
  return { gameDir: idx >= 0 ? args[idx + 1] : DEFAULT_GAME, write: args.includes("--write") };
}

function main() {
  const { gameDir, write } = parseArgs();
  const rows = parseCsv(fs.readFileSync(SOURCE, "utf-8")).rows as unknown as SchoolRow[];
  const readers = [new ResourceReader(gameDir, false), new ResourceReader(gameDir, true)];
  const splSchool = (file: string) => {
    for (const reader of readers) {
      const spl = reader.read(file, SPL_TYPE, "SPL");
      if (spl) return schoolOfType(spl.readUInt8(0x25));
    }
    return undefined;
  };
  const databases = [
    { database: DATABASE, spells: getAllSpells(SPELLS) },
    { database: FNP_DATABASE, spells: getAllFnpSpells() },
  ];
  const owners = new Map<string, number>();
  for (const spell of databases.flatMap(({ spells }) => spells)) {
    for (const file of spellFiles(spell)) {
      owners.set(file.toUpperCase(), (owners.get(file.toUpperCase()) ?? 0) + 1);
    }
  }
  const ownsFile = (file: string) => owners.get(file.toUpperCase()) === 1;
  for (const { database, spells } of databases) {
    const fromGame: string[] = [];
    const unmatched: string[] = [];
    const values = spells.flatMap((spell) => {
      let school = schoolOf(rows, spell, ownsFile);
      if (school === undefined) {
        school = splSchool(spell.file);
        const label = `${spell.key} (${spellFiles(spell).join(", ")})`;
        (school === undefined ? unmatched : fromGame).push(`${label}: ${school ?? "-"}`);
      }
      if (!school || "school" in spell) return [];
      const value = `ItemAbilityPrimaryTypeEnum.${school}`;
      return [{ file: spell.file.toUpperCase(), key: spell.key, value }];
    });
    console.log(`${database}: ${values.length} schools to add of ${spells.length} entries`);
    if (fromGame.length) console.log(`  from the game:\n    ${fromGame.join("\n    ")}`);
    if (unmatched.length) console.log(`  not found:\n    ${unmatched.join("\n    ")}`);
    if (write) {
      fs.writeFileSync(
        database,
        addFieldToDatabase(fs.readFileSync(database, "utf-8"), "school", values),
      );
    }
  }
}

main();
