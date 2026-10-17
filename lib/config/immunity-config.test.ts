import { describe, expect, it } from "vitest";
import { IMMUNITIES, RESISTANCES, TRAITS } from "./immunity-config";

describe("immunity configs", () => {
  // Each itemSlot.file is created as its own ITM: two configs sharing one would overwrite each
  // other at install (the later CREATE ITM wins).
  it("doesn't reuse the same trait item file across configs", () => {
    const files = [...IMMUNITIES, ...RESISTANCES, ...TRAITS]
      .map((i) => i.itemSlot?.file)
      .filter((f): f is string => f !== undefined)
      .map((f) => f.toLowerCase());
    const duplicates = files.filter((f, i) => files.indexOf(f) !== i);
    expect(duplicates).toEqual([]);
  });
});
