import { describe, expect, it } from "vitest";
import { gamesOverlap, GAME_IS_CONDITION } from "./game";

describe("gamesOverlap", () => {
  it("undefined overlaps everything", () => {
    expect(gamesOverlap(undefined, "bg1")).toBe(true);
    expect(gamesOverlap("bg2", undefined)).toBe(true);
    expect(gamesOverlap(undefined, undefined)).toBe(true);
  });
  it("same game overlaps", () => {
    expect(gamesOverlap("bg1", "bg1")).toBe(true);
  });
  it("different games do not overlap", () => {
    expect(gamesOverlap("bg1", "bg2")).toBe(false);
  });
});

describe("GAME_IS_CONDITION", () => {
  it("maps bg1 to bgee+eet and bg2 to bg2ee", () => {
    expect(GAME_IS_CONDITION.bg1).toBe("GAME_IS ~bgee eet~");
    expect(GAME_IS_CONDITION.bg2).toBe("GAME_IS ~bg2ee~");
  });
});
