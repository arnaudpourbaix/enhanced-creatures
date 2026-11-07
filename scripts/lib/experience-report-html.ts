import { ExperienceStatus } from "../../lib/src/services/experience/experience.service";
import { ExperienceReportData, ExperienceReportRow } from "./experience-report";
import { escapeHtml } from "./stats-report-html";
import { PROPOSALS_STYLE, renderProposals } from "./experience-proposals";

// HTML rendering for the dashboard's Experience tab (data from scripts/lib/experience-report.ts):
// the adjustments whose XP changed, the drops to review, the base XP conflicts and every file's XP
// decision, as sortable table.counts tables (sorting is wired by the dashboard script).

const STATUSES: ExperienceStatus[] = ["formula", "drop", "asBase", "book", "zero"];

const STATUS_LABELS: Record<ExperienceStatus, string> = {
  formula: "formula",
  drop: "drop",
  asBase: "as base",
  book: "book",
  zero: "zero",
};

/** What each status means, for the tab's legend. */
const STATUS_HELP: Record<ExperienceStatus, string> = {
  formula: "an adjustment scored by the 2e DMG formula: Hit Dice plus the Table 32 abilities",
  drop: "the formula gives less than the in-game XP, so the in-game XP is kept (to review)",
  asBase: "the adjustment changes nothing the formula reads, so it takes its base creature's XP",
  book:
    "a file with no adjustment: the base creature's own XP (its Monstrous Manual value, " +
    "else its in-game XP)",
  zero: "worth no XP: a summon, an explicit xpv 0 or 0 in game",
};

function legend(): string {
  const items = STATUSES.map(
    (s) => `<dt>${STATUS_LABELS[s]}</dt><dd>${escapeHtml(STATUS_HELP[s])}</dd>`,
  ).join("");
  return `<details class="xp-legend-box" open><summary>Statuses</summary><dl class="xp-legend">${items}</dl></details>`;
}

function signed(n: number): string {
  return n > 0 ? `+${n}` : `${n}`;
}

function num(n: number | undefined): string {
  return n === undefined ? "" : String(n);
}

function th(key: string, label: string, numeric = false, sorted = false): string {
  const cls = [numeric ? "num" : "", sorted ? "sorted" : ""].filter(Boolean).join(" ");
  const attr = cls ? ` class="${cls}"` : "";
  return `<th data-sort="${key}"${attr}>${label}</th>`;
}

/** (new - old) / old in whole percents (formula vs book or in-game XP); undefined without an old value. */
export function gapPercent(book: number | undefined, formula: number): number | undefined {
  if (!book) return undefined;
  return Math.round(((formula - book) / book) * 100);
}

/** The gap's size for sorting (biggest first either way); -1 without an old value. */
function gapSortValue(book: number | undefined, formula: number): number {
  const gap = gapPercent(book, formula);
  return gap === undefined ? -1 : Math.abs(gap);
}

/** The signed gap, colored like the other differences; sorted on its size (data-gap). */
function gapCell(book: number | undefined, formula: number): string {
  const gap = gapPercent(book, formula);
  if (gap === undefined) return `<td class="num"></td>`;
  let tone = "flat";
  if (gap > 0) tone = "up";
  else if (gap < 0) tone = "down";
  return `<td class="num"><span class="delta ${tone}">${signed(gap)}%</span></td>`;
}

function fileCell(r: ExperienceReportRow): string {
  const game = r.game ? ` <span class="muted">${r.game}</span>` : "";
  return `<td class="file">${escapeHtml(r.file)}${game}</td>`;
}

/** Statuses whose reason is short; formula and drop reasons are the breakdown, in its column. */
const SHORT_REASONS: ExperienceStatus[] = ["zero", "book", "asBase"];

function allRow(r: ExperienceReportRow): string {
  const showReason = SHORT_REASONS.includes(r.status) && r.reason;
  const reason = showReason ? `<br><span class="muted">${escapeHtml(r.reason)}</span>` : "";
  // Zero files are worth nothing: no breakdown, which is only for files that give XP.
  const breakdown = r.status === "zero" ? "" : escapeHtml(r.score.breakdown);
  const rowClass = r.status === "zero" ? ` class="zero"` : "";
  const search = escapeHtml(`${r.monster} ${r.file}`.toLowerCase());
  return (
    `<tr${rowClass} data-status="${r.status}" data-search="${search}" ` +
    `data-monster="${escapeHtml(r.monster)}" data-file="${escapeHtml(r.file)}" ` +
    `data-ingame="${r.inGameXp ?? -1}" data-newxp="${r.newXp}" ` +
    `data-gap="${gapSortValue(r.inGameXp, r.newXp)}">` +
    `<td class="monster-name">${escapeHtml(r.monster)}</td>${fileCell(r)}` +
    `<td>${STATUS_LABELS[r.status]}${reason}</td>` +
    `<td class="num">${num(r.inGameXp)}</td><td class="num">${r.newXp}</td>` +
    gapCell(r.inGameXp, r.newXp) +
    `<td class="breakdown">${breakdown}</td></tr>`
  );
}

