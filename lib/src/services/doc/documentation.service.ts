import * as fs from "fs";
import { MonsterFamilyEnum } from "../../../creatures/monster";
import { SPELLBOOK_MODS } from "../../../config/mods";
import { CreatureAbility } from "../../model/creature/ability";
import { CR } from "../../model/constants";
import { Creature } from "../../model/creature/creature";
import { MemorizedSpell } from "../../model/creature/data";
import { Variant } from "../../model/creature/variant";
import { Family } from "../../model/creature/family";
import { EquippedItem } from "../../model/creature/item";
import { ImmunityConfig } from "../../model/final/immunity";
import { ProficiencyTypeEnum } from "../../model/spell-item/effect.enums";
import { Item } from "../../model/spell-item/spell-item";
import { State } from "../../state";
import creatureService from "../creature.service";
import itemService from "../item.service";
import logService from "../log.service";
import monsterFilesService from "../monster-files.service";
import translationService from "../translation.service";
import utils from "../utils/utils.service";
import adjustmentService, { EffectiveAdjustment } from "./adjustment.service";

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
// 1). A mod-introduced spell (e.g. Faiths & Powers' D5P1301) doesn't follow this convention and
// carries no filename-derived level, so getAbilityLevelTabs falls back to grouping it under a
// catch-all "Innate" tab rather than trying to read its level from spell metadata.
const SPELL_LEVEL_PATTERN = /^(?:SPWI|SPPR)(\d)/;

// One searchable `.cre` resref -> the creature card it belongs to. Serialized into the page as a
// JSON blob the docs/monsters.js file-search box reads. `kind` isn't shown to the reader - it only
// tells the search box whether to scroll to the base card (`replaces`) or open the adjustments
// panel (everything else), where the file-specific detail actually lives.
export const FILE_INDEX_KINDS = ["replaces", "adjustment", "variant", "new"] as const;
export type FileIndexKind = (typeof FILE_INDEX_KINDS)[number];

export interface FileIndexEntry {
  file: string;
  creature: string;
  anchor: string;
  kind: FileIndexKind;
}

class DocumentationService {
  private families: string[] = [];
  private monsters: string[] = [];
  private fileIndex: FileIndexEntry[] = [];

  generate() {
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
    this.replace(template, "families", this.families.join(""));
    this.replace(template, "traitEntries", this.getTraitEntries());
    // Raw (split/join, not String.replace) so `$` sequences in a resolved creature name can't be
    // read as replacement-pattern references and corrupt the JSON.
    this.replaceRaw(template, "fileSearchIndex", JSON.stringify(this.fileIndex));
    try {
      utils.writeFile("docs/monsters.html", template.text);
    } catch (e) {
      throw new Error(`Failed to write documentation to docs/monsters.html`, {
        cause: e,
      });
    }
  }

  // Ornamental section header dropped into the creature column before each family's cards, so the
  // otherwise-continuous run of `.creature` blocks reads as grouped by family. The `id` gives the
  // family its own scroll anchor (#family-Bear).
  getFamilyDivider(family: Family): string {
    const name = MonsterFamilyEnum[family.id];
    return (
      `<div class="family-divider" id="family-${name}">` +
      `<span class="family-divider-rule"></span>` +
      `<h2>${name}</h2>` +
      `<span class="family-divider-rule"></span>` +
      `</div>`
    );
  }

  getFamilyMenu(family: Family): string {
    const links = family.creatures
      .filter((creature) => creature.valid)
      .map(
        (creature) =>
          `<li><a href="#m${creature.id}">${translationService.from(creature.name)}</a></li>`,
      )
      .join("");
    return `<li class="family"><details><summary>${
      MonsterFamilyEnum[family.id]
    }</summary><ul>${links}</ul></details></li>`;
  }

  addFamily(family: Family) {
    this.families.push(this.getFamilyMenu(family));
    // Only emit the section header when the family actually contributes a card below it - an
    // all-invalid (or empty) family like Elemental would otherwise leave a divider with nothing
    // under it. Same valid=false skip rationale as the creature loop below.
    if (family.creatures.some((creature) => creature.valid)) {
      this.monsters.push(this.getFamilyDivider(family));
    }
    for (const creature of family.creatures) {
      // A creature whose builder threw after create() (see CreatureFamily.addCreature()) is left
      // in family.creatures with valid=false and never reached Creature.validate(), so fields
      // like creature.attack are still unset - skip it here rather than crash the whole
      // documentation pass on one bad creature.
      if (!creature.valid) continue;
      this.addCreature(creature);
      this.indexCreatureFiles(creature);
    }
  }

