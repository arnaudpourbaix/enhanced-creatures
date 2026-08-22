import { describe, expect, it } from "vitest";
import { CodeLine } from "../../model/misc";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { Creature, CreatureAutoGenerate } from "../../model/creature/creature";
import { CreatureAdjustment } from "../../model/creature/adjustment";
import { CreatureData } from "../../model/creature/data";
import weiduCreatureService from "./weidu-creature.service";

interface WeiduCreatureServicePrivate {
  removeEffects(lines: CodeLine[], tab: number, creature: Creature): void;
  removeKnownSpells(lines: CodeLine[], tab: number, creature: Creature): void;
  removeMemorizedSpells(lines: CodeLine[], tab: number, creature: Creature): void;
  addMemorizedSpells(lines: CodeLine[], tab: number, data: Partial<CreatureData>): void;
  patchScript(p: {
    lines: CodeLine[];
    tab: number;
    script: string;
    slot?: string;
    removeScripts: string[];
    files: string[];
    skipFiles: string[];
    logging: boolean;
  }): void;
  patchCreature(p: {
    lines: CodeLine[];
    tab: number;
    data: Partial<CreatureData>;
    autoGenerate: Partial<CreatureAutoGenerate>;
    enforce: boolean;
    creature: Creature;
  }): void;
  handleAdjustments(lines: CodeLine[], tab: number, creature: Creature): void;
  handleAdjustment(
    lines: CodeLine[],
    tab: number,
    creature: Creature,
    adjustment: CreatureAdjustment,
  ): void;
}

const service = weiduCreatureService as unknown as WeiduCreatureServicePrivate;

function codes(lines: CodeLine[]): string[] {
  return lines.map((l) => l.code);
}

const SPELL_REVISIONS_PATCH_IF = "PATCH_IF MOD_IS_INSTALLED spell_rev.tp2 0 BEGIN";

function fakeAdjustment(
  p: Partial<Omit<CreatureAdjustment, "data">> & { data?: Partial<CreatureData> } = {},
): CreatureAdjustment {
  return {
    files: [],
    summon: false,
    noWeapon: false,
    scriptName: false,
    data: { effects: { list: [] }, spells: { memorized: [] } },
    ...p,
  } as unknown as CreatureAdjustment;
}

function fakeCreature(
  p: Partial<Omit<Creature, "data">> & { data?: Partial<CreatureData> } = {},
): Creature {
  return {
    id: 1,
    files: [],
    adjustments: [],
    notEnforceFiles: [],
    attack: { dualWielding: false },
    data: {
      effects: { list: [] },
      spells: { memorized: [], removeMemorized: undefined },
    },
    ...p,
  } as unknown as Creature;
}

describe("removeEffects (private)", () => {
  it("removes all effects when creature.data.effects.remove is a boolean", () => {
    const lines: CodeLine[] = [];
    const creature = fakeCreature({
      files: ["FILE1"],
      data: { effects: { remove: true, list: [] } },
    });
    service.removeEffects(lines, 0, creature);
    expect(codes(lines).some((c) => c.includes("REMOVE_MOST_CRE_EFFECTS"))).toBe(true);
  });

  it("removes specific opcodes when creature.data.effects.remove is an array", () => {
    const lines: CodeLine[] = [];
    const creature = fakeCreature({
      files: ["FILE1"],
      data: { effects: { remove: [EffectTypeEnum.Damage], list: [] } },
    });
    service.removeEffects(lines, 0, creature);
    expect(codes(lines).some((c) => c.includes(`opcode_to_delete=${EffectTypeEnum.Damage}`))).toBe(
      true,
    );
  });

  it("removes specific opcodes for an adjustment with an array effects.remove", () => {
    const lines: CodeLine[] = [];
    const adjustment = fakeAdjustment({
      files: ["ADJ1"],
      data: { effects: { remove: [EffectTypeEnum.Poison], list: [] } },
    });
    const creature = fakeCreature({ adjustments: [adjustment] });
    service.removeEffects(lines, 0, creature);
    expect(codes(lines).some((c) => c.includes(`opcode_to_delete=${EffectTypeEnum.Poison}`))).toBe(
      true,
    );
  });
});

