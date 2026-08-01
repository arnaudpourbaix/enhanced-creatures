import { StringReference } from "../model/final/stringref";
import { RaceIdentifier } from "../model/ids/race";
import { BaseEffect, Effect, ModifierTypeEffect } from "../model/spell-item/effect";
import {
  CharmTypeEnum,
  EffectBonusToEnum,
  EffectColorLocationEnum,
  EffectDispelResistanceEnum,
  EffectIDSFileEnum,
  EffectModifierTypeEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  EffectVisualEffectLocationEnum,
  LightingEffectEnum,
  LightingEffectTargetEnum,
  PortraitIconEnum,
  SaveTypeEnum,
} from "../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../model/spell-item/effect.type";
import creatureService from "../services/creature.service";
import effectService from "../services/effects/effect.service";
import spellService from "../services/spell.service";
import { StringRefUtils } from "../services/utils/string-ref.utils";

class EffectFactory {
  /**
   * Repeat the effects for the next rounds.
   * Limitations: each effect must be instant, meaning no duration at all
   */
  repeatEffect(rounds: number, effects: Effect[]): Effect[] {
    const results: Effect[] = effects.map((e) => ({
      ...e,
      timing: EffectTimingEnum.InstantPermanent,
    }));
    for (let i = 1; i < rounds; i++) {
      for (const effect of effects) {
        results.push({
          ...effect,
          timing: EffectTimingEnum.DelayPermanent,
          duration: i * 6,
        });
      }
    }
    return results;
  }

  paralyze(params: {
    duration: number;
    lightingEffect?: LightingEffectEnum;
    saveType?: SaveTypeEnum;
    saveBonus?: number;
    startSound?: string;
    endSound?: string;
    races?: RaceIdentifier[];
    pulse?: { blue: number; green: number; red: number; speed: number };
  }) {
    const base: { saveTypes?: SaveTypeEnum[]; saveBonus?: number } = {
      saveTypes: params.saveType !== undefined ? [params.saveType] : undefined,
      saveBonus: params.saveBonus,
    };
    const duration: { timing?: EffectTimingEnum; duration?: number } = {
      timing: EffectTimingEnum.InstantLimited,
      duration: params.duration,
    };
    const effects: Effect[] = [
      {
        opcode: EffectTypeEnum.DisplayPortraitIcon,
        icon: PortraitIconEnum.Held,
        ...duration,
        ...base,
      },
      {
        opcode: EffectTypeEnum.CharacterColorPulse,
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
        color: {
          blue: params.pulse?.blue ?? 0,
          green: params.pulse?.green ?? 57,
          red: params.pulse?.red ?? 87,
        },
        location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
        cycleSpeed: params.pulse?.speed ?? 25,
        ...base,
      },
      {
        opcode: EffectTypeEnum.LightingEffects,
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
        lightingTarget: LightingEffectTargetEnum.SpellTarget,
        effect: params.lightingEffect ?? LightingEffectEnum.NecromancyEarth,
        ...base,
      },
    ];
    if (params.startSound !== "") {
      effects.push({
        opcode: EffectTypeEnum.PlaySound,
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
        resource: params.startSound ?? "EFF_P11",
        ...base,
      });
    }
    if (params.endSound !== "") {
      effects.push({
        opcode: EffectTypeEnum.PlaySound,
        resource: params.endSound ?? "EFF_E05",
        ...duration,
        timing: EffectTimingEnum.DelayPermanent,
        ...base,
      });
    }
    if (params.races?.length) {
      for (const race of params.races) {
        effects.unshift({
          opcode: EffectTypeEnum.Hold,
          idsFile: EffectIDSFileEnum.RACE,
          idsEntry: race,
          ...duration,
          ...base,
        });
      }
    } else {
      effects.unshift({
        opcode: EffectTypeEnum.Hold,
        idsFile: EffectIDSFileEnum.EA,
        idsEntry: "ANYONE",
        ...duration,
        ...base,
      });
    }

    return effectService.getEffects(effects);
  }

