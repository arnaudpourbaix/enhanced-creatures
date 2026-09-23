import { describe, expect, it } from "vitest";
import {
  availabilityOverlaps,
  availabilityRange,
  isAvailableInMod,
  resolveWeiduCheck,
} from "./mods";

describe("resolveWeiduCheck", () => {
  it("returns undefined unchanged", () => {
    expect(resolveWeiduCheck(undefined)).toBeUndefined();
  });

  it("returns a single string as-is", () => {
    expect(resolveWeiduCheck("MOD_IS_INSTALLED spell_rev.tp2 0")).toBe(
      "MOD_IS_INSTALLED spell_rev.tp2 0",
    );
  });

  it("treats an empty array the same as no check", () => {
    expect(resolveWeiduCheck([])).toBeUndefined();
  });

  it("unwraps a single-entry array without adding OR()", () => {
    expect(resolveWeiduCheck(["MOD_IS_INSTALLED STRATAGEMS.TP2 1500"])).toBe(
      "MOD_IS_INSTALLED STRATAGEMS.TP2 1500",
    );
  });

  it("joins multiple entries with WeiDU's OR(n) syntax", () => {
    expect(
      resolveWeiduCheck([
        "MOD_IS_INSTALLED STRATAGEMS.TP2 2000",
        "MOD_IS_INSTALLED STRATAGEMS.TP2 2500",
        "MOD_IS_INSTALLED STRATAGEMS.TP2 2510",
      ]),
    ).toBe(
      "OR(3) MOD_IS_INSTALLED STRATAGEMS.TP2 2000 MOD_IS_INSTALLED STRATAGEMS.TP2 2500 " +
        "MOD_IS_INSTALLED STRATAGEMS.TP2 2510",
    );
  });
});

describe("availabilityRange", () => {
  it("defaults to the full chain when neither requiresMod nor obsoletedBy is set", () => {
    expect(availabilityRange({})).toEqual({ start: 0, end: 2 });
  });

  it("starts at requiresMod's layer", () => {
    expect(availabilityRange({ requiresMod: "AllSpellMods" })).toEqual({ start: 1, end: 2 });
  });

  it("ends at obsoletedBy's layer", () => {
    expect(availabilityRange({ obsoletedBy: "AllSpellMods" })).toEqual({ start: 0, end: 1 });
  });

  it("throws when requiresMod doesn't come before obsoletedBy", () => {
    expect(() =>
      availabilityRange({ requiresMod: "AllSpellMods", obsoletedBy: "Vanilla" }),
    ).toThrow(/must come before/);
  });

  it("throws for a mod outside the fixed layering chain (e.g. FaithsAndPowers)", () => {
    expect(() => availabilityRange({ requiresMod: "FaithsAndPowers" })).toThrow(
      /isn't part of MOD_LAYER_ORDER/,
    );
  });
});

describe("availabilityOverlaps", () => {
  it("is true for two entries with no restrictions at all (both always available)", () => {
    expect(availabilityOverlaps({}, {})).toBe(true);
  });

  it("is false for an obsoletedBy/requiresMod pair split at AllSpellMods (Deafness/SoundBurst shape)", () => {
    const deafness = { obsoletedBy: "AllSpellMods" } as const;
    const soundBurst = { requiresMod: "AllSpellMods" } as const;
    expect(availabilityOverlaps(deafness, soundBurst)).toBe(false);
  });

  it("is true when one entry's range is fully open and the other is restricted", () => {
    expect(availabilityOverlaps({}, { requiresMod: "AllSpellMods" })).toBe(true);
  });

  it("is true when two entries both require AllSpellMods (they'd coexist there)", () => {
    const a = { requiresMod: "AllSpellMods" } as const;
    const b = { requiresMod: "AllSpellMods" } as const;
    expect(availabilityOverlaps(a, b)).toBe(true);
  });
});

describe("isAvailableInMod", () => {
  it("is true for a spell with no restrictions under any mod", () => {
    expect(isAvailableInMod({}, "Vanilla")).toBe(true);
    expect(isAvailableInMod({}, "AllSpellMods")).toBe(true);
  });

  it("is false under the mod a spell is hiddenIn, even though it's otherwise available there", () => {
    const spell = { hiddenIn: "AllSpellMods" } as const;
    expect(isAvailableInMod(spell, "Vanilla")).toBe(true);
    expect(isAvailableInMod(spell, "AllSpellMods")).toBe(false);
  });

  it("hiddenIn doesn't affect availabilityOverlaps (identity/uniqueness is unaffected by hiding)", () => {
    const hidden = { hiddenIn: "AllSpellMods" } as const;
    const other = { requiresMod: "AllSpellMods" } as const;
    expect(availabilityOverlaps(hidden, other)).toBe(true);
  });
});
