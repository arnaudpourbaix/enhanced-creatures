import * as fs from "fs";
import * as path from "path";
import { SPELLS } from "../lib/config/spells/spell-names";
import {
  SPELL_PRIORITY_ORDER,
  SPELL_PRIORITY_ORDER_UNVETTED,
} from "../lib/config/spell-priority-order";

// Reorders lib/config/spell-priority-order.ts using real cast-order evidence from
// assets/emulti.baf. Full rationale and the alternatives it replaced:
// docs/superpowers/specs/2026-08-10-spell-priority-order-emulti-design.md
//
// The file holds two lists:
// - SPELL_PRIORITY_ORDER: entries with real emulti.baf evidence are sorted by their
//   first-cast line. Entries with no evidence that are ALREADY in this list (because a
//   human moved them here after deciding where they belong) are left anchored in place -
//   the evidence-backed entries sort around them, but nothing ever relocates a
//   no-evidence entry within this list. That's the "ordinal placement" idea from an
//   earlier round of this design, now scoped to entries a human has actively chosen to
//   place here, not applied wholesale to everything without evidence.
// - SPELL_PRIORITY_ORDER_UNVETTED: no evidence, not yet reviewed. Order preserved
//   exactly as found - this script never invents an opinion about where an unvetted
//   entry belongs. An entry only ever leaves this list automatically if it gains real
//   evidence (promoted straight into SPELL_PRIORITY_ORDER, sorted by that evidence);
//   otherwise a human moves it by hand, and from then on this script treats it as
//   anchored per the rule above.
//
// When to run this: after adding, removing, or renaming an entry in either list, or
// after moving one between them. It doesn't matter where within SPELL_PRIORITY_ORDER you
// drop a no-evidence entry you're promoting from the unvetted list - just put it where
// you think it belongs; this script will never move it again once it's there. Running
// with no source changes is a no-op.
//
// Usage: npx ts-node scripts/derive-spell-priority-order.ts   (from generator/)

const ROOT = path.join(__dirname, "..");
const TARGET_FILE = path.join(ROOT, "lib/config/spell-priority-order.ts");
const BAF_FILE = path.join(ROOT, "assets/emulti.baf");

const HOTKEY_EXCLUDE_START_LINE = 2871;
const HOTKEY_EXCLUDE_END_LINE = 5055;

const MAIN_MARKER = "export const SPELL_PRIORITY_ORDER:";
const UNVETTED_MARKER = "export const SPELL_PRIORITY_ORDER_UNVETTED";

interface RawEntry {
  rawExpr: string; // e.g. "SPELLS.Wizard.Vocalize.file,"
  comment?: string; // any comment line that preceded this entry
}

