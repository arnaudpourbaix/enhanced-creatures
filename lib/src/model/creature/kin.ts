import { KinEnum } from "../../../creatures/kin";
import logService from "../../services/log.service";
import { ResourceScope } from "../../services/utils/misc.func";
import utils from "../../services/utils/utils.service";
import { AbstractCreature } from "./abstract-creature";

/**
 * Material shared by several entries: its constructor creates the shared spells, items and
 * projectiles (scope `k`, named after the kin's code); its entries reach them through
 * `CreatureEntry.kin` (and the entry's spell()/item()/projectile() fallback).
 */
export abstract class CreatureKin extends AbstractCreature {
  fileType: ResourceScope = "k";
  declare id: KinEnum;

  constructor(id: KinEnum) {
    super(id);
    logService.header(`Creating kin ${KinEnum[id]}...`);
  }

  /** Mod-relative folder of its generated main.tpa, common.tpa and assets/. */
  get folder(): string {
    return utils.getKinFolder(this.id);
  }
}
