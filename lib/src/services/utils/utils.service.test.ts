import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { describe, expect, it } from "vitest";
import { MonsterFamilyEnum } from "../../../creatures/monster";
import { ImmunityConfig } from "../../model/final/immunity";
import { Spell } from "../../model/spell-item/spell-item";
import { SpellGroup } from "../../model/spell-item/spell-group";
import { SpellTypeEnum } from "../../model/spell-item/effect.enums";
import { SpellProtectionStat } from "../../model/spell-item/spell-protection";
import { Actions } from "../../model/script/actions";
import { Triggers } from "../../model/script/triggers";
import { State } from "../../state";
import translationService from "../translation.service";
import utils from "./utils.service";

describe("objectKeys", () => {
  it("returns the object's own keys typed as keyof T", () => {
    expect(utils.objectKeys({ a: 1, b: 2 })).toEqual(["a", "b"]);
  });
});

describe("getKeyByValue", () => {
  it("finds the first key matching the value", () => {
    expect(utils.getKeyByValue({ a: 1, b: 2 }, 2)).toBe("b");
  });

  it("returns undefined when no key matches", () => {
    expect(utils.getKeyByValue({ a: 1 }, 99)).toBeUndefined();
  });
});

describe("replaceParamTokens", () => {
  it("replaces token occurrences in string params in place", () => {
    const params: (string | number)[] = ["hello $NAME", 42, "$NAME again"];
    utils.replaceParamTokens(params, [{ key: "$NAME", value: "world" }]);
    expect(params).toEqual(["hello world", 42, "world again"]);
  });

  it("compounds multiple token replacements in a single param instead of only keeping the last", () => {
    const params: (string | number)[] = ["$A $B"];
    utils.replaceParamTokens(params, [
      { key: "$A", value: "1" },
      { key: "$B", value: "2" },
    ]);
    expect(params).toEqual(["1 2"]);
  });
});

describe("replaceActionTokens", () => {
  it("replaces params on a cloned array without mutating the input", () => {
    const actions: Actions.Action[] = [
      { name: "Wait", params: ["$N"] } as unknown as Actions.Action,
    ];
    const result = utils.replaceActionTokens(actions, [{ key: "$N", value: "5" }]);
    expect((result[0] as { params: string[] }).params).toEqual(["5"]);
    expect((actions[0] as { params: string[] }).params).toEqual(["$N"]);
  });
});

describe("replaceTriggerTokens", () => {
  it("recurses into nested triggers (e.g. Or)", () => {
    const triggers: Triggers.Trigger[] = [
      {
        name: "Or",
        triggers: [{ name: "Global", params: ["$FLAG", "LOCALS", 1] }],
      } as unknown as Triggers.Trigger,
    ];
    const result = utils.replaceTriggerTokens(triggers, [{ key: "$FLAG", value: "MY_FLAG" }]);
    expect((result[0] as { triggers: { params: unknown[] }[] }).triggers[0].params).toEqual([
      "MY_FLAG",
      "LOCALS",
      1,
    ]);
  });

  it("replaces params on a leaf trigger", () => {
    const triggers: Triggers.Trigger[] = [
      { name: "Global", params: ["$FLAG", "LOCALS", 1] } as unknown as Triggers.Trigger,
    ];
    const result = utils.replaceTriggerTokens(triggers, [{ key: "$FLAG", value: "MY_FLAG" }]);
    expect((result[0] as { params: unknown[] }).params).toEqual(["MY_FLAG", "LOCALS", 1]);
  });
});

describe("getSpellResourceFromIds", () => {
  it.each([
    ["1123", "SPPR123"],
    ["2456", "SPWI456"],
    ["3789", "SPIN789"],
    ["4001", "SPCL001"],
  ])("maps ids code %s to resref %s", (ids, expected) => {
    expect(utils.getSpellResourceFromIds(ids)).toBe(expected);
  });

  it("returns just the number with no prefix for an unknown type digit", () => {
    expect(utils.getSpellResourceFromIds("9123")).toBe("123");
  });
});

