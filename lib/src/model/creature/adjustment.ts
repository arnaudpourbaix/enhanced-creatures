import { StringReference } from "../final/stringref";
import { PartialBy } from "../utility-types";
import { BaseCreature, CreatureAutoGenerate } from "./creature";
import { InputCreatureData } from "./data-input";
import { Game } from "./game";
import type { Variant } from "./variant";

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
  /**
   * The variant that produced this adjustment, if any. Set by `variant.factory`, never by hand;
   * carries no weight in WeiDU generation - it only lets the documentation group adjustment cards
   * under their variant (and nest sub-variants). Undefined for a plain `setAdjustments` entry.
   */
  variant?: Variant;
  /**
   * Overrides the creature's own `autoGenerate` for this adjustment only (shallow per-key merge -
   * a key left unset here falls back to the creature's value). Lets a subset of files fight/save
   * as a different nominal level than their own `level1` (e.g. a "chieftain" template attacking
   * and saving as a stronger monster than its real Hit Dice), without that nominal level leaking
   * into other adjustments/variant sub-entries that already declare their own `level1`.
   */
  autoGenerate?: Partial<CreatureAutoGenerate>;
}

// `game` is already optional on the interface, so it stays optional here without being
// listed among the keys `PartialBy` relaxes.
export type PartialCreatureAdjustment = PartialBy<
  Omit<CreatureAdjustment, "data">,
  "summon" | "noWeapon" | "scriptName"
> & { data?: InputCreatureData };
