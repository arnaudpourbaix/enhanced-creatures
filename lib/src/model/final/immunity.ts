import { SpellGroupName } from "../../../config/spells/spell-group-name";
import { TranslationKey } from "../../../translations/i18n";
import { EquippedItem } from "../creature/item";
import { Effect } from "../spell-item/effect";
import { PortraitIconEnum } from "../spell-item/effect.enums";
import { EffectTypeEnum } from "../spell-item/effect.type";
import { StringReference } from "./stringref";

export type ImmunityName =
  | "aberration"
  | "abilityDrain"
  | "acid"
  | "acidResistance"
  | "acidSpells"
  | "airAffinity"
  | "animal"
  | "backstab"
  | "bleeding"
  | "blindness"
  | "blindsight"
  | "cat"
  | "charm"
  | "cloudSpells"
  | "cold"
  | "coldResistance"
  | "coldSpells"
  | "confusion"
  | "construct"
  | "criticalHit"
  | "crushingDamage"
  | "crushingDamageResistance"
  | "cureWoundSpells"
  | "causeWoundSpells"
  | "deathEffects"
  | "deathSpell"
  | "devourBrain"
  | "disease"
  | "dragon"
  | "earthAffinity"
  | "earthquake"
  | "elemental"
  | "energyDrain"
  | "entangle"
  | "fatigue"
  | "fear"
  | "fey"
  | "fire"
  | "fireResistance"
  | "fireSpells"
  | "fireballSpell"
  | "flameArrowSpell"
  | "gazeAttacks"
  | "ghostVisual1"
  | "ghostVisual2"
  | "ghostVisual3"
  | "giant"
  | "hold"
  | "hover"
  | "incorporeal"
  | "illusion"
  | "insectSpells"
  | "infravision"
  | "lightning"
  | "lightningResistance"
  | "lightningBoltSpell"
  | "lightningSpells"
  | "missileWeapons"
  | "magic"
  | "magicalBeast"
  | "magicalWeapons"
  | "magicResistance"
  | "magicMissile"
  | "magicDamage"
  | "magicDamageResistance"
  | "maze"
  | "mindSpells"
  | "missileDamage"
  | "missileDamageResistance"
  | "monstrousHumanoid"
  | "necromancyEffects"
  | "nonMagicalWeapons"
  | "nonSilverNonMagicalWeapons"
  | "ooze"
  | "outsider"
  | "petrification"
  | "physicalDamage"
  | "physicalDamageResistance"
  | "piercingDamage"
  | "piercingDamageResistance"
  | "planarEssence"
  | "plant"
  | "polymorph"
  | "poison"
  | "poisonResistance"
  | "poisonSpells"
  | "plusOneWeapons"
  | "plusTwoWeapons"
  | "plusThreeWeapons"
  | "seeInvisible"
  | "skeletal"
  | "slashingDamage"
  | "slashingDamageResistance"
  | "sleep"
  | "spider"
  | "stun"
  | "turnUndead"
  | "undead"
  | "vermin"
  | "vorpal"
  | "web";

export interface ImmunityConfig {
  name: ImmunityName;
  type: "trait" | "immunity" | "resistance";
  doc: boolean;
  /**
   * Docs-only trait (e.g. a creature type with no in-game effect): generates no WeiDU function,
   * no LPF call and no item effect.
   */
  docOnly: boolean;
  stringRef?: TranslationKey;
  description?: StringReference;
  immunities: ImmunityName[];
  preventEffects: EffectTypeEnum[];
  preventIcons: PortraitIconEnum[];
  displayIcons: PortraitIconEnum[];
  strings: string[];
  animations: string[];
  spellGroups: SpellGroupName[];
  displaySpellIneffective: boolean;
  /**
   * All effects are permanent (spl) or while equiped (itm)
   */
  effects: Effect[];
  /**
   * Will create an item and add it into chosen slot
   */
  itemSlot?: EquippedItem;
  overrides: ImmunityName[];
}
