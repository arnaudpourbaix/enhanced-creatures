export const CreatureSizeTable = [
  { size: "Tiny", attackRange: 0, grabModifier: -8 },
  { size: "Small", attackRange: 1, grabModifier: -4 },
  { size: "Medium", attackRange: 1, grabModifier: 0 },
  { size: "Large", attackRange: 2, grabModifier: 4 },
  { size: "Huge", attackRange: 2, grabModifier: 8 },
  { size: "Gargantuan", attackRange: 3, grabModifier: 12 },
  { size: "Colossal", attackRange: 4, grabModifier: 16 },
] as const;

export type CreatureSize = (typeof CreatureSizeTable)[number]["size"];
