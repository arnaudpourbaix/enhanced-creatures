import { describe, expect, it } from "vitest";
import { CodeLine } from "../../model/misc";
import { Effect, EffectFile } from "../../model/spell-item/effect";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import weiduEffectService from "./weidu-effect.service";

function codes(lines: CodeLine[]): string[] {
  return lines.map((l) => l.code);
}

function fakeEffect(p: Partial<Effect> = {}): Effect {
  return {
    opcode: EffectTypeEnum.Damage,
    target: 1,
    ...p,
  } as Effect;
}

describe("createEffectFiles", () => {
  it("writes the special field when it's a number", () => {
    const lines: CodeLine[] = [];
    weiduEffectService.createEffectFiles(lines, [
      { file: "eff01", special: 5 } as unknown as EffectFile,
    ]);
    expect(codes(lines).some((c) => c.includes("0x48") && c.includes("5"))).toBe(true);
  });

  it("does not write the special field when it's not a number", () => {
    const lines: CodeLine[] = [];
    weiduEffectService.createEffectFiles(lines, [{ file: "eff01" } as unknown as EffectFile]);
    expect(codes(lines).some((c) => c.includes("0x48"))).toBe(false);
  });
});

describe("addEffect", () => {
  it("uses ADD_ITEM_EQEFFECT for a global ITM effect", () => {
    const lines: CodeLine[] = [];
    weiduEffectService.addEffect({
      lines,
      tab: 0,
      effect: fakeEffect(),
      type: "ITM",
      global: true,
    });
    expect(codes(lines)[0]).toContain("ADD_ITEM_EQEFFECT");
  });

  it("uses ADD_EFFECT for a global non-ITM, non-CRE effect (SPL)", () => {
    const lines: CodeLine[] = [];
    weiduEffectService.addEffect({
      lines,
      tab: 0,
      effect: fakeEffect(),
      type: "SPL",
      global: true,
    });
    expect(codes(lines)[0]).toContain("LPF ADD_EFFECT");
  });

  it("uses ADD_CRE_EFFECT for a CRE effect", () => {
    const lines: CodeLine[] = [];
    weiduEffectService.addEffect({
      lines,
      tab: 0,
      effect: fakeEffect(),
      type: "CRE",
      global: false,
    });
    expect(codes(lines)[0]).toContain("ADD_CRE_EFFECT");
  });

  it("uses ADD_EFFECT for a non-global ITM effect", () => {
    const lines: CodeLine[] = [];
    weiduEffectService.addEffect({
      lines,
      tab: 0,
      effect: fakeEffect(),
      type: "ITM",
      global: false,
    });
    expect(codes(lines)[0]).toContain("LPF ADD_EFFECT");
  });

  it("includes parameter3 when set to a non-'0' value", () => {
    const lines: CodeLine[] = [];
    weiduEffectService.addEffect({
      lines,
      tab: 0,
      effect: fakeEffect({ parameter3: "5" }),
      type: "SPL",
      global: false,
    });
    expect(codes(lines)[0]).toContain("parameter3=5");
  });

  it("omits parameter3 when it's the string '0'", () => {
    const lines: CodeLine[] = [];
    weiduEffectService.addEffect({
      lines,
      tab: 0,
      effect: fakeEffect({ parameter3: "0" }),
      type: "SPL",
      global: false,
    });
    expect(codes(lines)[0]).not.toContain("parameter3=");
  });

  it("includes parameter4 when set to a non-'0' value", () => {
    const lines: CodeLine[] = [];
    weiduEffectService.addEffect({
      lines,
      tab: 0,
      effect: fakeEffect({ parameter4: "7" }),
      type: "SPL",
      global: false,
    });
    expect(codes(lines)[0]).toContain("parameter4=7");
  });

  it("omits parameter4 when it's the string '0'", () => {
    const lines: CodeLine[] = [];
    weiduEffectService.addEffect({
      lines,
      tab: 0,
      effect: fakeEffect({ parameter4: "0" }),
      type: "SPL",
      global: false,
    });
    expect(codes(lines)[0]).not.toContain("parameter4=");
  });

  it("encodes numeric flags directly as special", () => {
    const lines: CodeLine[] = [];
    weiduEffectService.addEffect({
      lines,
      tab: 0,
      effect: fakeEffect({ flags: 5 }),
      type: "SPL",
      global: false,
    });
    expect(codes(lines)[0]).toContain("special=5");
  });

  it("reduces an array of flags into a bitmask for special", () => {
    const lines: CodeLine[] = [];
    weiduEffectService.addEffect({
      lines,
      tab: 0,
      effect: fakeEffect({ flags: [0, 1] }),
      type: "SPL",
      global: false,
    });
    expect(codes(lines)[0]).toContain(`special=${2 ** 0 + 2 ** 1}`);
  });
});

describe("has2daLookup", () => {
  it("returns false and emits nothing for an opcode with no 2da lookup", () => {
    const lines: CodeLine[] = [];
    const result = weiduEffectService.has2daLookup({
      lines,
      tab: 0,
      effect: fakeEffect(),
    });
    expect(result).toBe(false);
    expect(lines).toHaveLength(0);
  });

  it("emits a GET_2DA_ENTRY_OF lookup and rewrites parameter2 to 'row' for RemoveSpellTypeProtections", () => {
    const lines: CodeLine[] = [];
    const effect = fakeEffect({
      opcode: EffectTypeEnum.RemoveSpellTypeProtections,
      parameter2: "ABJURATION",
    });
    const result = weiduEffectService.has2daLookup({ lines, effect, tab: 0 });
    expect(result).toBe(true);
    expect(codes(lines)[0]).toContain("entry_match=~ABJURATION~");
    expect(effect.parameter2).toBe("row");
  });
});
