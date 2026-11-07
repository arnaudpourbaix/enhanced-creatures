import { MonsterEnum } from "../../lib/creatures/monster";
import type { Creature } from "../../lib/src/model/creature/creature";
import { combatProfile } from "../../lib/src/services/experience/threat/combat-profile";
import { DuelResult, threat } from "../../lib/src/services/experience/threat/duel";
import {
  ReferenceCombatant,
  referenceArcher,
  referenceFighter,
} from "../../lib/src/services/experience/threat/reference";
import { THREAT_FIT } from "../../lib/src/services/experience/threat/threat-fit";
import {
  ThreatFit,
  ThreatSample,
  threatXp,
  threatXpText,
} from "../../lib/src/services/experience/threat/threat-xp";
import { escapeHtml } from "./stats-report-html";

// The dashboard's XP proposals view: per base creature, its in-game XP, its 2e book XP, its DMG
// formula score and its threat XP side by side, whichever experienceSystem plays (a comparison
// view: the threat is computed here on the base creature). Also the samples `npm run fit-threat`
// fits the threat XP on.

export interface BaseThreat {
  threat: number;
  melee: DuelResult;
  ranged: DuelResult;
}

/** The threat of a creature, on its base scope */
export type ThreatOf = (creature: Creature) => BaseThreat;

export const baseThreat: ThreatOf = (creature) => threat(combatProfile({ creature }));

export interface ProposalRow {
  monster: string;
  /** The base creature's files with an in-game XP */
  files: number;
  inGameXp?: number;
  inGameMin?: number;
  inGameMax?: number;
  bookXp?: number;
  formulaXp: number;
  /** The duels' rounds: the monster's (R_m) and the reference's (R_f) */
  melee: { monster: number; fighter: number };
  ranged: { monster: number; fighter: number };
  threat: number;
  threatXp: number;
  /** The duels' notes, for the row's tooltip */
  notes: string;
}

export interface ProposalTotals {
  /** Monsters counted: the ones with a book and an in-game XP, so every total compares the same */
  rows: number;
  inGame: number;
  book: number;
  formula: number;
  threat: number;
}

export interface Proposals {
  rows: ProposalRow[];
  totals: ProposalTotals;
  fit: ThreatFit;
}

/** Rounded to 10 XP, as the DMG's values read */
function round(xp: number): number {
  return Math.max(0, Math.round(xp / 10) * 10);
}

/** Two decimals at most */
function decimals(value: number): number {
  return Math.round(value * 100) / 100;
}

