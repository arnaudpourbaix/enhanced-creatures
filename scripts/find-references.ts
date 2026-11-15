import * as fs from "fs";
import * as path from "path";
import { ResourceReader } from "./lib/spell-saves";

// Who references a resource: every SPL, ITM, EFF, CRE, BCS, DLG, ARE, STO, 2DA (...) of a game
// install naming it, override first then the BIFs, with where it is named (the effect opcode of a
// spell or item, the script action, the creature or area field, the dialog line...). Then who
// references those spells, items, EFFs and 2DAs, up to --depth levels: "who summons X" is
// CRE <- SPL (op 67) <- CRE knowing the spell, or <- BCS casting it.
// Also lists the files of this mod's generated output (mod/) naming it.
//
// Run: ts-node scripts/find-references.ts <RESREF>... [--game bg1|bg2|<dir>] [--depth N]
// Without --game, searches every game of paths.local.json. --depth defaults to 2.
//
// Not found: references by number rather than resref - Spell()/ReallyForceSpell() with a
// SPELL.IDS number in scripts, op 127 summon tables picked by index (MONSUM0x.2DA rows are found).

interface ResourceType {
  type: number;
  extension: string;
  /** Text formats match whole tokens; binary ones the 8-byte resref fields */
  text: boolean;
}

const TYPES: ResourceType[] = [
  { type: 0x3ed, extension: "ITM", text: false },
  { type: 0x3ee, extension: "SPL", text: false },
  { type: 0x3ef, extension: "BCS", text: true },
  { type: 0x3f1, extension: "CRE", text: false },
  { type: 0x3f2, extension: "ARE", text: false },
  { type: 0x3f3, extension: "DLG", text: true },
  { type: 0x3f4, extension: "2DA", text: true },
  { type: 0x3f6, extension: "STO", text: false },
  { type: 0x3f8, extension: "EFF", text: false },
  { type: 0x3f9, extension: "BS", text: true },
  { type: 0x3fd, extension: "PRO", text: false },
];
const IDS_TYPE = 0x3f0;
const SPL = "SPL";
const ITM = "ITM";
const CONTINGENCY = "contingency";
const SEQUENCER = "spell sequencer";

/** Types whose own referrers are followed (to the CRE or area where a chain starts). */
const FOLLOWED = new Set([SPL, ITM, "EFF", "2DA", "PRO", "DLG", "BCS"]);

const OPCODES: Record<number, string> = {
  67: "create creature",
  127: "summon monsters (2DA)",
  135: "polymorph",
  146: "cast spell",
  147: "learn spell",
  148: "cast spell at point",
  171: "give innate ability",
  177: "use EFF file",
  214: "select spell (2DA)",
  232: CONTINGENCY,
  234: CONTINGENCY,
  256: SEQUENCER,
  258: SEQUENCER,
  260: SEQUENCER,
  272: "apply repeating EFF",
  326: "apply effects list",
  331: "random monster summoning",
  333: "static charge",
  410: "summon familiar",
  411: "summon familiar",
};

const opcodeLabel = (opcode: number) => {
  const name = OPCODES[opcode];
  return name ? `op ${opcode} ${name}` : `op ${opcode}`;
};

