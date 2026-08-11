import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import releaseVersionFilesService from "./release-version-files.service";

describe("ReleaseVersionFilesService", () => {
  let dir: string;

  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-version-files-"));
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  describe("package.json", () => {
    let packageJsonPath: string;

    beforeEach(() => {
      packageJsonPath = path.join(dir, "package.json");
      fs.writeFileSync(packageJsonPath, '{\n  "name": "test",\n  "version": "0.1.0"\n}\n');
    });

    it("reads the version field", () => {
      expect(releaseVersionFilesService.readPackageVersion(packageJsonPath)).toBe("0.1.0");
    });

    it("writes the version field without disturbing the rest of the file", () => {
      releaseVersionFilesService.writePackageVersion(packageJsonPath, "0.2.0");

      const content = fs.readFileSync(packageJsonPath, "utf-8");
      expect(content).toContain('"version": "0.2.0"');
      expect(content).toContain('"name": "test"');
    });

    it("throws when there is no version field", () => {
      fs.writeFileSync(packageJsonPath, "{}");
      expect(() => releaseVersionFilesService.readPackageVersion(packageJsonPath)).toThrow(
        /no "version" field/,
      );
    });
  });

  describe("tp2", () => {
    let tp2Path: string;

    beforeEach(() => {
      tp2Path = path.join(dir, "enhanced_creatures.tp2");
      fs.writeFileSync(tp2Path, 'AUTHOR "Aigleborgne"\nVERSION ~v0.1.0~\n\nALWAYS\n');
    });

    it("reads the version from the VERSION line", () => {
      expect(releaseVersionFilesService.readTp2Version(tp2Path)).toBe("0.1.0");
    });

    it("writes the version into the VERSION line without disturbing the rest of the file", () => {
      releaseVersionFilesService.writeTp2Version(tp2Path, "0.2.0");

      const content = fs.readFileSync(tp2Path, "utf-8");
      expect(content).toContain("VERSION ~v0.2.0~");
      expect(content).toContain('AUTHOR "Aigleborgne"');
      expect(content).toContain("ALWAYS");
    });

    it("throws when there is no VERSION line", () => {
      fs.writeFileSync(tp2Path, "AUTHOR \"Aigleborgne\"\n");
      expect(() => releaseVersionFilesService.readTp2Version(tp2Path)).toThrow(
        /no "VERSION ~v...~" line/,
      );
    });
  });
});
