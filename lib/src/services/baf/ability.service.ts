import deepmerge from "deepmerge";
import { ABILITY_PRESETS } from "../../../config/ability-presets";
import { GLOBAL_CONFIG } from "../../../config/generate";
import { resourcePlaceholderToken } from "../../../config/mods";
import { SpellKeyword } from "../../../config/spells/keyword";
import { SPELLS } from "../../../config/spells/spell-database";
import {
  excludeSpellStatesForFile,
  excludeStateChecksForFile,
  excludeStatsChecksForFile,
  includeStateChecksForFile,
  keywordsForFile,
  levelForFile,
  rangeForFile,
  SpellVariant,
} from "../../model/spell-item/spell-reference";
import actionFactory from "../../factories/action.factory";
import triggerFactory from "../../factories/trigger.factory";
import { ScriptTarget } from "../../model/constants";
import {
  CreatureAbility,
  CreatureAbilitySpell,
  RawCreatureAbility,
  RawCreatureSequencerAbility,
} from "../../model/creature/ability";
import { StringReference } from "../../model/final/stringref";
import { Actions } from "../../model/script/actions";
import { CustomCode, PartialCustomCode } from "../../model/script/script";
import { TargetList } from "../../model/script/target";
import { Triggers } from "../../model/script/triggers";

class AbilityService {
  getAbilities(abilities: RawCreatureAbility[] | undefined): CreatureAbility[] {
    if (!abilities) return [];
    const randomGenerator = this.getNumberGenerator();
    const results: CreatureAbility[] = abilities.map((abil) =>
      this.getAbility(abil, randomGenerator),
    );
    return results;
  }

  getMinorSequencer(presets: string[] & { length: 2 }): RawCreatureSequencerAbility {
    return this.generateSequencer(presets, "ability.MinorSequencer");
  }

  getSequencer(presets: string[] & { length: 3 }): RawCreatureSequencerAbility {
    return this.generateSequencer(presets, "ability.Sequencer");
  }

  private generateSequencer(
    presets: string[] & { length: 2 | 3 },
    name: StringReference,
  ): RawCreatureSequencerAbility {
    const ability: RawCreatureSequencerAbility = {
      name,
      requireVocal: false,
      targets: [],
      triggers: [triggerFactory.global(GLOBAL_CONFIG.bafConstants.minorSequencer, 0)],
      actionsAfter: [actionFactory.setGlobal(GLOBAL_CONFIG.bafConstants.minorSequencer, 1)],
      probability: 70,
      spells: [],
    };
    for (const preset of presets) {
      const rawAb = this.applyPreset(
        {
          spell: {
            type: "force",
            memorizedSpellCheck: false,
          },
        },
        preset,
      );
      if (!rawAb.spell) throw new Error(`Sequencer only supports spells`);
      ability.spells.push(rawAb.spell);
      const targets = this.appendSpellCheckTriggers(rawAb.targets, rawAb.keywords, rawAb.level);
      if (targets) ability.targets?.push(...targets);
    }
    return ability;
  }

  /**
   * Appends trigger.factory.spellChecks()'s triggers for `keywords`, and an
   * ImmuneToSpellLevel(target, level) check when `level` is known, to every target list's own
   * `triggers` - not the ability's top-level triggers - since a target list is what actually
   * restricts an offensive ability to a subset of targets, so "skip protected targets" belongs
   * there. These ability-level checks are shared by every target list; each target list's own
   * `keywords` (see TargetList.keywords) are additionally resolved and appended per-tier, so a
   * fallback cascade's tiers can carry different, independently-toggleable checks (e.g. excluding
   * both Elf and Half-Elf in a best-case tier, only Elf in a looser fallback). `keywords` is
   * consumed here and dropped from the result - it's build-time input only, never read again
   * downstream, and dropping it lets two tiers whose *resolved* triggers end up identical dedupe
   * against each other even when they were authored with different `keywords` (see
   * dedupeTargetLists). Finishes by deduping any target list that's become a full duplicate of an
   * earlier one - toggling a tier-only check off can otherwise leave two tiers identical. A no-op
   * when there's nothing to add.
   */
  private appendSpellCheckTriggers(
    targets: TargetList[] | undefined,
    keywords: SpellKeyword[] | undefined,
    level: number | undefined,
  ): TargetList[] | undefined {
    if (!targets) return targets;
    const sharedChecks = triggerFactory.spellChecks(keywords);
    if (level !== undefined && GLOBAL_CONFIG.spellChecks.spellProtections) {
      sharedChecks.push(triggerFactory.immuneToSpellLevel(level, true));
    }
    const withChecks = targets.map((t) => {
      const { keywords: ownKeywords, ...rest } = t;
      const allChecks = [...sharedChecks, ...triggerFactory.spellChecks(ownKeywords)];
      return allChecks.length
        ? { ...rest, triggers: [...(rest.triggers ?? []), ...allChecks] }
        : rest;
    });
    return this.dedupeTargetLists(withChecks);
  }

