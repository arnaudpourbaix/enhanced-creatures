import deepmerge from "deepmerge";
import { DEFAULT_SPELL_PROBABILITY } from "../../config/common";
import { CreatureAbilitySpell, RawCreatureAbility } from "../model/creature/ability";
import { AbilityPreset } from "../model/misc";
import { SpellReference } from "../model/spell-item/spell-reference";
import triggerFactory from "./trigger.factory";

/**
 * The subset of CreatureAbilitySpell that a SpellReference can also declare (see
 * SpellReference.includeStateChecks and siblings) - copied onto every ability built from that
 * spell so a preset doesn't need to re-declare a check the spell itself already carries. Kept as
 * its own object (merged into `spell: {}` up front) rather than assigned field-by-field onto
 * `ability.spell`, since that field is typed as possibly-undefined on RawCreatureAbility even right
 * after being initialized to `{}` in the same object literal.
 */
function spellDefaults(spell: SpellReference): CreatureAbilitySpell {
  const defaults: CreatureAbilitySpell = {};
  if (spell.includeStateChecks !== undefined)
    defaults.includeStateChecks = spell.includeStateChecks;
  if (spell.excludeStateChecks !== undefined)
    defaults.excludeStateChecks = spell.excludeStateChecks;
  if (spell.excludeSpellStates !== undefined)
    defaults.excludeSpellStates = spell.excludeSpellStates;
  return defaults;
}

class PresetFactory {
  /**
   * Spells will be cast from the first of the list to the last, in that order.
   */
  createOrderedSpells(spells: SpellReference[], override?: RawCreatureAbility): AbilityPreset[] {
    const weakerSpells: SpellReference[] = [];
    override ??= {};
    return spells.map((spell) => {
      const ability: RawCreatureAbility = {
        name: spell.name,
        spell: spellDefaults(spell),
        triggers: weakerSpells.length ? triggerFactory.haveSpell(weakerSpells, true) : [],
        requireVocal: true,
        probability: DEFAULT_SPELL_PROBABILITY,
      };
      if (spell.keywords !== undefined) ability.keywords = spell.keywords;
      if (spell.level !== undefined) ability.level = spell.level;
      if (spell.range !== undefined) ability.range = spell.range;
      const preset: AbilityPreset = {
        preset: spell.file,
        ability: deepmerge(ability, override),
      };
      weakerSpells.push(spell);
      return preset;
    });
  }

  createSpell(
    spell: SpellReference,
    override: RawCreatureAbility,
    variants?: string[],
  ): AbilityPreset[] {
    override ??= {};
    variants ??= [];
    const ability: RawCreatureAbility = {
      name: spell.name,
      spell: spellDefaults(spell),
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
    const results = [preset];
    for (const variant of variants) {
      results.push({
        ...preset,
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
}

const presetFactory = new PresetFactory();
export default presetFactory;
