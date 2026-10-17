import { Creature } from "../../src/model/creature/creature";
import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { MonsterEnum } from "../monster";

/**
 * The entry of an undead monster: builds its members in order. The undead behaviors (d12 Hit
 * Dice, turn level, weapon helpers) belong to the undead type (`lib/creatures/types/undead.ts`).
 */
export class UndeadEntry extends CreatureEntry<Creature> {
  constructor(id: EntryEnum, builders: ((entry: UndeadEntry) => Creature)[], kin?: CreatureKin) {
    super(id, kin);
    for (const build of builders) this.addCreature(() => build(this));
  }

  createCreature(id: MonsterEnum): Creature {
    return new Creature(id);
  }
}
