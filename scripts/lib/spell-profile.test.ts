import { describe, expect, it } from "vitest";
import { type EffectSource, type RawEffect } from "./spell-saves";
import {
  classifyRole,
  durationClass,
  casterLevelSource,
  minCasterLevel,
  readSplCastingTimes,
  spellDuration,
  spellEffects,
} from "./spell-profile";

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
  ...fx,
});

function source(spls: Record<string, RawEffect[]>, effs: Record<string, RawEffect> = {}) {
  return {
    spl: (name: string) => spls[name],
    eff: (name: string) => effs[name],
  } satisfies EffectSource;
}

describe("readSplCastingTimes", () => {
  it("reads each extended header's casting speed, in header order", () => {
    const spl = Buffer.alloc(0x72 + 2 * 0x28);
    spl.write("SPL V1  ", 0, "latin1");
    spl.writeUInt32LE(0x72, 0x64);
    spl.writeUInt16LE(2, 0x68);
    spl.writeUInt16LE(3, 0x72 + 0x12);
    spl.writeUInt16LE(1, 0x72 + 0x28 + 0x12);
    expect(readSplCastingTimes(spl)).toEqual([3, 1]);
  });
});

// thresholds fitted on the durations declared by hand, at the lowest caster level
describe("spellDuration", () => {
  it("is the longest limited effect, visuals aside", () => {
    const effects = [
      effect({ opcode: 218, duration: 300 }),
      effect({ opcode: 0, duration: 60 }),
      effect({ opcode: 215, duration: 3000 }),
    ];
    expect(spellDuration(effects)).toBe("mid");
  });

  it("ends an open-ended effect when a delayed effect fires (Polymorph Self)", () => {
    const effects = [
      effect({ opcode: 135, duration: 3600000 }),
      effect({ opcode: 172, timingMode: 4, duration: 79 }),
      effect({ opcode: 171, timingMode: 1 }),
    ];
    expect(spellDuration(effects)).toBe("short");
  });

  it("has none for an instant or permanent spell", () => {
    expect(spellDuration([effect({ opcode: 12 }), effect({ opcode: 171, timingMode: 1 })])).toBe(
      undefined,
    );
  });
});

describe("durationClass", () => {
  it("has no class for an instant effect", () => {
    expect(durationClass(0)).toBeUndefined();
  });

  it("is short below two turns (Fire Shield, Improved Invisibility)", () => {
    expect(durationClass(6)).toBe("short");
    expect(durationClass(119)).toBe("short");
  });

  it("is mid from two turns, below four game hours (Blur, Mirror Image, Aid)", () => {
    expect(durationClass(120)).toBe("mid");
    expect(durationClass(300)).toBe("mid");
    expect(durationClass(1199)).toBe("mid");
  });

  it("is long from four game hours (Stoneskin, Animate Dead)", () => {
    expect(durationClass(1200)).toBe("long");
    expect(durationClass(2400)).toBe("long");
  });
});

/**
 * An SPL whose headers each hold one effect, for caster levels 1, 8, 15... (as Polymorph Self's
 * header list starts at 1, before any caster can cast it).
 */
function splBuffer(
  effects: Partial<RawEffect>[],
  spell: { type: number; level: number } = { type: 1, level: 1 },
): Buffer {
  const fxStart = 0x72 + effects.length * 0x28;
  const spl = Buffer.alloc(fxStart + effects.length * 0x30);
  spl.write("SPL V1  ", 0, "latin1");
  spl.writeUInt16LE(spell.type, 0x1c);
  spl.writeUInt32LE(spell.level, 0x34);
  spl.writeUInt32LE(0x72, 0x64);
  spl.writeUInt16LE(effects.length, 0x68);
  spl.writeUInt32LE(fxStart, 0x6a);
  effects.forEach((fx, h) => {
    spl.writeUInt16LE(h ? h * 7 + 1 : 1, 0x72 + h * 0x28 + 0x10);
    spl.writeUInt16LE(1, 0x72 + h * 0x28 + 0x1e);
    spl.writeUInt16LE(h, 0x72 + h * 0x28 + 0x20);
    const at = fxStart + h * 0x30;
    spl.writeUInt16LE(fx.opcode ?? 0, at);
    spl.writeUInt8(fx.target ?? 2, at + 2);
    spl.writeUInt32LE(fx.duration ?? 0, at + 0x0e);
    spl.write(fx.resource ?? "", at + 0x14, "latin1");
  });
  return spl;
}

