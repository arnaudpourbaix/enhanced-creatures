import * as fs from "fs";
import * as path from "path";
import { describe, expect, it } from "vitest";
import { ITEMS } from "../../config/item";
import { NEW_CREATURES } from "../../config/creatures";
import { NEW_SPELLS } from "../../config/spells/spells";
import { CommonProjectileFiles } from "../../spells/projectiles";

const SCHEME = /^ja[sipbcav][mfekc][0-9a-z]{4}$/;
// Not resource names: "ja_wilderness" is a game area/state name, "jaws" is a natural weapon kind.
const ALLOW = new Set(["ja_wilderness", "jaws"]);
const REPO_ROOT = path.resolve(__dirname, "../../..");

function assetNames(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...assetNames(full));
    else if (/^ja/i.test(e.name) && !/\.baf$/i.test(e.name)) out.push(path.parse(e.name).name);
  }
  return out;
}

/** Only the `assets/` subfolders of each pnp-monster family (old generated files live beside them). */
function monsterAssetNames(): string[] {
  const root = path.join(REPO_ROOT, "mod/lib/pnp-monster");
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(root, e.name, "assets")))
    .flatMap((e) => assetNames(path.join(root, e.name, "assets")));
}

function sourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" ? [] : sourceFiles(full);
    return /\.ts$/.test(e.name) && !/\.test\.ts$/.test(e.name) ? [full] : [];
  });
}

/** Lowercase `ja...` string literals in code (case-sensitive: uppercase JA_* state names are excluded). */
function inlineLiterals(): string[] {
  return sourceFiles(path.join(REPO_ROOT, "lib")).flatMap((f) =>
    [...fs.readFileSync(f, "utf-8").matchAll(/["'`](ja[a-z0-9#_]*)["'`]/g)].map((m) => m[1]),
  );
}

describe("resource names", () => {
  it("every handwritten ja resource follows the scheme", () => {
    const names = [
      ...Object.values(ITEMS),
      ...Object.values(NEW_CREATURES),
      ...Object.values(NEW_SPELLS),
      ...Object.values(CommonProjectileFiles),
      ...monsterAssetNames(),
      ...assetNames(path.join(REPO_ROOT, "mod/lib/pnp-spell/symbol_pain")),
    ].filter((n) => typeof n === "string" && /^ja/i.test(n) && !ALLOW.has(n));
    expect(names.length).toBeGreaterThan(20);
    expect(names.filter((n) => !SCHEME.test(n))).toEqual([]);
  });

  it("every inline ja string literal in lib code follows the scheme", () => {
    const names = inlineLiterals().filter((n) => !ALLOW.has(n));
    expect(names.length).toBeGreaterThan(20);
    expect(names.filter((n) => !SCHEME.test(n))).toEqual([]);
  });
});
