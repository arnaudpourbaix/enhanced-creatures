import {
  poisonFatalDamage,
  poisonImmediateDeathDuration,
  PoisonModel,
  POISONS,
} from "../../../config/poison";
import { TranslationKey } from "../../../translations/i18n";
import effectFactory from "../../factories/effect.factory";
import { BaseEffect, Effect } from "../../model/spell-item/effect";
import {
  EffectBonusToEnum,
  EffectColorLocationEnum,
  EffectModifierTypeEnum,
  EffectStatisticModifierEnum,
  EffectTimingEnum,
  ItemAbilityTypeEnum,
  LightingEffectEnum,
  LightingEffectTargetEnum,
  PnPPoisonType,
  PoisonTypeEnum,
  PortraitIconEnum,
  SaveTypeEnum,
} from "../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { WeaponCastSpell } from "../../model/spell-item/spell-item";
import descriptionService from "../doc/description.service";
import logService from "../log.service";
import translationService from "../translation.service";

class PoisonService {
  // POISONS has one entry per PnPPoisonType member, so this is always found.
  private getPoisonModel(poisonType: PnPPoisonType): PoisonModel {
    const poison = POISONS.find((p) => p.type === poisonType);
    if (!poison) throw new Error(`Poison type ${poisonType} is not defined !`);
    return poison;
  }

  getSpell(payload: { poisonType: PnPPoisonType; saveBonus?: number }): WeaponCastSpell {
    const effects = this.getEffects(payload);
    const name = translationService.interpolate("common.poison.name", {
      type: payload.poisonType,
    });
    const description = this.getSpellDescription(payload);
    const isComplexPoison = payload.poisonType >= "O";
    const result: WeaponCastSpell = {
      spell: {
        name: translationService.addCustomTranslation([name]),
        description: translationService.addCustomTranslation([description]),
        secondaryType: "Poison",
        groups: ["poison"],
        headers: [{ type: ItemAbilityTypeEnum.Melee, effects }],
      },
    };
    if (isComplexPoison) {
      result.saveTypes = [SaveTypeEnum.ParalyzePoisonDeath];
      result.saveBonus = payload.saveBonus;
    }
    return result;
  }

  /**
   * A poison has to be administered in the way it is required to work. Each would work separately, requiring separate saving throws.
   * Effects from the source of the same name do not stack per rules. The stronger effect is what takes place.
   * They can still stack in the sense that if one ends and the other continues, the second then takes over.
   *
   * This is not implemented currently. A poison could be protected from itself to prevent further apply, but what target cures poison?
   * It would be immune to this poison for the remaining time, which is definitly not an option
   */
  private getEffects(payload: { poisonType: PnPPoisonType; saveBonus?: number }): Effect[] {
    const poison = this.getPoisonModel(payload.poisonType);
    const effects: Effect[] = [];
    if (poison.saveDamage) {
      effects.push(this.getSaveEffect(poison));
    }
    if (poison.type === "O") {
      effects.push(...this.getParalyticEffects(poison));
    } else if (poison.type === "P") {
      effects.push(...this.getWeakenEffects(poison));
    } else if (poison.type === "Q") {
      effects.push(...this.getComaEffects(poison));
    } else if (poison.type === "R") {
      effects.push(...this.getWeakDebilitativeEffects(poison));
    } else if (poison.type === "S") {
      effects.push(...this.getWraithSpiderEffects(poison));
    } else if (poison.duration === poisonImmediateDeathDuration) {
      effects.push(...this.getImmediateDeathEffects(poison, payload.saveBonus));
    } else {
      effects.push(...this.getTimeEffects(poison, payload.saveBonus));
    }
    return effects;
  }

