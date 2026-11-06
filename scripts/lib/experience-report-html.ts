import { ExperienceStatus } from "../../lib/src/services/experience/experience.service";
import { ExperienceReportData, ExperienceReportRow } from "./experience-report";
import { escapeHtml } from "./stats-report-html";

// HTML rendering for the dashboard's Experience tab (data from scripts/lib/experience-report.ts):
// every file's XP decision, the drops to review and the base XP conflicts, as sortable
// table.counts tables (sorting is wired by the dashboard script).

const STATUSES: ExperienceStatus[] = ["formula", "drop", "unchanged", "book", "zero"];

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

function diffCell(r: ExperienceReportRow): string {
  if (r.difference === undefined) return `<td class="num"></td>`;
  let tone = "flat";
  if (r.difference > 0) tone = "up";
  else if (r.difference < 0) tone = "down";
  return `<td class="num"><span class="delta ${tone}">${signed(r.difference)}</span></td>`;
}

function fileCell(r: ExperienceReportRow): string {
  const game = r.game ? ` <span class="muted">${r.game}</span>` : "";
  return `<td class="file">${escapeHtml(r.file)}${game}</td>`;
}

/** Statuses whose reason is short; formula and drop reasons are the breakdown, in its column. */
const SHORT_REASONS: ExperienceStatus[] = ["zero", "book", "unchanged"];

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
    `data-difference="${r.difference ?? 0}">` +
    `<td class="monster-name">${escapeHtml(r.monster)}</td>${fileCell(r)}` +
    `<td>${r.status}${reason}</td>` +
    `<td class="num">${num(r.inGameXp)}</td><td class="num">${r.newXp}</td>${diffCell(r)}` +
    `<td class="breakdown">${breakdown}</td></tr>`
  );
}

function dropRow(r: ExperienceReportRow): string {
  const search = escapeHtml(`${r.monster} ${r.file}`.toLowerCase());
  return (
    `<tr data-search="${search}" ` +
    `data-monster="${escapeHtml(r.monster)}" data-file="${escapeHtml(r.file)}" ` +
    `data-ingame="${r.inGameXp ?? -1}" data-formula="${r.score.xp}">` +
    `<td class="monster-name">${escapeHtml(r.monster)}</td>${fileCell(r)}` +
    `<td class="num">${num(r.inGameXp)}</td><td class="num">${r.score.xp}</td>` +
    `<td class="breakdown">${escapeHtml(r.score.breakdown)}</td></tr>`
  );
}

