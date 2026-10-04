import { afterEach, describe, expect, it } from "vitest";
import { GLOBAL_CONFIG } from "../../config/generate";
import { SPELL_CHECK_TRIGGERS } from "../../config/spells/spell-check";
import { allySafe, defaultAllySafe } from "../../config/target/ally-safe";
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

  it("adds main hand weapon checks when weaponCheck is enabled", () => {
    GLOBAL_CONFIG.weaponCheck = true;
    const results = triggerFactory.validAttackTarget({ isTargetPlayer: true });
    expect(results).toContainEqual({
      name: "WeaponEffectiveVs",
      params: [expect.any(String), "MAINHAND"],
    });
    expect(results).toContainEqual({
      name: "WeaponCanDamage",
      params: [expect.any(String), "MAINHAND"],
    });
  });

  it("adds no weapon checks when weaponCheck is disabled", () => {
    GLOBAL_CONFIG.weaponCheck = false;
    const results = triggerFactory.validAttackTarget({ isTargetPlayer: true });
    GLOBAL_CONFIG.weaponCheck = true;
    expect(
      results.some((t) => t.name === "WeaponEffectiveVs" || t.name === "WeaponCanDamage"),
    ).toBe(false);
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

  it("returns a single effect keyword's triggers as is", () => {
    expect(triggerFactory.spellChecks(["hold"])).toEqual([...SPELL_CHECK_TRIGGERS.hold]);
  });

  it("only skips a target protected from every effect keyword", () => {
    // "not protected from hold, or not protected from fear", distributed into one OR per pair
    expect(triggerFactory.spellChecks(["hold", "fear"])).toEqual(
      SPELL_CHECK_TRIGGERS.hold.flatMap((hold) =>
        SPELL_CHECK_TRIGGERS.fear.map((fear) => triggerFactory.or([hold, fear])),
      ),
    );
  });

  it("drops an effect clause implied by a smaller one", () => {
    // hold is chaotic commands + free action, movement is free action alone
    expect(triggerFactory.spellChecks(["hold", "movement"])).toEqual([
      ...SPELL_CHECK_TRIGGERS.movement,
    ]);
  });

  it("keeps gate keywords mandatory alongside effect keywords", () => {
    expect(triggerFactory.spellChecks(["fire", "cold", "magicResistance"])).toEqual([
      ...SPELL_CHECK_TRIGGERS.magicResistance,
      triggerFactory.or([...SPELL_CHECK_TRIGGERS.fire, ...SPELL_CHECK_TRIGGERS.cold]),
    ]);
  });

  it("ignores keywords with no triggers when combining effects", () => {
    expect(triggerFactory.spellChecks(["fire", "cloud"])).toEqual([...SPELL_CHECK_TRIGGERS.fire]);
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

describe("alliesSafe", () => {
  const target = "LastSeenBy(Myself)";
  const ally = (prefix: string) => `${prefix}NearestEnemyOf(Myself)`;
  const asTarget = (trigger: Triggers.Trigger, negation = false) => ({
    name: "TriggerOverride",
    object: target,
    trigger,
    negation,
  });

  it("requires each nearest ally to be out of range or safe, and the next one out of range", () => {
    expect(
      triggerFactory.alliesSafe({
        range: 16,
        count: 2,
        safeIf: [allySafe.resist("RESISTFIRE"), allySafe.spellLevel(3)],
      }),
    ).toEqual([
      {
        name: "Or",
        exceptMyself: true,
        triggers: [
          asTarget({ name: "Range", params: [ally(""), 16] }, true),
          asTarget({ name: "CheckStatGT", params: [ally(""), 99, "RESISTFIRE"] }),
          asTarget({ name: "ImmuneToSpellLevel", params: [ally(""), 3] }),
        ],
      },
      {
        name: "Or",
        exceptMyself: true,
        triggers: [
          asTarget({ name: "Range", params: [ally("Second"), 16] }, true),
          asTarget({ name: "CheckStatGT", params: [ally("Second"), 99, "RESISTFIRE"] }),
          asTarget({ name: "ImmuneToSpellLevel", params: [ally("Second"), 3] }),
        ],
      },
      {
        ...asTarget({ name: "Range", params: [ally("Third"), 16] }, true),
        exceptMyself: true,
      },
    ]);
  });

  it("checks 3 allies by default", () => {
    const result = triggerFactory.alliesSafe({ range: 16, safeIf: [] });
    expect(result).toHaveLength(4);
    expect(result[3]).toMatchObject({ trigger: { params: [ally("Fourth"), 16] } });
  });

  it("derives safeIf from keywords and level when not given", () => {
    const [first] = triggerFactory.alliesSafe({ range: 16, count: 1 }, ["fire", "fireball"], 3);
    expect(first).toMatchObject({
      triggers: [
        { trigger: { name: "Range" } },
        { trigger: { name: "CheckStatGT", params: [ally(""), 99, "RESISTFIRE"] } },
        { trigger: { name: "CheckStatGT", params: [ally(""), 74, "RESISTMAGIC"] } },
        { trigger: { name: "ImmuneToSpellLevel", params: [ally(""), 3] } },
      ],
    });
  });

  it("rejects a count beyond the available NearestEnemyOf objects", () => {
    expect(() => triggerFactory.alliesSafe({ range: 16, count: 10 })).toThrow();
  });
});

describe("casterSafe", () => {
  it("checks the caster against any of safeIf", () => {
    expect(
      triggerFactory.casterSafe({
        range: 16,
        safeIf: [allySafe.resist("RESISTFIRE"), allySafe.spellLevel(3)],
      }),
    ).toEqual({
      name: "Or",
      triggers: [
        { name: "CheckStatGT", params: ["Myself", 99, "RESISTFIRE"] },
        { name: "ImmuneToSpellLevel", params: ["Myself", 3] },
      ],
    });
  });

  it("returns a single condition as is", () => {
    expect(triggerFactory.casterSafe({ range: 16, safeIf: [allySafe.spellLevel(3)] })).toEqual({
      name: "ImmuneToSpellLevel",
      params: ["Myself", 3],
    });
  });

  it("returns undefined without any condition", () => {
    expect(triggerFactory.casterSafe({ range: 16, safeIf: [] })).toBeUndefined();
  });
});

describe("defaultAllySafe", () => {
  it("only adds magic resistance without damage keywords nor level", () => {
    expect(defaultAllySafe(["hold"], null)).toEqual([allySafe.magicResistance()]);
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
