import { describe, expect, it } from "vitest";
import {
  getItemFilename,
  getProjectileFilename,
  getSpellFilename,
} from "./misc.func";

describe("getSpellFilename", () => {
  it("builds a jas<hex-num><type><hex-id> resref, defaulting to male", () => {
    expect(getSpellFilename(4, 10)).toBe("jas4ma");
  });

  it("hex-encodes num and creatureId", () => {
    expect(getSpellFilename(16, 255, "f")).toBe("jas10fff");
  });
});

describe("getItemFilename", () => {
  it("uses the 'i' file type prefix", () => {
    expect(getItemFilename(1, 2)).toBe("jai1m2");
  });
});

describe("getProjectileFilename", () => {
  it("uses the 'p' file type prefix", () => {
    expect(getProjectileFilename(1, 2, "f")).toBe("jap1f2");
  });
});
