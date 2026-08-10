# Deriving SPELL_PRIORITY_ORDER from emulti.baf Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

> **Amendment — the code in Task 1 below is superseded.** The extraction and
> merge logic was corrected twice after this plan was written (numeric-id
> casts were not matched; the interpolation fallback was directionally
> biased). The design doc's *Extraction* and *Merge algorithm* sections are
> authoritative for what was actually implemented; the listing here is kept
> as the original task specification. The corrected fragments are inlined
> below where they differ materially.

**Goal:** Replace the hand-tuned order in `lib/config/spell-priority-order.ts` with one derived from `generator/assets/emulti.baf`'s block sequence (real AI priority evidence), keeping spells the baf can't rank at their existing position relative to the ones it can.

**Architecture:** A throwaway `ts-node` script parses the current `spell-priority-order.ts` source (to keep each entry's exact source expression and any attached comment), cross-references each entry's resolved file against `emulti.baf`'s first-occurrence line order (via the `SPELLS.*` registry's `id` field), and prints a ready-to-paste replacement array plus a diff summary. The array is hand-copied into the real file, the script is deleted, and the two existing tests plus the full suite confirm no regressions.

**Tech Stack:** TypeScript, `ts-node`, Vitest.

## Global Constraints

- Exclude `emulti.baf` lines 2871–5055 (`gs_HotKeyS_Mage_HighLevel.baf` through `gs_HotKeyB_Warrior.baf`) from extraction — these are player-hotkey macros, not autonomous AI priority.
- Matching is keyed on the resource **file**, so both symbolic-token casts (resolved through the `SPELLS.*` `id` field) and bare 4-digit numeric-id casts land in one map. Practically only `SPELLS.*` entries match; `FNP_SPELLS.*` entries do so only when they point at a vanilla resource (`FNP_SPELLS.Priest.Doom` is `SPPR113`).
- The merge must never drop or duplicate an entry — same set of files before and after, only reordered.
- `spell-priority-order.test.ts`'s two invariants (non-empty, containing both spells, Sanctuary ranked before FingerOfDeath) must still pass unmodified.
- The throwaway script is not committed to the repository.

---

## Task 1: Build and run the extraction/merge script

**Files:**
- Create (temporary, not committed): `generator/scratch-spell-priority.ts`
- Reads: `generator/assets/emulti.baf`, `generator/lib/config/spell-priority-order.ts`, `generator/lib/config/spells/spell-names.ts`
- Writes (temporary, not committed): `generator/scratch-spell-priority-output.txt`

**Interfaces:**
- Produces: a printed/written replacement array body (list of `{ rawExpr, comment? }` in final order) and a diff summary — consumed manually in Task 2 (hand-copied into the real file, not read by any other code).

- [ ] **Step 1: Write `generator/scratch-spell-priority.ts`**

