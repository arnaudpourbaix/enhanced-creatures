import { KinEnum } from "../../../creatures/kin";
import { TranslationKey } from "../../../translations/i18n";
import logService from "../../services/log.service";
import translationService from "../../services/translation.service";
import { ResourceScope } from "../../services/utils/misc.func";
import utils from "../../services/utils/utils.service";
import type { ImmunityName } from "../final/immunity";
import { Effect } from "../spell-item/effect";
import { Item } from "../spell-item/spell-item";
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

  /**
   * A trait several creatures equip as their own (see Item.shared): the monster's traits, worn by
   * the monster and by the bodies it rises in. Named "<monster> Traits" like a creature's own.
   */
  addSharedTrait(payload: {
    name: TranslationKey;
    immunities?: ImmunityName[];
    effects?: Effect[];
  }): Item {
    const stringRef = translationService.addCustomTranslation([
      `${translationService.from(payload.name)} ${translationService.from("common.creatureTraits")}`,
    ]);
    const item = this.createTraitItem({
      stringRef,
      immunities: payload.immunities,
      effects: payload.effects,
    });
    item.shared = true;
    return item;
  }

  /** Mod-relative folder of its generated main.tpa, common.tpa and assets/. */
  get folder(): string {
    return utils.getKinFolder(this.id);
  }
}

/**
 * A creature another entry built first and handed over through their kin, for this entry to
 * derive from; throws when that entry hasn't built (registry order or a failed build).
 */
export function builtBefore<T>(creature: T | undefined, name: string): T {
  if (!creature) throw new Error(`The ${name} entry must build first`);
  return creature;
}

/**
 * The kin an entry factory needs, with its own class (for its shared material and hand-overs);
 * throws when that kin isn't built or isn't of that class, instead of an unchecked cast.
 */
export function kinOf<T extends CreatureKin>(
  kins: ReadonlyMap<KinEnum, CreatureKin>,
  id: KinEnum,
  type: abstract new (...args: never[]) => T,
): T {
  const kin = kins.get(id);
  if (!kin) throw new Error(`Kin ${KinEnum[id]} is not built`);
  if (!(kin instanceof type)) throw new Error(`Kin ${KinEnum[id]} is not a ${type.name}`);
  return kin;
}
