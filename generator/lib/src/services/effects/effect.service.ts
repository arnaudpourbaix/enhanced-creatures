import {
  EXISTING_SPELL_PROTECTIONS,
  SpellProtectionName,
} from "../../../config/spells/spell-protection";
import {
  BaseEffect,
  DamageEffect,
  Effect,
  ProtectionFromResourceEffect,
  ScriptingStateModifierEffect,
} from "../../model/spell-item/effect";
import {
  DispelEffectTypeEnum,
  DispelEffectWeaponTypeEnum,
  EffectDamageModeEnum,
  EffectDispelResistanceEnum,
  EffectIDSFileEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  getCastSpellOnConditionValue,
} from "../../model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../model/spell-item/effect.type";
import { SpellProtection, SpellProtectionStat } from "../../model/spell-item/spell-protection";
import creatureService from "../creature.service";
import utils from "../utils/utils.service";

class EffectService {
  getEffects(
    effects: Effect[],
    options?: {
      base?: Required<Pick<BaseEffect, "target" | "timing">>;
      file?: string;
    },
  ): Effect[] {
    const results: Effect[] = effects.reduce<Effect[]>((acc, effect) => {
      acc.push(this.getEffect(effect, options));
      return acc;
    }, []);
    return results;
  }

  // Per-opcode special-casing (a handful of case bodies have their own nested `if`, e.g. Poison's
  // icon->special or Disease's frequencyMultiplier) keeps this over threshold even as a flat
  // switch. Splitting those into more functions would relocate the complexity, not reduce it -
  // same reasoning as SONARJS_ROADMAP.md's Tier 1 already documents for this exact function.
  // eslint-disable-next-line sonarjs/cognitive-complexity
  getEffect(
    effect: Effect,
    options?: {
      base?: Required<Pick<BaseEffect, "target" | "timing">>;
      file?: string;
    },
  ): Effect {
    this.setDefaultEffectValues(effect, options?.base);
    // Several case groups below share an identical body (e.g. `parameter1 = value/amount;
    // parameter2 = type` alone) purely by coincidence of the WeiDU opcode format - each group is
    // still keyed on a distinct EffectTypeEnum opcode/discriminated-union member (verified per
    // pair: AttackDamageBonus-group vs the Bonus/Resistance-group, Regeneration vs Poison,
    // Translucency vs ProficiencyModifier, CurrentHPbonus and CastingTimeModifier vs the
    // Bonus/Resistance-group, CastingFailure vs ProficiencyModifier). Merging them for Sonar's
    // sake would erase that per-opcode correspondence for no benefit - see SONARJS_ROADMAP.md.
    /* eslint-disable sonarjs/no-duplicated-branches */
    // 58 cases vs. this rule's 30 max - dispatches over EffectTypeEnum, a large real domain (WeiDU
    // opcodes). Splitting the switch wouldn't reduce real complexity, just relocate it across more
    // functions/files - see SONARJS_ROADMAP.md.
    // eslint-disable-next-line sonarjs/max-switch-cases
    switch (effect.opcode) {
      case EffectTypeEnum.ArmorClassBonus:
        effect.parameter1 = `${effect.value}`;
        effect.parameter2 = `${effect.bonusTo}`;
        break;
      case EffectTypeEnum.CastSpell:
        effect.parameter1 = `${effect.castingLevel ?? 0}`;
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.Damage:
        this.damage(effect);
        break;
      case EffectTypeEnum.DexterityBonus:
      case EffectTypeEnum.IntelligenceBonus:
      case EffectTypeEnum.CharismaBonus:
      case EffectTypeEnum.WisdomBonus:
      case EffectTypeEnum.StrengthBonus:
      case EffectTypeEnum.ConstitutionBonus:
      case EffectTypeEnum.SlashingResistanceModifier:
      case EffectTypeEnum.CrushingResistanceModifier:
      case EffectTypeEnum.PiercingResistanceModifier:
      case EffectTypeEnum.MissilesResistanceModifier:
      case EffectTypeEnum.FireResistanceModifier:
      case EffectTypeEnum.ColdResistanceModifier:
      case EffectTypeEnum.MagicalColdResistanceModifier:
      case EffectTypeEnum.MagicalFireResistanceModifier:
      case EffectTypeEnum.AcidResistanceModifier:
      case EffectTypeEnum.ElectricityResistanceModifier:
      case EffectTypeEnum.MagicDamageResistanceModifier:
      case EffectTypeEnum.MagicResistanceModifier:
      case EffectTypeEnum.MoraleModifier:
      case EffectTypeEnum.MaximumHPModifier:
      case EffectTypeEnum.MoraleBreakModifier:
      case EffectTypeEnum.FatigueBonus:
      case EffectTypeEnum.AllSavingThrowsBonus:
      case EffectTypeEnum.SaveVsBreathModifier:
      case EffectTypeEnum.SaveVsDeathModifier:
      case EffectTypeEnum.SaveVsPetrificationModifier:
      case EffectTypeEnum.SaveVsSpellModifier:
      case EffectTypeEnum.SaveVsWandModifier:
        effect.parameter1 = `${effect.value}`;
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.AttackDamageBonus:
      case EffectTypeEnum.MovementRateBonus:
      case EffectTypeEnum.MovementRateBonus2:
      case EffectTypeEnum.Thac0Bonus:
      case EffectTypeEnum.OffhandThac0Bonus:
        effect.parameter1 = `${effect.value}`;
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.DisplayPortraitIcon:
      case EffectTypeEnum.PreventPortraitIcon:
        effect.parameter2 = `${effect.icon}`;
        break;
      case EffectTypeEnum.DisplayString:
      case EffectTypeEnum.ProtectionFromSpell:
      case EffectTypeEnum.ProtectionFromDisplaySpecificString:
        if (effect.stringRef) {
          effect.parameter1 = utils.resolveStringRef(effect.stringRef) ?? "";
        }
        break;
      case EffectTypeEnum.LightingEffects:
        effect.parameter1 = `${effect.lightingTarget}`;
        effect.parameter2 = `${effect.effect}`;
        break;
      case EffectTypeEnum.PlayVisualEffect:
        effect.parameter2 = `${effect.playWhere}`;
        break;
      case EffectTypeEnum.RemoveEffectsByResource:
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.Slay:
      case EffectTypeEnum.UseEFFFile:
      case EffectTypeEnum.Paralyze:
      case EffectTypeEnum.Hold:
      case EffectTypeEnum.DamageVsCreatureTypeModifier:
      case EffectTypeEnum.Thac0VsCreatureTypeModifier:
        effect.parameter1 = `IDS_OF_SYMBOL (~${
          EffectIDSFileEnum[effect.idsFile]
        }~ ~${effect.idsEntry}~)`;
        effect.parameter2 = `${effect.idsFile}`;
        break;
      case EffectTypeEnum.CharacterColorPulse:
      case EffectTypeEnum.SetColorGlowPulse:
        effect.parameter1 = `${
          (effect.color.red << 8) + (effect.color.green << 16) + (effect.color.blue << 24)
        }`;
        effect.parameter2 = `${effect.location + (effect.cycleSpeed << 16)}`;
        break;
      case EffectTypeEnum.SetColor:
        effect.parameter1 = `${effect.color}`;
        effect.parameter2 = `${effect.location}`;
        break;
      case EffectTypeEnum.SetColorGlowSolid:
        effect.parameter1 = `${
          (effect.color.red << 8) + (effect.color.green << 16) + (effect.color.blue << 24)
        }`;
        effect.parameter2 = `${effect.location}`;
        break;
      case EffectTypeEnum.Haste:
      case EffectTypeEnum.Haste2:
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.ProtectionFromOpcode:
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.Poison:
        effect.parameter1 = `${effect.amount}`;
        effect.parameter2 = `${effect.type}`;
        if (effect.icon) effect.special = effect.icon;
        break;
      case EffectTypeEnum.PoisonResistanceModifier:
        effect.parameter1 = `${effect.value}`;
        break;
      case EffectTypeEnum.TeleportField:
        effect.parameter1 = `${effect.maxRange}`;
        break;
      case EffectTypeEnum.ProtectionFromResource:
      case EffectTypeEnum.ProtectionFromResourceAndMessage:
        this.protectionFromResource(effect);
        break;
      case EffectTypeEnum.ScriptingStateModifier:
        this.scriptingStateModifier(effect);
        break;
      case EffectTypeEnum.SetExtendedSpellState:
        effect.parameter2 = `(IDS_OF_SYMBOL (~splstate~ ~${effect.state}~))`;
        effect.special = 1;
        break;
      case EffectTypeEnum.CreatureRGBColorFade:
        effect.parameter1 = `${
          (effect.color.red << 8) + (effect.color.green << 16) + (effect.color.blue << 24)
        }`;
        effect.parameter2 = `${effect.fadeSpeed << 16}`;
        break;
      case EffectTypeEnum.Teleport:
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.MinimumHP:
        effect.parameter1 = `${effect.value}`;
        break;
      case EffectTypeEnum.Disease:
        effect.parameter1 = `${effect.amount}`;
        effect.parameter2 = `${effect.type}`;
        if (effect.frequencyMultiplier) {
          effect.parameter4 = `${effect.frequencyMultiplier}`;
        }
        if (effect.icon) effect.special = effect.icon;
        break;
      case EffectTypeEnum.Regeneration:
        effect.parameter1 = `${effect.amount}`;
        effect.parameter2 = `${effect.type}`;
        if (effect.icon) effect.special = effect.icon;
        break;
      case EffectTypeEnum.Sleep:
      case EffectTypeEnum.Sleep20HP:
        effect.parameter2 = `${effect.wakeOnDamage ? 0 : 1}`;
        break;
      case EffectTypeEnum.CharmCreature:
      case EffectTypeEnum.CharmControlCreature:
        effect.parameter1 = `IDS_OF_SYMBOL (~GENERAL~ ~${effect.generalType}~)`;
        effect.parameter2 = `${effect.charmType}`;
        break;
      case EffectTypeEnum.ProtectionFromProjectile:
        effect.parameter2 = `${effect.projectile}`;
        break;
      case EffectTypeEnum.PolymorphIntoSpecific:
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.KillTarget:
        effect.parameter1 = `${effect.displayText ? 0 : 1}`;
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.LevelDrain:
        effect.parameter1 = `${effect.amount}`;
        break;
      case EffectTypeEnum.Berserk:
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.ProficiencyModifier:
        effect.parameter1 = `${effect.amount}`;
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.DispelEffects:
        if (effect.dispelType !== undefined)
          effect.parameter1 = DispelEffectTypeEnum[effect.dispelType];
        if (effect.magicWeaponDispelType !== undefined)
          effect.parameter2 = DispelEffectWeaponTypeEnum[effect.magicWeaponDispelType];
        break;
      case EffectTypeEnum.ProtectionFromWeapons:
        effect.parameter1 = `${effect.enchantment}`;
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.Translucency:
        effect.parameter1 = `${effect.amount}`;
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.CastSpellOnCondition:
        effect.parameter1 = `${effect.conditionTarget}`;
        effect.parameter2 = `${getCastSpellOnConditionValue(effect.condition)}`;
        break;
      case EffectTypeEnum.RemoveSpellTypeProtections:
        effect.parameter1 = `${effect.maximumLevel}`;
        effect.parameter2 = effect.type;
        break;
      case EffectTypeEnum.CurrentHPbonus:
        effect.parameter1 = `${effect.value}`;
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.CreateItemInSlot:
        effect.parameter1 = `IDS_OF_SYMBOL (~slots~ ~${effect.slot}~)`;
        break;
      case EffectTypeEnum.RemoveOpcode:
        effect.parameter1 = effect.param;
        effect.parameter2 = `${effect.opcodeToRemove}`;
        break;
      case EffectTypeEnum.Invisibility:
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.MakeUnselectable:
        if (!effect.disableDialog) effect.parameter1 = `1`;
        effect.parameter2 = `1`;
        break;
      case EffectTypeEnum.NoCollisionDetection:
        if (!effect.passWalls) effect.parameter2 = `1`;
        break;
      case EffectTypeEnum.OverrideCreatureData:
        effect.parameter1 = `${effect.value}`;
        effect.parameter2 = `${effect.field}`;
        break;
      case EffectTypeEnum.AnimationChange:
        effect.parameter1 = `IDS_OF_SYMBOL (~animate~ ~${effect.animationId}~)`;
        effect.parameter2 = `${effect.animationType}`;
        break;
      case EffectTypeEnum.ModifyAttacksPerRound: {
        const apr = creatureService.getAttacksPerRound(effect.value);
        if (apr.doubleApr)
          throw new Error(`Can't have more than 5 APR in an effect: ${effect.value}`);
        effect.parameter1 = `${apr.value}`;
        effect.parameter2 = `${effect.type}`;
        break;
      }
      case EffectTypeEnum.DisableSpellcasting:
        effect.parameter2 = `${effect.type}`;
        if (effect.showMessage === false) effect.special = 1;
        break;
      case EffectTypeEnum.CastingFailure:
        effect.parameter1 = `${effect.amount}`;
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.MirrorImageEffect:
        effect.parameter1 = `${effect.amount}`;
        break;
      case EffectTypeEnum.DisableButton:
        effect.parameter2 = `${effect.button}`;
        break;
      case EffectTypeEnum.CreateWeapon:
        effect.parameter1 = `${effect.amount}`;
        break;
      case EffectTypeEnum.ImmunityToTurnUndead:
      case EffectTypeEnum.ProtectionFromBackstab:
      case EffectTypeEnum.InvisibilityDetection:
      case EffectTypeEnum.ModifyCollisionBehavior:
        effect.parameter2 = `1`;
        break;
      case EffectTypeEnum.CastingTimeModifier:
        effect.parameter1 = `${effect.value}`;
        effect.parameter2 = `${effect.type}`;
        break;
      case EffectTypeEnum.SummonCreature:
        effect.parameter2 = `${effect.mode}`;
        break;
      case EffectTypeEnum.SetAnimationSequence:
        effect.parameter2 = `${effect.sequence}`;
        break;
      case EffectTypeEnum.WingBuffet:
        effect.parameter1 = `${effect.speed}`;
        effect.parameter2 = `${effect.direction}`;
        break;
    }
    /* eslint-enable sonarjs/no-duplicated-branches */
    return effect;
  }

