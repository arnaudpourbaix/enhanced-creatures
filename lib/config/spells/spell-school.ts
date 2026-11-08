import { KitIdentifier } from "../../src/model/ids/kit";
import { ItemAbilityPrimaryTypeEnum } from "../../src/model/spell-item/effect.enums";

export interface SpellSchool {
  /** Schools this school's specialists cannot cast. */
  opposed: ItemAbilityPrimaryTypeEnum[];
  /** Kits that specialise in this school. */
  kits: KitIdentifier[];
}

/** Primary types that are real specialist schools. */
export type SpecialistSchool = Exclude<
  ItemAbilityPrimaryTypeEnum,
  | ItemAbilityPrimaryTypeEnum.None
  | ItemAbilityPrimaryTypeEnum.Generalist
  | ItemAbilityPrimaryTypeEnum.Wildmage
>;

/**
 * One entry per specialist school (keyed by the spell's primary type), so a
 * missing school is a type error.
 */
export const SPELL_SCHOOLS: Record<SpecialistSchool, SpellSchool> = {
  [ItemAbilityPrimaryTypeEnum.Abjurer]: {
    opposed: [ItemAbilityPrimaryTypeEnum.Illusionist, ItemAbilityPrimaryTypeEnum.Transmuter],
    kits: ["MAGESCHOOL_ABJURER"],
  },
  [ItemAbilityPrimaryTypeEnum.Conjurer]: {
    opposed: [ItemAbilityPrimaryTypeEnum.Invoker, ItemAbilityPrimaryTypeEnum.Diviner],
    kits: ["MAGESCHOOL_CONJURER"],
  },
  [ItemAbilityPrimaryTypeEnum.Diviner]: {
    opposed: [ItemAbilityPrimaryTypeEnum.Conjurer],
    kits: ["MAGESCHOOL_DIVINER"],
  },
  [ItemAbilityPrimaryTypeEnum.Enchanter]: {
    opposed: [ItemAbilityPrimaryTypeEnum.Invoker, ItemAbilityPrimaryTypeEnum.Necromancer],
    kits: ["MAGESCHOOL_ENCHANTER"],
  },
  [ItemAbilityPrimaryTypeEnum.Illusionist]: {
    opposed: [
      ItemAbilityPrimaryTypeEnum.Necromancer,
      ItemAbilityPrimaryTypeEnum.Invoker,
      ItemAbilityPrimaryTypeEnum.Abjurer,
    ],
    kits: ["MAGESCHOOL_ILLUSIONIST"],
  },
  [ItemAbilityPrimaryTypeEnum.Invoker]: {
    opposed: [ItemAbilityPrimaryTypeEnum.Conjurer, ItemAbilityPrimaryTypeEnum.Enchanter],
    kits: ["MAGESCHOOL_INVOKER"],
  },
  [ItemAbilityPrimaryTypeEnum.Necromancer]: {
    opposed: [ItemAbilityPrimaryTypeEnum.Enchanter, ItemAbilityPrimaryTypeEnum.Illusionist],
    kits: ["MAGESCHOOL_NECROMANCER"],
  },
  [ItemAbilityPrimaryTypeEnum.Transmuter]: {
    opposed: [ItemAbilityPrimaryTypeEnum.Abjurer, ItemAbilityPrimaryTypeEnum.Necromancer],
    kits: ["MAGESCHOOL_TRANSMUTER"],
  },
};
