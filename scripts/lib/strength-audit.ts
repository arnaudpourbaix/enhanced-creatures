import { MonsterEnum } from "../../lib/creatures/monster";
import type { Creature } from "../../lib/src/model/creature/creature";
import creatureService from "../../lib/src/services/creature.service";
import experienceService from "../../lib/src/services/experience/experience.service";
import { diceRound } from "../../lib/src/services/experience/threat/combat-profile";
import type { AttackStrengthRow } from "./attack-strength-report";
import { escapeHtml } from "./stats-report-html";

// The damage each monster gains or loses from strength, the original game against the mod's two
// strength editions, for the dashboard's Strength tab (user, 2026-11-13: "this table is central").
// A round's damage is its dice (the mod's, the same in every column) plus the strength bonus on
// each hit that adds it: the game adds its own strength only through weapons flagged for it, the
// mod's "3e+" to every attack, its "3e+ weapons" to manufactured weapons only.

/**
 * An item's raw bytes from that game's install (override first), undefined when it isn't there or
 * that game isn't installed
 */
export type ItemSource = (file: string, game: "bg1" | "bg2") => Buffer | undefined;

export interface StrengthAuditRow {
  monster: string;
  /** natural, manufactured, mixed, or "no mod melee attack" (it fights with game weapons) */
  attacks: string;
  modStrength: string;
  modBonus: number;
  /** The most common strength of its base files in creatures.csv (BG2's, else BG1's) */
  gameStrength?: string;
  gameBonus?: number;
  /** Whether the game's own weapons add strength: yes, no, mixed; undefined without any */
  gameAdds?: "yes" | "no" | "mixed";
  /** Damage change against the game, in percent; undefined without a comparison */
  vs3e?: number;
  vsWeapons?: number;
}

const MIN_STRENGTH = 15;

/** "18/76" → 18 and 76, "18/0" → 18 */
function parseStrength(text: string): { strength: number; exceptionalStrength?: number } {
  const [score, exceptional] = text.split("/").map(Number);
  return exceptional ? { strength: score, exceptionalStrength: exceptional } : { strength: score };
}

/** "18/100" as the game writes it → "18/00" */
function formatStrength(text: string): string {
  const { strength, exceptionalStrength } = parseStrength(text);
  return strengthText(strength, exceptionalStrength);
}

function strengthText(strength: number | undefined, exceptional?: number): string {
  if (strength === undefined) return "";
  if (strength !== 18 || !exceptional) return String(strength);
  return `18/${exceptional === 100 ? "00" : String(exceptional).padStart(2, "0")}`;
}

/** The "add strength bonus" flag of an item's first melee ability, undefined without one */
export function addsStrengthFlag(itm: Buffer): boolean | undefined {
  if (itm.length < 0x72) return undefined;
  const offset = itm.readUInt32LE(0x64);
  const count = itm.readUInt16LE(0x68);
  for (let i = 0; i < count; i++) {
    const header = offset + i * 56;
    if (header + 56 > itm.length) break;
    if (itm[header] === 1) return (itm.readUInt32LE(header + 0x26) & 1) === 1;
  }
  return undefined;
}

