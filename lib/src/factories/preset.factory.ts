import deepmerge from "deepmerge";
import { DEFAULT_SPELL_PROBABILITY } from "../../config/common";
import { SpellKeyword } from "../../config/spells/keyword";
import { AlliesCheck, CreatureAbilitySpell, RawCreatureAbility } from "../model/creature/ability";
import { AbilityPreset } from "../model/misc";
import { TargetList } from "../model/script/target";
import { Triggers } from "../model/script/triggers";
import { SpellCombo } from "../model/spell-item/spell-combo";
import { mergeSaves, SpellReference, spellFiles } from "../model/spell-item/spell-reference";
import spellComboService, {
  comboRange,
  commonTargets,
  isContingency,
  KIND_NAMES,
} from "../services/spell-combo.service";
import logService from "../services/log.service";

/** A combo's contained spell with its preset's ability. */
interface ContainedAbility {
  spell: SpellReference;
  ability: RawCreatureAbility;
}

/** The CreatureAbilitySpell checks a combo takes from all its contained spells. */
type ComboSpellCheck =
  "includeStateChecks" | "excludeStateChecks" | "excludeSpellStates" | "excludeStatsChecks";

/** Triggers about the caster's memorized spells: a combo's contained spells aren't memorized. */
const MEMORIZATION_TRIGGERS = new Set(["HaveSpell", "HaveSpellRES", "HaveAnySpells"]);

/** Whether a list of (ANDed) triggers can never all be true: a `False`, or a trigger and its negation. */
function neverHold(triggers: Triggers.Trigger[]): boolean {
  const keys = new Set<string>();
  for (const trigger of triggers) {
    if ("name" in trigger && trigger.name === "False" && !trigger.negation) return true;
    const negation = "negation" in trigger && !!trigger.negation;
    keys.add(`${String(negation)}|${JSON.stringify({ ...trigger, negation: undefined })}`);
  }
  return [...keys].some((k) => k.startsWith("true|") && keys.has(`false|${k.slice(5)}`));
}

class PresetFactory {
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
   * every spell's checks. Contingencies have none: they are set up at init, the engine fires them.
   * `presets` are the contained spells' ones (by file).
   */
  createCombos(combos: SpellCombo[], presets: AbilityPreset[]): AbilityPreset[] {
    return combos.flatMap((combo) => {
      if (isContingency(combo)) return [];
      const self = spellComboService.isSelf(combo);
      return this.comboFiles(combo).map(({ file, spells }) => {
        const ability: RawCreatureAbility = {
          name: KIND_NAMES[combo.kind],
          spell: { resource: file, type: "force", remove: true },
          triggers: [],
          requireVocal: false,
          spellcasting: true,
          probability: DEFAULT_SPELL_PROBABILITY,
        };
        const contained = this.containedAbilities(combo, spells, presets);
        if (self) ability.spell = { ...ability.spell, castOnSelf: true };
        else this.addComboChecks(ability, combo, spells, contained, presets);
        this.addContainedChecks(ability, combo, contained);
        return { preset: file, ability };
      });
    });
  }

  /** Each SPL generated for the combo, with its spells, once (mods can share one). */
  private comboFiles(combo: SpellCombo): { file: string; spells: SpellReference[] }[] {
    return spellComboService.filesOf(combo).map((file) => {
      const spells = spellComboService.spellsOfFile(file);
      if (!spells) throw new Error(`Spell combo ${combo.key}: unknown file ${file}`);
      return { file, spells };
    });
  }

  /** Each contained spell with its preset's ability. */
  private containedAbilities(
    combo: SpellCombo,
    spells: SpellReference[],
    presets: AbilityPreset[],
  ): ContainedAbility[] {
    return spells.map((spell) => {
      const preset = presets.find((p) => p.preset === spell.file);
      if (!preset) throw new Error(`Spell combo ${combo.key}: no preset for spell ${spell.file}`);
      return { spell, ability: preset.ability };
    });
  }

  /**
   * Every contained spell's state, spell state and stat checks, and its preset's triggers (both
   * unions, self and enemy combos alike). Left out: the memorization triggers (HaveSpell...,
   * about the contained spells' own slots, which a combo doesn't use), and every preset trigger
   * when together they can never hold (a `False`, or a trigger and its negation): the combo is
   * then fired by its targets and checks alone, with a warning.
   */
  private addContainedChecks(
    ability: RawCreatureAbility,
    combo: SpellCombo,
    contained: ContainedAbility[],
  ): void {
    const union = (key: ComboSpellCheck): void => {
      const values = [...new Set<unknown>(contained.flatMap((c) => c.ability.spell?.[key] ?? []))];
      if (values.length) ability.spell = { ...ability.spell, [key]: values };
    };
    union("includeStateChecks");
    union("excludeStateChecks");
    union("excludeSpellStates");
    union("excludeStatsChecks");

    const triggers = new Map<string, Triggers.Trigger>();
    for (const trigger of contained.flatMap((c) => c.ability.triggers ?? [])) {
      if ("name" in trigger && MEMORIZATION_TRIGGERS.has(trigger.name)) continue;
      triggers.set(JSON.stringify(trigger), structuredClone(trigger));
    }
    if (!triggers.size) return;
    if (neverHold([...triggers.values()])) {
      logService.warn(
        `Spell combo ${combo.key}: its spells' preset triggers can never all hold, they are left out`,
      );
      return;
    }
    ability.triggers = [...(ability.triggers ?? []), ...triggers.values()];
  }

  /**
   * The targets every spell shares (or its targetsOf spell's, else the first spell's), the SPL's
   * range and the widest of its spells' allies checks, with every spell's checks (see createCombos).
   */
  private addComboChecks(
    ability: RawCreatureAbility,
    combo: SpellCombo,
    spells: SpellReference[],
    abilities: ContainedAbility[],
    presets: AbilityPreset[],
  ): void {
    ability.targets = structuredClone(this.comboTargets(combo, abilities, presets));
    const alliesCheck = this.widestAlliesCheck(abilities);
    if (alliesCheck) ability.alliesCheck = alliesCheck;
    // the generated SPL's range, see SpellComboService
    ability.range = comboRange(spells);
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

  private comboTargets(
    combo: SpellCombo,
    abilities: ContainedAbility[],
    presets: AbilityPreset[],
  ): TargetList[] {
    if (combo.targetsOf) {
      const file = combo.targetsOf.file;
      const preset = presets.find((p) => p.preset === file);
      if (!preset) throw new Error(`Spell combo ${combo.key}: no preset for its targetsOf ${file}`);
      return preset.ability.targets ?? [];
    }
    // a spell suiting either side (a summon) goes wherever the others are aimed
    const sided = abilities.filter((a) => !a.spell.anySide);
    const common = commonTargets(sided.map((a) => a.ability.targets ?? []));
    return common.length ? common : ((sided[0] ?? abilities[0]).ability.targets ?? []);
  }

  /** The allies check of the combo's widest area: it keeps them all off allies. */
  private widestAlliesCheck(abilities: ContainedAbility[]): AlliesCheck | undefined {
    const checks = abilities.flatMap((a) => {
      // a preset's null disables its spell's
      const check =
        a.ability.alliesCheck !== undefined ? a.ability.alliesCheck : a.spell.alliesCheck;
      return check ? [check] : [];
    });
    if (checks.length === 0) return undefined;
    const widest = checks.reduce((w, c) => (c.range > w.range ? c : w), checks[0]);
    return structuredClone(widest);
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
