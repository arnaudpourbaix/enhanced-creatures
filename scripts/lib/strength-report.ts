import { PLAYER_CONFIG } from "../../lib/config/player-config";
import { MonsterEnum } from "../../lib/creatures/monster";
import type { Creature } from "../../lib/src/model/creature/creature";
import type { CreatureData } from "../../lib/src/model/creature/data";
import { escapeHtml } from "./stats-report-html";

// The 2e strengths creatures record (CreatureData.strength2e) next to the strength that plays,
// for the dashboard's Overview tab. See docs/superpowers/specs/2026-11-07-strength-2e-design.md.

export interface StrengthRow {
  monster: string;
  /** "base", or the adjustment's files (variants included) */
  scope: string;
  /** The resolved strength, as the CRE gets it */
  plays: string;
  /** The 2e score, or "no bonus" */
  strength2e: string;
  hit?: number;
  source: string;
}

function strengthText(strength: number | undefined, exceptional: number | undefined): string {
  if (strength === undefined) return "";
  if (strength !== 18 || !exceptional) return String(strength);
  return `18/${exceptional === 100 ? "00" : String(exceptional).padStart(2, "0")}`;
}

function row(
  monster: string,
  scope: string,
  data: Partial<CreatureData>,
  base: CreatureData,
): StrengthRow | undefined {
  const s2e = data.strength2e;
  if (!s2e) return undefined;
  const ownStrength = data.strength !== undefined || data.exceptionalStrength !== undefined;
  const played = ownStrength ? data : base;
  return {
    monster,
    scope,
    plays: strengthText(played.strength, played.exceptionalStrength),
    strength2e:
      s2e.strength === undefined ? "no bonus" : strengthText(s2e.strength, s2e.exceptionalStrength),
    hit: s2e.hit,
    source: s2e.source,
  };
}

export function buildStrengthReport(creatures: Creature[]): StrengthRow[] {
  return creatures.flatMap((creature) => {
    const monster = MonsterEnum[creature.id] ?? String(creature.id);
    return [
      row(monster, "base", creature.data, creature.data),
      ...creature.adjustments.map((a) => row(monster, a.files.join(" "), a.data, creature.data)),
    ].filter((r): r is StrengthRow => r !== undefined);
  });
}

function signed(n: number | undefined): string {
  if (!n) return "";
  return n > 0 ? `+${n}` : `${n}`;
}

export function renderStrengthCard(rows: StrengthRow[]): string {
  const body = rows
    .map(
      (r) =>
        `<tr data-monster="${escapeHtml(r.monster)}">` +
        `<td class="monster-name">${escapeHtml(r.monster)}</td>` +
        `<td>${escapeHtml(r.scope)}</td><td class="num">${escapeHtml(r.plays)}</td>` +
        `<td class="num">${escapeHtml(r.strength2e)}</td><td class="num">${signed(r.hit)}</td>` +
        `<td>${escapeHtml(r.source)}</td></tr>`,
    )
    .join("");
  return `<section class="card">
<h2>2e strength (${rows.length})</h2>
<p class="muted">Strengths taken from 2e entries, kept next to the 3e/5e ones. Playing now:
strengthEdition: <code>${escapeHtml(PLAYER_CONFIG.strengthEdition)}</code>. To-hit is the 2e
correction applied through THAC0 in 2e mode.</p>
<div class="table-wrap"><table class="counts"><thead><tr>
<th data-sort="monster">Monster</th><th>Scope</th><th class="num">Plays</th><th class="num">2e</th>
<th class="num">To-hit</th><th>Source</th>
</tr></thead><tbody>${body}</tbody></table></div>
</section>`;
}
