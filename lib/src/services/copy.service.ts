import * as fs from "fs";
import * as path from "path";
import logService from "./log.service";

export interface CopyTargets {
  bg1: boolean;
  bg2: boolean;
}

/**
 * Narrows what the copied mod installs, to speed up testing: families are matched against the
 * pnp-monster folder names, monsters as case-insensitive substrings of the creature name comment
 * in each family's main.tpa (so "vampire" keeps every vampire age).
 */
export interface CopyFilter {
  families: string[];
  monsters: string[];
}

interface PathsConfig {
  bg1?: string;
  bg2?: string;
}

// The tp2's %MOD_FOLDER% macro resolves to wherever enhanced_creatures.tp2 itself sits, so
// everything must land inside this subfolder (with the tp2) rather than at the destination's
// root - otherwise %MOD_FOLDER%/lib/... resolves to the game root instead of the mod's own files.
const MOD_SUBFOLDER = "enhanced_creatures";
const TP2_FILE = "enhanced_creatures.tp2";

const FAMILY_INCLUDE =
  /^([ \t]*)(INCLUDE "%MOD_FOLDER%\/lib\/pnp-monster\/([^/"]+)\/main\.tpa"[^\r\n]*)$/gm;
const CREATURE_INCLUDE =
  /^(INCLUDE "%MOD_FOLDER%\/lib\/pnp-monster\/[^/"]+\/[0-9a-f]+\.tpa" \/\/ ([^\r\n]*))$/gm;

class CopyService {
  repoRoot = path.resolve(__dirname, "..", "..", "..");
  modDir = path.join(this.repoRoot, "mod");
  configPath = path.join(this.repoRoot, "paths.local.json");
  exampleConfigPath = path.join(this.repoRoot, "paths.example.json");

  async copy(targets: CopyTargets, filter?: CopyFilter): Promise<number> {
    const config = this.loadConfig();
    // Built from mod/ before copying anything, so a filter matching nothing fails early.
    const overrides = filter ? this.buildFilteredFiles(filter) : new Map<string, string>();
    let copiedCount = 0;
    if (targets.bg1 && (await this.copyToTarget("BG1", config.bg1, overrides))) copiedCount++;
    if (targets.bg2 && (await this.copyToTarget("BG2", config.bg2, overrides))) copiedCount++;
    return copiedCount;
  }

  /** Returns the rewritten contents (keyed by path relative to mod/) of the files the filter changes. */
  buildFilteredFiles(filter: CopyFilter): Map<string, string> {
    const files = new Map<string, string>();
    const families = filter.families.map((f) => f.toLowerCase());
    const monsters = filter.monsters.map((m) => m.toLowerCase());
    if (!families.length && !monsters.length) return files;

    const tp2 = fs.readFileSync(path.join(this.modDir, TP2_FILE), "utf-8");
    // Commented-out INCLUDEs don't match the line-start anchor, so only active families are listed.
    const available = [...new Set([...tp2.matchAll(FAMILY_INCLUDE)].map((m) => m[3]))];
    const unknown = families.filter((f) => !available.includes(f));
    if (unknown.length) {
      throw new Error(`Unknown family: ${unknown.join(", ")}. Available: ${available.join(", ")}`);
    }

    let kept = families.length ? families : available;
    if (monsters.length) {
      kept = kept.filter((family) => {
        const mainRel = path.join("lib", "pnp-monster", family, "main.tpa");
        const mainPath = path.join(this.modDir, mainRel);
        if (!fs.existsSync(mainPath)) return false;
        const keptNames: string[] = [];
        const content = fs
          .readFileSync(mainPath, "utf-8")
          .replace(CREATURE_INCLUDE, (line: string, _include: string, name: string) => {
            if (monsters.some((m) => name.toLowerCase().includes(m))) {
              keptNames.push(name);
              return line;
            }
            return `// ${line}`;
          });
        if (!keptNames.length) return false;
        files.set(mainRel, content);
        logService.log(`Keeping ${family}: ${keptNames.join(", ")}`);
        return true;
      });
      if (!kept.length) {
        throw new Error(`No creature matches --monster ${filter.monsters.join(", ")}`);
      }
    } else {
      logService.log(`Keeping families: ${kept.join(", ")}`);
    }

    files.set(
      TP2_FILE,
      tp2.replace(
        FAMILY_INCLUDE,
        (line: string, indent: string, include: string, family: string) =>
          kept.includes(family) ? line : `${indent}// ${include}`,
      ),
    );
    return files;
  }

  private loadConfig(): PathsConfig {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(
        `Missing ${this.configPath}. Copy ${this.exampleConfigPath} to paths.local.json and fill in your BG1/BG2 install paths.`,
      );
    }
    const raw = fs.readFileSync(this.configPath, "utf-8");
    try {
      return JSON.parse(raw) as PathsConfig;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to parse ${this.configPath}: ${message}`, { cause: e });
    }
  }

  private async copyToTarget(
    label: string,
    destRoot: string | undefined,
    overrides: Map<string, string>,
  ): Promise<boolean> {
    if (!destRoot) {
      logService.warn(`${label} path is not configured in paths.local.json, skipping`);
      return false;
    }
    if (!fs.existsSync(destRoot)) {
      logService.warn(`${label} path "${destRoot}" does not exist, skipping`);
      return false;
    }
    logService.header(`Copying mod to ${label} (${destRoot})`);
    const dest = path.join(destRoot, MOD_SUBFOLDER);
    await fs.promises.cp(this.modDir, dest, { recursive: true, force: true });
    logService.log(`Copied ${this.modDir} contents`);
    for (const [rel, content] of overrides) {
      fs.writeFileSync(path.join(dest, rel), content);
    }
    if (overrides.size) logService.log(`Applied filter to ${overrides.size} file(s)`);
    return true;
  }
}

const copyService = new CopyService();
export default copyService;
