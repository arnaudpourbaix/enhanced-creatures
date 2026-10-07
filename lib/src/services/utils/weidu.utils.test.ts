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
    expect(weiduUtils.getIdsValue("race", "TROLL")).toBe("IDS_OF_SYMBOL (~race~ ~TROLL~)");
  });

  it("returns undefined when value is undefined", () => {
    expect(weiduUtils.getIdsValue("race", undefined)).toBeUndefined();
  });
});

describe("getFirstIdsValue", () => {
  it("chains each symbol's lookup in order, ending on the fallback", () => {
    expect(weiduUtils.getFirstIdsValue("animate", ["A", "B"], "LONG_AT 0x28")).toBe(
      "((IDS_OF_SYMBOL (~animate~ ~A~) >= 0) ? IDS_OF_SYMBOL (~animate~ ~A~) : " +
        "(IDS_OF_SYMBOL (~animate~ ~B~) >= 0) ? IDS_OF_SYMBOL (~animate~ ~B~) : LONG_AT 0x28)",
    );
  });

  it("returns the fallback alone when there is no symbol", () => {
    expect(weiduUtils.getFirstIdsValue("animate", [], "7")).toBe("7");
  });
});
