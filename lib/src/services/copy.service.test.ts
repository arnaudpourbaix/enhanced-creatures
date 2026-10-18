import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import logService from "./log.service";
import copyService from "./copy.service";

describe("CopyService", () => {
  const TP2_FILE = "enhanced_creatures.tp2";
  const TP2_CONTENTS = "tp2 contents";
  const MOD_SUBFOLDER = "enhanced_creatures";
  const CHANGELOG_FILE = "CHANGELOG.md";

  let repoDir: string;
  let bg1Dir: string;
  let bg2Dir: string;

  beforeEach(() => {
    repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-copy-repo-"));
    bg1Dir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-copy-bg1-"));
    bg2Dir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-copy-bg2-"));

    const modDir = path.join(repoDir, "mod");
    fs.mkdirSync(modDir, { recursive: true });
    fs.writeFileSync(path.join(modDir, TP2_FILE), TP2_CONTENTS);
    fs.mkdirSync(path.join(modDir, "lib", "common"), { recursive: true });
    fs.writeFileSync(path.join(modDir, "lib", "common", "index.tpa"), "lib contents");
    fs.mkdirSync(path.join(modDir, "languages", "english"), { recursive: true });
    fs.writeFileSync(path.join(modDir, "languages", "english", "setup.tra"), "tra contents");
    fs.mkdirSync(path.join(modDir, "docs"), { recursive: true });
    fs.writeFileSync(path.join(modDir, "docs", "index.html"), "docs contents");
    fs.writeFileSync(path.join(modDir, CHANGELOG_FILE), "changelog contents");

    copyService.repoRoot = repoDir;
    copyService.modDir = modDir;
    copyService.configPath = path.join(repoDir, "paths.local.json");
    copyService.exampleConfigPath = path.join(repoDir, "paths.example.json");

    logService.filePath = path.join(repoDir, "generator.log");
    logService.enabled = false;
  });

  afterEach(() => {
    vi.restoreAllMocks();
    fs.rmSync(repoDir, { recursive: true, force: true });
    fs.rmSync(bg1Dir, { recursive: true, force: true });
    fs.rmSync(bg2Dir, { recursive: true, force: true });
  });

  function writeConfig(config: Record<string, string>): void {
    fs.writeFileSync(copyService.configPath, JSON.stringify(config));
  }

  function modPath(dest: string, ...segments: string[]): string {
    return path.join(dest, MOD_SUBFOLDER, ...segments);
  }

  it("throws a clear error when paths.local.json is missing", async () => {
    await expect(copyService.copy({ bg1: true, bg2: true })).rejects.toThrow(/paths\.local\.json/);
  });

  it("warns and skips a target with no configured path", async () => {
    writeConfig({});
    const warn = vi.spyOn(logService, "warn");

    await copyService.copy({ bg1: true, bg2: false });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining("BG1 path is not configured"));
    expect(fs.existsSync(modPath(bg1Dir, TP2_FILE))).toBe(false);
  });

  it("warns and skips a target whose configured path does not exist on disk", async () => {
    const missing = path.join(bg1Dir, "does-not-exist");
    writeConfig({ bg1: missing });
    const warn = vi.spyOn(logService, "warn");

    await copyService.copy({ bg1: true, bg2: false });

    expect(warn).toHaveBeenCalledWith(expect.stringContaining(missing));
  });

  it("copies everything under mod/, nested under enhanced_creatures/, into each configured, existing target", async () => {
    writeConfig({ bg1: bg1Dir, bg2: bg2Dir });

    await copyService.copy({ bg1: true, bg2: true });

    for (const dest of [bg1Dir, bg2Dir]) {
      expect(fs.readFileSync(modPath(dest, TP2_FILE), "utf-8")).toBe(TP2_CONTENTS);
      expect(fs.readFileSync(modPath(dest, "lib", "common", "index.tpa"), "utf-8")).toBe(
        "lib contents",
      );
      expect(fs.readFileSync(modPath(dest, "languages", "english", "setup.tra"), "utf-8")).toBe(
        "tra contents",
      );
      expect(fs.readFileSync(modPath(dest, "docs", "index.html"), "utf-8")).toBe("docs contents");
      expect(fs.readFileSync(modPath(dest, CHANGELOG_FILE), "utf-8")).toBe("changelog contents");
    }
  });

  it("picks up a file added under mod/ without any code change", async () => {
    writeConfig({ bg1: bg1Dir, bg2: bg2Dir });
    fs.writeFileSync(path.join(repoDir, "mod", "new-file.txt"), "brand new");

    await copyService.copy({ bg1: true, bg2: false });

    expect(fs.readFileSync(modPath(bg1Dir, "new-file.txt"), "utf-8")).toBe("brand new");
  });

  it("only copies to the selected target", async () => {
    writeConfig({ bg1: bg1Dir, bg2: bg2Dir });

    await copyService.copy({ bg1: true, bg2: false });

    expect(fs.existsSync(modPath(bg1Dir, TP2_FILE))).toBe(true);
    expect(fs.existsSync(modPath(bg2Dir, TP2_FILE))).toBe(false);
  });

  it("merges into an existing destination without deleting unrelated files", async () => {
    writeConfig({ bg1: bg1Dir, bg2: bg2Dir });
    fs.writeFileSync(path.join(bg1Dir, "some-other-mod.tp2"), "unrelated mod");
    fs.mkdirSync(modPath(bg1Dir), { recursive: true });
    fs.writeFileSync(modPath(bg1Dir, "leftover.txt"), "leftover from a previous install");

    await copyService.copy({ bg1: true, bg2: false });

    expect(fs.readFileSync(path.join(bg1Dir, "some-other-mod.tp2"), "utf-8")).toBe("unrelated mod");
    expect(fs.readFileSync(modPath(bg1Dir, "leftover.txt"), "utf-8")).toBe(
      "leftover from a previous install",
    );
    expect(fs.existsSync(modPath(bg1Dir, TP2_FILE))).toBe(true);
  });

  it("overwrites a stale copy of the mod already present in the destination", async () => {
    writeConfig({ bg1: bg1Dir, bg2: bg2Dir });
    fs.mkdirSync(modPath(bg1Dir), { recursive: true });
    fs.writeFileSync(modPath(bg1Dir, TP2_FILE), "stale contents");

    await copyService.copy({ bg1: true, bg2: false });

    expect(fs.readFileSync(modPath(bg1Dir, TP2_FILE), "utf-8")).toBe(TP2_CONTENTS);
  });

  describe("filter", () => {
    const lines = (...l: string[]) => [...l, ""].join("\r\n");
    const include = (rel: string) => `INCLUDE "%MOD_FOLDER%/lib/pnp-monster/${rel}"`;
    const main = (rel: string) => include(`${rel}/main.tpa`);
    const FOLDERS = [
      "kin/construct",
      "kin/fey",
      "vampire",
      "dryad",
      "nereid",
      "giant-poisonous-snake",
      "helmed-horror",
      "battle-horror",
      "doom-sayer",
    ];
    const INDEX_TPA = lines(...FOLDERS.map(main));
    const INDEX_JSON = JSON.stringify({
      vampire: { kin: null, dependsOn: [] },
      dryad: { kin: "fey", dependsOn: [] },
      nereid: { kin: "fey", dependsOn: ["giant-poisonous-snake"] },
      "giant-poisonous-snake": { kin: null, dependsOn: [] },
      "helmed-horror": { kin: "construct", dependsOn: [] },
      "battle-horror": { kin: "construct", dependsOn: ["helmed-horror"] },
      "doom-sayer": { kin: "construct", dependsOn: ["battle-horror"] },
    });
    const VAMPIRE_MAIN = lines(
      "LAM load_secondary_types",
      include("vampire/common.tpa"),
      `${include("vampire/4c.tpa")} // Fledgling Vampire`,
      `${include("vampire/4h.tpa")} // Mature Vampire`,
      `${include("vampire/4m.tpa")} // Patriarch Vampire`,
    );
    const SNAKE_MAIN = lines(
      `${include("giant-poisonous-snake/1a.tpa")} // Giant Poisonous Snake`,
      `${include("giant-poisonous-snake/1b.tpa")} // Baby Snake`,
    );
    const pnpDir = () => path.join(repoDir, "mod", "lib", "pnp-monster");

    beforeEach(() => {
      fs.mkdirSync(pnpDir(), { recursive: true });
      fs.writeFileSync(path.join(pnpDir(), "index.tpa"), INDEX_TPA);
      fs.writeFileSync(path.join(pnpDir(), "index.json"), INDEX_JSON);
      for (const [folder, content] of [
        ["vampire", VAMPIRE_MAIN],
        ["giant-poisonous-snake", SNAKE_MAIN],
        ["nereid", lines(`${include("nereid/2b.tpa")} // Nereid`)],
      ]) {
        fs.mkdirSync(path.join(pnpDir(), folder), { recursive: true });
        fs.writeFileSync(path.join(pnpDir(), folder, "main.tpa"), content);
      }
      writeConfig({ bg1: bg1Dir });
    });

    const empty = { entries: [], kins: [], monsters: [] };
    const run = (filter: Partial<typeof empty>) =>
      copyService.copy({ bg1: true, bg2: false }, { ...empty, ...filter });

    function readCopied(...segments: string[]): string {
      return fs.readFileSync(modPath(bg1Dir, ...segments), "utf-8");
    }

    const readIndex = () => readCopied("lib", "pnp-monster", "index.tpa");

    /** The index.tpa the copy should hold: only the given folders stay active. */
    function indexKeeping(...kept: string[]): string {
      return lines(
        ...FOLDERS.map((folder) => (kept.includes(folder) ? main(folder) : `// ${main(folder)}`)),
      );
    }

    it("leaves files untouched when the filter is empty", async () => {
      await run({});

      expect(readIndex()).toBe(INDEX_TPA);
    });

    it("--entry keeps the entry and its kin only, in the copied index.tpa only", async () => {
      await run({ entries: ["Dryad"] });

      expect(readIndex()).toBe(indexKeeping("kin/fey", "dryad"));
      expect(fs.readFileSync(path.join(pnpDir(), "index.tpa"), "utf-8")).toBe(INDEX_TPA);
    });

    it("--entry keeps the entries it depends on, transitively, and their kins", async () => {
      await run({ entries: ["doom-sayer"] });

      expect(readIndex()).toBe(
        indexKeeping("kin/construct", "helmed-horror", "battle-horror", "doom-sayer"),
      );
    });

    it("--entry follows a dependency cycle once and stops", async () => {
      const index = JSON.parse(INDEX_JSON) as Record<string, { dependsOn: string[] }>;
      index.dryad.dependsOn = ["nereid"];
      index.nereid.dependsOn = ["dryad", "giant-poisonous-snake"];
      fs.writeFileSync(path.join(pnpDir(), "index.json"), JSON.stringify(index));

      await run({ entries: ["dryad"] });

      expect(readIndex()).toBe(indexKeeping("kin/fey", "dryad", "nereid", "giant-poisonous-snake"));
    });

    it("--entry keeps a dependency that has no kin", async () => {
      await run({ entries: ["nereid"] });

      expect(readIndex()).toBe(indexKeeping("kin/fey", "nereid", "giant-poisonous-snake"));
    });

    it("--entry accepts several names", async () => {
      await run({ entries: ["vampire", "dryad"] });

      expect(readIndex()).toBe(indexKeeping("kin/fey", "vampire", "dryad"));
    });

    it("--kin keeps the kin with all its entries and their dependencies", async () => {
      await run({ kins: ["FEY"] });

      expect(readIndex()).toBe(indexKeeping("kin/fey", "dryad", "nereid", "giant-poisonous-snake"));
    });

    it("--monster alone keeps the matching creatures and the entries that contain them", async () => {
      await run({ monsters: ["VAMPIRE"] });

      expect(readIndex()).toBe(indexKeeping("vampire"));
      expect(readCopied("lib", "pnp-monster", "vampire", "main.tpa")).toBe(VAMPIRE_MAIN);
    });

    it("--monster narrows the creatures of the --entry entries", async () => {
      await run({ entries: ["vampire", "dryad"], monsters: ["patriarch"] });

      expect(readIndex()).toBe(indexKeeping("vampire"));
      const vampire = readCopied("lib", "pnp-monster", "vampire", "main.tpa");
      expect(vampire).toContain(`${include("vampire/4m.tpa")} // Patriarch Vampire`);
      expect(vampire).toContain(`// ${include("vampire/4c.tpa")} // Fledgling Vampire`);
      expect(vampire).toContain(`// ${include("vampire/4h.tpa")} // Mature Vampire`);
      expect(fs.readFileSync(path.join(pnpDir(), "vampire", "main.tpa"), "utf-8")).toBe(
        VAMPIRE_MAIN,
      );
    });

    it("keeps a dependency's creatures whole even when --monster would narrow them", async () => {
      // "giant" matches one snake line, so the snake entry would be narrowed on its own.
      await run({ entries: ["nereid", "giant-poisonous-snake"], monsters: ["nereid", "giant"] });

      expect(readCopied("lib", "pnp-monster", "giant-poisonous-snake", "main.tpa")).toBe(
        SNAKE_MAIN,
      );
      expect(readIndex()).toBe(indexKeeping("kin/fey", "nereid", "giant-poisonous-snake"));
    });

    it("narrows an entry nobody depends on", async () => {
      await run({ entries: ["giant-poisonous-snake"], monsters: ["giant"] });

      expect(readCopied("lib", "pnp-monster", "giant-poisonous-snake", "main.tpa")).toBe(
        lines(
          `${include("giant-poisonous-snake/1a.tpa")} // Giant Poisonous Snake`,
          `// ${include("giant-poisonous-snake/1b.tpa")} // Baby Snake`,
        ),
      );
    });

    it("explains an old-format index.json", async () => {
      fs.writeFileSync(path.join(pnpDir(), "index.json"), JSON.stringify({ dryad: "fey" }));

      await expect(run({ entries: ["dryad"] })).rejects.toThrow(
        "index.json is in the old format: run `npm run generate`",
      );
    });

    it("explains an unreadable index.json", async () => {
      fs.writeFileSync(path.join(pnpDir(), "index.json"), "{ nope");

      await expect(run({ entries: ["dryad"] })).rejects.toThrow(
        "index.json is in the old format: run `npm run generate`",
      );
    });

    it("throws before copying when an entry is unknown, listing the valid ones", async () => {
      await expect(run({ entries: ["bear"] })).rejects.toThrow(
        "Unknown entry: bear. Available: battle-horror, doom-sayer, dryad, giant-poisonous-snake, helmed-horror, nereid, vampire",
      );
      expect(fs.existsSync(modPath(bg1Dir, TP2_FILE))).toBe(false);
    });

    it("throws when a kin is unknown, listing the valid ones", async () => {
      await expect(run({ kins: ["dog"] })).rejects.toThrow(
        "Unknown kin: dog. Available: construct, fey",
      );
    });

    it("throws when no creature matches", async () => {
      await expect(run({ entries: ["dryad"], monsters: ["vampire"] })).rejects.toThrow(
        "No creature matches --monster vampire",
      );
    });
  });
});
