import { describe, expect, it } from "vitest";
import { Triggers } from "../model/script/triggers";
import abilityFactory from "./ability.factory";

describe("polymorphSelf", () => {
  const triggers: Triggers.Trigger[] = [{ name: "CombatCounter", params: [0] }];
  const results = abilityFactory.polymorphSelf({ triggers });

  it("returns 1 cast-spell ability plus 9 polymorph form abilities", () => {
    expect(results).toHaveLength(10);
  });

  it("the first entry is the WIZARD_POLYMORPH_SELF cast trigger using the given triggers", () => {
    expect(results[0]).toMatchObject({
      triggers,
      name: "spell.PolymorphSelf.name",
      spell: { id: "WIZARD_POLYMORPH_SELF", selfTarget: true },
      requireVocal: true,
    });
  });

  it("assigns each form ability its resource, in order", () => {
    const resources = results.slice(1).map((a) => a.spell?.resource);
    expect(resources).toEqual([
      "SPWI495",
      "SPWI496",
      "DW-PSOM",
      "DW-PSHG",
      "DW-PSHH",
      "SPWI493",
      "SPWI494",
      "SPWI497",
      "SPWI490",
    ]);
  });

  it("gives every form ability except the last a decreasing RandomNumLT threshold (unbiased reservoir selection)", () => {
    const thresholds = results
      .slice(1, -1)
      .map((a) => a.triggers?.find((t) => t.name === "RandomNumLT")?.params);
    expect(thresholds).toEqual([
      [1000, 111],
      [1000, 125],
      [1000, 143],
      [1000, 167],
      [1000, 200],
      [1000, 250],
      [1000, 333],
      [1000, 500],
    ]);
  });

  it("the last form ability has no RandomNumLT trigger (guaranteed fallback if every earlier roll declines)", () => {
    const last = results[results.length - 1];
    expect(last.spell?.resource).toBe("SPWI490");
    expect(last.triggers).toEqual([]);
  });

  it("marks every form ability as noRoundTimer and usable while polymorphed", () => {
    for (const ability of results.slice(1)) {
      expect(ability.noRoundTimer).toBe(true);
      expect(ability.canUseWhenPolymorphed).toBe(true);
      expect(ability.timer).toEqual({ name: "polymorph", value: 12 });
    }
  });
});