/** Letters, digits, `_` and `#`: what a resref token is made of. */
const TOKEN = /[\w#]/;
const isToken = (byte: number | undefined) =>
  byte !== undefined && TOKEN.test(String.fromCharCode(byte));

function matchesAt(data: Buffer, offset: number, upper: Buffer, lower: Buffer): boolean {
  for (let j = 0; j < upper.length; j++) {
    const byte = data[offset + j];
    if (byte !== upper[j] && byte !== lower[j]) return false;
  }
  return true;
}

/** Offsets of the resref in `data`, case-insensitive: whole tokens in text, whole fields else. */
function matches(data: Buffer, resref: string, text: boolean): number[] {
  const upper = Buffer.from(resref.toUpperCase(), "latin1");
  const lower = Buffer.from(resref.toLowerCase(), "latin1");
  const found: number[] = [];
  for (let i = 0; i <= data.length - upper.length; i++) {
    if (!matchesAt(data, i, upper, lower)) continue;
    const after = data[i + upper.length];
    const whole = text
      ? !isToken(data[i - 1]) && !isToken(after)
      : upper.length === 8 || after === 0;
    if (whole) found.push(i);
  }
  return found;
}

/** The extended header (spell level or item ability) owning effect `index` of an SPL/ITM. */
function headerOf(data: Buffer, index: number, extension: string): string | undefined {
  const castingIndex = data.readUInt16LE(0x6e);
  const castingCount = data.readUInt16LE(0x70);
  if (index >= castingIndex && index < castingIndex + castingCount) {
    return extension === ITM ? "equipped" : "on cast";
  }
  const headerOffset = data.readUInt32LE(0x64);
  const size = extension === SPL ? 0x28 : 0x38;
  for (let h = 0; h < data.readUInt16LE(0x68); h++) {
    const header = headerOffset + h * size;
    const count = data.readUInt16LE(header + 0x1e);
    const first = data.readUInt16LE(header + 0x20);
    if (index < first || index >= first + count) continue;
    return extension === SPL ? `level ${data.readUInt16LE(header + 0x10)}+` : `ability ${h + 1}`;
  }
  return undefined;
}

/** Which effect of an SPL/ITM/EFF names the resref at `offset`, as "op 67 create creature". */
function featureAt(data: Buffer, offset: number, extension: string): string | undefined {
  if (extension === "EFF") return offset >= 0x10 ? opcodeLabel(data.readUInt16LE(0x10)) : undefined;
  if (extension !== SPL && extension !== ITM) return undefined;
  const featureOffset = data.readUInt32LE(0x6a);
  if (offset < featureOffset || (offset - featureOffset) % 48 !== 0x14) return undefined;
  const index = (offset - featureOffset - 0x14) / 48;
  const header = headerOf(data, index, extension);
  const label = opcodeLabel(data.readUInt16LE(featureOffset + index * 48));
  return header ? `${label} (${header})` : label;
}

const CRE_FIELDS: Record<number, string> = {
  0x248: "override script",
  0x250: "class script",
  0x258: "race script",
  0x260: "general script",
  0x268: "default script",
  0x280: "death variable",
  0x2cc: "dialog",
};

/** Which CRE field names the resref at `offset`. */
function creFieldAt(data: Buffer, offset: number): string | undefined {
  if (CRE_FIELDS[offset]) return CRE_FIELDS[offset];
  const lists: [number, number, number, string][] = [
    [data.readUInt32LE(0x2a0), data.readUInt32LE(0x2a4), 12, "known spell"],
    [data.readUInt32LE(0x2b0), data.readUInt32LE(0x2b4), 16, "memorized spell"],
    [data.readUInt32LE(0x2bc), data.readUInt32LE(0x2c0), 20, "item"],
  ];
  const list = lists.find(
    ([start, count, size]) => offset >= start && offset < start + count * size,
  );
  if (list) return list[3];
  const effects = data.readUInt32LE(0x2c4);
  const size = data[0x33] === 1 ? 264 : 48;
  const index = Math.floor((offset - effects) / size);
  if (offset < effects || index >= data.readUInt32LE(0x2c8)) return undefined;
  const opcode = data.readUInt16LE(effects + index * size + (size === 264 ? 8 : 0));
  return `effect ${opcodeLabel(opcode)}`;
}

/** Which ARE entry names the resref at `offset`: an actor or spawn point (with its name). */
function areFieldAt(data: Buffer, offset: number): string | undefined {
  const lists: [number, number, number, string][] = [
    [data.readUInt32LE(0x54), data.readUInt16LE(0x58), 0x110, "actor"],
    [data.readUInt32LE(0x60), data.readUInt32LE(0x64), 0xc8, "spawn point"],
  ];
  const list = lists.find(
    ([start, count, size]) => offset >= start && offset < start + count * size,
  );
  if (list) {
    const [start, , size, label] = list;
    const entry = start + Math.floor((offset - start) / size) * size;
    const name = data.toString("latin1", entry, entry + 32).split("\0")[0];
    return `${label} "${name}"`;
  }
  const rest = data.readUInt32LE(0xc0);
  return rest && offset >= rest && offset < rest + 0xe4 ? "rest encounter" : undefined;
}

/** The line of a text resource (DLG, 2DA, BS) around `offset`. */
function lineAt(data: Buffer, offset: number): string {
  const text = data.toString("latin1");
  const start = text.lastIndexOf("\n", offset) + 1;
  const end = text.indexOf("\n", offset);
  const line = (end < 0 ? text.slice(start) : text.slice(start, end)).trim();
  // DLG transitions name their next dialog in a binary field, not in a script line
  return /^[\t\x20-\x7e]*$/.test(line) ? line : "transition";
}

/** The script action (or trigger) naming the resref at `offset` of a compiled BCS. */
function bcsContextAt(data: Buffer, offset: number, actions: Map<number, string>): string {
  const before = data.toString("latin1", 0, offset);
  const action = before.lastIndexOf("AC\n");
  if (action < before.lastIndexOf("TR\n")) return "trigger";
  const id = Number(/^\d+/.exec(before.slice(action + 3))?.[0]);
  return actions.get(id) ?? `action ${id}`;
}

function readIds(reader: ResourceReader, name: string): Map<number, string> {
  const ids = new Map<number, string>();
  const data = reader.read(name, IDS_TYPE, "IDS");
  for (const line of data?.toString("latin1").split(/\r?\n/) ?? []) {
    const match = /^\s*(0x[0-9a-f]+|\d+)\s+([a-z]\w*)/i.exec(line);
    if (!match) continue;
    // Spell and SpellRES share an id: both names, the compiled script doesn't tell them apart
    const id = Number(match[1]);
    const known = ids.get(id);
    if (!known) ids.set(id, match[2]);
    else if (!known.split("/").includes(match[2])) ids.set(id, `${known}/${match[2]}`);
  }
  return ids;
}

interface Reference {
  name: string;
  extension: string;
  details: string[];
}

function detailAt(
  data: Buffer,
  offset: number,
  { extension, text }: ResourceType,
  actions: Map<number, string>,
): string | undefined {
  try {
    if (extension === "BCS") return bcsContextAt(data, offset, actions);
    if (extension === "CRE") return creFieldAt(data, offset);
    if (extension === "ARE") return areFieldAt(data, offset);
    return text ? lineAt(data, offset) : featureAt(data, offset, extension);
  } catch {
    // A truncated or unusual file: the reference is still listed, without its detail
    return undefined;
  }
}

function readResource(reader: ResourceReader, name: string, kind: ResourceType) {
  try {
    return reader.read(name, kind.type, kind.extension);
  } catch {
    // An unreadable BIF (compressed): skipped
    return undefined;
  }
}

/** Where `data` (resource `name`) names the target, if it does. */
function referenceIn(
  data: Buffer,
  name: string,
  target: string,
  kind: ResourceType,
  actions: Map<number, string>,
): Reference | undefined {
  const offsets = matches(data, target, kind.text);
  if (!offsets.length) return undefined;
  const details = offsets.map((offset) => detailAt(data, offset, kind, actions));
  return {
    name,
    extension: kind.extension,
    details: [...new Set(details.filter((d) => d !== undefined))],
  };
}

/** Every resource of the game naming one of the targets, by target. */
function scan(
  reader: ResourceReader,
  targets: string[],
  actions: Map<number, string>,
): Map<string, Reference[]> {
  const result = new Map<string, Reference[]>(targets.map((t) => [t, []]));
  for (const kind of TYPES) {
    for (const name of reader.names(kind.type, kind.extension)) {
      const data = readResource(reader, name, kind);
      if (!data) continue;
      targets
        .filter((t) => t !== name)
        .forEach((target) => {
          const reference = referenceIn(data, name, target, kind, actions);
          if (reference) result.get(target)?.push(reference);
        });
    }
  }
  return result;
}

const TEXT_FILE = /\.(baf|d|tp[a-z0-9]|2da|ids)$/i;

/** The text files of the generated mod naming the resref. */
function modFiles(target: string): string[] {
  const pattern = new RegExp(`(^|[^\\w#])${target}([^\\w#]|$)`, "i");
  const found: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(file);
      else if (TEXT_FILE.test(entry.name) && pattern.test(fs.readFileSync(file, "latin1"))) {
        found.push(file.replace(/\\/g, "/"));
      }
    }
  };
  if (fs.existsSync("mod")) walk("mod");
  return found;
}

