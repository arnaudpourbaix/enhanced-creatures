export interface SpellCaster {
  /**
   * Level 4 spell, can trigger 2 spells of level 1-2
   */
  minorSequencer?: {
    presets: string[];
  };
  /**
   * Level 7 spell, can trigger 3 spells of level 1-4
   */
  sequencer?: {
    presets: string[];
  };
  /**
   * Level 6 spell, can trigger 1 spell.
   * The spell level must be lower or equal to the level of the caster divided by three
   */
  contingency?: {
    condition: ContingencyTrigger;
    preset: string;
  };
  /**
   * Level 9 spell, can trigger 3 spells of level 1-8.
   */
  chainContingency?: {
    condition: ContingencyTrigger;
    presets: string[];
  };
}

export type ContingencyTrigger =
  "hit" | "seeEnemy" | "hp50" | "hp25" | "hp10" | "helpless" | "poisoned";
