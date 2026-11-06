import { describe, expect, it } from "vitest";
import { hitDiceValue, scoreExperience, xpForHitDiceValue } from "./experience-table";

describe("experience table", () => {
  it("maps every Table 31 row", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 15].map(xpForHitDiceValue))
      .toEqual([7, 15, 35, 65, 120, 175, 270, 420, 650, 975, 1400, 2000, 2000, 3000, 5000]);
  });
  it("a plus moves up one row only below 10 HD", () => {
    expect(hitDiceValue({ whole: 4, plus: true })).toBe(5);
    expect(hitDiceValue({ whole: 10, plus: true })).toBe(10);
    expect(hitDiceValue({ whole: 13, plus: true })).toBe(13);
  });
  it("scores the Monstrous Manual ogre (4+1 HD, one modifier) at 270", () => {
    const s = scoreExperience({ whole: 4, plus: true }, [{ ability: "acZeroOrLower", source: "AC 0" }]);
    expect(s).toMatchObject({ hitDiceValue: 5, total: 6, xp: 270 });
  });
  it("counts an ability once and level 3+ spells replace level 1-2 spells", () => {
    const s = scoreExperience({ whole: 8, plus: false }, [
      { ability: "poison", source: "bite" }, { ability: "poison", source: "sting" },
      { ability: "lowSpells", source: "SPWI112" }, { ability: "highSpells", source: "SPWI304" },
    ]);
    expect(s.total).toBe(12);
    expect(s.abilities.map((a) => a.ability)).toEqual(["poison", "highSpells"]);
  });
  it("writes the breakdown", () => {
    expect(scoreExperience({ whole: 4, plus: true }, [{ ability: "poison", source: "bite" }]).breakdown)
      .toBe("4+ HD → 5, +2 poison (bite) = 7 → 420");
  });
  it("writes the breakdown without abilities", () => {
    expect(scoreExperience({ whole: 4, plus: true }, []).breakdown).toBe("4+ HD → 5 = 5 → 175");
  });
});
