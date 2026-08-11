import { describe, expect, it } from "vitest";
import { ScriptTarget } from "../model/constants";
import { Actions } from "../model/script/actions";
import { Statements } from "../model/script/script";
import bafFactory from "./baf.factory";
import responseFactory from "./response.factory";
import triggerFactory from "./trigger.factory";

const GOODCUTOFF = "[GOODCUTOFF]";
const EVILCUTOFF = "[EVILCUTOFF]";
const ATTACK_NEAREST = "Attack nearest";

describe("addStatementsFromTargetList", () => {
  it("emits one statement per target, resolving the trigger token to each target", () => {
    const statements: Statements = [];
    bafFactory.addStatementsFromTargetList({
      statements,
      triggers: [triggerFactory.range(30)],
      targets: [GOODCUTOFF, ScriptTarget.myself],
      responses: responseFactory.response([
        { name: "AttackOneRound", params: [ScriptTarget.token] } as unknown as Actions.Action,
      ]),
      comment: ATTACK_NEAREST,
    });

    expect(statements).toHaveLength(2);
    expect(statements[0].triggers[0]).toMatchObject({
      params: [GOODCUTOFF, 30],
    });
    expect(statements[1].triggers[0]).toMatchObject({
      params: [ScriptTarget.myself, 30],
    });
  });

  it("only puts the comment on the first generated statement", () => {
    const statements: Statements = [];
    bafFactory.addStatementsFromTargetList({
      statements,
      triggers: [triggerFactory.range(30)],
      targets: [GOODCUTOFF, EVILCUTOFF],
      responses: responseFactory.response([]),
      comment: ATTACK_NEAREST,
    });

    expect(statements[0].comment).toBe(ATTACK_NEAREST);
    expect(statements[1].comment).toBe("");
  });

  it("resolves the response action target to LastSeenBy, except when the target is Myself", () => {
    const statements: Statements = [];
    bafFactory.addStatementsFromTargetList({
      statements,
      triggers: [triggerFactory.range(30)],
      targets: [GOODCUTOFF, ScriptTarget.myself],
      responses: responseFactory.response([
        { name: "AttackOneRound", params: [ScriptTarget.token] } as unknown as Actions.Action,
      ]),
    });

    expect(
      (statements[0].responses[0].actions[0] as Actions.Action & { params: unknown[] }).params,
    ).toEqual([ScriptTarget.lastSeen]);
    expect(
      (statements[1].responses[0].actions[0] as Actions.Action & { params: unknown[] }).params,
    ).toEqual([ScriptTarget.myself]);
  });

  it("reverses target order when reverse is set", () => {
    const statements: Statements = [];
    bafFactory.addStatementsFromTargetList({
      statements,
      triggers: [triggerFactory.range(30)],
      targets: [GOODCUTOFF, EVILCUTOFF],
      responses: responseFactory.response([]),
      reverse: true,
    });

    expect(statements[0].triggers[0]).toMatchObject({
      params: [EVILCUTOFF, 30],
    });
    expect(statements[1].triggers[0]).toMatchObject({
      params: [GOODCUTOFF, 30],
    });
  });
});

describe("addOneBlockTargetList", () => {
  it("builds one negation-inversed Or trigger per target, AND'd into a single leading statement", () => {
    const statements: Statements = [];
    bafFactory.addOneBlockTargetList({
      statements,
      targets: [GOODCUTOFF, EVILCUTOFF],
      targetTriggers: [triggerFactory.range(30)],
      responses: responseFactory.response([]),
      comment: "Attack held enemy",
    });

    expect(statements[0].comment).toBe("Attack held enemy");
    expect(statements[0].triggers).toEqual([
      {
        name: "Or",
        triggers: [{ ...triggerFactory.range(30), params: [GOODCUTOFF, 30], negation: true }],
      },
      {
        name: "Or",
        triggers: [{ ...triggerFactory.range(30), params: [EVILCUTOFF, 30], negation: true }],
      },
    ]);
  });

  it("inserts inBetweenStatements between the leading Or block and the final action statement", () => {
    const statements: Statements = [];
    const inBetween: Statements = [{ triggers: [], responses: responseFactory.response([]) }];
    bafFactory.addOneBlockTargetList({
      statements,
      targets: [GOODCUTOFF],
      targetTriggers: [],
      responses: responseFactory.response([]),
      inBetweenStatements: inBetween,
    });

    expect(statements).toHaveLength(3);
    expect(statements[1]).toBe(inBetween[0]);
  });

  it("emits no extra statement when inBetweenStatements is omitted", () => {
    const statements: Statements = [];
    bafFactory.addOneBlockTargetList({
      statements,
      targets: [GOODCUTOFF],
      targetTriggers: [],
      responses: responseFactory.response([]),
    });

    expect(statements).toHaveLength(2);
  });

  it("resolves the final statement's response target to LastSeenBy", () => {
    const statements: Statements = [];
    bafFactory.addOneBlockTargetList({
      statements,
      targets: [GOODCUTOFF],
      targetTriggers: [],
      responses: responseFactory.response([
        { name: "AttackOneRound", params: [ScriptTarget.token] } as unknown as Actions.Action,
      ]),
    });

    const final = statements[statements.length - 1];
    expect(
      (final.responses[0].actions[0] as Actions.Action & { params: unknown[] }).params,
    ).toEqual([ScriptTarget.lastSeen]);
  });

  it("reverses target order when reverse is set", () => {
    const statements: Statements = [];
    bafFactory.addOneBlockTargetList({
      statements,
      targets: [GOODCUTOFF, EVILCUTOFF],
      targetTriggers: [triggerFactory.range(30)],
      responses: responseFactory.response([]),
      reverse: true,
    });

    expect(statements[0].triggers[0]).toMatchObject({
      triggers: [{ params: [EVILCUTOFF, 30] }],
    });
    expect(statements[0].triggers[1]).toMatchObject({
      triggers: [{ params: [GOODCUTOFF, 30] }],
    });
  });
});
