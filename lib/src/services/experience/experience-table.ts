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
  | "greaterSpells"
  | "supremeSpells"
  | "magicResistance"
  | "lowMagicResistance"
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
  | "fastMovement"
  | "fatalPoison"
  | "strongPoison"
  | "weakPoison";

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
  highSpells: { modifier: 2, label: "level 3-4 spells" },
  // Table 32 stops at "level 3 or greater" (user): higher spells are a bigger threat
  greaterSpells: { modifier: 3, label: "level 5-6 spells" },
  supremeSpells: { modifier: 4, label: "level 7-9 spells" },
  // Table 32 has one magic resistance row (user): a 20% one is far from a 75% one
  magicResistance: { modifier: 2, label: "magic resistance 50%+" },
  lowMagicResistance: { modifier: 1, label: "magic resistance 20-49%" },
  missileWeapons: { modifier: 1, label: "missile weapons" },
  multipleAttacks30: { modifier: 2, label: "multiple attacks over 30 damage" },
  paralysis: { modifier: 2, label: "paralysis" },
  petrification: { modifier: 3, label: "petrification" },
  poison: { modifier: 2, label: "poison" },
  // The 2e poison table runs from 5 damage to death (user): a typed poison counts by its tier
  fatalPoison: { modifier: 3, label: "fatal poison" },
  strongPoison: { modifier: 2, label: "strong poison" },
  weakPoison: { modifier: 1, label: "weak poison" },
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

// 2e DMG Table 31, indexed by Hit Dice value. Its "11 to 12+: 2,000" row is smoothed (user): 12 is
// halfway to 13's 3,000, so a stronger creature on the plateau (a cave bear's 12 against a brown
// bear's 11) is worth more.
const TABLE_31 = [7, 15, 35, 65, 120, 175, 270, 420, 650, 975, 1400, 2000, 2500];

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

const POISONS: XpAbility[] = ["fatalPoison", "strongPoison", "poison", "weakPoison"];
const SPELL_TIERS: XpAbility[] = ["supremeSpells", "greaterSpells", "highSpells", "lowSpells"];

/**
 * Abilities that make ground movement irrelevant (user): flying (hover, an at-will Fly: its speed
 * is the flight's, already worth "flies") or shooting a wielded missile weapon instead of closing
 * in. Spells and breath weapons don't: vampires, hell hounds and golems still kill in melee, and a
 * fast one is hard to kite.
 */
const MOVEMENT_IRRELEVANT: XpAbility[] = ["flies", "missileWeapons"];
const MOVEMENT: XpAbility[] = ["slowMovement", "fastMovement"];

/** Movement only counts for a creature that walks into melee: see MOVEMENT_IRRELEVANT. */
function groundMeleeMovementOnly(abilities: DetectedAbility[]): DetectedAbility[] {
  if (!abilities.some((a) => MOVEMENT_IRRELEVANT.includes(a.ability))) return abilities;
  return abilities.filter((a) => !MOVEMENT.includes(a.ability));
}

/** Keeps only the strongest of a group of abilities that don't add up. */
function strongestOf(abilities: DetectedAbility[], group: XpAbility[]): DetectedAbility[] {
  const members = abilities.filter((a) => group.includes(a.ability));
  if (members.length < 2) return abilities;
  const strongest = members.reduce(
    (best, a) =>
      XP_ABILITIES[a.ability].modifier > XP_ABILITIES[best.ability].modifier ? a : best,
    members[0],
  );
  return abilities.filter((a) => !group.includes(a.ability) || a === strongest);
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
  // Only the highest spell tier counts, and a creature's strongest poison, not each of them
  abilities = strongestOf(abilities, SPELL_TIERS);
  abilities = strongestOf(abilities, POISONS);
  abilities = groundMeleeMovementOnly(abilities);
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
