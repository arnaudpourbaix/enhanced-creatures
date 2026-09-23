import { afterEach, describe, expect, it } from "vitest";
import { GLOBAL_CONFIG } from "../../config/generate";
import { SPELL_CHECK_TRIGGERS } from "../../config/spells/spell-check";
import { ScriptTarget } from "../model/constants";
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

describe("spellChecks", () => {
  afterEach(() => {
    GLOBAL_CONFIG.spellChecks.spellProtections = true;
    GLOBAL_CONFIG.spellChecks.stats = true;
  });

  it("defaults to an empty list", () => {
    expect(triggerFactory.spellChecks()).toEqual([]);
  });

  it("flattens the triggers of every given keyword", () => {
    expect(triggerFactory.spellChecks(["acid", "charm"])).toEqual([
      ...SPELL_CHECK_TRIGGERS.acid,
      ...SPELL_CHECK_TRIGGERS.charm,
    ]);
  });

  it("drops a keyword whose category (stats) is disabled, keeping others", () => {
    GLOBAL_CONFIG.spellChecks.stats = false;
    expect(triggerFactory.spellChecks(["acid", "charm"])).toEqual([...SPELL_CHECK_TRIGGERS.charm]);
  });

  it("drops a keyword whose category (spellProtections) is disabled, keeping others", () => {
    GLOBAL_CONFIG.spellChecks.spellProtections = false;
    expect(triggerFactory.spellChecks(["acid", "charm"])).toEqual([...SPELL_CHECK_TRIGGERS.acid]);
  });

  it("leaves an uncategorized keyword unaffected by either toggle", () => {
    GLOBAL_CONFIG.spellChecks.spellProtections = false;
    GLOBAL_CONFIG.spellChecks.stats = false;
    expect(triggerFactory.spellChecks(["blind"])).toEqual([...SPELL_CHECK_TRIGGERS.blind]);
  });
});

describe("immuneToSpellLevel", () => {
  it("builds a CheckStatGT-shaped ImmuneToSpellLevel trigger against the target token", () => {
    expect(triggerFactory.immuneToSpellLevel(3)).toEqual({
      name: "ImmuneToSpellLevel",
      params: [ScriptTarget.token, 3],
      negation: false,
    });
  });

  it("supports negation", () => {
    expect(triggerFactory.immuneToSpellLevel(3, true)).toEqual({
      name: "ImmuneToSpellLevel",
      params: [ScriptTarget.token, 3],
      negation: true,
    });
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
