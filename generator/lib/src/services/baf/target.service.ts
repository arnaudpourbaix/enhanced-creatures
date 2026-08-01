import { GLOBAL_CONFIG } from "../../../config/generate";
import { DEFAULT_STATUS_ORDER, TARGET_LISTS, TARGET_STATUS } from "../../../config/target-config";
import { TargetListName, TargetStatusName } from "../../../config/target-name";
import triggerFactory from "../../factories/trigger.factory";
import { PartialCreatureAttack } from "../../model/creature/attack";
import { Creature } from "../../model/creature/creature";
import { GRAB_DEFAULT_CONFIG } from "../../model/creature/grab";
import { AlignIdentifier } from "../../model/ids/align";
import { AllegianceIdentifier } from "../../model/ids/allegiance";
import { ClassIdentifier } from "../../model/ids/class";
import { GenderIdentifier } from "../../model/ids/gender";
import { GeneralIdentifier } from "../../model/ids/general";
import { ObjectIdentifier } from "../../model/ids/object";
import { RaceIdentifier } from "../../model/ids/race";
import { SpecificIdentifier } from "../../model/ids/specific";
import { TargetList, TargetPriority, TargetStatus } from "../../model/script/target";
import { Triggers } from "../../model/script/triggers";
import utils from "../utils/utils.service";

class TargetService {
  // TARGET_STATUS has one entry per TargetStatusName member, so this is always found.
  private getStatusDetails(status: TargetStatusName): TargetStatus {
    const details = TARGET_STATUS.find((s) => s.status === status);
    if (!details) throw new Error(`Target status ${status} is not defined !`);
    return details;
  }

  targetObject(p: {
    ea?: AllegianceIdentifier;
    general?: GeneralIdentifier;
    race?: RaceIdentifier;
    clazz?: ClassIdentifier;
    specific?: SpecificIdentifier;
    gender?: GenderIdentifier;
    align?: AlignIdentifier;
  }): string {
    const list = [
      p.ea ?? 0,
      p.general ?? 0,
      p.race ?? 0,
      p.clazz ?? 0,
      p.specific ?? 0,
      p.gender ?? 0,
      p.align ?? 0,
    ];
    for (let i = list.length - 1; i >= 0 && list[i] === 0; i--) {
      list.pop();
    }
    return list.join(".");
  }

  getTargetFromAbility(
    target: ObjectIdentifier | AllegianceIdentifier | TargetListName,
    limit: number | undefined,
    randomOrder = false,
  ): {
    targets: ObjectIdentifier | AllegianceIdentifier | string[];
    allegianceCheck: boolean;
  } {
    try {
      const result = this.getList(target as TargetListName);
      if (randomOrder && GLOBAL_CONFIG.enableRandomTargetOrder) {
        result.targets = utils.shuffleArray(result.targets);
      }
      if (limit) result.targets = result.targets.slice(0, limit);
      return result;
    } catch {
      return {
        targets: target as ObjectIdentifier | AllegianceIdentifier,
        allegianceCheck: false,
      };
    }
  }

  getTriggersFromTargetList(target: TargetList): {
    triggers: Triggers.Trigger[];
    targetTriggers: Triggers.Trigger[];
  } {
    const targetTriggers: Triggers.Trigger[] = target.triggers ?? [];
    const triggers: Triggers.Trigger[] = [];
    for (const name of target.includeStatus ?? []) {
      const status = this.getStatusDetails(name);
      triggers.push(...status.triggers);
      targetTriggers.push(...status.targetTriggers);
    }
    for (const name of target.excludeStatus ?? []) {
      const status = this.getStatusDetails(name);
      triggers.push(...status.triggers);
      targetTriggers.push(...triggerFactory.inverseNegations(status.targetTriggers));
    }
    return { triggers, targetTriggers };
  }