function dropRow(r: ExperienceReportRow): string {
  const search = escapeHtml(`${r.monster} ${r.file}`.toLowerCase());
  return (
    `<tr data-search="${search}" ` +
    `data-monster="${escapeHtml(r.monster)}" data-file="${escapeHtml(r.file)}" ` +
    `data-ingame="${r.inGameXp ?? -1}" data-formula="${r.score.xp}" ` +
    `data-gap="${gapSortValue(r.inGameXp, r.score.xp)}">` +
    `<td class="monster-name">${escapeHtml(r.monster)}</td>${fileCell(r)}` +
    `<td class="num">${num(r.inGameXp)}</td><td class="num">${r.score.xp}</td>` +
    gapCell(r.inGameXp, r.score.xp) +
    `<td class="breakdown">${escapeHtml(r.score.breakdown)}</td></tr>`
  );
}

const GAP_HEADER = th("gap", "Difference %", true);

/** A table of file rows with their status (the changed files, all files). */
function fileTable(id: string, rows: ExperienceReportRow[]): string {
  return `<div class="table-wrap"><table class="counts" id="${id}"><thead><tr>
${th("monster", "Monster")}${th("file", "File")}<th>Status</th>${th("ingame", "In-game XP", true)}
${th("newxp", "New XP", true)}${GAP_HEADER}<th>Breakdown</th>
</tr></thead><tbody>${rows.map(allRow).join("")}</tbody></table></div>`;
}

export function renderExperienceTab(d: ExperienceReportData): string {
  const options = [
    `<option value="">All statuses</option>`,
    ...STATUSES.map((s) => `<option value="${s}">${STATUS_LABELS[s]} (${d.counts[s]})</option>`),
  ].join("");
  const conflicts = d.conflicts
    .map(
      (c) =>
        `<tr data-search="${escapeHtml(c.monster.toLowerCase())}" data-monster="${escapeHtml(c.monster)}" ` +
        `data-book="${c.bookXp ?? -1}" data-formula="${c.score.xp}" ` +
        `data-gap="${gapSortValue(c.bookXp, c.score.xp)}">` +
        `<td class="monster-name">${escapeHtml(c.monster)}</td>` +
        `<td class="num">${num(c.bookXp)}</td><td class="num">${c.score.xp}</td>` +
        gapCell(c.bookXp, c.score.xp) +
        `<td class="breakdown">${escapeHtml(c.score.breakdown)}</td></tr>`,
    )
    .join("");
  return `<div class="page">
<p class="muted">Creature XP follows the AD&amp;D 2e DMG rule. A file whose formula XP is below its
in-game XP keeps the in-game value (a drop, to review). Adjustments' old XP was mostly arbitrary,
so All files is for reference: the changes, drops and conflicts are what to review.</p>
<div class="summary">
<button type="button" class="stat good" data-xp-view="changed"><b>${d.changed}</b><span class="muted">adjustments whose XP changed</span></button>
<button type="button" class="stat warn" data-xp-view="drops"><b>${d.drops.length}</b><span class="muted">drops to review</span></button>
<button type="button" class="stat bad" data-xp-view="conflicts"><b>${d.conflicts.length}</b><span class="muted">base XP conflicts</span></button>
<button type="button" class="stat" data-xp-view="all"><b>${d.rows.length}</b><span class="muted">files</span></button>
</div>
${legend()}
<div class="xp-nav">
<div class="xp-views" role="tablist">
<button type="button" role="tab" data-xp-view="changed">XP changed <span class="count">${d.changed}</span></button>
<button type="button" role="tab" data-xp-view="drops">XP drops to review <span class="count">${d.drops.length}</span></button>
<button type="button" role="tab" data-xp-view="conflicts">Base XP conflicts <span class="count">${d.conflicts.length}</span></button>
<button type="button" role="tab" data-xp-view="all">All files <span class="count">${d.rows.length}</span></button>
<button type="button" role="tab" data-xp-view="proposals">XP proposals <span class="count">${d.proposals.rows.length}</span></button>
</div>
<input type="search" id="xp-search" placeholder="Filter by monster or file">
<label class="xp-status-filter">Status <select id="xp-status">${options}</select></label>
</div>
<section class="card" data-xp-panel="changed">
<h2>Adjustments whose XP changed (${d.changed})</h2>
<p class="muted">Adjusted files whose new XP differs from the in-game XP: the formula score, or
their base creature's XP when the adjustment changes nothing the formula reads (as base). Files
with no adjustment take their monster's book XP, checked once per monster in Base XP conflicts.</p>
${fileTable("xp-changed", d.changedRows)}
</section>
<section class="card" data-xp-panel="drops">
<h2>XP drops to review (${d.drops.length})</h2>
<p class="muted">The formula gives less than the in-game XP, so the in-game value is kept.</p>
<div class="table-wrap"><table class="counts" id="xp-drops"><thead><tr>
${th("monster", "Monster")}${th("file", "File")}${th("ingame", "In-game XP", true)}
${th("formula", "Formula XP", true)}${GAP_HEADER}<th>Breakdown</th>
</tr></thead><tbody>${d.drops.map(dropRow).join("")}</tbody></table></div>
</section>
<section class="card" data-xp-panel="conflicts">
<h2>Base XP conflicts (${d.conflicts.length})</h2>
<p class="muted">Base creatures whose book XP disagrees with their formula score.</p>
<div class="table-wrap"><table class="counts" id="xp-conflicts"><thead><tr>
${th("monster", "Monster")}${th("book", "Book XP", true)}${th("formula", "Formula XP", true)}
${GAP_HEADER}<th>Breakdown</th>
</tr></thead><tbody>${conflicts}</tbody></table></div>
</section>
<section class="card" data-xp-panel="all">
<h2>All files (${d.rows.length})</h2>
${fileTable("xp-all", d.rows)}
</section>
${renderProposals(d.proposals)}
</div>`;
}

