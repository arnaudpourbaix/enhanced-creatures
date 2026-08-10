import * as fs from "fs";
import * as path from "path";
import { SPELLS } from "../lib/config/spells/spell-names";
import { SPELL_PRIORITY_ORDER } from "../lib/config/spell-priority-order";

// Reorders lib/config/spell-priority-order.ts using real cast-order evidence from
// assets/emulti.baf. Full rationale, the algorithm's derivation, and the two failed
// alternatives it replaced: docs/superpowers/specs/2026-08-10-spell-priority-order-emulti-design.md
//
// When to run this: after adding, removing, or renaming a SPELLS.*/FNP_SPELLS.*/
// PRESET_NAMES.* entry in spell-priority-order.ts. Where you put a new entry in the
// source barely matters - if emulti.baf casts it, real evidence places it; if not, it's
// placed relative to however many baf-ranked entries currently precede it, so drop it
// near a spell it's conceptually similar to and this will do something sensible with it.
//
// Unlike the one-time migration this tool was extracted from, it reads its input from
// the CURRENT spell-priority-order.ts (not a pinned git revision) - that's the right
// behaviour for ongoing maintenance: entries emulti.baf ranks never move (the evidence
// doesn't change), and the ordinal fallback for unranked entries is if anything *more*
// meaningful now than during the original migration, since its neighbours are already
// evidence-ordered rather than the hand-tuned list's near-random original order. Running
// this with no source changes is a no-op.
//
// Usage: npx ts-node scripts/derive-spell-priority-order.ts   (from generator/)

const ROOT = path.join(__dirname, "..");
const TARGET_FILE = path.join(ROOT, "lib/config/spell-priority-order.ts");
const BAF_FILE = path.join(ROOT, "assets/emulti.baf");

const HOTKEY_EXCLUDE_START_LINE = 2871;
const HOTKEY_EXCLUDE_END_LINE = 5055;

// Older revisions of this script wrote this exact comment inline, scattered through the
// array, on a subset of unranked entries. Dropped in favour of the single "unvetted"
// block below: the inline version's condition degraded to near-vacuous once the array
// stabilized (nearest-neighbour consistency trivially holds once the ranked entries
// around it are already sorted), so it silently stopped flagging almost everything it
// used to. Stripped on parse wherever it's still found, never written again.
const LEGACY_FLAG_COMMENT =
  "// no reliable baf evidence bracketing this position - not vetted for priority.";

const UNVETTED_HEADER = [
  "// --- Not vetted: no direct emulti.baf evidence ---",
  "//",
  "// Every entry below has no direct cast evidence in assets/emulti.baf (not cast",
  "// anywhere in the script, at least not through a cast syntax this derivation",
  "// understands - see the design doc). Its position in the array above is carried",
  "// over from wherever it was before this script last ran, not vetted. Move an entry",
  "// to a better spot in the array above once you have a considered opinion on where",
  "// it belongs; this list is regenerated every run and will keep listing anything",
  "// still without direct evidence, so there's nothing to \"clear\" here by hand.",
];

interface RawEntry {
  rawExpr: string; // e.g. "SPELLS.Wizard.Vocalize.file,"
  comment?: string; // any comment other than LEGACY_FLAG_COMMENT that preceded this entry
}

interface RankedEntry extends RawEntry {
  file: string;
  originalIndex: number;
  bafRank?: number;
  rankValue: number;
}

