import { describe, expect, it } from "vitest";
import {
  hitDiceValue,
  scoreExperience,
  toughHitterAbility,
  xpForHitDiceValue,
} from "./experience-table";

describe("fast movement", () => {
  const fast = { ability: "fastMovement" as const, source: "movement 15" };
  it("counts nothing with no offensive ability: speed brings no danger (wild dog 1d4)", () => {
    expect(scoreExperience({ whole: 1, plus: true }, [fast])).toMatchObject({ total: 2, xp: 35 });
  });
  it("counts with an offensive ability (ghast paralysis)", () => {
    const s = scoreExperience({ whole: 4, plus: false }, [
      fast,
      { ability: "paralysis", source: "Claws" },
    ]);
    expect(s.abilities.map((a) => a.ability)).toEqual(["fastMovement", "paralysis"]);
  });
  it("defensive abilities alone don't make it count (AC 0)", () => {
    const s = scoreExperience({ whole: 5, plus: false }, [
      fast,
      { ability: "acZeroOrLower", source: "AC -1" },
    ]);
    expect(s.abilities.map((a) => a.ability)).toEqual(["acZeroOrLower"]);
  });
});

describe("slow movement", () => {
  it("counts nothing when invisible at will: an unseen spider can't be kited (phase spider)", () => {
    const s = scoreExperience({ whole: 5, plus: true }, [
      { ability: "slowMovement", source: "movement 6" },
      { ability: "fatalPoison", source: "Jaws" },
      { ability: "invisibleAtWill", source: "Phase out" },
    ]);
    expect(s.abilities.map((a) => a.ability)).toEqual(["fatalPoison", "invisibleAtWill"]);
    expect(s).toMatchObject({ total: 10, xp: 1400 });
  });
});

describe("toughHitterAbility", () => {
  const hard = [
    { ability: "roundDamage15" as const, source: "SWORD 10.5 + SWORD 10.5 = 21 a round" },
  ];
  it("hard to kill (5+ rounds) and hard hitting (a round damage tier)", () => {
    expect(toughHitterAbility(6.75, 5, hard)).toEqual({
      ability: "toughHitter",
      source: "6.8 rounds for a level 5 fighter",
    });
  });
  it("not when quick to kill", () => {
    expect(toughHitterAbility(4.9, 5, hard)).toBeUndefined();
  });
  it("not when hitting softly, however hard to kill (a ghast)", () => {
    expect(toughHitterAbility(9, 4, [{ ability: "paralysis", source: "Claws" }])).toBeUndefined();
  });
});

describe("experience table", () => {
  it("maps every Table 31 row", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15].map(xpForHitDiceValue)).toEqual([
      7, 15, 35, 65, 120, 175, 270, 420, 650, 975, 1400, 2000, 3000, 5000,
    ]);
  });
  it("smooths Table 31's 11-12 plateau: 12 is halfway to 13", () => {
    // a cave bear (12) above a brown bear (11), both 2000 in the DMG (user)
    expect(xpForHitDiceValue(12)).toBe(2500);
  });
  it("a plus moves up one row only below 10 HD", () => {
    expect(hitDiceValue({ whole: 4, plus: true })).toBe(5);
    expect(hitDiceValue({ whole: 10, plus: true })).toBe(10);
    expect(hitDiceValue({ whole: 13, plus: true })).toBe(13);
  });
  it("scores the Monstrous Manual ogre (4+1 HD, one modifier) at 270", () => {
    const s = scoreExperience({ whole: 4, plus: true }, [
      { ability: "acZeroOrLower", source: "AC 0" },
    ]);
    expect(s).toMatchObject({ hitDiceValue: 5, total: 6, xp: 270 });
  });
  it("counts an ability once and level 3+ spells replace level 1-2 spells", () => {
    const s = scoreExperience({ whole: 8, plus: false }, [
      { ability: "poison", source: "bite" },
      { ability: "poison", source: "sting" },
      { ability: "lowSpells", source: "SPWI112" },
      { ability: "highSpells", source: "SPWI304" },
    ]);
    expect(s.total).toBe(12);
    expect(s.abilities.map((a) => a.ability)).toEqual(["poison", "highSpells"]);
  });
  it("writes the breakdown", () => {
    expect(
      scoreExperience({ whole: 4, plus: true }, [{ ability: "poison", source: "bite" }]).breakdown,
    ).toBe("4+ HD → 5, +2 poison (bite) = 7 → 420");
  });
  it("writes the breakdown without abilities", () => {
    expect(scoreExperience({ whole: 4, plus: true }, []).breakdown).toBe("4+ HD → 5 = 5 → 175");
  });
  it("prints a negative modifier without a plus", () => {
    const s = scoreExperience({ whole: 6, plus: false }, [
      { ability: "slowMovement", source: "movement 6" },
    ]);
    expect(s).toMatchObject({ total: 5, xp: 175 });
    expect(s.breakdown).toBe("6 HD → 6, -1 slow movement (movement 6) = 5 → 175");
  });
  it("movement doesn't count for a flier or a missile wielder", () => {
    for (const exempt of ["missileWeapons", "flies"] as const) {
      for (const movement of ["slowMovement", "fastMovement"] as const) {
        const s = scoreExperience({ whole: 6, plus: false }, [
          { ability: movement, source: "movement" },
          { ability: exempt, source: "x" },
        ]);
        expect(s.abilities.map((a) => a.ability)).toEqual([exempt]);
      }
    }
  });
  it("movement counts for a creature killing in melee, spells or breath included", () => {
    // a fast vampire is hard to kite, whatever its spells (user)
    for (const other of ["supremeSpells", "breathWeapon", "poison"] as const) {
      const s = scoreExperience({ whole: 6, plus: false }, [
        { ability: "fastMovement", source: "movement 18" },
        { ability: other, source: "x" },
      ]);
      expect(s.abilities.map((a) => a.ability)).toEqual(["fastMovement", other]);
    }
  });
  it("only the strongest poison counts", () => {
    const s = scoreExperience({ whole: 5, plus: false }, [
      { ability: "weakPoison", source: "claws" },
      { ability: "fatalPoison", source: "stinger" },
    ]);
    expect(s.abilities.map((a) => a.ability)).toEqual(["fatalPoison"]);
    expect(s.total).toBe(8);
  });
  it("only the highest spell tier counts", () => {
    const s = scoreExperience({ whole: 9, plus: false }, [
      { ability: "highSpells", source: "Fireball" },
      { ability: "supremeSpells", source: "Power Word Kill" },
    ]);
    expect(s.abilities.map((a) => a.ability)).toEqual(["supremeSpells"]);
    expect(s.total).toBe(13);
  });
});
