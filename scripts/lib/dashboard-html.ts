import {
  escapeHtml,
  renderStatsBody,
  STATS_SCRIPT,
  STATS_STYLE,
  StatsReportData,
} from "./stats-report-html";

// HTML rendering for scripts/dashboard.ts: one self-contained page (inline CSS + JS) with three
// tabs - Overview (creatures.csv and monster counts), Stats report (scripts/lib/stats-report-html.ts)
// and Missing monsters (creatures.csv rows per missing, file-less or unvalidated MonsterEnum
// member). The
// active tab is kept in the url hash. Follows the OS light/dark preference.

/** creatures.csv rows grouped by MonsterId status. */
export interface CsvSummary {
  total: number;
  /** MonsterId set and ValidatedMonsterId = true. */
  validated: number;
  /** MonsterId set, not validated (a guess to review). */
  unvalidated: number;
  noMonsterId: number;
}

/** creatures.csv rows carrying one MonsterId. */
export interface MonsterRowCount {
  monster: string;
  rows: number;
  validated: number;
}

export interface DashboardData {
  generatedAt: Date;
  csv: CsvSummary;
  monsters: {
    total: number;
    missing: MonsterRowCount[];
    unvalidated: MonsterRowCount[];
    /** Implemented, but no validated creatures.csv row yet. */
    noFiles: MonsterRowCount[];
    /** creatures.csv MonsterId values that aren't a MonsterEnum member (typos). */
    unknown: MonsterRowCount[];
  };
  stats: StatsReportData;
}

function pct(part: number, total: number): string {
  return total ? `${Math.round((part / total) * 100)}%` : "0%";
}

function stat(value: number | string, label: string, tone = ""): string {
  return `<div class="stat ${tone}"><b>${value}</b><span class="muted">${label}</span></div>`;
}

interface Segment {
  value: number;
  label: string;
  tone: string;
}

// One horizontal 100% bar, each segment labelled in the legend below it (never color alone).
function stackedBar(segments: Segment[]): string {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  const bar = segments
    .filter((s) => s.value > 0)
    .map(
      (s) =>
        `<span class="seg ${s.tone}" style="flex-grow:${s.value}" ` +
        `title="${s.label}: ${s.value} (${pct(s.value, total)})"></span>`,
    )
    .join("");
  const legend = segments
    .map(
      (s) =>
        `<li><span class="swatch ${s.tone}"></span>${s.label} ` +
        `<b>${s.value}</b> <span class="muted">${pct(s.value, total)}</span></li>`,
    )
    .join("");
  return `<div class="stacked">${bar}</div><ul class="legend">${legend}</ul>`;
}

function renderOverview(d: DashboardData): string {
  const { csv, monsters, stats } = d;
  const missing = monsters.missing.length;
  const unvalidated = monsters.unvalidated.length;
  const noFiles = monsters.noFiles.length;
  const ok = monsters.total - missing - unvalidated - noFiles;
  const flaggedFiles = stats.flagged.reduce((sum, r) => sum + r.flagged.length, 0);
  return `
<section class="card">
<h2>creatures.csv</h2>
<div class="summary">
${stat(csv.total, "creatures")}
${stat(csv.validated, "validated MonsterId", "good")}
${stat(csv.unvalidated, "MonsterId to review", "warn")}
${stat(csv.noMonsterId, "without MonsterId")}
</div>
${stackedBar([
  { value: csv.validated, label: "Validated", tone: "good" },
  { value: csv.unvalidated, label: "Not validated", tone: "warn" },
  { value: csv.noMonsterId, label: "No MonsterId", tone: "none" },
])}
</section>
<section class="card">
<h2>Monsters (MonsterEnum)</h2>
<div class="summary">
${stat(monsters.total, "declared")}
${stat(ok, "implemented and valid", "good")}
${stat(noFiles, "no creatures yet", "pending")}
${stat(unvalidated, "failing validation", "warn")}
${stat(missing, "missing", "bad")}
</div>
${stackedBar([
  { value: ok, label: "OK", tone: "good" },
  { value: noFiles, label: "No creatures yet", tone: "pending" },
  { value: unvalidated, label: "Failing validation", tone: "warn" },
  { value: missing, label: "Missing", tone: "bad" },
])}
<p><a href="#missing">See missing monsters →</a></p>
</section>
<section class="card">
<h2>Stats report</h2>
<div class="summary">
${stat(stats.compared, "files compared")}
${stat(flaggedFiles, "flagged files", flaggedFiles ? "warn" : "")}
${stat(stats.flagged.length, `of ${stats.monsters} monsters flagged`)}
${stat(new Set(stats.missing).size, "not compared")}
</div>
<p><a href="#stats">See stats report →</a></p>
</section>`;
}

