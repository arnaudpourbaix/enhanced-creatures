import { SpellKeyword } from "../../../config/spells/keyword";
import { TargetListName, TargetStatusName } from "../../../config/target/target-name";
import { Triggers } from "./triggers";

export interface TargetList {
  name: TargetListName;
  /**
   * Reverse target list
   */
  reverse?: boolean;
  /**
   * Randomize target list order (default: false)
   */
  randomOrder?: boolean;
  /**
   * Limit target list length
   */
  limit?: number;
  /**
   * Target must have one these status
   */
  includeStatus?: TargetStatusName[];
  excludeStatus?: TargetStatusName[];
  triggers?: Triggers.Trigger[];
  /**
   * This tier's own SpellKeyword(s) (e.g. "elf"/"halfElf" to skip a race resistant to this spell) -
   */
  keywords?: SpellKeyword[];
}

export interface TargetStatus {
  status: TargetStatusName;
  targetTriggers: Triggers.Trigger[];
  triggers: Triggers.Trigger[];
  canOnlyTargetPlayer: boolean;
  requireIntelligence: boolean;
  /**
   * A status preferred over the next ones only within bafConstants.preferRange (for a creature
   * fighting in melee): a farther target falls through to the next statuses instead of making the
   * creature cross the battlefield.
   */
  preferWithin?: boolean;
  /** Targets the creature's own side (its target list holds allies), not its opponents. */
  targetsAllies?: boolean;
}

/**
 * Target Priority
 * For each target list, go through all status
 * If status is not set, it will auto generated based on creature intelligence and if it has a grabbing ability
 * If targets is not set, it will use NearestEnemy for most status except Sleep that requires a Player
 */
export interface TargetPriority {
  targets: TargetListName[];
  status: TargetStatusName[];
  /**
   * Only targets passing these (ScriptTarget.token being the target), e.g. those a level drain
   * works on. Such a priority doesn't cover its statuses: the default ones still follow.
   */
  triggers?: Triggers.Trigger[];
  /**
   * Only while these hold, on the creature itself (e.g. not shapechanged). Like `triggers`, such
   * a priority doesn't cover its statuses.
   */
  conditions?: Triggers.Trigger[];
  /** Tells such a priority apart in the script comments (e.g. "drainable") */
  label?: string;
}
