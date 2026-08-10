import * as fs from "fs";
import * as path from "path";
import { SPELLS } from "../lib/config/spells/spell-names";
import {
  SPELL_PRIORITY_ORDER_RANKED,
  SPELL_PRIORITY_ORDER_UNVETTED,
} from "../lib/config/spell-priority-order";

// Reorders lib/config/spell-priority-order.ts using real cast-order evidence from
// assets/emulti.baf. Full rationale and the alternatives it replaced:
// docs/superpowers/specs/2026-08-10-spell-priority-order-emulti-design.md
//
// The file holds two lists: SPELL_PRIORITY_ORDER_RANKED (real evidence, sorted by
// first-cast line) and SPELL_PRIORITY_ORDER_UNVETTED (no evidence exists for these -
// the old hand-tuned list wasn't a reliable stand-in for one, so they're kept in their
// own list below the ranked ones rather than interleaved among them on a guess).
//
// When to run this: after adding, removing, or renaming a SPELLS.*/FNP_SPELLS.*/
// PRESET_NAMES.* entry anywhere in either list. It doesn't matter which list you add it
// to, or where within that list: every entry is reclassified into RANKED or UNVETTED
// from scratch each run, purely by whether emulti.baf casts it. What DOES stay exactly
// as you left it is the relative order of entries that end up in UNVETTED together -
// this script never invents an opinion about where an unvetted entry belongs, so hand-
// order that list yourself as you develop one. Running with no source changes is a
// no-op.
//
// Usage: npx ts-node scripts/derive-spell-priority-order.ts   (from generator/)

const ROOT = path.join(__dirname, "..");
const TARGET_FILE = path.join(ROOT, "lib/config/spell-priority-order.ts");
const BAF_FILE = path.join(ROOT, "assets/emulti.baf");

const HOTKEY_EXCLUDE_START_LINE = 2871;
const HOTKEY_EXCLUDE_END_LINE = 5055;

const RANKED_MARKER = "export const SPELL_PRIORITY_ORDER_RANKED";
const UNVETTED_MARKER = "export const SPELL_PRIORITY_ORDER_UNVETTED";

interface RawEntry {
  rawExpr: string; // e.g. "SPELLS.Wizard.Vocalize.file,"
  comment?: string; // any comment line that preceded this entry
}

interface ResolvedEntry extends RawEntry {
  file: string;
  originalIndex: number; // index in the combined (ranked-then-unvetted) source sequence
  bafRank?: number;
}

// --- parse one array literal starting at `fromLine` (a "export const NAME = [" line),
// returning its entries and the 0-based line index of its closing "];". ---
function parseArrayEntries(lines: string[], fromLine: number): { entries: RawEntry[]; closingLine: number } {
  const entries: RawEntry[] = [];
  let pendingComment: string | undefined;
  for (let i = fromLine + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "];") return { entries, closingLine: i };
    if (trimmed === "") continue;
    if (trimmed.startsWith("//")) {
      pendingComment = trimmed;
      continue;
    }
    if (
      trimmed.startsWith("SPELLS.") ||
      trimmed.startsWith("FNP_SPELLS.") ||
      trimmed.startsWith("PRESET_NAMES.")
    ) {
      entries.push({ rawExpr: trimmed, comment: pendingComment });
      pendingComment = undefined;
    }
  }
  throw new Error(`Array starting at line ${fromLine + 1} in ${TARGET_FILE} has no closing "];".`);
}

// --- parse the current file: preserve the header (imports, top doc comment) verbatim,
// find both named arrays, preserve the comment block between them (the UNVETTED doc
// comment) verbatim, and ignore everything from UNVETTED's "];" onward (the trailing
// concatenation export is always regenerated, never hand-edited). ---
function parseSource(source: string): {
  header: string;
  betweenLists: string;
  rankedRaw: RawEntry[];
  unvettedRaw: RawEntry[];
} {
  const lines = source.split(/\r?\n/);
  const rankedStart = lines.findIndex((l) => l.includes(RANKED_MARKER));
  if (rankedStart === -1) throw new Error(`Could not find "${RANKED_MARKER}" in ${TARGET_FILE}`);
  const header = lines.slice(0, rankedStart + 1).join("\n");

  const { entries: rankedRaw, closingLine: rankedClose } = parseArrayEntries(lines, rankedStart);

  const unvettedStart = lines.findIndex(
    (l, i) => i > rankedClose && l.includes(UNVETTED_MARKER),
  );
  if (unvettedStart === -1) throw new Error(`Could not find "${UNVETTED_MARKER}" in ${TARGET_FILE}`);
  const betweenLists = lines.slice(rankedClose + 1, unvettedStart + 1).join("\n");

  const { entries: unvettedRaw } = parseArrayEntries(lines, unvettedStart);

  return { header, betweenLists, rankedRaw, unvettedRaw };
}

