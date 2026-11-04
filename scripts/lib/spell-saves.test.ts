import { describe, expect, it } from "vitest";
import { SaveTypeEnum } from "../../lib/src/model/spell-item/effect.enums";
import {
  addSavesToDatabase,
  type EffectSource,
  mergeStates,
  type RawEffect,
  readEffEffect,
  readSplEffects,
  saveEffects,
  savesSource,
  spellSaves,
} from "./spell-saves";

const SPELL = 1 << SaveTypeEnum.Spell;
const BREATH = 1 << SaveTypeEnum.Breath;

const effect = (fx: Partial<RawEffect>): RawEffect => ({
  opcode: 5,
  target: 2,
  parameter2: 0,
  resource: "",
  saveType: 0,
  saveBonus: 0,
  special: 0,
  timingMode: 0,
  duration: 0,
  resistance: 0,
  ...fx,
});

function source(spls: Record<string, RawEffect[]>, effs: Record<string, RawEffect> = {}) {
  return {
    spl: (name: string) => spls[name],
    eff: (name: string) => effs[name],
  } satisfies EffectSource;
}

describe("spellSaves", () => {
  it("is undefined for a spell the game doesn't have", () => {
    expect(spellSaves(source({}), "SPWI999")).toBeUndefined();
  });

  it("reads the spell's own saves", () => {
    expect(spellSaves(source({ SPWI104: [effect({ saveType: SPELL })] }), "spwi104")).toEqual([
      { types: [SaveTypeEnum.Spell] },
    ]);
  });

  it("follows a relay without a save to the spell it casts", () => {
    const spells = source({
      SPWI001: [effect({ opcode: 146, resource: "SPWI002" })],
      SPWI002: [effect({ saveType: BREATH })],
    });
    expect(spellSaves(spells, "SPWI001")).toEqual([{ types: [SaveTypeEnum.Breath] }]);
  });

  it("follows an EFF file relay", () => {
    const spells = source(
      { SPWI001: [effect({ opcode: 177, resource: "FX1" })] },
      { FX1: effect({ saveType: SPELL }) },
    );
    expect(spellSaves(spells, "SPWI001")).toEqual([{ types: [SaveTypeEnum.Spell] }]);
  });

  it("leaves out an EFF relay filtered by GENDER.IDS, which only affects special creatures", () => {
    // Dispel Magic: a no-save dispel, and a death save to slay illusions only (GENDER.IDS)
    const spells = source(
      {
        SPPR303: [
          effect({ opcode: 58 }),
          effect({ opcode: 177, parameter2: 7, resource: "DIE" }),
          effect({ opcode: 177, parameter2: 7, resource: "DESTSELF", saveType: SPELL }),
        ],
      },
      { DIE: effect({ opcode: 13, saveType: 1 << SaveTypeEnum.ParalyzePoisonDeath }) },
    );
    expect(spellSaves(spells, "SPPR303")).toEqual([]);
  });

  it("follows an EFF relay narrowing the spell's audience (alignment, race...)", () => {
    // Moon Dog Howl: fear on evil creatures only (ALIGN.IDS), the save on the relay
    const spells = source(
      { SPIN891: [effect({ opcode: 177, parameter2: 8, resource: "MOONDOG", saveType: SPELL })] },
      { MOONDOG: effect({ opcode: 24 }) },
    );
    expect(spellSaves(spells, "SPIN891")).toEqual([{ types: [SaveTypeEnum.Spell] }]);
  });

  it("keeps a relay's own save rather than following it", () => {
    const spells = source({
      SPWI001: [effect({ opcode: 146, resource: "SPWI002", saveType: SPELL })],
      SPWI002: [effect({ saveType: BREATH })],
    });
    expect(spellSaves(spells, "SPWI001")).toEqual([{ types: [SaveTypeEnum.Spell] }]);
  });

  it("doesn't loop on a relay cycle", () => {
    const spells = source({
      SPWI001: [effect({ opcode: 146, resource: "SPWI002" }), effect({ saveType: SPELL })],
      SPWI002: [effect({ opcode: 146, resource: "SPWI001" })],
    });
    expect(spellSaves(spells, "SPWI001")).toEqual([{ types: [SaveTypeEnum.Spell] }]);
  });

  it("has no saves when damage is only halved by its save", () => {
    const spells = source({
      SPWI001: [
        effect({ saveType: SPELL }),
        effect({ opcode: 12, saveType: BREATH, special: 1 << 8 }),
      ],
    });
    expect(spellSaves(spells, "SPWI001")).toEqual([]);
  });

  it("ignores effects landing on the caster", () => {
    const spells = source({
      SPWI001: [effect({ saveType: SPELL }), effect({ opcode: 12, target: 1 })],
    });
    expect(saveEffects(spells, spells.spl("SPWI001"))).toEqual([
      { opcode: 5, saveTypes: [SaveTypeEnum.Spell], saveBonus: 0, halved: false, self: false },
      { opcode: 12, saveTypes: [], saveBonus: 0, halved: false, self: true },
    ]);
    expect(spellSaves(spells, "SPWI001")).toEqual([{ types: [SaveTypeEnum.Spell] }]);
  });

  it("keeps the lowest bonus across caster levels, which any level can reach", () => {
    const spells = source({
      SPWI001: [
        effect({ saveType: SPELL, saveBonus: -1 }),
        effect({ saveType: SPELL, saveBonus: -4 }),
      ],
    });
    expect(spellSaves(spells, "SPWI001")).toEqual([{ types: [SaveTypeEnum.Spell], bonus: -4 }]);
  });
});