  // Records every `.cre` resref this creature owns into the searchable file index (see
  // FileIndexEntry / docs/monsters.js's initFileSearch). `kind` is assigned by precedence - the
  // later `set` call wins - so a file that is both a base replacement and an adjustment target
  // (KORAX, MALKAL, ...) reports the more specific "adjustment"/"variant", and a brand-new file
  // reports "new".
  indexCreatureFiles(creature: Creature) {
    const kinds = new Map<string, FileIndexKind>();
    const set = (file: string, kind: FileIndexKind) => {
      const key = file.toUpperCase();
      if (key) kinds.set(key, kind);
    };
    // creature.files / adjustments / variants / newFiles are all definite class fields, but doc
    // test fixtures built via `as unknown as Creature` casts leave them genuinely undefined -
    // same defensive pattern the rest of this service uses.
    /* eslint-disable @typescript-eslint/no-unnecessary-condition */
    for (const f of creature.files ?? []) set(f.name, "replaces");
    for (const adjustment of creature.adjustments ?? []) {
      for (const f of adjustment.files) set(f, "adjustment");
    }
    const walkVariants = (variants: Variant[]) => {
      for (const variant of variants) {
        for (const f of variant.files) set(f, "variant");
        walkVariants(variant.children);
      }
    };
    walkVariants(creature.variants ?? []);
    for (const newFile of creature.newFiles ?? []) {
      for (const f of newFile.files) set(f, "new");
    }
    /* eslint-enable @typescript-eslint/no-unnecessary-condition */

    const name = translationService.from(creature.name);
    const anchor = `m${creature.id}`;
    for (const [file, kind] of kinds) {
      this.fileIndex.push({ creature: name, file, anchor, kind });
    }
  }

