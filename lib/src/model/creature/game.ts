/** Which game a creature file / adjustment applies to. Absent ⇒ both games. */
export type Game = "bg1" | "bg2";

export interface CreatureFile {
  name: string;
  /** Absent ⇒ the file applies to both games. */
  game?: Game;
}

/** Two game scopes conflict when they can both be active in one install. */
export function gamesOverlap(a: Game | undefined, b: Game | undefined): boolean {
  return a === undefined || b === undefined || a === b;
}

/** Install-time WeiDU predicate for each game. EET folds into bg1. */
export const GAME_IS_CONDITION: Record<Game, string> = {
  bg1: "GAME_IS ~bgee eet~",
  bg2: "GAME_IS ~bg2ee~",
};
