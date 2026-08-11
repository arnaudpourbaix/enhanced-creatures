import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { LANGUAGES } from "../../translations/i18n";
import mainService from "./main.service";
import stateService from "./state.service";
import { State } from "../state";

// End-to-end regression test: runs the real generation pipeline (the same
// sequence as src/index.ts's runGenerate()) with State.modFolder redirected to a
// disposable temp directory, then compares every file it produces against
// what's currently committed/on disk in the mod. This is the only reliable
// way to test the WeiDU/TPA output: string reference numbers embedded in
// generated .tpa/.tra files come from a single global counter
// (translationService.availableStringRef) that increments across the whole
// run in family order, so any single creature/family's TPA output is only
// reproducible by running the full pipeline, not in isolation.
//
// lib/pnp-monster is copied into the temp dir first because some families
// (fey/undead/wolf/common) have a hand-authored companion `common.tpa` that
// weiduFamilyService reads (not generates) when assembling main.tpa.
// lib/common, tra, and docs are never *read* by the pipeline (only specific
// files within them are written), so they're compared by exact known path
// instead of a full-tree copy+diff — those trees also contain large amounts
// of unrelated hand-authored content (docs/_site, docs/images, tra/*/*.tra
// companions, lib/common/*.tp(a|h) helpers) that would be noise to copy.

const MOD_ROOT = path.resolve(process.cwd(), "mod");
const PNP_MONSTER_DIR = "lib/pnp-monster";

const FIXED_GENERATED_FILES = [
  "lib/common/spell-resources.tpa",
  "lib/common/spell-functions.tpa",
  "lib/common/immunities.tpa",
  "docs/monsters.html",
  "docs/changelog.html",
  ...LANGUAGES.map((lang) => `languages/${lang}/generated.tra`),
];

function copyRecursive(src: string, dest: string): void {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) copyRecursive(s, d);
    else fs.copyFileSync(s, d);
  }
}

function listFilesRecursive(dir: string, base = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  let results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results = results.concat(listFilesRecursive(full, base));
    } else {
      results.push(path.relative(base, full).split(path.sep).join("/"));
    }
  }
  return results;
}

function diffTree(expectedRoot: string, actualRoot: string) {
  // Deterministic ordering of plain ASCII relative file paths for comparison - locale-aware
  // sorting isn't relevant here.
  // eslint-disable-next-line sonarjs/no-alphabetical-sort
  const expectedFiles = listFilesRecursive(expectedRoot).sort();
  // eslint-disable-next-line sonarjs/no-alphabetical-sort
  const actualFiles = listFilesRecursive(actualRoot).sort();
  const missing = expectedFiles.filter((f) => !actualFiles.includes(f));
  const unexpected = actualFiles.filter((f) => !expectedFiles.includes(f));
  const mismatched: string[] = [];
  for (const file of expectedFiles) {
    if (!actualFiles.includes(file)) continue;
    const expected = fs.readFileSync(path.join(expectedRoot, file), "utf-8");
    const actual = fs.readFileSync(path.join(actualRoot, file), "utf-8");
    if (actual !== expected) mismatched.push(file);
  }
  return { missing, unexpected, mismatched };
}

let tempDir: string;

beforeAll(async () => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-golden-"));
  const pnpMonsterSrc = path.join(MOD_ROOT, PNP_MONSTER_DIR);
  copyRecursive(pnpMonsterSrc, path.join(tempDir, PNP_MONSTER_DIR));
  fs.copyFileSync(path.join(MOD_ROOT, "CHANGELOG.md"), path.join(tempDir, "CHANGELOG.md"));

  await stateService.init();
  State.modFolder = tempDir;
  mainService.checkPresets();
  mainService.checkSpells();
  mainService.generateCreatures();
  mainService.generateCommonCode();
  mainService.generateTranslations();
}, 60000);

afterAll(() => {
  if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
});

describe("full generator pipeline output", () => {
  it("regenerates lib/pnp-monster identically to what's on disk", () => {
    const result = diffTree(
      path.join(MOD_ROOT, PNP_MONSTER_DIR),
      path.join(tempDir, PNP_MONSTER_DIR),
    );
    expect(result).toEqual({ missing: [], unexpected: [], mismatched: [] });
  });

  it.each(FIXED_GENERATED_FILES)("regenerates %s identically", (file) => {
    const expectedPath = path.join(MOD_ROOT, file);
    const actualPath = path.join(tempDir, file);
    expect(fs.existsSync(actualPath), `${file} was not generated`).toBe(true);
    const expected = fs.readFileSync(expectedPath, "utf-8");
    const actual = fs.readFileSync(actualPath, "utf-8");
    expect(actual).toBe(expected);
  });
});
