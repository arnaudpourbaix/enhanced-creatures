import { AT_WILL } from "../../../config/common";
import * as fs from "fs";
import { ENTRY_NAMES, EntryEnum } from "../../../creatures/entry";
import { TranslationKey } from "../../../translations/i18n";
import { TYPE_TRAITS } from "../../../config/creature-types";
import { SPELLBOOK_MODS } from "../../../config/mods";
import { getAllFnpSpells } from "../../../config/spells/fnp-spell-database";
import { SPELLS } from "../../../config/spells/spell-database";
import { getAllSpells } from "../../model/spell-item/spell-reference";
import { CreatureAbility } from "../../model/creature/ability";
import { CR } from "../../model/constants";
import { Creature } from "../../model/creature/creature";
import { MemorizedSpell } from "../../model/creature/data";
import { Variant } from "../../model/creature/variant";
import { GeneratedGroup } from "../../model/creature/creature-group";
import { EquippedItem } from "../../model/creature/item";
import { ImmunityConfig, ImmunityName } from "../../model/final/immunity";
import { StringReference } from "../../model/final/stringref";
import { ProficiencyTypeEnum, SpellTypeEnum } from "../../model/spell-item/effect.enums";
import { Item } from "../../model/spell-item/spell-item";
import { State } from "../../state";
import creatureService from "../creature.service";
import creatureTypeService from "../creature-type.service";
import hitPointService from "../hit-point.service";
import itemService from "../item.service";
import logService from "../log.service";
import monsterFilesService from "../monster-files.service";
import translationService from "../translation.service";
import spellComboService from "../spell-combo.service";
import utils from "../utils/utils.service";
import { toCode } from "../utils/misc.func";
import adjustmentService, { EffectiveAdjustment } from "./adjustment.service";
import { CardOmissions, CardPart, CardParts, WeaponPart } from "./card-parts";
import { readModVersion, stampVersion } from "./doc-version";
import { getCommonKeys } from "./entry-common";

// Standard AD&D 2e proficiency names, since the enum's own SCREAMING_CASE keys (e.g.
// PROFICIENCYFLAILMORNINGSTAR) aren't separable into words the way formatEnumLabel's
// underscore-splitting handles alignment/size.
const PROFICIENCY_LABELS: Record<ProficiencyTypeEnum, string> = {
  [ProficiencyTypeEnum.PROFICIENCYBASTARDSWORD]: "Bastard Sword",
  [ProficiencyTypeEnum.PROFICIENCYLONGSWORD]: "Long Sword",
  [ProficiencyTypeEnum.PROFICIENCYSHORTSWORD]: "Short Sword",
  [ProficiencyTypeEnum.PROFICIENCYAXE]: "Axe",
  [ProficiencyTypeEnum.PROFICIENCYTWOHANDEDSWORD]: "Two-Handed Sword",
  [ProficiencyTypeEnum.PROFICIENCYKATANA]: "Katana",
  [ProficiencyTypeEnum.PROFICIENCYSCIMITARWAKISASHININJATO]: "Scimitar/Wakizashi/Ninjato",
  [ProficiencyTypeEnum.PROFICIENCYDAGGER]: "Dagger",
  [ProficiencyTypeEnum.PROFICIENCYWARHAMMER]: "War Hammer",
  [ProficiencyTypeEnum.PROFICIENCYSPEAR]: "Spear",
  [ProficiencyTypeEnum.PROFICIENCYHALBERD]: "Halberd",
  [ProficiencyTypeEnum.PROFICIENCYFLAILMORNINGSTAR]: "Flail/Morning Star",
  [ProficiencyTypeEnum.PROFICIENCYMACE]: "Mace",
  [ProficiencyTypeEnum.PROFICIENCYQUARTERSTAFF]: "Quarterstaff",
  [ProficiencyTypeEnum.PROFICIENCYCROSSBOW]: "Crossbow",
  [ProficiencyTypeEnum.PROFICIENCYLONGBOW]: "Long Bow",
  [ProficiencyTypeEnum.PROFICIENCYSHORTBOW]: "Short Bow",
  [ProficiencyTypeEnum.PROFICIENCYDART]: "Dart",
  [ProficiencyTypeEnum.PROFICIENCYSLING]: "Sling",
  [ProficiencyTypeEnum.PROFICIENCYBLACKJACK]: "Blackjack",
  [ProficiencyTypeEnum.PROFICIENCY2HANDED]: "Two-Handed Weapon Style",
  [ProficiencyTypeEnum.PROFICIENCYSWORDANDSHIELD]: "Sword and Shield Style",
  [ProficiencyTypeEnum.PROFICIENCYSINGLEWEAPON]: "Single Weapon Style",
  [ProficiencyTypeEnum.PROFICIENCY2WEAPON]: "Two-Weapon Style",
  [ProficiencyTypeEnum.PROFICIENCYCLUB]: "Club",
};

// The engine's proficiency slots cap out at 5 stars in practice across this mod (see e.g. the
// ogre chieftain's PROFICIENCYTWOHANDEDSWORD rank 5 in lib/creatures/ogres.ts), so that's the
// star scale used here rather than trying to represent an unbounded value. Some fighting-style
// proficiencies have a lower engine-enforced cap, so their star scale is shorter too.
const MAX_PROFICIENCY_STARS = 5;
const MAX_PROFICIENCY_STARS_OVERRIDES: Partial<Record<ProficiencyTypeEnum, number>> = {
  [ProficiencyTypeEnum.PROFICIENCY2WEAPON]: 3,
  [ProficiencyTypeEnum.PROFICIENCYSWORDANDSHIELD]: 2,
  [ProficiencyTypeEnum.PROFICIENCYSINGLEWEAPON]: 2,
};

// A flat abilities list stops being readable past this many entries - a caster built from
// spellService.createSpellbook() (see lib/config/spellbooks/spellbook.ts) alone can memorize
// several spells per level across 7+ levels. Past the threshold, getCreatureSpells groups entries
// into one tab per spell level instead (see getAbilityLevelTabs).
const ABILITY_TAB_THRESHOLD = 9;

// BG2's own resref convention: a vanilla spell's filename is SPWI/SPPR followed by a 3-digit code
// whose first digit is the spell's level (e.g. SPWI305 = Wizard level 3, SPPR113 = Priest level
// 1). getSpellLevel only falls back to this when the resource has no entry in State.spells or in
// a spell-reference config (a mod-introduced spell like Faiths & Powers' D5P1301 doesn't follow
// the convention, but does carry a real `level` in its own config entry, e.g. fnp-spell-database.ts)
// - in that genuinely unknown case, getAbilityLevelTabs groups it under a catch-all "Innate" tab.
const SPELL_LEVEL_PATTERN = /^(?:SPWI|SPPR)(\d)/;

// Stat labels shared by the creature card, the panel's base card and the adjustment cards.
const ARMOR_CLASS_LABEL = "Armor Class";
const APR_LABEL = "Attacks per Round";

// THAC0 as stored on the CRE, followed by the melee THAC0 once the engine adds the strength
// to-hit bonus (see creatureService.getMeleeThac0) - only when that bonus changes anything, with
// a tooltip on the label explaining the second value.
function thac0Stat(
  thac0: number | undefined,
  melee: number | undefined,
): { dt: string; dd: string | undefined } {
  if (thac0 === undefined || melee === undefined || melee === thac0) {
    return { dt: "THAC0", dd: thac0?.toString() };
  }
  return {
    dt: '<abbr title="Effective value: melee THAC0 including the Strength to-hit bonus">THAC0</abbr>',
    dd: `${thac0} (${melee} effective)`,
  };
}

// A stat or ability-score value as authored; unset renders empty.
type StatValue = string | number | undefined;

// One `.cre` resref -> the creature card it belongs to. Serialized into the page as a JSON blob:
// docs/monsters.js's search keeps a card when the query is exactly one of its files.
export interface FileIndexEntry {
  file: string;
  anchor: string;
}

class DocumentationService {
  private collected: Creature[] = [];
  private sidebar: string[] = [];
  private typeFilter = "";
  private monsters: string[] = [];
  private fileIndex: FileIndexEntry[] = [];

  generate() {
    this.renderEntries();
    let content: string;
    try {
      content = fs.readFileSync("lib/templates/index.html").toString();
    } catch (e) {
      throw new Error(`Failed to read template lib/templates/index.html`, {
        cause: e,
      });
    }
    const template = { text: content };
    this.replace(template, "monsters", this.monsters.join(""));
    this.replace(template, "entries", this.sidebar.join(""));
    this.replace(template, "typeFilter", this.typeFilter);
    this.replace(template, "traitEntries", this.getTraitEntries());
    // Raw (split/join, not String.replace) so `$` sequences in a resolved creature name can't be
    // read as replacement-pattern references and corrupt the JSON.
    this.replaceRaw(template, "fileSearchIndex", JSON.stringify(this.fileIndex));
    template.text = stampVersion(template.text, readModVersion());
    try {
      utils.writeFile("docs/monsters.html", template.text);
    } catch (e) {
      throw new Error(`Failed to write documentation to docs/monsters.html`, {
        cause: e,
      });
    }
  }

  /** The creatures of an entry (a kin has none). */
  addGroup(group: GeneratedGroup) {
    for (const creature of group.creatures) {
      // A creature whose builder threw after create() (see CreatureGroup.addCreature()) is left
      // in group.creatures with valid=false and never reached Creature.validate(), so fields
      // like creature.attack are still unset - skip it here rather than crash the whole
      // documentation pass on one bad creature.
      if (!creature.valid) continue;
      this.collected.push(creature);
      this.indexCreatureFiles(creature);
    }
  }

  // Groups the collected creatures into monster entries (a creature without entry is its own),
  // sorted A-Z by name with members in declaration order, and renders the creature column, the
  // sidebar menu and the type filter bar. An entry left with one valid member renders as a plain
  // card named after that creature.
  private getEntryName(entry: EntryEnum): TranslationKey {
    const name = ENTRY_NAMES[entry];
    if (!name) throw new Error(`Entry ${EntryEnum[entry]} has several members but no ENTRY_NAMES`);
    return name;
  }