describe("getSpellFunctionName", () => {
  it("uses the last dot-separated segment of the name as the function suffix", () => {
    const spell = { name: "spell.fireball.name" } as unknown as Spell;
    expect(utils.getSpellFunctionName(spell)).toBe("create_spell_fireball");
  });

  it("skips a trailing 'name' segment and uses the segment before it", () => {
    const spell = { name: "spell.fireball.desc.name" } as unknown as Spell;
    expect(utils.getSpellFunctionName(spell)).toBe("create_spell_desc");
  });

  it("uses the last segment as-is when it isn't 'name'", () => {
    const spell = { name: "spell.fireball" } as unknown as Spell;
    expect(utils.getSpellFunctionName(spell)).toBe("create_spell_fireball");
  });

  it("throws if the spell name is a numeric string reference", () => {
    const spell = { name: 12345 } as unknown as Spell;
    expect(() => utils.getSpellFunctionName(spell)).toThrow("can't handle a number in name!");
  });
});

describe("resolveStringRef", () => {
  it("returns undefined for undefined input", () => {
    expect(utils.resolveStringRef(undefined)).toBeUndefined();
  });

  it("resolves a translation-key string to RESOLVE_STR_REF(@ref)", () => {
    const ref = utils.resolveStringRef("common.potion.use");
    expect(ref).toMatch(/^RESOLVE_STR_REF\(@\d+\)$/);
  });

  it("wraps a resolvable numeric stringRef in RESOLVE_STR_REF(@value)", () => {
    const custom = translationService.addCustomTranslation(["hi"]);
    expect(utils.resolveStringRef(custom)).toBe(`RESOLVE_STR_REF(@${custom})`);
  });

  it("falls back to the raw number when it can't be resolved to any translation", () => {
    expect(utils.resolveStringRef(999999999)).toBe("999999999");
  });
});

describe("getImmunityFunctionName", () => {
  it("builds name_type directly from an ImmunityConfig object", () => {
    expect(
      utils.getImmunityFunctionName({
        name: "poison",
        type: "immunity",
      } as unknown as ImmunityConfig),
    ).toBe("poison_immunity");
  });

  it("looks up the ImmunityConfig by name in State.immunities when given a string", () => {
    const original = State.immunities;
    State.immunities = [{ name: "poison", type: "immunity" }] as unknown as ImmunityConfig[];
    try {
      expect(utils.getImmunityFunctionName("poison")).toBe("poison_immunity");
    } finally {
      State.immunities = original;
    }
  });
});

describe("hasImmunity", () => {
  const original = State.immunities;
  function restore() {
    State.immunities = original;
  }

  it("returns true on a direct name match", () => {
    expect(utils.hasImmunity(["poison"], "poison")).toBe(true);
  });

  it("returns false when nothing matches and nothing to recurse into", () => {
    expect(utils.hasImmunity([], "poison")).toBe(false);
  });

  it("recurses into a referenced immunity's own immunities list", () => {
    State.immunities = [{ name: "giant", immunities: ["poison"] }] as unknown as ImmunityConfig[];
    try {
      expect(utils.hasImmunity(["giant"], "poison")).toBe(true);
    } finally {
      restore();
    }
  });

  it("throws when a referenced immunity name isn't registered in State.immunities", () => {
    State.immunities = [];
    try {
      expect(() => utils.hasImmunity(["unknownImmunity"], "poison")).toThrow(
        /Immunity unknownImmunity not found/,
      );
    } finally {
      restore();
    }
  });
});