function median(values: number[]): number | undefined {
  if (!values.length) return undefined;
  const sorted = [...values].sort((x, y) => x - y);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/** The in-game XP of the base creature's files (not adjusted, not zero) */
function inGameXps(creature: Creature): number[] {
  return creature.experience
    .filter((r) => !r.adjusted && r.status !== "zero" && r.inGameXp !== undefined)
    .map((r) => r.inGameXp ?? 0);
}

/** The base creatures with both a book XP (xpv2e) and an in-game XP: what the threat XP fits */
export function threatSamples(
  creatures: Creature[],
  threatOf: ThreatOf = baseThreat,
): ThreatSample[] {
  const samples: ThreatSample[] = [];
  for (const creature of creatures) {
    const base = creature.baseScore;
    const book = creature.data.xpv2e;
    if (!base || book === undefined || !inGameXps(creature).length) continue;
    samples.push({ hitDiceValue: base.hitDiceValue, threat: threatOf(creature).threat, book });
  }
  return samples;
}

function rounds(duel: DuelResult): { monster: number; fighter: number } {
  return { monster: decimals(duel.monsterRounds), fighter: decimals(duel.fighterRounds) };
}

function duelNotes(label: string, duel: DuelResult): string {
  const notes = duel.notes.length ? ` (${duel.notes.join(", ")})` : "";
  return `${label}: ${decimals(duel.ratio)}${notes}`;
}

function addToTotals(totals: ProposalTotals, row: ProposalRow): void {
  if (row.inGameXp === undefined || row.bookXp === undefined) return;
  totals.rows++;
  totals.inGame += row.inGameXp;
  totals.book += row.bookXp;
  totals.formula += row.formulaXp;
  totals.threat += row.threatXp;
}

export function buildProposals(
  creatures: Creature[],
  threatOf: ThreatOf = baseThreat,
  fit: ThreatFit = THREAT_FIT,
): Proposals {
  const rows: ProposalRow[] = [];
  const totals: ProposalTotals = { rows: 0, inGame: 0, book: 0, formula: 0, threat: 0 };
  for (const creature of creatures) {
    const base = creature.baseScore;
    if (!base) continue;
    const inGame = inGameXps(creature);
    const g = median(inGame);
    const t = threatOf(creature);
    const row: ProposalRow = {
      monster: MonsterEnum[creature.id] ?? String(creature.id),
      files: inGame.length,
      inGameXp: g === undefined ? undefined : round(g),
      inGameMin: inGame.length ? Math.min(...inGame) : undefined,
      inGameMax: inGame.length ? Math.max(...inGame) : undefined,
      bookXp: creature.data.xpv2e,
      formulaXp: base.xp,
      melee: rounds(t.melee),
      ranged: rounds(t.ranged),
      threat: decimals(t.threat),
      threatXp: threatXp(base.hitDiceValue, t.threat, fit),
      notes: [
        duelNotes("melee", t.melee),
        duelNotes("ranged", t.ranged),
        threatXpText(base.hitDiceValue, t.threat, fit),
      ].join("; "),
    };
    rows.push(row);
    addToTotals(totals, row);
  }
  return { rows, totals, fit };
}

function num(n: number | undefined): string {
  return n === undefined ? "" : String(n);
}

/** A proposal cell, flagged when below the in-game XP */
function cell(value: number, inGame: number | undefined, title = ""): string {
  const below = inGame !== undefined && value < inGame;
  const tip = title ? ` title="${escapeHtml(title)}"` : "";
  return `<td class="num${below ? " below" : ""}"${tip}>${value}</td>`;
}

function percent(total: number, inGame: number): string {
  if (!inGame) return "";
  const p = Math.round(((total - inGame) / inGame) * 100);
  return ` <span class="muted">(${p > 0 ? "+" : ""}${p}%)</span>`;
}

function inGameCell(r: ProposalRow): string {
  if (r.inGameXp === undefined) return `<td class="num"></td>`;
  const range =
    r.inGameMin !== r.inGameMax
      ? ` <span class="muted">${num(r.inGameMin)}-${num(r.inGameMax)}</span>`
      : "";
  return `<td class="num">${r.inGameXp}${range}</td>`;
}

function stat(value: number, label: string, inGame: number): string {
  return `<div class="stat"><b>${value}</b><span class="muted">${label}${percent(value, inGame)}</span></div>`;
}

const LEVELS = Array.from({ length: 20 }, (_, i) => i + 1);

function referenceTable(title: string, of: (level: number) => ReferenceCombatant): string {
  const rows = LEVELS.map(of)
    .map(
      (f) =>
        `<tr><td class="num">${f.level}</td><td class="num">${f.ac}</td><td class="num">${f.hp}</td>` +
        `<td class="num">${f.thac0}</td><td class="num">${f.apr}</td>` +
        `<td class="num">${f.damage}</td><td class="num">${f.saveDeath}</td>` +
        `<td class="num">${f.savePolymorph}</td><td class="num">${f.saveBreath}</td>` +
        `<td class="num">${f.saveSpell}</td><td class="num">${f.saveWand}</td>` +
        `<td class="num">${f.movement}</td></tr>`,
    )
    .join("");
  return `<details class="xp-reference"><summary>${title}</summary>
<div class="table-wrap"><table class="counts"><thead><tr>
<th class="num">Level</th><th class="num">AC</th><th class="num">HP</th><th class="num">THAC0</th>
<th class="num">APR</th><th class="num">Damage / hit</th><th class="num">Save death</th>
<th class="num">Save petrify</th><th class="num">Save breath</th><th class="num">Save spell</th>
<th class="num">Save wand</th><th class="num">Movement</th>
</tr></thead><tbody>${rows}</tbody></table></div>
</details>`;
}

const REFERENCE_TEXT = `<p class="muted">Threat measures a monster against a fighter (melee duel)
and an archer (ranged duel) of its own level (its Hit Dice value). A duel: the rounds the monster
needs to drop him (R<sub>m</sub>) against the rounds he needs to drop it (R<sub>f</sub>); their
ratio R<sub>f</sub> ÷ R<sub>m</sub> is about 1 for an even fight. T = the two ratios' geometric
mean (× 1.2 invisible at will, × 1.1 per declared ability). Threat XP = Table 31 × s × T<sup>k</sup>,
s and k fitted by <code>npm run fit-threat</code> on the base creatures with a book and an in-game
XP. HP: 10 per level + 3 Con to 9, then +3. AC: 10 at 1-2, plate (3) around 4, full plate (1)
around 6, magic items to -5 at 20; the archer's 4 better. Fighter: Strength 18/50, two d8 swords,
specialization; archer: Dexterity +2, specialization, two arrows. Enchantment +1 per 4 levels to
+3. THAC0 and saves: the 2e warrior tables.</p>`;

function rowHtml(r: ProposalRow): string {
  const search = escapeHtml(r.monster.toLowerCase());
  return (
    `<tr data-search="${search}" data-monster="${escapeHtml(r.monster)}" ` +
    `data-files="${r.files}" data-ingame="${r.inGameXp ?? -1}" data-book="${r.bookXp ?? -1}" ` +
    `data-formula="${r.formulaXp}" data-mrm="${r.melee.monster}" data-mrf="${r.melee.fighter}" ` +
    `data-rrm="${r.ranged.monster}" data-rrf="${r.ranged.fighter}" data-threat="${r.threat}" ` +
    `data-threatxp="${r.threatXp}">` +
    `<td class="monster-name">${escapeHtml(r.monster)}</td><td class="num">${r.files}</td>` +
    inGameCell(r) +
    `<td class="num">${num(r.bookXp)}</td>` +
    cell(r.formulaXp, r.inGameXp) +
    `<td class="num">${r.melee.monster}</td><td class="num">${r.melee.fighter}</td>` +
    `<td class="num">${r.ranged.monster}</td><td class="num">${r.ranged.fighter}</td>` +
    `<td class="num" title="${escapeHtml(r.notes)}">${r.threat}</td>` +
    cell(r.threatXp, r.inGameXp, r.notes) +
    `<td class="breakdown">${escapeHtml(r.notes)}</td>` +
    `</tr>`
  );
}

export function renderProposals(p: Proposals): string {
  const t = p.totals;
  const body = p.rows.map(rowHtml).join("");
  return `<section class="card" data-xp-panel="proposals">
<h2>XP proposals: base creatures (${p.rows.length})</h2>
<p class="muted">A comparison, whichever <code>experienceSystem</code> plays. In-game = the base
files' in-game XP (median, range when they differ), 2e = book XP, Formula = the DMG formula,
then the threat system: the melee and ranged duels' rounds (R<sub>m</sub> the monster's,
R<sub>f</sub> the reference's), the threat T and its XP. Values below the in-game XP are marked.
Fit: <b>s = ${p.fit.s}, k = ${p.fit.k}</b> (${p.fit.samples} samples).</p>
<div class="summary">
<div class="stat"><b>${t.inGame}</b><span class="muted">in-game total (${t.rows} monsters)</span></div>
${stat(t.book, "2e book", t.inGame)}
${stat(t.formula, "formula", t.inGame)}
${stat(t.threat, "threat", t.inGame)}
</div>
${REFERENCE_TEXT}
${referenceTable("Reference fighter (melee duel)", referenceFighter)}
${referenceTable("Reference archer (ranged duel)", referenceArcher)}
<div class="table-wrap"><table class="counts" id="xp-proposals"><thead><tr>
<th data-sort="monster" rowspan="2">Monster</th><th data-sort="files" class="num" rowspan="2">Files</th>
<th data-sort="ingame" class="num" rowspan="2">In-game</th><th data-sort="book" class="num" rowspan="2">2e</th>
<th data-sort="formula" class="num" rowspan="2">Formula</th>
<th colspan="2">Melee</th><th colspan="2">Ranged</th>
<th data-sort="threat" class="num" rowspan="2">T</th>
<th data-sort="threatxp" class="num" rowspan="2">Threat XP</th><th rowspan="2">Duels</th>
</tr><tr>
<th data-sort="mrm" class="num">R<sub>m</sub></th><th data-sort="mrf" class="num">R<sub>f</sub></th>
<th data-sort="rrm" class="num">R<sub>m</sub></th><th data-sort="rrf" class="num">R<sub>f</sub></th>
</tr></thead><tbody>${body}</tbody></table></div>
</section>`;
}

export const PROPOSALS_STYLE = `
#xp-proposals td.below { color: var(--warn, #b45309); font-weight: 600; }
#xp-proposals td.breakdown { min-width: 320px; }
.xp-reference { margin: 12px 0; }
.xp-reference summary { cursor: pointer; font-weight: 600; }
`;
