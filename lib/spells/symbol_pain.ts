import { SPELLS } from "../config/spells/spell-database";
import { NEW_SPELLS } from "../config/spells/spells";
import { Durations } from "../src/model/game-data/durations";
import { BaseEffect } from "../src/model/spell-item/effect";
import {
  EffectDispelResistanceEnum,
  EffectStatisticModifierEnum,
  EffectTimingEnum,
  ItemAbilityCastingAnimationEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  LightingEffectTargetEnum,
  PortraitIconEnum,
  SpellExclusionFlagEnum,
  SpellFlagEnum,
  SpellTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { Spell } from "../src/model/spell-item/spell-item";
import spellService from "../src/services/spell.service";

const base: BaseEffect = {
  dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
  power: 8,
};

const duration = 11 * Durations.turn;

const baseWithDuration: BaseEffect = {
  timing: EffectTimingEnum.InstantLimited,
  duration,
  ...base,
};

export const SPELL_SYMBOL_PAIN: Spell = spellService.getSpell(
  {
    name: "spell.SymbolPain.name",
    description: "spell.SymbolPain.description",
    castingSound: "CAS_P03",
    flags: [SpellFlagEnum.BreakSanctuary],
    type: SpellTypeEnum.Wizard,
    exclusionFlags: [SpellExclusionFlagEnum.Conjurer],
    castingAnimation: ItemAbilityCastingAnimationEnum.Conjuration,
    primaryType: ItemAbilityPrimaryTypeEnum.Conjurer,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    level: 8,
    icon: `${NEW_SPELLS.WizardSymbolOfPain}C`,
    headers: [
      {
        type: ItemAbilityTypeEnum.Ranged,
        location: ItemAbilityLocationEnum.Spell,
        icon: `${NEW_SPELLS.WizardSymbolOfPain}B`,
        target: ItemAbilityTargetEnum.AnyPointWithinRange,
        range: 30,
        speed: 3,
        projectile: "TRAPGLPN",
        effects: [
          {
            opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
            type: "UNDEAD_OR_GOLEM",
          },
          {
            opcode: EffectTypeEnum.DexterityBonus,
            type: EffectStatisticModifierEnum.Increment,
            value: -2,
            ...baseWithDuration,
          },
          {
            opcode: EffectTypeEnum.Thac0Bonus,
            type: EffectStatisticModifierEnum.Increment,
            value: -4,
            ...baseWithDuration,
          },
          {
            opcode: EffectTypeEnum.DisplayPortraitIcon,
            icon: PortraitIconEnum.AbilityScoreDrained, // 295 Pain
            ...baseWithDuration,
          },
          {
            opcode: EffectTypeEnum.LightingEffects,
            lightingTarget: LightingEffectTargetEnum.SpellTarget,
            effect: LightingEffectEnum.IllusionWater,
            //effect: LightingEffectEnum.ConjureAir,
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
            ...base,
          },
          {
            opcode: EffectTypeEnum.PlaySound,
            resource: "EFF_P04", // "EFF_P02",
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
            ...base,
          },
          {
            opcode: EffectTypeEnum.DisplayString,
            stringRef: "spell.SymbolPain.displayedText",
            timing: EffectTimingEnum.InstantPermanent,
            ...base,
          },
          {
            opcode: EffectTypeEnum.PlaySound,
            resource: "EFF_E05", // "EFF_E04",
            timing: EffectTimingEnum.DelayPermanent,
            duration,
            ...base,
          },
          {
            opcode: EffectTypeEnum.ProtectionFromSpell,
            ...baseWithDuration,
          },
        ],
      },
    ],
  },
  NEW_SPELLS.WizardSymbolOfPain,
);