  /**
   * Drops any TargetList that's a full structural duplicate of an earlier one in the same array.
   * A fallback cascade's tiers can end up identical once a tier-only toggleable check (see
   * TargetList.keywords) is disabled by GLOBAL_CONFIG - trying the exact same filter twice can
   * never produce a different result, so the later duplicate is pure waste in the generated output.
   */
  private dedupeTargetLists(targets: TargetList[]): TargetList[] {
    const seen: string[] = [];
    return targets.filter((t) => {
      const key = JSON.stringify(t);
      if (seen.includes(key)) return false;
      seen.push(key);
      return true;
    });
  }

  getCustomCodes(customCodes: PartialCustomCode[] | undefined): CustomCode[] {
    if (!customCodes) return [];
    const results: CustomCode[] = [];
    for (const customCode of customCodes) {
      results.push({
        ...customCode,
        statements: customCode.statements ?? [],
        abilities: this.getAbilities(customCode.abilities),
      });
    }
    return results;
  }

  private *getNumberGenerator(): Generator<number, void> {
    let num = 800;
    while (num < 10000) {
      yield num;
      num++;
    }
  }

  private getAbility(
    abil: RawCreatureAbility | RawCreatureSequencerAbility,
    randomGenerator: Generator<number, void>,
  ): CreatureAbility {
    let ability = structuredClone(abil);
    if ("preset" in ability && ability.preset) {
      ability = this.applyPreset(ability, ability.preset);
    }
    const triggers: Triggers.Trigger[] = ability.triggers ?? [];
    let targets = !ability.targets || Array.isArray(ability.targets) ? ability.targets : undefined;
    if (!!ability.targets && !Array.isArray(ability.targets)) targets = [ability.targets];
    targets = this.appendSpellCheckTriggers(targets, ability.keywords, ability.level);
    const result: CreatureAbility = {
      infiniteUse: false,
      requireVocal: false,
      disableInterrupt: false,
      canUseWhenPolymorphed: false,
      ...ability,
      targets: targets ?? [],
      name: ability.name ?? "ability.unknown",
      isSpell: false,
      triggers,
      actions: ability.actionsBefore ?? [],
    };
    if ("spell" in ability && ability.spell) {
      this.parseAbilitySpell(result, ability, ability.spell);
    } else if ("spells" in ability) {
      this.parseAbilitySpells(result, ability, ability.spells);
    }
    result.actions.push(...(ability.actionsAfter ?? []));
    if (!!ability.probability && ability.probability < 100) {
      const num = randomGenerator.next().value ?? 0;
      result.triggers.push({
        name: "RandomNumGT",
        params: [num, Math.round(num * (1 - ability.probability / 100))],
      });
    }
    return result;
  }

