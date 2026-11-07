import { describe, expect, it } from "vitest";
import type { CreatureData } from "../model/creature/data";
import strengthEditionService, { NO_BONUS_STRENGTH } from "./strength-edition.service";

const source = "MM";

describe("strengthEditionService.apply", () => {
  it("3e+ changes nothing", () => {
    const data = {
      strength: 19,
      thac0: 15,
      strength2e: { strength: 18, exceptionalStrength: 100, hit: -1, source },
    };
    strengthEditionService.apply({ data, edition: "3e+" });
    expect(data).toMatchObject({ strength: 19, thac0: 15 });
  });

  it("2e plays the 2e score and its to-hit correction", () => {
    const data = {
      strength: 19,
      thac0: 15,
      strength2e: { strength: 18, exceptionalStrength: 100, hit: -1, source },
    };
    strengthEditionService.apply({ data, edition: "2e" });
    expect(data).toMatchObject({ strength: 18, exceptionalStrength: 100, thac0: 16 });
  });

  it("a 2e score without exceptional resets it", () => {
    const data = { strength: 18, exceptionalStrength: 76, strength2e: { strength: 19, source } };
    strengthEditionService.apply({ data, edition: "2e" });
    expect(data).toMatchObject({ strength: 19, exceptionalStrength: 0 });
  });

  it("no bonus plays strength 15", () => {
    const data = {
      strength: 18,
      exceptionalStrength: 40,
      thac0: 10,
      strength2e: { hit: 3, source },
    };
    strengthEditionService.apply({ data, edition: "2e" });
    expect(data).toMatchObject({ strength: NO_BONUS_STRENGTH, exceptionalStrength: 0, thac0: 7 });
  });

  it("an adjustment inherits the creature's 2e to-hit on its own THAC0, not its score", () => {
    const parent = {
      strength: 18,
      strength2e: { strength: 18, exceptionalStrength: 100, hit: -1, source },
    } as CreatureData;
    const data = { thac0: 13 };
    strengthEditionService.apply({ data, parent, edition: "2e" });
    // the score comes from the creature's own (resolved) data
    expect(data).toEqual({ thac0: 14 });
  });

  it("an adjustment without its own THAC0 keeps the creature's corrected one", () => {
    const parent = { strength2e: { strength: 18, hit: 2, source } } as CreatureData;
    const data = {};
    strengthEditionService.apply({ data, parent, edition: "2e" });
    expect(data).toEqual({});
  });

  it("an adjustment with its own strength is untouched", () => {
    const parent = { strength2e: { strength: 18, hit: 2, source } } as CreatureData;
    for (const own of [
      { strength: 18, thac0: 13 },
      { exceptionalStrength: 50, thac0: 13 },
    ]) {
      const data = { ...own };
      strengthEditionService.apply({ data, parent, edition: "2e" });
      expect(data).toEqual(own);
    }
  });

  it("an adjustment's own strength2e wins over the creature's", () => {
    const parent = {
      strength2e: { strength: 18, exceptionalStrength: 100, hit: -1, source },
    } as CreatureData;
    const data = {
      thac0: 12,
      strength2e: { strength: 18, exceptionalStrength: 100, hit: 1, source },
    };
    strengthEditionService.apply({ data, parent, edition: "2e" });
    expect(data).toMatchObject({ strength: 18, exceptionalStrength: 100, thac0: 11 });
  });

  it("a to-hit correction without THAC0 fails", () => {
    const data = { strength: 19, strength2e: { strength: 18, hit: 1, source } };
    expect(() => {
      strengthEditionService.apply({ data, edition: "2e" });
    }).toThrow(/THAC0/);
  });
});
