import { describe, expect, it } from "vitest";
import { xpForHitDiceValue } from "../experience-table";
import { fitThreat, threatXp } from "./threat-xp";

const HALF = { s: 1, k: 0.5, samples: 0 };

describe("threatXp", () => {
  it("is Table 31 for an even fight", () => {
    expect(threatXp(4, 1, HALF)).toBe(120);
  });

  it("scales with the square root of threat at k = 0.5", () => {
    expect(threatXp(4, 4, HALF)).toBe(240);
  });
});

describe("fitThreat", () => {
  const make = (k: number, s: number) =>
    [1, 2, 3, 4, 5, 6, 7, 8].map((hd, i) => {
      const threat = 0.4 + i * 0.35;
      return { hitDiceValue: hd, threat, book: xpForHitDiceValue(hd) * s * threat ** k };
    });

  it("recovers k and s", () => {
    const fit = fitThreat(make(0.6, 2));
    expect(fit.k).toBeCloseTo(0.6, 5);
    expect(fit.s).toBeCloseTo(2, 5);
    expect(fit.samples).toBe(8);
  });

  it("clamps k to 1", () => {
    expect(fitThreat(make(3, 1)).k).toBe(1);
  });

  it("clamps k to 0.25", () => {
    expect(fitThreat(make(0, 1)).k).toBe(0.25);
  });

  it("keeps k = 0.5 without usable variance", () => {
    expect(fitThreat([{ hitDiceValue: 4, threat: 1, book: 120 }]).k).toBe(0.5);
    expect(fitThreat([]).samples).toBe(0);
  });

  it("ignores non-positive samples", () => {
    const fit = fitThreat([...make(0.6, 2), { hitDiceValue: 3, threat: 0, book: 50 }, { hitDiceValue: 3, threat: 1, book: 0 }]);
    expect(fit.samples).toBe(8);
  });

  it("reproduces the book total", () => {
    const samples = make(0.8, 1.5).map((x, i) => ({ ...x, book: x.book * (i % 2 ? 1.3 : 0.7) }));
    const fit = fitThreat(samples);
    const total = samples.reduce((a, x) => a + xpForHitDiceValue(x.hitDiceValue) * fit.s * x.threat ** fit.k, 0);
    expect(total).toBeCloseTo(samples.reduce((a, x) => a + x.book, 0), 6);
  });
});
