import { Creature } from "../model/creature/creature";
import { ImmunityName } from "../model/final/immunity";
import creatureTypeService from "./creature-type.service";

/** Code behavior shared by every creature of a type (`lib/creatures/types/<type>.ts`). */
export interface CreatureTypeModule {
  type: ImmunityName;
  hitDie?: number;
  /** Run once a creature having the type is fully built, before validation. */
  afterBuild?(creature: Creature): void;
}

/**
 * Type registry: runs each type module's hooks for every creature having the type (derived
 * types: direct, nested, trait item), in TYPE_TRAITS order. No module yet: the type behaviors
 * (turn level, hit dice) still live in the families until they move here.
 */
class CreatureTypeHooksService {
  constructor(readonly modules: readonly CreatureTypeModule[]) {}

  /** A registry over other modules (tests). */
  withModules(modules: readonly CreatureTypeModule[]): CreatureTypeHooksService {
    return new CreatureTypeHooksService(modules);
  }

  afterBuild(creature: Creature): void {
    if (!this.modules.length) return;
    for (const type of creatureTypeService.getCreatureTypes(creature)) {
      this.modules.find((m) => m.type === type)?.afterBuild?.(creature);
    }
  }
}

const creatureTypeHooksService = new CreatureTypeHooksService([]);
export default creatureTypeHooksService;
