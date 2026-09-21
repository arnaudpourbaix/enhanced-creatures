// Cross-checks lib/config/spells/spell-names.ts's SPELLS registry against the cumulative spell
// snapshots in assets/spells/*.csv. Each snapshot is the full spell.ids state after installing one
// more mod layer on top of the previous ones, in the fixed order vanilla -> spell_rev ->
// stratagems_iwd -> stratagems_newspells (see docs/superpowers/... for the design discussion this
// came out of). A SPELLS entry hardcodes one (file, id) pair, but a mod can repurpose a file's
// slot for a different spell (e.g. spell_rev turns SPWI106 from Blindness into Obscuring Mist) -
// this module finds where that single hardcoded pair stops matching reality.

import type { Csv } from "./build-creatures";

export interface SpellSnapshot {
  label: string;
  byFile: Map<string, { ids: string; name: string }>;
  /** Inverse of byFile - which file a given spell.ids constant lives at in this snapshot. */
  byId: Map<string, { file: string; name: string }>;
}

export function loadSnapshot(label: string, csv: Csv): SpellSnapshot {
  const byFile = new Map(csv.rows.map((r) => [r.file, { ids: r.ids, name: r.name }]));
  const byId = new Map(csv.rows.map((r) => [r.ids, { file: r.file, name: r.name }]));
  return { label, byFile, byId };
}

export interface RegistryEntry {
  /** Qualified as "<group>.<key>", e.g. "Wizard.AcidFog" - see report-spell-collisions.ts. */
  key: string;
  file: string;
  id?: string;
  /** Alternate files this entry's SpellReference.variants already documents as correct under some
   * mod - findAvailabilityGaps treats a snapshot's file as consistent if it matches one of these,
   * so an already-modeled variant stops showing up as an unexplained gap. */
  variantFiles?: string[];
  /**
   * The snapshot label this entry's SpellReference.requiresMod maps to (the first snapshot that
   * mod's content appears in) - findAvailabilityGaps expects the id to be present in exactly this
   * snapshot and every one after it, contiguously, and nowhere before. Unset means "should be
   * available from the very first snapshot" (the common, unconditional case).
   */
  requiresFromSnapshot?: string;
}

export interface IdentityMismatch {
  key: string;
  file: string;
  declaredId: string;
  mismatches: { snapshot: string; actualId: string; actualName: string }[];
}

/**
 * Entries whose declared `id` doesn't match the file's actual spell.ids constant in one or more
 * snapshots - the file's slot has been repurposed by a mod layer and the entry only reflects one
 * state of it. Entries with no snapshot data for their file at all are not reported here (nothing
 * to compare against); see findFileCollisions' dangling flag for that case when it also collides
 * with another entry, and note this alone doesn't catch a lone entry that's wrong in every
 * snapshot with no other entry to collide with.
 */
export function findIdentityMismatches(
  entries: RegistryEntry[],
  snapshots: SpellSnapshot[],
): IdentityMismatch[] {
  const results: IdentityMismatch[] = [];
  for (const entry of entries) {
    if (!entry.id) continue;
    const mismatches = snapshots.flatMap((snap) => {
      const row = snap.byFile.get(entry.file);
      if (!row || row.ids === entry.id) return [];
      return [{ snapshot: snap.label, actualId: row.ids, actualName: row.name }];
    });
    if (mismatches.length > 0) {
      results.push({ key: entry.key, file: entry.file, declaredId: entry.id, mismatches });
    }
  }
  return results.sort((a, b) => a.key.localeCompare(b.key));
}

export interface FileCollisionEntry {
  key: string;
  id?: string;
  /** Snapshots where this entry's declared id matches the file's actual spell.ids constant there. */
  matchingSnapshots: string[];
}

export interface FileCollision {
  file: string;
  entries: FileCollisionEntry[];
  /**
   * Two entries both match the same snapshot - they can't both be right there at once. A real bug,
   * not just a missing-availability gap.
   */
  sameStateConflict: boolean;
  /** At least one entry matches no known snapshot at all - a dangling (file, id) pair. */
  hasDanglingEntry: boolean;
}

/**
 * Groups SPELLS entries that share a `file`. Sharing a file across entries is not automatically a
 * bug - e.g. Blindness (matches 001_vanilla) and ObscuringMist (matches every snapshot from
 * 002_spell_rev on) legitimately share SPWI106 across disjoint mod states - but every collision is
 * still worth surfacing, since as written neither entry declares which mod state it needs.
 */
export function findFileCollisions(
  entries: RegistryEntry[],
  snapshots: SpellSnapshot[],
): FileCollision[] {
  const byFile = new Map<string, RegistryEntry[]>();
  for (const entry of entries) {
    const group = byFile.get(entry.file) ?? [];
    group.push(entry);
    byFile.set(entry.file, group);
  }

  const collisions: FileCollision[] = [];
  for (const [file, group] of byFile) {
    if (group.length < 2) continue;
    const resolved: FileCollisionEntry[] = group.map((entry) => ({
      matchingSnapshots: snapshots
        .filter((snap) => snap.byFile.get(file)?.ids === entry.id)
        .map((snap) => snap.label),
      key: entry.key,
      id: entry.id,
    }));
    const sameStateConflict = snapshots.some(
      (snap) => resolved.filter((r) => r.matchingSnapshots.includes(snap.label)).length > 1,
    );
    const hasDanglingEntry = resolved.some((r) => r.matchingSnapshots.length === 0);
    collisions.push({ entries: resolved, file, sameStateConflict, hasDanglingEntry });
  }
  return collisions.sort((a, b) => a.file.localeCompare(b.file));
}

