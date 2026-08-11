import * as fs from "fs";
import * as path from "path";
import { SPELLS } from "../lib/config/spells/spell-names";
import { SPELL_PRIORITY_ORDER } from "../lib/config/spell-priority-order";

// Reorders lib/config/spell-priority-order.ts using real cast-order evidence from
// assets/emulti.baf. Full rationale and the alternatives it replaced:
// docs/superpowers/specs/2026-08-10-spell-priority-order-emulti-design.md
//
// A spell missing from SPELL_PRIORITY_ORDER entirely isn't an error - AbilityOrderService
// treats "not found" as lowest priority, cast last. So this file only needs to hold
// entries you actually want to give a specific priority to: entries with real emulti.baf
// evidence sort by their first-cast line, wherever you put the line; entries with no
// evidence that are already in the list are anchored - the evidence-backed entries sort
// around them, but a no-evidence entry never moves relative to its neighbours once it's
// here. That's the "ordinal placement" idea from an earlier round of this design, scoped
// to entries a human has actively chosen to place, not applied wholesale to everything
// without evidence.
//
// When to run this: after adding, removing, or renaming an entry. It doesn't matter
// where you drop a new no-evidence entry - just put it where you think it belongs; this
// script will never move it again once it's there. Running with no source changes is a
// no-op.
//
// Usage: npx ts-node scripts/derive-spell-priority-order.ts   (from generator/)

const ROOT = path.join(__dirname, "..");
const TARGET_FILE = path.join(ROOT, "lib/config/spell-priority-order.ts");
const BAF_FILE = path.join(ROOT, "assets/emulti.baf");

const HOTKEY_EXCLUDE_START_LINE = 2871;
const HOTKEY_EXCLUDE_END_LINE = 5055;

interface RawEntry {
  rawExpr: string; // e.g. "SPELLS.Wizard.Vocalize.file,"
  comment?: string; // any comment line that preceded this entry
}

interface ResolvedEntry extends RawEntry {
  file: string;
  originalIndex: number;
  bafRank?: number;
}

// --- parse the current file: preserve the header (imports, doc comment) verbatim,
// read the array's entries, ignore anything after its closing "];". ---
function parseSource(source: string): { header: string; rawEntries: RawEntry[] } {
  const lines = source.split(/\r?\n/);
  const arrayStart = lines.findIndex((l) => l.includes("export const SPELL_PRIORITY_ORDER"));
  if (arrayStart === -1) {
    throw new Error(`Could not find "export const SPELL_PRIORITY_ORDER" in ${TARGET_FILE}`);
  }
  const header = lines.slice(0, arrayStart + 1).join("\n");

  const rawEntries: RawEntry[] = [];
  let pendingComment: string | undefined;
  for (let i = arrayStart + 1; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed === "];") return { header, rawEntries };
    if (trimmed.startsWith("//")) {
      pendingComment = trimmed;
    } else if (
      trimmed.startsWith("SPELLS.") ||
      trimmed.startsWith("FNP_SPELLS.") ||
      trimmed.startsWith("PRESET_NAMES.")
    ) {
      rawEntries.push({ rawExpr: trimmed, comment: pendingComment });
      pendingComment = undefined;
    }
  }
  throw new Error(`${TARGET_FILE}'s array has no closing "];".`);
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

// Evidence-backed entries sort by real baf line. A no-evidence entry already in the list
// is anchored - it gets the synthetic rank (S[p-1] + S[p]) / 2, where S is the ascending
// array of evidence-backed baf lines and p is how many of them precede this entry as
// found - i.e. "this entry was placed after p of the evidence-backed ones, so keep it
// after exactly p of them." Closed form: an anchored entry never changes its relative
// position among the entries it was placed among. See the design doc for why this beats
// interpolating a borrowed baf line number from a neighbour.
function placeEntries(rawEntries: RawEntry[], resolved: string[], bafRanks: Map<string, number>): ResolvedEntry[] {
  if (rawEntries.length !== resolved.length) {
    throw new Error(
      `Source entry count (${rawEntries.length}) does not match resolved SPELL_PRIORITY_ORDER length (${resolved.length}) - parseSource() missed or double-counted a line.`,
    );
  }

  const partial = rawEntries.map((raw, originalIndex) => ({
    ...raw,
    file: resolved[originalIndex],
    originalIndex,
    bafRank: bafRanks.get(resolved[originalIndex]),
  }));

  const rankedSortedLines = partial
    .filter((e): e is typeof e & { bafRank: number } => e.bafRank !== undefined)
    .map((e) => e.bafRank)
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
    const rankValue = interpolateRankValue(p, m, rankedSortedLines, i);
    return { ...e, rankValue };
  });

  return withRank
    .toSorted((a, b) => a.rankValue - b.rankValue || a.originalIndex - b.originalIndex)
    .map(({ rankValue: _rankValue, ...e }) => e);
}

