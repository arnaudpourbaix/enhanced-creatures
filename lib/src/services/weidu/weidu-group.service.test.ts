import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EntryEnum } from "../../../creatures/entry";
import { KinEnum } from "../../../creatures/kin";
import { GLOBAL_CONFIG } from "../../../config/generate";
import { Creature } from "../../model/creature/creature";
import { GeneratedGroup } from "../../model/creature/creature-group";
import { Spell } from "../../model/spell-item/spell-item";
import { State } from "../../state";
import logService from "../log.service";
import utils from "../utils/utils.service";
import weiduGroupService from "./weidu-group.service";

const ANKHEG = utils.getEntryFolder(EntryEnum.Ankheg);

function fakeGroup(p: {
  spellHasSecondaryType?: boolean;
  creatureSpellHasSecondaryType?: boolean;
}): GeneratedGroup {
  return {
    id: EntryEnum.Ankheg,
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

  function setupTempFolder(): string {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-family-"));
    originalModFolder = State.modFolder;
    State.modFolder = tempDir;
    const familyFolder = path.join(tempDir, "lib/pnp-monster/ankheg");
    fs.mkdirSync(familyFolder, { recursive: true });
    return path.join(familyFolder, "main.tpa");
  }

  it("does not emit integrate_sectypes when enableIntegrateSectypes is disabled (default), even if a secondary type is present", () => {
    const file = setupTempFolder();
    weiduGroupService.generateFinalCode(fakeGroup({ spellHasSecondaryType: true }), ANKHEG);
    const content = fs.readFileSync(file, "utf-8");
    expect(content).not.toContain("integrate_sectypes");
  });

  it("emits integrate_sectypes when enableIntegrateSectypes is enabled and a group spell has a secondary type", () => {
    GLOBAL_CONFIG.enableSecondaryTypes = true;
    const file = setupTempFolder();
    weiduGroupService.generateFinalCode(fakeGroup({ spellHasSecondaryType: true }), ANKHEG);
    const content = fs.readFileSync(file, "utf-8");
    expect(content).toContain("LAF integrate_sectypes END");
  });

  it("emits integrate_sectypes when enableIntegrateSectypes is enabled and a creature spell has a secondary type", () => {
    GLOBAL_CONFIG.enableSecondaryTypes = true;
    const file = setupTempFolder();
    weiduGroupService.generateFinalCode(fakeGroup({ creatureSpellHasSecondaryType: true }), ANKHEG);
    const content = fs.readFileSync(file, "utf-8");
    expect(content).toContain("LAF integrate_sectypes END");
  });

  it("does not emit integrate_sectypes when enabled but no spell has a secondary type", () => {
    GLOBAL_CONFIG.enableSecondaryTypes = true;
    const file = setupTempFolder();
    weiduGroupService.generateFinalCode(fakeGroup({}), ANKHEG);
    const content = fs.readFileSync(file, "utf-8");
    expect(content).not.toContain("integrate_sectypes");
  });
});

describe("createOrUpdateMainFile", () => {
  let tempDir: string;
  let originalModFolder: string;

  afterEach(() => {
    State.modFolder = originalModFolder;
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  function setupTempFolder(): string {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "atweaks-family-"));
    originalModFolder = State.modFolder;
    State.modFolder = tempDir;
    const familyFolder = path.join(tempDir, "lib/pnp-monster/ankheg");
    fs.mkdirSync(familyFolder, { recursive: true });
    return familyFolder;
  }

  it("compiles every asset script, guarded by the script existing in game", () => {
    const familyFolder = setupTempFolder();
    const assets = path.join(familyFolder, "assets");
    fs.mkdirSync(assets);
    for (const f of ["L#XZEANK.BAF", "ankhegb.baf", "jaae2q00.bam"])
      fs.writeFileSync(path.join(assets, f), "");
    weiduGroupService.createOrUpdateMainFile(ANKHEG);
    const content = fs.readFileSync(path.join(familyFolder, "main.tpa"), "utf-8");
    expect(content).toBe(
      [
        "LAM load_secondary_types",
        "ACTION_IF FILE_EXISTS_IN_GAME ~ANKHEGB.BCS~ BEGIN",
        "\tCOMPILE ~%MOD_FOLDER%/lib/pnp-monster/ankheg/assets/ankhegb.baf~",
        "END",
        "ACTION_IF FILE_EXISTS_IN_GAME ~L#XZEANK.BCS~ BEGIN",
        "\tCOMPILE ~%MOD_FOLDER%/lib/pnp-monster/ankheg/assets/L#XZEANK.BAF~",
        "END",
        "",
      ].join("\r\n"),
    );
  });

  it("emits no compile code without an assets folder", () => {
    const familyFolder = setupTempFolder();
    weiduGroupService.createOrUpdateMainFile(ANKHEG);
    const content = fs.readFileSync(path.join(familyFolder, "main.tpa"), "utf-8");
    expect(content).toBe("LAM load_secondary_types\r\n");
  });

  it("removes generated tpa/baf files, keeping common.tpa and assets, and never touches common/", () => {
    const familyFolder = setupTempFolder();
    fs.mkdirSync(path.join(familyFolder, "assets"));
    for (const f of [
      "29.tpa",
      "main.tpa",
      "jam29.baf",
      "common.tpa",
      "assets/x.baf",
      "assets/jaae1700.bam",
    ])
      fs.writeFileSync(path.join(familyFolder, f), "x");
    const commonFolder = path.join(tempDir, "lib/pnp-monster/common");
    fs.mkdirSync(commonFolder);
    fs.writeFileSync(path.join(commonFolder, "core.tpa"), "x");

    const info = vi.spyOn(logService, "info").mockImplementation(() => {});
    weiduGroupService.cleanFolder(ANKHEG);

    expect(info).toHaveBeenCalledTimes(1);
    expect(info).toHaveBeenCalledWith("Cleaned 3 generated files in lib/pnp-monster/ankheg");
    info.mockRestore();
    expect(fs.readdirSync(familyFolder).sort()).toEqual(["assets", "common.tpa"]);
    expect(fs.readdirSync(path.join(familyFolder, "assets")).sort()).toEqual([
      "jaae1700.bam",
      "x.baf",
    ]);
    expect(fs.readdirSync(commonFolder)).toEqual(["core.tpa"]);
  });

  it("cleans the folder when its group starts", () => {
    const familyFolder = setupTempFolder();
    fs.writeFileSync(path.join(familyFolder, "29.tpa"), "x");
    weiduGroupService.createOrUpdateMainFile(ANKHEG);
    expect(fs.readdirSync(familyFolder)).toEqual(["main.tpa"]);
  });

  it("works the same on an entry or kin folder: cleans it and includes its common.tpa", () => {
    setupTempFolder();
    for (const folder of [
      utils.getEntryFolder(EntryEnum.ClayGolem),
      utils.getKinFolder(KinEnum.Fey),
    ]) {
      const full = path.join(tempDir, folder);
      fs.mkdirSync(full, { recursive: true });
      fs.writeFileSync(path.join(full, "common.tpa"), "x");
      fs.writeFileSync(path.join(full, "jabm1801.baf"), "x");
      weiduGroupService.createOrUpdateMainFile(folder);
      expect(fs.readdirSync(full).sort()).toEqual(["common.tpa", "main.tpa"]);
      expect(fs.readFileSync(path.join(full, "main.tpa"), "utf-8")).toBe(
        `LAM load_secondary_types\r\nINCLUDE "%MOD_FOLDER%/${folder}/common.tpa"\r\n`,
      );
    }
  });
});
