import { beforeEach, describe, expect, it } from "vitest";
import { ABILITY_PRESETS } from "../../config/ability-presets";
import { SPELLS } from "../../config/spells/spell-database";
import { Creature } from "../model/creature/creature";
import { SaveTypeEnum, SpellTypeEnum } from "../model/spell-item/effect.enums";
import spellComboService from "./spell-combo.service";
import spellProfileService, { SpellProfile } from "./spell-profile.service";
import spellScoringService, { CasterReference } from "./spell-scoring.service";

const noCreature = { spells: [] } as unknown as Creature;

function wizard(key: keyof typeof SPELLS.Wizard): SpellProfile {
  const profile = spellProfileService.profileOf(SPELLS.Wizard[key].file, noCreature);
  if (!profile) throw new Error(`no profile for ${key}`);
  return profile;
}

function profile(p: Partial<SpellProfile>): SpellProfile {
  return {
    file: "TEST",
    level: 1,
    type: SpellTypeEnum.Wizard,
    role: "damage",
    secondaryRoles: [],
    castingTime: 5,
    keywords: [],
    tier: "decent",
    hitsAllies: false,
    spellCount: 1,
    ...p,
  };
}

const best = (level: number): CasterReference => ({ wizard: level, overall: level });
const score = (p: SpellProfile, caster: CasterReference) => spellScoringService.score(p, caster);

describe("score", () => {
  beforeEach(() => {
    spellComboService.usePresets(ABILITY_PRESETS);
  });

  it("prefers Finger of Death to Fireball for a level 15 wizard", () => {
    expect(score(wizard("FingerOfDeath"), best(7))).toBeGreaterThan(
      score(wizard("Fireball"), best(7)),
    );
  });

  it("prefers Abi-Dalzim's Horrid Wilting to Finger of Death once level 8 is in reach", () => {
    expect(score(wizard("AbiDalzimHorridWilting"), best(8))).toBeGreaterThan(
      score(wizard("FingerOfDeath"), best(8)),
    );
  });

  it("puts Minor Globe first for a level 7 wizard, Fireball close behind to surprise now and then", () => {
    const globe = score(wizard("MinorGlobeOfInvulnerability"), best(4));
    const fireball = score(wizard("Fireball"), best(4));
    expect(globe).toBeGreaterThan(fireball);
    expect(globe - fireball).toBeLessThanOrEqual(3);
  });

  it("puts a level 4 summon above single-target spells and Fireball for a level 7 wizard", () => {
    const summon = score(profile({ role: "summon", level: 4, castingTime: 9 }), best(4));
    for (const key of ["MagicMissiles", "MelfAcidArrow", "ChromaticOrb", "Fireball"] as const) {
      expect(summon).toBeGreaterThan(score(wizard(key), best(4)));
    }
  });

  it("puts Maze and Imprisonment above a level 9 summon for a level 18 wizard", () => {
    const gate = score(wizard("Gate"), best(9));
    expect(score(wizard("Maze"), best(9))).toBeGreaterThan(gate);
    expect(score(wizard("Imprisonment"), best(9))).toBeGreaterThan(gate);
  });

  it("counts a summon rated by hand at its worth, above the caster's best too", () => {
    const plain = profile({ role: "summon", level: 4, castingTime: 9 });
    const rated = { ...plain, worthLevel: 6 };
    expect(score(rated, best(4)) - score(plain, best(4))).toBe(4);
    expect(score(rated, best(6)) - score(plain, best(6))).toBe(4);
  });

  it("weighs a vampire's Domination close to Abi-Dalzim's, unlike the wizard spell", () => {
    const vampireDomination = profile({
      type: SpellTypeEnum.Innate,
      level: 5,
      role: "disable",
      keywords: ["charm"],
      saves: [{ types: [SaveTypeEnum.Spell], bonus: -6 }],
      castingTime: 1,
    });
    const abi = score(wizard("AbiDalzimHorridWilting"), best(8));
    expect(Math.abs(score(vampireDomination, best(8)) - abi)).toBeLessThanOrEqual(2);
    expect(abi - score(wizard("Domination"), best(8))).toBeGreaterThan(4);
  });

  it("values an area sparing allies above one hitting them (Horror, Sleep-like)", () => {
    const spares = score(profile({ level: 5, keywords: ["area"] }), best(5));
    const hits = score(profile({ level: 5, keywords: ["area"], hitsAllies: true }), best(5));
    expect(spares - hits).toBe(1);
  });

  it("scores two Magic Missiles at once as a level 3 spell, a little below Fireball", () => {
    const missiles = {
      ...wizard("MagicMissiles"),
      combo: "minorSequencer" as const,
      spellCount: 2,
    };
    const sequencer = score(missiles, best(8));
    expect(sequencer).toBeLessThan(score(wizard("Fireball"), best(8)));
    expect(sequencer - score(wizard("MagicMissiles"), best(8))).toBeGreaterThan(2);
  });

  it("scores two Mirror Images at once as a strong defensive spell, at least Blur", () => {
    const images = { ...wizard("MirrorImages"), combo: "minorSequencer" as const, spellCount: 2 };
    expect(score(images, best(8))).toBeGreaterThanOrEqual(score(wizard("Blur"), best(8)));
  });

  it("scores three Fireballs at once as a level 7 spell, above Cone of Cold", () => {
    const fireballs = { ...wizard("Fireball"), combo: "spellSequencer" as const, spellCount: 3 };
    expect(score(fireballs, best(8))).toBeGreaterThan(score(wizard("ConeOfCold"), best(8)));
  });

  it("adds 3 for a great spell and 1.5 for a good one", () => {
    const decent = score(profile({ level: 5 }), best(5));
    expect(score(profile({ level: 5, tier: "great" }), best(5)) - decent).toBe(3);
    expect(score(profile({ level: 5, tier: "good" }), best(5)) - decent).toBe(1.5);
  });

  it("counts Mirror Image as great up to a best level of 5, as good from 6", () => {
    const image = wizard("MirrorImages");
    const asDecent = { ...image, tier: "decent" as const };
    expect(score(image, best(5)) - score(asDecent, best(5))).toBe(3);
    expect(score(image, best(6)) - score(asDecent, best(6))).toBe(1.5);
  });

  it("values a good level 7 protection above Mirror Image, Mirror Image above a level 2 attack", () => {
    const image = score(wizard("MirrorImages"), best(7));
    expect(score(wizard("ProtectionFromTheElements"), best(7))).toBeGreaterThan(image);
    expect(image).toBeGreaterThan(score(wizard("MelfAcidArrow"), best(7)));
  });

  it("scores an innate against the creature's highest level overall", () => {
    const innate = profile({ type: SpellTypeEnum.Innate, level: 3 });
    expect(() => score(innate, { overall: 3 })).not.toThrow();
  });
});

