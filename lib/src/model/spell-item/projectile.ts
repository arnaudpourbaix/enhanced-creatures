import { TranslationKey } from "../../../translations/i18n";
import { EffectIDSFileEnum } from "./effect.enums";

export enum ProjectileExplosionEffectEnum {
  FIRE = 0,
  CLOUD = 1,
  CLOUDKILL = 2,
  STORM = 3,
  GREASE = 4,
  WEB = 5,
  METEOR = 6,
  WILTING = 7,
  WEIRD = 8,
  ENTANGLE = 9,
  COLORSPRAY = 10,
  CONECOLD = 11,
  HOLYSMITE = 12,
  UNHOLYSMITE = 13,
  PRISMATICSPRAY = 14,
  DRAGONFIRE = 15,
  STORMOFVENGEANCE = 16,
  DRAGONPURPLEFIRE = 17,
  DRAGONACID = 18,
  CUSTOM = 254,
  NONE = 255,
}

export enum ProjectileAnimationEnum {
  FIRE_RING = "0x0000",
  FIRE_RING_BRIGHT = "0x0001",
  CHUNKS = "0x0100",
  EXPLODING_ARM = "0x0200",
  EXPLODING_HEAD = "0x0210",
  EXPLODING_FOOT = "0x0220",
  EXPLODING_TORSO = "0x0230",
  EXPLODING_LEG = "0x0240",
  SMOKE_PUFF_LARGE = "0x0300",
  SMOKE_PUFF_SMALL = "0x0301",
  TRAP_SKULL = "0x0400",
  TRAP_GLYPH = "0x0410",
  CLOUD_TRAVEL = "0x0500",
  CLOUD_STATIC = "0x0510",
  STORM_TRAVEL = "0x0600",
  STORM_STATIC = "0x0610",
  GREASE_TRAVEL = "0x0700",
  GREASE_STATIC = "0x0710",
  WEB_TRAVEL = "0x0800",
  WEB_STATIC = "0x0810",
  NULL_ANIMATION = "0x4001",
}

export enum AreaProjectileEnum {
  TrapVisible = 0,
  TriggeredByInanimateObjects = 1,
  TriggeredByCondition = 2,
  DelayedTrigger = 3,
  UseSecondaryProjectile = 4,
  UseFragmentGraphics = 5,
  AffectOnlyEnemies = 6,
  AffectOnlyAllies = 7,
  MageLevelDuration = 8,
  ClericLevelDuration = 9,
  DrawAnimation = 10,
  Coneshaped = 11,
  IgnoreLOS = 12,
  DelayedExplosion = 13,
  SkipFirstCondition = 14,
  SingleTarget = 15,
}

export enum ProjectileTypeEnum {
  AreaOfEffect = 3,
  NoBAM = 1,
  SingleTarget = 2,
}

export enum ProjectileBehaviorEnum {
  ShowSparkle = 0,
  UseHeight = 1,
  LoopFireSound = 2,
  LoopImpactSound = 3,
  IgnoreCenter = 4,
  DrawAsBackground = 5,
  AllowSavingGame = 6,
  LoopSpreadAnimation = 7,
}

export enum ParticleColorEnum {
  None = 0,
  Black = 1,
  Blue = 2,
  Chromatic = 3,
  Gold = 4,
  Green = 5,
  Purple = 6,
  Red = 7,
  White = 8,
  Ice = 9,
  Stone = 10,
  Magenta = 11,
  Orange = 12,
}

export enum ProjectileExtendedFlagsEnum {
  BounceFromWalls = 0,
  PassTarget = 1,
  DrawCenterVvcOnce = 2,
  HitImmediately = 3,
  FaceTarget = 4,
  CurvedPathUnknownStillNotImplementedOnEeGames = 5,
  StartRandomFrame = 6,
  Pillar = 7,
  SemiTransparentTrailPuffVef = 8,
  TintedTrailPuffVef = 9,
  MultipleProjectiles = 10,
  DefaultSpellOnMissed = 11,
  FallingPath = 12,
  Comet = 13,
  LinedUpAreaOfEffect = 14,
  RectangularAreaOfEffect = 15,
  DrawBehindTarget = 16,
  CastingGlowEffect = 17,
  TravelDoor = 18,
  StopFadeAfterHit = 19,
  DisplayMessage = 20,
  RandomPath = 21,
  StartRandomSequence = 22,
  ColourPulseOnHit = 23,
  TouchProjectile = 24,
  NegateFirstCreatureTarget = 25,
  NegateSecondCreatureTarget = 26,
  UseEitherIds = 27,
  DelayedPayload = 28,
  LimitedPathCount = 29,
  IwdStyleCheck = 30,
  CasterAffected = 31,
}

export enum BamProjectileFlagsEnum {
  EnableBamColouring = 0,
  EnableSmoke = 1,
  ColoredSmoke = 2,
  EnableAreaLightingUsage = 3,
  EnableAreaHeightUsage = 4,
  EnableShadow = 5,
  EnableLightSpot = 6,
  EnableBrightenFlags = 7,
  LowLevelBrighten = 8,
  HighLevelBrighten = 9,
}

export interface ProjectileInfo {
  bamProjectileFlags: BamProjectileFlagsEnum[];
  projectileSmokeAnimation: ProjectileAnimationEnum;
  lightSpotIntensity: number;
  lightSpotWidth: number;
  lightSpotHeight: number;
}

export interface ProjectileAreaEffectInfo {
  areaProjectileFlags: AreaProjectileEnum[];
  rayCount: number;
  /**
   * divide by approx 8.5 to receive diameter in feet
   */
  triggerRadius: number;
  /**
   * divide by approx 8.5 to receive diameter in feet
   */
  areaOfEffect: number;
  explosionSound: string;
  explosionDelay: number;
  fragmentAnimation: ProjectileAnimationEnum;
  secondaryProjectile: number;
  triggerCount: number;
  explosionEffect: ProjectileExplosionEffectEnum;
  explosionColor: number;
  explosionProjectile: number;
  explosionAnimation: number;
  coneWidth: number;

  travelingProjectileAnimation: string;
  shadowAnimation: string;
  lightSpotIntensity: number;
  lightSpotWidth: number;
  lightSpotHeight: number;
  palette: string;
  projectileColours: string;
  smokePuffDelay: number;
  smokeColours: string;
  faceTargetGranularity: number;
  trailingAnimation1: string;
  trailingAnimation2: string;
  trailingAnimation3: string;
  trailingNumber1: number;
  trailingNumber2: number;
  trailingNumber3: number;
}

export interface Projectile {
  file: string;
  copyFromFile?: string;
  id?: number;
  name: string;
  type?: ProjectileTypeEnum;
  speed?: number;
  behaviorFlags?: ProjectileBehaviorEnum[];
  fireSound?: string;
  impactSound?: string;
  sourceAnimation?: string;
  particleColor?: ParticleColorEnum;
  projectileWidth?: number;
  extendedFlags?: ProjectileExtendedFlagsEnum[];
  stringRef?: TranslationKey;
  color?: number;
  colorSpeed?: number;
  screenShakeAmount?: number;
  idsTarget1?: EffectIDSFileEnum;
  idsTarget2?: EffectIDSFileEnum;
  defaultSpell?: string;
  successSpell?: string;
  projectileInfo?: Partial<ProjectileInfo>;
  areaEffectInfo?: Partial<ProjectileAreaEffectInfo>;
}
export type PartialProjectile = Omit<Projectile, "file">;
