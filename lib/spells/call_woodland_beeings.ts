import { NEW_CREATURES } from "../config/creatures";
import { SPELLS } from "../config/spells/spell-names";
import { Durations } from "../src/model/game-data/durations";
import { Effect } from "../src/model/spell-item/effect";
import {
  EffectDispelResistanceEnum,
  EffectIDSFileEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  ItemAbilityLocationEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { Spell } from "../src/model/spell-item/spell-item";
import spellService from "../src/services/spell.service";

const baseEffect: Effect = {
  opcode: EffectTypeEnum.UseEFFFile,
  target: EffectTargetEnum.Self,
  idsFile: EffectIDSFileEnum.EA,
  idsEntry: "ANYONE",
  timing: EffectTimingEnum.InstantLimited,
  duration: 20 * Durations.round,
  dispelResistance: EffectDispelResistanceEnum.NotDispelBypassResistance,
};

export const SPELL_CALL_WOODLAND_BEEINGS: Spell = spellService.getSpell(
  {
    name: "spell.callWoodlandBeeings.name",
    description: "spell.callWoodlandBeeings.description",
    copyFrom: SPELLS.Priest.CallWoodlandBeeings.file,
    icon: SPELLS.Priest.CallWoodlandBeeings.file,
    deleteHeaders: true,
    effects: [
      {
        opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
        target: EffectTargetEnum.Self,
        type: "NOT_OUTDOOR_CHECK",
        timing: EffectTimingEnum.InstantLimited,
        dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
        duration: 1,
        resource: SPELLS.Priest.CallWoodlandBeeings.file,
      },
    ],
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        minLevel: 7,
        location: ItemAbilityLocationEnum.Spell,
        target: ItemAbilityTargetEnum.AnyPointWithinRange,
        range: 25,
        effects: [
          {
            ...baseEffect,
            resource: NEW_CREATURES.DryadSummon,
            probability1: 55,
          },
          {
            ...baseEffect,
            resource: NEW_CREATURES.HamadryadSummon,
            probability1: 85,
            probability2: 55,
          },
          {
            ...baseEffect,
            resource: NEW_CREATURES.Treant5hd,
            probability1: 100,
            probability2: 85,
          },
        ],
      },
      {
        type: ItemAbilityTypeEnum.Melee,
        minLevel: 10,
        location: ItemAbilityLocationEnum.Spell,
        target: ItemAbilityTargetEnum.AnyPointWithinRange,
        range: 25,
        effects: [
          {
            ...baseEffect,
            resource: NEW_CREATURES.HamadryadSummon,
            probability1: 55,
          },
          {
            ...baseEffect,
            resource: NEW_CREATURES.Treant5hd,
            probability1: 85,
            probability2: 55,
          },
          {
            ...baseEffect,
            resource: NEW_CREATURES.Treant7hd,
            probability1: 100,
            probability2: 85,
          },
        ],
      },
      {
        type: ItemAbilityTypeEnum.Melee,
        minLevel: 13,
        location: ItemAbilityLocationEnum.Spell,
        target: ItemAbilityTargetEnum.AnyPointWithinRange,
        range: 25,
        effects: [
          {
            ...baseEffect,
            resource: NEW_CREATURES.Treant7hd,
            probability1: 55,
          },
          {
            ...baseEffect,
            resource: NEW_CREATURES.Treant9hd,
            probability1: 85,
            probability2: 55,
          },
          {
            ...baseEffect,
            resource: NEW_CREATURES.Treant11hd,
            probability1: 100,
            probability2: 85,
          },
        ],
      },
    ],
  },
  SPELLS.Priest.CallWoodlandBeeings.file,
);
