import { describe, expect, it } from "vitest";
import { CodeLine } from "../../model/misc";
import { Effect } from "../../model/spell-item/effect";
import { Spell, SpellHeader } from "../../model/spell-item/spell-item";
import weiduSpellService from "./weidu-spell.service";

interface WeiduSpellServicePrivate {
  createSpellHeader(
    lines: CodeLine[],
    spell: Spell,
    header: SpellHeader,
    index: number,
    tab: number,
  ): void;
}

function fakeSpell(p: Partial<Spell> = {}): Spell {
  return {
    file: "spl01",
    name: "common.potion.use",
    doc: "both",
    groups: [],
    effects: [],
    headers: [],
    effectFiles: [],
    projectiles: [],
    ...p,
  } as unknown as Spell;
}

function fakeHeader(p: Partial<SpellHeader> = {}): SpellHeader {
  return {
    type: 1,
    effects: [],
    ...p,
  };
}

function codes(lines: CodeLine[]): string[] {
  return lines.map((l) => l.code);
}

describe("createSpell", () => {
  it("deletes headers by min level when deleteHeaders is an array", () => {
    const lines: CodeLine[] = [];
    weiduSpellService.createSpell(
      lines,
      fakeSpell({ copyFrom: "SPWI001", deleteHeaders: [3, 5] }),
      0,
    );
    expect(codes(lines)).toContain(`LPF DELETE_SPELL_HEADER STR_VAR min_level = 3 END`);
    expect(codes(lines)).toContain(`LPF DELETE_SPELL_HEADER STR_VAR min_level = 5 END`);
  });

  it("deletes matching effects by opcode when deleteOpcodes is set", () => {
    const lines: CodeLine[] = [];
    weiduSpellService.createSpell(
      lines,
      fakeSpell({ copyFrom: "SPWI001", deleteOpcodes: [12] }),
      0,
    );
    expect(codes(lines)).toContain(`LPF DELETE_EFFECT INT_VAR match_opcode = 12 END`);
  });

  it("deletes no headers when deleteHeaders is neither true nor an array", () => {
    const lines: CodeLine[] = [];
    weiduSpellService.createSpell(
      lines,
      fakeSpell({ copyFrom: "SPWI001", deleteHeaders: undefined }),
      0,
    );
    expect(codes(lines).some((c) => c.includes("DELETE_SPELL_HEADER"))).toBe(false);
  });

  it("includes type/ctime INT_VARs when spellType/castingTime are set", () => {
    const lines: CodeLine[] = [];
    weiduSpellService.createSpell(
      lines,
      fakeSpell({ options: { spellType: 1, castingTime: 5 } }),
      0,
    );
    const line = codes(lines).find((c) => c.startsWith("LPF CHANGE_SPELL"));
    expect(line).toContain("type=1");
    expect(line).toContain("ctime=1");
  });

  it("falls back to power 0 for the main effects list when the spell has no level", () => {
    const lines: CodeLine[] = [];
    weiduSpellService.createSpell(
      lines,
      fakeSpell({ level: undefined, effects: [{ opcode: 1, target: 1 }] as unknown as Effect[] }),
      0,
    );
    const effectLine = codes(lines).find((c) => c.includes("opcode=1"));
    expect(effectLine).not.toContain("power=");
  });
});

describe("createSpellHeader (private)", () => {
  const service = weiduSpellService as unknown as WeiduSpellServicePrivate;

  it("omits location/target INT_VARs when unset on the header", () => {
    const lines: CodeLine[] = [];
    service.createSpellHeader(lines, fakeSpell(), fakeHeader(), 0, 1);
    const line = codes(lines).find((c) => c.startsWith("LPF ADD_SPELL_HEADER"));
    expect(line).not.toContain("location=");
    expect(line).not.toContain("target=");
  });

  it("includes location/target INT_VARs when set on the header", () => {
    const lines: CodeLine[] = [];
    service.createSpellHeader(lines, fakeSpell(), fakeHeader({ location: 1, target: 2 }), 0, 1);
    const line = codes(lines).find((c) => c.startsWith("LPF ADD_SPELL_HEADER"));
    expect(line).toContain("location=1");
    expect(line).toContain("target=2");
  });

  it("throws when the header projectile was never resolved to a string", () => {
    const lines: CodeLine[] = [];
    expect(() => {
      service.createSpellHeader(
        lines,
        fakeSpell(),
        fakeHeader({
          projectile: { file: "p1" } as unknown as SpellHeader["projectile"],
        }),
        0,
        1,
      );
    }).toThrow(/Unhandled projectile!/);
  });

  it("falls back to power 0 (omitted, since 0 is falsy) when the spell has no level", () => {
    const lines: CodeLine[] = [];
    service.createSpellHeader(
      lines,
      fakeSpell({ level: undefined }),
      fakeHeader({ effects: [{ opcode: 1, target: 1 }] as unknown as Effect[] }),
      0,
      1,
    );
    const effectLine = codes(lines).find((c) => c.includes("opcode=1"));
    expect(effectLine).not.toContain("power=");
  });

  it("passes the spell's level through as power when set", () => {
    const lines: CodeLine[] = [];
    service.createSpellHeader(
      lines,
      fakeSpell({ level: 5 }),
      fakeHeader({ effects: [{ opcode: 1, target: 1 }] as unknown as Effect[] }),
      0,
      1,
    );
    const effectLine = codes(lines).find((c) => c.includes("opcode=1"));
    expect(effectLine).toContain("power=5");
  });
});
