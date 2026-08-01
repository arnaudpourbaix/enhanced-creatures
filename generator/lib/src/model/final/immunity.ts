import { SpellGroupName } from "../../../config/spells/spell-group-name";
import { TranslationKey } from "../../../translations/i18n";
import { EquippedItem } from "../creature/item";
import { Effect } from "../spell-item/effect";
import { PortraitIconEnum } from "../spell-item/effect.enums";
import { EffectTypeEnum } from "../spell-item/effect.type";
import { StringReference } from "./stringref";

export type ImmunityName =
  | "abilityDrain"
  | "acid"
  | "acidResistance"
  | "acidSpells"
  | "airAffinity"
  | "backstab"
  | "bleeding"
  | "blindness"
  | "blindsight"
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
  | "earthAffinity"
  | "earthquake"
  | "elemental"
  | "energyDrain"
  | "entangle"
  | "extraplanar"
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
  | "magicResistance"
  | "magicMissile"
  | "magicDamage"
  | "magicDamageResistance"
  | "maze"
  | "mindSpells"
  | "missileDamage"
  | "missileDamageResistance"
  | "necromancyEffects"
  | "nonMagicalWeapons"
  | "nonSilverNonMagicalWeapons"
  | "ooze"
  | "petrification"
  | "physicalDamage"
  | "physicalDamageResistance"
  | "piercingDamage"
  | "piercingDamageResistance"
  | "plant"
  | "polymorph"
  | "poison"
  | "poisonResistance"
  | "poisonSpells"
  | "plusOneWeapons"
  | "plusTwoWeapons"
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
