import AdmZip from "adm-zip";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import releasePackageService from "./release-package.service";

describe("ReleasePackageService", () => {
  let repoDir: string;

  beforeEach(() => {
    repoDir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-package-"));
    const modDir = path.join(repoDir, "mod");
    fs.mkdirSync(path.join(modDir, "lib"), { recursive: true });
    fs.writeFileSync(path.join(modDir, "enhanced_creatures.tp2"), "tp2 contents");
    fs.writeFileSync(path.join(modDir, "lib", "index.tpa"), "lib contents");

    releasePackageService.repoRoot = repoDir;
    releasePackageService.modDir = modDir;
    releasePackageService.distDir = path.join(repoDir, "dist");
  });

  afterEach(() => {
    fs.rmSync(repoDir, { recursive: true, force: true });
  });

  it("creates dist/enhanced_creatures-v<version>.zip rooted under enhanced_creatures/", () => {
    const zipPath = releasePackageService.createZip("0.2.0");

    expect(zipPath).toBe(path.join(repoDir, "dist", "enhanced_creatures-v0.2.0.zip"));
    expect(fs.existsSync(zipPath)).toBe(true);

    const entries = new AdmZip(zipPath).getEntries().map((e) => e.entryName.replace(/\\/g, "/"));
    expect(entries).toContain("enhanced_creatures/enhanced_creatures.tp2");
    expect(entries).toContain("enhanced_creatures/lib/index.tpa");
  });

  it("preserves file contents", () => {
    const zipPath = releasePackageService.createZip("0.2.0");

    const zip = new AdmZip(zipPath);
    const tp2Entry = zip.getEntry("enhanced_creatures/enhanced_creatures.tp2");
    if (tp2Entry === null) throw new Error("tp2Entry not found in zip");
    expect(zip.readAsText(tp2Entry)).toBe("tp2 contents");
  });
});
