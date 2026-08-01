import { describe, expect, it } from "vitest";
import { GenericScriptParameterData } from "../model/script/data";
import stateService from "./state.service";

interface StateServicePrivate {
  buildParameters(params: string): GenericScriptParameterData[];
}

const service = stateService as unknown as StateServicePrivate;

const REEVALUATION_PERIOD_PARAM = "I:ReevaluationPeriod*";

describe("buildParameters (private)", () => {
  it("returns an empty array for an empty parameter string", () => {
    expect(service.buildParameters("")).toEqual([]);
  });

  it("parses a single object parameter (O: prefix)", () => {
    expect(service.buildParameters("O:Target*")).toEqual([
      { raw: "O:Target*", name: "Target", isNumber: false, isObject: true },
    ]);
  });

  it("parses a single integer parameter (I: prefix)", () => {
    expect(service.buildParameters(REEVALUATION_PERIOD_PARAM)).toEqual([
      {
        raw: REEVALUATION_PERIOD_PARAM,
        name: "ReevaluationPeriod",
        isNumber: true,
        isObject: false,
      },
    ]);
  });

  it("parses a string parameter (S: prefix) as neither number nor object", () => {
    expect(service.buildParameters("S:GLOBAL*")).toEqual([
      { raw: "S:GLOBAL*", name: "GLOBAL", isNumber: false, isObject: false },
    ]);
  });

  it("special-cases I:Object* as an object parameter, not a number", () => {
    expect(service.buildParameters("I:Object*")).toEqual([
      { raw: "I:Object*", name: "Object", isNumber: false, isObject: true },
    ]);
  });

  it("strips a trailing group/state qualifier after the *", () => {
    expect(service.buildParameters("I:DmgType*Damages")).toEqual([
      {
        raw: "I:DmgType*Damages",
        name: "DmgType",
        isNumber: true,
        isObject: false,
      },
    ]);
  });

  it("splits multiple comma-separated parameters", () => {
    expect(service.buildParameters("O:Target*,I:ReevaluationPeriod*")).toEqual([
      { raw: "O:Target*", name: "Target", isNumber: false, isObject: true },
      {
        raw: REEVALUATION_PERIOD_PARAM,
        name: "ReevaluationPeriod",
        isNumber: true,
        isObject: false,
      },
    ]);
  });
});