describe("removeKnownSpells (private)", () => {
  it("excludes an adjustment's files when its removeKnown is explicitly false", () => {
    const lines: CodeLine[] = [];
    const adjustment = fakeAdjustment({
      files: ["ADJ1"],
      data: { spells: { removeKnown: false, memorized: [] } },
    });
    const creature = fakeCreature({ adjustments: [adjustment] });
    service.removeKnownSpells(lines, 0, creature);
    expect(codes(lines).some((c) => c.includes("ADJ1"))).toBe(true);
  });
});

describe("removeMemorizedSpells (private)", () => {
  it("excludes an adjustment's files when its removeMemorized is explicitly false", () => {
    const lines: CodeLine[] = [];
    const adjustment = fakeAdjustment({
      files: ["ADJ1"],
      data: { spells: { removeMemorized: false, memorized: [] } },
    });
    const creature = fakeCreature({
      adjustments: [adjustment],
      data: {
        effects: { list: [] },
        spells: { removeMemorized: true, memorized: [] },
      },
    });
    service.removeMemorizedSpells(lines, 0, creature);
    expect(codes(lines).some((c) => c.includes("ADJ1"))).toBe(true);
  });
});

describe("addMemorizedSpells (private)", () => {
  it("emits REMOVE_MEMORIZED_SPELL when memorizedCount is 0", () => {
    const lines: CodeLine[] = [];
    service.addMemorizedSpells(lines, 0, {
      spells: { memorized: [{ file: "SPWI001", memorizedCount: 0 }] },
    });
    expect(codes(lines)[0]).toContain("REMOVE_MEMORIZED_SPELL");
  });

  it("emits ADD_MEMORIZED_SPELL when memorizedCount is positive", () => {
    const lines: CodeLine[] = [];
    service.addMemorizedSpells(lines, 0, {
      spells: { memorized: [{ file: "SPWI001", memorizedCount: 1 }] },
    });
    expect(codes(lines)[0]).toContain("ADD_MEMORIZED_SPELL");
  });

  it("wraps a single conditional spellbook variant in PATCH_IF, then always adds memorized after", () => {
    const lines: CodeLine[] = [];
    service.addMemorizedSpells(lines, 0, {
      spells: {
        memorized: [{ file: "SPWI001", memorizedCount: 1 }],
        spellbooks: [
          {
            mod: "SpellRevisions",
            memorized: [{ file: "SPWI002", memorizedCount: 2 }],
          },
        ],
      },
    });
    const result = codes(lines);
    expect(result[0]).toBe(SPELL_REVISIONS_PATCH_IF);
    expect(result.some((c) => c.includes("SPWI002"))).toBe(true);
    expect(result).not.toContain("END ELSE BEGIN");
    expect(result[result.length - 2]).toBe("END");
    expect(result[result.length - 1]).toContain("SPWI001");
  });

  it("chains multiple conditional spellbook variants with END ELSE PATCH_IF", () => {
    const lines: CodeLine[] = [];
    service.addMemorizedSpells(lines, 0, {
      spells: {
        memorized: [{ file: "SPWI001", memorizedCount: 1 }],
        spellbooks: [
          {
            mod: "SpellRevisions",
            memorized: [{ file: "SPWI002", memorizedCount: 2 }],
          },
          {
            mod: "FaithsAndPowers",
            memorized: [{ file: "SPWI003", memorizedCount: 3 }],
          },
        ],
      },
    });
    const result = codes(lines);
    expect(result[0]).toBe(SPELL_REVISIONS_PATCH_IF);
    expect(result).toContain("END ELSE PATCH_IF MOD_IS_INSTALLED Faiths_and_Powers.tp2 80 BEGIN");
    expect(result.some((c) => c.includes("SPWI002"))).toBe(true);
    expect(result.some((c) => c.includes("SPWI003"))).toBe(true);
    // The chain closes exactly once, then the always-on memorized list follows unconditionally.
    expect(result.filter((c) => c === "END")).toHaveLength(1);
    expect(result.some((c) => c.includes("SPWI001"))).toBe(true);
  });

  it("emits a lone unconditional (Vanilla) spellbook variant with no PATCH_IF wrapper", () => {
    const lines: CodeLine[] = [];
    service.addMemorizedSpells(lines, 0, {
      spells: {
        memorized: [],
        spellbooks: [
          {
            mod: "Vanilla",
            memorized: [{ file: "SPWI004", memorizedCount: 4 }],
          },
        ],
      },
    });
    const result = codes(lines);
    expect(result.some((c) => c.includes("PATCH_IF"))).toBe(false);
    expect(result.some((c) => c.includes("SPWI004"))).toBe(true);
  });

  it("uses the unconditional (Vanilla) variant as the mutually-exclusive ELSE fallback, not an addition", () => {
    const lines: CodeLine[] = [];
    service.addMemorizedSpells(lines, 0, {
      spells: {
        memorized: [{ file: "SPWI001", memorizedCount: 1 }],
        spellbooks: [
          {
            mod: "SpellRevisions",
            memorized: [{ file: "SPWI002", memorizedCount: 2 }],
          },
          {
            mod: "Vanilla",
            memorized: [{ file: "SPWI004", memorizedCount: 4 }],
          },
        ],
      },
    });
    const result = codes(lines);
    expect(result[0]).toBe(SPELL_REVISIONS_PATCH_IF);
    expect(result).toContain("END ELSE BEGIN");
    expect(result.some((c) => c.includes("SPWI002"))).toBe(true);
    // The Vanilla variant only fires inside the ELSE branch - it must never appear alongside
    // the conditional branch's spells, since only one branch of the chain ever executes.
    expect(result.some((c) => c.includes("SPWI004"))).toBe(true);
    // The always-on base memorized list still runs regardless of which branch matched.
    expect(result.some((c) => c.includes("SPWI001"))).toBe(true);
    expect(result[result.length - 1]).toContain("SPWI001");
  });

  it("skips the PATCH_IF chain entirely when spellbooks is unset", () => {
    const lines: CodeLine[] = [];
    service.addMemorizedSpells(lines, 0, {
      spells: { memorized: [{ file: "SPWI001", memorizedCount: 1 }] },
    });
    const result = codes(lines);
    expect(result.some((c) => c.includes("PATCH_IF"))).toBe(false);
    expect(result).toHaveLength(1);
  });
});

