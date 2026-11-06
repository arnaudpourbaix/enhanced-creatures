export type XpAbility =
  | "acZeroOrLower"
  | "bloodDrain"
  | "breathWeapon"
  | "causesDisease"
  | "energyDrain"
  | "flies"
  | "fourAttacks"
  | "extraHitPoints"
  | "highIntelligence"
  | "magicalWeaponsOnly"
  | "spellImmunity"
  | "weaponImmunity"
  | "invisibleAtWill"
  | "lowSpells"
  | "highSpells"
  | "magicResistance"
  | "missileWeapons"
  | "multipleAttacks30"
  | "paralysis"
  | "petrification"
  | "poison"
  | "magicalItems"
  | "regeneration"
  | "singleAttack20"
  | "specialDefense"
  | "specialMagicalAttack"
  | "specialAttack"
  | "swallowsWhole"
  | "weaknessOrFear"
  | "slowMovement"
  | "fastMovement";

/** 2e DMG Table 32: special ability modifiers. */
export const XP_ABILITIES: Record<XpAbility, { modifier: number; label: string }> = {
  acZeroOrLower: { modifier: 1, label: "AC 0 or lower" },
  bloodDrain: { modifier: 1, label: "blood drain" },
  breathWeapon: { modifier: 2, label: "breath weapon" },
  causesDisease: { modifier: 1, label: "causes disease" },
  energyDrain: { modifier: 3, label: "energy drain" },
  flies: { modifier: 1, label: "flies" },
  fourAttacks: { modifier: 1, label: "4+ attacks" },
  extraHitPoints: { modifier: 1, label: "extra hit points" },
  highIntelligence: { modifier: 1, label: "high intelligence" },
  magicalWeaponsOnly: { modifier: 1, label: "hit only by magical weapons" },
  spellImmunity: { modifier: 1, label: "spell immunity" },
  weaponImmunity: { modifier: 1, label: "weapon immunity" },
  invisibleAtWill: { modifier: 1, label: "invisible at will" },
  lowSpells: { modifier: 1, label: "level 1-2 spells" },
  highSpells: { modifier: 2, label: "level 3+ spells" },
  magicResistance: { modifier: 2, label: "magic resistance" },
  missileWeapons: { modifier: 1, label: "missile weapons" },
  multipleAttacks30: { modifier: 2, label: "multiple attacks over 30 damage" },
  paralysis: { modifier: 2, label: "paralysis" },
  petrification: { modifier: 3, label: "petrification" },
  poison: { modifier: 2, label: "poison" },
  magicalItems: { modifier: 1, label: "magical items" },
  regeneration: { modifier: 1, label: "regeneration" },
  singleAttack20: { modifier: 2, label: "single attack over 20 damage" },
  specialDefense: { modifier: 1, label: "special defense" },
  specialMagicalAttack: { modifier: 2, label: "special magical attack" },
  specialAttack: { modifier: 1, label: "special attack" },
  swallowsWhole: { modifier: 2, label: "swallows whole" },
  weaknessOrFear: { modifier: 2, label: "weakness or fear" },
  // Not in the DMG (user): a slow creature is easy to kite with missiles, a fast one outruns you
  slowMovement: { modifier: -1, label: "slow movement" },
  fastMovement: { modifier: 1, label: "fast movement" },
};

export interface HitDice {
  whole: number;
  plus: boolean;
}
export interface DetectedAbility {
  ability: XpAbility;
  source: string;
}
export interface ExperienceScore {
  hitDice: HitDice;
  hitDiceValue: number;
  abilities: DetectedAbility[];
  total: number;
  xp: number;
  breakdown: string;
}

const TABLE_31 = [7, 15, 35, 65, 120, 175, 270, 420, 650, 975, 1400, 2000, 2000];

export function hitDiceValue(hd: HitDice): number {
  return hd.plus && hd.whole < 10 ? hd.whole + 1 : hd.whole;
}

export function xpForHitDiceValue(value: number): number {
  if (value < 1) {
    return 7;
  }
  if (value >= 13) {
    return 3000 + 1000 * (value - 13);
  }
  return TABLE_31[value];
}

export function scoreExperience(hd: HitDice, detected: DetectedAbility[]): ExperienceScore {
  const seen = new Set<XpAbility>();
  let abilities = detected.filter((a) => {
    if (seen.has(a.ability)) {
      return false;
    }
    seen.add(a.ability);
    return true;
  });
  if (seen.has("highSpells")) {
    abilities = abilities.filter((a) => a.ability !== "lowSpells");
  }
  const value = hitDiceValue(hd);
  const total = value + abilities.reduce((sum, a) => sum + XP_ABILITIES[a.ability].modifier, 0);
  const xp = xpForHitDiceValue(total);
  const parts = [`${hd.whole}${hd.plus ? "+" : ""} HD → ${value}`];
  for (const a of abilities) {
    const { modifier, label } = XP_ABILITIES[a.ability];
    const sign = modifier < 0 ? "" : "+";
    parts.push(`${sign}${modifier} ${label} (${a.source})`);
  }
  return {
    abilities,
    total,
    xp,
    hitDice: hd,
    hitDiceValue: value,
    breakdown: `${parts.join(", ")} = ${total} → ${xp}`,
  };
}
