import { describe, expect, it } from "vitest";
import {
  getItemFilename,
  getProjectileFilename,
  getResourceName,
  getSpellFilename,
  toCode,
} from "./misc.func";

describe("getSpellFilename", () => {
  it("builds a jas<type><code-id><code-num> resref, defaulting to male", () => {
    expect(getSpellFilename(4, 10)).toBe("jasm0a04");
  });

  it("base-36 encodes num and creatureId", () => {
    expect(getSpellFilename(16, 255, "f")).toBe("jasf730g");
  });

  it("names creature and family resources with codes", () => {
    expect(getSpellFilename(0, 153)).toBe("jasm4900");
    expect(getItemFilename(1, 153)).toBe("jaim4901");
    expect(getProjectileFilename(2, 8, "f")).toBe("japf0802");
  });
});

describe("getItemFilename", () => {
  it("uses the 'i' file type prefix", () => {
    expect(getItemFilename(1, 2)).toBe("jaim0201");
  });
});

describe("getProjectileFilename", () => {
  it("uses the 'p' file type prefix", () => {
    expect(getProjectileFilename(1, 2, "f")).toBe("japf0201");
  });
});

describe("toCode", () => {
  it("is base 36, 2 chars, zero-padded", () => {
    expect(toCode(0)).toBe("00");
    expect(toCode(8)).toBe("08");
    expect(toCode(35)).toBe("0z");
    expect(toCode(36)).toBe("10");
    expect(toCode(153)).toBe("49");
    expect(toCode(1295)).toBe("zz");
  });
  it("throws outside 0-1295", () => {
    expect(() => toCode(1296)).toThrow(/1295/);
    expect(() => toCode(-1)).toThrow();
    expect(() => toCode(1.5)).toThrow();
  });
});

describe("getResourceName", () => {
  it("builds ja + kind + scope + owner + counter, 8 chars", () => {
    expect(getResourceName("s", "m", 153, 0)).toBe("jasm4900");
    expect(getResourceName("i", "m", 153, 1)).toBe("jaim4901");
    expect(getResourceName("b", "m", 153, 1)).toBe("jabm4901");
    expect(getResourceName("s", "f", 8, 3)).toBe("jasf0803");
    expect(getResourceName("i", "c", 0, 19)).toBe("jaic000j");
    expect(getResourceName("s", "k", 5, 0)).toBe("jask0500");
    expect(getResourceName("p", "e", 1, 0)).toBe("jape0100");
  });
  it("throws when owner or counter exceeds zz", () => {
    expect(() => getResourceName("s", "m", 1296, 0)).toThrow();
    expect(() => getResourceName("s", "m", 1, 1296)).toThrow();
  });
});
