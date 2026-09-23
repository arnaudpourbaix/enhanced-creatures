import { SpellKeyword } from "../../../config/spells/keyword";
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
  /**
   * This tier's own SpellKeyword(s) (e.g. "elf"/"halfElf" to skip a race resistant to this spell) -
   * AbilityService.appendSpellCheckTriggers auto-appends the matching spellChecks() triggers to
   * this target list specifically, in addition to (not instead of) the ability's own `keywords`.
   * Unlike BaseCreatureAbility.keywords (applied uniformly to every target list of an ability),
   * this lets different tiers of a fallback cascade use different, independently-toggleable checks
   * - e.g. a charm spell's best-case tier excluding both Elf and Half-Elf, a looser fallback tier
   * excluding only Elf, and a last-resort tier excluding neither.
   */
  keywords?: SpellKeyword[];
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
