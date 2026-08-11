import { describe, expect, it } from "vitest";
import { Triggers } from "../model/script/triggers";
import triggerFactory from "./trigger.factory";

describe("haveSpellRES", () => {
  it("defaults negation to false", () => {
    expect(triggerFactory.haveSpellRES(["SPWI001"])).toEqual([
      { name: "HaveSpellRES", params: ["SPWI001"], negation: false },
    ]);
  });

  it("honors an explicit negation", () => {
    expect(triggerFactory.haveSpellRES(["SPWI001"], true)).toEqual([
      { name: "HaveSpellRES", params: ["SPWI001"], negation: true },
    ]);
  });
});

describe("hasItem", () => {
  it("defaults negation to false", () => {
    expect(triggerFactory.hasItem(["POTN01"])).toEqual([
      {
        name: "HasItem",
        params: ["POTN01", expect.any(String)],
        negation: false,
      },
    ]);
  });

  it("honors an explicit negation", () => {
    expect(triggerFactory.hasItem(["POTN01"], true)).toEqual([
      {
        name: "HasItem",
        params: ["POTN01", expect.any(String)],
        negation: true,
      },
    ]);
  });
});

describe("global", () => {
  it("defaults area to LOCALS and negation to false", () => {
    expect(triggerFactory.global("some_global", 1)).toEqual({
      name: "Global",
      params: ["some_global", "LOCALS", 1],
      negation: false,
    });
  });

  it("honors an explicit area and negation", () => {
    expect(triggerFactory.global("some_global", 1, "GLOBAL", true)).toEqual({
      name: "Global",
      params: ["some_global", "GLOBAL", 1],
      negation: true,
    });
  });
});

describe("validSpellTarget", () => {
  it("does not push a WEAPON exclusion when the target is a player", () => {
    const results = triggerFactory.validSpellTarget({
      isTargetPlayer: true,
      seeInvisible: true,
    });
    expect(results.some((t) => t.name === "General")).toBe(false);
  });

  it("pushes a WEAPON exclusion when the target is not a player", () => {
    const results = triggerFactory.validSpellTarget({
      isTargetPlayer: false,
      seeInvisible: true,
    });
    expect(results[results.length - 1]).toMatchObject({ name: "General" });
  });
});

describe("validAttackTarget", () => {
  it("does not unshift a WEAPON exclusion when the target is a player", () => {
    const results = triggerFactory.validAttackTarget({
      isTargetPlayer: true,
    });
    expect(results.some((t) => t.name === "General")).toBe(false);
  });

  it("unshifts a WEAPON exclusion when the target is not a player", () => {
    const results = triggerFactory.validAttackTarget({
      isTargetPlayer: false,
    });
    expect(results[0]).toMatchObject({ name: "General" });
  });

  it("appends a Range trigger when maxRange is given", () => {
    const results = triggerFactory.validAttackTarget({
      isTargetPlayer: true,
      maxRange: 30,
    });
    expect(results[results.length - 1]).toMatchObject({
      name: "Range",
      params: [expect.any(String), 30],
    });
  });

  it("appends no Range trigger when maxRange is omitted", () => {
    const results = triggerFactory.validAttackTarget({
      isTargetPlayer: true,
    });
    expect(results.some((t) => t.name === "Range")).toBe(false);
  });
});

describe("inverseNegations", () => {
  it("flips negation on leaf triggers", () => {
    const result = triggerFactory.inverseNegations([
      { name: "See", params: ["Myself"], negation: false } as unknown as Triggers.Trigger,
    ]);
    expect(result).toEqual([{ name: "See", params: ["Myself"], negation: true }]);
  });

  it("recurses into and flattens nested composite triggers", () => {
    const result = triggerFactory.inverseNegations([
      {
        name: "Or",
        triggers: [
          { name: "See", params: ["A"], negation: false },
          { name: "See", params: ["B"], negation: true },
        ],
      } as unknown as Triggers.Trigger,
    ]);
    expect(result).toEqual([
      { name: "See", params: ["A"], negation: true },
      { name: "See", params: ["B"], negation: false },
    ]);
  });
});
