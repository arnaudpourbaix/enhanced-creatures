import * as fs from "fs";
import * as path from "path";
import { getAllFnpSpells } from "../lib/config/spells/fnp-spell-database";
import { SPELLS } from "../lib/config/spells/spell-database";
import { getAllSpells, type SpellReference } from "../lib/src/model/spell-item/spell-reference";
import { addFieldToDatabase, type DatabaseValue } from "./lib/spell-database-writer";
import { createdItems } from "./lib/spell-items";
import { ResourceReader } from "./lib/spell-saves";

// Writes the `createsItems` of the attack spells of the wizard, priest and Faiths and Powers
// databases (lib/config/spells/*.ts) from a game install: the weapons their SPL creates, as shipped
// (the BIFs alone) and with the install's mods (override first), so it holds either way. A declared
// value is never changed.
//
// Run: ts-node scripts/extract-spell-items.ts [--game <dir>]

const DEFAULT_GAME = "C:/Games/BG2EE";
const DATABASE = path.join("lib", "config", "spells", "spell-database.ts");
const FNP_DATABASE = path.join("lib", "config", "spells", "fnp-spell-database.ts");
const SPL_TYPE = 0x3ee;
const ATTACK_ROLES: SpellReference["role"][] = ["damage", "kill"];

function parseGameDir(): string {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--game");
  return idx >= 0 ? args[idx + 1] : DEFAULT_GAME;
}

function values(spells: SpellReference[], readers: ResourceReader[]): DatabaseValue[] {
  return spells.flatMap((spell) => {
    if (!ATTACK_ROLES.includes(spell.role)) return [];
    const items = readers.flatMap((reader) =>
      createdItems(spell.file, (file) => reader.read(file, SPL_TYPE, "SPL")),
    );
    if (!items.length) return [];
    const value = JSON.stringify([...new Set(items)]);
    return [{ file: spell.file, key: (spell as { key?: string }).key, value }];
  });
}

function write(file: string, spells: SpellReference[], readers: ResourceReader[]): number {
  const found = values(spells, readers);
  const source = fs.readFileSync(file, "utf8");
  fs.writeFileSync(file, addFieldToDatabase(source, "createsItems", found));
  return found.length;
}

function main(): void {
  const gameDir = parseGameDir();
  const readers = [new ResourceReader(gameDir, false), new ResourceReader(gameDir, true)];
  const wizardsAndPriests = getAllSpells({ Wizard: SPELLS.Wizard, Priest: SPELLS.Priest });
  const count =
    write(DATABASE, wizardsAndPriests, readers) + write(FNP_DATABASE, getAllFnpSpells(), readers);
  console.log(`${count} spells create a weapon`);
}

main();
