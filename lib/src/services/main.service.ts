import { ABILITY_PRESETS } from "../../config/ability-presets";
import { availabilityOverlaps, isAvailableInMod, MOD_LAYER_ORDER } from "../../config/mods";
import { Spellbooks } from "../../config/spellbooks/spellbook";
import { SpellBookName } from "../../config/spellbooks/spellbook-name";
import { getAllFnpSpells } from "../../config/spells/fnp-spell-database";
import { SPELLS } from "../../config/spells/spell-database";
import { SpellIdentifier } from "../model/ids/spell";
import { getAllSpells, spellFiles, type SpellReference } from "../model/spell-item/spell-reference";
import { entryFactories } from "../../creatures/entries";
import { KinEnum } from "../../creatures/kin";
import { kinFactories } from "../../creatures/kins";
import { Creature } from "../model/creature/creature";
import { GeneratedGroup } from "../model/creature/creature-group";
import { CreatureEntry } from "../model/creature/entry";
import { CreatureKin } from "../model/creature/kin";
import { SpellBookModVariant, spellBookVariants } from "../model/spell-item/spellbook";
import bafGeneratorService from "./baf/baf-generator.service";
import descriptionService from "./doc/description.service";
import documentationService from "./doc/documentation.service";
import homeService from "./doc/home.service";
import logService from "./log.service";
import resourceClashService from "./resource-clash.service";
import stateService from "./state.service";
import { State } from "../state";
import { ITEMS } from "../../config/item";
import { NEW_SPELLS } from "../../config/spells/spells";
import translationService from "./translation.service";
import weiduCoreService from "./weidu/weidu-core.service";
import weiduCreatureService from "./weidu/weidu-creature.service";
import weiduGroupService from "./weidu/weidu-group.service";
import weiduFunctionService from "./weidu/weidu-function.service";
import weiduIndexService from "./weidu/weidu-index.service";

class MainService {
  generateCreatures() {
    logService.section("Generating creatures");
    this.generateKinsAndEntries(kinFactories, entryFactories);
    documentationService.generate();
    homeService.generate();
  }

  // Deferred per kin or entry so each creature's generation output (errors included) joins its
  // own "Creating ..." section, instead of trailing under the group's last created creature.
  private deferred(generate: () => void) {
    logService.beginDeferred();
    try {
      generate();
    } finally {
      logService.flushSections();
    }
  }

  /**
   * Builds and generates every kin, then every entry (each given the built kins), in registry
   * order, then the pnp-monster index that installs them in that order. Two groups claiming the
   * same folder is an error (the second would clean the first's generated files away).
   */
  generateKinsAndEntries(
    kins: readonly (() => CreatureKin)[] = kinFactories,
    entries: readonly ((
      kins: Map<KinEnum, CreatureKin>,
    ) => CreatureEntry<Creature>)[] = entryFactories,
  ) {
    const generated = new Set<string>();
    const claim = (folder: string) => {
      if (generated.has(folder)) throw new Error(`Folder '${folder}' already generated`);
      generated.add(folder);
    };
    const builtKins = new Map<KinEnum, CreatureKin>();
    for (const factory of kins) {
      this.deferred(() => {
        const kin = factory();
        claim(kin.folder);
        builtKins.set(kin.id, kin);
        const { id, items, spells, projectiles } = kin;
        this.generateGroup({ id, items, spells, projectiles, creatures: [] }, kin.folder);
      });
    }
    const builtEntries: CreatureEntry<Creature>[] = [];
    for (const factory of entries) {
      this.deferred(() => {
        const entry = factory(builtKins);
        claim(entry.folder);
        builtEntries.push(entry);
        this.generateGroup(entry, entry.folder);
      });
    }
    weiduIndexService.generate(
      [...builtKins.keys()],
      builtEntries.map((e) => ({ id: e.id, kin: e.kin?.id, dependsOn: e.dependsOn })),
    );
  }

  // One entry or kin: its own resources and main.tpa, then each creature's files.
  private generateGroup(group: GeneratedGroup, folder: string) {
    descriptionService.generateCreatureSpells(group.spells);
    descriptionService.generateCreatureItems(group.items);
    weiduGroupService.createOrUpdateMainFile(folder);
    weiduGroupService.generateGroupData(group, folder);
    for (const creature of group.creatures) {
      logService.withSection(
        creature,
        `Generating ${translationService.from(creature.name)}...`,
        () => {
          this.generateCreature(creature);
        },
      );
    }
    weiduGroupService.generateFinalCode(group, folder);
    documentationService.addGroup(group);
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
    weiduCoreService.generateImmunityStates();
    weiduCoreService.writeFile();
  }

  checkPresets() {
    logService.section("Checking presets");
    const spells = getAllSpells(SPELLS);
    const fnpSpells = getAllFnpSpells();
    for (const preset of ABILITY_PRESETS) {
      if (!preset.ability.spell || preset.ability.spell.resource || preset.ability.spell.id) {
        continue;
      }
      // PresetFactory emits one preset per file a spell can resolve to (base `file` plus each mod
      // `variants[].file`), so match against all of them.
      const spell =
        spells.find((s) => spellFiles(s).includes(preset.preset)) ??
        fnpSpells.find((s) => s.file === preset.preset);
      if (!spell) {
        logService.warn(`Checking ${preset.preset}, spell not found!`);
      } else {
        logService.log(`Checking ${preset.preset}, spell found: ${JSON.stringify(spell)}`);
      }
      const id = spell && "id" in spell ? this.presetSpellId(spell, preset.preset) : undefined;
      if (id === undefined) {
        preset.ability.spell.resource = preset.preset;
      } else {
        preset.ability.spell.id = id;
      }
    }
  }

  /** The id `file` resolves to - a variant file takes its variant's id, not the base spell's. */
  private presetSpellId(spell: SpellReference, file: string): SpellIdentifier | undefined {
    const variant = spell.variants?.find((v) => v.file === file);
    return variant ? variant.id : spell.id;
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

  /** Every SPL/ITM shipped (generated + handwritten common ones) must have a unique base name. */
  checkResourceClashes() {
    resourceClashService.check(
      [...State.spells.map((s) => s.file), ...Object.values(NEW_SPELLS)],
      [...State.items.map((i) => i.file), ...Object.values(ITEMS)],
    );
  }

  async generateAll(): Promise<void> {
    logService.init();
    await stateService.init();
    this.checkPresets();
    this.checkSpells();
    this.checkSpellbooks();
    this.generateCreatures();
    this.generateCommonCode();
    this.checkResourceClashes();
    this.generateTranslations();
    logService.summary();
    if (logService.hasErrors()) {
      throw new Error("Generator finished with errors, see generator.log");
    }
  }
}

const mainService = new MainService();
export default mainService;