  private parseAbilitySpell(
    result: CreatureAbility,
    ability: RawCreatureAbility,
    spell: CreatureAbilitySpell,
  ): CreatureAbility {
    const target = ability.targets ? ScriptTarget.token : ScriptTarget.myself;
    result.isSpell = !spell.isAttack;
    result.resource = spell.resource ?? ability.preset;
    result.resourceVariants = spell.resourceVariants;
    spell.type ??= "normal";
    result.infiniteUse = spell.type !== "normal" && !spell.remove;
    spell.memorizedSpellCheck ??= true;
    // Lets a SPELLS entry's `keywords: ["castOnSelf"]` (see SpellKeyword) drive the same behavior
    // as hand-setting CreatureAbilitySpell.castOnSelf, once ability.keywords is resolved (either
    // explicitly or via keywordsForFile in applyPreset above).
    spell.castOnSelf ??= ability.keywords?.includes("castOnSelf");
    if (!spell.id && !spell.resource)
      throw new Error(`No spell specified for ability ${ability.name ?? "unknown"}`);
    if (spell.memorizedSpellCheck && spell.id) {
      result.triggers.unshift({
        name: "HaveSpell",
        params: [spell.id],
      });
    } else if (spell.memorizedSpellCheck && spell.resource) {
      result.triggers.unshift({
        name: "HaveSpellRES",
        params: [this.resourceParam(spell.resource, spell.resourceVariants)],
      });
    }
    this.addExclusionTriggers(result, target, spell);
    let spellTarget: string = spell.castOnSelf ? ScriptTarget.myself : ScriptTarget.lastSeen;
    if (spell.targetName) spellTarget = spell.targetName;
    result.actions.push(this.getSpellAction(spell, spellTarget));
    if (spell.remove && spell.type !== "normal" && spell.id) {
      result.actions.push({
        name: "RemoveSpell",
        params: [spell.id],
      });
    } else if (spell.remove && spell.type !== "normal" && spell.resource) {
      result.actions.push({
        name: "RemoveSpellRES",
        params: [this.resourceParam(spell.resource, spell.resourceVariants)],
      });
    }
    return result;
  }

  private addExclusionTriggers(
    result: CreatureAbility,
    target: string,
    spell: CreatureAbilitySpell,
  ) {
    for (const state of spell.includeStateChecks ?? []) {
      result.triggers.push({
        name: "StateCheck",
        params: [target, state],
      });
    }
    for (const state of spell.excludeStateChecks ?? []) {
      result.triggers.push({
        name: "StateCheck",
        params: [target, state],
        negation: true,
      });
    }
    for (const stat of spell.excludeStatsChecks ?? []) {
      result.triggers.push({
        name: "CheckStatGT",
        params: [target, 0, stat],
        negation: true,
      });
    }
    for (const state of spell.excludeSpellStates ?? []) {
      result.triggers.push({
        name: "CheckSpellState",
        params: [target, state],
        negation: true,
      });
    }
  }

  private parseAbilitySpells(
    result: CreatureAbility,
    ability: RawCreatureAbility,
    spells: CreatureAbilitySpell[],
  ): CreatureAbility {
    const target = ability.targets ? ScriptTarget.token : ScriptTarget.myself;
    // See parseAbilitySpell's identical line - applied before the same-target check below so a
    // keyword-driven default is validated exactly like an explicit one.
    for (const spell of spells) {
      spell.castOnSelf ??= ability.keywords?.includes("castOnSelf");
    }
    if (spells.some((s) => s.castOnSelf) && !spells.every((s) => s.castOnSelf)) {
      throw new Error(
        `Every spells must have the same target in ability ${ability.name ?? "unknown"}`,
      );
    }
    result.isSpell = true;
    result.infiniteUse = false;
    // result.resource = spell.resource ?? ability.preset;
    for (const spell of spells) {
      this.addExclusionTriggers(result, target, spell);
      let spellTarget: string = spell.castOnSelf ? ScriptTarget.myself : ScriptTarget.lastSeen;
      if (spell.targetName) spellTarget = spell.targetName;
      result.actions.push(this.getSpellAction(spell, spellTarget));
    }
    return result;
  }