  addCreature(creature: Creature) {
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
    let str = `${creature.data.strength}`;
    this.replace(template, "id", `m${creature.id}`);
    if (creature.data.exceptionalStrength) str += `/${creature.data.exceptionalStrength}`;
    this.getCreatureHeader(template, creature);
    this.replace(template, "str", str);
    this.replace(template, "dex", creature.data.dexterity);
    this.replace(template, "con", creature.data.constitution);
    this.replace(template, "int", creature.data.intelligence);
    this.replace(template, "wis", creature.data.wisdom);
    this.replace(template, "cha", creature.data.charisma);
    this.replace(template, "align", this.formatEnumLabel(creature.data.alignment));
    this.replace(template, "ac", creatureService.getFinalArmorClass(creature));
    this.replace(template, "movement", creature.data.movement.pnpValue);
    this.replace(
      template,
      "hitDice",
      `${creature.data.level1.pnpValue} (${creature.data.hp ?? 0} hp)`,
    );
    this.replace(template, "thac0", creature.data.thac0);
    this.replace(template, "apr", this.getEffectiveApr(creature));
    this.replace(template, "size", creature.data.size.value);
    this.addSpecial(template, creature);
    this.replace(template, "morale", creature.data.morale);
    // XP Value is omitted entirely when it's 0 (or unset) - a detected summon is folded in with
    // xpv 0 and showing "XP Value 0" carries no documentation value.
    this.replace(
      template,
      "xpStat",
      creature.data.xpv
        ? `<div class="stat"><dt>XP Value</dt><dd>${creature.data.xpv}</dd></div>`
        : "",
    );
    this.getCreatureAttacks(template, creature);
    this.getCreatureTraits(template, creature);
    this.getCreatureSpells(template, creature);
    this.getCreatureSpellbooks(template, creature);
    this.monsters.push(template.text);
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

  addSpecial(template: { text: string }, creature: Creature) {
    let special = "";
    if (creature.data.level1.type === "caster") {
      special += `Cast spells as a level ${creature.data.level1.value} caster`;
    } else if (creature.data.level1.type === "turn") {
      special += `Turned as a level ${creature.data.level1.value} undead`;
    }
    if (special) {
      special = `<div class="stat stat-half"><dt>Special</dt><dd>${special}</dd></div>`;
    }
    this.replace(template, "special", special);
  }

  getCreatureAttacks(template: { text: string }, creature: Creature) {
    let attacks = "";
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
      const entries: { id: string; html: string }[] = [];
      const text = this.getAttackDisplayText(
        translationService.fromOptional(weapon.description),
        entries,
        `m${creature.id}-w${weaponIndex}`,
      );
      const label = dualWielding ? this.getWeaponSlotLabel(equippedItem, mainHandAttacks) : "";
      const proficiency = this.getWeaponProficiencyLabel(
        weapon.proficiency,
        creature.data.proficiencies,
      );
      attacks += attacks ? "<hr/>" : "";
      attacks += `<div class="weapon">${label}${text}${proficiency}</div>`;
      attacks += entries
        .map((e) => `<div class="spell-popover-entry" id="${e.id}" hidden>${e.html}</div>`)
        .join("");
      weaponIndex++;
    }
    if (!attacks && creature.data.apr > 0) {
      // No equipped item is known to the doc pipeline (e.g. the half-ogre's own weapon comes
      // straight from its base CRE file rather than an addWeapon() call - see lib/creatures/
      // ogres.ts), so there's no per-weapon block to attach a proficiency line to. The creature's
      // proficiencies are still real information, so list them here instead of dropping them.
      attacks = `<div class="weapon">By weapon${this.getProficienciesFallback(creature.data.proficiencies)}</div>`;
    } else if (!attacks) {
      attacks = `<div class="weapon">None</div>`;
    }
    this.replace(template, "attacks", attacks);
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

  getCreatureTraits(template: { text: string }, creature: Creature) {
    let result = "";
    const immunities = creature.data.immunities
      // Creature.autoImmunities defaults to [] via the class field initializer, but test
      // fixtures and other partial-object call sites construct Creature via `as unknown as
      // Creature` casts that skip it, so it's genuinely undefined at some real call sites
      // despite the type - keep the optional chain.
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      .filter((name) => !creature.autoImmunities?.includes(name))
      .map((name) => State.immunities.find((i) => i.name === name))
      .filter((i): i is ImmunityConfig => i !== undefined);
    const traits: string[] = [];
    for (const immunity of immunities.filter((i) => i.type === "trait")) {
      traits.push(
        `<a href="#${immunity.name}" class="trait-link">${translationService.fromOptional(
          immunity.stringRef,
        )}</a>`,
      );
    }
    if (traits.length) result += `<h5>${traits.join(", ")}</h5>`;
    for (const equippedItem of creature.data.items.equipped) {
      const item = State.items.find((i) => i.file === equippedItem.file);
      if (item?.trait) {
        result += this.getTraitItemHtml(item);
      }
    }
    for (const immunity of immunities.filter((i) => i.type !== "trait")) {
      let text = translationService.fromOptional(immunity.stringRef);
      if (immunity.description) {
        text = `<h5><a href="#${immunity.name}" class="trait-link">${text}</a></h5>`;
      }
      result += text;
    }
    if (result) {
      result = `<div class="detail-section"><h4>Traits</h4><div class="traits">${result}</div></div>`;
    }
    this.replace(template, "traits", result);
  }

  getCreatureHeader(template: { text: string }, creature: Creature) {
    const name = translationService.from(creature.name);
    const effectives = adjustmentService.getEffectiveAdjustments(creature);
    let header = `<h3>${name}</h3>`;
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
        `<summary><span>${name}</span><span class="adjustments-badge">${count} ${label}</span></summary>` +
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
    // `{{attacks}}` is wrapped by monster.html; the other three sections carry their own wrapper.
    const sub = {
      text:
        `<div class="detail-section"><h4>Attacks</h4>{{attacks}}</div>` +
        `{{traits}}{{abilities}}{{spellbooks}}`,
    };
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
    const cell = (dt: string, dd: string | number): string =>
      `<div class="stat"><dt>${dt}</dt><dd>${dd}</dd></div>`;
    return (
      `<div class="stat stat-wide"><dt>Ability Scores</dt><dd>` +
      `STR ${str}, DEX ${d.dexterity}, CON ${d.constitution}, INT ${d.intelligence}, ` +
      `WIS ${d.wisdom ?? "?"}, CHA ${d.charisma ?? "?"}</dd></div>` +
      cell("Hit Dice", `${d.level1.pnpValue} (${d.hp ?? "?"} hp)`) +
      cell("Armor Class", creatureService.getFinalArmorClass(creature)) +
      cell("THAC0", d.thac0 ?? "?") +
      cell("Attacks per Round", this.getEffectiveApr(creature)) +
      cell("Movement", d.movement.pnpValue) +
      cell("Morale", d.morale ?? "?") +
      cell("Alignment", this.formatEnumLabel(d.alignment)) +
      cell("Size", d.size.value) +
      (d.xpv ? cell("XP Value", d.xpv) : "")
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
      this.getAdjustmentSpells(creature, effective, cardIndex)
    );
  }

  private getAdjustmentStatGrid(effective: EffectiveAdjustment): string {
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
      row("Armor Class", effective.ac.value, effective.ac.changed) +
      row("THAC0", effective.thac0.value, effective.thac0.changed) +
      row("Attacks per Round", effective.apr.value, effective.apr.changed) +
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
      row("XP Value", effective.xpv.value, effective.xpv.changed && effective.xpv.value !== 0)
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

  private getFileName(creature: Creature, file: string): string | undefined {
    // creature.newFiles has a class field-initializer default of [] on the real Creature class, but
    // documentation.service.test.ts fixtures built via `as unknown as Creature` casts can leave it
    // genuinely undefined at runtime - same defensive pattern already used in adjustment.service.ts.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const newFile = creature.newFiles?.find((nf) =>
      // creatureFactory uppercases adjustment.files (creature.factory.ts) and monsterFilesService
      // normalizes lookups to uppercase, but newFiles entries keep whatever case they were authored
      // with (e.g. "jatrea1") - compare case-insensitively to match.
      nf.files.some((f) => f.toUpperCase() === file.toUpperCase()),
    );
    if (newFile?.stringRef) return translationService.from(newFile.stringRef);
    return monsterFilesService.getName(file);
  }

  // Every card is titled by the creatures.csv / newFiles name its file(s) resolve to, but several
  // distinct files often resolve to the very same name (e.g. a carrion crawler's CARRIOSU and
  // BDCRAWMU are both "Mutated Crawler") - so the originating file(s) are always spelled out in
  // parentheses after a resolved name to keep otherwise-identical cards apart. Files sharing one
  // resolved name are grouped under it ("Skeleton Warrior (KRYSKEL1, KRYSKEL2)"); a file whose
  // name doesn't resolve, or resolves to the creature's own name, already *is* its own label and
  // gets no parenthetical.
  private getAdjustmentLabel(creature: Creature, files: string[]): string {
    const creatureName = translationService.from(creature.name).trim().toLowerCase();
    const filesByLabel = new Map<string, string[]>();
    const order: string[] = [];
    for (const file of files) {
      const resolved = this.getFileName(creature, file);
      const name =
        resolved && resolved.trim().toLowerCase() !== creatureName ? resolved : undefined;
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
    const traitLines = new Map<string, string>();
    for (const subName of item.immunities) {
      const sub = State.immunities.find((i) => i.name === subName);
      if (sub?.type === "trait" && sub.doc) {
        traitLines.set(translationService.fromOptional(sub.stringRef), sub.name);
      }
    }
    const lines = translationService.fromOptional(item.description).split(/\r\n|\n/);
    const html = lines
      .filter((line) => line !== "")
      .map((line) => {
        const traitName = traitLines.get(line);
        return traitName
          ? `<p><a href="#${traitName}" class="trait-link">${line}</a></p>`
          : `<p>${line}</p>`;
      })
      .join("");
    return changed ? `<div class="adjustment-changed">${html}</div>` : html;
  }

  getCreatureSpells(template: { text: string }, creature: Creature) {
    const entries = this.getResourceAbilities(creature)
      .map((ability, index) => ({
        ability,
        html: this.getCreatureSpell(
          ability,
          creature.data.spells.memorized,
          `m${creature.id}-ability-${index}`,
        ),
      }))
      .filter((entry) => entry.html);
    this.replace(template, "abilities", this.renderAbilitiesSection(`m${creature.id}`, entries));
  }

  // Shared by getCreatureSpells and getAdjustmentSpells: past ABILITY_TAB_THRESHOLD entries, a flat
  // list stops being readable (a caster built from spellService.createSpellbook(), e.g. the Cleric
  // Skeleton adjustment in lib/creatures/undead/skeletons.ts, can memorize several spells per level
  // across 7+ levels) - group into one tab per spell level instead.
  private renderAbilitiesSection(
    idPrefix: string,
    entries: { ability: CreatureAbility; html: string }[],
  ): string {
    if (!entries.length) return "";
    const body =
      entries.length > ABILITY_TAB_THRESHOLD
        ? this.getAbilityLevelTabs(idPrefix, entries)
        : `<div class="abilities">${entries.map((entry) => entry.html).join("")}</div>`;
    return `<h4>Abilities</h4>${body}`;
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

  private getSpellLevel(resource: string | undefined): number | undefined {
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
        let spells = "";
        abilities.forEach((ability, abilityIndex) => {
          spells += this.getCreatureSpell(
            ability,
            spellbook.memorized,
            `m${creature.id}-sb${index}-ability-${abilityIndex}`,
          );
        });
        return {
          id: `spellbook-m${creature.id}-${index}`,
          name: SPELLBOOK_MODS[spellbook.mod].name,
          spells,
        };
      })
      .filter((tab) => tab.spells);

    let result = "";
    if (tabs.length) {
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
      result = `<h4>Spellbooks</h4><div class="spellbook-tabs"><div class="spellbook-tab-buttons" role="tablist">${buttons}</div>${panels}</div>`;
    }
    this.replace(template, "spellbooks", result);
  }

  private getResourceAbilities(creature: Creature): CreatureAbility[] {
    return [
      ...creature.behavior.abilities,
      ...creature.behavior.customCodes.map((c) => c.abilities).flat(),
    ].filter((a) => a.resource);
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
      result = `<h5>${translationService.from(ability.name)} (${quantity})</h5>`;
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
