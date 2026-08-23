import { SpellProtectionName } from "../../../config/spells/spell-protection";
import { StringReference } from "../final/stringref";
import { AnimationIdentifiers } from "../ids/animate";
import { GeneralIdentifier } from "../ids/general";
import { SlotIdentifier } from "../ids/slot";
import { SplStateIdentifier } from "../ids/splstate";
import { StatsIdentifier } from "../ids/stats";
import {
  AnimationChangeTypeEnum,
  AttackModifierTypeEnum,
  BerserkTypeEnum,
  BonusHPHealFlagEnum,
  CastingFailureTypeEnum,
  CastingTimeModifierTypeEnum,
  CastSpellOnConditionTargetEnum,
  CastSpellOnConditionType,
  CharmTypeEnum,
  ColorEnum,
  DisableButtonEnum,
  DisableSpellcastingTypeEnum,
  DiseaseTypeEnum,
  DispelEffectTypeEnum,
  DispelEffectWeaponTypeEnum,
  EffectBonusToEnum,
  EffectCastSpellTypeEnum,
  EffectColorLocationEnum,
  EffectDamageModeEnum,
  EffectDamageTypeEnum,
  EffectDispelResistanceEnum,
  EffectFlagsEnum,
  EffectHasteTypeEnum,
  EffectIDSFileEnum,
  EffectModifierTypeEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTeleportTypeEnum,
  EffectTimingEnum,
  EffectVisualEffectLocationEnum,
  InvisibilityTypeEnum,
  KillTargetDeathTypeEnum,
  LightingEffectEnum,
  LightingEffectTargetEnum,
  OverrideCreatureDataFieldEnum,
  PoisonTypeEnum,
  PolymorphTypeEnum,
  PortraitIconEnum,
  ProficiencyTypeEnum,
  ProtectionFromWeaponsTypeEnum,
  RegenerationTypeEnum,
  RemoveEffectsByResourceTypeEnum,
  SaveTypeEnum,
  SetAnimationSequenceEnum,
  SummonCreatureModeEnum,
  TranslucencyTypeEnum,
  WingBuffetDirectionEnum,
} from "./effect.enums";
import { EffectTypeEnum } from "./effect.type";
import { SpellProtection } from "./spell-protection";

export interface BaseEffect {
  target?: EffectTargetEnum;
  power?: number;
  timing?: EffectTimingEnum;
  parameter1?: string;
  parameter2?: string;
  parameter3?: string;
  parameter4?: string;
  dispelResistance?: EffectDispelResistanceEnum;
  duration?: number;
  probability1?: number;
  probability2?: number;
  diceThrown?: number;
  diceSize?: number;
  minLevel?: number;
  maxLevel?: number;
  saveTypes?: SaveTypeEnum[];
  saveBonus?: number;
  flags?: EffectFlagsEnum[] | number;
  resource?: string;
  special?: number;
}

export type ArmorClassBonusEffect = BaseEffect & {
  opcode: EffectTypeEnum.ArmorClassBonus;
  value: number;
  bonusTo: EffectBonusToEnum;
};

export type CastSpellEffect = BaseEffect & {
  opcode: EffectTypeEnum.CastSpell;
  castingLevel?: number;
  type: EffectCastSpellTypeEnum;
};

export type DamageEffect = BaseEffect & {
  opcode: EffectTypeEnum.Damage;
  amount?: number;
  type: EffectDamageTypeEnum;
  damageMode?: EffectDamageModeEnum;
};

export type SetColorEffect = BaseEffect & {
  opcode: EffectTypeEnum.SetColor;
  color: ColorEnum;
  location: EffectColorLocationEnum;
};

export type DrainEffect = BaseEffect & {
  opcode:
    EffectTypeEnum.DrainItemCharges | EffectTypeEnum.DrainWizardSpells | EffectTypeEnum.LevelDrain;
  amount: number;
};

export type ColorPulseEffect = BaseEffect & {
  opcode: EffectTypeEnum.CharacterColorPulse | EffectTypeEnum.SetColorGlowPulse;
  color: {
    red: number;
    green: number;
    blue: number;
  };
  location: EffectColorLocationEnum;
  cycleSpeed: number;
};