// --- flatten SPELLS into file -> id lookup (FNP_SPELLS entries have no id field,
// and mostly can't appear in a script that predates Faiths & Powers) ---
function flattenSpellsToIdMap(node: unknown, map: Map<string, string>): void {
  if (node === null || typeof node !== "object") return;
  const obj = node as Record<string, unknown>;
  if (typeof obj.file === "string" && typeof obj.id === "string") {
    map.set(obj.file, obj.id);
    return;
  }
  for (const value of Object.values(obj)) {
    flattenSpellsToIdMap(value, map);
  }
}

// emulti.baf casts by symbolic spell.ids token (Spell(LastSeenBy(Myself),WIZARD_...))
// or by bare 4-digit numeric id (Spell(LastSeenBy(Myself),1719)). First digit selects
// the resource prefix, remaining 3 are the zero-padded spell number: 1719 -> SPPR719.
const NUMERIC_PREFIX: Record<string, string> = {
  "1": "SPPR", // priest
  "2": "SPWI", // wizard
  "3": "SPIN", // innate
  "4": "SPCL", // special / kit
};

function numericCodeToFile(code: string): string | undefined {
  const prefix = NUMERIC_PREFIX[code[0]];
  return prefix ? `${prefix}${code.slice(1)}` : undefined;
}

// First-occurrence line per resource file, merged across both cast syntaxes, excluding
// the player-hotkey range (manual-cast macros, not autonomous AI priority).
function extractBafRanks(idToFile: Map<string, string>): Map<string, number> {
  const lines = fs.readFileSync(BAF_FILE, "utf-8").split(/\r?\n/);
  const ranks = new Map<string, number>();
  const symbolicPattern = /Spell\([^,]*,([A-Z_][A-Z0-9_]*)\)/;
  const numericPattern = /Spell\([^,]*,(\d{4})\)/;
  for (let i = 0; i < lines.length; i++) {
    const lineNumber = i + 1;
    if (lineNumber >= HOTKEY_EXCLUDE_START_LINE && lineNumber <= HOTKEY_EXCLUDE_END_LINE) {
      continue;
    }
    const sym = symbolicPattern.exec(lines[i]);
    const symFile = sym ? idToFile.get(sym[1]) : undefined;
    if (symFile !== undefined && !ranks.has(symFile)) ranks.set(symFile, lineNumber);

    const num = numericPattern.exec(lines[i]);
    const numFile = num ? numericCodeToFile(num[1]) : undefined;
    if (numFile !== undefined && !ranks.has(numFile)) ranks.set(numFile, lineNumber);
  }
  return ranks;
}

// --- run ---
const source = fs.readFileSync(TARGET_FILE, "utf-8");
const { header, betweenLists, rankedRaw, unvettedRaw } = parseSource(source);

// Every entry is reclassified from scratch by evidence, regardless of which list it was
// found in - so both lists are combined into one sequence up front. originalIndex over
// this combined sequence is what preserves UNVETTED's hand-ordering across runs (see
// below): ranked-block entries all sort before unvetted-block ones by construction, so
// filtering down to "no evidence" and sorting by originalIndex reproduces exactly
// whatever relative order the unvetted block had, with nothing invented.
const combinedRaw = [...rankedRaw, ...unvettedRaw];
const resolvedFiles = [...SPELL_PRIORITY_ORDER_RANKED, ...SPELL_PRIORITY_ORDER_UNVETTED];
if (combinedRaw.length !== resolvedFiles.length) {
  throw new Error(
    `Source entry count (${combinedRaw.length}) does not match resolved list length (${resolvedFiles.length}) - parseSource() missed or double-counted a line.`,
  );
}

const fileToId = new Map<string, string>();
flattenSpellsToIdMap(SPELLS, fileToId);
const idToFile = new Map<string, string>([...fileToId].map(([file, id]) => [id, file]));
const bafRanks = extractBafRanks(idToFile);

