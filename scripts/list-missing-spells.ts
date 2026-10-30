import * as fs from "fs";
import * as path from "path";
import { getAllFnpSpells } from "../lib/config/spells/fnp-spell-database";
import { SPELLS } from "../lib/config/spells/spell-database";
import { getAllSpells, spellFiles } from "../lib/src/model/spell-item/spell-reference";
import { serializeCsv } from "./lib/csv";
import { ResourceReader } from "./lib/spell-saves";
import { readTlk } from "./lib/tlk";

// Lists the wizard, priest and class spells of a game install the spell databases (SPELLS, Faiths
// and Powers) don't have yet, with their name, level and description, so the user can strike the
// ones not worth adding before they're imported. Innates are left out: many are monster-only.
//
// Writes assets/spells/missing-spells.csv.
//
// Run: ts-node scripts/list-missing-spells.ts [--game <dir>]

const DEFAULT_GAME = "C:/Games/BG2EETest";
const OUTPUT = path.join("assets", "spells", "missing-spells.csv");
const SPL_TYPE = 0x3ee;
/** Wizard spells of levels 1-9, priest spells of levels 1-7, class abilities */
const CANDIDATE = /^(SPWI[1-9]\d\d|SPPR[1-7]\d\d|SPCL\d{3})$/;
const TYPES: Record<string, string> = { SPWI: "wizard", SPPR: "priest", SPCL: "class" };

/** The description on one line, without its first line when that is the spell's name again. */
function oneLine(description: string, name: string): string {
  const lines = description.split(/\r?\n/).map((line) => line.trim());
  if (lines[0] === name) lines.shift();
  return lines.filter((line) => line).join(" ");
}

function gameDir(): string {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--game");
  return idx >= 0 ? args[idx + 1] : DEFAULT_GAME;
}

function main() {
  const dir = gameDir();
  const reader = new ResourceReader(dir, true);
  const text = readTlk(fs.readFileSync(path.join(dir, "lang", "en_US", "dialog.tlk")));
  const known = new Set(
    [
      ...getAllSpells(SPELLS).flatMap((s) => spellFiles(s)),
      ...getAllFnpSpells().map((s) => s.file),
    ].map((file) => file.toUpperCase()),
  );
  const rows = reader
    .names(SPL_TYPE, "SPL")
    .filter((file) => CANDIDATE.test(file) && !known.has(file))
    .flatMap((file) => {
      const spl = reader.read(file, SPL_TYPE, "SPL");
      if (!spl || spl.length < 0x72 || !spl.readUInt16LE(0x68)) return [];
      // unidentified name and description: what a spell shows
      const name = text(spl.readInt32LE(0x08))?.trim();
      if (!name || name === "<NO TEXT>") return [];
      return [
        {
          file,
          name,
          type: TYPES[file.slice(0, 4)],
          level: String(spl.readUInt32LE(0x34)),
          description: oneLine(text(spl.readInt32LE(0x50)) ?? "", name),
        },
      ];
    })
    .sort((a, b) => (a.file < b.file ? -1 : 1));
  fs.writeFileSync(OUTPUT, serializeCsv(["file", "type", "level", "name", "description"], rows));
  const count = (type: string) => rows.filter((r) => r.type === type).length;
  console.log(
    `${rows.length} missing spells (${count("wizard")} wizard, ${count("priest")} priest, ` +
      `${count("class")} class) written to ${OUTPUT}`,
  );
}

main();
