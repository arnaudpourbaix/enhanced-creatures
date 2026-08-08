import * as fs from "fs";
import { MonsterFamilyEnum } from "../../../creatures/monster";
import { SPELLBOOK_MODS } from "../../../config/mods";
import { CreatureAbility } from "../../model/creature/ability";
import { CR } from "../../model/constants";
import { Creature } from "../../model/creature/creature";
import { MemorizedSpell } from "../../model/creature/data";
import { Family } from "../../model/creature/family";
import { ImmunityConfig } from "../../model/final/immunity";
import { State } from "../../state";
import creatureService from "../creature.service";
import itemService from "../item.service";
import logService from "../log.service";
import translationService from "../translation.service";
import utils from "../utils/utils.service";

class DocumentationService {
  private families: string[] = [];
  private monsters: string[] = [];

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
    this.replace(template, "traits", this.getTraits());
    try {
      utils.writeFile("docs/monsters.html", template.text);
    } catch (e) {
      throw new Error(`Failed to write documentation to docs/monsters.html`, {
        cause: e,
      });
    }
  }

  getFamilyMenu(family: Family): string {
    const links = family.creatures
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
    for (const creature of family.creatures) {
      this.addCreature(creature);
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
    this.replace(template, "name", translationService.from(creature.name));
    this.replace(template, "str", str);
    this.replace(template, "dex", creature.data.dexterity);
    this.replace(template, "con", creature.data.constitution);
    this.replace(template, "int", creature.data.intelligence);
    this.replace(template, "wis", creature.data.wisdom);
    this.replace(template, "cha", creature.data.charisma);
    this.replace(template, "align", creature.data.alignment);
    this.replace(template, "ac", creatureService.getFinalArmorClass(creature));
    this.replace(template, "movement", creature.data.movement.pnpValue);
    this.replace(
      template,
      "hitDice",
      `${creature.data.level1.pnpValue} (${creature.data.hp ?? 0} hp)`,
    );
    this.replace(template, "thac0", creature.data.thac0);
    this.replace(template, "apr", this.getEffectiveApr(creature));
    this.replace(template, "size", creature.data.size);
    this.addSpecial(template, creature);
    this.replace(template, "morale", creature.data.morale);
    this.replace(template, "xp", creature.data.xpv);
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
    return stored + (creature.attack.dualWielding ? 1 : 0);
  }

  addSpecial(template: { text: string }, creature: Creature) {
    let special = "";
    if (creature.data.level1.type === "caster") {
      special += `Cast spells as a level ${creature.data.level1.value} caster`;
    } else if (creature.data.level1.type === "turn") {
      special += `Turned as a level ${creature.data.level1.value} undead`;
    }
    if (special) {
      special = `<div class="stat"><dt>Special</dt><dd>${special}</dd></div>`;
    }
    this.replace(template, "special", special);
  }

  getCreatureAttacks(template: { text: string }, creature: Creature) {
    let attacks = "";
    let weaponIndex = 0;
    for (const equippedItem of creature.data.items.equipped) {
      if (itemService.isEquippedWeapon(equippedItem)) {
        const weapon = State.items.find((i) => i.file === equippedItem.file);
        if (weapon?.doc) {
          const entries: { id: string; html: string }[] = [];
          const text = this.getAttackDisplayText(
            translationService.fromOptional(weapon.description),
            entries,
            `m${creature.id}-w${weaponIndex}`,
          );
          attacks += attacks ? "<hr/>" : "";
          attacks += `<div class="weapon">${text}</div>`;
          attacks += entries
            .map((e) => `<div class="spell-popover-entry" id="${e.id}" hidden>${e.html}</div>`)
            .join("");
          weaponIndex++;
        }
      }
    }
    if (!attacks) {
      attacks = `<div class="weapon">By weapon</div>`;
    }
    this.replace(template, "attacks", attacks);
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
    if (lines.length > 1 && lines[1] === "") {
      lines = lines.slice(2);
    }
    const enchantmentIndex = lines.findIndex((l) => /^Enchantment: \d+$/.test(l));
    const enchantment =
      enchantmentIndex >= 0 ? /\d+/.exec(lines[enchantmentIndex])?.[0] : undefined;
    let filtered = lines.filter(
      (l, i) => i !== enchantmentIndex && l !== "" && !/^(THAC0|Speed Factor|Range): /.test(l),
    );
    const damageIndex = filtered.findIndex((l) => /^(Melee|Ranged) damage: /.test(l));
    if (damageIndex >= 0) {
      let line = filtered[damageIndex]
        .replace(/^(Melee|Ranged) damage: /, "")
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
    for (let i = 0; i < lines.length; i++) {
      const match = /^Cast spell (.+?)( \([^)]*\))?:$/.exec(lines[i]);
      if (!match) {
        result.push(lines[i]);
        continue;
      }
      const [, name, condition] = match;
      const descLines: string[] = [];
      let j = i + 1;
      while (j < lines.length && !lines[j].startsWith("Cast spell ")) {
        descLines.push(lines[j]);
        j++;
      }
      const id = `${idPrefix}-spell-${spellIndex++}`;
      entries.push({ id, html: this.buildSpellDescriptionHtml(descLines) });
      result.push(`<a href="#${id}" class="trait-link">${name}</a>${condition ?? ""}`);
      i = j - 1;
    }
    return result;
  }

  // Renders a spell's description lines as paragraphs, so line breaks (e.g. between a lead-in
  // sentence and the list that follows it) survive instead of being flattened into one run-on
  // paragraph. Consecutive "- " prefixed lines become a single <ul>, since that prefix is how
  // effect lists (e.g. Grab's "- can not move" / "- -4 THAC0") are written in the plain-text
  // in-game description - the "- " marks the bullet, any further hyphen (as in "-4 THAC0") is
  // just part of the item's own text and is left untouched.
  private buildSpellDescriptionHtml(descLines: string[]): string {
    const html: string[] = [];
    let bullets: string[] = [];
    const flushBullets = () => {
      if (bullets.length) {
        html.push(`<ul>${bullets.map((b) => `<li>${b}</li>`).join("")}</ul>`);
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
        const desc = translationService.fromOptional(item.description);
        result += `<div>${desc}</div>`;
      }
    }
    for (const immunity of immunities.filter((i) => i.type !== "trait")) {
      let text = translationService.fromOptional(immunity.stringRef);
      if (immunity.description) {
        text = `<h5>${text}</h5><p>${translationService.from(immunity.description)}</p>`;
      }
      result += text;
    }
    if (result) {
      result = `<div class="detail-section"><h4>Traits</h4><div class="traits">${result}</div></div>`;
    }
    this.replace(template, "traits", result);
  }

  getCreatureSpells(template: { text: string }, creature: Creature) {
    let spells = "";
    this.getResourceAbilities(creature).forEach((ability, index) => {
      spells += this.getCreatureSpell(
        ability,
        creature.data.spells.memorized,
        `m${creature.id}-ability-${index}`,
      );
    });
    if (spells) {
      spells = `<h4>Abilities</h4><div class="abilities">${spells}</div>`;
    }
    this.replace(template, "abilities", spells);
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

  getCreatureSpell(ability: CreatureAbility, memorizedList: MemorizedSpell[], idPrefix: string) {
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
        popoverEntry = `<div class="spell-popover-entry" id="${id}" hidden>${this.buildSpellDescriptionHtml(description.split(/\r\n|\n/))}</div>`;
        result = `<h5><a href="#${id}" class="trait-link">${name}</a> (${quantity})</h5>`;
      } else {
        result = `<h5>${name} (${quantity})</h5>`;
      }
    } else if (memorized) {
      // A real daily memorized count (spellbook-granted spells always have one) is authoritative
      // - ability.timer is a re-cast cooldown, not a substitute for it, so it's ignored here.
      // The renew/infiniteUse-driven "every N rounds" phrasing above is for the innate-ability
      // case instead, where casts aren't capped by a memorized daily count at all.
      result = `<h5>${translationService.from(
        ability.name,
      )} (${this.getSpellQuantity(memorized.memorizedCount)})</h5>`;
    }
    if (!result) return "";
    // Wrapped so a multi-column layout (see .spellbook-tab-panel in monsters.css) can keep each
    // ability's title together instead of splitting it across columns.
    return `<div class="ability-entry">${result}</div>${popoverEntry}`;
  }

  getTraits() {
    let result = "";
    // State.immunities is sorted once when loaded (see stateService.loadImmunities()) - both
    // this trait listing and weiduFunctionService's generated function order rely on that same
    // invariant rather than either one re-sorting (or silently depending on the other having
    // sorted first).
    for (const immunity of State.immunities) {
      if (immunity.type === "trait" && immunity.doc) {
        let entry = `<h5>${translationService.fromOptional(immunity.stringRef)}</h5>`;
        if (immunity.description) {
          entry += `<p>${translationService.from(immunity.description)}</p>`;
        }
        result += `<div class="trait-entry" id="${immunity.name}">${entry}</div>`;
      }
    }
    return result;
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
}

const documentationService = new DocumentationService();
export default documentationService;
