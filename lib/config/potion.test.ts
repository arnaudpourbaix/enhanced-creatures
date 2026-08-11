import { describe, expect, it } from "vitest";
import { POTIONS } from "./potion";

describe("POTIONS", () => {
  it("doesn't reuse the same item file across different potion entries", () => {
    const files = POTIONS.flatMap((p) => p.files);
    expect(new Set(files).size).toBe(files.length);
  });
});
