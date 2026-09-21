import { describe, expect, it } from "vitest";
import { resolveWeiduCheck } from "./mods";

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