describe("hasCriticalHitImmunity", () => {
  const original = State.immunities;
  function restore() {
    State.immunities = original;
  }

  it("returns true when the immunity's own name is criticalHit", () => {
    expect(
      utils.hasCriticalHitImmunity({
        name: "criticalHit",
        immunities: [],
      } as unknown as ImmunityConfig),
    ).toBe(true);
  });

  it("returns true when criticalHit is directly listed in immunities", () => {
    expect(
      utils.hasCriticalHitImmunity({
        name: "giant",
        immunities: ["criticalHit"],
      } as unknown as ImmunityConfig),
    ).toBe(true);
  });

  it("recurses through referenced immunities in State.immunities", () => {
    State.immunities = [
      { name: "poison", immunities: ["criticalHit"] },
    ] as unknown as ImmunityConfig[];
    try {
      expect(
        utils.hasCriticalHitImmunity({
          name: "giant",
          immunities: ["poison"],
        } as unknown as ImmunityConfig),
      ).toBe(true);
    } finally {
      restore();
    }
  });

  it("returns false when nothing in the chain grants criticalHit", () => {
    expect(
      utils.hasCriticalHitImmunity({
        name: "fire",
        immunities: [],
      } as unknown as ImmunityConfig),
    ).toBe(false);
  });
});

describe("getSpellResourceFunctionName", () => {
  it("accepts a plain group name string", () => {
    expect(utils.getSpellResourceFunctionName("poison")).toBe("get_poison_resources");
  });

  it("accepts a SpellGroup object and reads its name", () => {
    expect(utils.getSpellResourceFunctionName({ name: "disease" } as unknown as SpellGroup)).toBe(
      "get_disease_resources",
    );
  });
});

describe("getFile", () => {
  it("splits a forward-slash path into file/name/ext", () => {
    expect(utils.getFile("lib/pnp-monster/bear/ja#m4.baf")).toEqual({
      file: "ja#m4.baf",
      name: "ja#m4",
      ext: "baf",
    });
  });

  it("normalizes backslashes before splitting", () => {
    expect(utils.getFile("lib\\pnp-monster\\bear\\ja#m4.baf")).toEqual({
      file: "ja#m4.baf",
      name: "ja#m4",
      ext: "baf",
    });
  });
});

describe("getFamilyFolder", () => {
  it("lowercases the family enum name into the pnp-monster path", () => {
    expect(utils.getFamilyFolder(MonsterFamilyEnum.Bear)).toBe("lib/pnp-monster/bear");
  });
});

describe("getIdsFileFromSpellProtectionStat", () => {
  it("maps each stat needing an ids lookup to its ids file name", () => {
    expect(utils.getIdsFileFromSpellProtectionStat(SpellProtectionStat.Race)).toBe("race");
    expect(utils.getIdsFileFromSpellProtectionStat(SpellProtectionStat.Align)).toBe("align");
    expect(utils.getIdsFileFromSpellProtectionStat(SpellProtectionStat.Gender)).toBe("gender");
    expect(utils.getIdsFileFromSpellProtectionStat(SpellProtectionStat.Specific)).toBe("specific");
    expect(utils.getIdsFileFromSpellProtectionStat(SpellProtectionStat.State)).toBe("state");
  });

  it("returns an empty string for stats with no ids file", () => {
    expect(utils.getIdsFileFromSpellProtectionStat(SpellProtectionStat.CircleSize)).toBe("");
  });
});

describe("getMemorizedSpellType", () => {
  it("maps wizard/priest/innate spell types", () => {
    expect(utils.getMemorizedSpellType(SpellTypeEnum.Wizard)).toBe("wizard");
    expect(utils.getMemorizedSpellType(SpellTypeEnum.Priest)).toBe("priest");
    expect(utils.getMemorizedSpellType(SpellTypeEnum.Innate)).toBe("innate");
  });

  it("returns null for types with no memorized-spell equivalent", () => {
    expect(utils.getMemorizedSpellType(SpellTypeEnum.Psionic)).toBeNull();
    expect(utils.getMemorizedSpellType()).toBeNull();
  });
});

