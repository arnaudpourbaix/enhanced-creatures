import { describe, expect, it } from "vitest";
import { ScriptTarget } from "../model/constants";
import { CreatureAttackAction } from "../model/creature/attack";
import { Actions } from "../model/script/actions";
import responseFactory from "./response.factory";

describe("response", () => {
  it("wraps the given actions in a single weighted response, defaulting weight to 100", () => {
    const action: Actions.Action = { name: "Continue" };
    expect(responseFactory.response([action])).toEqual([
      { weight: 100, actions: [action] },
    ]);
  });

  it("uses the provided weight", () => {
    expect(responseFactory.response([], 42)).toEqual([
      { weight: 42, actions: [] },
    ]);
  });
});

describe("attackResponses", () => {
  it("selects the weapon ability for the attack's own weaponSlot", () => {
    const attacks: CreatureAttackAction[] = [{ weaponSlot: "WEAPON2" }];
    const responses = responseFactory.attackResponses({
      attacks,
      oncePerRound: true,
    });
    expect(responses).toEqual([
      {
        weight: 100,
        actions: [
          { name: "SelectWeaponAbility", params: ["SLOT_WEAPON1", 0] },
          { name: "AttackOneRound", params: [ScriptTarget.lastSeen] },
        ],
      },
    ]);
  });

  it("falls back to the shared weaponAttackSlot when the attack has none", () => {
    const attacks: CreatureAttackAction[] = [{}];
    const responses = responseFactory.attackResponses({
      attacks,
      oncePerRound: true,
      weaponAttackSlot: "SHIELD",
    });
    expect(responses[0].actions[0]).toEqual({
      name: "SelectWeaponAbility",
      params: ["SLOT_SHIELD", 0],
    });
  });

  it("omits weapon selection when neither the attack nor the shared slot is set", () => {
    const responses = responseFactory.attackResponses({
      attacks: [{}],
      oncePerRound: true,
    });
    expect(responses[0].actions).toEqual([
      { name: "AttackOneRound", params: [ScriptTarget.lastSeen] },
    ]);
  });

  it("prepends optActions before the weapon selection", () => {
    const optActions: Actions.Action[] = [
      { name: "Continue" },
    ];
    const responses = responseFactory.attackResponses({
      attacks: [{ weaponSlot: "WEAPON1" }],
      oncePerRound: true,
      optActions,
    });
    expect(responses[0].actions[0]).toEqual({ name: "Continue" });
  });

  it("wraps the response in SetInterrupt(FALSE)/(TRUE) when disableInterrupt is set", () => {
    const responses = responseFactory.attackResponses({
      attacks: [{ disableInterrupt: true }],
      oncePerRound: true,
    });
    expect(responses[0].actions).toEqual([
      { name: "SetInterrupt", params: ["FALSE"] },
      { name: "AttackOneRound", params: [ScriptTarget.lastSeen] },
      { name: "SetInterrupt", params: ["TRUE"] },
    ]);
  });

  it("uses each attack's own responseWeight, defaulting to 100", () => {
    const attacks: CreatureAttackAction[] = [
      { responseWeight: 30 },
      {},
    ];
    const responses = responseFactory.attackResponses({
      attacks,
      oncePerRound: true,
    });
    expect(responses.map((r) => r.weight)).toEqual([30, 100]);
  });
});