```ts
import * as fs from "fs";
import * as path from "path";
import { SPELLS } from "./lib/config/spells/spell-names";
import { SPELL_PRIORITY_ORDER } from "./lib/config/spell-priority-order";

const ROOT = __dirname;
const CURRENT_FILE = path.join(ROOT, "lib/config/spell-priority-order.ts");
const BAF_FILE = path.join(ROOT, "assets/emulti.baf");
const OUTPUT_FILE = path.join(ROOT, "scratch-spell-priority-output.txt");

const HOTKEY_EXCLUDE_START_LINE = 2871;
const HOTKEY_EXCLUDE_END_LINE = 5055;

interface RawEntry {
  rawExpr: string; // e.g. "SPELLS.Wizard.Vocalize.file,"
  comment?: string; // e.g. "// FNP-only, no vanilla sibling..."
}

interface RankedEntry extends RawEntry {
  file: string;
  originalIndex: number;
  bafRank?: number;
  rankValue: number;
  flagged: boolean;
}

// --- Step 1: parse the current file's source, preserving raw expressions and attached comments ---
function parseCurrentSource(): RawEntry[] {
  const lines = fs.readFileSync(CURRENT_FILE, "utf-8").split(/\r?\n/);
  const entries: RawEntry[] = [];
  let pendingComment: string | undefined;
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//")) {
      if (trimmed === "// TODO: to sort") continue; // section marker, not a per-entry note
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
  return entries;
}

// --- Step 2: flatten SPELLS into file -> id lookup ---
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

// --- Step 3: extract first-occurrence line per spell FILE, excluding the hotkey range ---
// AMENDED: emulti.baf casts both by symbolic spell.ids token and by bare 4-digit
// numeric id. Match both and merge on file, first occurrence across both wins.
const NUMERIC_PREFIX: Record<string, string> = {
  "1": "SPPR", // priest
  "2": "SPWI", // wizard
  "3": "SPIN", // innate
  "4": "SPCL", // special / kit
};

function numericCodeToFile(code: string): string | undefined {
  const prefix = NUMERIC_PREFIX[code[0]];
  return prefix ? `${prefix}${code.slice(1)}` : undefined; // 1719 -> SPPR719
}

function extractBafRanks(idToFile: Map<string, string>): Map<string, number> {
  const lines = fs.readFileSync(BAF_FILE, "utf-8").split(/\r?\n/);
  const ranks = new Map<string, number>();
  // Target expression varies (Myself for self-buffs/heals, LastSeenBy(Myself),
  // NearestEnemyOf(Myself), bare LastSeenBy(), PlayerN) - match any target, since
  // none of these expressions contain a comma.
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

// --- Step 4: build ranked/unranked entries, interpolate the unranked ones ---
function buildRankedEntries(
  rawEntries: RawEntry[],
  resolved: string[],
  fileToId: Map<string, string>,
  bafRanks: Map<string, number>,
): RankedEntry[] {
  if (rawEntries.length !== resolved.length) {
    throw new Error(
      `Source entry count (${rawEntries.length}) does not match resolved SPELL_PRIORITY_ORDER length (${resolved.length}) - parseCurrentSource() missed or double-counted a line.`,
    );
  }

  const partial = rawEntries.map((raw, originalIndex) => {
    const file = resolved[originalIndex];
    const id = fileToId.get(file);
    const bafRank = id ? bafRanks.get(id) : undefined;
    return { ...raw, file, originalIndex, bafRank };
  });

  // AMENDED: placement is ordinal, not interpolated in baf-line space. The hand
  // list's order is nearly uncorrelated with the baf's (Spearman 0.175), so a
  // neighbour's line number says almost nothing about where an unranked entry
  // belongs - both a nearest-neighbour bracket and a monotonic L/R envelope end up
  // inverted for 36 of the 38 unranked entries, leaving the tie-break to decide the
  // answer. Instead: an entry the hand list placed after p of the m baf-ranked
  // spells is kept after exactly p of them. Consequence: unranked entries hold
  // their original index exactly, ranked entries fill the rest in baf order.
  const S = partial
    .map((e) => e.bafRank)
    .filter((r): r is number => r !== undefined)
    .sort((a, b) => a - b);
  const m = S.length;

  // p[i] = how many ranked entries precede original index i
  const p: number[] = new Array(partial.length);
  let seen = 0;
  for (let i = 0; i < partial.length; i++) {
    p[i] = seen;
    if (partial[i].bafRank !== undefined) seen++;
  }

  // nearest ranked neighbours in original order - used ONLY for the confidence flag,
  // never for placement
  const prevRanked: (number | undefined)[] = [];
  let lastSeen: number | undefined;
  for (const e of partial) {
    prevRanked.push(lastSeen);
    if (e.bafRank !== undefined) lastSeen = e.bafRank;
  }
  const nextRanked: (number | undefined)[] = new Array(partial.length);
  lastSeen = undefined;
  for (let i = partial.length - 1; i >= 0; i--) {
    nextRanked[i] = lastSeen;
    if (partial[i].bafRank !== undefined) lastSeen = partial[i].bafRank;
  }

  return partial.map((e, i): RankedEntry => {
    if (e.bafRank !== undefined) {
      return { ...e, rankValue: e.bafRank, flagged: false };
    }
    const k = p[i];
    let rankValue: number;
    if (m === 0) rankValue = i;
    else if (k === 0) rankValue = S[0] - 1;
    else if (k === m) rankValue = S[m - 1] + 1;
    else rankValue = (S[k - 1] + S[k]) / 2;

    // Flag when even the local evidence contradicts itself: the nearest ranked
    // entries on either side disagree about relative order, or one side has none.
    const prev = prevRanked[i];
    const next = nextRanked[i];
    const flagged = prev === undefined || next === undefined || prev > next;
    return { ...e, rankValue, flagged };
  });
}

// --- run ---
// AMENDED: parse the PRE-DERIVATION hand-tuned list (checked out from git), not
// the current file - re-deriving from an already-derived order is not this
// algorithm. Entry expressions are resolved against the real registries rather
// than by importing SPELL_PRIORITY_ORDER, since the imported array is the new one.
const rawEntries = parseCurrentSource();
const fileToId = new Map<string, string>();
flattenSpellsToIdMap(SPELLS, fileToId);
const idToFile = new Map([...fileToId].map(([file, id]) => [id, file]));
const bafRanks = extractBafRanks(idToFile);
const ranked = buildRankedEntries(rawEntries, resolveExprs(rawEntries), fileToId, bafRanks);

const sorted = [...ranked].sort((a, b) => a.rankValue - b.rankValue || a.originalIndex - b.originalIndex);

// sanity assertions
const originalFiles = new Set(ranked.map((e) => e.file));
const sortedFiles = new Set(sorted.map((e) => e.file));
if (originalFiles.size !== sortedFiles.size || sorted.length !== ranked.length) {
  throw new Error("Entry count changed during sort - this must never happen.");
}
for (const f of originalFiles) {
  if (!sortedFiles.has(f)) throw new Error(`Entry dropped during sort: ${f}`);
}
const sanctuaryIdx = sorted.findIndex((e) => e.file === "SPPR109"); // SPELLS.Priest.Sanctuary.file
const fingerIdx = sorted.findIndex((e) => e.file === "SPPR708"); // SPELLS.Priest.FingerOfDeath.file
if (sanctuaryIdx === -1 || fingerIdx === -1 || sanctuaryIdx >= fingerIdx) {
  throw new Error(
    `Sanctuary/FingerOfDeath invariant violated: sanctuaryIdx=${sanctuaryIdx}, fingerIdx=${fingerIdx}`,
  );
}

// build output: replacement array body + diff summary
const outputLines: string[] = [];
outputLines.push("// --- replacement array body ---");
for (const e of sorted) {
  if (e.flagged && !e.comment) {
    outputLines.push(
      "  // no reliable baf evidence bracketing this position - not vetted for priority.",
    );
  } else if (e.comment) {
    outputLines.push(`  ${e.comment}`);
  }
  outputLines.push(`  ${e.rawExpr}`);
}

outputLines.push("");
outputLines.push("// --- diff summary (original index -> new index, sorted by movement size) ---");
const newIndexByFile = new Map(sorted.map((e, i) => [e.file, i]));
const moves = ranked
  .map((e) => ({ file: e.file, from: e.originalIndex, to: newIndexByFile.get(e.file)! }))
  .filter((m) => Math.abs(m.to - m.from) > 10)
  .sort((a, b) => Math.abs(b.to - b.from) - Math.abs(a.to - a.from));
for (const m of moves) {
  outputLines.push(`${m.file}: ${m.from} -> ${m.to} (${m.to - m.from > 0 ? "+" : ""}${m.to - m.from})`);
}

outputLines.push("");
outputLines.push(`// --- unranked (flagged) entries: ${sorted.filter((e) => e.flagged).length} ---`);
for (const e of sorted.filter((e) => e.flagged)) {
  outputLines.push(e.rawExpr);
}