describe("getSpellInfos", () => {
  const original = State.spells;
  function restore() {
    State.spells = original;
  }

  it("returns innate/level 1 when the spell isn't found anywhere (unknown case)", () => {
    State.spells = [];
    try {
      expect(utils.getSpellInfos("XXTEST1")).toEqual({
        type: "innate",
        level: 1,
      });
    } finally {
      restore();
    }
  });

  it("resolves type/level directly from a State.spells entry when spell.type is mapped", () => {
    State.spells = [
      { file: "XXTEST1", type: SpellTypeEnum.Wizard, level: 5 },
    ] as unknown as Spell[];
    try {
      expect(utils.getSpellInfos("XXTEST1")).toEqual({
        type: "wizard",
        level: 5,
      });
    } finally {
      restore();
    }
  });

  it("falls back to the copyFrom resref's inferred info when spell.type is unmapped", () => {
    State.spells = [
      {
        file: "XXTEST1",
        type: SpellTypeEnum.Psionic,
        level: 9,
        copyFrom: "SPWI312",
      },
    ] as unknown as Spell[];
    try {
      expect(utils.getSpellInfos("XXTEST1")).toEqual({
        type: "wizard",
        level: 3,
      });
    } finally {
      restore();
    }
  });

  it("falls back to spell.options.spellType when spell.type is unmapped and there's no copyFrom", () => {
    State.spells = [
      {
        file: "XXTEST1",
        type: SpellTypeEnum.Psionic,
        level: 4,
        options: { spellType: SpellTypeEnum.Priest },
      },
    ] as unknown as Spell[];
    try {
      expect(utils.getSpellInfos("XXTEST1")).toEqual({
        type: "priest",
        level: 4,
      });
    } finally {
      restore();
    }
  });

  it("falls back to innate/spell.level when neither type, copyFrom nor options resolve it", () => {
    State.spells = [
      { file: "XXTEST1", type: SpellTypeEnum.Psionic, level: 7 },
    ] as unknown as Spell[];
    try {
      expect(utils.getSpellInfos("XXTEST1")).toEqual({
        type: "innate",
        level: 7,
      });
    } finally {
      restore();
    }
  });

  it("falls back to level 1 when spell.level is missing (type violation - defensive fallback)", () => {
    State.spells = [
      { file: "XXTEST1", type: SpellTypeEnum.Psionic, level: undefined },
    ] as unknown as Spell[];
    try {
      expect(utils.getSpellInfos("XXTEST1")).toEqual({
        type: "innate",
        level: 1,
      });
    } finally {
      restore();
    }
  });
});

describe("getSpellInfosByFilename", () => {
  it("infers wizard level from an SPWI resref", () => {
    expect(utils.getSpellInfosByFilename("SPWI312")).toEqual({
      type: "wizard",
      level: 3,
    });
  });

  it("infers priest level from an SPPR resref", () => {
    expect(utils.getSpellInfosByFilename("spPR205")).toEqual({
      type: "priest",
      level: 2,
    });
  });

  it("treats SPIN/SPCL resrefs as level-1 innate", () => {
    expect(utils.getSpellInfosByFilename("SPIN123")).toEqual({
      type: "innate",
      level: 1,
    });
    expect(utils.getSpellInfosByFilename("SPCL456")).toEqual({
      type: "innate",
      level: 1,
    });
  });

  it("returns null for an unrecognized resref", () => {
    expect(utils.getSpellInfosByFilename("MISC99")).toBeNull();
  });
});

describe("shuffleArray", () => {
  it("returns a permutation with the same elements", () => {
    const input = [1, 2, 3, 4, 5];
    const result = utils.shuffleArray(input);
    expect(result).toHaveLength(input.length);
    const byValue = (a: number, b: number) => a - b;
    expect([...result].sort(byValue)).toEqual([...input].sort(byValue));
  });

  it("does not mutate the input array", () => {
    const input = [1, 2, 3];
    utils.shuffleArray(input);
    expect(input).toEqual([1, 2, 3]);
  });
});

describe("writeFile", () => {
  it("normalizes all line endings to CRLF regardless of the input mix", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-writefile-"));
    const originalModFolder = State.modFolder;
    State.modFolder = tempDir;
    try {
      const file = path.join(tempDir, "mixed.txt");
      utils.writeFile(file, "line one\r\nline two\nline three\r\nline four\n");
      const written = fs.readFileSync(file, "utf-8");
      expect(written).toBe("line one\r\nline two\r\nline three\r\nline four\r\n");
    } finally {
      State.modFolder = originalModFolder;
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
