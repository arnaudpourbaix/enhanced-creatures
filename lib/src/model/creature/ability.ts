import { SpellKeyword } from "../../../config/spells/keyword";
import { SpellIdentifier } from "../ids/spell";
import { StateIdentifier } from "../ids/state";
import { StatsIdentifier } from "../ids/stats";
import { Actions } from "../script/actions";
import { Triggers } from "../script/triggers";
import { TargetList } from "../script/target";
import { StringReference } from "../final/stringref";
import { SpellReference, SpellVariant } from "../spell-item/spell-reference";

export interface BaseCreatureAbility {
  name: StringReference;
  targets: TargetList[];
  triggers: Triggers.Trigger[];
  /**
   * The spell's SpellKeyword(s) (e.g. SPELLS.Wizard.Horror.keywords) - ability.service.ts
   * auto-appends the matching trigger.factory.spellChecks() triggers to every target list, so a
   * preset never needs its own `...triggerFactory.spellChecks(...)` call (see
   * SPELL_CHECK_CONFIG_KEYWORDS for how a keyword maps to a toggleable GLOBAL_CONFIG.spellChecks
   * category).
   */
  keywords?: SpellKeyword[];
  /**
   * The spell's level (e.g. SPELLS.Wizard.Horror.level) - ability.service.ts auto-appends an
   * ImmuneToSpellLevel(target, level) trigger to every target list whenever this is known, so a
   * preset never needs its own hand-written globe/spell-deflection/etc. check. Independent of
   * `keywords` above - this mechanism doesn't use SpellKeyword/SPELL_CHECK_TRIGGERS at all, since
   * ImmuneToSpellLevel already covers whatever protection is actually active on the target.
   */
  level?: number;
  /**
   * Ability maximum range (if applicable)
   */
  range?: number;
  /**
   * Ability minimum range (if applicable)
   */
  minRange?: number;
  /**
   * For ability that can be cast every n seconds (one hour is 300)
   */
  timer?: { name: string; value: number };
  /**
   * Ability doesn't share common round timer
   */
  noRoundTimer?: boolean;
  /**
   * If true, disable interrupt (false by default)
   */
  disableInterrupt: boolean;
  /**
   * Can't be cast when silenced (false by default)
   */
  requireVocal: boolean;
  /**
   * Can use ability when polymorphed (false by default)
   */
  canUseWhenPolymorphed: boolean;
}

export interface CreatureAbility extends BaseCreatureAbility {
  isSpell: boolean;
  /**
   * Is this ability has infinite use?
   * Requires: noDec, force, reallyForce and no remove flag
   */
  infiniteUse: boolean;
  actions: Actions.Action[];
  resource?: string;
  /**
   * Per-mod overrides for `resource` above (mirrors SpellReference.variants) - installed via
   * weidu-creature.service.ts as an OUTER_SPRINT/ACTION_IF assignment, since a compiled script
   * needs the correct resource baked in before COMPILE, not resolved from a plain string here.
   */
  resourceVariants?: SpellVariant[];
  /**
   * Probability (0-100)
   */
  probability?: number;
}

export type RawCreatureAbility = Partial<BaseCreatureAbility> & {
  /**
   * Will check for preset in ABILITIES_PRESETS
   */
  preset?: string;
  spell?: CreatureAbilitySpell;
  /**
   * Actions before casting a spell
   */
  actionsBefore?: Actions.Action[];
  /**
   * Actions after casting a spell
   */
  actionsAfter?: Actions.Action[];
  /**
   * Probability (0-100)
   */
  probability?: number;
};

export type RawCreatureSequencerAbility = Partial<BaseCreatureAbility> & {
  spells: CreatureAbilitySpell[];
  /**
   * Actions before casting a spell
   */
  actionsBefore?: Actions.Action[];
  /**
   * Actions after casting a spell
   */
  actionsAfter?: Actions.Action[];
  /**
   * Probability (0-100)
   */
  probability?: number;
};

export type SpellCastType = "normal" | "noDec" | "force" | "reallyForce";

export interface CreatureAbilitySpell {
  id?: SpellIdentifier;
  resource?: string;
  /**
   * Per-mod overrides for `resource` - use when the resource this ability casts moves to a
   * different file under a mod (e.g. SPELLS.Wizard.DimensionDoor.variants), instead of `id`, which
   * compiles to a bare spell.ids symbol that can fail to resolve entirely once a mod renames it.
   */
  resourceVariants?: SpellVariant[];
  type?: SpellCastType;
  includeStateChecks?: StateIdentifier[];
  excludeStateChecks?: StateIdentifier[];
  excludeSpellStates?: string[];
  excludeStatsChecks?: StatsIdentifier[];
  /**
   * Target self with spell even if target is set
   */
  selfTarget?: boolean;
  /**
   * Is it an attack or a spell ? (default: false)
   * A spell can't target an improved invisible character while an attack can
   */
  isAttack?: boolean;
  /**
   * Target name when a spell is specifically cast at someone
   */
  targetName?: string;
  /**
   * Check if spell is memorized (default: true)
   */
  memorizedSpellCheck?: boolean;
  /**
   * Remove spell after use, only relevant is type is different than normal
   */
  remove?: boolean;
}

export type AbilityAnchor = SpellReference | number | string;

export interface AbilityEntry {
  /**
   * A registry (SPELLS/FNP_SPELLS) spell: overrides its auto-derived position and/or config.
   * Exactly one of `spell`/`abilityId` must be set.
   */
  spell?: SpellReference;
  /**
   * A local Ids enum value for a custom addSpell-created ability, resolved via
   * creature.spell(id)/creature.ability(id). Exactly one of `spell`/`abilityId` must be set.
   */
  abilityId?: number;
  insertBefore?: AbilityAnchor;
  insertAfter?: AbilityAnchor;
  insertFirst?: true;
  insertLast?: true;
}
