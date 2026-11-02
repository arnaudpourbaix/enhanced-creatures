import { AbilityEntry, CreatureAbility } from "../../model/creature/ability";
import { CreatureBehavior, PartialCreatureBehavior } from "../../model/creature/behavior";
import { Creature } from "../../model/creature/creature";
import { Variant } from "../../model/creature/variant";
import creatureFactory from "../../factories/creature.factory";
import atWillService from "../at-will.service";
import creatureService from "../creature.service";
import { CreatureScript } from "./script-plan.service";
import translationService from "../translation.service";
import { SPELLS } from "../../../config/spells/spell-database";
import { COVER_SPELLS } from "../../../config/spells/cover-spells";
import { spellFiles } from "../../model/spell-item/spell-reference";

/** The triggers an ability checks its spell is memorized with (see AbilityService) */
const MEMORIZED_CHECKS = new Set(["HaveSpell", "HaveSpellRES"]);

/** A creature's hand-written behavior, before its spells' abilities are resolved. */
export interface HandWrittenBehavior {
  behavior: CreatureBehavior;
  entries?: AbilityEntry[];
}

/**
 * The creature as one of its scripts sees it: only the adjustments of the files running it, and
 * the abilities resolved for their spells alone - a plain file doesn't run a variant's spellbook.
 */
class ScriptViewService {
  snapshot(creature: Creature): HandWrittenBehavior {
    return {
      behavior: structuredClone(creature.behavior),
      entries: creature.pendingAbilityEntries && [...creature.pendingAbilityEntries],
    };
  }

  /**
   * Gives the creature itself every variant's abilities too: its own resolution (documentation,
   * checks) then covers all its scripts. Call it after {@link snapshot}.
   */
  addVariantBehaviors(creature: Creature): void {
    const all = (variants: Variant[]): Variant[] =>
      variants.flatMap((v) => [v, ...all(v.children)]);
    for (const variant of all(creature.variants)) this.addBehavior(creature, variant.behavior);
  }

  build(creature: Creature, script: CreatureScript, handWritten: HandWrittenBehavior): Creature {
    const files = new Set([...script.files, ...script.summonFiles]);
    const view = Object.create(creature) as Creature;
    view.adjustments = creature.adjustments.filter((a) => a.files.some((f) => files.has(f)));
    // its own copy: resolving and cooldowns change the abilities
    view.behavior = structuredClone(handWritten.behavior);
    view.pendingAbilityEntries = handWritten.entries && [...handWritten.entries];
    for (const variant of this.chain(script.variant)) this.addBehavior(view, variant.behavior);
    creatureFactory.resolveAbilities(view);
    atWillService.applyCooldowns(view);
    this.dropUnmemorized(creature, view);
    return view;
  }

  /**
   * The script's cast order, for the log: what the creature does under cover (Invisibility,
   * Sanctuary), then otherwise. Each spell once, at its first place.
   */
  describe(view: Creature): string[] {
    const names = (abilities: CreatureAbility[]) => [
      ...new Set(abilities.map((a) => translationService.from(a.name))),
    ];
    const order = names(view.behavior.abilities);
    const covered = names(view.behavior.coveredAbilities);
    if (!covered.length) return order.length ? [`Cast order: ${order.join(", ")}.`] : [];
    return [
      `While ${this.cover(view)}: ${covered.join(", ")}, then hold without attacking.`,
      `Otherwise: ${order.join(", ")}.`,
    ];
  }

  private cover(view: Creature): string {
    const memorized = creatureService.memorizedSpellFiles(view).map((f) => f.toUpperCase());
    const sanctuary = spellFiles(SPELLS.Priest.Sanctuary).map((f) => f.toUpperCase());
    const covers = memorized.filter((f) => COVER_SPELLS.includes(f));
    const states = [
      ...(covers.some((f) => !sanctuary.includes(f)) ? ["invisible"] : []),
      ...(covers.some((f) => sanctuary.includes(f)) ? ["under Sanctuary"] : []),
    ];
    return states.join(" or ");
  }

  /** The variant and its ancestors, root first: each adds its abilities to its parent's. */
  private chain(variant: Variant | undefined): Variant[] {
    const chain: Variant[] = [];
    for (let v = variant; v; v = v.parent) chain.unshift(v);
    return chain;
  }

  private addBehavior(view: Creature, behavior: PartialCreatureBehavior | undefined): void {
    if (!behavior) return;
    const { abilities, ...others } = behavior;
    if (abilities && !Array.isArray(abilities)) {
      // added to the base's entries, which setBehavior refuses to declare twice
      view.pendingAbilityEntries = [...(view.pendingAbilityEntries ?? []), ...abilities.entries];
      creatureFactory.setBehavior(view, others);
    } else {
      creatureFactory.setBehavior(view, behavior);
    }
  }

  /**
   * An ability casting a spell only other scripts' files memorize can never fire here. A spell no
   * file memorizes is granted in game (Polymorph Self's forms, an item's power): it stays.
   */
  private dropUnmemorized(creature: Creature, view: Creature): void {
    const upper = (files: string[]) => new Set(files.map((f) => f.toUpperCase()));
    const own = upper(creatureService.memorizedSpellFiles(view));
    const others = upper(creatureService.memorizedSpellFiles(creature));
    const castable = (ability: CreatureAbility) => {
      // without memorizedSpellCheck, no HaveSpell trigger: it casts what it isn't given
      if (!ability.triggers.some((t) => "name" in t && MEMORIZED_CHECKS.has(t.name))) return true;
      const files = creatureService.getAbilityCastFiles(ability).map((f) => f.toUpperCase());
      return !files.some((f) => others.has(f)) || files.some((f) => own.has(f));
    };
    const { behavior } = view;
    behavior.abilities = behavior.abilities.filter(castable);
    behavior.coveredAbilities = behavior.coveredAbilities.filter(castable);
    behavior.customCodes = behavior.customCodes.map((c) => ({
      ...c,
      abilities: c.abilities.filter(castable),
    }));
  }
}

const scriptViewService = new ScriptViewService();
export default scriptViewService;