function mostCommon(values: string[]): string | undefined {
  const counts = new Map<string, number>();
  for (const v of values) counts.set(v, (counts.get(v) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
}

const WEAPON_COLUMNS = ["weapon1", "weapon2", "weapon3", "weapon4"];

/**
 * The creature's base files: those no adjustment of its own covers (bosses and named variants
 * have one), the XP patches every scored file gets apart
 */
export function baseFiles(creature: Creature): Creature["files"] {
  const covered = new Set(
    creature.adjustments
      .filter((a) => !experienceService.isXpPatch(a))
      .flatMap((a) => a.files.map((f) => f.toUpperCase())),
  );
  return creature.files.filter((f) => !covered.has(f.name.toUpperCase()));
}

/**
 * The creatures.csv rows of the creature's base files, the game's ordinary members: BG2's, else
 * BG1's when its ordinary members only appear there (a polar bear)
 */
function gameRows(creature: Creature, csvRows: Record<string, string>[]): Record<string, string>[] {
  const files = new Set(baseFiles(creature).map((f) => f.name.toUpperCase()));
  const rows = csvRows.filter((r) => files.has(r.file.toUpperCase()));
  const bg2 = rows.filter((r) => r.game === "bg2");
  return bg2.length ? bg2 : rows.filter((r) => r.game === "bg1");
}

function gameAdds(rows: Record<string, string>[], items: ItemSource): StrengthAuditRow["gameAdds"] {
  const game = rows[0]?.game === "bg1" ? "bg1" : "bg2";
  const files = new Set(
    rows.flatMap((r) => WEAPON_COLUMNS.map((c) => (r[c] ?? "").trim().toUpperCase())),
  );
  const flags = [...files]
    .filter((f) => f && f !== "NONE")
    .map((f) => {
      const itm = items(f, game);
      return itm ? addsStrengthFlag(itm) : undefined;
    })
    .filter((flag): flag is boolean => flag !== undefined);
  if (!flags.length) return undefined;
  if (flags.every(Boolean)) return "yes";
  return flags.some(Boolean) ? "mixed" : "no";
}

function attacksOf(rows: AttackStrengthRow[]): string {
  const kinds = new Set(rows.map((r) => r.kind).filter((k) => k !== "game weapon"));
  if (!kinds.size) return "no mod melee attack";
  if (kinds.size > 1) return "mixed";
  return [...kinds][0];
}

export function buildStrengthAudit(
  creatures: Creature[],
  attackRows: AttackStrengthRow[],
  csvRows: Record<string, string>[],
  items?: ItemSource,
): StrengthAuditRow[] {
  return creatures.flatMap((creature): StrengthAuditRow[] => {
    const data = creature.data;
    if (data.strength <= MIN_STRENGTH) return [];
    const monster = MonsterEnum[creature.id];
    const attacks = attacksOf(attackRows.filter((r) => r.monster === monster));
    const modBonus = creatureService.getStrengthBonus(data).damage;
    const rows = gameRows(creature, csvRows);
    const gameStrength = mostCommon(rows.map((r) => r.str.trim()).filter(Boolean));
    const gameBonus =
      gameStrength === undefined
        ? undefined
        : creatureService.getStrengthBonus(parseStrength(gameStrength)).damage;
    const adds = items ? gameAdds(rows, items) : undefined;
    const row: StrengthAuditRow = {
      monster,
      attacks,
      modBonus,
      gameBonus,
      modStrength: strengthText(data.strength, data.exceptionalStrength),
      gameStrength: gameStrength && formatStrength(gameStrength),
      gameAdds: adds,
    };
    const withMod = attacks !== "no mod melee attack";
    if (gameBonus === undefined || adds === undefined || !withMod) return [row];
    const { damage, apr } = diceRound({ creature });
    const game = damage + apr * (adds === "no" ? 0 : gameBonus);
    if (game <= 0) return [row];
    const weapons = attacks === "manufactured" || attacks === "mixed" ? modBonus : 0;
    const vs = (bonus: number) => Math.round(((damage + apr * bonus) / game - 1) * 100);
    return [{ ...row, vs3e: vs(modBonus), vsWeapons: vs(weapons) }];
  });
}

const average = (values: number[]) =>
  values.length ? Math.round(values.reduce((a, b) => a + b, 0) / values.length) : 0;

function signed(n: number): string {
  if (n > 0) return `+${n}`;
  if (n < 0) return `−${-n}`;
  return "0";
}

function pctCell(value: number | undefined): string {
  if (value === undefined) return `<td class="num muted">—</td>`;
  let cls = "";
  if (value > 0) cls = "audit-gain";
  else if (value < 0) cls = "audit-loss";
  return `<td class="num"><span class="audit-pill ${cls}">${signed(value)}%</span></td>`;
}

function strengthCell(text: string | undefined, bonus: number | undefined): string {
  if (!text || bonus === undefined) return `<td class="num muted">—</td>`;
  return `<td class="num">${escapeHtml(text)} <span class="muted">(${bonus >= 0 ? "+" : ""}${bonus})</span></td>`;
}

const DASH = `<span class="muted">—</span>`;

export function renderStrengthAuditCard(rows: StrengthAuditRow[], gameRead: boolean): string {
  const compared = rows.filter((r) => r.vs3e !== undefined);
  const changed = rows.filter((r) => (r.vs3e ?? 0) !== 0 || (r.vsWeapons ?? 0) !== 0);
  const body = changed
    .map(
      (r) =>
        `<tr data-monster="${escapeHtml(r.monster)}" data-mod="${r.modBonus}" ` +
        `data-game="${r.gameBonus ?? -1}" data-vs3e="${r.vs3e ?? -999}" data-vsweapons="${r.vsWeapons ?? -999}">` +
        `<td class="monster-name">${escapeHtml(r.monster)}</td><td class="muted">${escapeHtml(r.attacks)}</td>` +
        strengthCell(r.gameStrength, r.gameBonus) +
        `<td>${r.gameAdds ?? DASH}</td>` +
        strengthCell(r.modStrength, r.modBonus) +
        pctCell(r.vs3e) +
        pctCell(r.vsWeapons) +
        `</tr>`,
    )
    .join("");
  const missingGame = gameRead
    ? ""
    : `<p class="muted"><b>No game install found</b> (paths.local.json <code>bg2</code>): the game side can't be read, so no comparison.</p>`;
  return `<section class="card">
<h2>Strength against the game (${rows.length} monsters with Strength above ${MIN_STRENGTH})</h2>
${missingGame}<div class="summary">
<div class="stat"><b>${signed(average(compared.map((r) => r.vs3e ?? 0)))}%</b><span class="muted">average damage, 3e+ vs game (${compared.length} compared)</span></div>
<div class="stat"><b>${signed(average(compared.map((r) => r.vsWeapons ?? 0)))}%</b><span class="muted">average damage, 3e+ weapons vs game</span></div>
</div>
<p class="muted">A round's damage when every attack hits: the mod's dice, plus the strength bonus on each
hit that adds it. Game: the game's strength (most common across its BG2 files), added only when its
own weapons are flagged for it. 3e+: the mod's strength on every attack. 3e+ weapons: on
manufactured weapons only. Listed: the monsters whose damage changes in at least one edition.</p>
<div class="table-wrap"><table class="counts"><thead><tr>
<th data-sort="monster">Monster</th><th>Mod attacks</th>
<th data-sort="game" class="num">Game Str (bonus)</th><th>Game adds Str</th>
<th data-sort="mod" class="num">Mod Str (bonus)</th>
<th data-sort="vs3e" class="num">3e+ vs game</th><th data-sort="vsweapons" class="num">3e+ weapons vs game</th>
</tr></thead><tbody>${body}</tbody></table></div>
</section>`;
}

export const STRENGTH_AUDIT_STYLE = `
.audit-pill { display: inline-block; min-width: 52px; text-align: right; padding: 0 6px; border-radius: 4px; }
.audit-pill.audit-gain { color: var(--bad); background: color-mix(in srgb, var(--bad) 14%, transparent); }
.audit-pill.audit-loss { color: var(--accent); background: color-mix(in srgb, var(--accent) 14%, transparent); }
`;