outputLines.push("");
outputLines.push(
  `// --- ranked-but-registry-id-unmatched check: SPELLS entries with an id, not found anywhere in emulti.baf ---`,
);
const rankedIds = new Set(bafRanks.keys());
for (const [file, id] of fileToId) {
  if (!rankedIds.has(id) && ranked.some((e) => e.file === file)) {
    outputLines.push(`${file} (${id})`);
  }
}

fs.writeFileSync(OUTPUT_FILE, outputLines.join("\n"), "utf-8");
console.log(`Wrote ${sorted.length} entries to ${OUTPUT_FILE}`);
console.log(`Flagged (unranked) entries: ${sorted.filter((e) => e.flagged).length}`);
console.log(`Moved more than 10 positions: ${moves.length}`);
```

- [ ] **Step 2: Run the script**

Run (from `generator/`): `npx ts-node scratch-spell-priority.ts`

Expected: prints `Wrote N entries to .../scratch-spell-priority-output.txt`
with `N` equal to the current `SPELL_PRIORITY_ORDER.length`, no thrown
error. A thrown `Error` at this step means one of the sanity checks failed
(dropped entry, count mismatch, or the Sanctuary/FingerOfDeath invariant) —
stop and diagnose before continuing; do not proceed to Task 2 with a script
that throws.

- [ ] **Step 3: Manually review the diff summary**

Open `generator/scratch-spell-priority-output.txt` and read the "diff
summary" and "unranked (flagged) entries" sections. This is a judgment
checkpoint, not an automated one:

- For each entry that moved more than ~30 positions, sanity-check it makes
  sense given `emulti.baf`'s segment structure (e.g. a buff moving earlier,
  an attack spell moving later relative to buffs, is expected; a cure
  spell moving to the very end would not be).
- For the "ranked-but-registry-id-unmatched" section, spot check 3-5
  entries against `emulti.baf` directly (`grep -n "<id>" assets/emulti.baf`)
  to distinguish "genuinely absent from this AI script" (fine, stays
  unranked) from "the `id` field in `spell-names.ts` doesn't match the
  actual `spell.ids` token used in the baf" (a real mismatch — note it for
  Task 3, don't silently accept). Note the script reads no `spell.ids` dump
  of its own; `emulti.baf` plus the registry's `id`/`file` fields are the
  only sources.

No commit for this step — it's a review pass over an uncommitted scratch
file.

---

## Task 2: Apply the new order to `spell-priority-order.ts`

**Files:**
- Modify: `generator/lib/config/spell-priority-order.ts`
- Delete: `generator/scratch-spell-priority.ts`, `generator/scratch-spell-priority-output.txt`

**Interfaces:**
- Consumes: the "replacement array body" section of `scratch-spell-priority-output.txt` from Task 1.

- [ ] **Step 1: Replace the array body**

**AMENDED:** don't hand-copy. Have the script write
`lib/config/spell-priority-order.ts` directly (imports, provenance doc
comment, array body, closing `];`, CRLF line endings to match the rest of
the working tree) so the committed file is verbatim script output. The
first round hand-copied the block and the committed array silently drifted
from what the documented algorithm produced. The `// TODO: to sort` marker
is dropped by the parser and must not reappear in the output.

