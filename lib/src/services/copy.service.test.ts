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
});
