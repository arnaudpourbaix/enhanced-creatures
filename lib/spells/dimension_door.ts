import { SPELLS } from "../config/spells/spell-names";
import { Effect } from "../src/model/spell-item/effect";
import {
  EffectDispelResistanceEnum,
  EffectTargetEnum,
  EffectTeleportTypeEnum,
  EffectTimingEnum,
  EffectVisualEffectLocationEnum,
  InvisibilityTypeEnum,
  ItemAbilityCastingAnimationEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  LightingEffectTargetEnum,
  SpellExclusionFlagEnum,
  SpellFlagEnum,
  SpellTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { PartialSpell } from "../src/model/spell-item/spell-item";
import spellService from "../src/services/spell.service";

export const createDimensionDoor = ({
  spellLevel,
  renew,
  spellType,
  memorizedCount,
  effects,
}: {
  spellLevel: number;
  spellType: SpellTypeEnum;
  renew?: number;
  memorizedCount?: number;
  effects?: Effect[];
}): PartialSpell => ({
  memorizedCount,
  name: "spell.dimensionDoor.name",
  description: "spell.dimensionDoor.description",
  doc: "name",
  castingSound: "CAS_M08",
  flags: [SpellFlagEnum.NoLOSRequired],
  type: spellType,
  exclusionFlags: [SpellExclusionFlagEnum.Abjurer],
  castingAnimation: ItemAbilityCastingAnimationEnum.Alteration,
  primaryType: ItemAbilityPrimaryTypeEnum.Transmuter,
  secondaryType: ItemAbilitySecondaryTypeEnum.NonCombat,
  level: spellLevel,
  icon: SPELLS.Wizard.DimensionDoor.file,
  options: { renew },
  headers: [
    {
      type: ItemAbilityTypeEnum.Melee,
      location: [SpellTypeEnum.Wizard, SpellTypeEnum.Priest].includes(spellType)
        ? ItemAbilityLocationEnum.Spell
        : ItemAbilityLocationEnum.Ability,
      target: ItemAbilityTargetEnum.AnyPointWithinRange,
      range: 900,
      speed: 1,
      effects: [
        {
          opcode: EffectTypeEnum.LightingEffects,
          target: EffectTargetEnum.Self,
          lightingTarget: LightingEffectTargetEnum.SpellTarget,
          effect: LightingEffectEnum.HitDoor,
          timing: EffectTimingEnum.InstantPermanentUntilDeath,
          dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
        },
        {
          opcode: EffectTypeEnum.PlaySound,
          target: EffectTargetEnum.Self,
          resource: "EFF_M09",
          timing: EffectTimingEnum.InstantPermanentUntilDeath,
          dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
        },
        {
          opcode: EffectTypeEnum.PlayVisualEffect,
          target: EffectTargetEnum.Self,
          playWhere: EffectVisualEffectLocationEnum.AtTargetPoint,
          resource: "SPDIMNDR",
          timing: EffectTimingEnum.InstantLimited,
          duration: 1,
          dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
        },
        {
          opcode: EffectTypeEnum.Teleport,
          target: EffectTargetEnum.Self,
          type: EffectTeleportTypeEnum.Default,
          timing: EffectTimingEnum.DelayPermanent,
          duration: 1,
          dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
        },
        {
          opcode: EffectTypeEnum.Invisibility,
          type: InvisibilityTypeEnum.Normal,
          target: EffectTargetEnum.Self,
          timing: EffectTimingEnum.InstantLimited,
          duration: 1,
          dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
        },
        ...(effects ?? []),
      ],
    },
  ],
});

export const SPELL_DIMENSION_DOOR = spellService.getSpell(
  createDimensionDoor({
    spellLevel: 4,
    spellType: SpellTypeEnum.Wizard,
  }),
  SPELLS.Wizard.DimensionDoor.file,
);