export type SetColorGlowEffect = BaseEffect & {
  opcode: EffectTypeEnum.SetColorGlowSolid;
  color: {
    red: number;
    green: number;
    blue: number;
  };
  location: EffectColorLocationEnum;
};

export type StatisticModifierOpcode =
  | EffectTypeEnum.DexterityBonus
  | EffectTypeEnum.IntelligenceBonus
  | EffectTypeEnum.StrengthBonus
  | EffectTypeEnum.CharismaBonus
  | EffectTypeEnum.ConstitutionBonus
  | EffectTypeEnum.WisdomBonus
  | EffectTypeEnum.SlashingResistanceModifier
  | EffectTypeEnum.CrushingResistanceModifier
  | EffectTypeEnum.PiercingResistanceModifier
  | EffectTypeEnum.MissilesResistanceModifier
  | EffectTypeEnum.FireResistanceModifier
  | EffectTypeEnum.ColdResistanceModifier
  | EffectTypeEnum.MagicResistanceModifier
  | EffectTypeEnum.MagicalColdResistanceModifier
  | EffectTypeEnum.MagicalFireResistanceModifier
  | EffectTypeEnum.AcidResistanceModifier
  | EffectTypeEnum.ElectricityResistanceModifier
  | EffectTypeEnum.MagicDamageResistanceModifier
  | EffectTypeEnum.MaximumHPModifier
  | EffectTypeEnum.MoraleModifier
  | EffectTypeEnum.MoraleBreakModifier
  | EffectTypeEnum.FatigueBonus
  | EffectTypeEnum.AllSavingThrowsBonus
  | EffectTypeEnum.SaveVsBreathModifier
  | EffectTypeEnum.SaveVsDeathModifier
  | EffectTypeEnum.SaveVsPetrificationModifier
  | EffectTypeEnum.SaveVsSpellModifier
  | EffectTypeEnum.SaveVsWandModifier;

export type StatisticModifierEffect = BaseEffect & {
  opcode: StatisticModifierOpcode;
  value: number;
  type: EffectStatisticModifierEnum;
};

export type CastingTimeModifierEffect = BaseEffect & {
  opcode: EffectTypeEnum.CastingTimeModifier;
  value: number;
  type: CastingTimeModifierTypeEnum;
};

export type ModifierTypeOpcode =
  | EffectTypeEnum.AttackDamageBonus
  | EffectTypeEnum.MovementRateBonus
  | EffectTypeEnum.MovementRateBonus2
  | EffectTypeEnum.Thac0Bonus
  | EffectTypeEnum.OffhandThac0Bonus;

export type ModifierTypeEffect = BaseEffect & {
  opcode: ModifierTypeOpcode;
  value: number;
  type: EffectModifierTypeEnum;
};

export type IconEffect = BaseEffect & {
  opcode: EffectTypeEnum.DisplayPortraitIcon | EffectTypeEnum.PreventPortraitIcon;
  icon: PortraitIconEnum;
};

export type StringRefEffect = BaseEffect & {
  opcode:
    | EffectTypeEnum.DisplayString
    | EffectTypeEnum.ProtectionFromSpell
    | EffectTypeEnum.ProtectionFromDisplaySpecificString;
  stringRef?: StringReference;
};

export type LightingEffectsEffect = BaseEffect & {
  opcode: EffectTypeEnum.LightingEffects;
  lightingTarget: LightingEffectTargetEnum;
  effect: LightingEffectEnum;
};

export type PlayVisualEffect = BaseEffect & {
  opcode: EffectTypeEnum.PlayVisualEffect;
  playWhere: EffectVisualEffectLocationEnum;
  resource: string;
};

export type IdsEffectOpcode =
  | EffectTypeEnum.Slay
  | EffectTypeEnum.UseEFFFile
  | EffectTypeEnum.Paralyze
  | EffectTypeEnum.Hold
  | EffectTypeEnum.DamageVsCreatureTypeModifier
  | EffectTypeEnum.Thac0VsCreatureTypeModifier;

export type IdsEffect = BaseEffect & {
  opcode: IdsEffectOpcode;
  idsEntry: string;
  idsFile: EffectIDSFileEnum;
};

