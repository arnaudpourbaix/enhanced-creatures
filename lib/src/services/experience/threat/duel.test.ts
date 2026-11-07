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

const confusion: HitEffect = { ...paralysis, kind: "confusion", saves: [], chance: 0.5 };

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

  it("a power on a cooldown casts once at the start, then once per cooldown", () => {
    // 6 uses over the 30-round cap, but a 5-round cooldown: once in a 2-round duel
    const leap = power({
      uses: 6,
      cooldown: 5,
      effects: [{ ...paralysis, saves: [], chance: 0.3 }],
    });
    const result = meleeDuel(profile({ powers: [leap] }), referenceFighter(2));
    expect(result.fighterRounds).toBeLessThan(5);
    expect(result.monsterRounds).toBeCloseTo(result.fighterRounds / 0.3, 3);
  });

  it("a 0 HP monster gives no NaN", () => {
    const gaze = power({ effects: [{ ...paralysis, saves: [] }] });
    const p = profile({ hp: 0, attacks: [attack(10)], powers: [gaze] });
    const result = meleeDuel(p, referenceFighter(2));
    expect(result.notes.join()).not.toContain("NaN");
    // its attacks still count: 10 × 60% ÷ 26 HP
    expect(result.monsterRounds).toBeCloseTo(26 / 6, 3);
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

  it("melee confusion doesn't break the kiting: its melee never lands", () => {
    const confusing = profile({ movement: 6, attacks: [attack(10, [confusion])] });
    expect(rangedDuel(confusing, referenceArcher(2)).monsterRounds).toBe(30);
  });

  it("a ranged confusion power breaks the kiting for part of the fight", () => {
    const pattern = power({ ranged: true, uses: 1, effects: [confusion] });
    const result = rangedDuel(brute(6), referenceArcher(2));
    const confused = rangedDuel({ ...brute(6), powers: [pattern] }, referenceArcher(2));
    expect(result.monsterRounds).toBe(30);
    expect(confused.monsterRounds).toBeLessThan(30);
  });

  it("a weak ranged attack or power never lowers a slow monster's ratio", () => {
    const slow = profile({ level: 6, hp: 60, ac: 4, thac0: 15, movement: 6, apr: 2 });
    const brute = { ...slow, attacks: [attack(10), attack(10)] };
    const dart = { ...brute, attacks: [...brute.attacks, attack(1.5, [], true)] };
    const bolt = { ...brute, powers: [power({ ranged: true, uses: 1, average: 3 })] };
    const archer = referenceArcher(6);
    const base = rangedDuel(brute, archer).ratio;
    expect(rangedDuel(dart, archer).ratio).toBeGreaterThanOrEqual(base);
    expect(rangedDuel(bolt, archer).ratio).toBeGreaterThanOrEqual(base);
    expect(threat(dart).threat).toBeGreaterThanOrEqual(threat(brute).threat);
    expect(threat(bolt).threat).toBeGreaterThanOrEqual(threat(brute).threat);
  });

  it("a ranged monster shoots back", () => {
    const shot = attack(3.5, [], true);
    const archer = profile({ movement: 6, thac0: 15, attacks: [shot, shot] });
    const result = rangedDuel(archer, referenceArcher(2));
    expect(result.monsterRounds).toBeLessThan(30);
    expect(result.notes[0]).toBe("shoots back");
  });

  it("a shooter weaker than being kited keeps the kited duel", () => {
    const archer = profile({ movement: 6, attacks: [attack(3.5, [], true)] });
    expect(rangedDuel(archer, referenceArcher(2)).notes[0]).toBe("kited");
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