  restrained(params: { duration: number; saveType?: SaveTypeEnum; saveBonus?: number }) {
    const base: { saveTypes?: SaveTypeEnum[]; saveBonus?: number } = {
      saveTypes: params.saveType ? [params.saveType] : undefined,
      saveBonus: params.saveBonus,
    };
    const duration: { timing?: EffectTimingEnum; duration?: number } = {
      timing: EffectTimingEnum.InstantLimited,
      duration: params.duration,
    };
    const effects: Effect[] = [
      {
        opcode: EffectTypeEnum.DisplayString,
        stringRef: "spell.restrained",
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
        ...base,
      },
      {
        opcode: EffectTypeEnum.LightingEffects,
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
        lightingTarget: LightingEffectTargetEnum.SpellTarget,
        effect: LightingEffectEnum.AbjurationEarth,
        ...base,
      },
      {
        opcode: EffectTypeEnum.Slow,
        ...duration,
        ...base,
      },
      {
        opcode: EffectTypeEnum.MovementRateBonus2,
        type: EffectModifierTypeEnum.Set,
        value: 0,
        ...duration,
        ...base,
      },
      {
        opcode: EffectTypeEnum.Thac0Bonus,
        type: EffectModifierTypeEnum.Increment,
        value: -4,
        ...duration,
        ...base,
      },
      {
        opcode: EffectTypeEnum.ArmorClassBonus,
        value: -4,
        bonusTo: EffectBonusToEnum.AllWeapons,
        ...duration,
        ...base,
      },
      {
        opcode: EffectTypeEnum.SaveVsBreathModifier,
        value: -4,
        type: EffectStatisticModifierEnum.Increment,
        ...duration,
        ...base,
      },
    ];
    return effectService.getEffects(effects);
  }

  cureAll() {
    const base: BaseEffect = {
      timing: EffectTimingEnum.InstantPermanentUntilDeath,
      target: EffectTargetEnum.Self,
    };
    const effects: Effect[] = [
      {
        opcode: EffectTypeEnum.CureBerserk,
        ...base,
      },
      {
        opcode: EffectTypeEnum.CureBlindness,
        ...base,
      },
      {
        opcode: EffectTypeEnum.CureConfusion,
        ...base,
      },
      {
        opcode: EffectTypeEnum.CureDeafness,
        ...base,
      },
      {
        opcode: EffectTypeEnum.CureDisease,
        ...base,
      },
      {
        opcode: EffectTypeEnum.CureFeeblemindedness,
        ...base,
      },
      {
        opcode: EffectTypeEnum.CurePoison,
        ...base,
      },
      {
        opcode: EffectTypeEnum.CureSleep,
        ...base,
      },
      {
        opcode: EffectTypeEnum.CureStun,
        ...base,
      },
      {
        opcode: EffectTypeEnum.RemoveParalysis,
        ...base,
      },
      {
        opcode: EffectTypeEnum.RemoveFear,
        ...base,
      },
    ];
    return effectService.getEffects(effects);
  }

  charm(payload: {
    charmType: CharmTypeEnum;
    duration: number;
    saveType?: SaveTypeEnum;
    saveBonus?: number;
    dispelResistance?: EffectDispelResistanceEnum;
  }) {
    const effects: Effect[] = [
      {
        opcode: EffectTypeEnum.CharmCreature,
        generalType: "HUMANOID",
        charmType: payload.charmType,
        timing: EffectTimingEnum.InstantLimited,
        duration: payload.duration,
        dispelResistance: payload.dispelResistance,
        saveTypes: payload.saveType !== undefined ? [payload.saveType] : undefined,
        saveBonus: payload.saveBonus,
      },
      {
        opcode: EffectTypeEnum.DisplayString,
        stringRef: StringRefUtils.getStringId("Dire charmed"),
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
        dispelResistance: payload.dispelResistance,
        saveTypes: payload.saveType !== undefined ? [payload.saveType] : undefined,
        saveBonus: payload.saveBonus,
      },
      {
        opcode: EffectTypeEnum.CharacterColorPulse,
        color: { red: 255, green: 144, blue: 147 },
        location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
        cycleSpeed: 30,
        timing: EffectTimingEnum.InstantLimited,
        duration: 1,
        dispelResistance: payload.dispelResistance,
        saveTypes: payload.saveType !== undefined ? [payload.saveType] : undefined,
        saveBonus: payload.saveBonus,
      },
      {
        opcode: EffectTypeEnum.PlayVisualEffect,
        playWhere: EffectVisualEffectLocationEnum.OverTargetAttached,
        resource: "SPNWCHRM",
        timing: EffectTimingEnum.InstantLimited,
        duration: 3,
        dispelResistance: payload.dispelResistance,
        saveTypes: payload.saveType !== undefined ? [payload.saveType] : undefined,
        saveBonus: payload.saveBonus,
      },
      {
        opcode: EffectTypeEnum.PlaySound,
        resource: "EFF_E07",
        timing: EffectTimingEnum.DelayLimited,
        duration: payload.duration,
        dispelResistance: payload.dispelResistance,
        saveTypes: payload.saveType !== undefined ? [payload.saveType] : undefined,
        saveBonus: payload.saveBonus,
      },
    ];
    return effectService.getEffects(effects);
  }

