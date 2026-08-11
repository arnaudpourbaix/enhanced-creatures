import { GLOBAL_CONFIG } from "../../config/generate";
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
}

const actionFactory = new ActionFactory();
export default actionFactory;