function gameDirs(game: string | undefined): [string, string][] {
  const paths: Record<string, string> = fs.existsSync("paths.local.json")
    ? (JSON.parse(fs.readFileSync("paths.local.json", "utf8")) as Record<string, string>)
    : { bg2: "C:/Games/BG2EE" };
  if (!game) return Object.entries(paths);
  return [[game, paths[game] ?? game]];
}

const byFile = (a: Reference, b: Reference) =>
  a.extension.localeCompare(b.extension) || a.name.localeCompare(b.name);

function printReferences(target: string, refs: Reference[], indent: string) {
  console.log(`${indent}${target} is referenced by${refs.length ? "" : " nothing"}`);
  for (const ref of refs) {
    const details = ref.details.length ? `: ${ref.details.join(", ")}` : "";
    console.log(`${indent}  ${ref.name}.${ref.extension}${details}`);
  }
}

/** Prints the referrers of the targets, then theirs, up to `depth` levels. */
function searchGame(label: string, dir: string, targets: string[], depth: number) {
  const reader = new ResourceReader(dir);
  const actions = readIds(reader, "ACTION");
  console.log(`\n=== ${label} (${dir}) ===`);
  const seen = new Set(targets);
  let level = targets;
  for (let d = 0; d < depth && level.length; d++) {
    const next: string[] = [];
    for (const [target, refs] of scan(reader, level, actions)) {
      const sorted = [...refs].sort(byFile);
      printReferences(target, sorted, "  ".repeat(d));
      const followed = sorted.filter((r) => FOLLOWED.has(r.extension) && !seen.has(r.name));
      for (const ref of followed) {
        seen.add(ref.name);
        next.push(ref.name);
      }
    }
    level = next;
  }
}

function parseArgs() {
  const args = process.argv.slice(2);
  const option = (flag: string) => {
    const i = args.indexOf(flag);
    return i < 0 ? undefined : args.splice(i, 2)[1];
  };
  const game = option("--game");
  const depth = Number(option("--depth") ?? 2);
  const targets = args.map((a) => a.replace(/\.[a-z0-9]+$/i, "").toUpperCase());
  return { game, depth, targets };
}

function main() {
  const { game, depth, targets } = parseArgs();
  if (!targets.length) {
    console.error(
      "Usage: ts-node scripts/find-references.ts <RESREF>... [--game bg1|bg2|<dir>] [--depth N]",
    );
    process.exit(1);
  }
  for (const [label, dir] of gameDirs(game)) {
    if (fs.existsSync(path.join(dir, "chitin.key"))) searchGame(label, dir, targets, depth);
  }
  for (const target of targets) {
    const files = modFiles(target);
    if (files.length) console.log(`\nmod/ files naming ${target}:\n  ${files.join("\n  ")}`);
  }
}

main();
