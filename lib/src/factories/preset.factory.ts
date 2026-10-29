import deepmerge from "deepmerge";
import { DEFAULT_SPELL_PROBABILITY } from "../../config/common";
import { MOD_LAYER_ORDER } from "../../config/mods";
import { SpellKeyword } from "../../config/spells/keyword";
import { ScriptTarget } from "../model/constants";
import { CreatureAbilitySpell, RawCreatureAbility } from "../model/creature/ability";
import { AbilityPreset } from "../model/misc";
import { Triggers } from "../model/script/triggers";
import { ContingencyTrigger, SpellCombo } from "../model/spell-item/spell-combo";
import { mergeSaves, SpellReference, spellFiles } from "../model/spell-item/spell-reference";
import spellComboService, { isContingency, KIND_NAMES } from "../services/spell-combo.service";
import triggerFactory from "./trigger.factory";

/** When the script fires an enemy contingency (see CONTINGENCY_CONDITIONS for self ones). */
const CONTINGENCY_TRIGGERS: Record<ContingencyTrigger, Triggers.Trigger> = {
  // CRUSHING stands for any damage type
  hit: { name: "HitBy", params: ["[ANYONE]", "CRUSHING"] },
  seeEnemy: triggerFactory.see("NearestEnemyOf(Myself)"),
  hp50: { name: "HPPercentLT", params: [ScriptTarget.myself, 50] },
  hp25: { name: "HPPercentLT", params: [ScriptTarget.myself, 25] },
  hp10: { name: "HPPercentLT", params: [ScriptTarget.myself, 10] },
  helpless: { name: "StateCheck", params: [ScriptTarget.myself, "STATE_HELPLESS"] },
  poisoned: { name: "StateCheck", params: [ScriptTarget.myself, "STATE_POISONED"] },
};

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
      if (spell.saves !== undefined) ability.saves = spell.saves;
      if (spell.range !== undefined) ability.range = spell.range;
      if (spell.alliesCheck !== undefined) ability.alliesCheck = spell.alliesCheck;
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
    if (spell.saves !== undefined) ability.saves = spell.saves;
    if (spell.range !== undefined) ability.range = spell.range;
    if (spell.alliesCheck !== undefined) ability.alliesCheck = spell.alliesCheck;
    const mergedAbility = deepmerge(ability, override);
    const results = this.presetsForFiles(spell, mergedAbility);
    for (const variant of resourceVariants) {
      const variantAbility = structuredClone(mergedAbility);
      variantAbility.spell = { ...variantAbility.spell, resource: variant };
      results.push({ preset: variant, ability: variantAbility });
    }
    return results;
  }

  createSpells(spells: SpellReference[], override: RawCreatureAbility): AbilityPreset[] {
    return spells.flatMap((s) => this.createSpell(s, override));
  }

  /**
   * One preset per SPL a caster memorizes for these combos (see SpellComboService.comboFile), for
   * every mod. A self combo is cast at the caster; an enemy one at its first spell's targets, with
   * every spell's checks. Self contingencies have none: they are precast, the engine fires them.
   * `presets` are the contained spells' ones (by file).
   */
  createCombos(combos: SpellCombo[], presets: AbilityPreset[]): AbilityPreset[] {
    return combos.flatMap((combo) => {
      const self = spellComboService.isSelf(combo);
      if (self && isContingency(combo)) return [];
      return this.comboFiles(combo).map(({ file, spells }) => {
        const ability: RawCreatureAbility = {
          name: KIND_NAMES[combo.kind],
          spell: { resource: file, type: "force", remove: true },
          triggers: combo.condition ? [structuredClone(CONTINGENCY_TRIGGERS[combo.condition])] : [],
          requireVocal: false,
          spellcasting: true,
          probability: DEFAULT_SPELL_PROBABILITY,
        };
        if (self) ability.spell = { ...ability.spell, castOnSelf: true };
        else this.addComboChecks(ability, combo, spells, presets);
        return { preset: file, ability };
      });
    });
  }

  /** Each SPL generated for the combo, with its spells, once (mods can share one). */
  private comboFiles(combo: SpellCombo): { file: string; spells: SpellReference[] }[] {
    const results = new Map<string, SpellReference[]>();
    for (const mod of MOD_LAYER_ORDER) {
      const spells = spellComboService.spellsFor(combo, mod);
      if (spells) results.set(spellComboService.comboFile(combo, mod), spells);
    }
    return [...results].map(([file, spells]) => ({ file, spells }));
  }

  /** The first spell's targets, with the checks of every spell (see createCombos). */
  private addComboChecks(
    ability: RawCreatureAbility,
    combo: SpellCombo,
    spells: SpellReference[],
    presets: AbilityPreset[],
  ): void {
    const abilities = spells.map((spell) => {
      const preset = presets.find((p) => p.preset === spell.file);
      if (!preset) throw new Error(`Spell combo ${combo.key}: no preset for spell ${spell.file}`);
      return { spell, ability: preset.ability };
    });
    ability.targets = structuredClone(abilities[0].ability.targets);
    const keywords = new Set<SpellKeyword>(
      abilities.flatMap((a) => a.ability.keywords ?? a.spell.keywords ?? []),
    );
    if (keywords.size) ability.keywords = [...keywords];
    const levels = abilities.flatMap((a) => {
      const level = a.ability.level ?? a.spell.level;
      return typeof level === "number" ? [level] : [];
    });
    if (levels.length) ability.level = Math.max(...levels);
    ability.saves = mergeSaves(abilities.flatMap((a) => a.ability.saves ?? a.spell.saves ?? []));
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
