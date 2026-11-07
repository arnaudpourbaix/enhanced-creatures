import { describe, expect, it } from "vitest";
import type { Creature } from "../../lib/src/model/creature/creature";
import { ExperienceRow } from "../../lib/src/services/experience/experience.service";
import { ExperienceScore } from "../../lib/src/services/experience/experience-table";
import { buildExperienceReport } from "./experience-report";
import { EXPERIENCE_SCRIPT, gapPercent, renderExperienceTab } from "./experience-report-html";

function score(xp: number, breakdown = "HD 9 -> 975"): ExperienceScore {
  return {
    hitDice: { whole: 9, plus: false },
    hitDiceValue: 9,
    abilities: [],
    total: 9,
    xp,
    breakdown,
  };
}

function row(over: Partial<ExperienceRow> & Pick<ExperienceRow, "file" | "status">): ExperienceRow {
  return { reason: "", newXp: 0, score: score(0), ...over };
}

// MonsterEnum.OGRE / GOBLIN are real members, so the ids resolve to names.
function fake(
  id: number,
  experience: ExperienceRow[],
  baseExperience?: Creature["baseExperience"],
) {
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
    expect(report.counts).toEqual({ zero: 1, book: 1, asBase: 0, formula: 2, drop: 1 });
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

  it("counts the adjustments whose XP changed, not the book files", () => {
    expect(report.changed).toBe(1);
    const mixed = buildExperienceReport([
      fake(1, [
        row({ file: "A.cre", status: "book", inGameXp: 650, newXp: 120 }),
        row({ file: "B.cre", status: "asBase", inGameXp: 100, newXp: 120 }),
        row({ file: "C.cre", status: "drop", inGameXp: 2000, newXp: 2000 }),
        row({ file: "D.cre", status: "zero", inGameXp: 650, newXp: 0 }),
        row({ file: "E.cre", status: "formula", newXp: 420 }),
        row({ file: "F.cre", status: "formula", inGameXp: 100, newXp: 200 }),
      ]),
    ]);
    expect(mixed.changed).toBe(2);
    expect(mixed.changedRows.map((r) => r.file)).toEqual(["B.cre", "F.cre"]);
  });

  it("opens on the changed files, all files last", () => {
    const html = renderExperienceTab(
      buildExperienceReport([
        fake(1, [
          row({ file: "CH.cre", status: "formula", inGameXp: 100, newXp: 200 }),
          row({ file: "SAME.cre", status: "book", inGameXp: 100, newXp: 100 }),
        ]),
      ]),
    );
    const changed = html.split('data-xp-panel="changed"')[1].split("</section>")[0];
    expect(changed).toContain('data-file="CH.cre"');
    expect(changed).not.toContain('data-file="SAME.cre"');
    const views = [...html.matchAll(/role="tab" data-xp-view="(\w+)"/g)].map((m) => m[1]);
    expect(views).toEqual(["changed", "drops", "conflicts", "all", "proposals"]);
    expect(EXPERIENCE_SCRIPT).toContain('"changed"');
  });

  it("shows short reasons under the status and no breakdown for zero files", () => {
    const html = renderExperienceTab(
      buildExperienceReport([
        fake(1, [
          row({ file: "Z.cre", status: "zero", reason: "summon", score: score(0, "ZERO-BD") }),
          row({ file: "B.cre", status: "book", reason: "no adjustment", newXp: 7 }),
          row({ file: "U.cre", status: "asBase", reason: "nothing read", newXp: 7 }),
          row({
            file: "F.cre",
            status: "formula",
            reason: "FORMULA-BD",
            score: score(9, "FORMULA-BD"),
          }),
        ]),
      ]),
    );
    const rowOf = (file: string) =>
      html.match(new RegExp(`<tr[^>]*data-file="${file}".*?</tr>`))![0];
    expect(rowOf("Z.cre")).toContain(`zero<br><span class="muted">summon</span>`);
    expect(rowOf("Z.cre")).toContain(`<td class="breakdown"></td>`);
    expect(rowOf("B.cre")).toContain(`book<br><span class="muted">no adjustment</span>`);
    expect(rowOf("U.cre")).toContain(`as base<br><span class="muted">nothing read</span>`);
    expect(rowOf("F.cre")).toContain(`<td>formula</td>`);
    expect(rowOf("F.cre")).toContain(`<td class="breakdown">FORMULA-BD</td>`);
    expect(html).toContain("adjustments whose XP changed");
  });

  it("carries the monster name on conflicts", () => {
    expect(report.conflicts).toHaveLength(1);
    expect(report.conflicts[0].monster).toBe(report.rows[0].monster);
    expect(report.conflicts[0].bookXp).toBe(650);
  });

  it("shows every table's difference in percent, sorted on its size", () => {
    const html = renderExperienceTab(
      buildExperienceReport([
        fake(1, [
          row({
            file: "UP.cre",
            status: "formula",
            inGameXp: 1000,
            newXp: 1500,
            score: score(1500, "U"),
          }),
          row({
            file: "DOWN.cre",
            status: "drop",
            inGameXp: 2000,
            newXp: 2000,
            score: score(1000, "D"),
          }),
        ]),
      ]),
    );
    const allRow = html.split("<tr").find((r) => r.includes('data-file="UP.cre"')) ?? "";
    expect(allRow).toContain(`data-gap="50"`);
    expect(allRow).toContain(">+50%<");
    const dropRows = html.split('id="xp-drops"')[1].split("<tr");
    const dropRow = dropRows.find((r) => r.includes('data-file="DOWN.cre"')) ?? "";
    expect(dropRow).toContain(`data-gap="50"`);
    expect(dropRow).toContain(">-50%<");
  });

  it("explains every status in a legend", () => {
    const html = renderExperienceTab(buildExperienceReport([]));
    const legend = html.split('class="xp-legend"')[1].split("</dl>")[0];
    for (const label of ["formula", "drop", "as base", "book", "zero"]) {
      expect(legend).toContain(`<dt>${label}</dt>`);
    }
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

describe("gapPercent", () => {
  it("is the formula's difference to the book, in whole percents", () => {
    expect(gapPercent(7000, 11000)).toBe(57);
    expect(gapPercent(4000, 3000)).toBe(-25);
    expect(gapPercent(undefined, 3000)).toBeUndefined();
  });
});
