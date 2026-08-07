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

const MOD_ITEMS = ["enhanced_creatures.tp2", "lib", "languages"];

class CopyService {
  repoRoot = path.resolve(__dirname, "..", "..", "..", "..");
  configPath = path.join(this.repoRoot, "generator", "paths.local.json");
  exampleConfigPath = path.join(this.repoRoot, "generator", "paths.example.json");

  async copy(targets: CopyTargets): Promise<void> {
    const config = this.loadConfig();
    if (targets.bg1) await this.copyToTarget("BG1", config.bg1);
    if (targets.bg2) await this.copyToTarget("BG2", config.bg2);
  }

  private loadConfig(): PathsConfig {
    if (!fs.existsSync(this.configPath)) {
      throw new Error(
        `Missing ${this.configPath}. Copy ${this.exampleConfigPath} to paths.local.json and fill in your BG1/BG2 install paths.`,
      );
    }
    const raw = fs.readFileSync(this.configPath, "utf-8");
    return JSON.parse(raw) as PathsConfig;
  }

  private async copyToTarget(label: string, destRoot: string | undefined): Promise<void> {
    if (!destRoot) {
      logService.warn(`${label} path is not configured in paths.local.json, skipping`);
      return;
    }
    if (!fs.existsSync(destRoot)) {
      logService.warn(`${label} path "${destRoot}" does not exist, skipping`);
      return;
    }
    logService.header(`Copying mod to ${label} (${destRoot})`);
    for (const item of MOD_ITEMS) {
      const src = path.join(this.repoRoot, item);
      const dest = path.join(destRoot, item);
      await fs.promises.cp(src, dest, { recursive: true, force: true });
      logService.log(`Copied ${item}`);
    }
  }
}

const copyService = new CopyService();
export default copyService;
