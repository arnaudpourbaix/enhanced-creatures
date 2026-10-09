import * as fs from "fs";
import * as path from "path";
import { familyFactories } from "../lib/creatures";
import { MonsterEnum } from "../lib/creatures/monster";
import { parseCsv } from "./lib/csv";
import { CsvSummary, MonsterRowCount, renderDashboard } from "./lib/dashboard-html";
import { diffMonsters } from "./lib/monster-status";
import { readModVersion } from "../lib/src/services/doc/doc-version";
import logService from "../lib/src/services/log.service";
import mainService from "../lib/src/services/main.service";
import stateService from "../lib/src/services/state.service";
import { buildStatsReport, loadStatsCsv } from "./lib/stats-report";

// Builds every creature family once and renders a single dashboard page with:
// - Overview: creatures.csv rows by MonsterId status, monster counts, stats
//   report headline
// - Stats report: creatures.csv hp / thac0 / apr vs the documentation (scripts/lib/stats-report.ts)
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

/** Initializes the services the family builders need, logging to dashboard.log. */
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
    const validated = row.ValidatedMonsterId.trim().toLowerCase() === "true";
    if (validated) summary.validated++;
    else summary.unvalidated++;
    const count = byMonster.get(monster) ?? { monster, rows: 0, validated: 0 };
    count.rows++;
    if (validated) count.validated++;
    byMonster.set(monster, count);
  }
  return { summary, byMonster };
}

async function main() {
  const { assetsDir } = parseArgs();
  await initBuildPipeline();
  const creatures = familyFactories.flatMap((factory) => factory().creatures);

  const csv = parseCsv(fs.readFileSync(path.join(assetsDir, "creatures.csv"), "utf-8"));
  const { summary, byMonster } = summarizeCsv(csv.rows);
  const counts = (monster: string): MonsterRowCount =>
    byMonster.get(monster) ?? { monster, rows: 0, validated: 0 };
  const { missing, unvalidated, noFiles, total } = diffMonsters(creatures);
  const unknown = [...byMonster.keys()].filter((m) => !(m in MonsterEnum));

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
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
