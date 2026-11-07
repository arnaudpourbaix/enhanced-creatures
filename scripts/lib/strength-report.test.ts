import { describe, expect, it } from "vitest";
import type { Creature } from "../../lib/src/model/creature/creature";
import { buildStrengthReport, renderStrengthCard } from "./strength-report";

// MonsterEnum.OGRE / GOBLIN are real members, so the ids resolve to names.
function fake(
  id: number,
  data: Partial<Creature["data"]>,
  adjustments: { files: string[]; data: Partial<Creature["data"]> }[] = [],
) {
  return { id, data, adjustments } as unknown as Creature;
}

describe("strength report", () => {
  const creatures = [
    fake(
      1,
      {
        strength: 19,
        strength2e: { strength: 18, exceptionalStrength: 100, hit: -1, source: "MM <ogre>" },
      },
      [{ files: ["X"], data: { strength2e: { hit: 3, source: "MM" } } }],
    ),
    fake(2, { strength: 20 }),
  ];
  const rows = buildStrengthReport(creatures);

  it("lists every creature and adjustment with a 2e strength", () => {
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      scope: "base",
      plays: "19",
      strength2e: "18/00",
      hit: -1,
      source: "MM <ogre>",
    });
    expect(rows[1]).toMatchObject({ scope: "X", plays: "19", strength2e: "no bonus", hit: 3 });
    expect(rows[0].monster).toBe(rows[1].monster);
  });

  it("says which edition plays and escapes the source", () => {
    const html = renderStrengthCard(rows);
    expect(html).toContain(`strengthEdition: <code>3e+</code>`);
    expect(html).toContain("MM &lt;ogre&gt;");
    expect(html).not.toContain("<ogre>");
  });
});