  private applyPreset(ability: RawCreatureAbility, presetName: string): RawCreatureAbility {
    const preset = ABILITY_PRESETS.find((p) => p.preset === presetName);
    if (!preset) {
      throw new Error(`Unknown preset ${presetName}`);
    }
    if (Array.isArray(preset.ability.spell)) throw new Error(`Preset don't support spell arrays`);
    const result: RawCreatureAbility = deepmerge(preset.ability, ability, {});
    // deepmerge concatenates array fields by default (the right behavior for triggers/actions,
    // which genuinely accumulate) but wrong for `keywords`: an override declaring its own keywords
    // must fully replace the preset's, not get appended to them. Recomputed explicitly with the
    // right precedence instead of trusting whatever the deepmerge above produced: the override's
    // own keywords win, else the preset's own, else - covering a preset that isn't built from a
    // SpellReference at all (PresetFactory.createSpell/createOrderedSpells already resolve this
    // once per spell, before this method ever runs) - a fallback to whatever SPELLS says about
    // this exact presetName. Left unset (rather than []) when nothing matches, so a one-off
    // ability with no SPELLS entry of its own is unaffected.
    result.keywords =
      ability.keywords ?? preset.ability.keywords ?? keywordsForFile(SPELLS, presetName);
    // Same fallback as keywords above, for the ImmuneToSpellLevel mechanism (see
    // BaseCreatureAbility.level) - independent of the keywords/SpellKeyword system.
    result.level ??= levelForFile(SPELLS, presetName);
    // Same fallback as keywords/level above, for the Range() trigger mechanism (see
    // BaseCreatureAbility.range) - independent of the keywords/SpellKeyword system.
    result.range ??= rangeForFile(SPELLS, presetName);
    // Same fallback as keywords/level/range above, but for CreatureAbilitySpell's own state-check
    // fields (see SpellReference.includeStateChecks and siblings) - only fires when the deepmerge
    // above produced nothing for the field at all, so it never duplicates a check that's already
    // present (e.g. baked in via PresetFactory's spellDefaults, or set by the override itself).
    if (result.spell) {
      result.spell.includeStateChecks ??= includeStateChecksForFile(SPELLS, presetName);
      result.spell.excludeStateChecks ??= excludeStateChecksForFile(SPELLS, presetName);
      result.spell.excludeSpellStates ??= excludeSpellStatesForFile(SPELLS, presetName);
      result.spell.excludeStatsChecks ??= excludeStatsChecksForFile(SPELLS, presetName);
    }
    if (ability.spell && preset.ability.spell?.id && ability.spell.resource && result.spell) {
      result.spell.id = undefined;
    } else if (
      ability.spell &&
      preset.ability.spell?.resource &&
      ability.spell.id &&
      result.spell
    ) {
      result.spell.resource = undefined;
    }
    // The override's own resource is a different spell than whatever the preset's
    // resourceVariants described - deepmerge would otherwise leave the preset's variants attached
    // to the override's unrelated resource.
    if (
      ability.spell?.resource &&
      !ability.spell.resourceVariants &&
      result.spell?.resourceVariants
    ) {
      result.spell.resourceVariants = undefined;
    }
    return result;
  }

  // A lookup-table rewrite would lose the discriminated-union narrowing between each `name` and
  // its `params` shape (Actions.Action) without a cast - this flat resource/id x type dispatch is
  // the clearest way to keep that type safety, same reasoning as effect.service.ts's opcode
  // switch in SONARJS_ROADMAP.md.
  // eslint-disable-next-line sonarjs/cognitive-complexity
  private getSpellAction(spell: CreatureAbilitySpell, target: string): Actions.Action {
    if (spell.resource && spell.type === "normal")
      return {
        name: "SpellRES",
        params: [this.resourceParam(spell.resource, spell.resourceVariants), target],
      };
    else if (spell.resource && spell.type === "noDec")
      return {
        name: "SpellNoDecRES",
        params: [this.resourceParam(spell.resource, spell.resourceVariants), target],
      };
    else if (spell.resource && spell.type === "force")
      return {
        name: "ForceSpellRES",
        params: [this.resourceParam(spell.resource, spell.resourceVariants), target],
      };
    else if (spell.resource && spell.type === "reallyForce")
      return {
        name: "ReallyForceSpellRES",
        params: [this.resourceParam(spell.resource, spell.resourceVariants), target],
      };
    else if (spell.id && spell.type === "normal")
      return { name: "Spell", params: [target, spell.id] };
    else if (spell.id && spell.type === "noDec")
      return { name: "SpellNoDec", params: [target, spell.id] };
    else if (spell.id && spell.type === "force")
      return { name: "ForceSpell", params: [target, spell.id] };
    else if (spell.id && spell.type === "reallyForce")
      return { name: "ReallyForceSpell", params: [target, spell.id] };

    throw new Error("getSpellAction: unexpected combination");
  }

  /**
   * The literal resource to bake into a compiled action/trigger param - the resource itself when
   * it's always correct, or a `%TOKEN%` placeholder when it has mod-dependent variants, resolved by
   * weidu-creature.service.ts's OUTER_SPRINT assignment right before this creature's script is
   * actually compiled (an install-time decision, not something this generator can know).
   */
  private resourceParam(resource: string, variants: SpellVariant[] | undefined): string {
    return variants?.length ? `%${resourcePlaceholderToken(resource)}%` : resource;
  }
}

const abilityService = new AbilityService();
export default abilityService;
