import { GLOBAL_CONFIG } from "../../config/generate";
import { Counts } from "../../config/target/target-config";
import { AlliesCheck } from "../model/creature/ability";
import { ScriptTarget } from "../model/constants";
import { SpellReference } from "../model/spell-item/spell-reference";
import { Actions } from "../model/script/actions";
import { Aera } from "../model/script/aera";

class ActionFactory {
  setGlobal(name: string, value: number, area: Aera = "LOCALS"): Actions.Action {
    return {
      name: "SetGlobal",
      params: [name, area, value],
    };
  }

  incrementGlobal(name: string, value: number, area: Aera = "LOCALS"): Actions.Action {
    return {
      name: "IncrementGlobal",
      params: [name, area, value],
    };
  }

  setGlobalTimer(name: string, value: number): Actions.Action {
    return {
      name: "SetGlobalTimer",
      params: [name, "LOCALS", value],
    };
  }

  setGlobalRoundTimer(): Actions.Action {
    return {
      name: "SetGlobalTimer",
      params: [GLOBAL_CONFIG.bafConstants.roundTimer, "LOCALS", 6],
    };
  }

  enableInterrupt(): Actions.Action {
    return {
      name: "SetInterrupt",
      params: ["TRUE"],
    };
  }

  disableInterrupt(actions: Actions.Action[]): Actions.Action[];
  disableInterrupt(): Actions.Action;
  // Standard TS overload pattern: the two signatures above each return a single, consistent
  // type; this implementation signature's union return type is required to satisfy both.
  // eslint-disable-next-line sonarjs/function-return-type
  disableInterrupt(actions?: Actions.Action[]): Actions.Action | Actions.Action[] {
    if (!actions) return { name: "SetInterrupt", params: ["FALSE"] };
    return [this.disableInterrupt(), ...actions, this.enableInterrupt()];
  }

  /**
   * Orders the target's nearest allies (the `count` ones alliesCheck examined, see
   * triggerFactory.alliesSafe) to briefly run away. Meant to be queued before the spell itself:
   * queued after, it would only run once the spell is cast, when the blast has almost landed.
   * Unconditional there, alliesCheck having already made sure they're out of the blast or
   * protected: it only keeps them from walking into it while the spell is being cast. The inner
   * action runs as the ally, hence NearestEnemyOf(Myself) standing for the spell's target.
   */
  alliesRunAway(check: AlliesCheck, target = `${ScriptTarget.lastSeen}(${ScriptTarget.myself})`) {
    const count = check.count ?? 3;
    if (count < 0 || count >= Counts.length) throw new Error(`Invalid alliesCheck count ${count}`);
    return Counts.slice(0, count).map((c): Actions.Action => ({
      name: "ActionOverride",
      params: [
        `${c}NearestEnemyOf(${target})`,
        `RunAwayFromNoInterruptNoLeaveArea(NearestEnemyOf(${ScriptTarget.myself}),15)`,
      ],
    }));
  }

  removeSpellRES(resources: string[], negation = false): Actions.Action[] {
    return resources.map((r) => ({
      name: "RemoveSpellRES",
      params: [r],
      negation,
    }));
  }

  removeSpell(resources: SpellReference[], negation = false): Actions.Action[] {
    return resources.map((r) =>
      r.id !== undefined
        ? {
            name: "RemoveSpell",
            params: [r.id],
            negation,
          }
        : {
            name: "RemoveSpellRES",
            params: [r.file],
            negation,
          },
    );
  }
}

const actionFactory = new ActionFactory();
export default actionFactory;
