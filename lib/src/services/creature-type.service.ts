import { TYPE_TRAITS } from "../../config/creature-types";
import { CreatureAdjustment } from "../model/creature/adjustment";
import { Creature } from "../model/creature/creature";
import { ImmunityName } from "../model/final/immunity";
import { State } from "../state";
import translationService from "./translation.service";

class CreatureTypeService {
  getCreatureTypes(creature: Creature): ImmunityName[] {
    const found = this.collect(creature.data.immunities);
    // Test fixtures built with `as unknown as Creature` may omit items.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    for (const item of (creature.items ?? []).filter((i) => i.trait)) {
      this.collect(item.immunities, found);
    }
    return TYPE_TRAITS.filter((t) => found.has(t));
  }

  /**
   * The types an adjustment gives a creature that does not have them (its immunities add to the
   * creature's: a zombie ankheg adjustment adds `undead` to a magical beast), in TYPE_TRAITS order.
   */
  getAdjustmentTypes(creature: Creature, adjustment: CreatureAdjustment): ImmunityName[] {
    const own = this.getCreatureTypes(creature);
    // Test fixtures built with `as unknown as CreatureAdjustment` may omit immunities.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    const found = this.collect(adjustment.data.immunities ?? []);
    return TYPE_TRAITS.filter((t) => found.has(t) && !own.includes(t));
  }

  // The names and, transitively, the traits nested in them (spider -> vermin).
  private collect(names: ImmunityName[], found = new Set<ImmunityName>()): Set<ImmunityName> {
    const visit = (name: ImmunityName) => {
      if (found.has(name)) return;
      found.add(name);
      const config = State.immunities.find((i) => i.name === name);
      for (const nested of config?.immunities ?? []) visit(nested);
    };
    for (const name of names) visit(name);
    return found;
  }

  getTypeName(type: ImmunityName): string {
    const config = State.immunities.find((i) => i.name === type);
    return translationService.fromOptional(config?.stringRef);
  }
}

const creatureTypeService = new CreatureTypeService();
export default creatureTypeService;