  getTargetPriorities(creature: Creature, attack: PartialCreatureAttack): TargetPriority[] {
    const defaults = this.getDefaultStatus(creature);
    const targetPriorities = attack.targetPriorities ?? [];
    const results: TargetPriority[] = [];
    for (const t of targetPriorities) {
      if (!t.status && !t.targets) throw new Error(`Empty targetPriority is not allowed !`);
      else if (!t.targets) {
        if (!t.status) throw new Error(`Empty targetPriority is not allowed !`);
        results.push(...this.getTargetPrioritiesFromStatusList(t.status));
      } else if (!t.status) {
        results.push({
          targets: t.targets,
          status: t.targets.every((i) => i === "Players")
            ? defaults.allStatus
            : defaults.targetStatus,
        });
      } else {
        results.push({
          status: t.status,
          targets: t.targets,
        });
      }
    }
    const defaultTargetStatus = this.getLeftoversStatusList(
      defaults.targetStatus,
      "NearestEnemies",
      results,
    );
    if (defaultTargetStatus.length) {
      results.push({
        targets: ["NearestEnemies"],
        status: defaultTargetStatus,
      });
    }
    const defaultPlayerStatus = this.getLeftoversStatusList(
      defaults.playerStatus,
      "Players",
      results,
    );
    if (defaultPlayerStatus.length) {
      results.push({ targets: ["Players"], status: defaultPlayerStatus });
    }
    // console.log("targets:", results);
    return results;
  }

  private getLeftoversStatusList(
    list: TargetStatusName[],
    target: TargetListName,
    priorities: TargetPriority[],
  ): TargetStatusName[] {
    return list.filter(
      (s) => !priorities.some((p) => p.targets.includes(target) && p.status.includes(s)),
    );
  }

  getList(name: TargetListName): {
    targets: string[];
    allegianceCheck: boolean;
  } {
    const list = TARGET_LISTS.find((l) => l.name === name);
    if (!list) throw new Error(`Target list ${name} is not defined !`);
    return { targets: list.value, allegianceCheck: list.allegianceCheck };
  }

  combineListWithTriggers(list: TargetList[], triggers: Triggers.Trigger[]): TargetList[] {
    return list.map((l) => ({
      ...l,
      triggers: [...(l.triggers ?? []), ...triggers],
    }));
  }

  private getDefaultStatus(creature: Creature): {
    allStatus: TargetStatusName[];
    targetStatus: TargetStatusName[];
    playerStatus: TargetStatusName[];
  } {
    const allStatus = DEFAULT_STATUS_ORDER.filter((status) => {
      const statusDetails = this.getStatusDetails(status);
      const validStatus =
        status !== "Grabbed" ||
        creature.spells.some((s) => s.name === GRAB_DEFAULT_CONFIG.grabStringRef);
      const intelligence =
        !statusDetails.requireIntelligence ||
        (!!creature.data.intelligence && creature.data.intelligence >= 8);
      return validStatus && intelligence;
    });
    const targetStatus = this.getFilteredStatusNameList(allStatus, false);
    const playerStatus = this.getFilteredStatusNameList(allStatus, true);
    return { targetStatus, playerStatus, allStatus };
  }

  private getTargetPrioritiesFromStatusList(status: TargetStatusName[]): TargetPriority[] {
    const results: TargetPriority[] = [];
    const targetStatus = this.getFilteredStatusNameList(status, false);
    const playerStatus = this.getFilteredStatusNameList(status, true);
    if (targetStatus.length) {
      results.push({
        targets: ["NearestEnemies"],
        status: targetStatus,
      });
    }
    if (playerStatus.length) {
      results.push({ targets: ["Players"], status: playerStatus });
    }
    return results;
  }

  private getFilteredStatusNameList(
    list: TargetStatusName[],
    canOnlyTargetPlayer: boolean,
  ): TargetStatusName[] {
    return list.filter((status) => {
      const statusDetails = this.getStatusDetails(status);
      return statusDetails.canOnlyTargetPlayer === canOnlyTargetPlayer;
    });
  }
}

const targetService = new TargetService();
export default targetService;
