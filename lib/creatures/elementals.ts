import { Creature } from "../src/model/creature/creature";
import { CreatureFamily } from "../src/model/creature/family";
import { MonsterEnum, MonsterFamilyEnum } from "./monster";

enum Ids {}

class Elemental extends Creature {}

class ElementalFamily extends CreatureFamily<Elemental> {
  constructor() {
    super(MonsterFamilyEnum.Elemental);
  }

  createCreature(id: MonsterEnum): Elemental {
    return new Elemental(id);
  }
}

export const createElementals = () => new ElementalFamily();
