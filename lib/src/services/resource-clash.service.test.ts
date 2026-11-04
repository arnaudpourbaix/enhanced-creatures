import { describe, expect, it } from "vitest";
import resourceClashService from "./resource-clash.service";

describe("resourceClashService.check", () => {
  it("does not throw without a clash", () => {
    expect(() => resourceClashService.check(["jasm4900"], ["jaim4900"])).not.toThrow();
  });
  it("throws listing the clashing name, case-insensitively", () => {
    expect(() => resourceClashService.check(["jasm4900"], ["JASM4900"])).toThrow(
      "SPL/ITM name clash: jasm4900",
    );
  });
});
