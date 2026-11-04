import { EntryEnum } from "../../../creatures/entry";
import { MonsterEnum } from "../../../creatures/monster";
import { Creature } from "./creature";
import { CreatureEntry } from "./entry";
import { CreatureKin } from "./kin";

/**
 * An entry of plain creatures, built in order by one builder function per member (no creature
 * subclass of its own). Type behaviors (e.g. the undead's d12 Hit Dice and turn level) come from
 * the creature's types (`lib/creatures/types/`).
 */
export class SimpleEntry extends CreatureEntry<Creature> {
  constructor(id: EntryEnum, builders: ((entry: SimpleEntry) => Creature)[], kin?: CreatureKin) {
    super(id, kin);
    for (const build of builders) this.addCreature(() => build(this));
  }

  createCreature(id: MonsterEnum): Creature {
    return new Creature(id);
  }
}
