import {
  AdditionalCode,
  CustomCode,
  PartialCustomCode,
} from "../script/script";
import { AbilityEntry, CreatureAbility, RawCreatureAbility, RawCreatureSequencerAbility } from "./ability";
import { SpellCaster } from "./spellcaster";

export interface CreatureBehavior {
  /**
   * Asking or responding to help shouts (default: true)
   */
  help: boolean;

  /**
   * Can track enemies when no one in sight ? (default: true)
   */
  tracking: boolean;

  /**
   * Random walk outside of combat (default: false)
   */
  walk: boolean;

  /**
   * Random walk within combat when nothing else to do (default: true)
   */
  combatWalk: boolean;

  /**
   * Fully heal while resting (default: false)
   */
  restHeal: boolean;

  /**
   * Can use potions (default: false)
   */
  usePotions: boolean;

  /**
   * Can use kit abilities (default: false)
   */
  useKitAbilities: boolean;

  /**
   * Able to hide in shadows (default: false)
   */
  hideInShadows: boolean;

  /**
   * Able to polymorph (default: false)
   */
  canPolymorph: boolean;

  /**
   * Will initiate dialog (values are creature script name)
   */
  dialog: string[];
  abilities: CreatureAbility[];
  spellcaster?: SpellCaster;
  customCodes: CustomCode[];
  additionalCodes: AdditionalCode[];
}

export type PartialCreatureBehavior = Omit<
  Partial<CreatureBehavior>,
  "abilities" | "customCodes"
> & {
  abilities?: (RawCreatureAbility | RawCreatureSequencerAbility)[] | { entries: AbilityEntry[] };
  customCodes?: PartialCustomCode[];
};

export const BEHAVIOR_DEFAULT: CreatureBehavior = {
  dialog: [],
  help: true,
  tracking: true,
  walk: false,
  combatWalk: true,
  restHeal: false,
  usePotions: false,
  useKitAbilities: false,
  hideInShadows: false,
  canPolymorph: false,
  customCodes: [],
  additionalCodes: [],
  abilities: [],
};
