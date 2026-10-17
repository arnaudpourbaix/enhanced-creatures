import * as fs from "fs";
import * as path from "path";
import { beforeAll, describe, expect, it } from "vitest";
import { createAnkhegEntry } from "../../../creatures/ankheg";
import { Creature } from "../../model/creature/creature";
import stateService from "../state.service";
import bafGeneratorService from "./baf-generator.service";

// Golden test: builds the actual Ankheg creature (the smallest family — one
// creature, one summon variant) through the real model/factory layer and
// compares the rendered BAF text against the already-committed .baf files in
// the mod. This is a regression guard for the statement-builder/renderer
// pipeline as a whole, not just the isolated renderer functions covered in
// baf-generator.service.test.ts. Uses buildContent() (not generate()) so
// nothing is written to disk.
function readModFile(relativePath: string): string {
  return fs.readFileSync(path.resolve(process.cwd(), "mod", relativePath), "utf-8");
}

let ankheg: Creature;

beforeAll(async () => {
  await stateService.init();
  ankheg = createAnkhegEntry().creatures[0];
});

describe("Ankheg creature generation", () => {
  it("matches the committed jabm0100.baf script", () => {
    const content = bafGeneratorService.buildContent(ankheg, {
      summon: false,
    });
    expect(content).toBe(readModFile("lib/pnp-monster/ankheg/jabm0100.baf"));
  });

  it("matches the committed jabm0101.baf summon script", () => {
    const content = bafGeneratorService.buildContent(ankheg, {
      summon: true,
    });
    expect(content).toBe(readModFile("lib/pnp-monster/ankheg/jabm0101.baf"));
  });
});
