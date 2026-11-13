import { PLAYER_CONFIG } from "../../lib/config/player-config";
import { MonsterEnum } from "../../lib/creatures/monster";
import type { Creature } from "../../lib/src/model/creature/creature";
import type { CreatureData } from "../../lib/src/model/creature/data";
import {
  ItemAbilityFlagEnum,
  ItemAbilityTypeEnum,
  ItemCategoryEnum,
} from "../../lib/src/model/spell-item/effect.enums";
import type { Item } from "../../lib/src/model/spell-item/spell-item";
import creatureService from "../../lib/src/services/creature.service";
import { equippedItem, labelOf } from "../../lib/src/services/experience/experience-detection";
import monsterFilesService from "../../lib/src/services/monster-files.service";
import { naturalAttacksAddStrength } from "../../lib/src/services/strength-edition.service";
import { escapeHtml } from "./stats-report-html";
import { baseFiles } from "./strength-audit";

// Which attacks add the strength damage bonus, by strength edition, for the dashboard's Strength
// tab: the natural (claws, bites) or manufactured (swords, clubs) choice made on each weapon
// (Item.natural), reviewed here creature by creature (user, 2026-11-13). A weapon made as a
// natural weapon kind (claws, jaws) is natural for sure; a hand-built one's choice is a judgment,
// listed apart with its evidence.

export type AttackKind = "natural" | "manufactured" | "game weapon";

export interface AttackStrengthRow {
  monster: string;
  attack: string;
  kind: AttackKind;
  /** The 3e/5e strength (blank in a 2e build: it doesn't play there) */
  strength3e: string;
  /** The 2e strength, "no bonus" without one */
  strength2e: string;
  /** The damage bonus each edition gives the attack, undefined when it adds none */
  bonus: { "3e+"?: number; "3e+ weapons"?: number; "2e"?: number };
  /**
   * How it was classified: a natural weapon kind ("claws": sure), by hand (a judgment to review),
   * or the game's own weapon
   */
  classifiedBy: "kind" | "hand" | "game";
  /** The kind it was made as, or for a hand-built weapon its item category */
  evidence: { kind?: string; category?: string; icon?: string; file: string };
}

function strengthText(strength: number | undefined, exceptional: number | undefined): string {
  if (strength === undefined) return "";
  if (strength !== 18 || !exceptional) return String(strength);
  return `18/${exceptional === 100 ? "00" : String(exceptional).padStart(2, "0")}`;
}

const damageOf = (strength: number | undefined, exceptionalStrength?: number) =>
  creatureService.getStrengthBonus({ strength, exceptionalStrength }).damage;

/**
 * A mod weapon adds strength if its header asks: under "3e+ weapons", a natural one lost the flag
 * when built (itemService), so it asked before
 */
function flagged(item: Item): boolean {
  const asks = (item.header?.abilityflags ?? []).includes(ItemAbilityFlagEnum.AddStrengthBonus);
  const stripped = !!item.natural && !naturalAttacksAddStrength(PLAYER_CONFIG.strengthEdition);
  return asks || stripped;
}

/** A melee weapon dealing damage: dice or a damage bonus (not a gaseous form's empty hands) */
function isMeleeAttack(item: Item): boolean {
  const h = item.header;
  if (item.trait || h?.type !== ItemAbilityTypeEnum.Melee) return false;
  return (h.diceThrown ?? 0) > 0 || (h.damageBonus ?? 0) > 0;
}

/**
 * The game's melee weapons in the base files' creatures.csv weapon slots the mod neither removes
 * nor fills with its own weapon (a weapon1 claw replaces the game's weapon1).
 */
function gameWeapons(creature: Creature): string[] {
  const base = new Set(baseFiles(creature).map((f) => f.name));
  const removed = new Set(creature.data.items.remove.map((f) => f.toUpperCase()));
  const filled = new Set(
    creature.data.items.equipped.flatMap((e) =>
      (Array.isArray(e.slot) ? e.slot : [e.slot]).map((s) => s.toLowerCase()),
    ),
  );
  const files = creature.files
    .filter((f) => base.has(f.name))
    .flatMap((f) => monsterFilesService.getCreatureRows(f.name, f.game))
    .flatMap((row) => row.items)
    .filter((i) => i.slot.startsWith("weapon") && !filled.has(i.slot.toLowerCase()))
    .map((i) => i.file.toUpperCase())
    .filter((f) => f && f !== "NONE" && !removed.has(f));
  return [...new Set(files)];
}

function bonuses(
  data: CreatureData,
  adds: { "3e+": boolean; "3e+ weapons": boolean; "2e": boolean },
): AttackStrengthRow["bonus"] {
  const in2eBuild = PLAYER_CONFIG.strengthEdition === "2e";
  const s2e = data.strength2e;
  return {
    "3e+":
      adds["3e+"] && !in2eBuild ? damageOf(data.strength, data.exceptionalStrength) : undefined,
    "3e+ weapons":
      adds["3e+ weapons"] && !in2eBuild
        ? damageOf(data.strength, data.exceptionalStrength)
        : undefined,
    "2e": adds["2e"] ? damageOf(s2e?.strength, s2e?.exceptionalStrength) : undefined,
  };
}

