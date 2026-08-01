import { GLOBAL_CONFIG } from "../../../config/generate";
import { SPELL_GROUPS } from "../../../config/spells/spell-group";
import { SPELL_FUNCTIONS } from "../../../spells";
import { CR, TAB } from "../../model/constants";
import { ImmunityConfig } from "../../model/final/immunity";
import { CodeLine } from "../../model/misc";
import { SpellGroup } from "../../model/spell-item/spell-group";
import { Effect } from "../../model/spell-item/effect";
import { Spell } from "../../model/spell-item/spell-item";
import { State } from "../../state";
import utils from "../utils/utils.service";
import { AbstractWeiduService } from "./abstract-weidu.service";
import weiduCoreService from "./weidu-core.service";
import weiduSpellService from "./weidu-spell.service";
import weiduUtils from "../utils/weidu.utils";
import { SPELL_PROTECTIONS } from "../../../config/spells/spell-protection";
import { SpellProtectionStat } from "../../model/spell-item/spell-protection";

class WeiduFunctionService extends AbstractWeiduService {
  generateSpellResources(): void {
    const lines = this.initLines();
    for (const group of SPELL_GROUPS) {
      this.generateSpellResource(lines, group, 0);
    }
    const content = lines.map((l) => `${TAB.repeat(l.tab)}${l.code}`).join(CR);
    utils.writeFile(GLOBAL_CONFIG.files.spellResources, content);
  }

  generateSpellFunctions(): void {
    const lines = this.initLines();
    const spells = SPELL_FUNCTIONS;
    for (const spell of spells) {
      this.generateSpellFunction(lines, spell, 0);
    }
    const content = lines.map((l) => `${TAB.repeat(l.tab)}${l.code}`).join(CR);
    utils.writeFile(GLOBAL_CONFIG.files.spellFunctions, content);
  }

  generateImmunities(): void {
    const lines = this.initLines();
    this.generateProtectionSpells(lines);
    for (const immunity of State.immunities) {
      this.generateImmunityFunction(lines, immunity, 0);
    }
    const content = lines.map((l) => `${TAB.repeat(l.tab)}${l.code}`).join(CR);
    utils.writeFile(GLOBAL_CONFIG.files.immunities, content);
  }

  generateProtectionSpells(lines: CodeLine[]) {
    this.add(lines, `DEFINE_ACTION_MACRO load_splprot BEGIN`, 0);
    for (const sp of SPELL_PROTECTIONS) {
      const file = utils.getIdsFileFromSpellProtectionStat(sp.stat as SpellProtectionStat);
      let value = `value=${sp.value ?? -1}`;
      if (typeof sp.value === "string" && !/\d+/.test(sp.value) && file) {
        this.add(lines, `OUTER_SET value=IDS_OF_SYMBOL (~${file}~ ~${sp.value}~)`, 1);
        value = "value";
      }
      let stat = `stat=${sp.stat}`;
      if (typeof sp.stat === "string" && !sp.stat.startsWith("0x")) {
        this.add(lines, `OUTER_SET stat=IDS_OF_SYMBOL (~stats~ ~${sp.stat}~)`, 1);
        stat = "stat";
      }
      this.add(
        lines,
        `LAF ADD_SPLPROT_ENTRY INT_VAR ${stat} STR_VAR ${value} relation="${sp.relation}" RET index END`,
        1,
      );
      // name is optional on BaseSpellProtection generally, but every SPELL_PROTECTIONS entry sets
      // it (it's the whole point of the entry - the macro variable index gets assigned to).
      if (!sp.name) throw new Error(`SPELL_PROTECTIONS entry has no name: ${JSON.stringify(sp)}`);
      this.add(lines, `ACTION_IF (index >= 0) BEGIN`, 1);
      this.add(lines, `OUTER_SET ${sp.name}=index - 1`, 2);
      this.add(lines, `END`, 1);
    }
    this.add(lines, `END`, 0);
    this.add(lines, `LAM load_splprot`, 0);
    this.add(lines, ``, 0);
  }

  private generateSpellFunction(lines: CodeLine[], spell: Spell, tab: number): void {
    this.add(lines, `DEFINE_ACTION_FUNCTION ${utils.getSpellFunctionName(spell)} BEGIN`, tab);
    weiduSpellService.createSpell(lines, spell, 1);
    this.add(lines, `END`, tab);
    this.add(lines, ``, tab);
  }

  private generateSpellResource(lines: CodeLine[], group: SpellGroup, tab: number): void {
    const spells = group.spells ?? [];
    // add new created spells when a group has been specified
    for (const spell of State.spells) {
      if (spell.groups.includes(group.name)) spells.push(spell.file);
    }
    const idsSpells = group.idsSpells ?? [];
    this.add(
      lines,
      `DEFINE_ACTION_FUNCTION ${utils.getSpellResourceFunctionName(
        group,
      )} RET_ARRAY resources BEGIN`,
      tab,
    );
    this.add(lines, `ACTION_DEFINE_ARRAY spells BEGIN`, tab + 1);
    for (const spell of spells) {
      this.add(lines, `"${spell}"`, tab + 2);
    }
    this.add(lines, `END`, tab + 1);
    this.add(
      lines,
      `ACTION_DEFINE_ARRAY ids BEGIN ${idsSpells.map((i) => i.id).join(" ")} END`,
      tab + 1,
    );
    this.add(
      lines,
      `LAF MERGE_SPELL_ARRAY_WITH_IDS STR_VAR ids spells RET_ARRAY resources=spells END`,
      tab + 1,
    );
    let index = spells.length + idsSpells.length;
    for (const [i, spell] of idsSpells.entries()) {
      if (spell.suffixes) {
        this.add(lines, `OUTER_SPRINT res $resources(${spells.length + i})`, tab + 1);
        for (const suffix of spell.suffixes) {
          this.add(lines, `OUTER_SPRINT $resources(${index}) ~%res%${suffix}~`, tab + 1);
          index++;
        }
      }
    }
    this.add(lines, `END`, tab);
    this.add(lines, ``);
  }

