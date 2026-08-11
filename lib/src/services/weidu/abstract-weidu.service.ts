import { StringReference } from "../../model/final/stringref";
import { CodeLine } from "../../model/misc";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import utils from "../utils/utils.service";
import { AbstractCodeService } from "../abstract-code.service";

export class AbstractWeiduService extends AbstractCodeService {
  protected deleteEffect(lines: CodeLine[], tab: number, opcode: EffectTypeEnum) {
    this.add(lines, `LPF DELETE_CRE_EFFECT INT_VAR opcode_to_delete=${opcode} END`, tab);
  }

  protected addConditionalSourceRes(
    lines: CodeLine[],
    codes: string | string[],
    tab: number,
    files: string[],
    exclude: boolean,
  ) {
    codes = Array.isArray(codes) ? codes : [codes];
    if (!files.length) {
      for (const code of codes) this.add(lines, code, tab);
      return;
    }
    this.startConditionalSourceRes(lines, tab, files, exclude);
    for (const code of codes) this.add(lines, code, tab + 1);
    this.add(lines, "END", tab);
  }

  protected startConditionalSourceRes(
    lines: CodeLine[],
    tab: number,
    files: string[],
    exclude: boolean,
  ) {
    const fileEquals = files.map(
      (f) => `(${exclude ? "NOT " : ""}"%SOURCE_RES%" STRING_EQUAL_CASE ~${f}~)`,
    );
    this.add(lines, `PATCH_IF ${fileEquals.join(exclude ? " AND " : " OR ")} BEGIN `, tab);
  }

  protected write(
    lines: CodeLine[],
    offset: number,
    size: number,
    value: number | string | undefined,
    tab?: number,
  ) {
    if (!value) return;
    let code = `WRITE_BYTE 0x${offset.toString(16)} ${value}`;
    if (size === 2) code = `WRITE_SHORT 0x${offset.toString(16)} ${value}`;
    else if (size === 4) code = `WRITE_LONG 0x${offset.toString(16)} ${value}`;
    else if (size > 4) code = `WRITE_ASCII 0x${offset.toString(16)} ~${value}~ #${size}`;
    this.add(lines, code, tab);
  }

  protected writeAscii(
    lines: CodeLine[],
    offset: number,
    size: number,
    value: string | undefined,
    tab?: number,
  ) {
    if (!value) return;
    this.add(lines, `WRITE_ASCII 0x${offset.toString(16)} ~${value}~ #${size}`, tab);
  }

  protected writeStringRef(
    lines: CodeLine[],
    offset: number,
    stringRef: StringReference | undefined,
    tab?: number,
  ) {
    if (!stringRef) return;
    const value = utils.resolveStringRef(stringRef);
    this.write(lines, offset, 4, value, tab);
  }

  protected writeFlag(
    lines: CodeLine[],
    offset: number,
    _size: number,
    array: number[] | undefined,
    tab?: number,
  ) {
    if (!array) return;
    const value = array.reduce((sum, save) => {
      sum += 2 ** save;
      return sum;
    }, 0);
    this.write(lines, offset, 4, value, tab);
  }

  protected executeCodeWithExcludedFiles(
    lines: CodeLine[],
    tab: number,
    code: string,
    files: string[],
  ) {
    if (!files.length) {
      this.add(lines, code, tab);
      return;
    }
    const conditions = files.map((f) => `NOT "%SOURCE_RES%" STRING_EQUAL_CASE ~${f}~`);
    this.add(lines, `PATCH_IF ${conditions.join(" AND ")} BEGIN`, tab);
    this.add(lines, code, tab + 1);
    this.add(lines, "END", tab);
  }

  protected executeCodeWithIncludedFiles(
    lines: CodeLine[],
    tab: number,
    code: string,
    files: string[],
  ) {
    if (!files.length) return;
    const conditions = files.map((f) => `"%SOURCE_RES%" STRING_EQUAL_CASE ~${f}~`);
    this.add(lines, `PATCH_IF ${conditions.join(" OR ")} BEGIN`, tab);
    this.add(lines, code, tab + 1);
    this.add(lines, "END", tab);
  }

  protected getWrite(size: number) {
    if (size === 1) return "WRITE_BYTE";
    else if (size === 2) return "WRITE_SHORT";
    else return "WRITE_LONG";
  }
}
