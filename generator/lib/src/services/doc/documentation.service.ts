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
    this.replace(template, "apr", creature.data.apr * (creature.data.doubleApr ? 2 : 1));
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
    for (const equippedItem of creature.data.items.equipped) {
      if (itemService.isEquippedWeapon(equippedItem)) {
        const weapon = State.items.find((i) => i.file === equippedItem.file);
        if (weapon?.doc) {
          attacks += attacks ? "<hr/>" : "";
          attacks += `<div class="weapon">${this.getAttackDisplayText(
            translationService.fromOptional(weapon.description),
          )}</div>`;
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
  // THAC0/Speed Factor/Range, and folds the enchantment into the damage line - the name is
  // redundant with the attack's own heading in the monster page, the blank lines (e.g. before
  // "Cast spell ...") were only needed to visually separate sections of the longer in-game text,
  // and the numbers are covered elsewhere. The in-game description itself is left untouched.
  getAttackDisplayText(description: string): string {
    if (!description) return description;
    let lines = description.split(CR);
    if (lines.length > 1 && lines[1] === "") {
      lines = lines.slice(2);
    }
    const enchantmentIndex = lines.findIndex((l) => /^Enchantment: \d+$/.test(l));
    const enchantment =
      enchantmentIndex >= 0 ? /\d+/.exec(lines[enchantmentIndex])?.[0] : undefined;
    const filtered = lines.filter(
      (l, i) => i !== enchantmentIndex && l !== "" && !/^(THAC0|Speed Factor|Range): /.test(l),
    );
    const damageIndex = filtered.findIndex((l) => /^(Melee|Ranged) damage: /.test(l));
    if (damageIndex >= 0) {
      let line = filtered[damageIndex].replace(/^(Melee|Ranged) damage: /, "");
      if (enchantment) line += ` at +${enchantment}`;
      filtered[damageIndex] = line;
    } else if (enchantment) {
      filtered.push(`Enchantment: +${enchantment}`);
    }
    return filtered.join(CR);
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
    for (const ability of this.getResourceAbilities(creature)) {
      spells += this.getCreatureSpell(ability, creature.data.spells.memorized);
    }
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
        for (const ability of abilities) {
          spells += this.getCreatureSpell(ability, spellbook.memorized);
        }
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

  getCreatureSpell(ability: CreatureAbility, memorizedList: MemorizedSpell[]) {
    const memorized = memorizedList.find((m) => m.file === ability.resource);
    const spell = State.spells.find((s) => s.file === ability.resource);
    let result = "";
    const infiniteUse = ability.infiniteUse ? 1 : undefined;
    if (spell && spell.doc && memorized) {
      const rounds = spell.options?.renew ?? infiniteUse;
      const title = `<h5>${translationService.from(
        spell.name,
      )} (${this.getSpellQuantity(memorized.memorizedCount, rounds)})</h5>`;
      const desc =
        spell.doc !== "name" ? `<p>${translationService.fromOptional(spell.description)}</p>` : "";
      result = `${title}${desc}`;
    } else if (memorized) {
      // A real daily memorized count (spellbook-granted spells always have one) is authoritative
      // - ability.timer is a re-cast cooldown, not a substitute for it, so it's ignored here.
      // The renew/infiniteUse-driven "every N rounds" phrasing above is for the innate-ability
      // case instead, where casts aren't capped by a memorized daily count at all.
      result = `<h5>${translationService.from(
        ability.name,
      )} (${this.getSpellQuantity(memorized.memorizedCount)})</h5>`;
    }
    // Wrapped so a multi-column layout (see .spellbook-tab-panel in monsters.css) can keep each
    // ability's title and description together instead of splitting them across columns.
    return result ? `<div class="ability-entry">${result}</div>` : "";
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
