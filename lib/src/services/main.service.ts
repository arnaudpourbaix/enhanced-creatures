import { ABILITY_PRESETS } from "../../config/ability-presets";
import { getAllFnpSpells } from "../../config/spells/fnp-spell-names";
import { getAllSpells } from "../../config/spells/spell-names";
import { familyFactories } from "../../creatures";
import { MonsterFamilyEnum } from "../../creatures/monster";
import { Creature } from "../model/creature/creature";
import bafGeneratorService from "./baf/baf-generator.service";
import descriptionService from "./doc/description.service";
import documentationService from "./doc/documentation.service";
import logService from "./log.service";
import stateService from "./state.service";
import translationService from "./translation.service";
import weiduCoreService from "./weidu/weidu-core.service";
import weiduCreatureService from "./weidu/weidu-creature.service";
import weiduFamilyService from "./weidu/weidu-family.service";
import weiduFunctionService from "./weidu/weidu-function.service";

class MainService {
  generateCreatures() {
    logService.section("Generating creatures");
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
    try {
      bafGeneratorService.generate(creature);
      weiduCreatureService.generateWeiduScript(creature);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      logService.error(
        `${translationService.from(creature.name)}: failed to generate - ${message}`,
      );
      if (e instanceof Error && e.stack) logService.log(e.stack);
      creature.valid = false;
    }
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
    logService.section("Generating translations");
    translationService.generateWeiduFiles();
  }

  generateCommonCode() {
    logService.section("Generating common code");
    weiduCoreService.generateSpellStates();
    weiduCoreService.generateProjectiles();
    weiduFunctionService.generateSpellResources();
    weiduFunctionService.generateSpellFunctions();
    weiduFunctionService.generateImmunities();
    weiduCoreService.writeFile();
  }

  checkPresets() {
    logService.section("Checking presets");
    const spells = [...getAllSpells(), ...getAllFnpSpells()];
    for (const preset of ABILITY_PRESETS) {
      if (!preset.ability.spell || preset.ability.spell.resource || preset.ability.spell.id) {
        continue;
      }
      const spell = spells.find((s) => s.file === preset.preset);
      if (!spell) {
        logService.warn(`Checking ${preset.preset}, spell not found!`);
      } else {
        logService.log(`Checking ${preset.preset}, spell found: ${JSON.stringify(spell)}`);
      }
      if (!spell || !("id" in spell)) {
        preset.ability.spell.resource = preset.preset;
      } else {
        preset.ability.spell.id = spell.id;
      }
    }
  }

  checkSpells() {
    logService.section("Checking spells");
    const files: string[] = [];
    const identifiers: string[] = [];
    for (const spell of getAllSpells()) {
      if (files.includes(spell.file)) {
        throw new Error(`Spell file ${spell.file} is declared multiple times.`);
      }
      files.push(spell.file);
      if (spell.id === undefined) continue;
      if (identifiers.includes(spell.id)) {
        throw new Error(`Spell identifier ${spell.id} is declared multiple times.`);
      }
      identifiers.push(spell.id);
    }
  }

  async generateAll(): Promise<void> {
    logService.init();
    await stateService.init();
    this.checkPresets();
    this.checkSpells();
    this.generateCreatures();
    this.generateCommonCode();
    this.generateTranslations();
    logService.summary();
    if (logService.hasErrors()) {
      throw new Error("Generator finished with errors, see generator.log");
    }
  }
}

const mainService = new MainService();
export default mainService;