// --- parse the current file: everything up to "export const ... = [" is preserved
// verbatim (imports, doc comment); everything after is regenerated. ---
function splitHeaderAndEntries(source: string): { header: string; rawEntries: RawEntry[] } {
  const lines = source.split(/\r?\n/);
  const arrayStart = lines.findIndex((l) => l.includes("export const SPELL_PRIORITY_ORDER"));
  if (arrayStart === -1) {
    throw new Error(`Could not find "export const SPELL_PRIORITY_ORDER" in ${TARGET_FILE}`);
  }
  const header = lines.slice(0, arrayStart + 1).join("\n");

  const rawEntries: RawEntry[] = [];
  let pendingComment: string | undefined;
  for (const line of lines.slice(arrayStart + 1)) {
    const trimmed = line.trim();
    if (trimmed === "];") break;
    if (trimmed === "") continue;
    if (trimmed.startsWith("//")) {
      if (trimmed === LEGACY_FLAG_COMMENT) continue; // no longer written, drop if still present
      pendingComment = trimmed;
      continue;
    }
    if (
      trimmed.startsWith("SPELLS.") ||
      trimmed.startsWith("FNP_SPELLS.") ||
      trimmed.startsWith("PRESET_NAMES.")
    ) {
      rawEntries.push({ rawExpr: trimmed, comment: pendingComment });
      pendingComment = undefined;
    }
  }
  return { header, rawEntries };
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

// Ranked entries sort by real baf line. Unranked entries get the synthetic rank
// (S[p-1] + S[p]) / 2, where S is the ascending array of ranked baf lines and p is how
// many ranked entries precede this one in the source - i.e. "the source placed this
// spell after p of the ranked ones, so keep it after exactly p of them." Closed form:
// every unranked entry lands at exactly its original index; ranked entries fill the
// remaining slots in baf order. Two interpolation-based alternatives (nearest-neighbour
// bracket, monotonic envelope) were tried and rejected - see the design doc - because
// the source order and baf order can be too weakly correlated for a borrowed baf line
// number to mean anything; counting neighbours instead of reading their line numbers
// sidesteps that entirely.
function buildRankedEntries(rawEntries: RawEntry[], resolved: string[], bafRanks: Map<string, number>): RankedEntry[] {
  if (rawEntries.length !== resolved.length) {
    throw new Error(
      `Source entry count (${rawEntries.length}) does not match resolved SPELL_PRIORITY_ORDER length (${resolved.length}) - splitHeaderAndEntries() missed or double-counted a line.`,
    );
  }

  const partial = rawEntries.map((raw, originalIndex) => {
    const file = resolved[originalIndex];
    return { ...raw, file, originalIndex, bafRank: bafRanks.get(file) };
  });

  const rankedSortedLines = partial
    .filter((e) => e.bafRank !== undefined)
    .map((e) => e.bafRank as number)
    .sort((a, b) => a - b);

  // p(i): count of ranked entries at original index < i, computed as a running count.
  let precedingRankedCount = 0;
  const precedingCounts: number[] = [];
  for (const e of partial) {
    precedingCounts.push(precedingRankedCount);
    if (e.bafRank !== undefined) precedingRankedCount++;
  }

  const m = rankedSortedLines.length;
  return partial.map((e, i): RankedEntry => {
    if (e.bafRank !== undefined) {
      return { ...e, rankValue: e.bafRank };
    }
    const p = precedingCounts[i];
    const rankValue =
      p === 0 ? rankedSortedLines[0] - 1 : p === m ? rankedSortedLines[m - 1] + 1 : (rankedSortedLines[p - 1] + rankedSortedLines[p]) / 2;
    return { ...e, rankValue };
  });
}

// --- run ---
const source = fs.readFileSync(TARGET_FILE, "utf-8");
const { header, rawEntries } = splitHeaderAndEntries(source);

const fileToId = new Map<string, string>();
flattenSpellsToIdMap(SPELLS, fileToId);
const idToFile = new Map<string, string>([...fileToId].map(([file, id]) => [id, file]));
const bafRanks = extractBafRanks(idToFile);

const ranked = buildRankedEntries(rawEntries, SPELL_PRIORITY_ORDER, bafRanks);
const sorted = [...ranked].sort((a, b) => a.rankValue - b.rankValue || a.originalIndex - b.originalIndex);

// sanity: never drop or duplicate an entry
const originalFiles = new Set(ranked.map((e) => e.file));
const sortedFiles = new Set(sorted.map((e) => e.file));
if (sorted.length !== ranked.length || originalFiles.size !== sortedFiles.size) {
  throw new Error("Entry count changed during sort - this must never happen.");
}
for (const f of originalFiles) {
  if (!sortedFiles.has(f)) throw new Error(`Entry dropped during sort: ${f}`);
}

// Two different registry entries can resolve to the same resource file (e.g. an
// FNP_SPELLS.* spell that reuses a vanilla resource because Faiths & Powers doesn't
// implement a distinct one) - the array only needs one line per file, since
// AbilityOrderService looks entries up by resolved file, not by which registry path
// produced it. Keep the first occurrence in sorted (i.e. rank) order, drop the rest.
const seenFiles = new Set<string>();
const collapsedDuplicates: { kept: string; dropped: string }[] = [];
const written: RankedEntry[] = [];
for (const e of sorted) {
  if (seenFiles.has(e.file)) {
    const keptExpr = written.find((k) => k.file === e.file)!.rawExpr;
    collapsedDuplicates.push({ kept: keptExpr, dropped: e.rawExpr });
    continue;
  }
  seenFiles.add(e.file);
  written.push(e);
}

// regression tripwire: Sanctuary has no direct baf evidence (never cast, only mentioned
// in two comment lines) and stays ahead of FingerOfDeath purely via placement - this is
// exactly the kind of thing a future change could silently break. Checked against the
// final written order, before touching disk, so a violation never gets committed.
const sanctuaryFile = SPELLS.Priest.Sanctuary.file;
const fingerOfDeathFile = SPELLS.Priest.FingerOfDeath.file;
const sanctuaryIdx = written.findIndex((e) => e.file === sanctuaryFile);
const fingerIdx = written.findIndex((e) => e.file === fingerOfDeathFile);
if (sanctuaryIdx !== -1 && fingerIdx !== -1 && sanctuaryIdx >= fingerIdx) {
  throw new Error(
    `Sanctuary/FingerOfDeath invariant violated: sanctuary at ${sanctuaryIdx}, FingerOfDeath at ${fingerIdx}. ` +
      `spell-priority-order.test.ts requires Sanctuary to precede FingerOfDeath.`,
  );
}

// --- write the file: preserved header, regenerated array body, then a separate
// "unvetted" reference block listing every entry with no direct baf evidence and its
// current position, so there's one place to look rather than hunting through comments
// scattered across the array. ---
const bodyLines: string[] = [];
for (const e of written) {
  if (e.comment) bodyLines.push(`  ${e.comment}`);
  bodyLines.push(`  ${e.rawExpr}`);
}

const unvetted = written
  .map((e, index) => ({ ...e, index }))
  .filter((e) => e.bafRank === undefined);
const unvettedLines =
  unvetted.length === 0
    ? []
    : [
        "",
        ...UNVETTED_HEADER,
        "//",
        ...unvetted.map((e) => `// [${e.index}] ${e.rawExpr}`),
      ];

const newContent = `${header}\n${bodyLines.join("\n")}\n];\n${unvettedLines.join("\n")}${unvettedLines.length > 0 ? "\n" : ""}`;
fs.writeFileSync(TARGET_FILE, newContent, "utf-8");

// --- report ---
const moves = written
  .map((e, to) => ({ file: e.file, from: e.originalIndex, to }))
  .filter((m) => m.to !== m.from)
  .sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from));