// Ranks an unranked entry between its two BAF-ranked neighbors (or off one end, or - when
// there's no BAF ranking data at all - preserves its original position).
function interpolateRankValue(
  precedingRankedCount: number,
  totalRanked: number,
  rankedSortedLines: number[],
  originalIndex: number,
): number {
  if (totalRanked === 0) return originalIndex;
  if (precedingRankedCount === 0) return rankedSortedLines[0] - 1;
  if (precedingRankedCount === totalRanked) return rankedSortedLines[totalRanked - 1] + 1;
  return (
    (rankedSortedLines[precedingRankedCount - 1] + rankedSortedLines[precedingRankedCount]) / 2
  );
}

// --- run ---
const source = fs.readFileSync(TARGET_FILE, "utf-8");
const { header, rawEntries } = parseSource(source);

const fileToId = new Map<string, string>();
flattenSpellsToIdMap(SPELLS, fileToId);
const idToFile = new Map<string, string>([...fileToId].map(([file, id]) => [id, file]));
const bafRanks = extractBafRanks(idToFile);

const placed = placeEntries(rawEntries, SPELL_PRIORITY_ORDER, bafRanks);

// Two different registry entries can resolve to the same resource file (e.g. an
// FNP_SPELLS.* spell that reuses a vanilla resource because Faiths & Powers doesn't
// implement a distinct one) - only one line is needed per file, since AbilityOrderService
// looks entries up by resolved file, not by which registry path produced it.
const seenFiles = new Set<string>();
const collapsedDuplicates: { kept: string; dropped: string }[] = [];
const deduped: ResolvedEntry[] = [];
for (const e of placed) {
  if (seenFiles.has(e.file)) {
    const kept = deduped.find((k) => k.file === e.file);
    if (!kept) {
      throw new Error(`Internal error: expected a previously-deduped entry for ${e.file}`);
    }
    collapsedDuplicates.push({ kept: kept.rawExpr, dropped: e.rawExpr });
    continue;
  }
  seenFiles.add(e.file);
  deduped.push(e);
}

// sanity: never drop an entry (aside from deliberate duplicate collapsing above)
const beforeFiles = new Set(rawEntries.map((_, i) => SPELL_PRIORITY_ORDER[i]));
const afterFiles = new Set(deduped.map((e) => e.file));
for (const f of beforeFiles) {
  if (!afterFiles.has(f) && !collapsedDuplicates.some((d) => d.dropped.includes(f))) {
    throw new Error(`Entry dropped: ${f}`);
  }
}

// --- write the file ---
const bodyLines: string[] = [];
for (const e of deduped) {
  if (e.comment) bodyLines.push(`  ${e.comment}`);
  bodyLines.push(`  ${e.rawExpr}`);
}
fs.writeFileSync(TARGET_FILE, `${header}\n${bodyLines.join("\n")}\n];\n`, "utf-8");

// --- report ---
const moves = deduped
  .map((e, to) => ({ file: e.file, from: e.originalIndex, to }))
  .filter((m) => m.to !== m.from);

console.log(`${TARGET_FILE} rewritten.`);
console.log(`${deduped.length} entries (${deduped.length - deduped.filter((e) => e.bafRank === undefined).length} evidence-backed, ${deduped.filter((e) => e.bafRank === undefined).length} anchored).`);
if (collapsedDuplicates.length > 0) {
  console.log(`${collapsedDuplicates.length} duplicate resource entr${collapsedDuplicates.length === 1 ? "y" : "ies"} collapsed (two registry paths resolving to the same file):`);
  for (const d of collapsedDuplicates) {
    console.log(`  kept "${d.kept}", dropped "${d.dropped}"`);
  }
}
console.log(`${moves.length} entries moved.`);
if (moves.length > 0) {
  const largest = [...moves].sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from));
  console.log("Largest moves:");
  for (const m of largest.slice(0, 15)) {
    console.log(`  ${m.file}: ${m.from} -> ${m.to} (${m.to - m.from > 0 ? "+" : ""}${m.to - m.from})`);
  }
}
console.log("Next: npm run build && npm test - if the array changed, npm run generate and commit any regenerated fixtures too.");
