import { PartialBy } from "../utility-types";
import { BaseCreature } from "./creature";
import { InputCreatureData } from "./data-input";

export interface CreatureAdjustment extends BaseCreature {
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
}

export type PartialCreatureAdjustment = PartialBy<
  Omit<CreatureAdjustment, "data">,
  "summon" | "noWeapon" | "scriptName"
> & { data?: InputCreatureData };
