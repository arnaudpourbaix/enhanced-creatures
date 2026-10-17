import { EntryEnum } from "../../../creatures/entry";
import logService from "../../services/log.service";
import { ResourceScope } from "../../services/utils/misc.func";
import utils from "../../services/utils/utils.service";
import { Projectile } from "../spell-item/projectile";
import { Item, Spell } from "../spell-item/spell-item";
import { Creature } from "./creature";
import { CreatureGroup } from "./creature-group";
import { CreatureKin } from "./kin";

/**
 * One monster in several versions: builds its members (declaration order = install and docs
 * order) with the CreatureGroup API. Its own resources use scope `e` and the entry's code;
 * resources shared with other entries belong to its kin.
 */
export abstract class CreatureEntry<T extends Creature> extends CreatureGroup<T> {
  fileType: ResourceScope = "e";
  declare id: EntryEnum;
  kin?: CreatureKin;

  constructor(id: EntryEnum, kin?: CreatureKin) {
    super(id);
    this.kin = kin;
    logService.header(`Creating entry ${EntryEnum[id]}...`);
  }

  /** Mod-relative folder of its generated main.tpa, creature files and assets/. */
  get folder(): string {
    return utils.getEntryFolder(this.id);
  }

  protected adopt(creature: T): void {
    creature.entry = this.id;
    creature.folder = this.folder;
  }

  override item(id: number): Item {
    return this.withKin(
      () => super.item(id),
      (kin) => kin.item(id),
    );
  }

  override spell(id: number): Spell {
    return this.withKin(
      () => super.spell(id),
      (kin) => kin.spell(id),
    );
  }

  override projectile(id: number): Projectile {
    return this.withKin(
      () => super.projectile(id),
      (kin) => kin.projectile(id),
    );
  }

  // Own and members' resources first, then the kin's; the original error when none has it.
  private withKin<R>(own: () => R, fromKin: (kin: CreatureKin) => R): R {
    try {
      return own();
    } catch (e) {
      if (!this.kin) throw e;
      try {
        return fromKin(this.kin);
      } catch {
        throw e;
      }
    }
  }
}
