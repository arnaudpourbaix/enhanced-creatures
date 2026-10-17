import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { EntryEnum } from "../../../creatures/entry";
import { KinEnum } from "../../../creatures/kin";
import { State } from "../../state";
import weiduIndexService from "./weidu-index.service";

describe("weiduIndexService.generate", () => {
  let tempDir: string;
  let originalModFolder: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ec-index-"));
    originalModFolder = State.modFolder;
    State.modFolder = tempDir;
  });

  afterEach(() => {
    State.modFolder = originalModFolder;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  const read = (file: string) =>
    fs.readFileSync(path.join(tempDir, "lib/pnp-monster", file), "utf-8");

  it("includes every kin's main.tpa, then every entry's, in the given order", () => {
    weiduIndexService.generate(
      [KinEnum.Fey, KinEnum.Bear],
      [
        { id: EntryEnum.Vampire },
        { id: EntryEnum.Dryad, kin: KinEnum.Fey },
        { id: EntryEnum.ClayGolem },
      ],
    );
    expect(read("index.tpa")).toBe(
      [
        'INCLUDE "%MOD_FOLDER%/lib/pnp-monster/kin/fey/main.tpa"',
        'INCLUDE "%MOD_FOLDER%/lib/pnp-monster/kin/bear/main.tpa"',
        'INCLUDE "%MOD_FOLDER%/lib/pnp-monster/vampire/main.tpa"',
        'INCLUDE "%MOD_FOLDER%/lib/pnp-monster/dryad/main.tpa"',
        'INCLUDE "%MOD_FOLDER%/lib/pnp-monster/clay-golem/main.tpa"',
        "",
      ].join("\r\n"),
    );
  });

  it("maps every entry folder to its kin folder or null, in the given order", () => {
    weiduIndexService.generate(
      [KinEnum.Fey],
      [{ id: EntryEnum.Vampire }, { id: EntryEnum.Dryad, kin: KinEnum.Fey }],
    );
    const index = JSON.parse(read("index.json")) as Record<string, string | null>;
    expect(index).toEqual({ vampire: null, dryad: "fey" });
    expect(Object.keys(index)).toEqual(["vampire", "dryad"]);
  });

  it("writes an empty index with empty registries", () => {
    weiduIndexService.generate([], []);
    expect(read("index.tpa")).toBe("");
    expect(JSON.parse(read("index.json"))).toEqual({});
  });
});
