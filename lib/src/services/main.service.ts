import { ABILITY_PRESETS } from "../../config/ability-presets";
import { availabilityOverlaps, isAvailableInMod, MOD_LAYER_ORDER } from "../../config/mods";
import { Spellbooks } from "../../config/spellbooks/spellbook";
import { SpellBookName } from "../../config/spellbooks/spellbook-name";
import { getAllFnpSpells } from "../../config/spells/fnp-spell-database";
import { SPELLS } from "../../config/spells/spell-database";
import { getAllSpells, type SpellReference } from "../model/spell-item/spell-reference";
import { familyFactories } from "../../creatures";
import { MonsterFamilyEnum } from "../../creatures/monster";
import { Creature } from "../model/creature/creature";
import { SpellBookModVariant, spellBookVariants } from "../model/spell-item/spellbook";
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
    // Invalidity itself is warned about at validate() time (see creatureFactory.validate()),
    // right next to the diagnostic output that explains why - not here, a generation pass later
    // where it would land under an unrelated creature's log section.
    if (creature.valid === undefined) {
      logService.warn(
        `${translationService.from(creature.name)} has not been validated, you must call validate`,
      );
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
    const spells = [...getAllSpells(SPELLS), ...getAllFnpSpells()];
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
    // Two entries may share a file only when their requiresMod/obsoletedBy availability ranges
    // are provably disjoint (e.g. Deafness obsoletedBy SpellRevisions, SoundBurst requiresMod
    // SpellRevisions) - they're never both present in the same install, so it's the same resource
    // slot across mod states, not a real duplicate.
    const byFile = new Map<string, SpellReference[]>();
    const identifiers: string[] = [];
    for (const spell of getAllSpells(SPELLS)) {
      const sameFile = byFile.get(spell.file) ?? [];
      for (const other of sameFile) {
        if (availabilityOverlaps(spell, other)) {
          throw new Error(`Spell file ${spell.file} is declared multiple times.`);
        }
      }
      sameFile.push(spell);
      byFile.set(spell.file, sameFile);
      if (spell.id === undefined) continue;
      if (identifiers.includes(spell.id)) {
        throw new Error(`Spell identifier ${spell.id} is declared multiple times.`);
      }
      identifiers.push(spell.id);
    }
  }

  /**
   * Catches a spellbook mod variant listing a spell that mod has already obsoleted (or hasn't
   * introduced yet) - e.g. a "SpellRevisions" variant that still lists Deafness, which Spell
   * Revisions repurposes into Sound Burst. FaithsAndPowers-scoped variants are skipped: it's an
   * orthogonal mod outside MOD_LAYER_ORDER's vanilla/spell_rev/stratagems chain, so
   * requiresMod/obsoletedBy don't apply to it.
   */
  checkSpellbooks() {
    logService.section("Checking spellbooks");
    for (const book of Spellbooks) {
      for (const variant of spellBookVariants(book)) {
        if (MOD_LAYER_ORDER.includes(variant.mod)) this.checkSpellbookVariant(book.name, variant);
      }
    }
  }

  private checkSpellbookVariant(name: SpellBookName, variant: SpellBookModVariant): void {
    for (const level of variant.values) {
      for (const spell of [...level.base, ...level.additionnals, ...level.repeat]) {
        if (!isAvailableInMod(spell, variant.mod)) {
          throw new Error(
            `Spellbook "${name}" (${variant.mod} variant, level ${level.level}) lists ` +
              `${spell.file}, which isn't available under ${variant.mod}.`,
          );
        }
      }
    }
  }

  async generateAll(): Promise<void> {
    logService.init();
    await stateService.init();
    this.checkPresets();
    this.checkSpells();
    this.checkSpellbooks();
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