describe("mergeStates", () => {
  it("adds up the states' saves", () => {
    expect(
      mergeStates(
        [{ types: [SaveTypeEnum.Spell] }],
        [{ types: [SaveTypeEnum.Breath] }, { types: [SaveTypeEnum.Spell] }],
      ),
    ).toEqual([{ types: [SaveTypeEnum.Spell] }, { types: [SaveTypeEnum.Breath] }]);
  });

  it("keeps the lowest bonus of the same save types", () => {
    expect(
      mergeStates([{ types: [SaveTypeEnum.Spell], bonus: -2 }], [{ types: [SaveTypeEnum.Spell] }]),
    ).toEqual([{ types: [SaveTypeEnum.Spell], bonus: -2 }]);
  });

  it("has no saves when a state can't be escaped", () => {
    expect(mergeStates([{ types: [SaveTypeEnum.Spell] }], [])).toEqual([]);
  });

  it("ignores a state without the spell", () => {
    expect(mergeStates(undefined, [{ types: [SaveTypeEnum.Spell] }])).toEqual([
      { types: [SaveTypeEnum.Spell] },
    ]);
    expect(mergeStates(undefined, undefined)).toEqual([]);
  });
});

describe("readSplEffects", () => {
  it("reads every extended header's effects", () => {
    const spl = Buffer.alloc(0x72 + 2 * 0x28 + 3 * 0x30);
    spl.write("SPL V1  ", 0, "latin1");
    spl.writeUInt32LE(0x72, 0x64);
    spl.writeUInt16LE(2, 0x68);
    spl.writeUInt32LE(0x72 + 2 * 0x28, 0x6a);
    // header 1: effect 0, header 2: effects 1-2
    spl.writeUInt16LE(1, 0x72 + 0x1e);
    spl.writeUInt16LE(0, 0x72 + 0x20);
    spl.writeUInt16LE(2, 0x72 + 0x28 + 0x1e);
    spl.writeUInt16LE(1, 0x72 + 0x28 + 0x20);
    const fx = (index: number) => 0x72 + 2 * 0x28 + index * 0x30;
    spl.writeUInt16LE(12, fx(2));
    spl.writeUInt8(2, fx(2) + 2);
    spl.write("spwi002", fx(2) + 0x14, "latin1");
    spl.writeUInt32LE(BREATH, fx(2) + 0x24);
    spl.writeInt32LE(-4, fx(2) + 0x28);
    spl.writeUInt32LE(1 << 8, fx(2) + 0x2c);
    spl.writeUInt8(1, fx(2) + 0x0c);
    spl.writeUInt8(1, fx(2) + 0x0d);
    spl.writeUInt32LE(60, fx(2) + 0x0e);
    const effects = readSplEffects(spl);
    expect(effects).toHaveLength(3);
    expect(effects[2]).toEqual({
      opcode: 12,
      target: 2,
      parameter2: 0,
      resource: "SPWI002",
      saveType: BREATH,
      saveBonus: -4,
      special: 1 << 8,
      timingMode: 1,
      duration: 60,
      resistance: 1,
    });
  });

  it("rejects another file type", () => {
    expect(() => readSplEffects(Buffer.alloc(0x72))).toThrow(/Not a SPL V1 file/);
  });
});

