import { CodeLine } from "../../model/misc";
import { EffectDispelResistanceEnum } from "../../model/spell-item/effect.enums";
import { Spell, SpellHeader } from "../../model/spell-item/spell-item";
import translationService from "../translation.service";
import utils from "../utils/utils.service";
import { AbstractWeiduService } from "./abstract-weidu.service";
import weiduEffectService from "./weidu-effect.service";
import weiduProjectileService from "./weidu-projectile.service";

class WeiduSpellService extends AbstractWeiduService {
  createSpells(lines: CodeLine[], spells: Spell[]) {
    for (const spell of spells) {
      this.createSpell(lines, spell, 0);
      this.add(lines, "");
    }
  }

  createSpell(lines: CodeLine[], spell: Spell, tab: number) {
    this.add(lines, `// ${translationService.from(spell.name)}`, tab);
    weiduEffectService.createEffectFiles(lines, spell.effectFiles, tab);
    for (const projectile of spell.projectiles) {
      weiduProjectileService.createProjectile(lines, projectile);
    }
    this.createSpellFileHeader(lines, spell, tab);
    this.add(lines, `COPY_EXISTING ~${spell.file}.SPL~  ~override~`, tab);
    this.createSpellCommon(lines, spell, tab + 1);
    this.addChangeSpellOptions(lines, spell, tab + 1);
    if (typeof spell.secondaryType === "string") {
      this.writeOpcodeType(lines, spell, tab);
    }
  }

  private createSpellFileHeader(lines: CodeLine[], spell: Spell, tab: number) {
    if (spell.copyFrom) {
      this.add(lines, `COPY_EXISTING ~${spell.copyFrom}.SPL~  ~override/${spell.file}.SPL~`, tab);
      if (spell.deleteHeaders === true) {
        this.add(lines, `LPF DELETE_SPELL_HEADER INT_VAR header_type="-1" END`, tab + 1);
      } else if (Array.isArray(spell.deleteHeaders)) {
        for (const level of spell.deleteHeaders)
          this.add(lines, `LPF DELETE_SPELL_HEADER STR_VAR min_level = ${level} END`, tab + 1);
      }
      for (const opcode of spell.deleteOpcodes ?? [])
        this.add(lines, `LPF DELETE_EFFECT INT_VAR match_opcode = ${opcode} END`, tab + 1);
    } else {
      this.add(lines, `CREATE SPL "${spell.file}"`, tab);
      this.write(lines, 0x64, 4, "0x72", tab + 1);
    }
  }

  private addChangeSpellOptions(lines: CodeLine[], spell: Spell, tab: number) {
    if (!spell.options) return;
    const type = spell.options.spellType !== undefined ? `type=${spell.options.spellType}` : "";
    const ctime = spell.options.castingTime !== undefined ? "ctime=1" : "";
    const rinvs = spell.options.removeInvisbilityOnCast !== undefined ? "rinvs=1" : "";
    const renew = spell.options.renew !== undefined ? `renew=${spell.options.renew}` : "";
    this.add(lines, `LPF CHANGE_SPELL INT_VAR ${type} ${ctime} ${rinvs} ${renew} END`, tab);
  }

  private writeOpcodeType(lines: CodeLine[], spell: Spell, tab: number) {
    let type = "PoisonSecType";
    if (spell.secondaryType === "Disease") type = "DiseaseSecType";
    else if (spell.secondaryType === "Fear") type = "FearSecType";
    this.add(lines, `OUTER_SET $f_AddSecType(${spell.file}.spl) = ${type}`, tab);
  }

  private createSpellCommon(lines: CodeLine[], spell: Spell, tab: number) {
    this.writeStringRef(lines, 0x8, spell.name, tab);
    this.write(lines, 0x10, 8, spell.castingSound, tab);
    this.writeFlag(lines, 0x18, 4, spell.flags, tab);
    this.write(lines, 0x1c, 2, spell.type, tab);
    this.writeFlag(lines, 0x1e, 4, spell.exclusionFlags, tab);
    this.write(lines, 0x22, 2, spell.castingAnimation, tab);
    this.write(lines, 0x25, 1, spell.primaryType, tab);
    if (typeof spell.secondaryType === "number") {
      this.write(lines, 0x27, 1, spell.secondaryType, tab);
    } else if (typeof spell.secondaryType === "string") {
      this.write(lines, 0x27, 1, `fl#${spell.secondaryType}`, tab);
    }
    this.write(lines, 0x34, 4, spell.level, tab);
    this.write(lines, 0x3a, 8, spell.icon, tab);
    this.writeStringRef(lines, 0x50, spell.description, tab);
    for (const effect of spell.effects) {
      weiduEffectService.addEffect({
        lines,
        tab,
        effect,
        // spell.level is typed as always-set, but spellService.getSpell() leaves it genuinely
        // undefined for a copyFrom spell - see weidu-spell.service.test.ts's "level: undefined"
        // cases.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        power: spell.level ?? 0,
        type: "SPL",
        global: true,
      });
    }
    for (const [index, header] of spell.headers.entries()) {
      this.createSpellHeader(lines, spell, header, index, tab);
    }
  }

  private createSpellHeader(
    lines: CodeLine[],
    spell: Spell,
    header: SpellHeader,
    index: number,
    tab: number,
  ) {
    const intVars: string[] = [`type=${header.type}`];
    if (header.location) intVars.push(`location=${header.location}`);
    if (header.target) intVars.push(`target=${header.target}`);
    if (header.range) intVars.push(`range=${header.range}`);
    if (header.minLevel) intVars.push(`required_level=${header.minLevel}`);
    if (header.speed) intVars.push(`speed=${header.speed}`);
    if (header.projectile) {
      if (typeof header.projectile !== "string") throw new Error(`Unhandled projectile!`);
      intVars.push(`projectile=(IDS_OF_SYMBOL (~projectl~ ~${header.projectile}~)) + 1`);
    }
    const icon = header.icon ? ` STR_VAR icon="${header.icon}"` : "";
    this.add(lines, `LPF ADD_SPELL_HEADER INT_VAR ${intVars.join(" ")}${icon} END`, tab);
    if (header.immunityEffect) {
      for (const name of header.immunityEffect.names) {
        this.add(
          lines,
          `LPF ${utils.getImmunityFunctionName(name)} INT_VAR duration=${
            header.immunityEffect.duration
          } dispelResistance=${
            header.immunityEffect.dispelResistance ?? EffectDispelResistanceEnum.NaturalNonMagical
          } END`,
          tab,
        );
      }
    }
    for (const effect of header.effects) {
      weiduEffectService.addEffect({
        lines,
        tab,
        effect,
        // same reasoning as createSpell()'s power fallback above.
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        power: spell.level ?? 0,
        header: index + 1,
        type: "SPL",
        global: false,
      });
    }
  }
}

const weiduSpellService = new WeiduSpellService();
export default weiduSpellService;
