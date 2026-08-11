import * as fs from "fs";

const PACKAGE_VERSION_PATTERN = /"version":\s*"([^"]+)"/;
const TP2_VERSION_PATTERN = /VERSION ~v([^~]+)~/;

class ReleaseVersionFilesService {
  readPackageVersion(packageJsonPath: string): string {
    const content = fs.readFileSync(packageJsonPath, "utf-8");
    const match = PACKAGE_VERSION_PATTERN.exec(content);
    if (!match) throw new Error(`${packageJsonPath} has no "version" field`);
    return match[1];
  }

  writePackageVersion(packageJsonPath: string, version: string): void {
    const content = fs.readFileSync(packageJsonPath, "utf-8");
    if (!PACKAGE_VERSION_PATTERN.test(content)) {
      throw new Error(`${packageJsonPath} has no "version" field`);
    }
    const updated = content.replace(PACKAGE_VERSION_PATTERN, `"version": "${version}"`);
    fs.writeFileSync(packageJsonPath, updated);
  }

  readTp2Version(tp2Path: string): string {
    const content = fs.readFileSync(tp2Path, "utf-8");
    const match = TP2_VERSION_PATTERN.exec(content);
    if (!match) throw new Error(`${tp2Path} has no "VERSION ~v...~" line`);
    return match[1];
  }

  writeTp2Version(tp2Path: string, version: string): void {
    const content = fs.readFileSync(tp2Path, "utf-8");
    if (!TP2_VERSION_PATTERN.test(content)) {
      throw new Error(`${tp2Path} has no "VERSION ~v...~" line`);
    }
    const updated = content.replace(TP2_VERSION_PATTERN, `VERSION ~v${version}~`);
    fs.writeFileSync(tp2Path, updated);
  }
}

const releaseVersionFilesService = new ReleaseVersionFilesService();
export default releaseVersionFilesService;
