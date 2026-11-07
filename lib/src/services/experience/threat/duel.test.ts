import { describe, expect, it } from "vitest";
import { SaveTypeEnum } from "../../../model/spell-item/effect.enums";
import { CombatProfile, HitEffect, ProfileAttack, ProfilePower } from "./combat-profile";
import { GAME_SPELL_HAZARD, meleeDuel, pFail, pHit, rangedDuel, threat } from "./duel";
import { referenceArcher, referenceFighter } from "./reference";

const paralysis: HitEffect = {
  kind: "ending",
  chance: 1,
  saves: [SaveTypeEnum.ParalyzePoisonDeath],
  saveBonus: 0,
  amount: 0,
  duration: 12,
};

function attack(average: number, effects: HitEffect[] = [], ranged = false): ProfileAttack {
  return { name: "attack", average, ranged, effects };
}

function profile(overrides: Partial<CombatProfile> = {}): CombatProfile {
  return {
    level: 2,
    hp: 24,
    ac: 6,
    thac0: 19,
    apr: 1,
    movement: 12,
    attacks: [],
    powers: [],
    invisibleAtWill: false,
    flies: false,
    resist: { slashing: 0, piercing: 0, missile: 0, magic: 0 },
    weaponEnchantment: 0,
    regeneration: 0,
    undead: false,
    construct: false,
    magicImmune: false,
    spellImmunity: false,
    declared: 0,
    ...overrides,
  };
}

/** The ghoul of Task 2: three paralyzing attacks, an undead */
function ghoul(): CombatProfile {
  return profile({
    apr: 3,
    attacks: [attack(3.5, [paralysis]), attack(2, [paralysis]), attack(2, [paralysis])],
    undead: true,
  });
}

function power(overrides: Partial<ProfilePower>): ProfilePower {
  return {
    name: "power",
    uses: Infinity,
    ranged: false,
    area: false,
    average: 0,
    effects: [],
    ...overrides,
  };
}

describe("pHit", () => {
  it("(21 - (THAC0 - AC)) / 20", () => {
    expect(pHit(19, 10)).toBeCloseTo(0.6);
  });
  it("is clamped to 5%..95%", () => {
    expect(pHit(30, -5)).toBeCloseTo(0.05);
    expect(pHit(1, 10)).toBeCloseTo(0.95);
  });
});

describe("pFail", () => {
  it("rolls under the save", () => {
    expect(pFail(14, 0)).toBeCloseTo(0.65);
  });
  it("a save bonus makes the save easier", () => {
    expect(pFail(14, 2)).toBeCloseTo(0.55);
  });
});

describe("meleeDuel", () => {
  it("the ghoul against a level 2 fighter", () => {
    const result = meleeDuel(ghoul(), referenceFighter(2));
    expect(result.monsterRounds).toBeCloseTo(1.057, 2);
    expect(result.fighterRounds).toBeCloseTo((24 / 11.875) * 1.2, 2);
    expect(result.ratio).toBeCloseTo(2.29, 2);
    expect(result.notes).toContain("77% ending a round");
  });

  it("a monster the fighter can't hurt lasts 30 rounds", () => {
    const result = meleeDuel(profile({ weaponEnchantment: 1 }), referenceFighter(2));
    expect(result.fighterRounds).toBe(30);
  });

  it("no attacks and no powers: 30 rounds to take the fighter out", () => {
    expect(meleeDuel(profile(), referenceFighter(2)).monsterRounds).toBe(30);
  });

  it("an at-will ending power counts at most the fighter's rounds of casts", () => {
    const gaze = power({ effects: [{ ...paralysis, saves: [], chance: 0.3 }] });
    const result = meleeDuel(profile({ powers: [gaze] }), referenceFighter(2));
    expect(result.monsterRounds).toBeCloseTo(1 / 0.3, 3);
  });

  it("a power with one use spreads over the fighter's rounds", () => {
    const gaze = power({ uses: 1, effects: [{ ...paralysis, saves: [], chance: 0.3 }] });
    const result = meleeDuel(profile({ powers: [gaze] }), referenceFighter(2));
    expect(result.monsterRounds).toBeCloseTo(result.fighterRounds / 0.3, 3);
  });

  it("a game damage spell counts from the table, as an area", () => {
    const fireball = power({ uses: Infinity, ranged: true, level: 3, role: "damage" });
    const ref = referenceFighter(2);
    const result = meleeDuel(profile({ powers: [fireball] }), ref);
    expect(GAME_SPELL_HAZARD.damage(3)).toMatchObject({ average: 28, ending: false });
    // 28 / 26 × 1.5, capped at 1
    expect(result.monsterRounds).toBe(1);
  });
});

describe("rangedDuel", () => {
  const brute = (movement: number) => profile({ movement, apr: 1, attacks: [attack(10)] });

  it("a slow melee monster is kited", () => {
    expect(rangedDuel(brute(6), referenceArcher(2)).monsterRounds).toBe(30);
  });

  it("a fast melee monster reaches the archer", () => {
    expect(rangedDuel(brute(15), referenceArcher(2)).monsterRounds).toBeLessThan(30);
  });

  it("a ranged monster shoots back", () => {
    const archer = profile({ movement: 6, attacks: [attack(3.5, [], true)] });
    expect(rangedDuel(archer, referenceArcher(2)).monsterRounds).toBeLessThan(30);
  });
});

describe("threat", () => {
  it("the geometric mean of both ratios", () => {
    const result = threat(ghoul());
    expect(result.threat).toBeCloseTo(Math.sqrt(result.melee.ratio * result.ranged.ratio), 6);
  });

  it("declared abilities multiply it by 1.1 each", () => {
    const base = threat(ghoul()).threat;
    const boosted = threat({ ...ghoul(), declared: 2 });
    expect(boosted.threat).toBeCloseTo(base * 1.1 * 1.1, 6);
  });
});