  renderEntries() {
    this.monsters = [];
    this.sidebar = [];
    const groups = new Map<string, Creature[]>();
    for (const creature of this.collected) {
      const key = creature.entry !== undefined ? `e${creature.entry}` : `m${creature.id}`;
      groups.set(key, [...(groups.get(key) ?? []), creature]);
    }
    const entries = [...groups.values()].map((members) => ({
      members,
      name:
        members.length > 1 && members[0].entry !== undefined
          ? translationService.from(this.getEntryName(members[0].entry))
          : translationService.from(members[0].name),
    }));
    entries.sort((a, b) => a.name.localeCompare(b.name, "en"));
    const typeCounts = new Map<ImmunityName, number>();
    for (const { members, name } of entries) {
      const types = members.map((m) => creatureTypeService.getCreatureTypes(m));
      for (const t of types.flat()) typeCounts.set(t, (typeCounts.get(t) ?? 0) + 1);
      if (members.length === 1) this.renderSingleEntry(members[0], types[0]);
      else this.renderMultiEntry(name, members, types);
      this.sidebar.push(this.getEntryMenu(name, members, types));
    }
    this.typeFilter = this.getTypeFilter(typeCounts);
  }

  private getTypeTags(types: ImmunityName[]): string {
    if (!types.length) return "";
    const tags = types
      .map(
        (t) =>
          `<a href="#" class="type-tag" data-type="${t}">${creatureTypeService.getTypeName(t)}</a>`,
      )
      .join("");
    return `<div class="type-tags">${tags}</div>`;
  }

  private renderSingleEntry(creature: Creature, types: ImmunityName[]) {
    logService.withSection(
      creature,
      `Documenting ${translationService.from(creature.name)}...`,
      () => {
        this.addCreature(creature, new Set(), this.getTypeTags(types));
      },
    );
  }

  private renderMultiEntry(name: string, members: Creature[], types: ImmunityName[][]) {
    const parts = members.map((m) => this.getCardParts(m));
    const common = getCommonKeys(parts);
    const allTypes = TYPE_TRAITS.filter((t) => types.some((ts) => ts.includes(t)));
    // Only entry members group together, so members[0].entry is always set here.
    const entryId = `e${members[0].entry ?? ""}`;
    this.monsters.push(
      `<section class="entry-block" id="${entryId}" data-types="${allTypes.join(" ")}">` +
        `<div class="entry-header"><h2>${name}</h2>${this.getTypeTags(allTypes)}` +
        `<span class="entry-count">${members.length} members</span></div>` +
        this.getSharedBox(members[0], parts[0], common, entryId),
    );
    for (const member of members) {
      logService.withSection(
        member,
        `Documenting ${translationService.from(member.name)}...`,
        () => {
          this.addCreature(member, common);
        },
      );
    }
    this.monsters.push(`</section>`);
  }

  // The "Common to all" box shows the first member's rendering of each common part. Its popover
  // ids are the first member's, which is safe: that member's card omits the same parts. A weapon
  // whose description (not its enchantment) is common shows that description here, and each card
  // keeps only its enchantment line (see renderWeapons).
  private getSharedBox(
    first: Creature,
    parts: CardParts,
    common: ReadonlySet<string>,
    entryId: string,
  ): string {
    if (!common.size) return "";
    const only = <T extends CardPart>(list: T[]) => list.filter((p) => common.has(p.key));
    const shared: CardParts = {
      stats: only(parts.stats),
      scores: only(parts.scores),
      traitLinks: only(parts.traitLinks),
      traitLines: only(parts.traitLines),
      abilities: only(parts.abilities),
      weapons: parts.weapons
        .filter((w) => common.has(w.descKey))
        .map((w) => (common.has(w.key) ? w : { ...w, html: w.descHtml })),
    };
    const none = new Set<string>();
    const stats = this.renderStats(shared, none);
    const weapons = this.renderWeapons(shared, none);
    return (
      `<div class="entry-shared"><div class="entry-shared-label">Common to all</div>` +
      (stats ? `<dl class="stat-grid">${stats}</dl>` : "") +
      (weapons ? `<div class="detail-section"><h4>Attacks</h4>${weapons}</div>` : "") +
      this.renderTraits(shared, none) +
      this.renderAbilities(first, shared, none, `${entryId}-shared`) +
      `</div>`
    );
  }

  // One link per entry: a group's leads to its block, whose shared part comes before its members.
  private getEntryMenu(name: string, members: Creature[], types: ImmunityName[][]): string {
    const link = (href: string, text: string, ts: ImmunityName[]) =>
      `<li data-types="${ts.join(" ")}"><a href="#${href}">${text}</a></li>`;
    if (members.length === 1) {
      return link(`m${members[0].id}`, translationService.from(members[0].name), types[0]);
    }
    const allTypes = TYPE_TRAITS.filter((t) => types.some((ts) => ts.includes(t)));
    return link(`e${members[0].entry ?? ""}`, name, allTypes);
  }

  private getTypeFilter(counts: Map<ImmunityName, number>): string {
    const chips = TYPE_TRAITS.filter((t) => counts.has(t))
      .map((t) => ({ t, name: creatureTypeService.getTypeName(t) }))
      .sort((a, b) => a.name.localeCompare(b.name, "en"))
      .map(
        ({ t, name }) =>
          `<button type="button" class="type-chip" data-type="${t}">${name} <span>${counts.get(t) ?? 0}</span></button>`,
      )
      .join("");
    // The creature search sits in the same sticky bar (docs/monsters.js's initFilters).
    const search =
      `<input type="search" class="creature-search" autocomplete="off" spellcheck="false" ` +
      `placeholder="Search a creature or .cre file…" aria-label="Search a creature by name or .cre file" />`;
    return (
      `<div class="type-filter-bar">${search}<span class="type-filter-label">Filter by type</span>` +
      `<div class="type-chips"><button type="button" class="type-chip on" data-type="">All</button>${chips}</div></div>`
    );
  }

  // Records every `.cre` resref this creature owns (base, adjustments, variants, new files) into
  // the searchable file index, once each (see FileIndexEntry).
  indexCreatureFiles(creature: Creature) {
    const files = new Set<string>();
    const add = (file: string) => {
      if (file) files.add(file.toUpperCase());
    };
    // creature.files / adjustments / variants / newFiles are all definite class fields, but doc
    // test fixtures built via `as unknown as Creature` casts leave them genuinely undefined -
    // same defensive pattern the rest of this service uses.
    /* eslint-disable @typescript-eslint/no-unnecessary-condition */
    for (const f of creature.files ?? []) add(f.name);
    for (const adjustment of creature.adjustments ?? []) adjustment.files.forEach(add);
    const walkVariants = (variants: Variant[]) => {
      for (const variant of variants) {
        variant.files.forEach(add);
        walkVariants(variant.children);
      }
    };
    walkVariants(creature.variants ?? []);
    for (const newFile of creature.newFiles ?? []) newFile.files.forEach(add);
    /* eslint-enable @typescript-eslint/no-unnecessary-condition */

    const anchor = `m${creature.id}`;
    for (const file of files) this.fileIndex.push({ file, anchor });
  }

  // The generated hp deliberately excludes the constitution bonus for PC-classed creatures (the
  // IE engine re-applies it itself, and including it too would double it in-game) - documentation
  // is meant to show the HP a player actually sees, so add that bonus back here for display only.
  private getDisplayHp(creature: Creature): number | undefined {
    const d = creature.data;
    if (d.hp === undefined) return undefined;
    return (
      d.hp +
      hitPointService.getDisplayHitPointBonus({
        class: d.class,
        constitution: d.constitution,
        level: d.level1.pnpValue,
      })
    );
  }

  addCreature(creature: Creature, omit: CardOmissions = new Set(), typeTags = "") {
    logService.log(`Generating documentation for ${translationService.from(creature.name)}`);
    let content: string;
    try {
      content = fs.readFileSync("lib/templates/monster.html").toString();
    } catch (e) {
      throw new Error(`Failed to read template lib/templates/monster.html`, {
        cause: e,
      });
    }
    const template = { text: content };
    const parts = this.getCardParts(creature);
    this.replace(template, "id", `m${creature.id}`);
    this.replace(template, "types", creatureTypeService.getCreatureTypes(creature).join(" "));
    this.getCreatureHeader(template, creature, typeTags);
    this.replace(template, "stats", this.renderStats(parts, omit));
    this.getCreatureAttacks(template, creature, omit, parts);
    this.getCreatureTraits(template, creature, omit, parts);
    this.getCreatureSpells(template, creature, omit, parts);
    this.getCreatureSpellbooks(template, creature);
    this.monsters.push(template.text);
  }

  // Everything a card shows, as keyed parts (see card-parts.ts): a caller can omit any of them
  // by key, e.g. when a monster entry's "Common to all" box already shows it.
  getCardParts(creature: Creature): CardParts {
    return {
      stats: this.getStatParts(creature),
      scores: this.getScoreParts(creature),
      weapons: this.getWeaponParts(creature),
      ...this.getTraitParts(creature),
      abilities: this.getAbilityParts(creature),
    };
  }

  private getScoreParts(creature: Creature): CardPart[] {
    const d = creature.data;
    const str = d.exceptionalStrength ? `${d.strength}/${d.exceptionalStrength}` : `${d.strength}`;
    const scores: [string, StatValue][] = [
      ["STR", str],
      ["DEX", d.dexterity],
      ["CON", d.constitution],
      ["INT", d.intelligence],
      ["WIS", d.wisdom],
      ["CHA", d.charisma],
    ];
    // An unset score renders empty, as the old per-token template replace did.
    return scores.map(([k, v]) => ({ key: `score:${k}=${v ?? ""}`, html: `${k} ${v ?? ""}` }));
  }

