import { AbilityDamageTypeEnum } from "../src/model/spell-item/effect.enums";
import { MonsterItemIconEnum } from "./item";

/**
 * Natural weapon kinds and their defaults (see Creature.addNaturalWeapon). Everything that varies
 * per creature (name key, speed, slot...) is an option, not a default. Paws are the claws kind.
 */
export type NaturalWeaponKind =
  "jaws" | "claws" | "fists" | "touch" | "stinger" | "pseudopod" | "branch";

export const NATURAL_WEAPONS: Record<
  NaturalWeaponKind,
  { damageType: AbilityDamageTypeEnum; icon: MonsterItemIconEnum }
> = {
  jaws: { damageType: AbilityDamageTypeEnum.Piercing, icon: MonsterItemIconEnum.Jaws },
  claws: { damageType: AbilityDamageTypeEnum.Slashing, icon: MonsterItemIconEnum.Wolf },
  fists: { damageType: AbilityDamageTypeEnum.Crushing, icon: MonsterItemIconEnum.Fist },
  touch: { damageType: AbilityDamageTypeEnum.Crushing, icon: MonsterItemIconEnum.Fist },
  stinger: { damageType: AbilityDamageTypeEnum.Piercing, icon: MonsterItemIconEnum.Wolf },
  pseudopod: { damageType: AbilityDamageTypeEnum.Crushing, icon: MonsterItemIconEnum.Jelly },
  branch: { damageType: AbilityDamageTypeEnum.Crushing, icon: MonsterItemIconEnum.Golem },
};
