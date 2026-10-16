import { describe, expect, it } from "vitest";
import { CardParts } from "./card-parts";
import { getCommonKeys } from "./entry-common";

const parts = (
  p: Partial<Record<keyof CardParts, string[]>>,
  weapons: [string, string][] = [],
): CardParts => ({
  stats: (p.stats ?? []).map((key) => ({ key, html: key })),
  scores: (p.scores ?? []).map((key) => ({ key, html: key })),
  traitLinks: (p.traitLinks ?? []).map((key) => ({ key, html: key })),
  traitLines: (p.traitLines ?? []).map((key) => ({ key, html: key })),
  abilities: [],
  weapons: weapons.map(([key, descKey]) => ({
    key,
    descKey,
    html: key,
    descHtml: descKey,
    enchantHtml: "",
  })),
});

describe("getCommonKeys", () => {
  it("keeps only keys every member has", () => {
    const common = getCommonKeys([
      parts({ stats: ["stat:AC=1", "stat:Morale=16"], scores: ["score:CON=18", "score:STR=18"] }),
      parts({ stats: ["stat:AC=1", "stat:Morale=15"], scores: ["score:CON=18", "score:STR=19"] }),
    ]);
    expect([...common].sort()).toEqual(["score:CON=18", "stat:AC=1"]);
  });

  it("shares a weapon description when only the enchantment differs", () => {
    const common = getCommonKeys([
      parts({}, [["weapon:0:a+3", "weaponDesc:0:a"]]),
      parts({}, [["weapon:0:a+4", "weaponDesc:0:a"]]),
    ]);
    expect(common.has("weaponDesc:0:a")).toBe(true);
    expect(common.has("weapon:0:a+3")).toBe(false);
  });

  it("does not share weapons when counts differ", () => {
    const common = getCommonKeys([parts({}, [["weapon:0:a", "weaponDesc:0:a"]]), parts({})]);
    expect(common.size).toBe(0);
  });

  it("requires every member, not most", () => {
    const common = getCommonKeys([
      parts({ traitLinks: ["trait:undead"] }),
      parts({ traitLinks: ["trait:undead"] }),
      parts({}),
    ]);
    expect(common.has("trait:undead")).toBe(false);
  });

  it("returns nothing for a single member", () => {
    expect(getCommonKeys([parts({ stats: ["stat:AC=1"] })]).size).toBe(0);
  });
});
