import * as fs from "fs";
import * as path from "path";
import { familyFactories } from "../lib/creatures";
import { MonsterEnum } from "../lib/creatures/monster";
import type { Creature } from "../lib/src/model/creature/creature";
import { parseCsv } from "./lib/build-creatures";

// Cross-references the game-specific rows in assets/creatures.csv (the ones with a non-empty
// `game` column, added from bg{1,2}-duplicates.csv) against the hand-written `setAdjustments([...])`
// entries in lib/creatures/*.ts.
//
// Report 1: every (file, game) whose resref is named in some creature's adjustments array.
// Report 2: of those, the rows whose `level` in creatures.csv does not match the level the
//           generator would give that file - the creature's base `level1`, or an adjustment's
//           `level1` when one covers the file. Split by whether an adjustment sets the level.
//
// Run: ts-node scripts/report-game-adjustments.ts   (pass --assets <dir> to point elsewhere)

function parseArgs(): { assetsDir: string } {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--assets");
  const assetsDir = path.resolve(idx >= 0 ? args[idx + 1] : path.join(process.cwd(), "assets"));
  return { assetsDir };
}

function levelValue(raw: unknown): number | undefined {
  if (typeof raw === "number") return raw;
  if (raw !== null && typeof raw === "object" && "value" in raw) return Number(raw.value);
  return undefined;
}

interface AdjustmentMatch {
  monster: string;
  baseLevel?: number;
  /**
   * level1 by game scope, from the last adjustment covering this file that sets one in that scope.
   * Key `""` = untagged (applies to both games); `"bg1"` / `"bg2"` = a game-tagged adjustment.
   */
  adjustmentLevelByScope: Map<string, number>;
  /** `game` value of every adjustment (of this creature) covering the file; `""` = untagged. */
  adjustmentGames: Set<string>;
}

/** A single `game`-tagged adjustment naming a single file, for the mis-tag cross-check. */
interface GameTaggedAdjustment {
  file: string;
  game: string;
  monster: string;
}

/**
 * Resref (uppercase) -> per-game-scope `level1` (`""` = untagged, `"bg1"`/`"bg2"` = game-tagged),
 * last-write-wins within each scope, for one creature.
 */
function adjustmentLevelsByFile(creature: Creature): Map<string, Map<string, number>> {
  const byFile = new Map<string, Map<string, number>>();
  for (const adjustment of creature.adjustments) {
    const level = levelValue(adjustment.data.level1);
    if (level === undefined) continue;
    const scope = adjustment.game ?? "";
    for (const file of adjustment.files) {
      const key = file.toUpperCase();
      const byScope = byFile.get(key) ?? new Map<string, number>();
      byScope.set(scope, level);
      byFile.set(key, byScope);
    }
  }
  return byFile;
}

/** The adjustment `level1` that applies to a row's game: a game-specific scope wins over untagged. */
function adjustmentLevelForGame(
  byScope: Map<string, number> | undefined,
  game: string,
): number | undefined {
  return byScope?.get(game) ?? byScope?.get("");
}

function adjustmentFileSet(creature: Creature): Set<string> {
  return new Set(creature.adjustments.flatMap((a) => a.files.map((f) => f.toUpperCase())));
}

/** Resref (uppercase) -> the set of `game` values on the adjustments covering it (`""` = untagged). */
function adjustmentGamesByFile(creature: Creature): Map<string, Set<string>> {
  const byFile = new Map<string, Set<string>>();
  for (const adjustment of creature.adjustments) {
    const game = adjustment.game ?? "";
    for (const file of adjustment.files) {
      const key = file.toUpperCase();
      const games = byFile.get(key) ?? new Set<string>();
      games.add(game);
      byFile.set(key, games);
    }
  }
  return byFile;
}

/** Map every resref named in a `setAdjustments` entry to the creature(s) and levels behind it. */
function indexAdjustmentFiles(): {
  byFile: Map<string, AdjustmentMatch[]>;
  gameTagged: GameTaggedAdjustment[];
} {
  const byFile = new Map<string, AdjustmentMatch[]>();
  const gameTagged: GameTaggedAdjustment[] = [];
  const creatures = familyFactories.flatMap((factory) => factory().creatures);
  for (const creature of creatures) {
    const monster = MonsterEnum[creature.id];
    const baseLevel = levelValue(creature.data.level1);
    const adjustmentLevels = adjustmentLevelsByFile(creature);
    const adjustmentGames = adjustmentGamesByFile(creature);
    for (const file of adjustmentFileSet(creature)) {
      const matches = byFile.get(file) ?? [];
      matches.push({
        monster,
        baseLevel,
        adjustmentLevelByScope: adjustmentLevels.get(file) ?? new Map<string, number>(),
        adjustmentGames: adjustmentGames.get(file) ?? new Set<string>(),
      });
      byFile.set(file, matches);
    }
    for (const adjustment of creature.adjustments) {
      if (!adjustment.game) continue;
      for (const file of adjustment.files) {
        gameTagged.push({ file: file.toUpperCase(), game: adjustment.game, monster });
      }
    }
  }
  return { byFile, gameTagged };
}

interface Row {
  file: string;
  game: string;
  csvLevel: number;
  monster: string;
  baseLevel?: number;
  adjustmentLevel?: number;
  /** `game` values on the adjustments covering this file; `""` = untagged catch-all. */
  adjustmentGames: Set<string>;
}

const { assetsDir } = parseArgs();

const creatures = parseCsv(fs.readFileSync(path.join(assetsDir, "creatures.csv"), "utf-8"));
const { byFile: adjustmentFiles, gameTagged } = indexAdjustmentFiles();

