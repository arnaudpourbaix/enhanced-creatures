import { TYPE_TRAITS } from "../../config/creature-types";
import { Creature } from "../model/creature/creature";
import { ImmunityName } from "../model/final/immunity";
import { State } from "../state";
import translationService from "./translation.service";

class CreatureTypeService {
  getCreatureTypes(creature: Creature): ImmunityName[] {
    const found = new Set<ImmunityName>();
    const visit = (name: ImmunityName) => {
      if (found.has(name)) return;
      found.add(name);
      const config = State.immunities.find((i) => i.name === name);
      for (const nested of config?.immunities ?? []) visit(nested);
    };
    for (const name of creature.data.immunities) visit(name);
    // Test fixtures built with `as unknown as Creature` may omit items.
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    for (const item of (creature.items ?? []).filter((i) => i.trait)) {
      for (const name of item.immunities) visit(name);
    }
    return TYPE_TRAITS.filter((t) => found.has(t));
  }

  getTypeName(type: ImmunityName): string {
    const config = State.immunities.find((i) => i.name === type);
    return translationService.fromOptional(config?.stringRef);
  }
}

const creatureTypeService = new CreatureTypeService();
export default creatureTypeService;
