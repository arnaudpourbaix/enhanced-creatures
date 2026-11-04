import { AbilityDamageTypeEnum } from "../src/model/spell-item/effect.enums";
import { TranslationKey } from "../translations/i18n";
import { MonsterItemIconEnum } from "./item";

/**
 * Natural weapon kinds and their defaults (see Creature.addNaturalWeapon). Everything that varies
 * per creature (speed, slot...) is an option, not a default. Paws are the claws kind, named
 * "common.naturalWeapon.paws".
 */
export type NaturalWeaponKind =
  "jaws" | "claws" | "fists" | "touch" | "stinger" | "pseudopod" | "branch";

export const NATURAL_WEAPONS: Record<
  NaturalWeaponKind,
  { name: TranslationKey; damageType: AbilityDamageTypeEnum; icon: MonsterItemIconEnum }
> = {
  jaws: {
    name: "common.naturalWeapon.jaws",
    damageType: AbilityDamageTypeEnum.Piercing,
    icon: MonsterItemIconEnum.Jaws,
  },
  claws: {
    name: "common.naturalWeapon.claws",
    damageType: AbilityDamageTypeEnum.Slashing,
    icon: MonsterItemIconEnum.Wolf,
  },
  fists: {
    name: "common.naturalWeapon.fists",
    damageType: AbilityDamageTypeEnum.Crushing,
    icon: MonsterItemIconEnum.Fist,
  },
  touch: {
    name: "common.naturalWeapon.touch",
    damageType: AbilityDamageTypeEnum.Crushing,
    icon: MonsterItemIconEnum.Fist,
  },
  stinger: {
    name: "common.naturalWeapon.stinger",
    damageType: AbilityDamageTypeEnum.Piercing,
    icon: MonsterItemIconEnum.Wolf,
  },
  pseudopod: {
    name: "common.naturalWeapon.pseudopod",
    damageType: AbilityDamageTypeEnum.Crushing,
    icon: MonsterItemIconEnum.Jelly,
  },
  branch: {
    name: "common.naturalWeapon.branch",
    damageType: AbilityDamageTypeEnum.Crushing,
    icon: MonsterItemIconEnum.Golem,
  },
};