export interface AvailabilityGap {
  key: string;
  id: string;
  declaredFile: string;
  /** Snapshots (in order) where this id exists at all, each with the file it's actually at there. */
  availableIn: { snapshot: string; file: string }[];
  /** False when the id only shows up starting from a later mod layer - it isn't in vanilla at all. */
  availableFromStart: boolean;
  /** False when the id exists somewhere but at a different file than the entry declares. */
  fileConsistent: boolean;
}

/**
 * Searches for each entry's `id` directly across every snapshot, instead of trusting the declared
 * `file` - findIdentityMismatches only compares against whatever (if anything) sits at the declared
 * file, so it can't tell "this id doesn't exist yet without a mod" from "this id lives at a
 * different file than declared". Both show up here: an id missing from 001_vanilla is mod-gated
 * (the entry needs availability metadata, not just a fix); an id present everywhere but at another
 * file is a plain wrong-file bug (e.g. SymbolFear's SPWI898 vs. its real SPWI899).
 */
export function findAvailabilityGaps(
  entries: RegistryEntry[],
  snapshots: SpellSnapshot[],
): AvailabilityGap[] {
  const results = entries.flatMap((entry): AvailabilityGap[] => {
    const id = entry.id;
    if (!id || snapshots.length === 0) return [];
    const availableIn = snapshots.flatMap((snap) => {
      const hit = snap.byId.get(id);
      return hit ? [{ snapshot: snap.label, file: hit.file }] : [];
    });
    if (availableIn.length === 0) return [];
    const knownFiles = [entry.file, ...(entry.variantFiles ?? [])];
    const availableFromStart = availableIn[0].snapshot === snapshots[0].label;
    const fileConsistent = availableIn.every((a) => knownFiles.includes(a.file));

    // A declared requiresMod expects the id to show up starting exactly at that mod's snapshot and
    // stay present in every one after it - anything else (missing from part of that range, or
    // present before it) means the declared requirement doesn't match reality.
    const requiredFromIndex = entry.requiresFromSnapshot
      ? snapshots.findIndex((s) => s.label === entry.requiresFromSnapshot)
      : 0;
    const expectedSnapshots = snapshots.slice(Math.max(requiredFromIndex, 0)).map((s) => s.label);
    const actualSnapshots = availableIn.map((a) => a.snapshot);
    const matchesDeclaredAvailability =
      requiredFromIndex >= 0 &&
      actualSnapshots.length === expectedSnapshots.length &&
      actualSnapshots.every((s, i) => s === expectedSnapshots[i]);

    if (matchesDeclaredAvailability && fileConsistent) return [];
    return [
      {
        availableIn,
        availableFromStart,
        fileConsistent,
        id,
        key: entry.key,
        declaredFile: entry.file,
      },
    ];
  });
  return results.sort((a, b) => a.key.localeCompare(b.key));
}

const cell = (values: string[]): string => (values.length > 0 ? values.join(", ") : "_(none)_");

function renderCollisionVerdict(c: FileCollision): string {
  if (c.sameStateConflict) return "**same-state conflict**";
  if (c.hasDanglingEntry) return "**dangling entry**";
  return "disjoint (needs per-mod availability)";
}

function renderCollisionsSection(collisions: FileCollision[]): string[] {
  if (collisions.length === 0) return [];
  return [
    `## File collisions (${collisions.length})`,
    "",
    "Two or more SPELLS entries share the same resource file.",
    "",
    "| file | entries | verdict |",
    "| --- | --- | --- |",
    ...collisions.map((c) => {
      const entries = c.entries.map((e) => `${e.key} (${cell(e.matchingSnapshots)})`).join("; ");
      return `| ${c.file} | ${entries} | ${renderCollisionVerdict(c)} |`;
    }),
    "",
  ];
}

function renderMismatchesSection(mismatches: IdentityMismatch[]): string[] {
  if (mismatches.length === 0) return [];
  return [
    `## Identity mismatches (${mismatches.length})`,
    "",
    "A SPELLS entry's declared `id` doesn't match the file's actual spell.ids constant in one or " +
      "more snapshots.",
    "",
    "| key | file | declared id | mismatched in |",
    "| --- | --- | --- | --- |",
    ...mismatches.map((m) => {
      const where = m.mismatches.map((x) => `${x.snapshot} (${x.actualId})`).join(", ");
      return `| ${m.key} | ${m.file} | ${m.declaredId} | ${where} |`;
    }),
    "",
  ];
}

function renderAvailabilityVerdict(g: AvailabilityGap): string {
  if (!g.availableFromStart) return "**mod-gated** (not in vanilla)";
  if (!g.fileConsistent) return "**wrong file**";
  return "ok";
}

function renderAvailabilitySection(gaps: AvailabilityGap[]): string[] {
  if (gaps.length === 0) return [];
  return [
    `## Availability gaps (${gaps.length})`,
    "",
    "A SPELLS entry's `id`, searched for directly rather than trusted at its declared file, isn't " +
      "present from 001_vanilla onward, or lives at a different file than declared wherever it does " +
      "exist.",
    "",
    "| key | declared file | id | available in (actual file) | verdict |",
    "| --- | --- | --- | --- | --- |",
    ...gaps.map((g) => {
      const where = g.availableIn.map((a) => `${a.snapshot} (${a.file})`).join(", ");
      return `| ${g.key} | ${g.declaredFile} | ${g.id} | ${where} | ${renderAvailabilityVerdict(g)} |`;
    }),
    "",
  ];
}

export function renderSpellCollisionsReport(
  mismatches: IdentityMismatch[],
  collisions: FileCollision[],
  gaps: AvailabilityGap[],
): string {
  return [
    "# Spell registry vs installed-mod snapshots",
    "",
    ...renderCollisionsSection(collisions),
    ...renderMismatchesSection(mismatches),
    ...renderAvailabilitySection(gaps),
  ].join("\n");
}
