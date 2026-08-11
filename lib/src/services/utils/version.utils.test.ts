import { describe, expect, it } from "vitest";
import { isGreater, parseVersion } from "./version.utils";

describe("parseVersion", () => {
  it("parses a valid X.Y.Z version", () => {
    expect(parseVersion("1.2.3")).toEqual({ major: 1, minor: 2, patch: 3 });
  });

  it.each(["1.2", "1.2.3.4", "v1.2.3", "1.2.3-beta", "", "a.b.c"])(
    "throws for invalid version %s",
    (value) => {
      expect(() => parseVersion(value)).toThrow(/not a valid version/);
    },
  );
});

describe("isGreater", () => {
  it("returns true when the major version is greater", () => {
    expect(isGreater(parseVersion("2.0.0"), parseVersion("1.9.9"))).toBe(true);
  });

  it("returns true when the minor version is greater at the same major", () => {
    expect(isGreater(parseVersion("1.3.0"), parseVersion("1.2.9"))).toBe(true);
  });

  it("returns true when the patch version is greater at the same major.minor", () => {
    expect(isGreater(parseVersion("1.2.4"), parseVersion("1.2.3"))).toBe(true);
  });

  it("returns false when versions are equal", () => {
    expect(isGreater(parseVersion("1.2.3"), parseVersion("1.2.3"))).toBe(false);
  });

  it("returns false when next is lower than current", () => {
    expect(isGreater(parseVersion("1.2.3"), parseVersion("1.2.4"))).toBe(false);
  });
});