  private getStatParts(creature: Creature): CardPart[] {
    // An unset value renders empty, as the old per-token template replace did.
    const stat = (label: string, value: StatValue, cls = "stat", dt = label) => ({
      key: `stat:${label}=${value ?? ""}`,
      html: `<div class="${cls}"><dt>${dt}</dt><dd>${value ?? ""}</dd></div>`,
    });
    const d = creature.data;
    const thac0 = thac0Stat(d.thac0, creatureService.getMeleeThac0(d));
    const parts = [
      stat("Hit Dice", `${d.level1.pnpValue} (${this.getDisplayHp(creature) ?? 0} hp)`),
      stat(ARMOR_CLASS_LABEL, creatureService.getFinalArmorClass(creature)),
      stat("THAC0", thac0.dd, "stat", thac0.dt),
      stat(APR_LABEL, this.getEffectiveApr(creature)),
      stat("Movement", d.movement.pnpValue),
      stat("Morale", d.morale),
      stat("Alignment", this.formatEnumLabel(d.alignment)),
      stat("Size", d.size.value),
    ];
    // XP Value is omitted entirely when it's 0 (or unset) - a detected summon is folded in with
    // xpv 0 and showing "XP Value 0" carries no documentation value.
    if (d.xpv) parts.push(stat("XP Value", d.xpv));
    if (d.kit) parts.push(stat("Kit", this.formatEnumLabel(d.kit)));
    const special = this.getSpecialText(creature);
    if (special) parts.push(stat("Special", special, "stat stat-half"));
    return parts;
  }

  renderStats(parts: Pick<CardParts, "stats" | "scores">, omit: CardOmissions): string {
    const scores = parts.scores.filter((p) => !omit.has(p.key)).map((p) => p.html);
    const scoreStat = scores.length
      ? `<div class="stat stat-wide"><dt>Ability Scores</dt><dd>${scores.join(", ")}</dd></div>`
      : "";
    return (
      scoreStat +
      parts.stats
        .filter((p) => !omit.has(p.key))
        .map((p) => p.html)
        .join("")
    );
  }

  // creature.data.apr is the raw CRE-file stat, not the attacks the player actually sees: when a
  // weapon is equipped in the off-hand (SHIELD) slot, checkDualWielding() (creature.service.ts)
  // pre-subtracts 1 from it, because the engine automatically grants +1 attack for that off-hand
  // weapon on top of whatever's stored. Docs must add that 1 back, or a bear authored with `apr:
  // 3` (see lib/creatures/bears.ts) shows up here as 2.
  getEffectiveApr(creature: Creature): number {
    const stored = creature.data.apr * (creature.data.doubleApr ? 2 : 1);
    const fighterBonus = creatureService.getFighterAttackBonus({
      class: creature.data.class,
      level: creature.data.level1.pnpValue,
      proficiencyType: itemService.getMainHandWeaponProficiency(creature.data.items.equipped),
      proficiencies: creature.data.proficiencies,
    });
    return stored + (creature.attack.dualWielding ? 1 : 0) + fighterBonus;
  }

  private getSpecialText(creature: Creature): string {
    if (creature.data.level1.type === "caster") {
      return `Cast spells as a level ${creature.data.level1.value} caster`;
    } else if (creature.data.level1.type === "turn") {
      return `Turned as a level ${creature.data.level1.value} undead`;
    }
    return "";
  }

  private getWeaponParts(creature: Creature): WeaponPart[] {
    const parts: WeaponPart[] = [];
    let weaponIndex = 0;
    // When dual wielding, the SHIELD slot is always the off-hand weapon (see
    // creature.service.ts's hasOffhandWeapon) and gets exactly 1 attack; every other equipped
    // weapon is the main hand and gets the rest of getEffectiveApr(). Without this, a creature
    // with 3+ total attacks plus an off-hand weapon only showed one combined APR number and a
    // list of weapon blocks in equipped-item order, leaving readers to guess which block was the
    // main hand and how many of the attacks it actually got.
    const dualWielding = creature.attack.dualWielding;
    const mainHandAttacks = this.getEffectiveApr(creature) - (dualWielding ? 1 : 0);
    for (const equippedItem of creature.data.items.equipped) {
      const weapon = itemService.isEquippedWeapon(equippedItem)
        ? State.items.find((i) => i.file === equippedItem.file)
        : undefined;
      if (!weapon?.doc) continue;
      const description = translationService.fromOptional(weapon.description);
      const idPrefix = `m${creature.id}-w${weaponIndex}`;
      const label = dualWielding ? this.getWeaponSlotLabel(equippedItem, mainHandAttacks) : "";
      const proficiency = this.getWeaponProficiencyLabel(
        weapon.proficiency,
        creature.data.proficiencies,
      );
      const render = (desc: string): string => {
        const entries: { id: string; html: string }[] = [];
        const text = this.getAttackDisplayText(desc, entries, idPrefix);
        const popovers = entries
          .map((e) => `<div class="spell-popover-entry" id="${e.id}" hidden>${e.html}</div>`)
          .join("");
        return `<div class="weapon">${label}${text}${proficiency}</div>${popovers}`;
      };
      const html = render(description);
      const descHtml = render(description.replace(/^Enchantment: \d+\r?\n?/m, ""));
      const enchantment = /^Enchantment: (\d+)\r?$/m.exec(description)?.[1];
      // The id prefix is per creature: drop it so the same weapon compares equal across creatures.
      const unprefixed = (s: string) => s.split(idPrefix).join("");
      parts.push({
        html,
        descHtml,
        key: `weapon:${weaponIndex}:${unprefixed(html)}`,
        descKey: `weaponDesc:${weaponIndex}:${unprefixed(descHtml)}`,
        enchantHtml: `<div class="weapon">${label}${
          enchantment ? `Enchantment +${enchantment}` : "No enchantment"
        }</div>`,
      });
      weaponIndex++;
    }
    return parts;
  }

  renderWeapons(parts: Pick<CardParts, "weapons">, omit: CardOmissions): string {
    return parts.weapons
      .filter((w) => !omit.has(w.key))
      .map((w) => (omit.has(w.descKey) ? w.enchantHtml : w.html))
      .join("<hr/>");
  }

  // Renders the whole Attacks section (heading included). With no weapon known to the doc
  // pipeline it falls back to "By weapon"/"None"; when every weapon part is omitted, the section
  // is dropped entirely.
  getCreatureAttacks(
    template: { text: string },
    creature: Creature,
    omit: CardOmissions = new Set(),
    parts: Pick<CardParts, "weapons"> = { weapons: this.getWeaponParts(creature) },
  ) {
    let attacks: string;
    if (parts.weapons.length) {
      attacks = this.renderWeapons(parts, omit);
    } else if (creature.data.apr > 0) {
      // No equipped item is known to the doc pipeline (e.g. the half-ogre's own weapon comes
      // straight from its base CRE file rather than an addWeapon() call - see lib/creatures/
      // ogres.ts), so there's no per-weapon block to attach a proficiency line to. The creature's
      // proficiencies are still real information, so list them here instead of dropping them.
      attacks = `<div class="weapon">By weapon${this.getProficienciesFallback(creature.data.proficiencies)}</div>`;
    } else {
      attacks = `<div class="weapon">None</div>`;
    }
    this.replace(
      template,
      "attacks",
      attacks ? `<div class="detail-section"><h4>Attacks</h4>${attacks}</div>` : "",
    );
  }

  // The off-hand always gets exactly 1 attack (checkDualWielding in creature.service.ts grants
  // no more than that), so restating "1 attack" would be redundant - only the main hand's count
  // is variable and worth spelling out.
  private getWeaponSlotLabel(equippedItem: EquippedItem, mainHandAttacks: number): string {
    if (itemService.isSlotIncluded([equippedItem], "SHIELD")) {
      return `<div class="weapon-slot">Offhand</div>`;
    }
    const s = mainHandAttacks === 1 ? "" : "s";
    return `<div class="weapon-slot">Main hand · ${mainHandAttacks} attack${s}</div>`;
  }

  // Weapons with no proficiency requirement (fists, innate attacks) render nothing. Otherwise
  // looks up the creature's rank in that type (0 - i.e. non-proficient - when there's no matching
  // entry) and renders it as a filled/empty star scale rather than a bare number, per the design's
  // preference for a visual rank at a glance.
  private getWeaponProficiencyLabel(
    proficiency: ProficiencyTypeEnum | undefined,
    proficiencies: { type: ProficiencyTypeEnum; value: number }[],
  ): string {
    if (proficiency === undefined) return "";
    const value = proficiencies.find((p) => p.type === proficiency)?.value ?? 0;
    const label = PROFICIENCY_LABELS[proficiency];
    return value > 0
      ? `<div class="weapon-proficiency">${label} ${this.getProficiencyStars(proficiency, value)}</div>`
      : "";
  }

  // Adjustment-card counterpart of getWeaponProficiencyLabel: renders nothing at all unless this
  // adjustment actually changed the weapon's proficiency rank from the base creature's own - an
  // unchanged rank is already shown on the base card, so repeating it here would be redundant.
  private getAdjustmentWeaponProficiencyLabel(
    proficiency: ProficiencyTypeEnum | undefined,
    proficiencies: { type: ProficiencyTypeEnum; value: number; changed: boolean }[],
  ): string {
    if (proficiency === undefined) return "";
    const entry = proficiencies.find((p) => p.type === proficiency && p.changed);
    if (!entry) return "";
    const label = PROFICIENCY_LABELS[proficiency];
    return `<div class="weapon-proficiency adjustment-changed">${label} ${this.getProficiencyStars(proficiency, entry.value)}</div>`;
  }

  private getProficiencyStars(type: ProficiencyTypeEnum, value: number): string {
    const max = MAX_PROFICIENCY_STARS_OVERRIDES[type] ?? MAX_PROFICIENCY_STARS;
    const filled = Math.max(0, Math.min(max, value));
    return (
      `<span class="proficiency-stars" title="${value} of ${max}">` +
      "★".repeat(filled) +
      "☆".repeat(max - filled) +
      "</span>"
    );
  }

  // Used only for the base creature's "By weapon" fallback (no equipped item known to the doc
  // pipeline - see getCreatureAttacks), where there's no specific weapon to key a single
  // proficiency line off of. Lists every proficiency the creature has instead.
  private getProficienciesFallback(
    proficiencies: { type: ProficiencyTypeEnum; value: number }[],
  ): string {
    return proficiencies
      .map(
        ({ type, value }) =>
          `<div class="weapon-proficiency">${PROFICIENCY_LABELS[type]} ${this.getProficiencyStars(type, value)}</div>`,
      )
      .join("");
  }

