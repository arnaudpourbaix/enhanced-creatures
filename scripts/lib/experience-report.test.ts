import { describe, expect, it } from "vitest";
import type { Creature } from "../../lib/src/model/creature/creature";
import { ExperienceRow } from "../../lib/src/services/experience/experience.service";
import { ExperienceScore } from "../../lib/src/services/experience/experience-table";
import { buildExperienceReport } from "./experience-report";
import { renderExperienceTab } from "./experience-report-html";

function score(xp: number, breakdown = "HD 9 -> 975"): ExperienceScore {
  return { hitDice: { whole: 9, plus: false }, hitDiceValue: 9, abilities: [], total: 9, xp, breakdown };
}

function row(over: Partial<ExperienceRow> & Pick<ExperienceRow, "file" | "status">): ExperienceRow {
  return { reason: "", newXp: 0, score: score(0), ...over };
}

// MonsterEnum.OGRE / GOBLIN are real members, so the ids resolve to names.
function fake(id: number, experience: ExperienceRow[], baseExperience?: Creature["baseExperience"]) {
  return { id, experience, baseExperience } as unknown as Creature;
}

describe("experience report", () => {
  const creatures = [
    fake(
      1,
      [
        row({ file: "A.cre", status: "formula", inGameXp: 650, newXp: 975, score: score(975) }),
        row({ file: "B.cre", status: "zero", inGameXp: 0, newXp: 0 }),
        row({ file: "C.cre", status: "drop", inGameXp: 2000, newXp: 2000, score: score(1400) }),
        row({ file: "D.cre", status: "formula", newXp: 420, score: score(420) }),
      ],
      { bookXp: 650, score: score(975) },
    ),
    fake(2, [row({ file: "E.cre", status: "book", inGameXp: 7, newXp: 7 })]),
  ];
  const report = buildExperienceReport(creatures);

  it("counts every status", () => {
    expect(report.counts).toEqual({ zero: 1, book: 1, unchanged: 0, formula: 2, drop: 1 });
    expect(report.rows).toHaveLength(5);
  });

  it("lists the drops", () => {
    expect(report.drops.map((r) => r.file)).toEqual(["C.cre"]);
  });

  it("computes the difference", () => {
    const by = (f: string) => report.rows.find((r) => r.file === f)!;
    expect(by("A.cre").difference).toBe(325);
    expect(by("B.cre").difference).toBeUndefined();
    expect(by("D.cre").difference).toBeUndefined();
  });

  it("carries the monster name on conflicts", () => {
    expect(report.conflicts).toHaveLength(1);
    expect(report.conflicts[0].monster).toBe(report.rows[0].monster);
    expect(report.conflicts[0].bookXp).toBe(650);
  });

  it("renders the sections and escapes data", () => {
    const html = renderExperienceTab(report);
    expect(html).toContain("All files");
    expect(html).toContain("XP drops to review");
    expect(html).toContain("Base XP conflicts");
    expect(html).toContain("C.cre");
    const evil = buildExperienceReport([
      fake(1, [row({ file: "<x>.cre", status: "drop", inGameXp: 5, score: score(1, "<b>") })]),
    ]);
    const out = renderExperienceTab(evil);
    expect(out).not.toContain("<x>");
    expect(out).toContain("&lt;x&gt;.cre");
  });
});
