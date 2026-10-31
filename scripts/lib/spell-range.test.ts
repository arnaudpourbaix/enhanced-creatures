import { describe, expect, it } from "vitest";
import { proposeRange, rangeText, SHORT_RANGE } from "./spell-range";

const state = (text: string | undefined, range = 30, target = 1) => ({ text, range, target });

describe("rangeText", () => {
  it("reads the Range line of a description", () => {
    expect(rangeText("Vampiric Touch\nRange: Touch\r\nDuration: 1 turn")).toBe("Touch");
  });

  it("is undefined without one", () => {
    expect(rangeText("Quivering Palm: the monk strikes")).toBeUndefined();
  });
});

describe("proposeRange", () => {
  it("gates a touch spell", () => {
    expect(proposeRange("X", { role: "damage" }, [state("Touch", 1)])).toBe(SHORT_RANGE);
  });

  it("gates a short range spell", () => {
    expect(proposeRange("X", { role: "damage" }, [state("Short", 10)])).toBe(SHORT_RANGE);
  });

  it("gates a spell that is touch in only one state of the game", () => {
    expect(proposeRange("X", { role: "kill" }, [state("Touch", 1), state("Medium", 20)])).toBe(
      SHORT_RANGE,
    );
  });

  it("leaves out a spell on allies: nothing else would bring its caster closer", () => {
    expect(proposeRange("X", { role: "buff" }, [state("Touch", 1)])).toBeUndefined();
    expect(proposeRange("X", { role: "reactive" }, [state("Short", 10)])).toBeUndefined();
  });

  it("gates an innate touching a creature, which has no Range line", () => {
    expect(proposeRange("X", { role: "disable" }, [state(undefined, 1)])).toBe(SHORT_RANGE);
  });

  it("leaves out a cone, whose description only says Special", () => {
    expect(proposeRange("X", { role: "damage" }, [state("Special", 10, 4)])).toBeUndefined();
  });

  it("gates a charge delivered in melee", () => {
    const self = state("Personal", 1, 5);
    expect(proposeRange("SPWI117", { role: "damage" }, [self])).toBe(SHORT_RANGE);
    expect(proposeRange("SPCL820", { role: "buff" }, [self])).toBe(SHORT_RANGE);
    expect(proposeRange("OTHER", { role: "damage" }, [self])).toBeUndefined();
  });

  it("gates an offensive touch cast on self", () => {
    expect(proposeRange("X", { role: "damage" }, [state("Touch", 1, 5)])).toBe(SHORT_RANGE);
  });

  it("leaves out a protection of its caster, even described as touch", () => {
    expect(proposeRange("X", { role: "protection" }, [state("Touch", 1)])).toBeUndefined();
  });

  it("leaves out longer ranges and missing states", () => {
    expect(proposeRange("X", { role: "damage" }, [state("Long", 30)])).toBeUndefined();
    expect(proposeRange("X", { role: "damage" }, [state("Medium", 20)])).toBeUndefined();
    expect(proposeRange("X", { role: "damage" }, [undefined])).toBeUndefined();
  });
});
