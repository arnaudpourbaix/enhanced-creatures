import * as fs from "fs";
import * as path from "path";
import { describe, expect, it } from "vitest";
import { ITEMS } from "../../config/item";
import { NEW_CREATURES } from "../../config/creatures";
import { NEW_SPELLS } from "../../config/spells/spells";
import { CommonProjectileFiles } from "../../spells/projectiles";

const SCHEME = /^ja[sipbcav][mfec][0-9a-z]{4}$/;
const ALLOW = new Set(["ja_wilderness"]); // not resource names

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
  const root = "mod/lib/pnp-monster";
  return fs
    .readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isDirectory() && fs.existsSync(path.join(root, e.name, "assets")))
    .flatMap((e) => assetNames(path.join(root, e.name, "assets")));
}

describe("resource names", () => {
  it("every handwritten ja resource follows the scheme", () => {
    const names = [
      ...Object.values(ITEMS),
      ...Object.values(NEW_CREATURES),
      ...Object.values(NEW_SPELLS),
      ...Object.values(CommonProjectileFiles),
      ...monsterAssetNames(),
      ...assetNames("mod/lib/pnp-spell/symbol_pain"),
    ].filter((n) => typeof n === "string" && /^ja/i.test(n) && !ALLOW.has(n));
    expect(names.filter((n) => !SCHEME.test(n))).toEqual([]);
  });
});