describe("minCasterLevel", () => {
  it("is the level a wizard or priest first casts the spell's level at", () => {
    expect(minCasterLevel(splBuffer([{}], { type: 1, level: 4 }))).toBe(7);
    expect(minCasterLevel(splBuffer([{}], { type: 1, level: 6 }))).toBe(12);
    expect(minCasterLevel(splBuffer([{}], { type: 2, level: 6 }))).toBe(11);
  });

  it("is 1 for an innate", () => {
    expect(minCasterLevel(splBuffer([{}], { type: 4, level: 5 }))).toBe(1);
  });
});

describe("casterLevelSource", () => {
  it("reads the header of that caster level, relayed spells' too", () => {
    const spls: Record<string, Buffer> = {
      TOP: splBuffer([{ opcode: 146, resource: "SUB" }]),
      SUB: splBuffer([
        { opcode: 218, duration: 78 },
        { opcode: 218, duration: 186 },
        { opcode: 218, duration: 312 },
      ]),
    };
    const reader = { read: (name: string) => spls[name] };
    // level 7 is between the headers for levels 1 and 8: still the first one's
    expect(spellEffects(casterLevelSource(reader, 7), "TOP")?.map((e) => e.duration)).toEqual([78]);
    expect(spellEffects(casterLevelSource(reader, 8), "TOP")?.map((e) => e.duration)).toEqual([
      186,
    ]);
  });
});

describe("spellEffects", () => {
  it("is undefined for a spell the game doesn't have", () => {
    expect(spellEffects(source({}), "SPWI999")).toBeUndefined();
  });

  it("follows spell and EFF relays to the effects they apply", () => {
    const spells = source(
      {
        SPWI001: [
          effect({ opcode: 146, resource: "SPWI002" }),
          effect({ opcode: 177, resource: "FX1" }),
        ],
        SPWI002: [effect({ opcode: 12 })],
      },
      { FX1: effect({ opcode: 40 }) },
    );
    expect(spellEffects(spells, "spwi001")?.map((e) => e.opcode)).toEqual([12, 40]);
  });

  it("follows a relay with its own save too: the save doesn't change what it applies", () => {
    const spells = source(
      { SPWI104: [effect({ opcode: 177, resource: "CHARM", saveType: 1 })] },
      { CHARM: effect({ opcode: 5 }) },
    );
    expect(spellEffects(spells, "SPWI104")?.map((e) => e.opcode)).toEqual([5]);
  });

  it("applies an EFF relay's payload to the relay's target, as the engine does", () => {
    const spells = source(
      { SPIN891: [effect({ opcode: 177, resource: "MOOND8", target: 2 })] },
      { MOOND8: effect({ opcode: 12, target: 0 }) },
    );
    expect(spellEffects(spells, "SPIN891")?.[0].target).toBe(2);
  });

  it("casts a self relay's spell on the caster: its preset target is the caster", () => {
    const spells = source({
      SPPR205: [effect({ opcode: 146, resource: "SPPR205B", target: 1 })],
      SPPR205B: [effect({ opcode: 278, target: 2 })],
    });
    expect(spellEffects(spells, "SPPR205")?.[0].target).toBe(1);
  });

  it("gives an EFF relay's payload the relay's duration, as the engine does", () => {
    const spells = source(
      { SPWI707: [effect({ opcode: 177, resource: "DK", timingMode: 0, duration: 180 })] },
      { DK: effect({ opcode: 67, timingMode: 1, duration: 0 }) },
    );
    expect(spellEffects(spells, "SPWI707")).toEqual([
      effect({ opcode: 67, timingMode: 0, duration: 180 }),
    ]);
  });

  it("follows an EFF relay named after its own spell", () => {
    const spells = source(
      { SPWI104: [effect({ opcode: 177, resource: "SPWI104" })] },
      { SPWI104: effect({ opcode: 5 }) },
    );
    expect(spellEffects(spells, "SPWI104")?.map((e) => e.opcode)).toEqual([5]);
  });

  it("doesn't loop on a relay cycle", () => {
    const spells = source({
      SPWI001: [effect({ opcode: 146, resource: "SPWI002" }), effect({ opcode: 218 })],
      SPWI002: [effect({ opcode: 146, resource: "SPWI001" })],
    });
    expect(spellEffects(spells, "SPWI001")?.map((e) => e.opcode)).toEqual([146, 218]);
  });
});