export function buildAttackStrengthReport(creatures: Creature[]): AttackStrengthRow[] {
  return creatures.flatMap((creature) => {
    const monster = MonsterEnum[creature.id] ?? String(creature.id);
    const data = creature.data;
    const in2eBuild = PLAYER_CONFIG.strengthEdition === "2e";
    const common = {
      monster,
      strength3e: in2eBuild ? "" : strengthText(data.strength, data.exceptionalStrength),
      strength2e: data.strength2e?.strength
        ? strengthText(data.strength2e.strength, data.strength2e.exceptionalStrength)
        : "no bonus",
    };
    // its own weapons, and those it equips from its kin or entry (a helmed horror's sword)
    const shared = data.items.equipped
      .map((e) => equippedItem(creature, e.file))
      .filter((item): item is Item => item !== undefined && !creature.items.includes(item));
    const own = [...creature.items, ...shared]
      .filter(isMeleeAttack)
      .map((item): AttackStrengthRow => {
        const adds = flagged(item);
        return {
          ...common,
          attack: labelOf(item.file, item.stringRef),
          kind: item.natural ? "natural" : "manufactured",
          classifiedBy: item.naturalWeaponKind ? "kind" : "hand",
          evidence: {
            file: item.file,
            kind: item.naturalWeaponKind,
            category: item.category === undefined ? undefined : ItemCategoryEnum[item.category],
            icon: item.header?.icon ?? item.icon,
          },
          bonus: bonuses(data, { "3e+": adds, "3e+ weapons": adds && !item.natural, "2e": adds }),
        };
      });
    const game = gameWeapons(creature).map((file): AttackStrengthRow => ({
      ...common,
      attack: file,
      kind: "game weapon",
      classifiedBy: "game",
      evidence: { file },
      bonus: bonuses(data, { "3e+": true, "3e+ weapons": true, "2e": true }),
    }));
    return [...own, ...game];
  });
}

const searchOf = (r: AttackStrengthRow) => [r.monster, r.attack, r.kind].join(" ").toLowerCase();

function bonusCell(bonus: number | undefined): string {
  if (bonus === undefined) return `<td class="num muted">none</td>`;
  return `<td class="num">${bonus >= 0 ? "+" : ""}${bonus}</td>`;
}

export function renderAttackStrengthCard(rows: AttackStrengthRow[]): string {
  const body = rows
    .map(
      (r) =>
        `<tr data-search="${escapeHtml(searchOf(r))}">` +
        `<td class="monster-name">${escapeHtml(r.monster)}</td>` +
        `<td>${escapeHtml(r.attack)}</td><td>${escapeHtml(r.kind)}</td>` +
        `<td class="num">${escapeHtml(r.strength3e)}</td>` +
        `<td class="num">${escapeHtml(r.strength2e)}</td>` +
        bonusCell(r.bonus["3e+"]) +
        bonusCell(r.bonus["3e+ weapons"]) +
        bonusCell(r.bonus["2e"]) +
        `</tr>`,
    )
    .join("");
  return `<section class="card">
<h2>Strength on attacks (${rows.length})</h2>
<p class="muted">Each base creature's melee attacks: natural (claws, bites, slams) or manufactured
(swords, clubs), as set on the weapon (<code>natural</code>), and the game's own weapons it keeps.
The damage bonus each strength edition gives them; "3e+ weapons" drops it from natural attacks.
Playing now: strengthEdition: <code>${escapeHtml(PLAYER_CONFIG.strengthEdition)}</code>.
A game weapon adds strength as the game made it (most melee weapons do).</p>
<div class="table-wrap"><table class="counts"><thead><tr>
<th data-sort="monster">Monster</th><th>Attack</th><th>Kind</th>
<th class="num">Str 3e+</th><th class="num">Str 2e</th>
<th class="num">3e+</th><th class="num">3e+ weapons</th><th class="num">2e</th>
</tr></thead><tbody>${body}</tbody></table></div>
</section>`;
}

/** The hand-classified weapons, once each (several creatures may share one) */
export function unsureWeapons(rows: AttackStrengthRow[]): AttackStrengthRow[][] {
  const byFile = new Map<string, AttackStrengthRow[]>();
  for (const row of rows.filter((r) => r.classifiedBy === "hand")) {
    const list = byFile.get(row.evidence.file) ?? [];
    list.push(row);
    byFile.set(row.evidence.file, list);
  }
  return [...byFile.values()];
}

function unsureRow(group: AttackStrengthRow[]): string {
  const r = group[0];
  const monsters = [...new Set(group.map((g) => g.monster))].join(", ");
  const search = [monsters, r.attack].join(" ").toLowerCase();
  return (
    `<tr data-search="${escapeHtml(search)}">` +
    `<td>${escapeHtml(r.attack)}</td><td class="monster-name">${escapeHtml(monsters)}</td>` +
    `<td><b>${escapeHtml(r.kind)}</b></td>` +
    `<td>${escapeHtml(r.evidence.category ?? "")}</td>` +
    `<td><code>${escapeHtml(r.evidence.icon ?? "")}</code></td>` +
    `<td><code>${escapeHtml(r.evidence.file)}</code></td>` +
    `</tr>`
  );
}

export function renderUnsureWeaponsCard(rows: AttackStrengthRow[]): string {
  const groups = unsureWeapons(rows);
  return `<section class="card">
<h2>Weapons to review (${groups.length})</h2>
<p class="muted">Weapons classified by hand, not made as a natural weapon kind (claws, jaws, fists...):
check each is natural (no strength under "3e+ weapons") or manufactured (keeps it). An item
category (sword, club...) and a game weapon icon point to manufactured; no category and a monster
icon to natural. Set <code>natural</code> on the weapon in its creature's file.</p>
<div class="table-wrap"><table class="counts"><thead><tr>
<th>Weapon</th><th>Monsters</th><th>Classified as</th><th>Category</th><th>Icon</th><th>File</th>
</tr></thead><tbody>${groups.map(unsureRow).join("")}</tbody></table></div>
</section>`;
}
