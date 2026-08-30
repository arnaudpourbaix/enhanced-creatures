import { describe, expect, it } from "vitest";
import {
  applyGameColumn,
  attachCarriedColumns,
  buildCreatures,
  combineOrigin,
  computeSummon,
  diffRow,
  indexMonsterIds,
  mergeFolders,
  parseCsv,
  serializeCsv,
  summarizeConflict,
  withNameLast,
  type MergeConflict,
} from "./build-creatures";

const BG_HEADER =
  "file;general;race;class;anim;deathvar;dialog;level;gender;sex;allegiance;overrideScript;classScript;raceScript;generalScript;defaultScript;helmet;shield;lring;rring;amulet;weapon1;weapon2;weapon3;weapon4;xpv;origin;name";

function bgRow(file: string, overrides: Record<string, string> = {}): string {
  const base: Record<string, string> = Object.fromEntries(BG_HEADER.split(";").map((c) => [c, ""]));
  base.file = file;
  base.name = file.toLowerCase();
  Object.assign(base, overrides);
  return BG_HEADER.split(";")
    .map((c) => base[c] ?? "")
    .join(";");
}

const OLD_HEADER =
  "file;general;race;class;anim;deathvar;dialog;origin;level;sex;allegiance;name;summon;MonsterId;ValidatedMonsterId";

function pick(rows: Record<string, string>[], file: string): Record<string, string> {
  const row = rows.find((r) => r.file === file);
  if (!row) throw new Error(`no row for ${file}`);
  return row;
}

function oldRow(
  file: string,
  monsterId = "",
  validated = "",
  extra: Record<string, string> = {},
): string {
  const base: Record<string, string> = Object.fromEntries(
    OLD_HEADER.split(";").map((c) => [c, ""]),
  );
  base.file = file;
  base.MonsterId = monsterId;
  base.ValidatedMonsterId = validated;
  Object.assign(base, extra);
  return OLD_HEADER.split(";")
    .map((c) => base[c] ?? "")
    .join(";");
}

describe("parseCsv", () => {
  it("splits rows into records keyed by header column", () => {
    const csv = parseCsv(`a;b;c\r\n1;2;3\r\n`);
    expect(csv.header).toEqual(["a", "b", "c"]);
    expect(csv.rows).toEqual([{ a: "1", b: "2", c: "3" }]);
  });

  it("keeps embedded semicolons in the final (name) column", () => {
    const csv = parseCsv(`file;origin;name\r\nFOO;bg1;Bob; the Bold\r\n`);
    expect(csv.rows[0].name).toBe("Bob; the Bold");
  });

  it("ignores blank trailing lines", () => {
    const csv = parseCsv(`a;b\r\n1;2\r\n\r\n`);
    expect(csv.rows).toHaveLength(1);
  });
});

describe("serializeCsv", () => {
  it("round-trips a parsed file with CRLF and a trailing newline", () => {
    const raw = `file;origin;name\r\nFOO;bg1;Bob\r\n`;
    const csv = parseCsv(raw);
    expect(serializeCsv(csv.header, csv.rows)).toBe(raw);
  });
});

describe("withNameLast", () => {
  it("moves name to the end", () => {
    expect(withNameLast(["file", "name", "summon", "game"])).toEqual([
      "file",
      "summon",
      "game",
      "name",
    ]);
  });

  it("leaves a header without a name column untouched", () => {
    expect(withNameLast(["file", "level"])).toEqual(["file", "level"]);
  });
});

describe("computeSummon", () => {
  it("is true when sex is SUMMONED", () => {
    expect(computeSummon({ file: "ABC", sex: "SUMMONED", allegiance: "ENEMY" })).toBe("true");
  });

  it("is true when allegiance is CONTROLLED", () => {
    expect(computeSummon({ file: "ABC", sex: "MALE", allegiance: "CONTROLLED" })).toBe("true");
  });

  it("is true when the file name ends in SU (case-insensitive)", () => {
    expect(computeSummon({ file: "bearblsu", sex: "MALE", allegiance: "NEUTRAL" })).toBe("true");
  });

  it("is empty otherwise", () => {
    expect(computeSummon({ file: "ABELA", sex: "FEMALE", allegiance: "NEUTRAL" })).toBe("");
  });
});

describe("combineOrigin", () => {
  it("keeps a single value when both origins match case-insensitively", () => {
    expect(combineOrigin("stratagems", "STRATAGEMS")).toBe("stratagems");
  });

  it("joins distinct origins with a comma, bg1 first", () => {
    expect(combineOrigin("spell_rev", "bg2")).toBe("spell_rev,bg2");
  });
});

describe("diffRow", () => {
  it("reports only the columns that differ", () => {
    const a = { file: "X", level: "1", xpv: "0", origin: "bg1" };
    const b = { file: "X", level: "7", xpv: "0", origin: "bg2" };
    expect(diffRow(a, b, ["file", "level", "xpv"])).toEqual([{ column: "level", a: "1", b: "7" }]);
  });

  it("ignores differences that are only letter case", () => {
    const a = { deathvar: "BDBART01", defaultScript: "None" };
    const b = { deathvar: "bdbart01", defaultScript: "NONE" };
    expect(diffRow(a, b, ["deathvar", "defaultScript"])).toEqual([]);
  });
});