  blindness(params: {
    duration: number;
    saveType?: SaveTypeEnum;
    saveBonus?: number;
    dispelResistance?: EffectDispelResistanceEnum;
  }) {
    const effects: Effect[] = spellService.getGroupRessources("colorSpray").map((s) => ({
      opcode: EffectTypeEnum.ProtectionFromSpell,
      resource: s,
      timing: EffectTimingEnum.InstantLimited,
      duration: params.duration,
      dispelResistance: params.dispelResistance,
      saveTypes: params.saveType ? [params.saveType] : undefined,
      saveBonus: params.saveBonus,
    }));
    effects.push(
      {
        opcode: EffectTypeEnum.Blindness,
        timing: EffectTimingEnum.InstantLimited,
        duration: params.duration,
        dispelResistance: params.dispelResistance,
        saveTypes: params.saveType ? [params.saveType] : undefined,
        saveBonus: params.saveBonus,
      },
      {
        opcode: EffectTypeEnum.DisplayPortraitIcon,
        icon: PortraitIconEnum.Blind,
        timing: EffectTimingEnum.InstantLimited,
        duration: params.duration,
        dispelResistance: params.dispelResistance,
        saveTypes: params.saveType ? [params.saveType] : undefined,
        saveBonus: params.saveBonus,
      },
      {
        opcode: EffectTypeEnum.DisplayString,
        stringRef: StringRefUtils.getStringId("Blinded"),
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
        dispelResistance: params.dispelResistance,
        saveTypes: params.saveType ? [params.saveType] : undefined,
        saveBonus: params.saveBonus,
      },
    );
    return effectService.getEffects(effects);
  }

  fear(params: {
    duration: number;
    saveType?: SaveTypeEnum;
    saveBonus?: number;
    minLevel?: number;
    maxLevel?: number;
    dispelResistance?: EffectDispelResistanceEnum;
    startSound?: string;
    endSound?: string;
    stringRef?: StringReference;
  }) {
    const base: BaseEffect = {
      saveTypes: params.saveType !== undefined ? [params.saveType] : undefined,
      saveBonus: params.saveBonus,
      minLevel: params.minLevel,
      maxLevel: params.maxLevel,
    };
    const effects: Effect[] = [
      {
        opcode: EffectTypeEnum.Panic,
        timing: EffectTimingEnum.InstantLimited,
        duration: params.duration,
        dispelResistance: params.dispelResistance,
        ...base,
      },
      {
        opcode: EffectTypeEnum.DisplayPortraitIcon,
        timing: EffectTimingEnum.InstantLimited,
        icon: PortraitIconEnum.Panic,
        duration: params.duration,
        dispelResistance: params.dispelResistance,
        ...base,
      },
    ];
    if (params.startSound !== "") {
      effects.push({
        opcode: EffectTypeEnum.PlaySound,
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
        resource: "EFF_M07",
        dispelResistance: params.dispelResistance,
        ...base,
      });
    }
    if (params.endSound !== "") {
      effects.push({
        opcode: EffectTypeEnum.PlaySound,
        timing: EffectTimingEnum.DelayPermanent,
        resource: "EFF_E07",
        duration: params.duration,
        dispelResistance: params.dispelResistance,
        ...base,
      });
    }
    if (params.stringRef) {
      effects.push({
        opcode: EffectTypeEnum.DisplayString,
        stringRef: params.stringRef,
        ...base,
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
      });
    }
    return effectService.getEffects(effects);
  }

  levelDrain(params: { levels: number; saveType?: SaveTypeEnum; saveBonus?: number }) {
    let stringRef = StringRefUtils.getStringId("One Level Drained");
    if (params.levels === 2) {
      stringRef = StringRefUtils.getStringId("Two Levels Drained");
    } else if (params.levels === 3) {
      stringRef = StringRefUtils.getStringId("Three Levels Drained");
    }
    const effects: Effect[] = [
      {
        opcode: EffectTypeEnum.LevelDrain,
        amount: params.levels,
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
        saveTypes: params.saveType ? [params.saveType] : undefined,
        saveBonus: params.saveBonus,
      },
      {
        stringRef,
        opcode: EffectTypeEnum.DisplayString,
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
        saveTypes: params.saveType ? [params.saveType] : undefined,
        saveBonus: params.saveBonus,
      },
      {
        opcode: EffectTypeEnum.LightingEffects,
        effect: LightingEffectEnum.NecromancyEarth,
        lightingTarget: LightingEffectTargetEnum.SpellTarget,
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
        saveTypes: params.saveType ? [params.saveType] : undefined,
        saveBonus: params.saveBonus,
      },
    ];
    return effectService.getEffects(effects);
  }

  naturalMovementSpeed(pnpValue: number): ModifierTypeEffect {
    const effect: ModifierTypeEffect = {
      opcode: EffectTypeEnum.MovementRateBonus2,
      value: creatureService.convertMovement(pnpValue),
      type: EffectModifierTypeEnum.Set,
    };
    return effect;
  }
}

const effectFactory = new EffectFactory();
export default effectFactory;
