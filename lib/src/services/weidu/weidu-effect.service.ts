import { CodeLine } from "../../model/misc";
import { Effect, EffectFile } from "../../model/spell-item/effect";
import { EffectTargetEnum } from "../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import weiduUtils from "../utils/weidu.utils";
import { AbstractWeiduService } from "./abstract-weidu.service";

class WeiduEffectService extends AbstractWeiduService {
  createEffectFiles(lines: CodeLine[], effectFiles: EffectFile[], tab = 0) {
    for (const effect of effectFiles) {
      this.add(lines, `CREATE EFF "${effect.file}"`, tab);
      this.write(lines, 0x10, 4, effect.opcode, tab + 1);
      this.write(lines, 0x14, 4, effect.target, tab + 1);
      this.write(lines, 0x1c, 4, weiduUtils.getIntegerValue(effect.parameter1), tab + 1);
      this.write(lines, 0x24, 4, effect.timing, tab + 1);
      this.write(lines, 0x20, 4, weiduUtils.getIntegerValue(effect.parameter2), tab + 1);
      this.write(lines, 0x28, 4, effect.duration, tab + 1);
      this.write(lines, 0x2c, 2, effect.probability1, tab + 1);
      this.writeAscii(lines, 0x30, 8, effect.resource, tab + 1);
      if (typeof effect.special === "number") {
        this.write(lines, 0x48, 4, weiduUtils.getIntegerValue(effect.special), tab + 1);
      }
      this.write(lines, 0x5c, 4, effect.dispelResistance, tab + 1);
      this.write(lines, 0x60, 4, weiduUtils.getIntegerValue(effect.parameter3), tab + 1);
      this.write(lines, 0x64, 4, weiduUtils.getIntegerValue(effect.parameter4), tab + 1);
      this.add(lines, "", tab);
    }
  }

  addEffect({
    lines,
    tab,
    effect,
    power,
    header,
    type,
    global,
  }: {
    lines: CodeLine[];
    tab: number;
    effect: Effect;
    power?: number;
    header?: number;
    type: "SPL" | "ITM" | "CRE";
    global: boolean;
  }) {
    const has2da = this.has2daLookup({ lines, tab, effect });
    if (has2da) {
      this.add(lines, `PATCH_IF row != "-1" BEGIN`, tab);
      tab++;
    }
    let fn = "ADD_EFFECT";
    if (global && type === "ITM") fn = "ADD_ITEM_EQEFFECT";
    else if (type === "CRE") fn = "ADD_CRE_EFFECT";
    const intVars: string[] = [
      `opcode=${effect.opcode}`,
      // target is always set by effectService.getEffect()'s setDefaultEffectValues() by the time
      // a real effect reaches here, but addEffect() is public and doesn't require going through
      // that path - default matches setDefaultEffectValues()'s own fallback.
      `target=${effect.target ?? EffectTargetEnum.PresetTarget}`,
    ];
    if (header) intVars.unshift(`header=${header}`);
    if (global) intVars.push("global=1");
    // effect.power/power can't both be undefined here (the guard above requires one to be
    // truthy), but `??` can't prove that to the type checker across two independent operands.
    if (!!effect.power || !!power) intVars.push(`power=${effect.power ?? power ?? 0}`);
    this.addParameterIntVars(intVars, effect);
    this.addSimpleIntVars(intVars, effect);
    this.addSaveAndFlagIntVars(intVars, effect);
    const strVar = effect.resource ? ` STR_VAR resource="${effect.resource}"` : "";
    this.add(lines, `LPF ${fn} INT_VAR ${intVars.join(" ")}${strVar} END`, tab);
    if (has2da) {
      this.add(lines, `END`, tab - 1);
    }
  }

  private addParameterIntVars(intVars: string[], effect: Effect) {
    if (effect.parameter1 && effect.parameter1 !== "0") {
      intVars.push(`parameter1=${weiduUtils.getIntegerValue(effect.parameter1) ?? ""}`);
    }
    if (effect.parameter2 && effect.parameter2 !== "0") {
      intVars.push(`parameter2=${weiduUtils.getIntegerValue(effect.parameter2) ?? ""}`);
    }
    if (effect.parameter3 && effect.parameter3 !== "0") {
      intVars.push(`parameter3=${weiduUtils.getIntegerValue(effect.parameter3) ?? ""}`);
    }
    if (effect.parameter4 && effect.parameter4 !== "0") {
      intVars.push(`parameter4=${weiduUtils.getIntegerValue(effect.parameter4) ?? ""}`);
    }
  }

  private addSimpleIntVars(intVars: string[], effect: Effect) {
    if (effect.timing) intVars.push(`timing=${effect.timing}`);
    if (effect.dispelResistance) intVars.push(`resist_dispel=${effect.dispelResistance}`);
    if (effect.duration) intVars.push(`duration=${effect.duration}`);
    if (effect.probability1) intVars.push(`probability1=${effect.probability1}`);
    if (effect.probability2) intVars.push(`probability2=${effect.probability2}`);
    if (effect.diceSize) intVars.push(`dicesize=${effect.diceSize}`);
    if (effect.diceThrown) intVars.push(`dicenumber=${effect.diceThrown}`);
  }

  private addSaveAndFlagIntVars(intVars: string[], effect: Effect) {
    if (effect.saveTypes) {
      const savingthrow = effect.saveTypes.reduce((sum, save) => sum + 2 ** save, 0);
      intVars.push(`savingthrow=${savingthrow}`);
    }
    if (effect.saveBonus) intVars.push(`savebonus="${effect.saveBonus}"`);
    if (effect.flags !== undefined) {
      const special =
        typeof effect.flags === "number"
          ? effect.flags
          : effect.flags.reduce((sum, save) => sum + 2 ** save, 0);
      intVars.push(`special=${special}`);
    } else if (effect.special) {
      intVars.push(`special=${effect.special}`);
    }
  }

  has2daLookup({
    lines,
    tab,
    effect,
  }: {
    lines: CodeLine[];
    tab: number;
    effect: Effect;
  }): boolean {
    // col/param are never reassigned today, but converting to const makes TS treat `param === 1`
    // below as a compile error against the literal type `2`.
    // eslint-disable-next-line prefer-const
    let col = 0;
    let file = "";
    // eslint-disable-next-line prefer-const
    let param = 2;
    if (effect.opcode === EffectTypeEnum.RemoveSpellTypeProtections) {
      file = "msectype";
    }
    if (!file) return false;
    this.add(
      lines,
      `LPF GET_2DA_ENTRY_OF INT_VAR col_match=${col} STR_VAR file=~${file}~ entry_match=~${
        (param === 1 ? effect.parameter1 : effect.parameter2) ?? ""
      }~ RET row col END`,
      tab,
    );
    if (param === 1) effect.parameter1 = "row";
    else effect.parameter2 = "row";
    return true;
  }
}

const weiduEffectService = new WeiduEffectService();
export default weiduEffectService;
