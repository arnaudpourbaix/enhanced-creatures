export type SpellKeyword =
  /**
   * Blocked by Protection from Missiles
   */
  | "acid"
  | "blind"
  | "causeWounds"
  | "charm"
  | "cloud"
  | "cold"
  | "confusion"
  | "death"
  | "disease"
  | "electrical"
  /**
   * Resisted by elven blood (90% for full elves) - skip Elf targets
   */
  | "elf"
  | "fear"
  | "fire"
  | "movement"
  /**
   * Resisted by half-elven blood (30%) - skip Half-Elf targets
   */
  | "halfElf"
  | "hold"
  | "levelDrain"
  | "magicDamage"
  | "magicResistance"
  | "maze"
  | "miscast"
  | "missile"
  | "petrify"
  | "poison"
  | "polymorph"
  | "silence"
  | "sleep"
  | "slow"
  | "stun"
  /**
   * Blocked by Shield (wizard spell)
   */
  | "shield";
