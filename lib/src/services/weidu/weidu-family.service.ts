import * as fs from "fs";
import path from "path";
import { GLOBAL_CONFIG } from "../../../config/generate";
import { MonsterFamilyEnum } from "../../../creatures/monster";
import { CR, TAB } from "../../model/constants";
import { Creature } from "../../model/creature/creature";
import { Family } from "../../model/creature/family";
import { CodeLine } from "../../model/misc";
import { State } from "../../state";
import logService from "../log.service";
import translationService from "../translation.service";
import { toCode } from "../utils/misc.func";
import utils from "../utils/utils.service";
import { AbstractWeiduService } from "./abstract-weidu.service";
import weiduItemService from "./weidu-item.service";
import weiduProjectileService from "./weidu-projectile.service";
import weiduSpellService from "./weidu-spell.service";

class WeiduFamilyService extends AbstractWeiduService {
  createOrUpdateMainFile(family: MonsterFamilyEnum, creature?: Creature) {
    const file = this.getMainFilename(family);
    if (!creature) {
      this.cleanFamilyFolder(family);
      let content = `LAM load_secondary_types${CR}`;
      const commonFile = path.join(State.modFolder, `${utils.getFamilyFolder(family)}/common.tpa`);
      if (fs.existsSync(commonFile)) {
        content += `INCLUDE "%MOD_FOLDER%/${utils.getFamilyFolder(family)}/common.tpa"${CR}`;
      }
      content += this.compileAssetScripts(family);
      if (fs.existsSync(file)) fs.rmSync(file);
      utils.writeFile(file, content);
    } else {
      fs.appendFileSync(
        file,
        `INCLUDE "%MOD_FOLDER%/${utils.getFamilyFolder(family)}/${toCode(creature.id)}.tpa" // ${translationService.from(creature.name)}${CR}`,
      );
    }
  }

  // Deletes what generation writes at the family folder root (creature .tpa, main.tpa,
  // creature .baf), so renamed or removed creatures leave no stale file behind.
  // Hand-written common.tpa and the assets/ subfolder are kept; not recursive.
  cleanFamilyFolder(family: MonsterFamilyEnum) {
    const folder = path.join(State.modFolder, utils.getFamilyFolder(family));
    if (!fs.existsSync(folder)) return;
    for (const entry of fs.readdirSync(folder, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const name = entry.name.toLowerCase();
      const ext = path.extname(name);
      if (ext === ".baf" || (ext === ".tpa" && name !== "common.tpa")) {
        fs.rmSync(path.join(folder, entry.name));
        logService.info(
          `Removed stale generated file ${utils.getFamilyFolder(family)}/${entry.name}`,
        );
      }
    }
  }

  // Every .baf in the family's assets folder overrides an existing game script:
  // compile it only when that script is present in the game.
  private compileAssetScripts(family: MonsterFamilyEnum): string {
    const assetsFolder = `${utils.getFamilyFolder(family)}/assets`;
    const assetsPath = path.join(State.modFolder, assetsFolder);
    if (!fs.existsSync(assetsPath)) return "";
    return fs
      .readdirSync(assetsPath)
      .filter((f) => path.extname(f).toLowerCase() === ".baf")
      .sort((a, b) => a.localeCompare(b))
      .map((f) => {
        const script = path.basename(f, path.extname(f)).toUpperCase();
        return [
          `ACTION_IF FILE_EXISTS_IN_GAME ~${script}.BCS~ BEGIN`,
          `${TAB}COMPILE ~%MOD_FOLDER%/${assetsFolder}/${f}~`,
          `END`,
        ].join(CR);
      })
      .map((code) => `${code}${CR}`)
      .join("");
  }

  generateFamilyData(family: Family) {
    const lines: CodeLine[] = [];
    weiduProjectileService.createProjectiles(lines, family.projectiles);
    // weiduEffectService.createEffectFiles(lines, creature.effectFiles);
    weiduSpellService.createSpells(lines, family.spells);
    weiduItemService.createItems(lines, family.items);
    this.add(lines, "", 0);
    const content = lines.map((l) => `${TAB.repeat(l.tab)}${l.code}`).join(CR);
    const file = this.getMainFilename(family.id);
    fs.appendFileSync(file, content);
  }

  getMainFilename(family: MonsterFamilyEnum) {
    return path.join(State.modFolder, `${utils.getFamilyFolder(family)}/main.tpa`);
  }

  generateFinalCode(family: Family) {
    const lines: CodeLine[] = [];
    if (
      GLOBAL_CONFIG.enableSecondaryTypes &&
      (family.spells.some((s) => typeof s.secondaryType === "string") ||
        family.creatures.some((c) => c.spells.some((s) => typeof s.secondaryType === "string")))
    ) {
      this.add(lines, "LAF integrate_sectypes END", 0);
    }
    this.add(lines, "", 0);
    const content = lines.map((l) => `${TAB.repeat(l.tab)}${l.code}`).join(CR);
    const file = this.getMainFilename(family.id);
    fs.appendFileSync(file, content);
  }
}

const weiduFamilyService = new WeiduFamilyService();
export default weiduFamilyService;
