import { describe, expect, it } from "vitest";
import {
  EXISTING_STRING_REFERENCES,
  ExistingStringReference,
  StringReferenceGroup,
} from "../../../config/stringRef";
import { StringRefUtils } from "./string-ref.utils";

describe("getString", () => {
  it("references a known string without fixing its strref", () => {
    expect(StringRefUtils.getString("Two Levels Drained")).toEqual({
      existing: "Two Levels Drained",
    });
  });

  it("throws for an unknown string reference", () => {
    expect(() => StringRefUtils.getString("Not a real string" as ExistingStringReference)).toThrow(
      "Stringref Not a real string not found !",
    );
  });
});

describe("variable names", () => {
  it("builds WeiDU-safe names from the string and the group", () => {
    expect(StringRefUtils.variable("Morale Failure: Panic")).toBe("ja_strref_morale_failure_panic");
    expect(StringRefUtils.groupVariable("levelDrain")).toBe("ja_strrefs_level_drain");
  });

  it("never gives two strings or two groups the same variable", () => {
    const strings = EXISTING_STRING_REFERENCES.map((s) => StringRefUtils.variable(s.str));
    const groups = [...new Set(EXISTING_STRING_REFERENCES.map((s) => s.group))].map((g) =>
      StringRefUtils.groupVariable(g),
    );
    expect(new Set(strings).size).toBe(EXISTING_STRING_REFERENCES.length);
    expect(new Set(groups).size).toBe(groups.length);
  });
});

describe("getStringIds", () => {
  it("references the variable of each group", () => {
    expect(StringRefUtils.getStringIds(["rigidThinking", "confusion"])).toEqual([
      "%ja_strrefs_rigid_thinking%",
      "%ja_strrefs_confusion%",
    ]);
  });

  it("skips a group with no entries", () => {
    expect(StringRefUtils.getStringIds("not-a-group" as StringReferenceGroup)).toEqual([]);
  });
});

describe("stringRefVariables", () => {
  const variables = StringRefUtils.stringRefVariables();
  const find = (name: string) => variables.find((v) => v.name === name);

  it("gives a displayed string its first strref of each game", () => {
    expect(find("ja_strref_two_levels_drained")).toEqual({
      name: "ja_strref_two_levels_drained",
      integer: true,
      bg1: "25803",
      bg2: "40968",
    });
  });

  it("gives a group every strref of its strings, per game", () => {
    expect(find("ja_strrefs_poison")).toEqual({
      name: "ja_strrefs_poison",
      integer: false,
      bg1: "14017 24454 26215 14662 17397 25425",
      bg2: "14017 5805 32304 14662 17397 30988",
    });
  });
});

describe("EXISTING_STRING_REFERENCES", () => {
  it("only holds vanilla strrefs (mods append theirs at install-dependent numbers)", () => {
    for (const s of EXISTING_STRING_REFERENCES) {
      expect(s.bg1.length && s.bg2.length).toBeTruthy();
      expect(Math.max(...s.bg1)).toBeLessThan(71404);
      expect(Math.max(...s.bg2)).toBeLessThan(103584);
    }
  });
});