  private getSpellDescription(payload: { poisonType: PnPPoisonType; saveBonus?: number }): string {
    const poison = this.getPoisonModel(payload.poisonType);
    const save = descriptionService.getSaveText({
      saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
      saveBonus: payload.saveBonus,
    });
    const duration = descriptionService.getDuration(poison.duration);
    if (payload.poisonType >= "O") {
      return translationService.interpolate(
        `common.poison.type${payload.poisonType}` as TranslationKey,
        { duration, save },
      );
    }
    const death = translationService.from("common.poison.death");
    const damage = translationService.interpolate("common.poison.damage", {
      damage: poison.damage,
      duration,
    });
    const saveDamage = translationService.interpolate("common.poison.saveDamage", {
      damage: poison.saveDamage,
    });
    return translationService.interpolate("common.poison.description", {
      save,
      damage: poison.damage === poisonFatalDamage ? death : damage,
      saveDamage: poison.saveDamage > 0 ? saveDamage : "",
    });
  }

  private getSaveEffect(poison: PoisonModel): Effect {
    return {
      opcode: EffectTypeEnum.Poison,
      icon: PortraitIconEnum.Poisoned,
      ...this.getEffect({
        label: "save",
        damage: poison.saveDamage,
        duration: poison.duration,
      }),
      timing: EffectTimingEnum.InstantLimited,
    };
  }

  private getImmediateDeathEffects(poison: PoisonModel, saveBonus?: number): Effect[] {
    const levels = [
      { min: 1, max: 2 },
      { min: 3, max: 4 },
      { min: 5, max: 6 },
      { min: 7, max: 8 },
      { min: 9, max: 10 },
      { min: 11, max: 15 },
      { min: 16, max: 40 },
    ];
    return levels.map((level) => {
      const maxHP =
        12 * Math.min(level.max, 9) +
        3 * Math.max(level.max - 9, 0) +
        5 * Math.min(level.max, 9) -
        poison.saveDamage;
      return {
        opcode: EffectTypeEnum.Poison,
        icon: PortraitIconEnum.Poisoned,
        ...this.getEffect({
          label: "death",
          damage: maxHP,
          duration: poisonImmediateDeathDuration,
        }),
        diceSize: level.min,
        diceThrown: level.max,
        timing: EffectTimingEnum.InstantLimited,
        saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
        saveBonus,
      };
    });
  }

  private getTimeEffects(poison: PoisonModel, saveBonus?: number): Effect[] {
    return [
      {
        opcode: EffectTypeEnum.Poison,
        icon: PortraitIconEnum.Poisoned,
        ...this.getEffect({
          label: "normal",
          damage: poison.damage - poison.saveDamage,
          duration: poison.duration,
        }),
        timing: EffectTimingEnum.InstantLimited,
        saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
        saveBonus,
      },
    ];
  }

  private getEffect({
    label,
    damage,
    duration,
  }: {
    label: string;
    damage: number;
    duration: number;
  }): {
    type: PoisonTypeEnum;
    amount: number;
    duration: number;
  } {
    if (damage > duration) return this.getAmountDamagePerSecondEffect({ damage, duration });
    else
      return this.getOneDamagePerAmountSecondEffect({
        label,
        damage,
        duration,
      });
  }

  private getOneDamagePerAmountSecondEffect({
    label,
    damage,
    duration,
  }: {
    label: string;
    damage: number;
    duration: number;
  }): {
    type: PoisonTypeEnum;
    amount: number;
    duration: number;
  } {
    const type = PoisonTypeEnum.OneDamagePerAmountSecond;
    const amount = Math.floor(duration / damage);
    let newDuration = duration;
    while (damage > newDuration / amount) newDuration++;
    const total = newDuration / amount;
    logService.log(
      `poison (1dmg/x seconds) (${label}) => ${damage}/${duration} ==> ${type}: ${amount}/${newDuration} (total=${total}, diff duration=${
        newDuration - duration
      })`,
    );
    return { type, amount, duration: newDuration };
  }

  private getAmountDamagePerSecondEffect({
    damage,
    duration,
  }: {
    damage: number;
    duration: number;
  }): {
    type: PoisonTypeEnum;
    amount: number;
    duration: number;
  } {
    const type = PoisonTypeEnum.AmountDamagePerSecond;
    const amount = Math.floor(damage / duration);
    let newDuration = duration;
    while (damage > amount * newDuration) newDuration++;
    // const total = amount * newDuration;
    // console.log(
    //   `poison (x dmg per second) (${label}) => ${damage}/${duration} ==> ${type}: ${amount}/${newDuration} (total=${total}, diff duration=${
    //     newDuration - duration
    //   })`
    // );
    return {
      type,
      amount,
      duration: newDuration,
    };
  }

