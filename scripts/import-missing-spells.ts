import * as fs from "fs";
import * as path from "path";
import { SPELLS } from "../lib/config/spells/spell-database";
import { getAllSpells } from "../lib/src/model/spell-item/spell-reference";
import { parseCsv } from "./lib/csv";
import { insertEntries, type NewEntry, spellKey } from "./lib/spell-import";
import { ResourceReader } from "./lib/spell-saves";

// Adds the spells left in assets/spells/missing-spells.csv (see scripts/list-missing-spells.ts,
// the user strikes the ones not worth having) to lib/config/spells/spell-database.ts: their file,
// level and SPELL.IDS identifier, under a key made from their game name. No translated name: the
// key reads well enough, and new translation keys would renumber the mod's strings. Then run
// scripts/extract-spell-profile.ts and scripts/extract-spell-saves.ts with --write for the rest.
//
// Run: ts-node scripts/import-missing-spells.ts [--game <dir>]

const DEFAULT_GAME = "C:/Games/BG2EE";
const CSV = path.join("assets", "spells", "missing-spells.csv");
const DATABASE = path.join("lib", "config", "spells", "spell-database.ts");
const IDENTIFIERS = path.join("lib", "src", "model", "ids", "spell.ts");
const IDS_TYPE = 0x3f0;
/** Per CSV type: the SPELLS category, its constant in spell-database.ts, its SPELL.IDS range */
const CATEGORIES: Partial<
  Record<string, { key: keyof typeof SPELLS; constant: string; ids: number }>
> = {
  priest: { key: "Priest", constant: "PRIEST_SPELLS", ids: 1000 },
  wizard: { key: "Wizard", constant: "WIZARD_SPELLS", ids: 2000 },
  class: { key: "Class", constant: "CLASS_SPELLS", ids: 4000 },
};

function gameDir(): string {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--game");
  return idx >= 0 ? args[idx + 1] : DEFAULT_GAME;
}

/** SPELL.IDS: each spell number to its identifier */
function spellIds(reader: ResourceReader): Map<number, string> {
  const ids = reader.read("SPELL", IDS_TYPE, "IDS");
  if (!ids) throw new Error("SPELL.IDS not found");
  const numbers = new Map<number, string>();
  for (const line of ids.toString("latin1").split(/\r?\n/)) {
    const match = /^\s*(\d+)\s+(\S+)/.exec(line);
    if (match) numbers.set(Number(match[1]), match[2]);
  }
  return numbers;
}

function main() {
  const reader = new ResourceReader(gameDir(), true);
  const ids = spellIds(reader);
  // only identifiers the SpellIdentifier type knows, and not used yet
  const knownIds = new Set(fs.readFileSync(IDENTIFIERS, "utf-8").match(/"[A-Z0-9_]+"/g) ?? []);
  const usedIds = new Set(getAllSpells(SPELLS).map((s) => s.id));
  const usedKeys = new Map(
    Object.entries(SPELLS).map(([category, spells]) => [category, new Set(Object.keys(spells))]),
  );
  const rows = parseCsv(fs.readFileSync(CSV, "utf-8")).rows;
  const byCategory = new Map<string, NewEntry[]>();
  for (const row of rows) {
    const category = CATEGORIES[row.type];
    if (!category) throw new Error(`${row.file}: unknown type '${row.type}'`);
    const keys = usedKeys.get(category.key) ?? new Set<string>();
    let key = spellKey(row.name);
    if (keys.has(key)) key = `${key}${row.file}`;
    keys.add(key);
    const id = ids.get(category.ids + Number(row.file.slice(4)));
    const lines = [`file: "${row.file}"`];
    if (id && knownIds.has(`"${id}"`) && !usedIds.has(id as never)) {
      lines.push(`id: "${id}"`);
      usedIds.add(id as never);
    }
    lines.push(`level: ${row.level}`);
    const entries = byCategory.get(category.constant) ?? [];
    entries.push({ key, lines });
    byCategory.set(category.constant, entries);
  }
  let database = fs.readFileSync(DATABASE, "utf-8");
  for (const [constant, entries] of byCategory) {
    database = insertEntries(database, constant, entries);
  }
  fs.writeFileSync(DATABASE, database);
  const counts = [...byCategory].map(([c, e]) => `${e.length} ${c}`).join(", ");
  console.log(
    `imported ${rows.length} spells (${counts}) into ${DATABASE}: format it with prettier`,
  );
}

main();