  generateImmunityFunction(lines: CodeLine[], immunity: ImmunityConfig, tab: number): void {
    const fnName = utils.getImmunityFunctionName(immunity);
    this.add(lines, `DEFINE_PATCH_FUNCTION ${fnName}`, tab);
    this.add(lines, `INT_VAR`, tab);
    this.add(lines, `resist_dispel=0`, tab + 1);
    this.add(lines, `duration=0`, tab + 1);
    this.add(lines, `BEGIN`, tab);
    if (this.hasImmunityFunctionCallContent(immunity)) {
      // this.add(lines, `PATCH_PRINT ~${fnName}~`, tab + 1);
      this.callImmunityFunction(lines, immunity, tab + 1);
    }
    for (const effect of immunity.effects) {
      this.generateEffect(lines, effect, tab + 1);
    }
    for (const type of immunity.immunities) {
      this.add(
        lines,
        `LPF ${utils.getImmunityFunctionName(type)} INT_VAR resist_dispel duration END`,
        tab + 1,
      );
    }
    this.add(lines, `END`, tab);
    this.add(lines, ``);
    if (immunity.itemSlot) weiduCoreService.generateItem(immunity.itemSlot, immunity);
  }

  private hasImmunityFunctionCallContent(immunity: ImmunityConfig): boolean {
    const lists = [
      immunity.preventEffects,
      immunity.preventIcons,
      immunity.strings,
      immunity.spellGroups,
      immunity.animations,
    ];
    return lists.some((list) => list.length > 0);
  }

  callImmunityFunction(lines: CodeLine[], immunity: ImmunityConfig, tab: number): void {
    const spells = this.generateSpells(lines, immunity, tab);
    const effects = immunity.preventEffects.length
      ? ` effects="${immunity.preventEffects.join(" ")}"`
      : "";
    const icons = immunity.preventIcons.length
      ? ` prevent_icons="${immunity.preventIcons.join(" ")}"`
      : "";
    const displayIcons = immunity.displayIcons.length
      ? ` display_icons="${immunity.displayIcons.join(" ")}"`
      : "";
    const strings = immunity.strings.length ? ` strings="${immunity.strings.join(" ")}"` : "";
    const animations = immunity.animations.length
      ? ` animations="${immunity.animations.join(" ")}"`
      : "";
    const display = immunity.displaySpellIneffective ? " displaySpellIneffective=1" : "";
    this.add(
      lines,
      `LPF ADD_IMMUNITY_CRE_ITM_SPL INT_VAR resist_dispel duration ${display} STR_VAR${effects}${icons}${displayIcons}${strings}${animations}${spells} END`,
      tab,
    );
  }

  generateEffect(lines: CodeLine[], effect: Effect, tab: number): void {
    const parameter1 = effect.parameter1
      ? ` parameter1=${weiduUtils.getIntegerValue(effect.parameter1) ?? ""}`
      : "";
    const parameter2 = effect.parameter2
      ? ` parameter2=${weiduUtils.getIntegerValue(effect.parameter2) ?? ""}`
      : "";
    const special = effect.special
      ? ` special=${weiduUtils.getIntegerValue(effect.special) ?? ""}`
      : "";
    const resource = effect.resource ? ` STR_VAR resource="${effect.resource}"` : "";
    const line = `LPF ADD_EFFECT_CRE_ITM_SPL INT_VAR resist_dispel duration opcode=${effect.opcode}${parameter1}${parameter2}${special}${resource} END`;
    this.add(lines, line, tab);
  }

  generateSpells(lines: CodeLine[], immunity: ImmunityConfig, tab: number): string {
    if (!immunity.spellGroups.length) return "";
    this.add(lines, `INNER_ACTION BEGIN`, tab);
    let index = 0;
    const arrays: string[] = [];
    if (immunity.spellGroups.length === 1) {
      this.add(
        lines,
        `LAF ${utils.getSpellResourceFunctionName(
          immunity.spellGroups[0],
        )} RET_ARRAY spells=resources END`,
        tab + 1,
      );
    } else {
      for (const groupName of immunity.spellGroups) {
        index++;
        const array = `array${index}`;
        arrays.push(array);
        this.add(
          lines,
          `LAF ${utils.getSpellResourceFunctionName(groupName)} RET_ARRAY ${array}=resources END`,
          tab + 1,
        );
      }
      this.add(
        lines,
        `LAF MERGE_ARRAYS STR_VAR ${arrays.join(" ")} RET_ARRAY spells=array END`,
        tab + 1,
      );
    }
    this.add(lines, `END`, tab);
    return " spells";
  }
}

const weiduFunctionService = new WeiduFunctionService();
export default weiduFunctionService;