console.log(`${TARGET_FILE} rewritten.`);
console.log(`${written.length} entries written: ${written.length - unvetted.length} baf-ranked, ${unvetted.length} unvetted (see the reference block at the end of the file).`);
if (collapsedDuplicates.length > 0) {
  console.log(`${collapsedDuplicates.length} duplicate resource entr${collapsedDuplicates.length === 1 ? "y" : "ies"} collapsed (two registry paths resolving to the same file):`);
  for (const d of collapsedDuplicates) {
    console.log(`  kept "${d.kept}", dropped "${d.dropped}"`);
  }
}
console.log(`${moves.length} entries moved.`);
if (moves.length > 0) {
  console.log("Largest moves:");
  for (const m of moves.slice(0, 15)) {
    console.log(`  ${m.file}: ${m.from} -> ${m.to} (${m.to - m.from > 0 ? "+" : ""}${m.to - m.from})`);
  }
}
if (sanctuaryIdx === -1 || fingerIdx === -1) {
  console.warn(
    "Sanctuary or FingerOfDeath is no longer in the list - the regression check in spell-priority-order.test.ts could not be cross-checked here.",
  );
} else {
  console.log(`Regression check: Sanctuary (${sanctuaryIdx}) before FingerOfDeath (${fingerIdx}) - OK.`);
}
console.log("Next: npm run build && npm test - if the array changed, npm run generate and commit any regenerated fixtures too.");