describe("mergeFolders", () => {
  it("takes a folder-exclusive file unchanged", () => {
    const bg1 = parseCsv(`${BG_HEADER}\r\n${bgRow("ONLY1", { origin: "bg1" })}\r\n`);
    const bg2 = parseCsv(`${BG_HEADER}\r\n${bgRow("ONLY2", { origin: "bg2" })}\r\n`);
    const { merged, conflicts } = mergeFolders(bg1.rows, bg2.rows);
    expect(conflicts).toHaveLength(0);
    expect(merged.map((r) => r.file).sort((a, b) => a.localeCompare(b))).toEqual([
      "ONLY1",
      "ONLY2",
    ]);
  });

  it("merges a matching file once with a combined origin", () => {
    const bg1 = parseCsv(`${BG_HEADER}\r\n${bgRow("SAME", { origin: "rr", level: "5" })}\r\n`);
    const bg2 = parseCsv(`${BG_HEADER}\r\n${bgRow("SAME", { origin: "RR", level: "5" })}\r\n`);
    const { merged, conflicts } = mergeFolders(bg1.rows, bg2.rows);
    expect(conflicts).toHaveLength(0);
    expect(merged).toHaveLength(1);
    expect(merged[0].origin).toBe("rr");
  });

  it("excludes a file whose non-origin columns differ and records the conflict", () => {
    const bg1 = parseCsv(`${BG_HEADER}\r\n${bgRow("CONF", { origin: "bg1", level: "1" })}\r\n`);
    const bg2 = parseCsv(`${BG_HEADER}\r\n${bgRow("CONF", { origin: "bg2", level: "7" })}\r\n`);
    const { merged, conflicts } = mergeFolders(bg1.rows, bg2.rows);
    expect(merged).toHaveLength(0);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].file).toBe("CONF");
    expect(conflicts[0].diffs).toEqual([{ column: "level", a: "1", b: "7" }]);
  });

  it("does not treat an origin-only difference as a conflict", () => {
    const bg1 = parseCsv(`${BG_HEADER}\r\n${bgRow("ODIF", { origin: "bg1" })}\r\n`);
    const bg2 = parseCsv(`${BG_HEADER}\r\n${bgRow("ODIF", { origin: "bg2" })}\r\n`);
    const { merged, conflicts } = mergeFolders(bg1.rows, bg2.rows);
    expect(conflicts).toHaveLength(0);
    expect(merged[0].origin).toBe("bg1,bg2");
  });

  it("merges a file that differs only by letter case, keeping the bg1 spelling", () => {
    const bg1 = parseCsv(
      `${BG_HEADER}\r\n${bgRow("CI", { origin: "bg1", defaultScript: "None" })}\r\n`,
    );
    const bg2 = parseCsv(
      `${BG_HEADER}\r\n${bgRow("CI", { origin: "bg2", defaultScript: "NONE" })}\r\n`,
    );
    const { merged, conflicts } = mergeFolders(bg1.rows, bg2.rows);
    expect(conflicts).toHaveLength(0);
    expect(merged).toHaveLength(1);
    expect(merged[0].defaultScript).toBe("None");
  });
});

describe("buildCreatures", () => {
  const bg1 = parseCsv(
    [
      BG_HEADER,
      bgRow("KEEP", { origin: "bg1", sex: "FEMALE" }),
      bgRow("DROP", { origin: "bg1" }),
      bgRow("CONF", { origin: "bg1", level: "1" }),
      bgRow("SUMM", { origin: "bg1", sex: "SUMMONED" }),
      "",
    ].join("\r\n"),
  );
  const bg2 = parseCsv(
    [
      BG_HEADER,
      bgRow("CONF", { origin: "bg2", level: "9" }),
      bgRow("B2ONLY", { origin: "bg2" }),
      "",
    ].join("\r\n"),
  );
  const old = parseCsv(
    [
      OLD_HEADER,
      oldRow("KEEP", "Nymph", "true"),
      oldRow("CONF", "Kobold", "true"),
      oldRow("SUMM"),
      oldRow("B2ONLY", "Goblin", "false"),
      oldRow("GONE", "Ghost", "true"),
      "",
    ].join("\r\n"),
  );

  const result = buildCreatures(bg1, bg2, old);

  it("outputs the bg schema plus summon / MonsterId / ValidatedMonsterId, with name last", () => {
    const bgWithoutName = BG_HEADER.split(";").filter((c) => c !== "name");
    expect(result.outputHeader).toEqual([
      ...bgWithoutName,
      "summon",
      "MonsterId",
      "ValidatedMonsterId",
      "name",
    ]);
  });

  it("keeps only wanted files that survived the merge, sorted by file", () => {
    expect(result.creatures.map((r) => r.file)).toEqual(["B2ONLY", "KEEP", "SUMM"]);
  });

  it("drops a bg file that is not in the wanted set", () => {
    expect(result.creatures.find((r) => r.file === "DROP")).toBeUndefined();
  });

  it("carries MonsterId / ValidatedMonsterId from the old csv by file", () => {
    const keep = pick(result.creatures, "KEEP");
    expect(keep.MonsterId).toBe("Nymph");
    expect(keep.ValidatedMonsterId).toBe("true");
  });

  it("computes summon from the merged row, not the old csv", () => {
    expect(pick(result.creatures, "SUMM").summon).toBe("true");
    expect(pick(result.creatures, "KEEP").summon).toBe("");
  });

  it("reports wanted files missing from both folders", () => {
    expect(result.missing).toEqual(["GONE"]);
  });

  it("reports wanted files excluded by a merge conflict", () => {
    expect(result.excludedWanted).toEqual(["CONF"]);
    expect(result.conflicts.map((c) => c.file)).toEqual(["CONF"]);
  });
});