  // Adjustment cards' own "By weapon" fallback (see getAdjustmentAttacks): only ever considers
  // proficiencies this adjustment actually changed from the base (an unchanged rank is already on
  // the base card - see getAdjustmentWeaponProficiencyLabel for the same rule on a known weapon),
  // but lists every one of them - e.g. the minotaur's Garock/Rock (lib/creatures/minotaurs.ts) boost
  // both Axe and Two-Weapon Style, and both need to be visible since there's no per-weapon block to
  // attach either one to.
  private getChangedProficienciesFallback(
    proficiencies: { type: ProficiencyTypeEnum; value: number; changed: boolean }[],
  ): string {
    return proficiencies
      .filter((p) => p.changed)
      .map(
        (p) =>
          `<div class="weapon-proficiency adjustment-changed">${PROFICIENCY_LABELS[p.type]} ${this.getProficiencyStars(p.type, p.value)}</div>`,
      )
      .join("");
  }

  // Docs-only trim of the in-game weapon description (which also feeds the .tra item text, see
  // description.service.ts): drops the leading weapon-name line, blank separator lines,
  // THAC0/Speed Factor/Range, and the damage type, and folds the enchantment into the damage line
  // - the name is redundant with the attack's own heading in the monster page, the blank lines
  // (e.g. before "Cast spell ...") were only needed to visually separate sections of the longer
  // in-game text, and the numbers/damage type are covered elsewhere. The in-game description
  // itself is left untouched.
  //
  // `entries` is populated with one hidden {id, html} pair per "Cast spell" block collapsed to a
  // popover link (see collapseSpellBlocks) - the caller renders them into the page so the shared
  // trait-popover mechanism (docs/monsters.js) can look them up by id on hover/click.
  getAttackDisplayText(
    description: string,
    entries: { id: string; html: string }[],
    idPrefix: string,
  ): string {
    if (!description) return description;
    // Most of item.description is joined with CR ("\r\n"), but some hand-authored ability
    // descriptions (e.g. spell.grab.description in translations/en/spell.ts) are template
    // literals using a bare "\n" instead - split on either so those still break into one
    // array entry per physical line like everything else here expects.
    let lines = description.split(/\r\n|\n/);
    if (lines.length > 1 && (lines[1] === "" || lines[1] === "STATISTICS:")) {
      // Two shapes both start with a throwaway line 0: the auto-generated format's own
      // name+blank-line header (see description.service.ts's generateWeaponDescription), and a
      // few weapons' (the minotaur's Huge Axe, the ogre's Naginata) hand-authored,
      // BG2-item-tooltip-style description, whose line 0 is name/flavor text followed by a
      // "STATISTICS:" label. Neither line 0 nor "STATISTICS:" itself add anything here - the
      // weapon's own name/flavor isn't shown on this page at all, and the stat lines under
      // "STATISTICS:" (further filtered below) are covered by the numbers shown elsewhere.
      lines = lines.slice(2);
    }
    const enchantmentIndex = lines.findIndex((l) => /^Enchantment: \d+$/.test(l));
    const enchantment =
      enchantmentIndex >= 0 ? /\d+/.exec(lines[enchantmentIndex])?.[0] : undefined;
    let filtered = lines.filter(
      (l, i) =>
        i !== enchantmentIndex &&
        l !== "" &&
        !/^(THAC0|Speed Factor|Range|Damage type|Weight|Proficiency Type): /.test(l),
    );
    // Matches the base weapon's own line ("Melee damage: 8 (Piercing)", dice optional - a flat
    // value like "8" is valid too) OR a typed Damage effect's line ("Acid damage: 1D10+2", from
    // description.service.ts's getDamage - used e.g. by slimes' pseudopods, whose base header dice
    // are 0-0 and deal damage purely through the effect). The typed-line alternative requires
    // dice notation so it doesn't also match unrelated hand-authored text carried over from a
    // collapsed spell block (e.g. "Poison damage: 5 over 10 seconds.", which has no dice
    // notation). The search is further limited to lines before the first "Cast spell ...:" line -
    // generateWeaponDescription always emits the weapon's own damage lines before any Cast Spell
    // effect, so a same-shaped "X damage: NDN" line appearing only inside a cast-spell's own
    // description (like the fixture above) is never mistaken for it.
    const firstCastSpellIndex = filtered.findIndex((l) => l.startsWith("Cast spell "));
    const damageSearchEnd = firstCastSpellIndex === -1 ? filtered.length : firstCastSpellIndex;
    const damageIndex = filtered
      .slice(0, damageSearchEnd)
      .findIndex(
        (l) => /^((Melee|Ranged) )?[Dd]amage: /.test(l) || /^\w+ [Dd]amage: \d+D\d+/.test(l),
      );
    if (damageIndex >= 0) {
      let line = filtered[damageIndex]
        .replace(/^((Melee|Ranged) )?(\w+ )?[Dd]amage: /, "")
        .replace(/ \([^)]*\)$/, "");
      if (enchantment) line += ` at +${enchantment}`;
      filtered[damageIndex] = line;
    } else if (enchantment) {
      filtered.push(`Enchantment: +${enchantment}`);
    }
    filtered = this.collapseSpellBlocks(filtered, entries, idPrefix);
    return filtered.join(CR);
  }

  // Replaces each "Cast spell Name (condition):" line plus the description line(s) that follow it
  // (everything up to the next "Cast spell " line or the end) with just the name as a popover
  // link, keeping the probability/save condition inline. The description text moves into a
  // hidden entry (appended to `entries`) that the shared trait-popover (docs/monsters.js) reveals
  // on hover/click - reused as-is since it already works off any `a.trait-link` + id-matched
  // element, nothing spell-specific needed there. A "Cast spell Name (condition)" line with no
  // trailing colon has no inline description to show (the spell is documented elsewhere via its
  // own Abilities entry) and is left as plain text.
  private collapseSpellBlocks(
    lines: string[],
    entries: { id: string; html: string }[],
    idPrefix: string,
  ): string[] {
    const result: string[] = [];
    let spellIndex = 0;
    let i = 0;
    while (i < lines.length) {
      const match = /^Cast spell (.+?)( \([^)]*\))?:$/.exec(lines[i]);
      if (!match) {
        result.push(lines[i]);
        i++;
        continue;
      }
      const [, name, condition] = match;
      const descLines: string[] = [];
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith("Cast spell ")) {
        descLines.push(lines[j]);
        j++;
      }
      const id = `${idPrefix}-spell-${spellIndex}`;
      spellIndex++;
      entries.push({ id, html: this.buildDescriptionHtml(descLines) });
      // Group 2 (the optional " (...)" condition suffix) is genuinely absent from `match` at
      // runtime when it doesn't match - cast past RegExpExecArray's plain `string` element
      // typing so the `?? ""` fallback stays real, not dead code.
      const conditionText = (condition as string | undefined) ?? "";
      result.push(`<a href="#${id}" class="trait-link">${name}</a>${conditionText}`);
      i = j;
    }
    return result;
  }

  // Renders a plain-text description's lines as paragraphs, so line breaks (e.g. between a
  // lead-in sentence and the list that follows it) survive instead of being flattened into one
  // run-on paragraph by HTML whitespace collapsing. Consecutive "- " prefixed lines become a
  // single <ul>, since that prefix is how effect lists (e.g. Grab's "- can not move" /
  // "- -4 THAC0") are written in the plain-text in-game description - the "- " marks the bullet,
  // any further hyphen (as in "-4 THAC0") is just part of the item's own text and is left
  // untouched. Used for spell/trait/immunity descriptions alike.
  private buildDescriptionHtml(descLines: string[]): string {
    const html: string[] = [];
    let bullets: string[] = [];
    const flushBullets = () => {
      if (bullets.length) {
        const items = bullets.map((b) => `<li>${b}</li>`).join("");
        html.push(`<ul>${items}</ul>`);
        bullets = [];
      }
    };
    for (const line of descLines) {
      const bulletMatch = /^- (.+)$/.exec(line);
      if (bulletMatch) {
        bullets.push(bulletMatch[1]);
      } else {
        flushBullets();
        if (line) html.push(`<p>${line}</p>`);
      }
    }
    flushBullets();
    return html.join("");
  }

  getCreatureTraits(
    template: { text: string },
    creature: Creature,
    omit: CardOmissions = new Set(),
    parts: Pick<CardParts, "traitLinks" | "traitLines"> = this.getTraitParts(creature),
  ) {
    this.replace(template, "traits", this.renderTraits(parts, omit));
  }

  private getTraitParts(creature: Creature): Pick<CardParts, "traitLinks" | "traitLines"> {
    const immunities = creature.data.immunities
      // Creature.autoImmunities defaults to [] via the class field initializer, but test
      // fixtures and other partial-object call sites construct Creature via `as unknown as
      // Creature` casts that skip it, so it's genuinely undefined at some real call sites
      // despite the type - keep the optional chain.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      .filter((name) => !creature.autoImmunities?.includes(name))
      .map((name) => State.immunities.find((i) => i.name === name))
      .filter((i): i is ImmunityConfig => i !== undefined);
    const traitLinks = immunities
      .filter((i) => i.type === "trait")
      .map((immunity) => ({
        key: `trait:${immunity.name}`,
        html: `<a href="#${immunity.name}" class="trait-link">${translationService.fromOptional(
          immunity.stringRef,
        )}</a>`,
      }));
    const lines: string[] = [];
    for (const equippedItem of creature.data.items.equipped) {
      const item = State.items.find((i) => i.file === equippedItem.file);
      if (item?.trait) lines.push(...this.getTraitItemLines(item));
    }
    for (const immunity of immunities.filter((i) => i.type !== "trait")) {
      const text = translationService.fromOptional(immunity.stringRef);
      lines.push(
        immunity.description
          ? `<h5><a href="#${immunity.name}" class="trait-link">${text}</a></h5>`
          : `<p>${text}</p>`,
      );
    }
    lines.push(this.getHideInShadowsTrait(creature.data.hideShadow));
    return {
      traitLinks,
      traitLines: lines.filter((html) => html).map((html) => ({ key: `traitLine:${html}`, html })),
    };
  }

  renderTraits(parts: Pick<CardParts, "traitLinks" | "traitLines">, omit: CardOmissions): string {
    const links = parts.traitLinks.filter((p) => !omit.has(p.key)).map((p) => p.html);
    let result = links.length ? `<h5>${links.join(", ")}</h5>` : "";
    result += parts.traitLines
      .filter((p) => !omit.has(p.key))
      .map((p) => p.html)
      .join("");
    return result
      ? `<div class="detail-section"><h4>Traits</h4><div class="traits">${result}</div></div>`
      : "";
  }

  // Hide in Shadows isn't backed by an ImmunityConfig (it's a raw thief-skill value on
  // CreatureData, see statement-builder.service.ts's thievesAbilities), so it can't flow through
  // the immunity-driven trait loop above like everything else in this section - it's rendered
  // directly from the value instead. Kit is shown separately (the "Kit" stat of getStatParts and
  // getAdjustmentStatGrid), not repeated here.
  private getHideInShadowsTrait(hideShadow: number | undefined): string {
    if (hideShadow === undefined) return "";
    return `<h5>Hide in Shadows (${hideShadow}%)</h5>`;
  }

  // typeTags sit in the title, right of the name (in the summary too when the card has adjustments).
  getCreatureHeader(template: { text: string }, creature: Creature, typeTags = "") {
    const name = translationService.from(creature.name);
    const effectives = adjustmentService.getEffectiveAdjustments(creature);
    const code = `<span class="creature-code">#${toCode(creature.id)}</span>`;
    let header = `<h3>${name}${code}${typeTags}</h3>`;
    if (effectives.length) {
      // Keep each effective's index in the full sorted list so popover ids (m<id>-adj<index>-...)
      // stay stable regardless of how the cards are grouped for display.
      const indexed = effectives.map((effective, index) => ({ effective, index }));
      const direct = indexed.filter((e) => !e.effective.variant);
      // `variants` is a definite class field ([] by default), but doc test fixtures build the
      // creature as a bare `as unknown as Creature` literal and skip it - guard like the rest of
      // this service does for such fixtures.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const variants = creature.variants ?? [];
      const baseId = `adj-m${creature.id}`;
      const count = effectives.length;
      const label = count === 1 ? "adjustment" : "adjustments";

      const directCards = direct
        .map((e) => this.getAdjustmentCard(creature, e.effective, e.index))
        .join("");
      const variantCards = variants
        .map((v, i) => this.getVariantCard(creature, v, indexed, `${baseId}-v${i}`))
        .join("");

      // With no variants there's nothing to navigate - skip the tree, and drop the "Direct"
      // section wrapper so the cards sit straight under .adj-content. The nav tree comes first in
      // .adj-side (above the tall base card) so it's the first thing visible.
      let content: string;
      let tree = "";
      if (variants.length) {
        tree = this.getAdjTree(variants, baseId, direct.length > 0);
        const directSection = directCards
          ? `<section class="adj-section" id="${baseId}-direct">` +
            `<h4 class="adjustment-section-title">Direct adjustments</h4>` +
            `<div class="adjustment-cards">${directCards}</div></section>`
          : "";
        content = directSection + variantCards;
      } else {
        content = `<div class="adjustment-cards">${directCards}</div>`;
      }
      const side = `<div class="adj-side">${tree}${this.getBaseCard(creature)}</div>`;

      // The whole block is a <details>: no-JS falls back to native inline expansion;
      // monsters.js's initAdjustmentsPanel() intercepts the summary click and slides this
      // <details> into the side panel instead (moving the node, not cloning - keeps popover ids
      // unique).
      header =
        `<details class="creature-adjustments" id="${baseId}" data-title="${name}">` +
        `<summary><span>${name}${code}${typeTags}</span><span class="adjustments-badge">${count} ${label}</span></summary>` +
        `<div class="adj-layout">${side}<div class="adj-content">${content}</div></div>` +
        `</details>`;
    }
    this.replace(template, "header", header);
  }

  // The full base creature, shown as a read-only reference in the panel's side column: stat grid
  // plus the Attacks / Traits / Abilities / Spellbooks sections, so the adjustment cards on the
  // right only need to show what each one *changes*. The section builders emit popover-entry and
  // ability-level-tab ids keyed on `m<id>-...`, which would collide with the main creature card's -
  // rewrite them (and the matching in-card `href="#..."`/`data-tab="..."`) to a `base-` prefix so
  // the panel copy is self-contained.
  private getBaseCard(creature: Creature): string {
    // Each section builder emits its own detail-section wrapper.
    const sub = { text: `{{attacks}}{{traits}}{{abilities}}{{spellbooks}}` };
    this.getCreatureAttacks(sub, creature);
    this.getCreatureTraits(sub, creature);
    this.getCreatureSpells(sub, creature);
    this.getCreatureSpellbooks(sub, creature);
    const sections = sub.text.replace(
      new RegExp(`((?:id|href|data-tab)="#?)(m${creature.id}-[\\w-]+)"`, "g"),
      `$1base-$2"`,
    );
    return (
      `<div class="adj-base-card"><h4>${translationService.from(creature.name)}</h4>` +
      `<dl class="stat-grid">${this.getBaseStatGrid(creature)}</dl>` +
      sections +
      `</div>`
    );
  }

  private getBaseStatGrid(creature: Creature): string {
    const d = creature.data;
    const str =
      d.strength === 18 && d.exceptionalStrength ? `18/${d.exceptionalStrength}` : `${d.strength}`;
    const thac0 = thac0Stat(d.thac0, creatureService.getMeleeThac0(d));
    const cell = (dt: string, dd: string | number): string =>
      `<div class="stat"><dt>${dt}</dt><dd>${dd}</dd></div>`;
    return (
      `<div class="stat stat-wide"><dt>Ability Scores</dt><dd>` +
      `STR ${str}, DEX ${d.dexterity}, CON ${d.constitution}, INT ${d.intelligence}, ` +
      `WIS ${d.wisdom ?? "?"}, CHA ${d.charisma ?? "?"}</dd></div>` +
      cell("Hit Dice", `${d.level1.pnpValue} (${this.getDisplayHp(creature) ?? "?"} hp)`) +
      cell(ARMOR_CLASS_LABEL, creatureService.getFinalArmorClass(creature)) +
      cell(thac0.dt, thac0.dd ?? "?") +
      cell(APR_LABEL, this.getEffectiveApr(creature)) +
      cell("Movement", d.movement.pnpValue) +
      cell("Morale", d.morale ?? "?") +
      cell("Alignment", this.formatEnumLabel(d.alignment)) +
      cell("Size", d.size.value) +
      (d.xpv ? cell("XP Value", d.xpv) : "") +
      (d.kit ? cell("Kit", this.formatEnumLabel(d.kit)) : "")
    );
  }

  private getAdjTree(variants: Variant[], baseId: string, hasDirect: boolean): string {
    const items: string[] = [];
    if (hasDirect) items.push(`<a href="#${baseId}-direct">Direct adjustments</a>`);
    const walk = (nodes: Variant[], prefix: string, depth: number): void => {
      nodes.forEach((v, i) => {
        const id = `${prefix}${i}`;
        items.push(`<a href="#${id}" class="adj-tree-d${Math.min(depth, 3)}">${v.label}</a>`);
        if (v.children.length) walk(v.children, `${id}-`, depth + 1);
      });
    };
    walk(variants, `${baseId}-v`, 0);
    return `<nav class="adj-tree">${items.join("")}</nav>`;
  }

  private getVariantCard(
    creature: Creature,
    variant: Variant,
    indexed: { effective: EffectiveAdjustment; index: number }[],
    cardId: string,
    depth = 0,
  ): string {
    const own = indexed.filter((e) => e.effective.variant === variant);

    // The variant's shared profile (its own `data` folded over the base) is rendered as this
    // card's own body - a full stat grid plus any attack/trait/ability changes it makes - so a
    // variant with many changes stays readable. Member files that carry *only* that profile add
    // nothing beyond it, so they're listed on an "Applies to" line rather than repeated as an
    // identical card; only files that deviate (a boss with extra HD, a bg2-only summon scope, a
    // noWeapon minion) keep their own diff card below.
    const profile = adjustmentService.getVariantProfile(creature, variant);
    const profileEntry = profile
      ? own.find((e) => adjustmentService.isEquivalent(e.effective, profile))
      : undefined;
    const deviating = own.filter((e) => e !== profileEntry);

    const profileBody = profileEntry
      ? this.getAdjustmentCardBody(creature, profileEntry.effective, profileEntry.index)
      : "";

    // Deviating members diff against the shared profile (not the base), so their cards show only
    // what each one changes *on top of* the variant. A member left with nothing to show (e.g. a
    // bg2 summon scope that only re-zeroes xpv) collapses onto the "Applies to" line instead.
    const appliesToFiles = profileEntry ? [...profileEntry.effective.files] : [];
    const cards = deviating
      .map((e) => {
        const card = this.getAdjustmentCard(creature, e.effective, e.index, profile);
        if (!card) appliesToFiles.push(...e.effective.files);
        return card;
      })
      .join("");
    const appliesTo = appliesToFiles.length
      ? `<p class="variant-applies-to">Applies to ${this.getAdjustmentLabel(
          creature,
          appliesToFiles,
        )}</p>`
      : "";
    const children = variant.children
      .map((child, i) => this.getVariantCard(creature, child, indexed, `${cardId}-${i}`, depth + 1))
      .join("");
    // A nested variant says "sub-variant" and names its parent, so the relationship is legible
    // even on its own; the card is also indented + left-accented (see monsters.css).
    const badge = depth
      ? `<span class="variant-badge">sub-variant of ${variant.parent?.label ?? ""}</span>`
      : `<span class="variant-badge">variant</span>`;
    // data-files carries the resrefs whose detail lives on this card itself (members folded onto
    // the "Applies to" line) - members with their own diff card carry their own data-files. Lets
    // docs/monsters.js's file search scroll straight here once the panel is open.
    const dataFiles = appliesToFiles.length ? ` data-files="${appliesToFiles.join(" ")}"` : "";
    return (
      `<div class="variant-card" id="${cardId}"${dataFiles}>` +
      `<h4 class="variant-card-title">${badge}${variant.label}</h4>` +
      profileBody +
      appliesTo +
      (cards ? `<div class="adjustment-cards">${cards}</div>` : "") +
      children +
      `</div>`
    );
  }

  // `profile`, when given (variant member cards), is subtracted from the effective's scalar stats
  // so the card shows only what this member changes beyond its variant's shared profile - and the
  // card is dropped entirely if that leaves nothing to show.
  private getAdjustmentCard(
    creature: Creature,
    effective: EffectiveAdjustment,
    cardIndex: number,
    profile?: EffectiveAdjustment,
  ): string {
    const gameChip = effective.game
      ? `<span class="adjustment-game-chip">${effective.game}</span> `
      : "";
    const label = gameChip + this.getAdjustmentLabel(creature, effective.files);
    const body = this.getAdjustmentCardBody(
      creature,
      profile ? adjustmentService.subtractProfile(effective, profile) : effective,
      cardIndex,
    );
    if (profile && !body) return "";
    // data-files (space-separated resrefs) lets docs/monsters.js's file search scroll straight to
    // this card once it has opened the panel.
    return (
      `<div class="adjustment-card" data-files="${effective.files.join(" ")}">` +
      `<h4 class="adjustment-card-title">${label}</h4>` +
      body +
      `</div>`
    );
  }

  // The diff content of an adjustment - stat grid, "uses his own weapon" note, and any
  // attack/trait/ability changes - without the card wrapper or title. Shared by the per-file
  // adjustment cards and by the variant card, which renders its shared profile as its own body.
  private getAdjustmentCardBody(
    creature: Creature,
    effective: EffectiveAdjustment,
    cardIndex: number,
  ): string {
    const noWeaponNote = effective.noWeapon
      ? `<p class="adjustment-note adjustment-changed">uses his own weapon</p>`
      : "";
    const grid = this.getAdjustmentStatGrid(effective);
    return (
      (grid ? `<dl class="stat-grid">${grid}</dl>` : "") +
      noWeaponNote +
      this.getAdjustmentAttacks(creature, effective, cardIndex) +
      this.getAdjustmentTraits(creature, effective) +
      this.getAdjustmentSpells(creature, effective, cardIndex) +
      this.getAdjustmentSpellbooks(creature, effective, cardIndex)
    );
  }

  private getAdjustmentStatGrid(effective: EffectiveAdjustment): string {
    const thac0 = thac0Stat(effective.thac0.value, effective.meleeThac0.value);
    let str = `${effective.strength.value}`;
    if (effective.strength.value === 18 && effective.exceptionalStrength.value) {
      str += `/${effective.exceptionalStrength.value}`;
    }
    // Diff view: list only the ability scores this adjustment actually moved, not the whole block
    // (the base card in the panel's side column carries every unchanged score).
    const abilityParts: string[] = [];
    if (effective.strength.changed || effective.exceptionalStrength.changed) {
      abilityParts.push(`STR ${str}`);
    }
    if (effective.dexterity.changed) abilityParts.push(`DEX ${effective.dexterity.value}`);
    if (effective.constitution.changed) abilityParts.push(`CON ${effective.constitution.value}`);
    if (effective.intelligence.changed) abilityParts.push(`INT ${effective.intelligence.value}`);
    if (effective.wisdom.changed) abilityParts.push(`WIS ${effective.wisdom.value}`);
    if (effective.charisma.changed) abilityParts.push(`CHA ${effective.charisma.value}`);
    const abilityScores = abilityParts.join(", ");
    const hitDiceChanged = effective.level.changed || effective.hp.changed;

    // Diff view: only the rows this adjustment actually changes (the base card in the panel's
    // side column carries every unchanged stat).
    const row = (label: string, value: string | number, changed: boolean, wide = false): string => {
      if (!changed) return "";
      const cls = wide ? "stat stat-wide" : "stat";
      return `<div class="${cls}"><dt>${label}</dt><dd class="adjustment-changed">${value}</dd></div>`;
    };

    return (
      row("Ability Scores", abilityScores, abilityParts.length > 0, true) +
      row("Hit Dice", `${effective.level.value} (${effective.hp.value} hp)`, hitDiceChanged) +
      row(ARMOR_CLASS_LABEL, effective.ac.value, effective.ac.changed) +
      row(thac0.dt, thac0.dd ?? "", effective.thac0.changed || effective.meleeThac0.changed) +
      row(APR_LABEL, effective.apr.value, effective.apr.changed) +
      row("Movement", effective.movement.value, effective.movement.changed) +
      row("Morale", effective.morale.value, effective.morale.changed) +
      row(
        "Alignment",
        this.formatEnumLabel(effective.alignment.value),
        effective.alignment.changed,
      ) +
      row("Size", effective.size.value, effective.size.changed) +
      // XP Value is hidden whenever it's 0 (see adjustmentService.hasVisibleChanges) - a summon
      // folded in as an adjustment zeroes it and that carries no documentation value.
      row("XP Value", effective.xpv.value, effective.xpv.changed && effective.xpv.value !== 0) +
      // Mirrors the base card's own Kit stat - same "only when there's a value" rule as XP Value.
      row(
        "Kit",
        this.formatEnumLabel(effective.kit.value),
        effective.kit.changed && !!effective.kit.value,
      )
    );
  }

  private getAdjustmentAttacks(
    creature: Creature,
    effective: EffectiveAdjustment,
    cardIndex: number,
  ): string {
    // Diff view: only weapons this adjustment actually changed. Same main-hand/off-hand labeling
    // as getCreatureAttacks, but driven by the card's own effective APR rather than the base
    // creature's. Dual-wielding is never re-derived per adjustment, so the base flag is reused.
    const dualWielding = creature.attack.dualWielding;
    const mainHandAttacks = effective.apr.value - (dualWielding ? 1 : 0);
    const docWeapons: { item: EquippedItem; weapon: Item; changed: boolean }[] = [];
    for (const { item, changed } of effective.equipped) {
      const weapon = itemService.isEquippedWeapon(item)
        ? State.items.find((i) => i.file === item.file)
        : undefined;
      if (weapon?.doc) docWeapons.push({ item, weapon, changed });
    }
    // Keep each changed weapon's *natural* slot index (its position among all doc weapons) so its
    // popover ids stay stable and unique regardless of which siblings are hidden.
    let attacks = docWeapons
      .map((w, slotIndex) => ({ ...w, slotIndex }))
      .filter((w) => w.changed)
      .map(({ item, weapon, slotIndex }) => {
        const entries: { id: string; html: string }[] = [];
        const text = this.getAttackDisplayText(
          translationService.fromOptional(weapon.description),
          entries,
          `m${creature.id}-adj${cardIndex}-w${slotIndex}`,
        );
        const label = dualWielding ? this.getWeaponSlotLabel(item, mainHandAttacks) : "";
        const proficiency = this.getAdjustmentWeaponProficiencyLabel(
          weapon.proficiency,
          effective.proficiencies,
        );
        const popovers = entries
          .map((e) => `<div class="spell-popover-entry" id="${e.id}" hidden>${e.html}</div>`)
          .join("");
        return `<div class="weapon adjustment-changed">${label}${text}${proficiency}</div>${popovers}`;
      })
      .join("<hr/>");
    if (!attacks) {
      // No weapon changed - only surface the section if a proficiency rank did.
      const profs = this.getChangedProficienciesFallback(effective.proficiencies);
      if (!profs) return "";
      attacks = `<div class="weapon">By weapon${profs}</div>`;
    }
    return `<div class="detail-section"><h4>Attacks</h4>${attacks}</div>`;
  }

  // Diff view: only the traits/immunities this adjustment newly grants (the base card lists the
  // rest). Same three-part shape as getCreatureTraits - trait links, equipped trait-carrier
  // items, non-trait immunity descriptions - filtered to `changed`.
  private getAdjustmentTraits(creature: Creature, effective: EffectiveAdjustment): string {
    let result = "";
    const resolved = effective.immunities
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      .filter(({ name }) => !creature.autoImmunities?.includes(name))
      .map(({ name, changed }) => ({
        config: State.immunities.find((i) => i.name === name),
        changed,
      }))
      .filter(
        (entry): entry is { config: ImmunityConfig; changed: boolean } =>
          entry.config !== undefined && entry.changed,
      );

    const traitLinks = resolved
      .filter((entry) => entry.config.type === "trait")
      .map(
        (entry) =>
          `<a href="#${entry.config.name}" class="trait-link adjustment-changed">` +
          `${translationService.fromOptional(entry.config.stringRef)}</a>`,
      );
    if (traitLinks.length) result += `<h5>${traitLinks.join(", ")}</h5>`;

    for (const { item, changed } of effective.equipped) {
      if (!changed) continue;
      const found = State.items.find((i) => i.file === item.file);
      if (found?.trait) result += this.getTraitItemHtml(found, true);
    }

    for (const entry of resolved.filter((e) => e.config.type !== "trait")) {
      let text = translationService.fromOptional(entry.config.stringRef);
      if (entry.config.description) {
        text = `<h5><a href="#${entry.config.name}" class="trait-link">${text}</a></h5>`;
      }
      result += `<div class="adjustment-changed">${text}</div>`;
    }
    if (effective.hideShadow.changed && effective.hideShadow.value !== undefined) {
      const trait = this.getHideInShadowsTrait(effective.hideShadow.value);
      result += `<div class="adjustment-changed">${trait}</div>`;
    }
    if (!result) return "";
    return `<div class="detail-section"><h4>Traits</h4><div class="traits">${result}</div></div>`;
  }

  // Diff view: only abilities whose memorized count this adjustment changed.
  private getAdjustmentSpells(
    creature: Creature,
    effective: EffectiveAdjustment,
    cardIndex: number,
  ): string {
    const memorizedList = effective.memorized.map((entry) => entry.spell);
    const entries: { ability: CreatureAbility; html: string }[] = [];
    this.getResourceAbilities(creature).forEach((ability, index) => {
      const entry = effective.memorized.find((m) => m.spell.file === ability.resource);
      if (!entry?.changed) return;
      const html = this.getCreatureSpell(
        ability,
        memorizedList,
        `m${creature.id}-adj${cardIndex}-ability-${index}`,
        "adjustment-changed",
      );
      if (html) entries.push({ ability, html });
    });
    return this.renderAbilitiesSection(`m${creature.id}-adj${cardIndex}`, entries);
  }

  // Mirrors getCreatureSpellbooks's mod-tabbed layout, scoped to this one adjustment/variant -
  // an adjustment introducing a mod-conditional spellbook (spellService.createSpellbooks) has
  // nothing to diff against (the base creature never has one of its own), so every entry is
  // shown as new rather than filtered down to only "changed" ones the way getAdjustmentSpells
  // filters the plain `memorized` list.
  // Renders the tab strip shared by getCreatureSpellbooks and getAdjustmentSpellbooks. Skipped
  // down to just the one panel's spells, with no tab button/name, when only one mod-conditional
  // spellbook survived filtering - with nothing to switch between, a lone tab labeled "Vanilla"
  // or "Spell Revisions" only adds noise, not information.
  private renderSpellbookTabs(tabs: { id: string; name: string; spells: string }[]): string {
    if (tabs.length === 1) return tabs[0].spells;
    const buttons = tabs
      .map(
        (tab, i) =>
          `<button type="button" class="spellbook-tab-button${i === 0 ? " active" : ""}" data-tab="${tab.id}">${tab.name}</button>`,
      )
      .join("");
    const panels = tabs
      .map(
        (tab, i) =>
          `<div class="spellbook-tab-panel abilities${i === 0 ? " active" : ""}" id="${tab.id}">${tab.spells}</div>`,
      )
      .join("");
    return `<div class="spellbook-tabs"><div class="spellbook-tab-buttons" role="tablist">${buttons}</div>${panels}</div>`;
  }

  private getAdjustmentSpellbooks(
    creature: Creature,
    effective: EffectiveAdjustment,
    cardIndex: number,
  ): string {
    const abilities = this.getResourceAbilities(creature);
    const tabs = (effective.spellbooks ?? [])
      .map((spellbook, index) => {
        const idPrefix = `m${creature.id}-adj${cardIndex}-sb${index}`;
        const entries = abilities
          .map((ability, abilityIndex) => ({
            ability,
            html: this.getCreatureSpell(
              ability,
              spellbook.memorized,
              `${idPrefix}-ability-${abilityIndex}`,
              "adjustment-changed",
            ),
          }))
          .filter((entry) => entry.html);
        return {
          id: `spellbook-m${creature.id}-adj${cardIndex}-${index}`,
          name: SPELLBOOK_MODS[spellbook.mod].name,
          spells: this.renderAbilityEntries(idPrefix, entries),
        };
      })
      .filter((tab) => tab.spells);
    if (!tabs.length) return "";
    return `<h4>Spellbooks</h4>${this.renderSpellbookTabs(tabs)}`;
  }

  private getFileName(creature: Creature, file: string): string | undefined {
    // An adjustment's own `stringRef` is an explicit author override for that file's name and
    // wins over both newFiles and the creatures.csv name - see getAdjustmentStringRef.
    const adjustmentStringRef = this.getAdjustmentStringRef(creature, file);
    if (adjustmentStringRef !== undefined) return translationService.from(adjustmentStringRef);
    // creature.newFiles has a class field-initializer default of [] on the real Creature class, but
    // documentation.service.test.ts fixtures built via `as unknown as Creature` casts can leave it
    // genuinely undefined at runtime - same defensive pattern already used in adjustment.service.ts.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const newFile = creature.newFiles?.find((nf) =>
      // creatureFactory uppercases adjustment.files (creature.factory.ts) and monsterFilesService
      // normalizes lookups to uppercase, but newFiles entries keep whatever case they were authored
      // with (e.g. "jacm1900") - compare case-insensitively to match.
      nf.files.some((f) => f.toUpperCase() === file.toUpperCase()),
    );
    if (newFile?.stringRef) return translationService.from(newFile.stringRef);
    return monsterFilesService.getName(file);
  }

  // Later-defined adjustments win, mirroring adjustmentService's own "last one wins" fold - a
  // file touched by several adjustments (e.g. a variant patch plus a hand-written setAdjustments
  // tweak) takes the stringRef of the last one that set it.
  private getAdjustmentStringRef(creature: Creature, file: string): StringReference | undefined {
    let result: StringReference | undefined;
    for (const adjustment of creature.adjustments) {
      if (adjustment.stringRef === undefined) continue;
      if (adjustment.files.some((f) => f.toUpperCase() === file.toUpperCase())) {
        result = adjustment.stringRef;
      }
    }
    return result;
  }

  // Every card is titled by the creatures.csv / newFiles name its file(s) resolve to, but several
  // distinct files often resolve to the very same name (e.g. a carrion crawler's CARRIOSU and
  // BDCRAWMU are both "Mutated Crawler") - so the originating file(s) are always spelled out in
  // parentheses after a resolved name to keep otherwise-identical cards apart. Files sharing one
  // resolved name are grouped under it ("Skeleton Warrior (KRYSKEL1, KRYSKEL2)"); a file whose
  // name doesn't resolve, or resolves to the creature's own name, already *is* its own label and
  // gets no parenthetical - unless that name was an explicit adjustment `stringRef`, which is an
  // author override and always earns its label (e.g. correcting a misleading creatures.csv name
  // back to the base creature's own name).
  private getAdjustmentLabel(creature: Creature, files: string[]): string {
    const creatureName = translationService.from(creature.name).trim().toLowerCase();
    const filesByLabel = new Map<string, string[]>();
    const order: string[] = [];
    for (const file of files) {
      const explicit = this.getAdjustmentStringRef(creature, file) !== undefined;
      const resolved = this.getFileName(creature, file);
      const name =
        resolved && (explicit || resolved.trim().toLowerCase() !== creatureName)
          ? resolved
          : undefined;
      const label = name ?? file;
      if (!filesByLabel.has(label)) {
        filesByLabel.set(label, []);
        order.push(label);
      }
      if (name) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        filesByLabel.get(label)!.push(file);
      }
    }
    return order
      .map((label) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const named = filesByLabel.get(label)!;
        return named.length ? `${label} (${named.join(", ")})` : label;
      })
      .join(", ");
  }

  // Creature.addTrait() bundles several named sub-immunities into one carrier item, whose plain
  // text description (see description.service.ts's generateItemTraitDescription, onlyName=true)
  // is reused as the real in-game item tooltip and so can't contain markup. When a bundled
  // sub-immunity is itself a globally documented trait (e.g. "giant", "skeletal" - granted to
  // some creatures directly via data.immunities and to others only through a bundle like this),
  // it still deserves the same clickable popover link either way. This reattaches that link
  // docs-only, by matching each plain-text description line back to the sub-immunity name it
  // came from.
  private getTraitItemHtml(item: Item, changed = false): string {
    const html = this.getTraitItemLines(item).join("");
    return changed ? `<div class="adjustment-changed">${html}</div>` : html;
  }

  private getTraitItemLines(item: Item): string[] {
    const traitLines = new Map<string, string>();
    for (const subName of item.immunities) {
      const sub = State.immunities.find((i) => i.name === subName);
      if (sub?.type === "trait" && sub.doc) {
        traitLines.set(translationService.fromOptional(sub.stringRef), sub.name);
      }
    }
    const lines = translationService.fromOptional(item.description).split(/\r\n|\n/);
    return lines
      .filter((line) => line !== "")
      .map((line) => {
        const traitName = traitLines.get(line);
        return traitName
          ? `<p><a href="#${traitName}" class="trait-link">${line}</a></p>`
          : `<p>${line}</p>`;
      });
  }

  getCreatureSpells(
    template: { text: string },
    creature: Creature,
    omit: CardOmissions = new Set(),
    parts: Pick<CardParts, "abilities"> = { abilities: this.getAbilityParts(creature) },
  ) {
    this.replace(template, "abilities", this.renderAbilities(creature, parts, omit));
  }

  private getAbilityParts(creature: Creature): CardParts["abilities"] {
    return this.getResourceAbilities(creature)
      .map((ability, index) => {
        const idPrefix = `m${creature.id}-ability-${index}`;
        const html = this.getCreatureSpell(ability, creature.data.spells.memorized, idPrefix);
        // The id prefix is per creature: drop it so the same ability compares equal across
        // creatures.
        return { ability, html, key: `ability:${html.split(idPrefix).join("")}` };
      })
      .filter((p) => p.html);
  }

  renderAbilities(
    creature: Creature,
    parts: Pick<CardParts, "abilities">,
    omit: CardOmissions,
    idPrefix = `m${creature.id}`,
  ): string {
    return this.renderAbilitiesSection(
      idPrefix,
      parts.abilities.filter((p) => !omit.has(p.key)),
    );
  }

  // Shared by getCreatureSpells and getAdjustmentSpells: past ABILITY_TAB_THRESHOLD entries, a flat
  // list stops being readable (a caster built from spellService.createSpellbook(), e.g. the Cleric
  // Skeleton variant in lib/creatures/skeleton/skeleton-monster.ts, can memorize several spells per level
  // across 7+ levels) - group into one tab per spell level instead.
  private renderAbilitiesSection(
    idPrefix: string,
    entries: { ability: CreatureAbility; html: string }[],
  ): string {
    if (!entries.length) return "";
    return `<h4>Abilities</h4>${this.renderAbilityEntries(idPrefix, entries)}`;
  }

  // The body renderAbilitiesSection wraps with its own "Abilities" heading - split out so
  // getCreatureSpellbooks/getAdjustmentSpellbooks can drop the same level-grouped body into each
  // mod-variant's own tab panel without a second "Abilities" heading inside it. The resulting
  // level-tabs markup reuses the very same spellbook-tab-* classes as the mod tabs it nests inside
  // (see initSpellbookTabs's `:scope`-qualified selectors in monsters.js, which scope each tab
  // group to its own direct-child buttons/panels precisely so this nesting doesn't cross-wire the
  // two levels of tabs).
  private renderAbilityEntries(
    idPrefix: string,
    entries: { ability: CreatureAbility; html: string }[],
  ): string {
    if (!entries.length) return "";
    return entries.length > ABILITY_TAB_THRESHOLD
      ? this.getAbilityLevelTabs(idPrefix, entries)
      : `<div class="abilities">${entries.map((entry) => entry.html).join("")}</div>`;
  }

  // Groups a long abilities list into one tab per spell level (see SPELL_LEVEL_PATTERN), reusing
  // the same spellbook-tabs markup/CSS/JS as getCreatureSpellbooks's mod-variant tabs so no extra
  // styling or click-handling is needed. Tab ids are kept in the `<idPrefix>-...` shape
  // getBaseCard's id/href/data-tab rewrite already expects (idPrefix always starts with
  // `m<creatureId>`), so this still works unprefixed inside the adjustments panel's base card copy.
  private getAbilityLevelTabs(
    idPrefix: string,
    entries: { ability: CreatureAbility; html: string }[],
  ): string {
    const byLevel = new Map<number | "innate", string[]>();
    for (const { ability, html } of entries) {
      const level = this.getSpellLevel(ability.resource) ?? "innate";
      const group = byLevel.get(level);
      if (group) group.push(html);
      else byLevel.set(level, [html]);
    }
    const levels = [...byLevel.keys()].sort((a, b) => {
      if (a === "innate") return 1;
      if (b === "innate") return -1;
      return a - b;
    });
    const tabs = levels.map((level, i) => {
      const html = byLevel.get(level);
      return {
        id: `${idPrefix}-abilitylevel-${level}`,
        name: level === "innate" ? "Innate" : `Level ${level}`,
        // levels only ever come from byLevel's own keys, so a lookup here always hits.
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        spells: html!.join(""),
        active: i === 0,
      };
    });
    const buttons = tabs
      .map(
        (tab) =>
          `<button type="button" class="spellbook-tab-button${tab.active ? " active" : ""}" data-tab="${tab.id}">${tab.name}</button>`,
      )
      .join("");
    const panels = tabs
      .map(
        (tab) =>
          `<div class="spellbook-tab-panel abilities${tab.active ? " active" : ""}" id="${tab.id}">${tab.spells}</div>`,
      )
      .join("");
    return `<div class="spellbook-tabs"><div class="spellbook-tab-buttons" role="tablist">${buttons}</div>${panels}</div>`;
  }

  // A spell we author ourselves (e.g. Death Knight's Fireball/Wall of Ice, added via addSpell with
  // an explicit `type`/`level`) gets an auto-generated resref that matches neither the vanilla
  // SPWI/SPPR convention nor any spell-reference config, but spellService.getSpell already resolved
  // its real type/level into State.spells - that's authoritative here, and only a genuinely
  // Innate-type entry (e.g. Fear Aura) falls through to the "Innate" catch-all. A mod-introduced
  // spell we merely reference by file (e.g. Faiths & Powers') isn't in State.spells at all, but is
  // registered with a real `level` in its own spell-reference config (spell-database.ts/
  // fnp-spell-database.ts) even though its resref doesn't follow SPELL_LEVEL_PATTERN - so that config
  // is checked next. The filename regex is only a last-resort fallback for a resource with no entry
  // anywhere.
  private getSpellLevel(resource: string | undefined): number | undefined {
    const ownSpell = State.spells.find((s) => s.file === resource);
    if (ownSpell) return ownSpell.type === SpellTypeEnum.Innate ? undefined : ownSpell.level;
    const configuredLevel = [...getAllSpells(SPELLS), ...getAllFnpSpells()].find(
      (s) => s.file === resource,
    )?.level;
    if (configuredLevel !== undefined) return configuredLevel;
    const match = SPELL_LEVEL_PATTERN.exec(resource ?? "");
    return match ? Number(match[1]) : undefined;
  }

  // A tabbed section per mod-conditional spellbook variant (see CreatureDataSpells.spellbooks) -
  // only one of these is ever actually installed for a given end user, so each is labeled by its
  // mod and shown one at a time (see monsters.js) rather than merged into a single
  // undifferentiated list.
  getCreatureSpellbooks(template: { text: string }, creature: Creature) {
    const abilities = this.getResourceAbilities(creature);
    const tabs = (creature.data.spells.spellbooks ?? [])
      .map((spellbook, index) => {
        const idPrefix = `m${creature.id}-sb${index}`;
        const entries = abilities
          .map((ability, abilityIndex) => ({
            ability,
            html: this.getCreatureSpell(
              ability,
              spellbook.memorized,
              `${idPrefix}-ability-${abilityIndex}`,
            ),
          }))
          .filter((entry) => entry.html);
        return {
          id: `spellbook-m${creature.id}-${index}`,
          name: SPELLBOOK_MODS[spellbook.mod].name,
          spells: this.renderAbilityEntries(idPrefix, entries),
        };
      })
      .filter((tab) => tab.spells);

    const result = tabs.length ? `<h4>Spellbooks</h4>${this.renderSpellbookTabs(tabs)}` : "";
    this.replace(template, "spellbooks", result);
  }

  // One entry per spell: several abilities can cast the same one (e.g. a vampire's bat form, to
  // flee or to dive on a victim).
  private getResourceAbilities(creature: Creature): CreatureAbility[] {
    const abilities = [
      ...creature.behavior.abilities,
      ...creature.behavior.customCodes.map((c) => c.abilities).flat(),
    ];
    return abilities.filter(
      (a, i) => a.resource && abilities.findIndex((b) => b.resource === a.resource) === i,
    );
  }

  getCreatureSpell(
    ability: CreatureAbility,
    memorizedList: MemorizedSpell[],
    idPrefix: string,
    extraClass = "",
  ) {
    const memorized = memorizedList.find((m) => m.file === ability.resource);
    const spell = State.spells.find((s) => s.file === ability.resource);
    let result = "";
    let popoverEntry = "";
    const infiniteUse = ability.infiniteUse ? 1 : undefined;
    if (spell && spell.doc && memorized) {
      const rounds = spell.options?.renew ?? infiniteUse;
      const quantity = this.getSpellQuantity(memorized.memorizedCount, rounds);
      const name = translationService.from(spell.name);
      const description =
        spell.doc !== "name" ? translationService.fromOptional(spell.description) : "";
      if (description) {
        // Same popover mechanism as the attacks section's "Cast spell" links (see
        // getAttackDisplayText/collapseSpellBlocks) - only the name is shown inline, with the
        // full description revealed on hover/click via docs/monsters.js's shared trait-popover.
        const id = `${idPrefix}-desc`;
        popoverEntry = `<div class="spell-popover-entry" id="${id}" hidden>${this.buildDescriptionHtml(description.split(/\r\n|\n/))}</div>`;
        result = `<h5><a href="#${id}" class="trait-link">${name}</a> (${quantity})</h5>`;
      } else {
        result = `<h5>${name} (${quantity})</h5>`;
      }
    } else if (memorized) {
      // ability.infiniteUse (noDec/force/reallyForce without a remove flag - see
      // ability.service.ts's parseAbilitySpell) means the scripted cast never decrements the
      // memorized slot, so the daily memorized count isn't actually consumed and isn't the real
      // limiter - the ability's own recast timer is (converted from seconds to rounds, as
      // action.factory.ts's setGlobalRoundTimer uses 6 seconds/round), or "at will" if untimed.
      // Only when the cast does decrement the slot is the memorized daily count authoritative.
      const infiniteUseRounds = ability.timer ? ability.timer.value / 6 : 1;
      const quantity = ability.infiniteUse
        ? this.getSpellQuantity(1, infiniteUseRounds)
        : this.getSpellQuantity(memorized.memorizedCount);
      const name =
        (ability.resource && spellComboService.labelOf(ability.resource)) ??
        translationService.from(ability.name);
      result = `<h5>${name} (${quantity})</h5>`;
    }
    if (!result) return "";
    // Wrapped so a multi-column layout (see .spellbook-tab-panel in monsters.css) can keep each
    // ability's title together instead of splitting it across columns.
    const cls = extraClass ? `ability-entry ${extraClass}` : "ability-entry";
    return `<div class="${cls}">${result}</div>${popoverEntry}`;
  }

  // Source content for the trait popover (docs/monsters.js's initTraitPopover): each trait-type
  // immunity, plus every non-trait immunity/resistance that has a description, gets one hidden
  // entry keyed by name, that a creature card's `a.trait-link` looks up by its `href="#<name>"`
  // fragment and copies into the popover on hover/click. Trait-type immunities always get an
  // entry (getCreatureTraits links to them unconditionally); non-trait ones only get one when
  // they have a description, since a description-less non-trait immunity is rendered as bare
  // text with no link to resolve. Not rendered as a visible glossary (removed in favor of the
  // popover) - only exists so the popover has content to read. No title inside - the trait link
  // the user is hovering/clicking already shows the name, so repeating it in the popover body
  // would be redundant.
  getTraitEntries(): string {
    let result = "";
    // State.immunities is sorted once when loaded (see stateService.loadImmunities()) - both
    // this trait listing and weiduFunctionService's generated function order rely on that same
    // invariant rather than either one re-sorting (or silently depending on the other having
    // sorted first).
    for (const immunity of State.immunities) {
      if (!immunity.doc || (immunity.type !== "trait" && !immunity.description)) continue;
      const entry = immunity.description
        ? this.buildDescriptionHtml(translationService.from(immunity.description).split(/\r\n|\n/))
        : "";
      result += `<div class="trait-entry" id="${immunity.name}">${entry}</div>`;
    }
    return result;
  }

  // Renders a SCREAMING_SNAKE_CASE stat (e.g. alignment's "CHAOTIC_EVIL") as "Chaotic Evil".
  formatEnumLabel(value: string | undefined): string {
    if (!value) return "";
    return value
      .split("_")
      .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
      .join(" ");
  }

  getSpellQuantity(memorizedCount: number | undefined, renew?: number): string {
    if (!memorizedCount) return "unknown";
    if (memorizedCount === AT_WILL) return "at will";
    if (!renew) return `${memorizedCount}/day`;
    if (renew <= 1) return "at will";
    return `every ${renew} rounds`;
  }

  private replace(template: { text: string }, key: string, value: string | number | undefined) {
    key = `{{${key}}}`;
    if (!template.text.includes(key)) throw new Error(`Token ${key} not found !`);
    template.text = template.text.replace(new RegExp(key, "g"), `${value ?? ""}`);
  }

  // Same token substitution as replace(), but splices the value in literally (split/join) instead
  // of through String.replace - for values like a JSON blob where a `$` could otherwise be read as
  // a replacement-pattern reference ($&, $1, $$, ...).
  private replaceRaw(template: { text: string }, key: string, value: string) {
    key = `{{${key}}}`;
    if (!template.text.includes(key)) throw new Error(`Token ${key} not found !`);
    template.text = template.text.split(key).join(value);
  }
}

const documentationService = new DocumentationService();
export default documentationService;
