import { spawnSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { PLAYER_CONFIG, StrengthEdition } from "../lib/config/player-config";
import { buildAllCreatures } from "../lib/creatures";
import { MonsterEnum } from "../lib/creatures/monster";
import { parseCsv } from "./lib/csv";
import { csvBool, requireCsvColumns } from "../lib/src/csv";
import { CsvSummary, MonsterRowCount, renderDashboard } from "./lib/dashboard-html";
import { diffMonsters } from "./lib/monster-status";
import { readModVersion } from "../lib/src/services/doc/doc-version";
import logService from "../lib/src/services/log.service";
import mainService from "../lib/src/services/main.service";
import stateService from "../lib/src/services/state.service";
import { buildExperienceReport } from "./lib/experience-report";
import { DmgScore, EditionScores, STRENGTH_EDITIONS } from "./lib/experience-proposals";
import { buildStrengthReport } from "./lib/strength-report";
import { buildAttackStrengthReport } from "./lib/attack-strength-report";
import { buildStrengthAudit, ItemSource } from "./lib/strength-audit";
import { ResourceReader } from "./lib/spell-saves";
import { buildStatsReport, loadStatsCsv } from "./lib/stats-report";

// Builds every creature once and renders a single dashboard page with:
// - Overview: creatures.csv rows by MonsterId status, monster counts, stats
//   report headline
// - Stats report: creatures.csv hp / thac0 / apr vs the documentation (scripts/lib/stats-report.ts)
// - Experience: the XP decided per file, files it lowers, base XP conflicts
// - Missing monsters: missing / file-less / unvalidated monsters, each with the number of
//   creatures.csv rows carrying its MonsterId
//
// Run: npm run dashboard   (or npx ts-node scripts/dashboard.ts --assets <dir>)
// Output: mod/docs/dashboard.html, linked from the docs site nav (rendering in
// scripts/lib/dashboard-html.ts)

function parseArgs(): { assetsDir: string } {
  const args = process.argv.slice(2);
  const idx = args.indexOf("--assets");
  const assetsDir = path.resolve(idx >= 0 ? args[idx + 1] : path.join(process.cwd(), "assets"));
  return { assetsDir };
}

/** Initializes the services the kin and entry builders need, logging to dashboard.log. */
async function initBuildPipeline(): Promise<void> {
  logService.filePath = path.join(process.cwd(), "dashboard.log");
  logService.init();
  await stateService.init();
  mainService.checkPresets();
  mainService.checkSpells();
}

function summarizeCsv(rows: Record<string, string>[]): {
  summary: CsvSummary;
  byMonster: Map<string, MonsterRowCount>;
} {
  const summary: CsvSummary = { total: rows.length, validated: 0, unvalidated: 0, noMonsterId: 0 };
  const byMonster = new Map<string, MonsterRowCount>();
  for (const row of rows) {
    const monster = row.MonsterId.trim();
    if (!monster) {
      summary.noMonsterId++;
      continue;
    }
    const validated = csvBool(row.ValidatedMonsterId);
    if (validated) summary.validated++;
    else summary.unvalidated++;
    const count = byMonster.get(monster) ?? { monster, rows: 0, validated: 0 };
    count.rows++;
    if (validated) count.validated++;
    byMonster.set(monster, count);
  }
  return { summary, byMonster };
}

/**
 * The base creatures' DMG scores under each strength edition the settings don't play, each from its
 * own build (scripts/dmg-edition.ts, a child process: the builders keep global state). An edition
 * whose build fails is left out, with a warning.
 */
function otherEditionsScores(): EditionScores[] {
  return STRENGTH_EDITIONS.filter((e) => e !== PLAYER_CONFIG.strengthEdition).flatMap(
    (edition) => editionScores(edition) ?? [],
  );
}

function editionScores(edition: StrengthEdition): EditionScores | undefined {
  const out = path.join(
    os.tmpdir(),
    `dmg-edition-${process.pid}-${edition.replace(/\W/g, "")}.json`,
  );
  const tsNode = require.resolve("ts-node/dist/bin.js");
  const script = path.join(__dirname, "dmg-edition.ts");
  const result = spawnSync(process.execPath, [tsNode, script, edition, out], { stdio: "inherit" });
  if (result.status !== 0 || !fs.existsSync(out)) {
    console.warn(
      `The ${edition} strength build failed: XP proposals show ${PLAYER_CONFIG.strengthEdition} only`,
    );
    return undefined;
  }
  const entries = JSON.parse(fs.readFileSync(out, "utf-8")) as [string, DmgScore][];
  const scores = new Map(entries);
  fs.rmSync(out);
  return { edition, scores };
}

/** ITM resource type in chitin.key */
const ITM_TYPE = 0x3ed;

/**
 * The BG1 and BG2 installs' items (override first, as the engine reads them), from
 * paths.local.json; undefined, with a warning, without a BG2 one: the strength audit then has no
 * game side. A missing BG1 install only leaves out the creatures met in BG1 alone.
 */
function gameItems(): ItemSource | undefined {
  const config = path.join(process.cwd(), "paths.local.json");
  const paths = fs.existsSync(config)
    ? (JSON.parse(fs.readFileSync(config, "utf-8")) as { bg1?: string; bg2?: string })
    : {};
  const reader = (dir: string | undefined) =>
    dir && fs.existsSync(path.join(dir, "chitin.key")) ? new ResourceReader(dir) : undefined;
  const readers = { bg1: reader(paths.bg1), bg2: reader(paths.bg2) };
  if (!readers.bg2) {
    console.warn("No BG2 install in paths.local.json: the strength audit has no game side");
    return undefined;
  }
  return (file, game) => readers[game]?.read(file, ITM_TYPE, "itm");
}

async function main() {
  const { assetsDir } = parseArgs();
  await initBuildPipeline();
  const creatures = buildAllCreatures();

  const csv = parseCsv(fs.readFileSync(path.join(assetsDir, "creatures.csv"), "utf-8"));
  const attackStrength = buildAttackStrengthReport(creatures);
  const items = gameItems();
  requireCsvColumns(csv.header, ["MonsterId", "ValidatedMonsterId"], "creatures.csv");
  const { summary, byMonster } = summarizeCsv(csv.rows);
  const counts = (monster: string): MonsterRowCount =>
    byMonster.get(monster) ?? { monster, rows: 0, validated: 0 };
  const { missing, unvalidated, noFiles, total } = diffMonsters(creatures);
  const unknown = [...byMonster.keys()].filter((m) => !(m in MonsterEnum));

  const experience = buildExperienceReport(creatures, {
    current: PLAYER_CONFIG.strengthEdition,
    others: otherEditionsScores(),
  });
  const html = renderDashboard({
    generatedAt: new Date(),
    version: readModVersion(),
    csv: summary,
    monsters: {
      total,
      missing: missing.map(counts),
      unvalidated: unvalidated.map(counts),
      noFiles: noFiles.map(counts),
      unknown: unknown.map(counts),
    },
    stats: buildStatsReport(creatures, loadStatsCsv(assetsDir)),
    strength: buildStrengthReport(creatures),
    strengthAudit: {
      rows: buildStrengthAudit(creatures, attackStrength, csv.rows, items),
      gameRead: !!items,
    },
    experience,
    attackStrength,
  });

  if (unknown.length) console.warn(`Unknown MonsterId in creatures.csv: ${unknown.join(", ")}`);

  const outPath = path.join(process.cwd(), "mod", "docs", "dashboard.html");
  fs.writeFileSync(outPath, html, "utf-8");
  console.log(`Wrote ${path.relative(process.cwd(), outPath)}`);
  console.log(
    `creatures.csv: ${summary.total} rows, ${summary.validated} validated, ` +
      `${summary.unvalidated} not validated, ${summary.noMonsterId} without MonsterId`,
  );
  console.log(
    `Monsters: ${missing.length} missing, ${noFiles.length} without creatures yet, ` +
      `${unvalidated.length} failing validation`,
  );
  console.log(
    `Experience: ${experience.changed} adjustments whose XP changed, ${experience.lowered.length} lowered, ` +
      `${experience.conflicts.length} conflicts`,
  );
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
