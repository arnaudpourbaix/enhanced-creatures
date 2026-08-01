import { describe, expect, it } from "vitest";
import {
  EXISTING_STRING_REFERENCES,
  ExistingStringReference,
  StringReferenceGroup,
} from "../../../config/stringRef";
import { StringRefUtils } from "./string-ref.utils";

// EXISTING_STRING_REFERENCES is declared `as const` (a readonly tuple with no push/pop) - this
// mutable view lets "throws when the matched entry has no id configured" temporarily append a
// malformed entry to exercise that guard.
const mutableStringReferences = EXISTING_STRING_REFERENCES as unknown as {
  id: number[];
  str: string;
  group: string;
}[];

describe("getStringId", () => {
  it("returns the first configured id for a known string", () => {
    expect(StringRefUtils.getStringId("Hasted")).toBe(14023);
  });

  it("throws for an unknown string reference", () => {
    expect(() =>
      StringRefUtils.getStringId("Not a real string" as ExistingStringReference),
    ).toThrow("Stringref Not a real string not found !");
  });

  it("throws when the matched entry has no id configured", () => {
    mutableStringReferences.push({
      id: [],
      str: "NoIdConfigured",
      group: "poison",
    });
    try {
      expect(() => StringRefUtils.getStringId("NoIdConfigured" as ExistingStringReference)).toThrow(
        "Stringref NoIdConfigured has been found but no id configured !",
      );
    } finally {
      mutableStringReferences.pop();
    }
  });
});

describe("getStringIds", () => {
  it("collects and flattens all ids belonging to a group", () => {
    const ids = StringRefUtils.getStringIds("poison");
    expect(ids).toEqual(["14017", "26215", "14662", "25425"]);
  });

  it("accepts multiple groups and merges their ids", () => {
    const ids = StringRefUtils.getStringIds(["haste", "coneOfCold"]);
    expect(ids).toEqual(["14023", "26492"]);
  });

  it("returns an empty array for a group with no entries", () => {
    expect(StringRefUtils.getStringIds("not-a-group" as StringReferenceGroup)).toEqual([]);
  });
});