function renderCountRow(m: MonsterRowCount, max: number): string {
  const width = max ? (m.rows / max) * 100 : 0;
  return (
    `<tr data-search="${escapeHtml(m.monster.toLowerCase())}" data-rows="${m.rows}" ` +
    `data-validated="${m.validated}" data-monster="${escapeHtml(m.monster)}">` +
    `<td class="monster-name">${escapeHtml(m.monster)}</td>` +
    `<td class="num">${m.rows}</td>` +
    `<td class="bar-cell"><span class="bar" style="width:${width}%" ` +
    `title="${m.rows} creatures"></span></td>` +
    `<td class="num">${m.validated || ""}</td></tr>`
  );
}

function countTable(id: string, rows: MonsterRowCount[]): string {
  const max = Math.max(0, ...rows.map((r) => r.rows));
  const sorted = [...rows].sort((a, b) => b.rows - a.rows || a.monster.localeCompare(b.monster));
  return (
    `<div class="table-wrap"><table class="counts" id="${id}"><thead><tr>` +
    `<th data-sort="monster">Monster</th><th data-sort="rows" class="num sorted">Creatures</th>` +
    `<th></th><th data-sort="validated" class="num">Validated</th>` +
    `</tr></thead><tbody>${sorted.map((r) => renderCountRow(r, max)).join("")}</tbody></table></div>`
  );
}

/** A card with a count table, omitted when there is nothing to list. */
function countCard(id: string, title: string, description: string, rows: MonsterRowCount[]) {
  if (!rows.length) return "";
  return `<section class="card">
<h2>${title}</h2>
<p class="muted">${description}</p>
${countTable(id, rows)}
</section>`;
}

function renderMissing(d: DashboardData): string {
  const { missing, unvalidated, noFiles, unknown } = d.monsters;
  const rows = missing.reduce((sum, m) => sum + m.rows, 0);
  const withoutRow = missing.filter((m) => !m.rows).length;
  return `
<p class="muted">Creatures are the creatures.csv rows whose <code>MonsterId</code> is the monster
(validated or not). It is not a final count - most rows of an unimplemented monster are still
unmapped - but it helps prioritize.</p>
<div class="summary">
${stat(missing.length, "missing monsters", "bad")}
${stat(rows, "creatures mapped to them")}
${stat(withoutRow, "of them without csv row")}
${stat(noFiles.length, "implemented, no creatures yet", "pending")}
${stat(unvalidated.length, "failing validation", "warn")}
</div>
<div class="toolbar">
<input type="search" id="missing-search" placeholder="Filter by monster">
<label><input type="checkbox" id="missing-hide-empty"> Hide monsters without creatures</label>
</div>
<section class="card">
<h2>Missing (${missing.length})</h2>
<p class="muted">Declared in MonsterEnum, not implemented anywhere.</p>
${countTable("missing-table", missing)}
</section>
${countCard(
  "no-files-table",
  `No creatures yet (${noFiles.length})`,
  `Implemented, but no creatures.csv row has a validated <code>MonsterId</code> for it yet, so
nothing is generated. Not a bug: validate its rows (the Creatures column counts the guesses
waiting for review).`,
  noFiles,
)}
${countCard(
  "unvalidated-table",
  `Failing validation (${unvalidated.length})`,
  "Implemented, but the creature fails validation - see dashboard.log for details.",
  unvalidated,
)}
${countCard(
  "unknown-table",
  `Unknown MonsterId (${unknown.length})`,
  `creatures.csv <code>MonsterId</code> values that aren't a MonsterEnum member - most likely
typos to fix in the csv.`,
  unknown,
)}`;
}