export const EXPERIENCE_STYLE = `
tr.zero td { color: var(--muted); }
#tab-experience .page { max-width: none; }
td.breakdown { white-space: normal; min-width: 560px; font-size: 13px; line-height: 1.5;
  color: var(--text); }
@media (max-width: 760px) { td.breakdown { min-width: 320px; } }
#tab-experience td.file { font-family: ui-monospace, Consolas, monospace; }
#tab-experience [data-xp-panel] { display: none; }
#tab-experience[data-xp-active="changed"] [data-xp-panel="changed"],
#tab-experience[data-xp-active="all"] [data-xp-panel="all"],
#tab-experience[data-xp-active="drops"] [data-xp-panel="drops"],
#tab-experience[data-xp-active="conflicts"] [data-xp-panel="conflicts"],
#tab-experience[data-xp-active="proposals"] [data-xp-panel="proposals"] { display: block; }
#tab-experience[data-xp-active="drops"] .xp-status-filter,
#tab-experience[data-xp-active="conflicts"] .xp-status-filter,
#tab-experience[data-xp-active="proposals"] .xp-status-filter { display: none; }${PROPOSALS_STYLE}
.xp-nav { position: sticky; top: var(--header-h); z-index: 5; display: flex; flex-wrap: wrap;
  align-items: center; gap: 8px 16px; margin: 16px 0; padding: 8px 0; background: var(--bg); }
.xp-views { display: flex; gap: 4px; padding: 3px; border: 1px solid var(--border);
  border-radius: 8px; background: var(--surface); }
.xp-views button { border: 0; border-radius: 6px; padding: 6px 12px; background: transparent;
  color: var(--muted); font: inherit; cursor: pointer; }
.xp-views button:hover { color: var(--text); }
.xp-views button[aria-selected="true"] { background: var(--bg); color: var(--text);
  box-shadow: 0 0 0 1px var(--border); }
.xp-views .count { margin-left: 4px; font-size: 12px; color: var(--muted); }
.xp-legend-box { margin: 12px 0 0; font-size: 13px; }
.xp-legend-box summary { cursor: pointer; color: var(--muted); }
.xp-legend { display: grid; grid-template-columns: max-content 1fr; gap: 4px 12px; margin: 8px 0 0; }
.xp-legend dt { font-weight: 600; }
.xp-legend dd { margin: 0; color: var(--muted); }
#tab-experience .summary button.stat { font: inherit; text-align: left; cursor: pointer; }
#xp-search { min-width: 220px; padding: 5px 8px; border: 1px solid var(--border);
  border-radius: 6px; background: var(--surface); color: var(--text); font: inherit; }
@media (max-width: 760px) { .xp-views { flex-wrap: wrap; } #xp-search { min-width: 0; flex: 1; } }
#tab-experience select { padding: 4px 8px; border: 1px solid var(--border); border-radius: 6px;
  background: var(--surface); color: var(--text); font: inherit; }
`;

export const EXPERIENCE_SCRIPT = `
const xpTab = document.getElementById("tab-experience");
const xpSearch = document.getElementById("xp-search");
const xpStatus = document.getElementById("xp-status");
const XP_VIEWS = ["changed", "drops", "conflicts", "all", "proposals"];
function showXpView(view) {
  if (!XP_VIEWS.includes(view)) view = "changed";
  xpTab.dataset.xpActive = view;
  for (const b of xpTab.querySelectorAll(".xp-views button")) {
    b.setAttribute("aria-selected", String(b.dataset.xpView === view));
  }
  try { localStorage.setItem("xp-view", view); } catch (e) {}
}
for (const b of xpTab.querySelectorAll("[data-xp-view]")) {
  b.addEventListener("click", () => showXpView(b.dataset.xpView));
}
let savedXpView = "changed";
try { savedXpView = localStorage.getItem("xp-view") || "changed"; } catch (e) {}
showXpView(savedXpView);
function filterExperience() {
  const q = xpSearch.value.trim().toLowerCase();
  for (const row of xpTab.querySelectorAll("table.counts tbody tr")) {
    const statusOk = row.dataset.status === undefined || !xpStatus.value || row.dataset.status === xpStatus.value;
    row.classList.toggle("hidden", !((!q || row.dataset.search.includes(q)) && statusOk));
  }
}
xpSearch.addEventListener("input", filterExperience);
xpStatus.addEventListener("change", filterExperience);
`;