describe("readEffEffect", () => {
  it("reads an EFF V2.0 effect", () => {
    const eff = Buffer.alloc(0x110);
    eff.write("EFF V2.0", 0, "latin1");
    eff.writeUInt32LE(24, 0x10);
    eff.writeUInt32LE(2, 0x14);
    eff.write("SPWI003", 0x30, "latin1");
    eff.writeUInt32LE(SPELL, 0x40);
    eff.writeInt32LE(-2, 0x44);
    eff.writeUInt32LE(3, 0x24);
    eff.writeUInt32LE(18, 0x28);
    expect(readEffEffect(eff)).toEqual({
      opcode: 24,
      target: 2,
      parameter2: 0,
      resource: "SPWI003",
      saveType: SPELL,
      saveBonus: -2,
      special: 0,
      timingMode: 3,
      duration: 18,
      resistance: 0,
    });
  });
});

describe("savesSource", () => {
  it("writes saves as TypeScript, the bonus only when there's one", () => {
    expect(
      savesSource([
        { types: [SaveTypeEnum.Spell], bonus: -2 },
        { types: [SaveTypeEnum.Breath, SaveTypeEnum.PetrifyPolymorph] },
      ]),
    ).toBe(
      "[{ types: [SaveTypeEnum.Spell], bonus: -2 }, { types: [SaveTypeEnum.Breath, SaveTypeEnum.PetrifyPolymorph] }]",
    );
  });
});

describe("addSavesToDatabase", () => {
  const database = [
    "const WIZARD_SPELLS = {",
    "  CharmPerson: {",
    '    file: "SPWI104",',
    "    level: 1,",
    '    variants: [{ mod: "AllSpellMods", file: "SPWI999" }],',
    "  },",
    "  Innate: {",
    '    file: "SPIN100",',
    '    name: "x",',
    "  },",
    "  DispelMagic: {",
    '    file: "SPPR303",',
    "    saves: [],",
    "  },",
    "};",
  ].join("\n");
  const spell = [{ types: [SaveTypeEnum.Spell] }];

  it("adds the saves right after the entry's level", () => {
    const result = addSavesToDatabase(database, new Map([["SPWI104", spell]])).split("\n");
    expect(result.slice(2, 5)).toEqual([
      '    file: "SPWI104",',
      "    level: 1,",
      "    saves: [{ types: [SaveTypeEnum.Spell] }],",
    ]);
  });

  it("adds them last without a level", () => {
    const result = addSavesToDatabase(database, new Map([["SPIN100", spell]])).split("\n");
    expect(result.slice(8, 11)).toEqual([
      '    name: "x",',
      "    saves: [{ types: [SaveTypeEnum.Spell] }],",
      "  },",
    ]);
  });

  it("keeps the saves an entry already declares", () => {
    expect(addSavesToDatabase(database, new Map([["SPPR303", spell]]))).toBe(database);
  });

  it("throws on a file no entry owns (a variant's isn't the entry's own)", () => {
    expect(() => addSavesToDatabase(database, new Map([["SPWI999", spell]]))).toThrow(
      /SPWI999: 0 entries own it/,
    );
  });
});
