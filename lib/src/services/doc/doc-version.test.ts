import { describe, expect, it } from "vitest";
import { stampVersion } from "./doc-version";

describe("stampVersion", () => {
  it("replaces every {{version}} token", () => {
    expect(stampVersion("<a>v{{version}}</a><b>{{version}}</b>", "1.2.3")).toBe(
      "<a>v1.2.3</a><b>1.2.3</b>",
    );
  });

  it("throws when the template has no {{version}} token", () => {
    expect(() => stampVersion("<header></header>", "1.2.3")).toThrow(
      "Token {{version}} not found !",
    );
  });
});
