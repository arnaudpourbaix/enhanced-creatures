import { StringReference } from "../final/stringref";
import { PartialBy } from "../utility-types";
import { BaseCreature } from "./creature";
import { InputCreatureData } from "./data-input";

export interface CreatureAdjustment extends BaseCreature {
  /**
   * Files this adjustment patches. Declared directly here (previously inherited from
   * `BaseCreature`, which no longer carries `files`). Adjustment files stay `string[]`;
   * only `Creature.files` becomes game-scoped `CreatureFile[]`.
   */
  files: string[];
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

export type PartialCreatureAdjustment = PartialBy<
  Omit<CreatureAdjustment, "data">,
  "summon" | "noWeapon" | "scriptName"
> & { data?: InputCreatureData };