  private getParalyticEffects(poison: PoisonModel): Effect[] {
    return effectFactory.paralyze({
      duration: poison.duration,
      saveType: SaveTypeEnum.ParalyzePoisonDeath,
    });
  }

  private getComaEffects(poison: PoisonModel): Effect[] {
    return [
      {
        opcode: EffectTypeEnum.Sleep,
        wakeOnDamage: false,
        duration: poison.duration,
      },
      {
        opcode: EffectTypeEnum.LightingEffects,
        lightingTarget: LightingEffectTargetEnum.SpellTarget,
        effect: LightingEffectEnum.InvocationEarth,
      },
      {
        opcode: EffectTypeEnum.CharacterColorPulse,
        color: { red: 119, green: 0, blue: 0 },
        location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
        cycleSpeed: 20,
      },
    ];
  }

  private getWeakenEffects(poison: PoisonModel): Effect[] {
    const base: BaseEffect = {
      timing: EffectTimingEnum.InstantLimited,
      duration: poison.duration,
    };
    const opcodes = [
      EffectTypeEnum.StrengthBonus,
      EffectTypeEnum.DexterityBonus,
      EffectTypeEnum.ConstitutionBonus,
      EffectTypeEnum.IntelligenceBonus,
      EffectTypeEnum.WisdomBonus,
      EffectTypeEnum.CharismaBonus,
    ];
    return [
      ...opcodes.map(
        (o) =>
          ({
            opcode: o,
            type: EffectStatisticModifierEnum.Percentage,
            value: 50,
            ...base,
          }) as Effect,
      ),
      {
        opcode: EffectTypeEnum.MovementRateBonus2,
        type: EffectModifierTypeEnum.SetPercentOf,
        value: 50,
      },
      {
        opcode: EffectTypeEnum.DisplayPortraitIcon,
        icon: PortraitIconEnum.AbilityScoreDrained,
        ...base,
      },
    ];
  }

  private getWeakDebilitativeEffects(poison: PoisonModel): Effect[] {
    const base: BaseEffect = {
      timing: EffectTimingEnum.InstantLimited,
      duration: poison.duration,
    };
    return [
      {
        opcode: EffectTypeEnum.ArmorClassBonus,
        bonusTo: EffectBonusToEnum.AllWeapons,
        value: -1,
        ...base,
      },
      {
        opcode: EffectTypeEnum.Thac0Bonus,
        type: EffectModifierTypeEnum.Increment,
        value: -1,
        ...base,
      },
      {
        opcode: EffectTypeEnum.DexterityBonus,
        type: EffectStatisticModifierEnum.Increment,
        value: -3,
        ...base,
      },
      {
        opcode: EffectTypeEnum.DisplayPortraitIcon,
        icon: PortraitIconEnum.AbilityScoreDrained,
        ...base,
      },
    ];
  }

  private getWraithSpiderEffects(poison: PoisonModel): Effect[] {
    return [
      {
        opcode: EffectTypeEnum.ConstitutionBonus,
        type: EffectStatisticModifierEnum.Increment,
        value: -5,
        timing: EffectTimingEnum.InstantLimited,
        duration: poison.duration,
      },
      {
        opcode: EffectTypeEnum.DisplayPortraitIcon,
        icon: PortraitIconEnum.AbilityScoreDrained,
        timing: EffectTimingEnum.InstantLimited,
        duration: poison.duration,
      },
      {
        opcode: EffectTypeEnum.ProtectionFromSpell,
        duration: poison.duration, // should gradually loose constitution for 5 rounds
        timing: EffectTimingEnum.InstantLimited,
      },
    ];
  }
}

const poisonService = new PoisonService();
export default poisonService;
