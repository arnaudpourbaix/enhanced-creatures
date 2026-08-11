import { describe, expect, it } from "vitest";
import { JEWEL_SLOTS } from "../../model/creature/item";
import weiduCoreService from "./weidu-core.service";

describe("getIcon", () => {
  it("returns the ring icon for the exact JEWEL_SLOTS reference", () => {
    expect(weiduCoreService.getIcon({ file: "x", slot: JEWEL_SLOTS })).toBe(
      "IRING16",
    );
  });

  it("returns undefined for a value-equal but distinct array (only the shared JEWEL_SLOTS constant matches, by design)", () => {
    expect(
      weiduCoreService.getIcon({
        file: "x",
        slot: ["LRING", "RRING", "AMULET", "BELT", "GLOVES", "CLOAK"],
      }),
    ).toBeUndefined();
  });

  it("returns the matching single-slot icon for known single slots", () => {
    expect(weiduCoreService.getIcon({ file: "x", slot: "HELMET" })).toBe(
      "IHELM01",
    );
    expect(weiduCoreService.getIcon({ file: "x", slot: "BOOTS" })).toBe(
      "IBOOT01",
    );
  });
});