describe("probability", () => {
  it("rarely opens with Magic Missile for a level 15 wizard, often with Finger of Death", () => {
    const missiles = wizard("MagicMissiles");
    const finger = wizard("FingerOfDeath");
    expect(spellScoringService.probability(missiles, score(missiles, best(7)))).toBeLessThan(50);
    expect(spellScoringService.probability(finger, score(finger, best(7)))).toBeGreaterThanOrEqual(
      85,
    );
  });

  it("caps a summon's chance, so another spell regularly slips in", () => {
    expect(spellScoringService.probability(profile({ role: "summon" }), 30)).toBe(75);
  });

  it("always casts a reactive spell", () => {
    expect(spellScoringService.probability(profile({ role: "reactive" }), -20)).toBe(100);
  });
});

describe("casterReference", () => {
  it("takes the highest level per class, and overall", () => {
    const profiles = [
      profile({ type: SpellTypeEnum.Wizard, level: 7 }),
      profile({ type: SpellTypeEnum.Priest, level: 4 }),
      profile({ type: SpellTypeEnum.Innate, level: 5 }),
    ];
    expect(spellScoringService.casterReference(profiles)).toEqual({
      wizard: 7,
      priest: 4,
      overall: 7,
    });
  });

  it("works from innates alone", () => {
    const profiles = [profile({ type: SpellTypeEnum.Innate, level: 3 })];
    expect(spellScoringService.casterReference(profiles)).toEqual({ overall: 3 });
  });
});
