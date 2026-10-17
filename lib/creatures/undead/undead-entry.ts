import { CreatureEntry } from "../../src/model/creature/entry";
import { CreatureKin } from "../../src/model/creature/kin";
import { EntryEnum } from "../entry";
import { MonsterEnum, MonsterFamilyEnum } from "../monster";
import { applyTurnLevel } from "./turn-level";
import { Undead } from "./undead-creature";

/**
 * Transitional (until the undead behaviors move to the undead type): the entry of an undead
 * monster. Builds its members in order as `Undead`, keeps the Undead family's hit dice
 * (`legacyFamily`) and sets each member's turn level, as the former Undead family did.
 */
export class UndeadEntry extends CreatureEntry<Undead> {
  constructor(id: EntryEnum, builders: ((entry: UndeadEntry) => Undead)[], kin?: CreatureKin) {
    super(id, kin, MonsterFamilyEnum.Undead);
    for (const build of builders) this.addCreature(() => build(this));
  }

  createCreature(id: MonsterEnum): Undead {
    return new Undead(id);
  }

  protected override afterBuild(creature: Undead): void {
    applyTurnLevel(creature);
  }
}
