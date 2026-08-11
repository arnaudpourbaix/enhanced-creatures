import * as fs from "fs";
import path from "path";
import { GLOBAL_CONFIG } from "../../../config/generate";
import { MonsterFamilyEnum } from "../../../creatures/monster";
import { CR, TAB } from "../../model/constants";
import { Creature } from "../../model/creature/creature";
import { Family } from "../../model/creature/family";
import { CodeLine } from "../../model/misc";
import { State } from "../../state";
import translationService from "../translation.service";
import utils from "../utils/utils.service";
import { AbstractWeiduService } from "./abstract-weidu.service";
import weiduItemService from "./weidu-item.service";
import weiduProjectileService from "./weidu-projectile.service";
import weiduSpellService from "./weidu-spell.service";

class WeiduFamilyService extends AbstractWeiduService {
  createOrUpdateMainFile(family: MonsterFamilyEnum, creature?: Creature) {
    const file = this.getMainFilename(family);
    if (!creature) {
      let content = `LAM load_secondary_types${CR}`;
      const commonFile = path.join(State.modFolder, `${utils.getFamilyFolder(family)}/common.tpa`);
      if (fs.existsSync(commonFile)) {
        content += `INCLUDE "%MOD_FOLDER%/${utils.getFamilyFolder(family)}/common.tpa"${CR}`;
      }
      if (fs.existsSync(file)) fs.rmSync(file);
      utils.writeFile(file, content);
    } else {
      fs.appendFileSync(
        file,
        `INCLUDE "%MOD_FOLDER%/${utils.getFamilyFolder(family)}/${creature.id.toString(
          16,
        )}.tpa" // ${translationService.from(creature.name)}${CR}`,
      );
    }
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
