import type { Game } from "../../lib/src/model/creature/game";

// HTML rendering for scripts/report-stats.ts: one self-contained page (inline CSS + JS, no
// external assets) with a monster sidebar, collapsible per-monster tables, an APR/THAC0/Level filter
// and a text filter. Follows the OS light/dark preference.

export interface StatsCsvRow {
  file: string;
  game?: Game;
  name: string;
  level?: number;
  hp?: number;
  thac0?: number;
  apr?: number;
}

export interface StatsComparison {
  file: string;
  game?: Game;
  name: string;
  csv: StatsCsvRow;
  doc: { level: number; hp: number; thac0: number; apr: number };
  levelFlag: boolean;
  thac0Flag: boolean;
  aprFlag: boolean;
}

export interface MonsterReport {
  monster: string;
  /** Every compared file of the monster, reported or not - the base for the header averages. */
  all: StatsComparison[];
  flagged: StatsComparison[];
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

interface CellOptions {
  /** CSS class for a flagged cell: `flag` (highlighted background) or `flag-text` (bold only). */
  flag?: "flag" | "flag-text";
  /** thac0: a lower value is the stronger creature, so a negative difference is the good one. */
  lowerIsBetter?: boolean;
}

// The difference is green when the doc makes the creature stronger, red when weaker.
function cell(csv: number | undefined, doc: number, options: CellOptions = {}): string {
  const cls = options.flag ? ` class="${options.flag}"` : "";
  if (csv === undefined) return `<td${cls}><span class="csv">?</span> → ${doc}</td>`;
  if (csv === doc) return `<td></td>`;
  const delta = doc - csv;
  const better = options.lowerIsBetter ? delta < 0 : delta > 0;
  return (
    `<td${cls}><span class="csv">${csv}</span> → <span class="doc">${doc}</span>` +
    ` <span class="delta ${better ? "up" : "down"}">${signed(delta)}</span></td>`
  );
}

function anchor(monster: string): string {
  return `m-${monster}`;
}

type StatKey = "level" | "hp" | "thac0" | "apr";

const AVERAGED_STATS: { key: StatKey; label: string; lowerIsBetter?: boolean }[] = [
  { key: "level", label: "Level" },
  { key: "hp", label: "HP" },
  { key: "thac0", label: "THAC0", lowerIsBetter: true },
  { key: "apr", label: "APR" },
];

// Mean csv -> doc difference over *every* compared file of the monster (reported or not, unchanged
// files counting as 0), so a change on 6 of 30 files weighs less than the same change on 6 of 6.
// Rounded to the nearest integer (halves away from zero), followed by how many files actually
// change the stat. Same green/red convention as the table cells, muted when it rounds to 0;
// omitted when no compared file changes the stat.
function averageDiffs(report: MonsterReport): string {
  return AVERAGED_STATS.map(({ key, label, lowerIsBetter }) => {
    const diffs = report.all.map((c) => {
      const csv = c.csv[key];
      return csv === undefined ? 0 : c.doc[key] - csv;
    });
    const changed = diffs.filter((d) => d !== 0).length;
    if (!changed) return "";
    const exact = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    const mean = Math.sign(exact) * Math.round(Math.abs(exact));
    const better = lowerIsBetter ? mean < 0 : mean > 0;
    let tone = better ? "up" : "down";
    if (mean === 0) tone = "flat";
    return (
      `<span class="avg">${label} <span class="delta ${tone}">` +
      `${mean === 0 ? "0" : signed(mean)}</span> ` +
      `<span class="count">(${changed}/${diffs.length})</span></span>`
    );
  }).join("");
}

function renderRow(c: StatsComparison): string {
  const search = escapeHtml(`${c.file} ${c.name}`.toLowerCase());
  return (
    `<tr data-level="${c.levelFlag ? 1 : 0}" data-apr="${c.aprFlag ? 1 : 0}" ` +
    `data-thac0="${c.thac0Flag ? 1 : 0}" data-search="${search}">` +
    `<td class="file">${escapeHtml(c.file)}</td>` +
    `<td>${c.game ?? ""}</td>` +
    `<td class="name">${escapeHtml(c.name)}</td>` +
    cell(c.csv.level, c.doc.level, { flag: c.levelFlag ? "flag-text" : undefined }) +
    cell(c.csv.hp, c.doc.hp) +
    cell(c.csv.thac0, c.doc.thac0, {
      flag: c.thac0Flag ? "flag" : undefined,
      lowerIsBetter: true,
    }) +
    cell(c.csv.apr, c.doc.apr, { flag: c.aprFlag ? "flag-text" : undefined }) +
    `</tr>`
  );
}

function renderMonster(report: MonsterReport): string {
  return (
    `<details class="monster" id="${anchor(report.monster)}" open>` +
    `<summary><h2>${report.monster}</h2><span class="avgs" title="Average difference over ` +
    `all ${report.all.length} compared files (unchanged ones count as 0), then changed/total">${averageDiffs(report)}</span></summary>` +
    `<div class="table-wrap"><table><thead><tr><th>File</th><th>Game</th><th>Name</th>` +
    `<th>Level</th><th>HP</th><th>THAC0</th><th>APR</th></tr></thead>` +
    `<tbody>${report.flagged.map(renderRow).join("")}</tbody></table></div></details>`
  );
}

const STYLE = `
:root {
  --bg: #f7f7f5; --surface: #ffffff; --text: #1d1d1b; --muted: #6b6b66; --border: #e2e1dc;
  --flag-bg: #fff4e0; --up: #1a7f37; --down: #c62828;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg: #161615; --surface: #1f1f1d; --text: #ecebe6; --muted: #9a998f; --border: #33332f;
    --flag-bg: #3a2e18; --up: #4ac26b; --down: #ff7b72;
  }
}
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--text);
  font: 14px/1.5 system-ui, -apple-system, "Segoe UI", sans-serif; }
.layout { display: grid; grid-template-columns: 240px 1fr; min-height: 100vh; }
nav { position: sticky; top: 0; height: 100vh; overflow-y: auto; padding: 16px 12px;
  border-right: 1px solid var(--border); background: var(--surface); }
nav a { display: flex; justify-content: space-between; gap: 8px; padding: 3px 8px;
  border-radius: 6px; color: var(--text); text-decoration: none; }
nav a:hover { background: var(--bg); }
main { padding: 24px 32px; max-width: 1200px; min-width: 0; }
h1 { margin: 0 0 8px; font-size: 22px; }
.muted { color: var(--muted); }
.summary { display: flex; gap: 12px; flex-wrap: wrap; margin: 16px 0; }
.stat { background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
  padding: 10px 16px; min-width: 130px; }
.stat b { display: block; font-size: 22px; }
.rules { margin: 0 0 8px; padding-left: 20px; }
.toolbar { position: sticky; top: 0; z-index: 2; display: flex; gap: 16px; align-items: center;
  flex-wrap: wrap; padding: 10px 0; background: var(--bg); border-bottom: 1px solid var(--border);
  margin-bottom: 16px; }
.toolbar input[type=search], .toolbar button { padding: 5px 10px; border: 1px solid var(--border);
  border-radius: 6px; background: var(--surface); color: var(--text); font: inherit; }
.toolbar input[type=search] { min-width: 240px; }
.toolbar button { cursor: pointer; }
.monster { background: var(--surface); border: 1px solid var(--border); border-radius: 10px;
  margin-bottom: 12px; scroll-margin-top: 64px; }
.monster summary { display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
  padding: 10px 16px; cursor: pointer; }
.monster h2 { margin: 0; font-size: 16px; }
.avgs { display: flex; gap: 16px; align-items: baseline; flex-wrap: wrap; margin-left: auto;
  font-size: 12px; color: var(--muted); }
.avgs .delta { font-size: 13px; }
.avgs .count { font-size: 11px; }
.table-wrap { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
th, td { padding: 6px 12px; text-align: left; border-top: 1px solid var(--border); white-space: nowrap; }
th { font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: .04em; color: var(--muted); }
td.file { font-family: ui-monospace, Consolas, monospace; }
td.name { white-space: normal; }
td.flag { background: var(--flag-bg); font-weight: 600; }
td.flag-text { font-weight: 600; }
.csv { color: var(--muted); }
.delta { font-size: 12px; font-weight: 600; }
.delta.up { color: var(--up); }
.delta.down { color: var(--down); }
.delta.flat { color: var(--muted); }
.hidden { display: none !important; }
.missing { font-family: ui-monospace, Consolas, monospace; line-height: 1.9; }
@media (max-width: 760px) {
  .layout { grid-template-columns: 1fr; }
  nav { position: static; height: auto; max-height: 200px; border-right: 0;
    border-bottom: 1px solid var(--border); }
  main { padding: 16px; }
}
`;

const SCRIPT = `
const search = document.getElementById("search");
const showApr = document.getElementById("show-apr");
const showThac0 = document.getElementById("show-thac0");
const showLevel = document.getElementById("show-level");
function applyFilters() {
  const q = search.value.trim().toLowerCase();
  for (const monster of document.querySelectorAll(".monster")) {
    const monsterMatch = monster.id.toLowerCase().includes(q);
    let visible = 0;
    for (const row of monster.querySelectorAll("tbody tr")) {
      const byStat = (showApr.checked && row.dataset.apr === "1") ||
        (showThac0.checked && row.dataset.thac0 === "1") ||
        (showLevel.checked && row.dataset.level === "1");
      const show = byStat && (!q || monsterMatch || row.dataset.search.includes(q));
      row.classList.toggle("hidden", !show);
      if (show) visible++;
    }
    monster.classList.toggle("hidden", visible === 0);
    const link = document.querySelector('nav a[href="#' + monster.id + '"]');
    if (link) link.classList.toggle("hidden", visible === 0);
  }
}
search.addEventListener("input", applyFilters);
showApr.addEventListener("change", applyFilters);
showThac0.addEventListener("change", applyFilters);
showLevel.addEventListener("change", applyFilters);
document.getElementById("expand").addEventListener("click", () =>
  document.querySelectorAll(".monster").forEach((d) => { d.open = true; }));
document.getElementById("collapse").addEventListener("click", () =>
  document.querySelectorAll(".monster").forEach((d) => { d.open = false; }));
`;

export function renderStatsReport(p: {
  flagged: MonsterReport[];
  compared: number;
  monsters: number;
  missing: string[];
  thac0Tolerance: number;
}): string {
  const all = p.flagged.flatMap((r) => r.flagged);
  const apr = all.filter((c) => c.aprFlag).length;
  const thac0 = all.filter((c) => c.thac0Flag).length;
  const level = all.filter((c) => c.levelFlag).length;
  const nav = p.flagged.map((r) => `<a href="#${anchor(r.monster)}">${r.monster}</a>`).join("");
  const missing = [...new Set(p.missing)].sort((a, b) => a.localeCompare(b));
  const stat = (value: number, label: string) =>
    `<div class="stat"><b>${value}</b><span class="muted">${label}</span></div>`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Stats report</title>
<style>${STYLE}</style>
</head>
<body>
<div class="layout">
<nav>${nav}</nav>
<main>
<h1>THAC0 / APR: creatures.csv vs documentation</h1>
<p class="muted">Each row is one creature file (per game when the doc shows a game-specific
card), shown as <span class="csv">csv</span> → doc and the difference: <span class="delta up">green</span>
when the doc makes the creature stronger, <span class="delta down">red</span> when weaker (for
THAC0, lower is stronger). Bold cells are relevant differences (THAC0 also highlighted):</p>
<ul class="rules">
<li><b>THAC0</b>: more than ${p.thac0Tolerance}</li>
<li><b>APR</b>: any difference (csv decoded through AttackPerRoundTable; doc includes the
fighter level/proficiency bonus and the off-hand attack)</li>
</ul>
<p class="muted">Only those two put a file in the report. A level difference is bold too and
can be filtered on, but never puts a file in the report on its own. HP is shown for context and
never flagged. A blank cell means the stat is unchanged.</p>
<div class="summary">
${stat(all.length, "flagged files")}
${stat(p.flagged.length, `of ${p.monsters} monsters`)}
${stat(apr, "APR differences")}
${stat(thac0, "THAC0 differences")}
${stat(level, "Level differences")}
${stat(p.compared, "files compared")}
</div>
<div class="toolbar">
<input type="search" id="search" placeholder="Filter by monster, file or name">
<label><input type="checkbox" id="show-apr" checked> APR</label>
<label><input type="checkbox" id="show-thac0" checked> THAC0</label>
<label><input type="checkbox" id="show-level" checked> Level</label>
<button id="expand" type="button">Expand all</button>
<button id="collapse" type="button">Collapse all</button>
</div>
${p.flagged.map(renderMonster).join("\n")}
<h2>Not compared (${missing.length})</h2>
<p class="muted">Documented files with no creatures.csv row, or a row without hp/thac0/apr
values.</p>
<p class="missing">${missing.length ? missing.map(escapeHtml).join(", ") : "None."}</p>
</main>
</div>
<script>${SCRIPT}</script>
</body>
</html>
`;
}
