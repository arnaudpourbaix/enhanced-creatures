import * as fs from "fs";
import * as path from "path";
import logService from "./log.service";

export interface CopyTargets {
  bg1: boolean;
  bg2: boolean;
}

interface PathsConfig {
  bg1?: string;
  bg2?: string;
}

// The tp2's %MOD_FOLDER% macro resolves to wherever enhanced_creatures.tp2 itself sits, so
// everything must land inside this subfolder (with the tp2) rather than at the destination's
// root - otherwise %MOD_FOLDER%/lib/... resolves to the game root instead of the mod's own files.
const MOD_SUBFOLDER = "enhanced_creatures";

class CopyService {
  repoRoot = path.resolve(__dirname, "..", "..", "..");
  modDir = path.join(this.repoRoot, "mod");
  configPath = path.join(this.repoRoot, "paths.local.json");
  exampleConfigPath = path.join(this.repoRoot, "paths.example.json");

  async copy(targets: CopyTargets): Promise<number> {
    const config = this.loadConfig();
    let copiedCount = 0;
    if (targets.bg1 && (await this.copyToTarget("BG1", config.bg1))) copiedCount++;
    if (targets.bg2 && (await this.copyToTarget("BG2", config.bg2))) copiedCount++;
    return copiedCount;
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

  private async copyToTarget(label: string, destRoot: string | undefined): Promise<boolean> {
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
    return true;
  }
}

const copyService = new CopyService();
export default copyService;