- [ ] **Step 2: Apply any mismatch fixes found during Task 1's review**

If Task 1 Step 4 found any genuine `id`-field mismatches (registry `id`
doesn't match the actual `spell.ids` token in the baf), fix the `id` field
on the affected `SPELLS.*` entry in `lib/config/spells/spell-names.ts` now,
matching the real `spell.ids` name. If a fix changes a spell's baf-rank
outcome meaningfully, re-run Task 1 rather than hand-editing the ordering
directly (keeps the derivation reproducible from a single source of truth
instead of drifting from it).

- [ ] **Step 3: Delete the throwaway script and its output**

```bash
rm generator/scratch-spell-priority.ts generator/scratch-spell-priority-output.txt
```

- [ ] **Step 4: Run the existing spell-priority-order tests**

Run: `npx vitest run lib/config/spell-priority-order.test.ts`
Expected: PASS (2 tests) — non-empty list, Sanctuary ranked before
FingerOfDeath.

- [ ] **Step 5: Typecheck and run the full test suite**

Run: `npm run build`
Expected: exits with no errors.

Run: `npm test`
Expected: PASS, no regressions anywhere in the suite (this is a
content-only change to one config file plus, potentially, one `id` field
correction from Step 2 — no other file's behavior should change).

- [ ] **Step 6: Commit**

```bash
git add lib/config/spell-priority-order.ts lib/config/spells/spell-names.ts
git commit -m "refactor: derive SPELL_PRIORITY_ORDER from emulti.baf's AI priority order"
```

(Omit `spell-names.ts` from the `git add` if Task 2 Step 2 made no changes
there.)

---

## Task 3: Update the design doc's status (optional wrap-up)

**Files:**
- Modify: `generator/docs/superpowers/specs/2026-08-10-spell-priority-order-emulti-design.md`

- [ ] **Step 1: Note completion**

Add a one-line note at the top of the spec (below the title) recording
that the derivation was applied, e.g.:

```markdown
**Status:** Applied — see `spell-priority-order.ts` history for the
resulting order.
```

- [ ] **Step 2: Commit**

```bash
git add generator/docs/superpowers/specs/2026-08-10-spell-priority-order-emulti-design.md
git commit -m "docs: mark SPELL_PRIORITY_ORDER emulti.baf derivation as applied"
```