  private damage(effect: DamageEffect) {
    const mode = effect.damageMode ?? EffectDamageModeEnum.Normal;
    const type = effect.type;
    effect.parameter1 = `${effect.amount ?? 0}`;
    effect.parameter2 = `${mode + (type << 16)}`;
  }

  private protectionFromResource(effect: ProtectionFromResourceEffect) {
    const isValueString = typeof effect.value === "string" && !/\d+/.test(effect.value);
    if (effect.value !== undefined && !isValueString) effect.parameter1 = `${effect.value}`;
    if (typeof effect.type === "string")
      this.protectionFromResourceFromName(effect, effect.type, isValueString);
    else this.protectionFromResourceFromObject(effect, effect.type, isValueString);
  }

  private protectionFromResourceFromName(
    effect: ProtectionFromResourceEffect,
    type: SpellProtectionName,
    isValueString: boolean,
  ) {
    effect.parameter2 = type;
    if (isValueString) throw new Error(`Can't determine param1 in ${JSON.stringify(effect)}`);
  }

  private protectionFromResourceFromObject(
    effect: ProtectionFromResourceEffect,
    type: SpellProtection,
    isValueString: boolean,
  ) {
    type.value = type.value ?? -1;
    // EXISTING_SPELL_PROTECTIONS's stat/relation fields are typed as plain string/number
    // (inferred, no `as const`) - widen type's enum-typed fields to match rather than loosen the
    // shared config table's inferred types.
    const prot = EXISTING_SPELL_PROTECTIONS.find((p) => {
      const statMatches = p.stat === (type.stat as string);
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
      const relationMatches = p.relation === (type.relation as number);
      return statMatches && relationMatches && p.value == type.value;
    });
    if (!prot) throw new Error(`Unknown spell protection: ${JSON.stringify(type)}`);
    effect.parameter2 = `${prot.index}`;
    if (!isValueString) return;
    const file = utils.getIdsFileFromSpellProtectionStat(prot.stat as SpellProtectionStat);
    if (!file) throw new Error(`Can't find IDS file for: ${JSON.stringify(type)}`);
    effect.parameter1 = `IDS_OF_SYMBOL (~${file}~ ~${effect.value ?? ""}~)`;
  }

  private scriptingStateModifier(effect: ScriptingStateModifierEffect): void {
    if (effect.value < 0 || effect.value > 35)
      throw new Error(
        `Value for opcode ${EffectTypeEnum.ScriptingStateModifier} must be between 0 and 35, found: ${effect.value}`,
      );
    effect.parameter1 = `${effect.value}`;
    effect.parameter2 = `IDS_OF_SYMBOL (~stat~ ~${effect.state}~) - 156`;
  }

  setDefaultEffectValues(effect: Effect, base?: Required<Pick<BaseEffect, "target" | "timing">>) {
    effect.target ??= base?.target ?? EffectTargetEnum.PresetTarget;
    effect.timing ??= base?.timing ?? EffectTimingEnum.InstantLimited;
    effect.dispelResistance ??= EffectDispelResistanceEnum.NaturalNonMagical;
    effect.probability1 ??= 100;
    effect.diceSize ??= effect.minLevel;
    effect.diceThrown ??= effect.maxLevel;
  }
}

const effectService = new EffectService();
export default effectService;