export type HasteEffect = BaseEffect & {
  opcode: EffectTypeEnum.Haste | EffectTypeEnum.Haste2;
  type: EffectHasteTypeEnum;
};

export type ProtectionFromOpcodeEffect = BaseEffect & {
  opcode: EffectTypeEnum.ProtectionFromOpcode;
  type: EffectTypeEnum;
};

export type PoisonEffect = BaseEffect & {
  opcode: EffectTypeEnum.Poison;
  amount: number;
  type: PoisonTypeEnum;
  icon?: PortraitIconEnum;
};

export type PoisonResistanceModifierEffect = BaseEffect & {
  opcode: EffectTypeEnum.PoisonResistanceModifier;
  value: number;
};

export type ProtectionFromResourceEffect = BaseEffect & {
  opcode: EffectTypeEnum.ProtectionFromResource | EffectTypeEnum.ProtectionFromResourceAndMessage;
  type: SpellProtectionName | SpellProtection;
  value?: string | number;
};

export type ScriptingStateModifierEffect = BaseEffect & {
  opcode: EffectTypeEnum.ScriptingStateModifier;
  value: number;
  state: StatsIdentifier;
};

export type SetExtendedSpellStateEffect = BaseEffect & {
  opcode: EffectTypeEnum.SetExtendedSpellState;
  state: SplStateIdentifier | (string & {});
};

export type CreatureRGBColorFadeEffect = BaseEffect & {
  opcode: EffectTypeEnum.CreatureRGBColorFade;
  color: {
    red: number;
    green: number;
    blue: number;
  };
  fadeSpeed: number;
};

export type TeleportEffect = BaseEffect & {
  opcode: EffectTypeEnum.Teleport;
  type: EffectTeleportTypeEnum;
};

export type DiseaseEffect = BaseEffect & {
  opcode: EffectTypeEnum.Disease;
  amount: number;
  type: DiseaseTypeEnum;
  frequencyMultiplier?: number;
  icon?: PortraitIconEnum;
};

export type RegenerationEffect = BaseEffect & {
  opcode: EffectTypeEnum.Regeneration;
  amount: number;
  type: RegenerationTypeEnum;
  icon?: PortraitIconEnum;
};

export type SleepEffect = BaseEffect & {
  opcode: EffectTypeEnum.Sleep | EffectTypeEnum.Sleep20HP;
  wakeOnDamage: boolean;
};

export type CharmCreatureEffect = BaseEffect & {
  opcode: EffectTypeEnum.CharmCreature | EffectTypeEnum.CharmControlCreature;
  generalType: GeneralIdentifier;
  charmType: CharmTypeEnum;
};

export type ProtectionFromProjectileEffect = BaseEffect & {
  opcode: EffectTypeEnum.ProtectionFromProjectile;
  projectile: number;
};

export type PolymorphIntoSpecificEffect = BaseEffect & {
  opcode: EffectTypeEnum.PolymorphIntoSpecific;
  type: PolymorphTypeEnum;
};

export type KillTargetEffect = BaseEffect & {
  opcode: EffectTypeEnum.KillTarget;
  displayText: boolean;
  type: KillTargetDeathTypeEnum;
};

export type BerserkEffect = BaseEffect & {
  opcode: EffectTypeEnum.Berserk;
  type: BerserkTypeEnum;
};

export type ProficiencyModifierEffect = BaseEffect & {
  opcode: EffectTypeEnum.ProficiencyModifier;
  amount: number;
  type: ProficiencyTypeEnum;
};

export type ProtectionFromWeaponsEffect = BaseEffect & {
  opcode: EffectTypeEnum.ProtectionFromWeapons;
  enchantment: number;
  type: ProtectionFromWeaponsTypeEnum;
};

export type TranslucencyEffect = BaseEffect & {
  opcode: EffectTypeEnum.Translucency;
  amount: number;
  type: TranslucencyTypeEnum;
};

export type MinimumHPEffect = BaseEffect & {
  opcode: EffectTypeEnum.MinimumHP;
  value: number;
};