export function renderExperienceTab(d: ExperienceReportData): string {
  const options = [
    `<option value="">All statuses</option>`,
    ...STATUSES.map((s) => `<option value="${s}">${s} (${d.counts[s]})</option>`),
  ].join("");
  const conflicts = d.conflicts
    .map(
      (c) =>
        `<tr data-search="${escapeHtml(c.monster.toLowerCase())}" data-monster="${escapeHtml(c.monster)}" ` +
        `data-book="${c.bookXp ?? -1}" data-formula="${c.score.xp}">` +
        `<td class="monster-name">${escapeHtml(c.monster)}</td>` +
        `<td class="num">${num(c.bookXp)}</td><td class="num">${c.score.xp}</td>` +
        `<td class="breakdown">${escapeHtml(c.score.breakdown)}</td></tr>`,
    )
    .join("");
  return `<div class="page">
<p class="muted">Creature XP follows the AD&amp;D 2e DMG rule. A file whose formula XP is below its
in-game XP keeps the in-game value (a drop, to review).</p>
<div class="summary">
<div class="stat"><b>${d.rows.length}</b><span class="muted">files</span></div>
<div class="stat good"><b>${d.changed}</b><span class="muted">files whose XP changed</span></div>
<button type="button" class="stat warn" data-xp-view="drops"><b>${d.drops.length}</b><span class="muted">drops to review</span></button>
<button type="button" class="stat bad" data-xp-view="conflicts"><b>${d.conflicts.length}</b><span class="muted">base XP conflicts</span></button>
</div>
<div class="xp-nav">
<div class="xp-views" role="tablist">
<button type="button" role="tab" data-xp-view="all">All files <span class="count">${d.rows.length}</span></button>
<button type="button" role="tab" data-xp-view="drops">XP drops to review <span class="count">${d.drops.length}</span></button>
<button type="button" role="tab" data-xp-view="conflicts">Base XP conflicts <span class="count">${d.conflicts.length}</span></button>
</div>
<input type="search" id="xp-search" placeholder="Filter by monster or file">
<label class="xp-status-filter">Status <select id="xp-status">${options}</select></label>
</div>
<section class="card" data-xp-panel="all">
<h2>All files (${d.rows.length})</h2>
<div class="table-wrap"><table class="counts" id="xp-all"><thead><tr>
${th("monster", "Monster")}${th("file", "File")}<th>Status</th>${th("ingame", "In-game XP", true)}
${th("newxp", "New XP", true)}${th("difference", "Difference", true)}<th>Breakdown</th>
</tr></thead><tbody>${d.rows.map(allRow).join("")}</tbody></table></div>
</section>
<section class="card" data-xp-panel="drops">
<h2>XP drops to review (${d.drops.length})</h2>
<p class="muted">The formula gives less than the in-game XP, so the in-game value is kept.</p>
<div class="table-wrap"><table class="counts" id="xp-drops"><thead><tr>
${th("monster", "Monster")}${th("file", "File")}${th("ingame", "In-game XP", true)}
${th("formula", "Formula XP", true)}<th>Breakdown</th>
</tr></thead><tbody>${d.drops.map(dropRow).join("")}</tbody></table></div>
</section>
<section class="card" data-xp-panel="conflicts">
<h2>Base XP conflicts (${d.conflicts.length})</h2>
<p class="muted">Base creatures whose book XP disagrees with their formula score.</p>
<div class="table-wrap"><table class="counts" id="xp-conflicts"><thead><tr>
${th("monster", "Monster")}${th("book", "Book XP", true)}${th("formula", "Formula XP", true)}
<th>Breakdown</th>
</tr></thead><tbody>${conflicts}</tbody></table></div>
</section>
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
#tab-experience[data-xp-active="all"] [data-xp-panel="all"],
#tab-experience[data-xp-active="drops"] [data-xp-panel="drops"],
#tab-experience[data-xp-active="conflicts"] [data-xp-panel="conflicts"] { display: block; }
#tab-experience:not([data-xp-active="all"]) .xp-status-filter { display: none; }
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
const XP_VIEWS = ["all", "drops", "conflicts"];
function showXpView(view) {
  if (!XP_VIEWS.includes(view)) view = "all";
  xpTab.dataset.xpActive = view;
  for (const b of xpTab.querySelectorAll(".xp-views button")) {
    b.setAttribute("aria-selected", String(b.dataset.xpView === view));
  }
  try { localStorage.setItem("xp-view", view); } catch (e) {}
}
for (const b of xpTab.querySelectorAll("[data-xp-view]")) {
  b.addEventListener("click", () => showXpView(b.dataset.xpView));
}
let savedXpView = "all";
try { savedXpView = localStorage.getItem("xp-view") || "all"; } catch (e) {}
showXpView(savedXpView);
function filterExperience() {
  const q = xpSearch.value.trim().toLowerCase();
  for (const row of xpTab.querySelectorAll("table.counts tbody tr")) {
    const statusOk = row.closest("#xp-all") ? !xpStatus.value || row.dataset.status === xpStatus.value : true;
    row.classList.toggle("hidden", !((!q || row.dataset.search.includes(q)) && statusOk));
  }
}
xpSearch.addEventListener("input", filterExperience);
xpStatus.addEventListener("change", filterExperience);
`;
