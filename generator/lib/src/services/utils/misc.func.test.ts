import { describe, expect, it } from "vitest";
import {
  getItemFilename,
  getProjectileFilename,
  getSpellFilename,
} from "./misc.func";

describe("getSpellFilename", () => {
  it("builds a ja#s<hex-num><type><hex-id> resref, defaulting to male", () => {
    expect(getSpellFilename(4, 10)).toBe("ja#s4ma");
  });

  it("hex-encodes num and creatureId", () => {
    expect(getSpellFilename(16, 255, "f")).toBe("ja#s10fff");
  });
});

describe("getItemFilename", () => {
  it("uses the 'i' file type prefix", () => {
    expect(getItemFilename(1, 2)).toBe("ja#i1m2");
  });
});

describe("getProjectileFilename", () => {
  it("uses the 'p' file type prefix", () => {
    expect(getProjectileFilename(1, 2, "f")).toBe("ja#p1f2");
  });
});