export type CastSpellOnConditionEffect = BaseEffect & {
  opcode: EffectTypeEnum.CastSpellOnCondition;
  conditionTarget: CastSpellOnConditionTargetEnum;
  condition: CastSpellOnConditionType;
};

export type RemoveSpellTypeProtectionsEffect = BaseEffect & {
  opcode: EffectTypeEnum.RemoveSpellTypeProtections;
  maximumLevel: number;
  type: string;
};

export type DispelEffectsEffect = BaseEffect & {
  opcode: EffectTypeEnum.DispelEffects;
  level: number;
  dispelType?: DispelEffectTypeEnum;
  magicWeaponDispelType?: DispelEffectWeaponTypeEnum;
};

export type CurrentHPbonusEffect = BaseEffect & {
  opcode: EffectTypeEnum.CurrentHPbonus;
  value: number;
  type: EffectModifierTypeEnum;
  healFlags?: BonusHPHealFlagEnum;
};

export type CreateItemInSlotEffect = BaseEffect & {
  opcode: EffectTypeEnum.CreateItemInSlot;
  slot: SlotIdentifier;
};

export type RemoveOpcodeEffect = BaseEffect & {
  opcode: EffectTypeEnum.RemoveOpcode;
  opcodeToRemove: EffectTypeEnum;
  param: string;
};

export type InvisibilityEffect = BaseEffect & {
  opcode: EffectTypeEnum.Invisibility;
  type: InvisibilityTypeEnum;
};

export type MakeUnselectableEffect = BaseEffect & {
  opcode: EffectTypeEnum.MakeUnselectable;
  disableDialog: boolean;
};

export type NoCollisionDetectionEffect = BaseEffect & {
  opcode: EffectTypeEnum.NoCollisionDetection;
  passWalls: boolean;
};

export type OverrideCreatureDataEffect = BaseEffect & {
  opcode: EffectTypeEnum.OverrideCreatureData;
  field: OverrideCreatureDataFieldEnum;
  value: number;
};

export type AnimationChangeEffect = BaseEffect & {
  opcode: EffectTypeEnum.AnimationChange;
  animationId: AnimationIdentifiers;
  animationType: AnimationChangeTypeEnum;
};

export type ModifyAttacksPerRoundEffect = BaseEffect & {
  opcode: EffectTypeEnum.ModifyAttacksPerRound;
  /**
   * Between -5 and +5
   */
  value: number;
  type: AttackModifierTypeEnum;
};

export type DisableSpellcastingEffect = BaseEffect & {
  opcode: EffectTypeEnum.DisableSpellcasting;
  type: DisableSpellcastingTypeEnum;
  showMessage?: boolean;
};

export type DisableButtonEffect = BaseEffect & {
  opcode: EffectTypeEnum.DisableButton;
  button: DisableButtonEnum;
};

export type CreateWeaponEffect = BaseEffect & {
  opcode: EffectTypeEnum.CreateWeapon;
  amount: number;
};

export type TeleportFieldEffect = BaseEffect & {
  opcode: EffectTypeEnum.TeleportField;
  maxRange: number;
};

export type SummonCreatureEffect = BaseEffect & {
  opcode: EffectTypeEnum.SummonCreature;
  mode: SummonCreatureModeEnum;
};

export type CastingFailureEffect = BaseEffect & {
  opcode: EffectTypeEnum.CastingFailure;
  amount: number;
  type: CastingFailureTypeEnum;
};

export type RemoveEffectsByResource = BaseEffect & {
  opcode: EffectTypeEnum.RemoveEffectsByResource;
  type: RemoveEffectsByResourceTypeEnum;
};

export type MirrorImageEffect = BaseEffect & {
  opcode: EffectTypeEnum.MirrorImageEffect;
  amount: number;
};

export type SetAnimationSequenceEffect = BaseEffect & {
  opcode: EffectTypeEnum.SetAnimationSequence;
  sequence: SetAnimationSequenceEnum;
};

export type WingBuffetEffect = BaseEffect & {
  opcode: EffectTypeEnum.WingBuffet;
  /**
   * 0 to 255
   */
  speed: number;
  direction: WingBuffetDirectionEnum;
};

