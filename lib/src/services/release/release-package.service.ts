import AdmZip from "adm-zip";
import * as fs from "fs";
import * as path from "path";

class ReleasePackageService {
  repoRoot = path.resolve(__dirname, "..", "..", "..", "..");
  modDir = path.join(this.repoRoot, "mod");
  distDir = path.join(this.repoRoot, "dist");

  createZip(version: string): string {
    const zipPath = path.join(this.distDir, `enhanced_creatures-v${version}.zip`);
    fs.mkdirSync(this.distDir, { recursive: true });
    const zip = new AdmZip();
    zip.addLocalFolder(this.modDir, "enhanced_creatures");
    zip.writeZip(zipPath);
    return zipPath;
  }
}

const releasePackageService = new ReleasePackageService();
export default releasePackageService;
