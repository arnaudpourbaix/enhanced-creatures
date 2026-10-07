import * as fs from "fs";
import * as path from "path";
import { familyFactories } from "../lib/creatures";
import { MonsterEnum } from "../lib/creatures/monster";
import type { Creature } from "../lib/src/model/creature/creature";
import { Game, gamesOverlap } from "../lib/src/model/creature/game";
import { AttackPerRoundTable } from "../lib/src/model/game-data/attack-per-round";
import adjustmentService from "../lib/src/services/doc/adjustment.service";
import logService from "../lib/src/services/log.service";
import mainService from "../lib/src/services/main.service";
import stateService from "../lib/src/services/state.service";
import { parseCsv } from "./lib/build-creatures";
import {
  MonsterReport,
  renderStatsReport,
  StatsComparison as Comparison,
  StatsCsvRow as CsvRow,
} from "./lib/stats-report-html";

// Compares the hp / thac0 / apr columns of assets/creatures.csv (the vanilla/mod CRE values)
// against what the documentation shows for the same file: the base creature card, or the
// adjustment/variant card folded for that file and game (adjustmentService.getEffectiveForGame,
// the same fold the doc uses - so class, level, proficiencies, dual wielding and the PC-class
// constitution hp bonus are all accounted for).
//
// A file is reported only when thac0 or apr differs relevantly:
// - thac0: |doc - csv| > THAC0_TOLERANCE
// - apr: any difference. The csv apr is the raw CRE byte, decoded through AttackPerRoundTable
//   (6 = 1/2, 7 = 3/2, ...).
// hp is never a reason to report a file (the mod deliberately reworks hp almost everywhere), but
// its change is still shown for every reported file. A level difference doesn't report a file
// either, but is flagged (levelFlag) so the page can filter reported files down to level changes.
//
// Run: npx ts-node scripts/report-stats.ts   (pass --assets <dir> to point elsewhere)
// Output: assets/stats-report.html (rendering in scripts/lib/stats-report-html.ts)

const THAC0_TOLERANCE = 3;

function parseArgs(): { assetsDir: string } {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--assets");
  const assetsDir = path.resolve(idx >= 0 ? args[idx + 1] : path.join(process.cwd(), "assets"));
  return { assetsDir };
}

/** Raw CRE apr byte -> attacks per round. */
function decodeApr(raw: number): number {
  return AttackPerRoundTable.find((t) => !t.doubleApr && t.value === raw)?.apr ?? raw;
}

function num(raw: string | undefined): number | undefined {
  if (raw === undefined || raw.trim() === "") return undefined;
  const n = Number(raw);
  return Number.isNaN(n) ? undefined : n;
}

function loadCsv(assetsDir: string): Map<string, CsvRow[]> {
  const csv = parseCsv(fs.readFileSync(path.join(assetsDir, "creatures.csv"), "utf-8"));
  const byFile = new Map<string, CsvRow[]>();
  for (const r of csv.rows) {
    const game = r.game === "bg1" || r.game === "bg2" ? r.game : undefined;
    const apr = num(r.apr);
    const row: CsvRow = {
      game,
      file: r.file,
      name: r.name,
      level: num(r.level),
      hp: num(r.hp),
      thac0: num(r.thac0),
      apr: apr === undefined ? undefined : decodeApr(apr),
    };
    const key = r.file.toUpperCase();
    byFile.set(key, [...(byFile.get(key) ?? []), row]);
  }
  return byFile;
}

/** Every file the creature documents, with the game scope its base declaration restricts it to. */
function documentedFiles(creature: Creature): Map<string, Game | undefined> {
  const files = new Map<string, Game | undefined>();
  for (const f of creature.files) files.set(f.name, f.game);
  for (const adjustment of creature.adjustments) {
    for (const f of adjustment.files) if (!files.has(f)) files.set(f, undefined);
  }
  return files;
}

/**
 * The game scopes a csv row is documented under: its own game, or - for a game-less row (same
 * CRE in both games) - every game an adjustment covering the file is tagged for, since the doc
 * then shows one card per game.
 */
function scopesFor(creature: Creature, file: string, row: CsvRow): (Game | undefined)[] {
  if (row.game) return [row.game];
  const tagged = [
    ...new Set(creature.adjustments.filter((a) => a.files.includes(file)).map((a) => a.game)),
  ].filter((g): g is Game => g !== undefined);
  return tagged.length ? tagged : [undefined];
}

function compare(creature: Creature, csvByFile: Map<string, CsvRow[]>, missing: string[]) {
  const comparisons: Comparison[] = [];
  for (const [file, fileGame] of documentedFiles(creature)) {
    const rows = (csvByFile.get(file.toUpperCase()) ?? []).filter((r) =>
      gamesOverlap(r.game, fileGame),
    );
    if (!rows.length) {
      missing.push(file);
      continue;
    }
    for (const row of rows) {
      if (row.hp === undefined || row.thac0 === undefined || row.apr === undefined) {
        missing.push(row.game ? `${file} (${row.game})` : file);
        continue;
      }
      for (const game of scopesFor(creature, file, row)) {
        comparisons.push(compareRow(creature, file, game, row));
      }
    }
  }
  return comparisons;
}

function compareRow(
  creature: Creature,
  file: string,
  game: Game | undefined,
  row: CsvRow,
): Comparison {
  const e = adjustmentService.getEffectiveForGame(creature, file, game);
  const doc = { level: e.level.value, hp: e.hp.value, thac0: e.thac0.value, apr: e.apr.value };
  return {
    file,
    doc,
    game: game ?? row.game,
    name: row.name,
    csv: row,
    levelFlag: row.level !== undefined && doc.level !== row.level,
    thac0Flag: row.thac0 !== undefined && Math.abs(doc.thac0 - row.thac0) > THAC0_TOLERANCE,
    aprFlag: doc.apr !== row.apr,
  };
}

async function main() {
  const { assetsDir } = parseArgs();
  // The family builders log through logService - keep that out of generator.log.
  logService.filePath = path.join(process.cwd(), "report-stats.log");
  logService.init();
  await stateService.init();
  mainService.checkPresets();
  mainService.checkSpells();

  const csvByFile = loadCsv(assetsDir);
  const reports: MonsterReport[] = [];
  const missing: string[] = [];
  for (const factory of familyFactories) {
    for (const creature of factory().creatures) {
      if (!creature.valid) continue;
      const comparisons = compare(creature, csvByFile, missing);
      reports.push({
        monster: MonsterEnum[creature.id],
        all: comparisons,
        flagged: comparisons.filter((c) => c.thac0Flag || c.aprFlag),
      });
    }
  }

  const flagged = reports.filter((r) => r.flagged.length);
  const all = flagged.flatMap((r) => r.flagged);
  const compared = reports.reduce((sum, r) => sum + r.all.length, 0);
  const html = renderStatsReport({
    flagged,
    compared,
    missing,
    monsters: reports.length,
    thac0Tolerance: THAC0_TOLERANCE,
  });

  const reportPath = path.join(assetsDir, "stats-report.html");
  fs.writeFileSync(reportPath, html, "utf-8");
  console.log(`Wrote ${path.relative(process.cwd(), reportPath)}`);
  console.log(`Compared: ${compared}, flagged: ${all.length} across ${flagged.length} monsters`);
  console.log(`Not compared: ${missing.length}`);
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