interface ResolvedEntry extends RawEntry {
  file: string;
  originalIndex: number; // index within its own list (main or unvetted), before this run
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
// comment) verbatim, and ignore anything after UNVETTED's "];". ---
function parseSource(source: string): {
  header: string;
  betweenLists: string;
  mainRaw: RawEntry[];
  unvettedRaw: RawEntry[];
} {
  const lines = source.split(/\r?\n/);
  const mainStart = lines.findIndex((l) => l.includes(MAIN_MARKER));
  if (mainStart === -1) throw new Error(`Could not find "${MAIN_MARKER}" in ${TARGET_FILE}`);
  const header = lines.slice(0, mainStart + 1).join("\n");

  const { entries: mainRaw, closingLine: mainClose } = parseArrayEntries(lines, mainStart);

  const unvettedStart = lines.findIndex((l, i) => i > mainClose && l.includes(UNVETTED_MARKER));
  if (unvettedStart === -1) throw new Error(`Could not find "${UNVETTED_MARKER}" in ${TARGET_FILE}`);
  const betweenLists = lines.slice(mainClose + 1, unvettedStart + 1).join("\n");

  const { entries: unvettedRaw } = parseArrayEntries(lines, unvettedStart);

  return { header, betweenLists, mainRaw, unvettedRaw };
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

// Within the main list only: evidence-backed entries sort by real baf line. A
// no-evidence entry already in this list is anchored - it gets the synthetic rank
// (S[p-1] + S[p]) / 2, where S is the ascending array of evidence-backed baf lines
// *within this list* and p is how many of them precede this entry in the list as found -
// i.e. "this entry was placed after p of the evidence-backed ones, so keep it after
// exactly p of them." Closed form: an anchored entry never changes its relative position
// among the entries it was placed among. See the design doc for why this beats
// interpolating a borrowed baf line number from a neighbour.
function placeMainList(mainRaw: RawEntry[], resolved: string[], bafRanks: Map<string, number>): ResolvedEntry[] {
  if (mainRaw.length !== resolved.length) {
    throw new Error(
      `Main list entry count (${mainRaw.length}) does not match resolved SPELL_PRIORITY_ORDER length (${resolved.length}) - parseSource() missed or double-counted a line.`,
    );
  }

  const partial = mainRaw.map((raw, originalIndex) => ({
    ...raw,
    file: resolved[originalIndex],
    originalIndex,
    bafRank: bafRanks.get(resolved[originalIndex]),
  }));

  const rankedSortedLines = partial
    .filter((e) => e.bafRank !== undefined)
    .map((e) => e.bafRank as number)
    .sort((a, b) => a - b);

  let precedingRankedCount = 0;
  const precedingCounts: number[] = [];
  for (const e of partial) {
    precedingCounts.push(precedingRankedCount);
    if (e.bafRank !== undefined) precedingRankedCount++;
  }

  const m = rankedSortedLines.length;
  const withRank = partial.map((e, i) => {
    if (e.bafRank !== undefined) return { ...e, rankValue: e.bafRank };
    const p = precedingCounts[i];
    const rankValue =
      m === 0
        ? i
        : p === 0
          ? rankedSortedLines[0] - 1
          : p === m
            ? rankedSortedLines[m - 1] + 1
            : (rankedSortedLines[p - 1] + rankedSortedLines[p]) / 2;
    return { ...e, rankValue };
  });

  return withRank
    .sort((a, b) => a.rankValue - b.rankValue || a.originalIndex - b.originalIndex)
    .map(({ rankValue: _rankValue, ...e }) => e);
}

// --- run ---
const source = fs.readFileSync(TARGET_FILE, "utf-8");
const { header, betweenLists, mainRaw, unvettedRaw } = parseSource(source);

if (mainRaw.length !== SPELL_PRIORITY_ORDER.length || unvettedRaw.length !== SPELL_PRIORITY_ORDER_UNVETTED.length) {
  throw new Error(
    `Parsed entry counts (main ${mainRaw.length}, unvetted ${unvettedRaw.length}) don't match the resolved lists ` +
      `(main ${SPELL_PRIORITY_ORDER.length}, unvetted ${SPELL_PRIORITY_ORDER_UNVETTED.length}) - parseSource() missed or double-counted a line.`,
  );
}

const fileToId = new Map<string, string>();
flattenSpellsToIdMap(SPELLS, fileToId);
const idToFile = new Map<string, string>([...fileToId].map(([file, id]) => [id, file]));
const bafRanks = extractBafRanks(idToFile);

const unvettedResolved: ResolvedEntry[] = unvettedRaw.map((raw, originalIndex) => ({
  ...raw,
  file: SPELL_PRIORITY_ORDER_UNVETTED[originalIndex],
  originalIndex,
  bafRank: bafRanks.get(SPELL_PRIORITY_ORDER_UNVETTED[originalIndex]),
}));

// Entries that gained evidence get promoted straight into the main list; the rest stay
// in the unvetted holding pen, in their existing relative order.
const promoted = unvettedResolved.filter((e) => e.bafRank !== undefined);
const stillUnvetted = unvettedResolved.filter((e) => e.bafRank === undefined);

const mainWithPromotions = [...mainRaw, ...promoted.map(({ file: _file, originalIndex: _originalIndex, bafRank: _bafRank, ...raw }) => raw)];
const mainResolvedFiles = [...SPELL_PRIORITY_ORDER, ...promoted.map((e) => e.file)];
const mainFinal = placeMainList(mainWithPromotions, mainResolvedFiles, bafRanks);

// Two different registry entries can resolve to the same resource file (e.g. an
// FNP_SPELLS.* spell that reuses a vanilla resource because Faiths & Powers doesn't
// implement a distinct one) - only one line is needed per file. If a copy exists in both
// the main list and the unvetted list, the main-list one wins (it's the one a human, or
// real evidence, actually placed).
const seenFiles = new Set<string>();
const collapsedDuplicates: { kept: string; dropped: string }[] = [];
const mainDeduped: ResolvedEntry[] = [];
for (const e of mainFinal) {
  if (seenFiles.has(e.file)) {
    const keptExpr = mainDeduped.find((k) => k.file === e.file)!.rawExpr;
    collapsedDuplicates.push({ kept: keptExpr, dropped: e.rawExpr });
    continue;
  }
  seenFiles.add(e.file);
  mainDeduped.push(e);
}
const unvettedDeduped: ResolvedEntry[] = [];
for (const e of stillUnvetted) {
  if (seenFiles.has(e.file)) {
    const keptExpr = mainDeduped.find((k) => k.file === e.file)?.rawExpr ?? "(another unvetted entry)";
    collapsedDuplicates.push({ kept: keptExpr, dropped: e.rawExpr });
    continue;
  }
  seenFiles.add(e.file);
  unvettedDeduped.push(e);
}

// sanity: never drop an entry (aside from deliberate duplicate collapsing above)
const beforeFiles = new Set([...mainRaw, ...unvettedRaw].map((_, i) => (i < mainRaw.length ? SPELL_PRIORITY_ORDER[i] : SPELL_PRIORITY_ORDER_UNVETTED[i - mainRaw.length])));
const afterFiles = new Set([...mainDeduped, ...unvettedDeduped].map((e) => e.file));
for (const f of beforeFiles) {
  if (!afterFiles.has(f) && !collapsedDuplicates.some((d) => d.dropped.includes(f))) {
    throw new Error(`Entry dropped: ${f}`);
  }
}

// --- write the file ---
function renderList(entries: ResolvedEntry[]): string {
  const lines: string[] = [];
  for (const e of entries) {
    if (e.comment) lines.push(`  ${e.comment}`);
    lines.push(`  ${e.rawExpr}`);
  }
  return lines.join("\n");
}

const newContent = `${header}\n${renderList(mainDeduped)}\n];\n${betweenLists}\n${renderList(unvettedDeduped)}\n];\n`;
fs.writeFileSync(TARGET_FILE, newContent, "utf-8");

// --- report ---
console.log(`${TARGET_FILE} rewritten.`);
console.log(`${mainDeduped.length} in SPELL_PRIORITY_ORDER (${mainDeduped.length - mainDeduped.filter((e) => e.bafRank === undefined).length} evidence-backed, ${mainDeduped.filter((e) => e.bafRank === undefined).length} anchored), ${unvettedDeduped.length} unvetted.`);
if (promoted.length > 0) {
  console.log(`${promoted.length} entr${promoted.length === 1 ? "y" : "ies"} promoted from unvetted (gained real evidence):`);
  for (const p of promoted) console.log(`  ${p.rawExpr}`);
}
if (collapsedDuplicates.length > 0) {
  console.log(`${collapsedDuplicates.length} duplicate resource entr${collapsedDuplicates.length === 1 ? "y" : "ies"} collapsed (two registry paths resolving to the same file):`);
  for (const d of collapsedDuplicates) {
    console.log(`  kept "${d.kept}", dropped "${d.dropped}"`);
  }
}
console.log("Next: npm run build && npm test - if the array changed, npm run generate and commit any regenerated fixtures too.");