describe("patchScript (private)", () => {
  it("logs logging=1 when logging is true", () => {
    const lines: CodeLine[] = [];
    service.patchScript({
      lines,
      tab: 0,
      script: "SCRIPT",
      removeScripts: [],
      files: [],
      skipFiles: [],
      logging: true,
    });
    expect(codes(lines).some((c) => c.includes("logging=1"))).toBe(true);
  });

  it("logs logging=0 when logging is false", () => {
    const lines: CodeLine[] = [];
    service.patchScript({
      lines,
      tab: 0,
      script: "SCRIPT",
      removeScripts: [],
      files: [],
      skipFiles: [],
      logging: false,
    });
    expect(codes(lines).some((c) => c.includes("logging=0"))).toBe(true);
  });
});

describe("patchCreature (private)", () => {
  it("adds enforce=1 when enforce is true", () => {
    const lines: CodeLine[] = [];
    service.patchCreature({
      lines,
      tab: 0,
      data: {},
      autoGenerate: {},
      enforce: true,
      creature: fakeCreature(),
    });
    expect(codes(lines).some((c) => c.includes("enforce=1"))).toBe(true);
  });

  it("does not add enforce=1 when enforce is false", () => {
    const lines: CodeLine[] = [];
    service.patchCreature({
      lines,
      tab: 0,
      data: {},
      autoGenerate: {},
      enforce: false,
      creature: fakeCreature(),
    });
    expect(codes(lines).some((c) => c.includes("enforce=1"))).toBe(false);
  });
});

describe("handleAdjustments (private)", () => {
  it("skips adjustments with neither data nor summon", () => {
    const creature = fakeCreature({
      files: ["KNOWN1"],
      adjustments: [fakeAdjustment({ files: ["KNOWN1"], data: undefined, summon: false })],
    });
    // should not throw and should not attempt to process the adjustment
    expect(() => {
      service.handleAdjustments([], 0, creature);
    }).not.toThrow();
  });
});

describe("handleAdjustment (private)", () => {
  it("throws when scriptName is set but the adjustment has multiple files", () => {
    const creature = fakeCreature();
    // data: undefined skips patchCreatureAdjustement entirely, isolating the
    // scriptName/files.length check that follows it
    const adjustment = fakeAdjustment({
      files: ["A", "B"],
      scriptName: true,
      data: undefined,
    });
    expect(() => {
      service.handleAdjustment([], 0, creature, adjustment);
    }).toThrow(/can't have a script name if it has several files/);
  });
});
