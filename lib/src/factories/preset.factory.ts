import deepmerge from "deepmerge";
import { DEFAULT_SPELL_PROBABILITY } from "../../config/common";
import { CreatureAbilitySpell, RawCreatureAbility } from "../model/creature/ability";
import { AbilityPreset } from "../model/misc";
import { SpellReference, spellFiles } from "../model/spell-item/spell-reference";
import triggerFactory from "./trigger.factory";

class PresetFactory {
  /**
   * Spells will be cast from the first of the list to the last, in that order.
   */
  createOrderedSpells(spells: SpellReference[], override?: RawCreatureAbility): AbilityPreset[] {
    const weakerSpells: SpellReference[] = [];
    override ??= {};
    return spells.flatMap((spell) => {
      const ability: RawCreatureAbility = {
        name: spell.name,
        spell: this.spellDefaults(spell),
        triggers: weakerSpells.length ? triggerFactory.haveSpell(weakerSpells, true) : [],
        requireVocal: true,
        probability: DEFAULT_SPELL_PROBABILITY,
      };
      if (spell.keywords !== undefined) ability.keywords = spell.keywords;
      if (spell.level !== undefined) ability.level = spell.level;
      if (spell.range !== undefined) ability.range = spell.range;
      const presets = this.presetsForFiles(spell, deepmerge(ability, override));
      weakerSpells.push(spell);
      return presets;
    });
  }

  /**
   * `resourceVariants` are other spell files (outside the database) cast through the same preset,
   * unlike `spell.variants` (mod-dependent relocations of the spell itself), which each get their
   * own preset.
   */
  createSpell(
    spell: SpellReference,
    override: RawCreatureAbility = {},
    resourceVariants: string[] = [],
  ): AbilityPreset[] {
    const ability: RawCreatureAbility = {
      name: spell.name,
      spell: this.spellDefaults(spell),
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    };
    if (spell.keywords !== undefined) ability.keywords = spell.keywords;
    if (spell.level !== undefined) ability.level = spell.level;
    if (spell.range !== undefined) ability.range = spell.range;
    const mergedAbility = deepmerge(ability, override);
    const preset: AbilityPreset = {
      preset: spell.file,
      ability: mergedAbility,
    };
    const results = this.presetsForFiles(spell, mergedAbility);
    for (const variant of resourceVariants) {
      results.push({
        ...preset,
        preset: variant,
        ability: {
          ...ability,
          spell: {
            resource: variant,
          },
        },
      });
    }
    return results;
  }

  createSpells(spells: SpellReference[], override: RawCreatureAbility): AbilityPreset[] {
    return spells.flatMap((s) => this.createSpell(s, override));
  }

  /**
   * The subset of CreatureAbilitySpell that a SpellReference can also declare (see
   * SpellReference.includeStateChecks and siblings) - copied onto every ability built from that
   * spell so a preset doesn't need to re-declare a check the spell itself already carries.
   */
  private spellDefaults(spell: SpellReference): CreatureAbilitySpell {
    const defaults: CreatureAbilitySpell = {};
    if (spell.includeStateChecks !== undefined)
      defaults.includeStateChecks = spell.includeStateChecks;
    if (spell.excludeStateChecks !== undefined)
      defaults.excludeStateChecks = spell.excludeStateChecks;
    if (spell.excludeSpellStates !== undefined)
      defaults.excludeSpellStates = spell.excludeSpellStates;
    if (spell.excludeStatsChecks !== undefined)
      defaults.excludeStatsChecks = spell.excludeStatsChecks;
    return defaults;
  }

  /**
   * One preset per file the spell can resolve to (its base `file` plus each mod `variants` entry),
   * all sharing the same ability - so the auto-generated ability preset lookup matches whichever
   * file the installed mods put the spell at.
   */
  private presetsForFiles(spell: SpellReference, ability: RawCreatureAbility): AbilityPreset[] {
    return spellFiles(spell).map((file) => ({ preset: file, ability: structuredClone(ability) }));
  }
}

const presetFactory = new PresetFactory();
export default presetFactory;