const combined: ResolvedEntry[] = combinedRaw.map((raw, originalIndex) => ({
  ...raw,
  file: resolvedFiles[originalIndex],
  originalIndex,
  bafRank: bafRanks.get(resolvedFiles[originalIndex]),
}));

// Two different registry entries can resolve to the same resource file (e.g. an
// FNP_SPELLS.* spell that reuses a vanilla resource because Faiths & Powers doesn't
// implement a distinct one) - only one line is needed per file, since AbilityOrderService
// looks entries up by resolved file, not by which registry path produced it. If a
// ranked and an unvetted entry collide, the ranked one wins (it has real evidence).
const seenFiles = new Set<string>();
const collapsedDuplicates: { kept: string; dropped: string }[] = [];
const deduped: ResolvedEntry[] = [];
for (const e of [...combined].sort((a, b) => (a.bafRank !== undefined ? 0 : 1) - (b.bafRank !== undefined ? 0 : 1))) {
  if (seenFiles.has(e.file)) {
    const keptExpr = deduped.find((k) => k.file === e.file)!.rawExpr;
    collapsedDuplicates.push({ kept: keptExpr, dropped: e.rawExpr });
    continue;
  }
  seenFiles.add(e.file);
  deduped.push(e);
}

const rankedFinal = deduped
  .filter((e) => e.bafRank !== undefined)
  .sort((a, b) => (a.bafRank as number) - (b.bafRank as number));
const unvettedFinal = deduped
  .filter((e) => e.bafRank === undefined)
  .sort((a, b) => a.originalIndex - b.originalIndex);

// sanity: never drop an entry
const originalFiles = new Set(combined.map((e) => e.file));
const finalFiles = new Set([...rankedFinal, ...unvettedFinal].map((e) => e.file));
for (const f of originalFiles) {
  if (!finalFiles.has(f)) throw new Error(`Entry dropped: ${f}`);
}

// --- write the file: preserved header and the comment block between the two lists,
// regenerated array bodies, always-regenerated concatenation export. ---
function renderList(entries: ResolvedEntry[]): string {
  const lines: string[] = [];
  for (const e of entries) {
    if (e.comment) lines.push(`  ${e.comment}`);
    lines.push(`  ${e.rawExpr}`);
  }
  return lines.join("\n");
}

const newContent =
  `${header}\n${renderList(rankedFinal)}\n];\n${betweenLists}\n${renderList(unvettedFinal)}\n];\n\n` +
  `export const SPELL_PRIORITY_ORDER: string[] = [\n  ...SPELL_PRIORITY_ORDER_RANKED,\n  ...SPELL_PRIORITY_ORDER_UNVETTED,\n];\n`;
fs.writeFileSync(TARGET_FILE, newContent, "utf-8");

// --- report ---
const rankedMoves = rankedFinal
  .map((e, to) => ({ file: e.file, from: e.originalIndex, to }))
  .filter((m) => m.to !== m.from);
const unvettedMoved = unvettedRaw.length !== unvettedFinal.length || unvettedFinal.some((e, i) => e.rawExpr !== unvettedRaw[i]?.rawExpr);

console.log(`${TARGET_FILE} rewritten.`);
console.log(`${rankedFinal.length} ranked, ${unvettedFinal.length} unvetted.`);
if (collapsedDuplicates.length > 0) {
  console.log(`${collapsedDuplicates.length} duplicate resource entr${collapsedDuplicates.length === 1 ? "y" : "ies"} collapsed (two registry paths resolving to the same file):`);
  for (const d of collapsedDuplicates) {
    console.log(`  kept "${d.kept}", dropped "${d.dropped}"`);
  }
}
console.log(`${rankedMoves.length} ranked entries changed position.`);
if (rankedMoves.length > 0) {
  const largest = [...rankedMoves].sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from));
  console.log("Largest moves:");
  for (const m of largest.slice(0, 15)) {
    console.log(`  ${m.file}: ${m.from} -> ${m.to} (${m.to - m.from > 0 ? "+" : ""}${m.to - m.from})`);
  }
}
console.log(unvettedMoved ? "Unvetted list membership or order changed." : "Unvetted list unchanged.");
console.log("Next: npm run build && npm test - if the array changed, npm run generate and commit any regenerated fixtures too.");
