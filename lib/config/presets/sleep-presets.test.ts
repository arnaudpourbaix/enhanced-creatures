import { describe, expect, it } from "vitest";
import { SPELLS } from "../spells/spell-names";
import { SLEEP_PRESETS } from "./sleep-presets";

describe("SLEEP_PRESETS", () => {
  it("gives the GreaterCommand preset its own ability name instead of reusing Sleep's", () => {
    const greaterCommand = SLEEP_PRESETS.find(
      (p) => p.preset === SPELLS.Priest.GreaterCommand.file,
    );
    expect(greaterCommand?.ability.name).toBe(SPELLS.Priest.GreaterCommand.name);
  });

  it("doesn't reuse the same ability name across different spell presets", () => {
    const names = SLEEP_PRESETS.map((p) => p.ability.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
