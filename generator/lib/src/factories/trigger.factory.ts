import { GLOBAL_CONFIG } from "../../config/generate";
import { TargetListName } from "../../config/target-name";
import { ScriptTarget } from "../model/constants";
import { AlignIdentifier } from "../model/ids/align";
import { AllegianceIdentifier } from "../model/ids/allegiance";
import { AStylesIdentifiers } from "../model/ids/astyles";
import { AreaTypeValue } from "../model/ids/misc";
import { StateIdentifier } from "../model/ids/state";
import { StatsIdentifier } from "../model/ids/stats";
import { ParamObject } from "../model/parameter";
import { Triggers } from "../model/script/triggers";
import targetService from "../services/baf/target.service";

class TriggerFactory {
  or(triggers: Triggers.Trigger[]): Triggers.Trigger {
    return { name: "Or", triggers };
  }

  haveSpellRES(resources: string[], negation = false): Triggers.Trigger[] {
    return resources.map((r) => ({
      name: "HaveSpellRES",
      params: [r],
      negation,
    }));
  }

  hplt(value: number, negation = false): Triggers.Trigger {
    return { name: "HPLT", params: [ScriptTarget.token, value], negation };
  }

  hpPercentLt(value: number, negation = false): Triggers.Trigger {
    return { name: "HPPercentLT", params: [ScriptTarget.token, value], negation };
  }

  range(value: number, negation = false): Triggers.Trigger {
    return { name: "Range", params: [ScriptTarget.token, value], negation };
  }

  attackedBy(obj: ParamObject, type: AStylesIdentifiers, negation = false): Triggers.Trigger {
    return { name: "AttackedBy", params: [obj, type], negation };
  }

  alignment(value: AlignIdentifier, negation = false): Triggers.Trigger {
    return { name: "Alignment", params: [ScriptTarget.token, value], negation };
  }

  detect(value: ParamObject, negation = false): Triggers.Trigger {
    return {
      name: "Detect",
      params: [value],
      negation,
    };
  }

  allegiance(value: AllegianceIdentifier, negation = false): Triggers.Trigger {
    return {
      name: "Allegiance",
      params: [ScriptTarget.token, value],
      negation,
    };
  }

  checkSpellState(spell: string, negation = false): Triggers.Trigger {
    return {
      name: "CheckSpellState",
      params: [ScriptTarget.token, spell],
      negation,
    };
  }

  areaType(type: AreaTypeValue, negation = false): Triggers.Trigger {
    return { name: "AreaType", params: [type], negation };
  }

  hasItem(resources: string[], negation = false): Triggers.Trigger[] {
    return resources.map((r) => ({
      name: "HasItem",
      params: [r, ScriptTarget.myself],
      negation,
    }));
  }

  global(name: string, value: number, area = "LOCALS", negation = false): Triggers.Trigger {
    return {
      name: "Global",
      params: [name, area, value],
      negation,
    };
  }

  globalTimerReallyExpired(name: string): Triggers.Trigger {
    return {
      name: "GlobalTimerExpired",
      params: [name, "LOCALS"],
    };
  }

  globalTimerExpired(name: string): Triggers.Trigger {
    return {
      name: "GlobalTimerNotExpired",
      params: [name, "LOCALS"],
      negation: true,
    };
  }

  globalRoundTimerExpired(): Triggers.Trigger {
    return {
      name: "GlobalTimerNotExpired",
      params: [GLOBAL_CONFIG.bafConstants.roundTimer, "LOCALS"],
      negation: true,
    };
  }

  hasBounceEffects(negation = false): Triggers.Trigger {
    return {
      name: "HasBounceEffects",
      params: [ScriptTarget.token],
      negation,
    };
  }

  hasImmunityEffects(negation = false): Triggers.Trigger {
    return {
      name: "HasImmunityEffects",
      params: [ScriptTarget.token],
      negation,
    };
  }

  checkStatGT(value: number, stat: StatsIdentifier, negation = false): Triggers.Trigger {
    return {
      name: "CheckStatGT",
      params: [ScriptTarget.token, value, stat],
      negation,
    };
  }

  checkStatLT(value: number, stat: StatsIdentifier, negation = false): Triggers.Trigger {
    return {
      name: "CheckStatLT",
      params: [ScriptTarget.token, value, stat],
      negation,
    };
  }

