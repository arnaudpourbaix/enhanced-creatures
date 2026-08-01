import { ABILITY_PRESETS } from "../../config/ability-presets";
import { getAllSpells } from "../../config/spells/spell-names";
import { familyFactories } from "../../creatures";
import { MonsterFamilyEnum } from "../../creatures/monster";
import { Creature } from "../model/creature/creature";
import bafGeneratorService from "./baf/baf-generator.service";
import descriptionService from "./doc/description.service";
import documentationService from "./doc/documentation.service";
import logService from "./log.service";
import translationService from "./translation.service";
import utils from "./utils/utils.service";
import weiduCoreService from "./weidu/weidu-core.service";
import weiduCreatureService from "./weidu/weidu-creature.service";
import weiduFamilyService from "./weidu/weidu-family.service";
import weiduFunctionService from "./weidu/weidu-function.service";

class MainService {
  generateCreatures() {
    const families: MonsterFamilyEnum[] = [];
    for (const factory of familyFactories) {
      const family = factory();
      descriptionService.generateCreatureSpells(family.spells);
      descriptionService.generateCreatureItems(family.items);
      if (families.includes(family.id)) {
        throw new Error(`Family '${MonsterFamilyEnum[family.id]}' already declared`);
      }
      families.push(family.id);
      weiduFamilyService.createOrUpdateMainFile(family.id);
      weiduFamilyService.generateFamilyData(family);
      for (const creature of family.creatures) {
        this.generateCreature(creature);
      }
      weiduFamilyService.generateFinalCode(family);
      documentationService.addFamily(family);
    }
    documentationService.generate();
  }

  generateCreature(creature: Creature) {
    if (!this.isCreatureValid(creature)) return;
    bafGeneratorService.generate(creature);
    weiduCreatureService.generateWeiduScript(creature);
  }

  isCreatureValid(creature: Creature) {
    if (creature.valid === undefined) {
      logService.warn(
        `${translationService.from(creature.name)} has not been validated, you must call validate`,
      );
    } else if (!creature.valid) {
      logService.warn(`${translationService.from(creature.name)} is not valid, please fix it !`);
    }
    return !!creature.valid;
  }

  generateTranslations() {
    translationService.generateWeiduFiles();
  }

  generateCommonCode() {
    weiduCoreService.generateSpellStates();
    weiduCoreService.generateProjectiles();
    weiduFunctionService.generateSpellResources();
    weiduFunctionService.generateSpellFunctions();
    weiduFunctionService.generateImmunities();
    weiduCoreService.writeFile();
  }

  checkPresets() {
    for (const preset of ABILITY_PRESETS) {
      if (!preset.ability.spell || preset.ability.spell.resource || preset.ability.spell.id) {
        continue;
      }
      const spell = Object.values(getAllSpells()).find((s) => s.file === preset.preset);
      logService.log(`Checking ${preset.preset}, spell found: ${JSON.stringify(spell)}`);
      if (!spell || !("id" in spell)) {
        preset.ability.spell.resource = preset.preset;
      } else {
        preset.ability.spell.id = spell.id;
      }
    }
  }

  checkSpells() {
    const files: string[] = [];
    const identifiers: string[] = [];
    const allSpells = getAllSpells();
    for (const key of utils.objectKeys(allSpells)) {
      const spell = allSpells[key];
      if (files.includes(spell.file)) {
        throw new Error(`Spell file ${spell.file} is declared multiple times.`);
      }
      files.push(spell.file);
      if (!("id" in spell)) continue;
      if (identifiers.includes(spell.id)) {
        throw new Error(`Spell identifier ${spell.id} is declared multiple times.`);
      }
      identifiers.push(spell.id);
    }
  }
}

const mainService = new MainService();
export default mainService;
