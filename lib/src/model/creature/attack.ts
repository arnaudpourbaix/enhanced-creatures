import { TargetStatusName } from "../../../config/target-name";
import { TargetPriority } from "../script/target";
import { Triggers } from "../script/triggers";
import { WeaponSlot } from "./item";

export interface CreatureAttack {
  /**
   * Allow melee attack (default: true)
   */
  melee: boolean;

  /**
   * Allow range attack (default: false)
   */
  ranged: boolean;

  /**
   * Maximum range for selecting a target (usefull when creature can leap/teleport at will)
   */
  maxRange?: number;

  /* Uses this when a monster have several attacks per round with 2 different weapons.
   * It makes sure that both weapons are properly used.
   * It will:
   * - remove one attack per round (because offhand gives one)
   * - gives 3 points in two weapons fighting
   * - add a bonus to hit of +2 to offhand.
   */
  dualWielding: boolean;

  /**
   * Target priorities in combat
   */
  targetPriorities: TargetPriority[];

  /**
   * Allow to select a specific weapon slot when target is affected by a list of status
   */
  targetStatusWeaponSlot: {
    status: TargetStatusName[];
    slot: WeaponSlot;
  }[];

  /**
   * Allow to select a weapon before an attack.
   * Usefull when a creature can choose a specific weapon
   */
  selectWeapons: { slot: WeaponSlot; triggers: Triggers.Trigger[] }[];

  /**
   * Default weapon slot, when no specific configuration exists
   */
  defaultWeaponSlot?: WeaponSlot;

  /**
   * Not needed if creature has only one weapon (melee or ranged).
   * If omitted, creature won't use SelectWeaponAbility to select a weapon.
   */
  actions: CreatureAttackAction[];
}

export interface CreatureAttackAction {
  responseWeight?: number;
  weaponSlot?: WeaponSlot;
  /**
   * If true, disable interrupt while attacking (false by default)
   */
  disableInterrupt?: boolean;
}

export type PartialCreatureAttack = Partial<
  Omit<CreatureAttack, "dualWielding" | "targetPriorities"> & {
    targetPriorities?: Partial<TargetPriority>[];
  }
>;
