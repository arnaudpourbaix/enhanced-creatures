import { TargetListName, TargetStatusName } from "../../../config/target-name";
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
}

export interface TargetStatus {
  status: TargetStatusName;
  targetTriggers: Triggers.Trigger[];
  triggers: Triggers.Trigger[];
  canOnlyTargetPlayer: boolean;
  requireIntelligence: boolean;
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
}