export type ParamLessOpcode =
  | EffectTypeEnum.Blindness
  | EffectTypeEnum.Confusion
  | EffectTypeEnum.CureBerserk
  | EffectTypeEnum.CureBlindness
  | EffectTypeEnum.CureConfusion
  | EffectTypeEnum.CureDeafness
  | EffectTypeEnum.CureDisease
  | EffectTypeEnum.CureFeeblemindedness
  | EffectTypeEnum.CurePoison
  | EffectTypeEnum.CureSleep
  | EffectTypeEnum.CureStun
  | EffectTypeEnum.Blur
  | EffectTypeEnum.DeathKill60HP
  | EffectTypeEnum.EntangleOverlay
  | EffectTypeEnum.Feeblemindedness
  | EffectTypeEnum.FindTraps
  | EffectTypeEnum.ForceVisible
  | EffectTypeEnum.GiveAbility
  | EffectTypeEnum.ImmunityToTurnUndead
  | EffectTypeEnum.Infravision
  | EffectTypeEnum.InvisibilityDetection
  | EffectTypeEnum.ModifyCollisionBehavior
  | EffectTypeEnum.Panic
  | EffectTypeEnum.PauseTarget
  | EffectTypeEnum.Petrification
  | EffectTypeEnum.PlaySound
  | EffectTypeEnum.ProtectionFromAnimation
  | EffectTypeEnum.ProtectionFromBackstab
  | EffectTypeEnum.RemoveCreature
  | EffectTypeEnum.RemoveFear
  | EffectTypeEnum.RemoveItem
  | EffectTypeEnum.RemoveParalysis
  | EffectTypeEnum.RemoveSpecificAreaEffect
  | EffectTypeEnum.RemoveSpell
  | EffectTypeEnum.SelectionCircleRemoval
  | EffectTypeEnum.Slow
  | EffectTypeEnum.Stun
  | EffectTypeEnum.Stun90HP
  | EffectTypeEnum.TeleportToTarget
  | EffectTypeEnum.Web;

export type ParamLessEffect = BaseEffect & {
  opcode: ParamLessOpcode;
};

export type Effect =
  | ParamLessEffect
  | AnimationChangeEffect
  | ArmorClassBonusEffect
  | BerserkEffect
  | CastingFailureEffect
  | CastingTimeModifierEffect
  | CastSpellEffect
  | CastSpellOnConditionEffect
  | ColorPulseEffect
  | CharmCreatureEffect
  | CreateItemInSlotEffect
  | CreateWeaponEffect
  | CreatureRGBColorFadeEffect
  | CurrentHPbonusEffect
  | DamageEffect
  | DisableButtonEffect
  | DisableSpellcastingEffect
  | DiseaseEffect
  | DispelEffectsEffect
  | DrainEffect
  | HasteEffect
  | IconEffect
  | IdsEffect
  | InvisibilityEffect
  | KillTargetEffect
  | LightingEffectsEffect
  | MakeUnselectableEffect
  | MinimumHPEffect
  | MirrorImageEffect
  | ModifierTypeEffect
  | ModifyAttacksPerRoundEffect
  | NoCollisionDetectionEffect
  | OverrideCreatureDataEffect
  | PlayVisualEffect
  | PoisonEffect
  | PoisonResistanceModifierEffect
  | PolymorphIntoSpecificEffect
  | ProficiencyModifierEffect
  | ProtectionFromOpcodeEffect
  | ProtectionFromProjectileEffect
  | ProtectionFromResourceEffect
  | ProtectionFromWeaponsEffect
  | RegenerationEffect
  | RemoveEffectsByResource
  | RemoveOpcodeEffect
  | RemoveSpellTypeProtectionsEffect
  | ScriptingStateModifierEffect
  | SetAnimationSequenceEffect
  | SetColorEffect
  | SetColorGlowEffect
  | SetExtendedSpellStateEffect
  | SleepEffect
  | StatisticModifierEffect
  | StringRefEffect
  | SummonCreatureEffect
  | TeleportEffect
  | TeleportFieldEffect
  | TranslucencyEffect
  | WingBuffetEffect;

export type EffectFile = Effect & { file: string };

export type PartialEffectFile = Effect & { file?: string };
