import { describe, expect, it } from "vitest";
import { parseCsv } from "./build-creatures";
import {
  levelDiffs,
  originDiffs,
  pairConflicts,
  renderDuplicatesReport,
} from "./duplicates-report";

const HEADER =
  "file;general;race;class;anim;deathvar;dialog;level;gender;sex;allegiance;overrideScript;classScript;raceScript;generalScript;defaultScript;helmet;shield;lring;rring;amulet;weapon1;weapon2;weapon3;weapon4;xpv;origin;name";

function row(file: string, overrides: Record<string, string> = {}): string {
  const base: Record<string, string> = Object.fromEntries(HEADER.split(";").map((c) => [c, ""]));
  base.file = file;
  base.level = "1";
  base.name = file;
  Object.assign(base, overrides);
  return HEADER.split(";")
    .map((c) => base[c])
    .join(";");
}

const csv = (...rows: string[]): ReturnType<typeof parseCsv> =>
  parseCsv([HEADER, ...rows, ""].join("\r\n"));

describe("pairConflicts", () => {
  it("pairs rows present in both files and lists their real differences", () => {
    const bg1 = csv(row("A", { level: "5", origin: "bg1" }));
    const bg2 = csv(row("A", { level: "8", origin: "bg2" }));
    const conflicts = pairConflicts(bg1, bg2);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].diffs).toEqual([{ column: "level", a: "5", b: "8" }]);
  });

  it("ignores an origin-only or case-only difference", () => {
    const bg1 = csv(row("A", { origin: "bg1", defaultScript: "None" }));
    const bg2 = csv(row("A", { origin: "bg2", defaultScript: "NONE" }));
    expect(pairConflicts(bg1, bg2)).toHaveLength(0);
  });

  it("skips a file that is only in one of the two files", () => {
    const bg1 = csv(row("A", { level: "5" }), row("B", { level: "5" }));
    const bg2 = csv(row("A", { level: "8" }));
    expect(pairConflicts(bg1, bg2).map((c) => c.file)).toEqual(["A"]);
  });

  it("sorts the conflicts by file", () => {
    const bg1 = csv(row("B", { level: "1" }), row("A", { level: "1" }));
    const bg2 = csv(row("B", { level: "2" }), row("A", { level: "2" }));
    expect(pairConflicts(bg1, bg2).map((c) => c.file)).toEqual(["A", "B"]);
  });
});

describe("levelDiffs", () => {
  it("returns only conflicts whose level changed, with the signed delta", () => {
    const bg1 = csv(row("A", { level: "1" }), row("B", { level: "10", name: "Bee" }));
    const bg2 = csv(row("A", { level: "1", xpv: "5" }), row("B", { level: "3", name: "Bee" }));
    const diffs = levelDiffs(pairConflicts(bg1, bg2));
    expect(diffs).toEqual([{ file: "B", name: "Bee", bg1: 10, bg2: 3, delta: -7 }]);
  });

  it("sorts by the size of the change, largest first", () => {
    const bg1 = csv(row("A", { level: "1" }), row("B", { level: "1" }), row("C", { level: "1" }));
    const bg2 = csv(row("A", { level: "4" }), row("B", { level: "20" }), row("C", { level: "2" }));
    expect(levelDiffs(pairConflicts(bg1, bg2)).map((d) => d.file)).toEqual(["B", "A", "C"]);
  });
});

describe("originDiffs", () => {
  it("returns conflicts whose origin differs, ignoring letter case", () => {
    const bg1 = csv(
      row("A", { level: "5", origin: "NTOTSC" }),
      row("B", { level: "5", origin: "bg1" }),
      row("C", { level: "5", origin: "RR" }),
    );
    const bg2 = csv(
      row("A", { level: "8", origin: "bg2" }),
      row("B", { level: "8", origin: "bg2" }),
      row("C", { level: "8", origin: "rr" }),
    );
    expect(originDiffs(pairConflicts(bg1, bg2))).toEqual([
      { file: "A", name: "A", bg1: "NTOTSC", bg2: "bg2" },
      { file: "B", name: "B", bg1: "bg1", bg2: "bg2" },
    ]);
  });
});

describe("renderDuplicatesReport", () => {
  it("includes a level-differences section when any level changed", () => {
    const bg1 = csv(row("A", { level: "5" }));
    const bg2 = csv(row("A", { level: "9" }));
    const md = renderDuplicatesReport(pairConflicts(bg1, bg2));
    expect(md).toContain("## Level differences");
    expect(md).toContain("| A | A | 5 | 9 | +4 |");
  });

  it("rolls up origin pairs and lists the files whose origin is not just bg1/bg2", () => {
    const bg1 = csv(
      row("A", { level: "5", origin: "bg1" }),
      row("B", { level: "5", origin: "bg1" }),
      row("MOD1", { level: "5", origin: "NTOTSC" }),
    );
    const bg2 = csv(
      row("A", { level: "8", origin: "bg2" }),
      row("B", { level: "8", origin: "bg2" }),
      row("MOD1", { level: "8", origin: "bg2" }),
    );
    const md = renderDuplicatesReport(pairConflicts(bg1, bg2));
    expect(md).toContain("## Origin differences");
    expect(md).toContain("| bg1 | bg2 | 2 |");
    expect(md).toContain("| NTOTSC | bg2 | 1 |");
    expect(md).toContain("| MOD1 | MOD1 | NTOTSC | bg2 |");
    expect(md).not.toContain("| A | A | bg1 | bg2 |");
  });
});