describe("applyGameColumn", () => {
  const h = "file;origin;name";
  const base = parseCsv([h, "AAA;bg1,bg2;A", "CCC;bg1,bg2;C", ""].join("\r\n"));
  const bg1Dups = parseCsv([h, "BBB;bg1;B one", ""].join("\r\n"));
  const bg2Dups = parseCsv([h, "BBB;bg2;B two", ""].join("\r\n"));

  it("adds a game column: empty for base rows, bg1/bg2 for the duplicate rows", () => {
    const { header, rows } = applyGameColumn(base, bg1Dups, bg2Dups);
    expect(header).toEqual(["file", "origin", "game", "name"]);
    expect(rows.map((r) => [r.file, r.game])).toEqual([
      ["AAA", ""],
      ["BBB", "bg1"],
      ["BBB", "bg2"],
      ["CCC", ""],
    ]);
  });

  it("is idempotent - re-running does not stack the game-tagged rows", () => {
    const once = applyGameColumn(base, bg1Dups, bg2Dups);
    const twice = applyGameColumn({ header: once.header, rows: once.rows }, bg1Dups, bg2Dups);
    expect(twice.rows).toEqual(once.rows);
  });
});

describe("buildCreatures MonsterId conflicts", () => {
  it("prefers a non-empty id and records disagreeing non-empty ids", () => {
    const bg1 = parseCsv([BG_HEADER, bgRow("DUP", { origin: "bg1" }), ""].join("\r\n"));
    const bg2 = parseCsv(`${BG_HEADER}\r\n`);
    const old = parseCsv(
      [OLD_HEADER, oldRow("DUP", "", ""), oldRow("DUP", "Leopard", "false"), ""].join("\r\n"),
    );
    const result = buildCreatures(bg1, bg2, old);
    expect(pick(result.creatures, "DUP").MonsterId).toBe("Leopard");
    expect(result.idConflicts).toHaveLength(0);

    const old2 = parseCsv(
      [OLD_HEADER, oldRow("DUP", "Leopard", "false"), oldRow("DUP", "Panther", "true"), ""].join(
        "\r\n",
      ),
    );
    const result2 = buildCreatures(bg1, bg2, old2);
    expect(result2.idConflicts).toEqual([{ file: "DUP", values: ["Leopard", "Panther"] }]);
  });
});

describe("attachCarriedColumns", () => {
  it("adds computed summon and looked-up MonsterId / ValidatedMonsterId", () => {
    const { byFile } = indexMonsterIds(
      parseCsv([OLD_HEADER, oldRow("ABELA", "Nymph", "true"), ""].join("\r\n")).rows,
    );
    const rows = parseCsv(
      [
        BG_HEADER,
        bgRow("ABELA", { sex: "FEMALE" }),
        bgRow("BEARBLSU", { sex: "SUMMONED" }),
        "",
      ].join("\r\n"),
    ).rows;
    const out = attachCarriedColumns(rows, byFile);
    expect(out[0]).toMatchObject({ summon: "", MonsterId: "Nymph", ValidatedMonsterId: "true" });
    expect(out[1]).toMatchObject({ summon: "true", MonsterId: "", ValidatedMonsterId: "" });
  });
});

describe("summarizeConflict", () => {
  const conflict = (diffs: MergeConflict["diffs"], names = ["Foo", "Foo"]): MergeConflict => ({
    file: "X",
    bg1: { file: "X", name: names[0] },
    bg2: { file: "X", name: names[1] },
    diffs,
  });

  it("lists the differing columns and the creature name", () => {
    const s = summarizeConflict(
      conflict([
        { column: "level", a: "1", b: "7" },
        { column: "xpv", a: "0", b: "400" },
      ]),
    );
    expect(s.name).toBe("Foo");
    expect(s.columns).toEqual(["level", "xpv"]);
  });

  it("shows both names when bg1 and bg2 disagree on the display name", () => {
    const s = summarizeConflict(
      conflict([{ column: "name", a: "Bartender", b: "Samuel" }], ["Bartender", "Samuel"]),
    );
    expect(s.name).toBe("Bartender / Samuel");
  });

  it("treats names that match apart from case as one name", () => {
    const s = summarizeConflict(
      conflict([{ column: "level", a: "1", b: "7" }], ["Gnoll", "GNOLL"]),
    );
    expect(s.name).toBe("Gnoll");
  });
});
