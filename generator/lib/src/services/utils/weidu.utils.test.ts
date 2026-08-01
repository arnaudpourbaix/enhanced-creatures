import { describe, expect, it } from "vitest";
import weiduUtils from "./weidu.utils";

describe("getIntegerValue", () => {
  it("returns undefined for undefined or empty input", () => {
    expect(weiduUtils.getIntegerValue(undefined)).toBeUndefined();
    expect(weiduUtils.getIntegerValue("")).toBeUndefined();
  });

  it("passes through non-negative values as trimmed strings", () => {
    expect(weiduUtils.getIntegerValue(42)).toBe("42");
    expect(weiduUtils.getIntegerValue("  7  ")).toBe("7");
  });

  it("quotes negative values (WeiDU integer literal syntax)", () => {
    expect(weiduUtils.getIntegerValue(-5)).toBe('"-5"');
  });
});

describe("getBooleanValue", () => {
  it("maps booleans to WeiDU 1/0", () => {
    expect(weiduUtils.getBooleanValue(true)).toBe("1");
    expect(weiduUtils.getBooleanValue(false)).toBe("0");
  });

  it("returns undefined for undefined input", () => {
    expect(weiduUtils.getBooleanValue(undefined)).toBeUndefined();
  });
});

describe("getIdsValue", () => {
  it("builds an IDS_OF_SYMBOL lookup expression", () => {
    expect(weiduUtils.getIdsValue("race", "TROLL")).toBe(
      "IDS_OF_SYMBOL (~race~ ~TROLL~)",
    );
  });

  it("returns undefined when value is undefined", () => {
    expect(weiduUtils.getIdsValue("race", undefined)).toBeUndefined();
  });
});
