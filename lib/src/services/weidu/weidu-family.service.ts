import * as fs from "fs";
import path from "path";
import { GLOBAL_CONFIG } from "../../../config/generate";
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

/**
 * Writes the main.tpa of a family, entry or kin folder (`folder`: mod-relative, e.g.
 * `lib/pnp-monster/ankheg`, `lib/pnp-monster/clay-golem`, `lib/pnp-monster/kin/fey`).
 */
class WeiduFamilyService extends AbstractWeiduService {
  createOrUpdateMainFile(folder: string, creature?: Creature) {
    const file = this.getMainFilename(folder);
    if (!creature) {
      this.cleanFolder(folder);
      let content = `LAM load_secondary_types${CR}`;
      const commonFile = path.join(State.modFolder, `${folder}/common.tpa`);
      if (fs.existsSync(commonFile)) {
        content += `INCLUDE "%MOD_FOLDER%/${folder}/common.tpa"${CR}`;
      }
      content += this.compileAssetScripts(folder);
      if (fs.existsSync(file)) fs.rmSync(file);
      utils.writeFile(file, content);
    } else {
      fs.appendFileSync(
        file,
        `INCLUDE "%MOD_FOLDER%/${folder}/${toCode(creature.id)}.tpa" // ${translationService.from(creature.name)}${CR}`,
      );
    }
  }

  // Deletes what generation writes at the folder root (creature .tpa, main.tpa, creature .baf),
  // so renamed or removed creatures leave no stale file behind.
  // Hand-written common.tpa and the assets/ subfolder are kept; not recursive.
  cleanFolder(folder: string) {
    const fullPath = path.join(State.modFolder, folder);
    if (!fs.existsSync(fullPath)) return;
    let removed = 0;
    for (const entry of fs.readdirSync(fullPath, { withFileTypes: true })) {
      if (!entry.isFile()) continue;
      const name = entry.name.toLowerCase();
      const ext = path.extname(name);
      if (ext === ".baf" || (ext === ".tpa" && name !== "common.tpa")) {
        fs.rmSync(path.join(fullPath, entry.name));
        removed++;
      }
    }
    if (removed > 0) logService.info(`Cleaned ${removed} generated files in ${folder}`);
  }

  // Every .baf in the folder's assets subfolder overrides an existing game script:
  // compile it only when that script is present in the game.
  private compileAssetScripts(folder: string): string {
    const assetsFolder = `${folder}/assets`;
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

  generateFamilyData(group: Pick<Family, "projectiles" | "spells" | "items">, folder: string) {
    const lines: CodeLine[] = [];
    weiduProjectileService.createProjectiles(lines, group.projectiles);
    // weiduEffectService.createEffectFiles(lines, creature.effectFiles);
    weiduSpellService.createSpells(lines, group.spells);
    weiduItemService.createItems(lines, group.items);
    this.add(lines, "", 0);
    const content = lines.map((l) => `${TAB.repeat(l.tab)}${l.code}`).join(CR);
    fs.appendFileSync(this.getMainFilename(folder), content);
  }

  getMainFilename(folder: string) {
    return path.join(State.modFolder, `${folder}/main.tpa`);
  }

  /** `group.creatures` is empty for a kin. */
  generateFinalCode(group: Pick<Family, "spells" | "creatures">, folder: string) {
    const lines: CodeLine[] = [];
    if (
      GLOBAL_CONFIG.enableSecondaryTypes &&
      (group.spells.some((s) => typeof s.secondaryType === "string") ||
        group.creatures.some((c) => c.spells.some((s) => typeof s.secondaryType === "string")))
    ) {
      this.add(lines, "LAF integrate_sectypes END", 0);
    }
    this.add(lines, "", 0);
    const content = lines.map((l) => `${TAB.repeat(l.tab)}${l.code}`).join(CR);
    fs.appendFileSync(this.getMainFilename(folder), content);
  }
}

const weiduFamilyService = new WeiduFamilyService();
export default weiduFamilyService;
