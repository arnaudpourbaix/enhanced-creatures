import { beforeAll, describe, expect, it } from "vitest";
import { State } from "../../state";
import stateService from "../state.service";
import bafGeneratorService from "./baf-generator.service";
import actionFactory from "../../factories/action.factory";
import triggerFactory from "../../factories/trigger.factory";
import responseFactory from "../../factories/response.factory";
import { ScriptTarget, CR } from "../../model/constants";
import utils from "../utils/utils.service";
import { ConditionalStatement } from "../../model/script/script";
import { GenericScriptParameterData } from "../../model/script/data";
import { Actions } from "../../model/script/actions";
import { Triggers } from "../../model/script/triggers";

// This is the compiler from the typed BAF AST (Actions.Action / Triggers.Trigger)
// to the actual WeiDU script text. State.actions/State.triggers (parameter
// metadata driving quoting/object-resolution rules) are only populated once
// stateService.init() has run, so it's called here rather than per test.
beforeAll(async () => {
  await stateService.init();
});

describe("generateAction", () => {
  it("quotes string params and leaves numbers bare", () => {
    const action = actionFactory.setGlobal("JA#TEST", 1);
    expect(bafGeneratorService.generateAction(action)).toBe('\t\tSetGlobal("JA#TEST","LOCALS",1)');
  });

  it("renders a boolean-typed param unquoted", () => {
    expect(bafGeneratorService.generateAction(actionFactory.enableInterrupt())).toBe(
      "\t\tSetInterrupt(TRUE)",
    );
    expect(bafGeneratorService.generateAction(actionFactory.disableInterrupt())).toBe(
      "\t\tSetInterrupt(FALSE)",
    );
  });

  it("wraps a bare object identifier ending in 'By' with (Myself), matching real generated output", () => {
    const action = { name: "AttackOneRound", params: [ScriptTarget.lastSeen] };
    expect(bafGeneratorService.generateAction(action as unknown as Actions.Action)).toBe(
      "\t\tAttackOneRound(LastSeenBy(Myself))",
    );
  });

  it("throws when the action has the wrong number of parameters", () => {
    const action = { name: "SetGlobal", params: ["JA#TEST"] };
    expect(() => bafGeneratorService.generateAction(action as unknown as Actions.Action)).toThrow(
      /Not enough parameters/,
    );
  });

  it("throws for an unregistered action name", () => {
    const action = { name: "NotARealAction", params: [] };
    expect(() => bafGeneratorService.generateAction(action as unknown as Actions.Action)).toThrow(
      "Unknown action NotARealAction",
    );
  });

  it("throws when a registered action's parameter metadata has a hole at a matching-length index", () => {
    State.actions.push({
      name: "JA#TestHoleAction",
      parameters: [undefined as unknown as GenericScriptParameterData],
      description: "",
    });
    try {
      const action = { name: "JA#TestHoleAction", params: ["x"] };
      expect(() => bafGeneratorService.generateAction(action as unknown as Actions.Action)).toThrow(
        /Unexpected parameter x for action JA#TestHoleAction/,
      );
    } finally {
      State.actions.pop();
    }
  });
});

describe("generateTrigger", () => {
  it("renders an object+number trigger resolved against Myself", () => {
    const [trigger] = utils.replaceTriggerTokens(
      [triggerFactory.range(30)],
      [{ key: ScriptTarget.token, value: ScriptTarget.myself }],
    );
    expect(bafGeneratorService.generateTrigger(trigger, false)).toBe("\tRange(Myself,30)");
  });

  it("prefixes negated triggers with '!'", () => {
    const [trigger] = utils.replaceTriggerTokens(
      [triggerFactory.range(30, true)],
      [{ key: ScriptTarget.token, value: ScriptTarget.lastSeen }],
    );
    expect(bafGeneratorService.generateTrigger(trigger, false)).toBe(
      "\t!Range(LastSeenBy(Myself),30)",
    );
  });

  it("matches the real Allegiance(Myself,EVILCUTOFF) line generated for creatures", () => {
    const [trigger] = utils.replaceTriggerTokens(
      [triggerFactory.allegiance("EVILCUTOFF")],
      [{ key: ScriptTarget.token, value: ScriptTarget.myself }],
    );
    expect(bafGeneratorService.generateTrigger(trigger, false)).toBe(
      "\tAllegiance(Myself,EVILCUTOFF)",
    );
  });

  it("throws when the trigger has the wrong number of parameters", () => {
    const trigger = { name: "Range", params: [30] };
    expect(() =>
      bafGeneratorService.generateTrigger(trigger as unknown as Triggers.Trigger, false),
    ).toThrow(/Not enough parameters/);
  });

  it("throws for an unregistered trigger name", () => {
    const trigger = { name: "NotARealTrigger", params: [] };
    expect(() =>
      bafGeneratorService.generateTrigger(trigger as unknown as Triggers.Trigger, false),
    ).toThrow("Unknown trigger NotARealTrigger");
  });

  it("throws when a registered trigger's parameter metadata has a hole at a matching-length index", () => {
    State.triggers.push({
      name: "JA#TestHoleTrigger",
      parameters: [undefined as unknown as GenericScriptParameterData],
      description: "",
    });
    try {
      const trigger = { name: "JA#TestHoleTrigger", params: ["x"] };
      expect(() =>
        bafGeneratorService.generateTrigger(trigger as unknown as Triggers.Trigger, false),
      ).toThrow(/Unexpected parameter x for trigger JA#TestHoleTrigger/);
    } finally {
      State.triggers.pop();
    }
  });
});

describe("generateTriggers", () => {
  it("indents nested Or triggers one level deeper and emits OR(n)", () => {
    const triggers = [
      triggerFactory.or([
        triggerFactory.attackedBy("[GOODCUTOFF]", "DEFAULT"),
        triggerFactory.range(10),
      ]),
    ];
    const resolved = utils.replaceTriggerTokens(triggers, [
      { key: ScriptTarget.token, value: ScriptTarget.myself },
    ]);
    expect(bafGeneratorService.generateTriggers(resolved, false)).toEqual([
      "\tOR(2)",
      "\t\tAttackedBy([GOODCUTOFF],DEFAULT)",
      "\t\tRange(Myself,10)",
    ]);
  });

  it("throws for an Or with fewer than 2 conditions", () => {
    const triggers = [triggerFactory.or([triggerFactory.range(10)])];
    expect(() => bafGeneratorService.generateTriggers(triggers, false)).toThrow(
      /OR trigger should have at least 2 conditions/,
    );
  });
});

describe("generateStatement", () => {
  it("renders a full IF/THEN/END block matching the real 'Detect combat' block generated for creatures", () => {
    const triggers = utils.replaceTriggerTokens(
      [triggerFactory.global("JA#COMBAT", 0), triggerFactory.allegiance("EVILCUTOFF")],
      [{ key: ScriptTarget.token, value: ScriptTarget.myself }],
    );
    const statement: ConditionalStatement = {
      triggers,
      comment: "Detect combat",
      responses: responseFactory.response([actionFactory.setGlobal("JA#COMBAT", 1)]),
    };

    const expected = [
      "// Detect combat",
      "IF",
      '\tGlobal("JA#COMBAT","LOCALS",0)',
      "\tAllegiance(Myself,EVILCUTOFF)",
      "THEN",
      "\tRESPONSE #100",
      '\t\tSetGlobal("JA#COMBAT","LOCALS",1)',
      "END",
      "",
      "",
    ].join(CR);

    expect(bafGeneratorService.generateStatement(statement)).toBe(expected);
  });
});
