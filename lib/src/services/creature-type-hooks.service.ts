import { TYPE_TRAITS } from "../../config/creature-types";
import { TYPE_MODULES } from "../../creatures/types";
import { Creature } from "../model/creature/creature";
import { ImmunityName } from "../model/final/immunity";
import creatureTypeService from "./creature-type.service";

/** Code behavior shared by every creature of a type (`lib/creatures/types/<type>.ts`). */
export interface CreatureTypeModule {
  type: ImmunityName;
  /** Hit die size of the type's creatures (the largest one wins for a creature with several). */
  hitDie?: number;
  /**
   * Run once a creature is fully built, before validation, when the creature or one of its
   * adjustments has the type (an adjustment can add a type: zombie ankhegs are undead). The hook
   * decides which of the creature's data and adjustments it touches.
   */
  afterBuild?(creature: Creature): void;
}

/**
 * Type registry: runs each type module's hooks for every creature having the type (derived
 * types: direct, nested, trait item), in TYPE_TRAITS order, and gives the type-driven hit die.
 */
class CreatureTypeHooksService {
  // Read at call time: the type modules import services that import this registry.
  constructor(private readonly getModules: () => readonly CreatureTypeModule[]) {}

  get modules(): readonly CreatureTypeModule[] {
    return this.getModules();
  }

  /** A registry over other modules (tests). */
  withModules(modules: readonly CreatureTypeModule[]): CreatureTypeHooksService {
    return new CreatureTypeHooksService(() => modules);
  }

  afterBuild(creature: Creature): void {
    const types = new Set(creatureTypeService.getCreatureTypes(creature));
    for (const adjustment of creature.adjustments) {
      for (const type of creatureTypeService.getAdjustmentTypes(creature, adjustment)) {
        types.add(type);
      }
    }
    for (const type of TYPE_TRAITS.filter((t) => types.has(t))) {
      this.modules.find((m) => m.type === type)?.afterBuild?.(creature);
    }
  }

  /**
   * The largest hit die among the creature's own types, undefined when none has one. Types an
   * adjustment adds don't count: adjustments keep their base creature's die.
   */
  getHitDie(creature: Creature): number | undefined {
    const dice = creatureTypeService
      .getCreatureTypes(creature)
      .map((type) => this.modules.find((m) => m.type === type)?.hitDie)
      .filter((die) => die !== undefined);
    return dice.length ? Math.max(...dice) : undefined;
  }
}

const creatureTypeHooksService = new CreatureTypeHooksService(() => TYPE_MODULES);
export default creatureTypeHooksService;