describe("classifyRole", () => {
  const enemy = (opcode: number) => effect({ opcode, target: 2 });
  const self = (opcode: number) => effect({ opcode, target: 1 });

  it("classifies damage on enemies, with its evidence", () => {
    const { role, evidence } = classifyRole([enemy(12)], ["fire", "area"]);
    expect(role).toBe("damage");
    expect(evidence).toContain("opcode 12 Damage (enemy)");
  });

  it("classifies an outright kill as kill (Finger of Death, Power Word Kill)", () => {
    expect(classifyRole([enemy(13)], []).role).toBe("kill");
    expect(classifyRole([enemy(209), enemy(55)], []).role).toBe("kill");
  });

  it("gives a spell that kills and damages a secondary damage role (Destruction)", () => {
    const { role, secondaryRoles } = classifyRole([enemy(13), enemy(12)], []);
    expect(role).toBe("kill");
    expect(secondaryRoles).toEqual(["damage"]);
  });

  it("prefers damage over a disable on the same spell, listing both", () => {
    const { role, evidence } = classifyRole([enemy(12), enemy(40)], []);
    expect(role).toBe("damage");
    expect(evidence).toEqual(["opcode 12 Damage (enemy)", "opcode 40 Slow (enemy)"]);
  });

  it("gives a damaging spell that also disables a secondary disable role (Battering Ram)", () => {
    const { role, secondaryRoles } = classifyRole([enemy(324), enemy(12), enemy(39)], []);
    expect(role).toBe("damage");
    expect(secondaryRoles).toEqual(["disable"]);
  });

  it("counts a lasting debuff as a secondary disable role (Sound Burst deafening)", () => {
    expect(classifyRole([enemy(12), enemy(80)], []).secondaryRoles).toEqual(["disable"]);
  });

  it("gives a plain damaging spell no secondary role, bookkeeping aside (Fireball)", () => {
    const fireball = [enemy(324), enemy(12), self(265), self(165)];
    expect(classifyRole(fireball, ["area"]).secondaryRoles).toEqual([]);
  });

  it("only counts a strong protection or an offensive buff as secondary on the caster", () => {
    expect(classifyRole([self(218), self(278)], []).secondaryRoles).toEqual(["buff"]);
    // Haste's AC bonus is no secondary protection
    expect(classifyRole([self(16), self(1), self(0)], []).secondaryRoles).toEqual([]);
  });

  it("keeps an offensive spell with a side effect on its caster offensive", () => {
    expect(classifyRole([enemy(12), self(17)], []).role).toBe("damage");
    expect(classifyRole([enemy(12), self(18)], []).role).toBe("damage");
  });

  it("classifies a hold as disable", () => {
    expect(classifyRole([enemy(175)], []).role).toBe("disable");
  });

  it("classifies Stoneskin as protection", () => {
    expect(classifyRole([self(218)], []).role).toBe("protection");
  });

  it("classifies an AC-only spell as protection (Shield, Barkskin)", () => {
    expect(classifyRole([self(321), self(0)], []).role).toBe("protection");
  });

  it("classifies Haste as buff: its attacks and speed matter more than its AC bonus", () => {
    expect(classifyRole([self(16), self(1), self(176), self(0)], []).role).toBe("buff");
    // its immunity to its own recasting (and Slow) doesn't make it a protection either
    expect(classifyRole([self(176), self(1), self(0), self(206)], []).role).toBe("buff");
    // nor does Improved Haste's immunity to Slow, a protection on its own (Free Action)
    expect(classifyRole([self(176), self(1), self(0), self(101)], []).role).toBe("buff");
    expect(classifyRole([self(101), self(101)], []).role).toBe("protection");
  });

  it("keeps a strong protection a protection despite an offensive bonus", () => {
    expect(classifyRole([self(218), self(278)], []).role).toBe("protection");
  });

  it("classifies other self effects as buff, ignoring cosmetic ones", () => {
    const { role, evidence } = classifyRole([self(215), self(44), self(278)], []);
    expect(role).toBe("buff");
    expect(evidence.some((e) => e.startsWith("opcode 215"))).toBe(false);
  });

  it("treats a friendly spell's effects as self effects", () => {
    expect(classifyRole([enemy(278)], ["friendly"]).role).toBe("buff");
  });

  it("keeps a spell centred on its caster offensive (Sunray): castOnSelf isn't friendly", () => {
    expect(classifyRole([enemy(12)], ["castOnSelf", "area"]).role).toBe("damage");
  });

  it("lands a castOnSelf spell's preset-target effects on its caster (Prot. from the Elements)", () => {
    expect(classifyRole([enemy(27), enemy(28)], ["castOnSelf"]).role).toBe("buff");
  });

  it("takes a weapon forced onto an enemy for a disable, not a touch spell (Polymorph Other)", () => {
    const { role, secondaryRoles } = classifyRole([enemy(321), enemy(111)], []);
    expect(role).toBe("disable");
    expect(secondaryRoles).toEqual([]);
  });

  it("classifies a shapeshift, a new form's weapon with abilities, as shapeshift (Wolf)", () => {
    expect(classifyRole([self(172), self(111), self(171)], ["castOnSelf"]).role).toBe("shapeshift");
  });

  it("classifies a polymorph into a form as shapeshift, whatever else it does (Polymorph Self)", () => {
    const polymorph = [enemy(321), self(172), self(171), self(135), self(111), self(0)];
    const { role, secondaryRoles } = classifyRole(polymorph, ["castOnSelf"]);
    expect(role).toBe("shapeshift");
    expect(secondaryRoles).toEqual([]);
  });

  it("classifies the caster replaced by another creature as shapeshift (vampire bat form)", () => {
    expect(classifyRole([self(151)], ["castOnSelf"]).role).toBe("shapeshift");
  });

  it("classifies a touch spell, a weapon created in the caster's hand, as damage (Harm)", () => {
    expect(classifyRole([self(111)], ["castOnSelf"]).role).toBe("damage");
  });

  it("classifies a summon", () => {
    expect(classifyRole([enemy(127)], []).role).toBe("summon");
  });

  it("doesn't take a temporary hit point boost for healing (Berserker Rage, Aid)", () => {
    const rage = [self(17), self(18), self(278), self(73), self(101), self(0)];
    expect(classifyRole(rage, ["castOnSelf"]).role).toBe("buff");
  });

  it("classifies a spell only gathering information as useless (Find Traps, Detect Evil)", () => {
    expect(classifyRole([self(150), self(146), self(206)], ["castOnSelf"]).role).toBe("useless");
    expect(classifyRole([enemy(115)], []).role).toBe("useless");
  });

  it("classifies stripping a spell school's protections as reactive (Moon Dog Sight)", () => {
    expect(classifyRole([enemy(220), enemy(233), enemy(115), enemy(150)], []).role).toBe(
      "reactive",
    );
  });

  it("classifies healing and dispelling as reactive", () => {
    expect(classifyRole([self(17)], ["cureWounds"]).role).toBe("reactive");
    expect(classifyRole([enemy(58)], []).role).toBe("reactive");
  });

  it("classifies slaying as kill, and level drain as damage", () => {
    expect(classifyRole([enemy(55)], []).role).toBe("kill");
    expect(classifyRole([enemy(216)], []).role).toBe("damage");
  });

  it("classifies a debuff on enemies as disable, ignoring bookkeeping effects", () => {
    expect(classifyRole([enemy(324), enemy(321), enemy(33), enemy(54)], []).role).toBe("disable");
    expect(classifyRole([enemy(324), enemy(206), enemy(321), enemy(50)], []).role).toBeUndefined();
  });

  it("classifies breaching enemy protections as reactive", () => {
    expect(classifyRole([enemy(221), enemy(240)], []).role).toBe("reactive");
    expect(classifyRole([enemy(230)], []).role).toBe("reactive");
  });

  it("doesn't count an offensive spell cleaning up its previous casting as breaching (Slow)", () => {
    expect(classifyRole([enemy(221), enemy(40)], []).role).toBe("disable");
    expect(classifyRole([enemy(221), enemy(12)], []).role).toBe("damage");
  });

  it("doesn't count a buff cleaning up its own previous casting as breaching (Haste)", () => {
    expect(classifyRole([self(221), self(16), self(1)], []).role).toBe("buff");
  });

  it("leaves a spell with only cosmetic effects unclassified", () => {
    expect(classifyRole([enemy(215), enemy(174)], []).role).toBeUndefined();
  });
});
