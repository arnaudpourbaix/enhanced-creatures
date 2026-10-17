import { MonsterFamilyEnum } from "../../../creatures/monster";
import { EntryEnum } from "../../../creatures/entry";
import logService from "../../services/log.service";
import { ResourceScope } from "../../services/utils/misc.func";
import { Creature } from "./creature";
import { CreatureGroup } from "./creature-group";

export { collapseFilesByGame, type Family } from "./creature-group";

export abstract class CreatureFamily<T extends Creature> extends CreatureGroup<T> {
  fileType: ResourceScope = "f";

  constructor(id: MonsterFamilyEnum) {
    super(id);
    // Opens a log section for the whole family so the family-wide spells/items built next in the
    // subclass constructor (the "adding effect file/projectile" lines) get a heading and a blank
    // line separating them from the previous family's output, instead of trailing under it.
    logService.header(`Creating ${MonsterFamilyEnum[id]} family...`);
  }

  protected adopt(creature: T): void {
    creature.family = this.id;
  }

  protected memberFamily(): MonsterFamilyEnum {
    return this.id;
  }

  /**
   * Registers the versions of one monster (an entry), in order: members are documented and
   * installed in this order, so a base creature goes before variants that reuse its resources.
   */
  addEntry(id: EntryEnum, builders: (() => T)[]) {
    for (const build of builders) {
      const countBefore = this.creatures.length;
      this.addCreature(build);
      // addCreature keeps a creature whose build threw (valid = false) when create() ran, so
      // stamp whatever it pushed.
      for (const creature of this.creatures.slice(countBefore)) creature.entry = id;
    }
  }
}
