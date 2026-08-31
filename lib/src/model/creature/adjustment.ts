import { StringReference } from "../final/stringref";
import { PartialBy } from "../utility-types";
import { BaseCreature } from "./creature";
import { InputCreatureData } from "./data-input";
import { Game } from "./game";

export interface CreatureAdjustment extends BaseCreature {
  /**
   * Files this adjustment patches. Declared directly here (previously inherited from
   * `BaseCreature`, which no longer carries `files`). Adjustment files stay `string[]`;
   * only `Creature.files` becomes game-scoped `CreatureFile[]`.
   */
  files: string[];
  /**
   * Which game this adjustment applies to. Absent ⇒ both games. Gates the entire
   * adjustment entry (data, summon, scriptName, stringRef, movement, everything
   * `handleAdjustment` emits). Independent of csv file membership.
   */
  game?: Game;
  /**
   * Is it a summon ?
   */
  summon: boolean;
  /**
   * Don't assign a weapon
   */
  noWeapon: boolean;
  /**
   * Script name
   */
  scriptName: boolean;
  /**
   * Name of the creature
   */
  stringRef?: StringReference;
}

// `game` is already optional on the interface, so it stays optional here without being
// listed among the keys `PartialBy` relaxes.
export type PartialCreatureAdjustment = PartialBy<
  Omit<CreatureAdjustment, "data">,
  "summon" | "noWeapon" | "scriptName"
> & { data?: InputCreatureData };
