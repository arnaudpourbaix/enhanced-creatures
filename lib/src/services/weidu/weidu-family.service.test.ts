import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, describe, expect, it } from "vitest";
import { MonsterFamilyEnum } from "../../../creatures/monster";
import { GLOBAL_CONFIG } from "../../../config/generate";
import { Creature } from "../../model/creature/creature";
import { Family } from "../../model/creature/family";
import { Spell } from "../../model/spell-item/spell-item";
import { State } from "../../state";
import weiduFamilyService from "./weidu-family.service";

function fakeFamily(p: {
  spellHasSecondaryType?: boolean;
  creatureSpellHasSecondaryType?: boolean;
}): Family {
  return {
    id: MonsterFamilyEnum.Ankheg,
    items: [],
    projectiles: [],
    spells: p.spellHasSecondaryType ? [{ secondaryType: "Fear" } as unknown as Spell] : [],
    creatures: p.creatureSpellHasSecondaryType
      ? [{ spells: [{ secondaryType: "Fear" } as unknown as Spell] } as unknown as Creature]
      : [],
  };
}

describe("generateFinalCode", () => {
  let tempDir: string;
  let originalModFolder: string;

  afterEach(() => {
    State.modFolder = originalModFolder;
    fs.rmSync(tempDir, { recursive: true, force: true });
    GLOBAL_CONFIG.enableSecondaryTypes = false;
  });

  function setupTempFamilyFolder(): string {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-family-"));
    originalModFolder = State.modFolder;
    State.modFolder = tempDir;
    const familyFolder = path.join(tempDir, "lib/pnp-monster/ankheg");
    fs.mkdirSync(familyFolder, { recursive: true });
    return path.join(familyFolder, "main.tpa");
  }

  it("does not emit integrate_sectypes when enableIntegrateSectypes is disabled (default), even if a secondary type is present", () => {
    const file = setupTempFamilyFolder();
    weiduFamilyService.generateFinalCode(fakeFamily({ spellHasSecondaryType: true }));
    const content = fs.readFileSync(file, "utf-8");
    expect(content).not.toContain("integrate_sectypes");
  });

  it("emits integrate_sectypes when enableIntegrateSectypes is enabled and a family spell has a secondary type", () => {
    GLOBAL_CONFIG.enableSecondaryTypes = true;
    const file = setupTempFamilyFolder();
    weiduFamilyService.generateFinalCode(fakeFamily({ spellHasSecondaryType: true }));
    const content = fs.readFileSync(file, "utf-8");
    expect(content).toContain("LAF integrate_sectypes END");
  });

  it("emits integrate_sectypes when enableIntegrateSectypes is enabled and a creature spell has a secondary type", () => {
    GLOBAL_CONFIG.enableSecondaryTypes = true;
    const file = setupTempFamilyFolder();
    weiduFamilyService.generateFinalCode(fakeFamily({ creatureSpellHasSecondaryType: true }));
    const content = fs.readFileSync(file, "utf-8");
    expect(content).toContain("LAF integrate_sectypes END");
  });

  it("does not emit integrate_sectypes when enabled but no spell has a secondary type", () => {
    GLOBAL_CONFIG.enableSecondaryTypes = true;
    const file = setupTempFamilyFolder();
    weiduFamilyService.generateFinalCode(fakeFamily({}));
    const content = fs.readFileSync(file, "utf-8");
    expect(content).not.toContain("integrate_sectypes");
  });
});