/** Uppercased resref -> the set of non-empty csv `game` values seen for it. */
const perGameFiles = new Map<string, Set<string>>();
for (const r of creatures.rows) {
  if (!r.game) continue;
  const key = r.file.toUpperCase();
  const games = perGameFiles.get(key) ?? new Set<string>();
  games.add(r.game);
  perGameFiles.set(key, games);
}

const rows: Row[] = [];
for (const r of creatures.rows) {
  if (!r.game) continue;
  for (const match of adjustmentFiles.get(r.file.toUpperCase()) ?? []) {
    rows.push({
      file: r.file,
      game: r.game,
      csvLevel: Number(r.level),
      monster: match.monster,
      baseLevel: match.baseLevel,
      adjustmentLevel: adjustmentLevelForGame(match.adjustmentLevelByScope, r.game),
      adjustmentGames: match.adjustmentGames,
    });
  }
}
rows.sort((a, b) => a.file.localeCompare(b.file) || a.game.localeCompare(b.game));

const expectedLevel = (r: Row): number | undefined => r.adjustmentLevel ?? r.baseLevel;
const mismatches = rows.filter(
  (r) => expectedLevel(r) !== undefined && r.csvLevel !== expectedLevel(r),
);
const noAdjustmentLevel = mismatches.filter((r) => r.adjustmentLevel === undefined);
const adjustmentLevelDiffers = mismatches.filter((r) => r.adjustmentLevel !== undefined);

// csv rows that genuinely differ per game (file has both a bg1 and a bg2 row) but where no
// adjustment covering the file is tagged for this row's game. An untagged catch-all is NOT an
// exemption - it applies one set of values to both games, so a divergent file it covers will get
// the same (possibly wrong) values in both. This is the GORF case.
const divergentUncovered = rows.filter(
  (r) => (perGameFiles.get(r.file.toUpperCase())?.size ?? 0) > 1 && !r.adjustmentGames.has(r.game),
);

// `game`-tagged adjustments whose file does NOT have a bg1/bg2 split in the csv - probable mis-tag.
const misTagged = gameTagged.filter(
  (a) => (perGameFiles.get(a.file.toUpperCase())?.size ?? 0) <= 1,
);

const num = (n: number | undefined): string => (n === undefined ? "-" : String(n));

const lines = [
  "# Game-specific rows named in creature adjustments",
  "",
  `${new Set(rows.map((r) => r.file)).size} file(s) with a \`game\` value appear in a ` +
    "`setAdjustments([...])` entry in lib/creatures/.",
  "",
  "## All matches",
  "",
  "| file | game | csv level | creature | base level1 | adjustment level1 |",
  "| --- | --- | --- | --- | --- | --- |",
  ...rows.map(
    (r) =>
      `| ${r.file} | ${r.game} | ${r.csvLevel} | ${r.monster} | ${num(r.baseLevel)} | ${num(r.adjustmentLevel)} |`,
  ),
  "",
  `## Level differs, and no adjustment sets a level for the file (${noAdjustmentLevel.length})`,
  "",
  "The csv `level` does not match the creature's base `level1` and no adjustment overrides it.",
  "",
  "| file | game | csv level | creature | base level1 |",
  "| --- | --- | --- | --- | --- |",
  ...noAdjustmentLevel.map(
    (r) => `| ${r.file} | ${r.game} | ${r.csvLevel} | ${r.monster} | ${num(r.baseLevel)} |`,
  ),
  "",
  `## Level differs from the adjustment's level1 (${adjustmentLevelDiffers.length})`,
  "",
  "An adjustment covers the file and sets `level1`, but the csv `level` is something else.",
  "",
  "| file | game | csv level | creature | adjustment level1 |",
  "| --- | --- | --- | --- | --- |",
  ...adjustmentLevelDiffers.map(
    (r) => `| ${r.file} | ${r.game} | ${r.csvLevel} | ${r.monster} | ${num(r.adjustmentLevel)} |`,
  ),
  "",
  `## Divergent csv rows whose covering adjustment is not game-specific (${divergentUncovered.length})`,
  "",
  "The csv `game` rows for this file differ, but no adjustment covering it is tagged for that " +
    "game - it will get the same (possibly wrong) values in both games.",
  "",
  "| file | game | creature |",
  "| --- | --- | --- |",
  ...divergentUncovered.map((r) => `| ${r.file} | ${r.game} | ${r.monster} |`),
  "",
  `## Game-tagged adjustments whose csv rows don't differ (${misTagged.length})`,
  "",
  "A `game`-tagged adjustment names a file whose creatures.csv row is the same in both games " +
    "(no bg1/bg2 split) - probably a mis-tag.",
  "",
  "| file | game | creature |",
  "| --- | --- | --- |",
  ...misTagged.map((a) => `| ${a.file} | ${a.game} | ${a.monster} |`),
  "",
];

const reportPath = path.join(assetsDir, "game-adjustments-report.md");
fs.writeFileSync(reportPath, lines.join("\n"), "utf-8");

console.log(`Wrote ${path.relative(process.cwd(), reportPath)}`);
console.log(`Matches: ${rows.length} row(s), ${new Set(rows.map((r) => r.file)).size} file(s)`);
console.log(`Level differs, no adjustment level: ${noAdjustmentLevel.length}`);
console.log(`Level differs from adjustment level: ${adjustmentLevelDiffers.length}`);
console.log(
  `Divergent csv rows whose covering adjustment is not game-specific: ${divergentUncovered.length}`,
);
console.log(`Game-tagged adjustments whose csv rows don't differ: ${misTagged.length}`);
