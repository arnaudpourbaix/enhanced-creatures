import { SpellGroupName } from "../../../config/spells/spell-group-name";
import { RawCreatureAbility } from "../creature/ability";
import { ItemSlot } from "../creature/item";
import { ImmunityName } from "../final/immunity";
import { StringReference } from "../final/stringref";
import { PartialBy, WithRequired } from "../utility-types";
import { Effect, EffectFile, PartialEffectFile } from "./effect";
import {
  AbilityDamageTypeEnum,
  EffectDispelResistanceEnum,
  ItemAbilityCastingAnimationEnum,
  ItemAbilityFlagEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  ItemAnimationEnum,
  ItemCategoryEnum,
  ItemFlagEnum,
  ProficiencyTypeEnum,
  SaveTypeEnum,
  SpellExclusionFlagEnum,
  SpellFlagEnum,
  SpellTypeEnum,
} from "./effect.enums";
import { EffectTypeEnum } from "./effect.type";
import { PartialProjectile, Projectile } from "./projectile";

export interface BaseSpell {
  /**
   * Filename for SPL file (without extension)
   */
  file: string;
  type: SpellTypeEnum;
  level: number;
  /** Translation key for this spell's display name when used as an ability, e.g. "spell.FrostFingers.name" */
  name?: StringReference;
}

/**
 * Controls whether/how a spell gets its own entry in the Abilities/Spellbook listing (see
 * documentation.service.ts's getCreatureSpell). Wherever the spell is cast from (e.g. a
 * weapon's CastSpell effect, see description.service.ts's getItemSpellDescription), its
 * description always shows inline too, regardless of this setting - the two are independent.
 * - "both": name and description both appear in the Abilities listing
 * - "name": only the name appears in the Abilities listing, no description popover
 * - false: no entry at all in the Abilities listing
 */
export type SpellDocOption = "both" | "name" | false;

export type SpellSecondaryType = ItemAbilitySecondaryTypeEnum | "Fear" | "Disease" | "Poison";

export interface Spell extends BaseSpell {
  /**
   * Used for retrieving a spell inside family factories
   */
  id?: number;

  name: StringReference;

  /**
   * Create a spell from another one
   */
  copyFrom?: string;

  /**
   * Will appear in documentation (default: both)
   */
  doc: SpellDocOption;

  /**
   * Will be used to add these new spells to various immunities
   */
  groups: SpellGroupName[];

  /**
   * Spellbook icon
   */
  icon?: string;
  description?: StringReference;
  castingSound?: string;
  castingAnimation?: ItemAbilityCastingAnimationEnum;
  primaryType?: ItemAbilityPrimaryTypeEnum;
  secondaryType?: SpellSecondaryType;
  flags?: SpellFlagEnum[];
  exclusionFlags?: SpellExclusionFlagEnum[];
  effects: Effect[];
  headers: SpellHeader[];
  /**
   * Array of min levels or boolean
   */
  deleteHeaders?: number[] | boolean;
  deleteOpcodes?: EffectTypeEnum[];
  /**
   * Options are applied last using a WEIDU function
   */
  options?: SpellOptions;
  memorizedCount?: number;
  effectFiles: EffectFile[];
  projectiles: Projectile[];
  ability?: RawCreatureAbility;
}

export interface SpellOptions {
  spellType?: SpellTypeEnum;
  castingTime?: number;
  removeInvisbilityOnCast?: boolean;
  /**
   * Spell will be removed and added again after set rounds, so you only need to memorize it once. (only work for innates)
   */
  renew?: number;
  /**
   * add racial resistances when it is relevant (default: true)
   */
  addRacialResistances?: boolean;
}

export interface Item {
  /**
   * Filename for ITM file (without extension)
   */
  file: string;
  /**
   * Create a spell from another one
   */
  copyFrom?: string;
  /**
   * Used for retrieving an item inside family factories
   */
  id?: number;
  /**
   * Will appear in documentation (default: true)
   */
  doc: boolean;
  stringRef?: StringReference;
  description?: StringReference;
  immunities: ImmunityName[];
  enchantment?: number;
  animation?: ItemAnimationEnum;
  category?: ItemCategoryEnum;
  proficiency?: ProficiencyTypeEnum;
  icon?: string;
  flags?: ItemFlagEnum[];
  effects: Effect[];
  header?: ItemHeader;
  equippedSlot: ItemSlot[];
  projectiles: Projectile[];
  /**
   * Creature's trait (use for documentation)
   */
  trait: boolean;
}

export interface ItemSpellHeader {
  type: ItemAbilityTypeEnum;
  range?: number;
  speed?: number;
  target?: ItemAbilityTargetEnum;
  location?: ItemAbilityLocationEnum;
  projectile?: string | PartialProjectile;
  /**
   * Memorized icon for spells
   */
  icon?: string;
  effects: Effect[];
}

export interface SpellHeader extends ItemSpellHeader {
  minLevel?: number;
  immunityEffect?: {
    names: ImmunityName[];
    duration: number;
    dispelResistance?: EffectDispelResistanceEnum;
    // saveTypes?: SaveTypeEnum[];
    // saveBonus?: number;
  };
}

export interface ItemHeader extends ItemSpellHeader {
  diceSize?: number;
  diceThrown?: number;
  bonusToHit?: number;
  damageBonus?: number;
  damageType?: AbilityDamageTypeEnum;
  abilityflags?: ItemAbilityFlagEnum[];
  animationSwing?: { overhand: number; backhand: number; thrust: number };
}

export type MemorizedSpellType = "priest" | "wizard" | "innate";

export type PartialSpellHeader = PartialBy<SpellHeader, "effects">;

export type PartialSpellOptionalKeys =
  "icon" | "effects" | "projectiles" | "doc" | "groups" | "level" | "type";

export type PartialSpell = PartialBy<
  Omit<Spell, "file" | "headers" | "effectFiles">,
  PartialSpellOptionalKeys
> & { headers?: PartialSpellHeader[]; effectFiles?: PartialEffectFile[] };

export type PartialItemHeader = PartialBy<ItemHeader, "effects">;

export type PartialItemOptionalKeys =
  "immunities" | "effects" | "projectiles" | "equippedSlot" | "doc" | "trait";

export type PartialItem = PartialBy<Omit<Item, "file" | "header">, PartialItemOptionalKeys> & {
  header?: PartialItemHeader;
};

export type PartialWeaponOptionalKeys = "immunities" | "effects" | "projectiles" | "doc" | "trait";

export type PartialWeapon = PartialBy<Omit<Item, "file" | "header">, PartialWeaponOptionalKeys> & {
  header: PartialItemHeader;
};

export type Weapon = WithRequired<Item, "header">;

export interface WeaponCastSpell {
  /**
   * Creating a new spell
   */
  spell: PartialSpell | string;
  resource?: string;
  probability1?: number;
  probability2?: number;
  saveTypes?: SaveTypeEnum[];
  saveBonus?: number;
  /**
   * removes after cast
   */
  remove?: boolean;
  /**
   * Rounds to wait before casting instead of instantly (e.g. an effect that only kicks in a
   * couple of rounds after the hit, like a phase spider phasing back out).
   */
  delay?: number;
  doc?: SpellDocOption;
}
