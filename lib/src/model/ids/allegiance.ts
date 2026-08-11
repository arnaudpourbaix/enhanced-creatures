export const ALLEGIANCE_IDENTIFIERS = [
  /**
   * Used by script actions and triggers. Includes all party-friendly allegiances.
   */
  "GOODCUTOFF",
  /**
   * Creatures of same allegiance as party, but uses red (hostile) selection circles. Can not be controlled by the player.
   */
  "GOODBUTRED",
  /**
   * Creatures of same allegiance as party, but uses blue (neutral) selection circles. Can not be controlled by the player.
   */
  "GOODBUTBLUE",
  /**
   * Used by script actions and triggers. Includes all hostile allegiances.
   */
  "EVILCUTOFF",
  /**
   * Hostile creatures, but uses green (friendly) selection circles.
   */
  "EVILBUTGREEN",
  /**
   * Hostile creatures, but uses blue (neutral) selection circles.
   */
  "EVILBUTBLUE",
  /**
   * Creatures that are hostile to the party and allied creatures.
   */
  "ENEMY",
  "ANYONE",
  "INANIMATE",
  "PC",
  "FAMILIAR",
  "ALLY",
  "CONTROLLED",
  "CHARMED",
  "REALLYCHARMED",
  /**
   * This is just a separate EA from ENEMY for detection purposes. They're still valid objects for EVILCUTOFF and NearestEnemyOf(), but not by ENEMY. It's not specific to PCs.
   */
  "CHARMED_PC",
  /**
   * Used by script actions and triggers. Includes everything except party-friendly allegiances.
   */
  "NOTGOOD",
  "ANYTHING",
  "NEUTRAL",
  /**
   * Used by neutrals when targetting with enemy-only spells.
   */
  "NOTNEUTRAL",
  /**
   * Used by script actions and triggers. Includes everything except hostile allegiances.
   */
  "NOTEVIL",
] as const;

export type AllegianceIdentifier = (typeof ALLEGIANCE_IDENTIFIERS)[number];