  checkStat(value: number, stat: StatsIdentifier, negation = false): Triggers.Trigger {
    return {
      name: "CheckStat",
      params: [ScriptTarget.token, value, stat],
      negation,
    };
  }

  stateCheck(state: StateIdentifier, negation = false): Triggers.Trigger {
    return {
      name: "StateCheck",
      params: [ScriptTarget.token, state],
      negation,
    };
  }

  validTrackTarget({
    isTargetPlayer,
    seeInvisible,
  }: {
    isTargetPlayer: boolean;
    seeInvisible: boolean;
  }): Triggers.Trigger[] {
    const results: Triggers.Trigger[] = [
      {
        name: "CheckStatGT",
        params: [ScriptTarget.token, 0, "SANCTUARY"],
        negation: true,
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_CHARMED"],
        negation: true,
      },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_REALLY_DEAD"],
        negation: true,
      },
    ];
    if (!seeInvisible) {
      results.unshift({
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_INVISIBLE"],
        negation: true,
      });
      results.unshift({
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_IMPROVEDINVISIBILITY"],
        negation: true,
      });
    }
    if (!isTargetPlayer)
      results.unshift({
        name: "General",
        params: [ScriptTarget.token, "WEAPON"],
        negation: true,
      });
    return results;
  }

  validSpellTarget({
    isTargetPlayer,
    seeInvisible,
  }: {
    isTargetPlayer: boolean;
    seeInvisible: boolean;
  }): Triggers.Trigger[] {
    const results: Triggers.Trigger[] = [
      { name: "See", params: [ScriptTarget.token] },
      {
        name: "CheckStatGT",
        params: [ScriptTarget.lastSeen, 0, "SANCTUARY"],
        negation: true,
      },
      // {
      //   name: "StateCheck",
      //   params: [ScriptTarget.token, "STATE_CHARMED"],
      //   negation: true,
      // },
      {
        name: "StateCheck",
        params: [ScriptTarget.lastSeen, "STATE_REALLY_DEAD"],
        negation: true,
      },
    ];
    if (!seeInvisible) {
      results.push({
        name: "StateCheck",
        params: [ScriptTarget.lastSeen, "STATE_IMPROVEDINVISIBILITY"],
        negation: true,
      });
    }
    if (!isTargetPlayer)
      results.push({
        name: "General",
        params: [ScriptTarget.lastSeen, "WEAPON"],
        negation: true,
      });
    return results;
  }

  validAttackTarget({
    isTargetPlayer,
    maxRange,
  }: {
    isTargetPlayer: boolean;
    maxRange?: number;
  }): Triggers.Trigger[] {
    const results: Triggers.Trigger[] = [
      {
        name: "CheckStatGT",
        params: [ScriptTarget.token, 0, "SANCTUARY"],
        negation: true,
      },
      // {
      //   name: "StateCheck",
      //   params: [ScriptTarget.token, "STATE_CHARMED"],
      //   negation: true,
      // },
      {
        name: "StateCheck",
        params: [ScriptTarget.token, "STATE_REALLY_DEAD"],
        negation: true,
      },
      { name: "See", params: [ScriptTarget.token] },
    ];
    if (!isTargetPlayer)
      results.unshift({
        name: "General",
        params: [ScriptTarget.token, "WEAPON"],
        negation: true,
      });
    if (maxRange) {
      results.push({
        name: "Range",
        params: [ScriptTarget.token, maxRange],
      });
    }
    return results;
  }

  // this: void - doesn't use `this`, and is passed around unbound (e.g. baf.factory.ts's
  // `.map(triggerFactory.inverseNegation)`).
  inverseNegation(this: void, trigger: Triggers.Trigger): Triggers.Trigger {
    return { ...trigger, negation: !trigger.negation };
  }

  inverseNegations(triggers: Triggers.Trigger[]): Triggers.Trigger[] {
    return triggers.reduce<Triggers.Trigger[]>((acc, trigger) => {
      if ("triggers" in trigger) {
        acc.push(...this.inverseNegations(trigger.triggers));
      } else {
        acc.push(this.inverseNegation(trigger));
      }
      return acc;
    }, []);
  }

  seeOneInTargetList(targetListName: TargetListName): Triggers.Trigger[] {
    const list = targetService.getList(targetListName);
    const triggers = list.targets.map<Triggers.Trigger>((t) => ({
      name: "See",
      params: [t],
    }));
    return [{ name: "Or", triggers }];
  }
}

const triggerFactory = new TriggerFactory();
export default triggerFactory;
