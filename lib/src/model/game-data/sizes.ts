export const CreatureSizeTable = [
  { size: "Tiny", reach: { tall: 0, long: 0 }, grabModifier: -8 },
  { size: "Small", reach: { tall: 5, long: 5 }, grabModifier: -4 },
  { size: "Medium", reach: { tall: 5, long: 5 }, grabModifier: 0 },
  { size: "Large", reach: { tall: 10, long: 5 }, grabModifier: 4 },
  { size: "Huge", reach: { tall: 15, long: 10 }, grabModifier: 8 },
  { size: "Gargantuan", reach: { tall: 20, long: 15 }, grabModifier: 12 },
  { size: "Colossal", reach: { tall: 30, long: 20 }, grabModifier: 16 },
] as const;

export type CreatureSize = (typeof CreatureSizeTable)[number]["size"];

const SIZE_BY_NAME = new Map(CreatureSizeTable.map((s) => [s.size, s]));

export const getCreatureSize = (size: CreatureSize) => {
  const entry = SIZE_BY_NAME.get(size);
  if (!entry) throw new Error(`Unknown creature size: ${size}`);
  return entry;
};
