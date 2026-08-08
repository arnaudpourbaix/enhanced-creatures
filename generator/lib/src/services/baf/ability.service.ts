import deepmerge from "deepmerge";
import { ABILITY_PRESETS } from "../../../config/ability-presets";
import { GLOBAL_CONFIG } from "../../../config/generate";
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
      if (rawAb.targets) ability.targets?.push(...rawAb.targets);
    }
    return ability;
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
    spell.type ??= "normal";
    result.infiniteUse = spell.type !== "normal" && !spell.remove;
    spell.memorizedSpellCheck ??= true;
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
        params: [spell.resource],
      });
    }
    this.addExclusionTriggers(result, target, spell);
    let spellTarget: string = spell.selfTarget ? ScriptTarget.myself : ScriptTarget.lastSeen;
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
        params: [spell.resource],
      });
    }
    return result;
  }

  private addExclusionTriggers(
    result: CreatureAbility,
    target: string,
    spell: CreatureAbilitySpell,
  ) {
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
    if (spells.some((s) => s.selfTarget) && !spells.every((s) => s.selfTarget)) {
      throw new Error(
        `Every spells must have the same target in ability ${ability.name ?? "unknown"}`,
      );
    }
    result.isSpell = true;
    result.infiniteUse = false;
    // result.resource = spell.resource ?? ability.preset;
    for (const spell of spells) {
      this.addExclusionTriggers(result, target, spell);
      let spellTarget: string = spell.selfTarget ? ScriptTarget.myself : ScriptTarget.lastSeen;
      if (spell.targetName) spellTarget = spell.targetName;
      result.actions.push(this.getSpellAction(spell, spellTarget));
    }
    return result;
  }

  private applyPreset(ability: RawCreatureAbility, presetName: string): RawCreatureAbility {
    const preset = ABILITY_PRESETS.find((p) => p.preset === presetName);
    if (!preset) throw new Error(`Unknown preset ${presetName}`);
    if (Array.isArray(preset.ability.spell)) throw new Error(`Preset don't support spell arrays`);
    const result: RawCreatureAbility = deepmerge(preset.ability, ability, {});
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
    return result;
  }

  // A lookup-table rewrite would lose the discriminated-union narrowing between each `name` and
  // its `params` shape (Actions.Action) without a cast - this flat resource/id x type dispatch is
  // the clearest way to keep that type safety, same reasoning as effect.service.ts's opcode
  // switch in SONARJS_ROADMAP.md.
  // eslint-disable-next-line sonarjs/cognitive-complexity
  private getSpellAction(spell: CreatureAbilitySpell, target: string): Actions.Action {
    if (spell.resource && spell.type === "normal")
      return { name: "SpellRES", params: [spell.resource, target] };
    else if (spell.resource && spell.type === "noDec")
      return { name: "SpellNoDecRES", params: [spell.resource, target] };
    else if (spell.resource && spell.type === "force")
      return { name: "ForceSpellRES", params: [spell.resource, target] };
    else if (spell.resource && spell.type === "reallyForce")
      return { name: "ReallyForceSpellRES", params: [spell.resource, target] };
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
}

const abilityService = new AbilityService();
export default abilityService;