const STYLE = `
:root { --header-h: 56px; --good: #2f8f4e; --warn: #d4901c; --bad: #c94a3f; --none: #b9b8b0;
  --accent: #3a6fd8; }
@media (prefers-color-scheme: dark) {
  :root { --good: #4fae6b; --warn: #e0a43a; --bad: #e0675c; --none: #55554f; --accent: #7aa2f7; }
}
header { position: sticky; top: 0; z-index: 10; height: var(--header-h); display: flex;
  align-items: center; gap: 24px; padding: 0 24px; background: var(--surface);
  border-bottom: 1px solid var(--border); }
header h1 { margin: 0; font-size: 17px; white-space: nowrap; }
header .generated { margin-left: auto; font-size: 12px; white-space: nowrap; }
.tabs { display: flex; gap: 4px; height: 100%; }
.tabs a { display: flex; align-items: center; padding: 0 14px; color: var(--muted);
  text-decoration: none; font-weight: 600; border-bottom: 2px solid transparent; }
.tabs a:hover { color: var(--text); }
.tabs a.active { color: var(--text); border-bottom-color: var(--accent); }
.tabs .badge { margin-left: 6px; padding: 0 7px; border-radius: 10px; font-size: 11px;
  background: var(--bg); border: 1px solid var(--border); }
.panel { display: none; }
.panel.active { display: block; }
.page { padding: 24px 32px; max-width: 1100px; }
a { color: var(--accent); }
.card { background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
  padding: 16px 20px; margin-bottom: 16px; }
.card h2 { margin: 0 0 4px; font-size: 16px; }
.card .summary { margin: 12px 0; }
.stat.good { border-left: 4px solid var(--good); }
.stat.warn { border-left: 4px solid var(--warn); }
.stat.bad { border-left: 4px solid var(--bad); }
.stat.pending { border-left: 4px solid var(--accent); }
.stacked { display: flex; gap: 2px; height: 14px; border-radius: 4px; overflow: hidden; }
.seg { min-width: 2px; }
.good { --tone: var(--good); } .warn { --tone: var(--warn); } .bad { --tone: var(--bad); }
.none { --tone: var(--none); } .pending { --tone: var(--accent); }
.seg, .swatch { background: var(--tone); }
.legend { display: flex; gap: 20px; flex-wrap: wrap; list-style: none; padding: 0; margin: 8px 0 0;
  font-size: 13px; }
.legend li { display: flex; align-items: center; gap: 6px; }
.swatch { width: 10px; height: 10px; border-radius: 2px; display: inline-block; }
table.counts th[data-sort] { cursor: pointer; user-select: none; }
table.counts th.sorted::after { content: " ▾"; }
table.counts th.sorted.asc::after { content: " ▴"; }
th.num, td.num { text-align: right; }
td.monster-name { font-weight: 600; }
td.bar-cell { width: 40%; }
.bar { display: block; height: 10px; min-width: 0; border-radius: 0 4px 4px 0;
  background: var(--accent); opacity: .85; }
tr:hover td { background: var(--bg); }
code { font-family: ui-monospace, Consolas, monospace; font-size: 12px; }
#tab-stats nav { top: var(--header-h); height: calc(100vh - var(--header-h)); }
#tab-stats .layout { min-height: calc(100vh - var(--header-h)); }
.toolbar { top: var(--header-h); }
.monster { scroll-margin-top: calc(var(--header-h) + 64px); }
@media (max-width: 760px) {
  header { padding: 0 12px; gap: 12px; }
  header h1, header .generated { display: none; }
  .page { padding: 16px; }
  td.bar-cell { width: 25%; }
}
`;

const SCRIPT = `
const tabs = ["overview", "stats", "missing"];
function showTab() {
  const hash = location.hash.slice(1);
  let current = tabs.includes(hash) ? hash : "overview";
  if (hash.startsWith("m-")) current = "stats";
  for (const t of tabs) {
    document.getElementById("tab-" + t).classList.toggle("active", t === current);
    document.querySelector('.tabs a[href="#' + t + '"]').classList.toggle("active", t === current);
  }
}
// The stats report's own nav links are #m-<monster> anchors: keep the stats tab open for them.
window.addEventListener("hashchange", () => {
  showTab();
  if (!location.hash.startsWith("#m-")) window.scrollTo(0, 0);
});
showTab();

const missingSearch = document.getElementById("missing-search");
const hideEmpty = document.getElementById("missing-hide-empty");
function filterCounts() {
  const q = missingSearch.value.trim().toLowerCase();
  for (const row of document.querySelectorAll("table.counts tbody tr")) {
    const show = (!q || row.dataset.search.includes(q)) && !(hideEmpty.checked && row.dataset.rows === "0");
    row.classList.toggle("hidden", !show);
  }
}
missingSearch.addEventListener("input", filterCounts);
hideEmpty.addEventListener("change", filterCounts);

for (const table of document.querySelectorAll("table.counts")) {
  for (const th of table.querySelectorAll("th[data-sort]")) {
    th.addEventListener("click", () => {
      const key = th.dataset.sort;
      const asc = th.classList.contains("sorted") ? !th.classList.contains("asc") : key === "monster";
      table.querySelectorAll("th").forEach((h) => h.classList.remove("sorted", "asc"));
      th.classList.add("sorted");
      th.classList.toggle("asc", asc);
      const body = table.tBodies[0];
      const rows = [...body.rows].sort((a, b) => {
        const diff = key === "monster"
          ? a.dataset.monster.localeCompare(b.dataset.monster)
          : Number(a.dataset[key]) - Number(b.dataset[key]);
        return asc ? diff : -diff;
      });
      body.append(...rows);
    });
  }
}
`;

export function renderDashboard(d: DashboardData): string {
  const generated = d.generatedAt.toISOString().replace("T", " ").slice(0, 16);
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Enhanced Creatures dashboard</title>
<style>${STATS_STYLE}${STYLE}</style>
</head>
<body>
<header>
<h1>Enhanced Creatures</h1>
<div class="tabs">
<a href="#overview">Overview</a>
<a href="#stats">Stats report<span class="badge">${d.stats.flagged.reduce((s, r) => s + r.flagged.length, 0)}</span></a>
<a href="#missing">Missing monsters<span class="badge">${d.monsters.missing.length}</span></a>
</div>
<span class="generated muted">Generated ${generated} UTC</span>
</header>
<section class="panel" id="tab-overview"><div class="page">${renderOverview(d)}</div></section>
<section class="panel" id="tab-stats">${renderStatsBody(d.stats)}</section>
<section class="panel" id="tab-missing"><div class="page">${renderMissing(d)}</div></section>
<script>${STATS_SCRIPT}${SCRIPT}</script>
</body>
</html>
`;
}
