import { SPELLS } from "../config/spells/spell-names";
import { Durations } from "../src/model/game-data/durations";
import { BaseEffect, Effect } from "../src/model/spell-item/effect";
import {
  ColorEnum,
  EffectColorLocationEnum,
  EffectDispelResistanceEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  EffectVisualEffectLocationEnum,
  ItemAbilityCastingAnimationEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  PortraitIconEnum,
  SaveTypeEnum,
  SpellExclusionFlagEnum,
  SpellFlagEnum,
  SpellTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { Spell, SpellHeader } from "../src/model/spell-item/spell-item";
import spellService from "../src/services/spell.service";
import { StringRefUtils } from "../src/services/utils/string-ref.utils";

const baseEffect: BaseEffect = {
  dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
  saveTypes: [SaveTypeEnum.Spell],
};
const header: (level: number) => SpellHeader = (level: number) => ({
  type: ItemAbilityTypeEnum.Melee,
  location: ItemAbilityLocationEnum.Spell,
  target: ItemAbilityTargetEnum.AnyPointWithinRange,
  minLevel: level,
  range: 30,
  projectile: "CSPRAY",
  effects: [
    ...colorEffects,
    ...sleepEffects(level),
    ...blindEffects(level),
    ...confusionEffects(level),
  ],
});
const colorEffects: Effect[] = [
  {
    opcode: EffectTypeEnum.PauseTarget,
    timing: EffectTimingEnum.InstantLimited,
    target: EffectTargetEnum.Self,
    duration: 1,
    dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
  },
  {
    opcode: EffectTypeEnum.SetColor,
    color: ColorEnum.GhostlyGreen,
    location: EffectColorLocationEnum.ArmorBlueArmorTrimming,
    timing: EffectTimingEnum.InstantLimited,
    duration: Durations.round,
    ...baseEffect,
  },
  {
    opcode: EffectTypeEnum.SetColor,
    color: ColorEnum.DarkGhostlyPink,
    location: EffectColorLocationEnum.ArmorGreenHair,
    timing: EffectTimingEnum.InstantLimited,
    duration: Durations.round,
    ...baseEffect,
  },
  {
    opcode: EffectTypeEnum.SetColor,
    color: ColorEnum.GhostlyGreen,
    location: EffectColorLocationEnum.ArmorYellowSkinColor,
    timing: EffectTimingEnum.InstantLimited,
    duration: Durations.round,
    ...baseEffect,
  },
  {
    opcode: EffectTypeEnum.SetColor,
    color: ColorEnum.DarkGhostlyPink,
    location: EffectColorLocationEnum.ArmorRedStrapLeather,
    timing: EffectTimingEnum.InstantLimited,
    duration: Durations.round,
    ...baseEffect,
  },
  {
    opcode: EffectTypeEnum.SetColor,
    color: ColorEnum.GhostlyGreen,
    location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
    timing: EffectTimingEnum.InstantLimited,
    duration: Durations.round,
    ...baseEffect,
  },
  {
    opcode: EffectTypeEnum.SetColor,
    color: ColorEnum.DarkGhostlyPink,
    location: EffectColorLocationEnum.ArmorPinkMajorColor,
    timing: EffectTimingEnum.InstantLimited,
    duration: Durations.round,
    ...baseEffect,
  },
  {
    opcode: EffectTypeEnum.SetColor,
    color: ColorEnum.GhostlyGreen,
    location: EffectColorLocationEnum.ArmorTealMinorColor,
    timing: EffectTimingEnum.InstantLimited,
    duration: Durations.round,
    ...baseEffect,
  },
];
const sleepEffects: (level: number) => Effect[] = (level: number) => {
  const effects: Effect[] = [
    {
      opcode: EffectTypeEnum.Sleep,
      wakeOnDamage: true,
      timing: EffectTimingEnum.InstantLimited,
      duration: 4 * Durations.round,
      minLevel: 0,
      maxLevel: level,
      dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
      special: PortraitIconEnum.Sleep,
    },
  ];
  const results: Effect[] = [...effects];
  if (level > 5) {
    for (const effect of results) {
      effect.maxLevel = 5;
    }
    for (const effect of effects) {
      results.push({
        ...effect,
        minLevel: Math.min(6, level),
        maxLevel: level,
        saveTypes: [SaveTypeEnum.Spell],
      });
    }
  }
  return results;
};
const blindEffects: (level: number) => Effect[] = (level: number) => {
  const effects: Effect[] = [
    {
      opcode: EffectTypeEnum.Blindness,
      timing: EffectTimingEnum.InstantLimited,
      duration: 2 * Durations.round,
      minLevel: level + 1,
      maxLevel: level + 2,
      ...baseEffect,
    },
    {
      opcode: EffectTypeEnum.DisplayPortraitIcon,
      icon: PortraitIconEnum.Blind,
      timing: EffectTimingEnum.InstantLimited,
      duration: 2 * Durations.round,
      minLevel: level + 1,
      maxLevel: level + 2,
      ...baseEffect,
    },
    {
      opcode: EffectTypeEnum.CharacterColorPulse,
      color: { red: 127, green: 127, blue: 127 },
      location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
      cycleSpeed: 20,
      timing: EffectTimingEnum.InstantLimited,
      duration: 1,
      minLevel: level + 1,
      maxLevel: level + 2,
      ...baseEffect,
    },
    {
      opcode: EffectTypeEnum.DisplayString,
      stringRef: StringRefUtils.getStringId("Blinded"),
      timing: EffectTimingEnum.InstantPermanentUntilDeath,
      minLevel: level + 1,
      maxLevel: level + 2,
      ...baseEffect,
    },
    {
      opcode: EffectTypeEnum.PlayVisualEffect,
      playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
      timing: EffectTimingEnum.InstantLimited,
      duration: 3,
      resource: "SPH1HI01",
      minLevel: level + 1,
      maxLevel: level + 2,
      ...baseEffect,
    },
    {
      opcode: EffectTypeEnum.PlayVisualEffect,
      playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
      timing: EffectTimingEnum.InstantLimited,
      duration: 3,
      resource: "SPHLHI02",
      minLevel: level + 1,
      maxLevel: level + 2,
      ...baseEffect,
    },
  ];
  return effects;
};
const confusionEffects: (level: number) => Effect[] = (level: number) => {
  const effects: Effect[] = [
    {
      opcode: EffectTypeEnum.Confusion,
      timing: EffectTimingEnum.InstantLimited,
      duration: Durations.round,
      minLevel: level + 3,
      ...baseEffect,
    },
    {
      opcode: EffectTypeEnum.DisplayPortraitIcon,
      icon: PortraitIconEnum.Confused,
      timing: EffectTimingEnum.InstantLimited,
      duration: Durations.round,
      minLevel: level + 3,
      ...baseEffect,
    },
    {
      opcode: EffectTypeEnum.PlayVisualEffect,
      playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
      timing: EffectTimingEnum.InstantLimited,
      duration: Durations.round,
      resource: "SPCONFUS",
      minLevel: level + 3,
      ...baseEffect,
    },
    {
      opcode: EffectTypeEnum.CharacterColorPulse,
      color: { red: 255, green: 183, blue: 0 },
      location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
      cycleSpeed: -96,
      timing: EffectTimingEnum.InstantLimited,
      duration: 1,
      minLevel: level + 3,
      ...baseEffect,
    },
    {
      opcode: EffectTypeEnum.DisplayString,
      stringRef: StringRefUtils.getStringId("Confused"),
      timing: EffectTimingEnum.InstantPermanentUntilDeath,
      minLevel: level + 3,
      ...baseEffect,
    },
  ];
  return effects;
};

export const SPELL_COLOR_SPRAY: Spell = spellService.getSpell(
  {
    name: "spell.colorSpray.name",
    description: "spell.colorSpray.description",
    castingSound: "CAS_M08",
    flags: [SpellFlagEnum.Hostile],
    type: SpellTypeEnum.Wizard,
    exclusionFlags: [SpellExclusionFlagEnum.Abjurer],
    castingAnimation: ItemAbilityCastingAnimationEnum.Alteration,
    primaryType: ItemAbilityPrimaryTypeEnum.Transmuter,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    level: 1,
    icon: SPELLS.Wizard.ColorSpray.file,
    headers: [...Array(20).keys()].map((i) => header(i + 1)),
  },
  SPELLS.Wizard.ColorSpray.file,
);
