export type CastSpellOnConditionType =
  | "HitBy([ANYONE])"
  | "See([EVILCUTOFF])"
  | "HPPercentLT(Myself,50)"
  | "HPPercentLT(Myself,25)"
  | "HPPercentLT(Myself,10)"
  | "StateCheck(Myself,STATE_HELPLESS)"
  | "StateCheck(Myself,STATE_POISONED)"
  | "AttackedBy([ANYONE])"
  | "PersonalSpaceDistance([ANYONE],4)"
  | "PersonalSpaceDistance([ANYONE],10)"
  | "Delay(Extra)"
  | "TookDamage()"
  | "Killed([ANYONE])"
  | "TimeOfDay(Extra)"
  | "PersonalSpaceDistance([ANYONE],Extra)"
  | "StateCheck([ANYONE],Extra)"
  | "Die()"
  | "Died([ANYONE])"
  | "TurnedBy([ANYONE])"
  | "HPLT(Myself,Extra)"
  | "HPPercentLT(Myself,Extra)"
  | "CheckSpellState(Myself,Extra)";

export enum SummonCreatureModeEnum {
  MatchTarget0 = 0,
  MatchTarget1 = 1,
  FromCRE2 = 2,
  MatchTarget3 = 3,
  FromCRE4 = 4,
  Hostile = 5,
  FromCRE6 = 6,
  FromCRE8 = 8,
}

export enum CastingTimeModifierTypeEnum {
  Increment = 0,
  Set = 1,
  SetHigher = 2,
}

export enum DisableButtonEnum {
  Stealth = 0,
  ThievingSkill = 1,
  SpellSelect = 2,
  FirstQuickSpell = 3,
  SecondQuickSpell = 4,
  ThirdQuickSpell = 5,
  TurnUndead = 6,
  Talk = 7,
  UseItem = 8,
  FirstQuickItem = 9,
  BardSong = 10,
  SecondQuickItem = 11,
  ThirdQuickItem = 12,
  InnateAbility = 13,
  FindTraps = 14,
  Inventory = 15,
}

export enum DisableSpellcastingTypeEnum {
  Wizard = 0,
  Priest = 1,
  Innate = 2,
  MagicalSpells = 3,
}

export enum CastingFailureTypeEnum {
  Wizard = 0,
  Priest = 1,
  Innate = 2,
}

export enum AttackModifierTypeEnum {
  Increment = 0,
  Set = 1,
  Percentage = 2,
  Final = 3,
}

export enum PolymorphTypeEnum {
  GainResistancesStatistics = 0,
  AppearanceOnly = 1,
}

export enum AnimationChangeTypeEnum {
  TemporaryChange = 0,
  RemoveTemporaryChange = 1,
  PermanentChange = 2,
}

export enum OverrideCreatureDataFieldEnum {
  BodyHeat = 1,
  BloodColor = 2,
  PersonalSpace = 4,
}

export enum InvisibilityTypeEnum {
  Normal = 0,
  Improved = 1,
  Weak = 2,
}

export enum BonusHPHealFlagEnum {
  RaiseDead = 0,
  RemoveAllEffects = 1,
}

export enum DispelEffectTypeEnum {
  AlwaysDispel = 0,
  UseCasterLevel = 1,
  UseSpecificLevel = 2,
}

export enum DispelEffectWeaponTypeEnum {
  AlwaysDispel = 0,
  DoNotDispel = 1,
  ChanceOfDispel = 2,
}

export enum CastSpellOnConditionTargetEnum {
  Myself = 0,
  LastHitter = 1,
  NearestEnemy = 2,
  Nearest = 3,
}

export function getCastSpellOnConditionValue(text: CastSpellOnConditionType) {
  let value = 0;
  switch (text) {
    case "HitBy([ANYONE])":
      break;
    case "See([EVILCUTOFF])":
      value = 1;
      break;
    case "HPPercentLT(Myself,50)":
      value = 2;
      break;
    case "HPPercentLT(Myself,25)":
      value = 3;
      break;
    case "HPPercentLT(Myself,10)":
      value = 4;
      break;
    case "StateCheck(Myself,STATE_HELPLESS)":
      value = 5;
      break;
    case "StateCheck(Myself,STATE_POISONED)":
      value = 6;
      break;
    case "AttackedBy([ANYONE])":
      value = 7;
      break;
    case "PersonalSpaceDistance([ANYONE],4)":
      value = 8;
      break;
    case "PersonalSpaceDistance([ANYONE],10)":
      value = 9;
      break;
    case "Delay(Extra)":
      value = 10;
      break;
    case "TookDamage()":
      value = 11;
      break;
    case "Killed([ANYONE])":
      value = 12;
      break;
    case "TimeOfDay(Extra)":
      value = 13;
      break;
    case "PersonalSpaceDistance([ANYONE],Extra)":
      value = 14;
      break;
    case "StateCheck([ANYONE],Extra)":
      value = 15;
      break;
    case "Die()":
      value = 16;
      break;
    case "Died([ANYONE])":
      value = 17;
      break;
    case "TurnedBy([ANYONE])":
      value = 18;
      break;
    case "HPLT(Myself,Extra)":
      value = 19;
      break;
    case "HPPercentLT(Myself,Extra)":
      value = 20;
      break;
    case "CheckSpellState(Myself,Extra)":
      value = 21;
      break;
  }
  return value;
}

export enum TranslucencyTypeEnum {
  DrawInstantly = 0,
  FadeIn = 1,
  FadeOut = 2,
}

export enum ProtectionFromWeaponsTypeEnum {
  Enchanted = 0,
  Magical = 1,
  NonMagical = 2,
  Silver = 3,
  NonSilver = 4,
  NonSilverNonMagical = 5,
  TwoHanded = 6,
  OneHanded = 7,
  Cursed = 8,
  NonCursed = 9,
  ColdIron = 10,
  NonColdIron = 11,
}

export enum ProficiencyTypeEnum {
  PROFICIENCYBASTARDSWORD = 89,
  PROFICIENCYLONGSWORD = 90,
  PROFICIENCYSHORTSWORD = 91,
  PROFICIENCYAXE = 92,
  PROFICIENCYTWOHANDEDSWORD = 93,
  PROFICIENCYKATANA = 94,
  PROFICIENCYSCIMITARWAKISASHININJATO = 95,
  PROFICIENCYDAGGER = 96,
  PROFICIENCYWARHAMMER = 97,
  PROFICIENCYSPEAR = 98,
  PROFICIENCYHALBERD = 99,
  PROFICIENCYFLAILMORNINGSTAR = 100,
  PROFICIENCYMACE = 101,
  PROFICIENCYQUARTERSTAFF = 102,
  PROFICIENCYCROSSBOW = 103,
  PROFICIENCYLONGBOW = 104,
  PROFICIENCYSHORTBOW = 105,
  PROFICIENCYDART = 106,
  PROFICIENCYSLING = 107,
  PROFICIENCYBLACKJACK = 108,
  PROFICIENCY2HANDED = 111,
  PROFICIENCYSWORDANDSHIELD = 112,
  PROFICIENCYSINGLEWEAPON = 113,
  PROFICIENCY2WEAPON = 114,
  PROFICIENCYCLUB = 115,
}

export enum ColorEnum {
  RustTintedBlack = 0,
  DarkBronze = 1,
  DarkGold = 2,
  LightGold = 3,
  Auburn = 4,
  MediumSilver = 5,
  DarkSilver = 6,
  LightMetallicGreen = 7,
  DarkMuddishBrown = 8,
  LightMuddishBrown = 9,
  LightPureGold = 10,
  LightRoseRed = 11,
  LightCarnationPink = 12,
  LightPureSilver = 13,
  DarkPureSilver = 14,
  EasterGreen = 15,
  SilverGold = 16,
  PaleBlue = 17,
  Blue = 18,
  DarkRoseRed = 19,
  DarkMoldyGreen = 20,
  DarkIronGrey = 21,
  DarkBrown = 22,
  LightCopper = 23,
  BrownGold = 24,
  DarkPureGold = 25,
  Wood = 26,
  Silver = 27,
  GhostlyGreyishSilver = 28,
  RedTintedBlack = 29,
  LightIronGrey = 30,
  LightSeaBlue = 31,
  DarkSeaGreen = 32,
  DarkMetallicPurple = 33,
  GhostlyGreen = 34,
  DarkGhostlyPink = 35,
  LightDirtyYellow = 36,
  DarkDirtyYellow = 37,
  LightDirtBrown = 38,
  DarkDirtBrown = 39,
  DarkDirtyCopper = 40,
  MediumBrown = 41,
  LightBlurryGrey = 42,
  DarkDirtishBrown = 43,
  LightMagenta = 44,
  DarkMagenta = 45,
  LightRed = 46,
  DarkRed = 47,
  LightBronze = 48,
  DarkRust = 49,
  DarkYellow = 50,
  DarkOliveGreen = 51,
  LightGreen = 52,
  Green = 53,
  DarkGreen = 54,
  Turquoise = 55,
  DarkSeaBlue = 56,
  LightBlue = 57,
  DarkBlue = 58,
  LightPurple = 59,
  DarkPurple = 60,
  Lavender = 61,
  DarkLavender = 62,
  LightGrey = 63,
  DarkGrey = 64,
  ReallyDarkGrey = 65,
  FadedBlack = 66,
  ShinyGold = 67,
  ShinyBlue = 68,
  ShinyGreen = 69,
  LightMetallicRed = 70,
  FrostBlue = 71,
  SteelGrey = 72,
  ChristmasGreen = 73,
  PureWhite = 74,
  PureBlack = 75,
  PureRed = 76,
  PureGreen = 77,
  PureBlue = 78,
  LightSilver = 79,
  SaturatedBronze = 80,
  FadedGold = 81,
  DarkMetallicBlue = 82,
  DarkAdamantiteGrey = 83,
  Peachy = 84,
  PureGold = 85,
  ChromeGreen = 86,
  DarkPoopyBrown = 87,
  ChromePink = 88,
  MetallicPink = 89,
  MoldyGold = 90,
  DarkChoclate = 91,
  LightChocolate = 92,
  DarkCementGrey = 93,
  Rhubarb = 94,
  LightDirtishBrown = 95,
  ChromeBlue = 96,
  LightMintyBlue = 97,
  LeafGreen = 98,
  GoldenGold = 99,
  DarkAshGrey = 100,
  MetallicRed = 101,
  SeaBlue = 102,
  ForestGreen = 103,
  DarkChromePurple = 104,
  White = 105,
  PalePink = 106,
  Khaki = 107,
  PinkishGrey = 108,
  Terracotta = 109,
  Ash = 110,
  BurntSienna = 111,
  Seafoam = 112,
  Fog = 113,
  YetAnotherBrown = 114,
  Sunkissed = 115,
  MediumOrchid = 116,
  DarkOrchid = 117,
  DarkerOrchid = 118,
  DarkestOrchid = 119,
  LightTeal = 120,
  DarkTeal = 121,
  LightRoyalBlue = 122,
  DarkRoyalBlue = 123,
  LightNavyBlue = 124,
  DarkNavyBlue = 125,
  //  = 128,
  //  = 129,
  //  = 130,
  //  = 131,
  //  = 132,
  //  = 133,
  //  = 134,
  //  = 135,
  //  = 136,
  //  = 137,
  //  = 138,
  //  = 139,
  //  = 140,
  //  = 141,
  //  = 142,
  //  = 143,
  //  = 144,
  //  = 145,
  //  = 146,
  //  = 147,
  //  = 148,
  //  = 149,
  //  = 150,
  //  = 151,
  //  = 152,
  //  = 153,
  //  = 154,
  //  = 155,
  //  = 156,
  //  = 157,
  //  = 158,
  //  = 159,
  //  = 160,
  //  = 161,
  //  = 162,
  //  = 163,
  //  = 164,
  //  = 165,
  //  = 166,
  //  = 167,
  //  = 168,
  //  = 169,
  //  = 170,
  //  = 171,
  //  = 172,
  //  = 173,
  //  = 174,
  //  = 175,
  //  = 176,
  //  = 177,
  //  = 178,
  //  = 179,
  //  = 180,
  //  = 181,
  //  = 182,
  //  = 183,
  //  = 184,
  //  = 185,
  //  = 186,
  //  = 187,
  //  = 188,
  //  = 189,
  //  = 190,
  //  = 191,
  //  = 192,
  //  = 193,
  //  = 194,
  //  = 195,
  //  = 196,
  //  = 197,
  //  = 198,
  //  = 199,
  //  = 200,
  //  = 201,
  //  = 202,
  //  = 203,
  //  = 204,
  //  = 205,
  //  = 206,
  //  = 207,
  //  = 208,
  //  = 209,
  //  = 210,
  //  = 211,
  //  = 212,
  //  = 213,
  //  = 214,
  //  = 215,
  //  = 216,
  //  = 217,
  //  = 218,
  //  = 219,
  //  = 220,
  //  = 221,
  //  = 222,
  //  = 223,
  //  = 224,
  //  = 225,
  //  = 226,
  //  = 227,
  //  = 228,
  //  = 229,
  //  = 230,
  //  = 231,
  //  = 232,
  //  = 233,
  //  = 234,
  //  = 235,
  //  = 236,
  //  = 237,
  //  = 238,
  //  = 239,
  //  = 240,
  //  = 241,
  //  = 242,
  //  = 243,
  //  = 244,
  //  = 245,
  //  = 246,
  //  = 247,
  //  = 248,
  //  = 249,
  //  = 250,
  //  = 251,
  //  = 252,
  //  = 253,
  //  = 254,
  //  = 255,
}

export enum ItemCategoryEnum {
  Miscellaneous = 0,
  Amulets = 1,
  ArmorSlot = 2,
  Belts = 3,
  Boots = 4,
  Arrows = 5,
  Bracers = 6,
  Headgear = 7,
  Rings = 10,
  Shields = 12,
  Bullets = 14,
  Bows = 15,
  Daggers = 16,
  Maces = 17,
  Slings = 18,
  SmallSwords = 19,
  LargeSwords = 20,
  Hammers = 21,
  MorningStars = 22,
  Flails = 23,
  Darts = 24,
  Axes = 25,
  Quarterstaves = 26,
  Crossbows = 27,
  HandToHandWeapons = 28,
  Spears = 29,
  Halberds = 30,
  Bolts = 31,
  CloaksAndRobes = 32,
  Wands = 35,
  Bucklers = 41,
  Clubs = 44,
  LargeShields = 47,
  MediumShields = 49,
  SmallShields = 53,
  Greatswords = 57,
  LeatherArmor = 60,
  StuddedLeather = 61,
  ChainMail = 62,
  SplintMail = 63,
  PlateMail = 64,
  FullPlate = 65,
  HideArmor = 66,
  Robes = 67,
  ScaleMail = 68,
  BastardSwords = 69,
  Hats = 72,
  Gloves = 73,
}

export enum BerserkTypeEnum {
  Combat = 0,
  Always = 1,
}

export enum KillTargetDeathTypeEnum {
  Burning = 0,
  Crushed = 1,
  Normal = 2,
  Exploding = 3,
  Stoned = 4,
  Freezing = 5,
  ExplodingStoned = 6,
  ExplodingFreezing = 7,
  Electrified = 8,
  Disintegration = 9,
  ExplodingNoDrop = 10,
}

export enum CharmTypeEnum {
  NeutralCharm = 0,
  HostileCharm = 1,
  NeutralDireCharm = 2,
  HostileDireCharm = 3,
  Controlled = 4,
  ThrullCharm = 5,
  NeutralCharmNoFeedback = 1000,
  HostileCharmNoFeedback = 1001,
  NeutralDomination = 1002,
  HostileDomination = 1003,
  ControlledNoFeedback = 1004,
  ThrullCharmNoFeedback = 1005,
}

export enum DiseaseTypeEnum {
  OneDamagePerSecond = 0,
  AmoundDamagePerRound = 1,
  AmountDamagePerSecond = 2,
  OneDamagePerAmountSeconds = 3,
  ReduceStrengthByAmount = 4,
  ReduceDexterityByAmount = 5,
  ReduceConstitutionByAmount = 6,
  ReduceIntelligenceByAmount = 7,
  ReduceWisdomByAmount = 8,
  ReduceCharismaByAmount = 9,
  SlowEffect = 10,
  MoldTouchSingle = 11,
  MoldTouchDecrement = 12,
  Contagion = 13,
}

export enum RegenerationTypeEnum {
  AmountHPperSecond = 0,
  AmountHPpercentagePerSecond = 1,
  AmountHPperSecondBis = 2,
  OneHPperAmountSeconds = 3,
}

export enum ItemAnimationEnum {
  LeatherArmor = "2A",
  Chainmail = "3A",
  PlateMail = "4A",
  Robe1 = "2W",
  Robe2 = "3W",
  Robe3 = "4W",
  Axe = "AX",
  Shortbow = "BS",
  Bow = "BW",
  Crossbow = "CB",
  SmallShield1 = "C0",
  MediumShield1 = "C1",
  LargeShield1 = "C2",
  MediumShield2 = "C3",
  SmallShield2 = "C4",
  LargeShield2 = "C5",
  LargeShield3 = "C6",
  MediumShield3 = "C7",
  Club = "CL",
  Buckler = "D1",
  SmallShield = "D2",
  MediumShield = "D3",
  LargeShield = "D4",
  Dagger = "DD",
  Flail1 = "F0",
  Flail2 = "F1",
  FlamingSwordBlue = "F2",
  Flail3 = "F3",
  Flail = "FL",
  FlamingSword = "FS",
  GlowingStaff = "GS",
  HelmetSmallVerticalHorns = "H0",
  HelmetLargeHorizontalHorns = "H1",
  HelmetFeatherWings = "H2",
  HelmetTopPlume = "H3",
  HelmetDragonWings = "H4",
  HelmetFeatherSideburns = "H5",
  HelmetLargeCurvedHorns = "H6",
  Helmet8 = "H7",
  Halberd = "HB",
  Helmet9 = "J0",
  Helmet10 = "J1",
  Helmet11 = "J2",
  Helmet12 = "J3",
  Helmet13 = "J4",
  Helmet14 = "J5",
  Helmet15 = "J6",
  Helmet16 = "J7",
  Helmet17 = "J8",
  Helmet18 = "J9",
  Helmet19 = "JA",
  Circlet = "JB",
  Helmet20 = "JC",
  Mace = "MC",
  MorningStar = "MS",
  QuarterStaff1 = "Q2",
  QuarterStaff2 = "Q3",
  QuarterStaff3 = "Q4",
  QuarterStaffMetal = "QS",
  BastardSword = "S0",
  LongSword = "S1",
  TwoHandedSword = "S2",
  Katana = "S3",
  Scimitar = "SC",
  Sling = "SL",
  Spear = "SP",
  ShortSword = "SS",
  WarHammer = "WH",
  Wings = "ZW",
}

export enum EffectTeleportTypeEnum {
  Default = 0,
  SourceToTarget = 1,
  ReturnToSavedLocation = 2,
  ExchangedSourceAndTarget = 3,
}

export enum EffectHasteTypeEnum {
  NormalHaste = 0,
  ImprovedHaste = 1,
  WeakHaste = 2,
}

export enum EffectColorLocationEnum {
  ArmorGreyBeltAmulet = 0,
  ArmorTealMinorColor = 1,
  ArmorPinkMajorColor = 2,
  ArmorYellowSkinColor = 3,
  ArmorRedStrapLeather = 4,
  ArmorBlueArmorTrimming = 5,
  ArmorGreenHair = 6,
  WeaponGreyHeadBladeStaffMajor = 16,
  WeaponTealStaffMinor = 17,
  WeaponPink = 18,
  WeaponYellow = 19,
  WeaponRedGripStaffMinor = 20,
  WeaponBlueHeadBladeMinor = 21,
  WeaponGreen = 22,
  ShieldGreyHub = 32,
  ShieldTealInterior = 33,
  ShieldPinkPanel = 34,
  ShieldYellow = 35,
  ShieldRedGrip = 36,
  ShieldBlueBodyTrim = 37,
  ShieldGreen = 38,
  HelmetGreyWings = 48,
  HelmetTealDetail = 49,
  HelmetPinkPlume = 50,
  HelmetYellow = 51,
  HelmetRedFace = 52,
  HelmetBlueExterior = 53,
  HelmetGreen = 54,
  CharacterColor = 255,
}

export enum EffectCastSpellTypeEnum {
  NormalCastingNonInterruptible = 0,
  CastInstantlyAtCasterLevel = 1,
  CastInstantlyAtSpecifiedLevel = 2,
}

export enum EffectIDSFileEnum {
  EA = 2,
  GENERAL = 3,
  RACE = 4,
  CLASS = 5,
  SPECIFIC = 6,
  GENDER = 7,
  ALIGN = 8,
  KIT = 9,
}

export enum ItemAbilityTypeEnum {
  Melee = 1,
  Ranged = 2,
  Magical = 3,
}

export enum ItemAbilityLocationEnum {
  None = 0,
  Weapon = 1,
  Spell = 2,
  Item = 3,
  Ability = 4,
}

export enum ItemAbilityTargetEnum {
  None = 0,
  LivingActor = 1,
  Inventory = 2,
  DeadActor = 3,
  AnyPointWithinRange = 4,
  Caster = 5,
}

export enum ItemAbilityCastingAnimationEnum {
  None = 0,
  FireAqua = 1,
  FireBlue = 2,
  FireGold = 3,
  FireGreen = 4,
  FireMagenta = 5,
  FirePurple = 6,
  FireRed = 7,
  FireWhite = 8,
  Necromancy = 9,
  Alteration = 10,
  Enchantment = 11,
  Abjuration = 12,
  Illusion = 13,
  Conjuration = 14,
  Invocation = 15,
  Divination = 16,
  FountainAqua = 17,
  FountainBlack = 18,
  FountainBlue = 19,
  FountainGold = 20,
  FountainGreen = 21,
  FountainMagenta = 22,
  FountainPurple = 23,
  FountainRed = 24,
  FountainWhite = 25,
  SwirlAqua = 26,
  SwirlBlack = 27,
  SwirlBlue = 28,
  SwirlGold = 29,
  SwirlGreen = 30,
  SwirlMagenta = 31,
  SwirlPurple = 32,
  SwirlRed = 33,
  SwirlWhite = 34,
}

export enum ItemAbilityPrimaryTypeEnum {
  None = 0,
  Abjurer = 1,
  Conjurer = 2,
  Diviner = 3,
  Enchanter = 4,
  Illusionist = 5,
  Invoker = 6,
  Necromancer = 7,
  Transmuter = 8,
  Generalist = 9,
  Wildmage = 10,
}

export enum ItemAbilitySecondaryTypeEnum {
  None = 0,
  SpellProtections = 1,
  SpecificProtections = 2,
  IllusionaryProtections = 3,
  MagicAttack = 4,
  DivinationAttack = 5,
  Conjuration = 6,
  CombatProtections = 7,
  Contingency = 8,
  Battleground = 9,
  OffensiveDamage = 10,
  Disabling = 11,
  Combination = 12,
  NonCombat = 13,
}

export enum AbilityDamageTypeEnum {
  None = 0,
  Piercing = 1,
  Crushing = 2,
  Slashing = 3,
  Missile = 4,
  Fist = 5,
  PiercingOrCrushing = 6,
  PiercingOrSlashing = 7,
  CrushingOrSlashing = 8,
  BluntMissile = 9,
}

export enum SpellTypeEnum {
  Special = 0,
  Wizard = 1,
  Priest = 2,
  Psionic = 3,
  Innate = 4,
  BardSong = 5,
}

export enum ItemFlagEnum {
  CriticalItem = 0,
  TwoHanded = 1,
  Droppable = 2,
  Displayable = 3,
  Cursed = 4,
  NotCopyable = 5,
  Magical = 6,
  LeftHanded = 7,
  Silver = 8,
  ColdIron = 9,
  OffHanded = 10,
  Conversable = 11,
  ToggleCriticalHit = 25,
}

export enum ItemAbilityFlagEnum {
  AddStrengthBonus = 0,
  Breakable = 1,
  DamageStrengthBonus = 2,
  Thac0StrengthBonus = 3,
  BreakSanctuary = 9,
  Hostile = 10,
  RechargeAfterResting = 11,
}

export enum SpellFlagEnum {
  BreakSanctuary = 9,
  Hostile = 10,
  NoLOSRequired = 11,
  AllowSpotting = 12,
  OutdoorsOnly = 13,
  IgnoreDead = 14,
  CanTargetInvisible = 24,
  CastableWhenSilenced = 25,
}

export enum SpellExclusionFlagEnum {
  Berserker = 0,
  WizardSlayer = 1,
  Kensai = 2,
  Cavalier = 3,
  Inquisitor = 4,
  UndeadHunter = 5,
  Abjurer = 6,
  Conjurer = 7,
  Diviner = 8,
  Enchanter = 9,
  Illusionist = 10,
  Invoker = 11,
  Necromancer = 12,
  Transmuter = 13,
  Generalist = 14,
  Archer = 15,
  Stalker = 16,
  Beastmaster = 17,
  Assasin = 18,
  BountyHunter = 19,
  Swashbuckler = 20,
  Blade = 21,
  Jester = 22,
  Skald = 23,
  ClericOfTalos = 24,
  ClericOfHelm = 25,
  ClericOfLathander = 26,
  TotemicDruid = 27,
  Shapeshifter = 28,
  Avenger = 29,
  Barbarian = 30,
  WildMage = 31,
}

export enum EffectTargetEnum {
  None = 0,
  Self = 1,
  PresetTarget = 2,
  Party = 3,
  Everyone = 4,
  EveryoneExceptParty = 5,
  CasterGroup = 6,
  TargetGroup = 7,
  EveryoneExceptSelf = 8,
  OriginalCaster = 9,
}

export enum EffectTimingEnum {
  InstantLimited = 0,
  InstantPermanentUntilDeath = 1,
  InstantWhileEquipped = 2,
  DelayLimited = 3,
  DelayPermanent = 4,
  DelayWhileEquipped = 5,
  LimitedAfterDuration = 6,
  PermanentAfterDuration = 7,
  EquippedAfterDuration = 8,
  InstantPermanent = 9,
  InstantLimitedTicks = 10,
}

export enum EffectDispelResistanceEnum {
  NaturalNonMagical = 0,
  DispelNotBypassResistance = 1,
  NotDispelBypassResistance = 2,
  DispelBypassResistance = 3,
}

export enum EffectDamageTypeEnum {
  Crushing = 0,
  Acid = 1,
  Cold = 2,
  Electricity = 4,
  Fire = 8,
  Piercing = 16,
  Poison = 32,
  Magic = 64,
  Missile = 128,
  Slashing = 256,
  MagicFire = 512,
  MagicCold = 1024,
  Stunning = 2048,
}

export enum EffectDamageModeEnum {
  Normal = 0,
  SetToValue = 1,
  SetToPercent = 2,
  ReduceByPercentage = 3,
}

export enum SaveTypeEnum {
  Spell = 0,
  Breath = 1,
  ParalyzePoisonDeath = 2,
  RodStaffWand = 3,
  PetrifyPolymorph = 4,
  IgnorePrimaryTarget = 10,
  IgnoreSecondaryTarget = 11,
  BypassMirrorImage = 24,
  IgnoreDifficulty = 25,
}

export enum EffectFlagsEnum {
  TransferHPToCasterCumulative = 0,
  TransferHPToTargetCumulative = 1,
  FistDamageOnly = 2,
  TransferHPToCasterNonCumulative = 3,
  TransferHPToTargetNonCumulative = 4,
  SuppressDamageFeedback = 5,
  LimitToCurrentHPOfTargetMinusMinHP = 6,
  LimitToCurrentMaxHPDifferenceOfCaster = 7,
  SaveForHalf = 8,
  FailForHalf = 9,
  DoesNotWakeSlepeers = 10,
}

export enum EffectVisualEffectLocationEnum {
  OverTargetUnattached = 0,
  OverTargetAttached = 1,
  AtTargetPoint = 2,
}

export enum EffectStatisticModifierEnum {
  Increment = 0,
  Set = 1,
  Percentage = 2,
  Special = 3,
}

export enum EffectModifierTypeEnum {
  Increment = 0,
  Set = 1,
  SetPercentOf = 2,
  MultiplyPercent = 5,
}

export enum LightingEffectTargetEnum {
  SpellTarget = 0,
  TargetPoint = 1,
}

export enum LightingEffectEnum {
  NecromancyAir = 0,
  NecromancyEarth = 1,
  NecromancyWater = 2,
  AlterationAir = 4,
  AlterationEarth = 5,
  AlterationWater = 6,
  EnchantmentAir = 8,
  EnchantmentEarth = 9,
  EnchantmentWater = 10,
  AbjurationAir = 12,
  AbjurationEarth = 13,
  AbjurationWater = 14,
  IllusionAir = 16,
  IllusionEarth = 17,
  IllusionWater = 18,
  ConjureAir = 20,
  ConjureEarth = 21,
  ConjureWater = 22,
  InvocationAir = 24,
  InvocationEarth = 25,
  InvocationWater = 26,
  DivinationAir = 28,
  DivinationEarth = 29,
  DivinationWater = 30,
  MushroomFire = 32,
  MushroomGray = 33,
  MushroomGreen = 34,
  ShaftFire = 35,
  ShaftLight = 36,
  ShaftWhite = 37,
  HitDoor = 38,
  HitFingerOfDeath = 39,
}

export enum EffectBonusToEnum {
  AllWeapons = 0,
  CrushingWeapons = 1,
  MissileWeapons = 2,
  PiercingWeapons = 4,
  SlashingWeapons = 8,
  SetBaseArmorClassToValue = 16,
}

export enum PortraitIconEnum {
  Charm = 0,
  DireCharm = 1,
  RigidThinking = 2,
  Confused = 3,
  Berserk = 4,
  Intoxicated = 5,
  Poisoned = 6,
  Diseased = 7,
  Blind = 8,
  ProtectionFromEvil = 9,
  ProtectionFromPetrification = 10,
  ProtectionFromMissiles = 11,
  MagicArmor = 12,
  Held = 13,
  Sleep = 14,
  Shielded = 15,
  ProtectionFromFire = 16,
  Blessed = 17,
  Chant = 18,
  FreeAction = 19,
  Barkskin = 20,
  Strength = 21,
  Heroism = 22,
  Invulnerable = 23,
  ProtectionFromAcid = 24,
  ProtectionFromCold = 25,
  ResistFireCold = 26,
  ProtectionFromElectricity = 27,
  ProtectionFromMagic = 28,
  ProtectionFromUndead = 29,
  ProtectionFromPoison = 30,
  NonDetectable = 31,
  GoodLuck = 32,
  BadLuck = 33,
  Silenced = 34,
  Cursed = 35,
  Panic = 36,
  ResistFear = 37,
  Haste = 38,
  Fatigue = 39,
  BardSong = 40,
  Slow = 41,
  Regenerate = 42,
  Domination = 43,
  Hopelessness = 44,
  GreaterMalison = 45,
  SpiritArmor = 46,
  Chaos = 47,
  Feebleminded = 48,
  DefensiveHarmony = 49,
  ChampionStrength = 50,
  Dying = 51,
  MindShield = 52,
  EnergyDrain = 53,
  PolymorphSelf = 54,
  Stun = 55,
  Regeneration = 56,
  Perception = 57,
  MasterThievery = 58,
  EnergyDrain2 = 59,
  HolyPower = 60,
  CloakOfFear = 61,
  IronSkins = 62,
  MagicResistance = 63,
  RighteousMagic = 64,
  SpellTurning = 65,
  RepulsingUndead = 66,
  SpellDeflection = 67,
  FireshieldRed = 68,
  FireshieldBlue = 69,
  ProtectionFromNormalWeapon = 70,
  ProtectionFromMagicWeapon = 71,
  TenserTransformation = 72,
  SpellShield = 73,
  Mislead = 74,
  ContingencyActive = 75,
  ProtectedFromTheElements = 76,
  ProjectedImage = 77,
  Maze = 78,
  Imprisonment = 79,
  Stoneskin = 80,
  KAI = 81,
  CalledShot = 82,
  SpellFailure = 83,
  OffensiveSpin = 84,
  DefensiveSpin = 85,
  IntelligenceDrainedByMindFlayer = 86,
  Regenerating = 87,
  InDialog = 88,
  InStore = 89,
  NegativePlaneProtection = 90,
  AbilityScoreDrained = 91,
  SpellSequencerActive = 92,
  ProtectedFromEnergy = 93,
  Magnetized = 94,
  AbleToPoisonWeapons = 95,
  SettingTrap = 96,
  GlassDust = 97,
  BladeBarrier = 98,
  DeathWard = 99,
  Doom = 100,
  Decaying = 101,
  Acid = 102,
  Vocalize = 103,
  Mantle = 104,
  MiscastMagic = 105,
  MagicResistanceLowered = 106,
  SpellImmunity = 107,
  TrueSeeing = 108,
  DetectingTrapsIllusions = 109,
  ImprovedHaste = 110,
  SpellTrigger = 111,
  Deaf = 112,
  Enfeebled = 113,
  Infravision = 114,
  Friends = 115,
  ShieldOfTheArchons = 116,
  SpellTrap = 117,
  AbsoluteImmunity = 118,
  ImprovedMantle = 119,
  Farsight = 120,
  GlobeOfInvulnerability = 121,
  MinorGlobeOfInvulnerability = 122,
  ProtectedFromMagicalEnergy = 123,
  Polymorphed = 124,
  OtilukeResilientSphere = 125,
  Nauseated = 126,
  GhostArmor = 127,
  Glitterdust = 128,
  Webbed = 129,
  Unconscious = 130,
  MentalCombat = 131,
  PhysicalMirror = 132,
  RepulseUndead = 133,
  ChaoticCommands = 134,
  DrawUponHolyMight = 135,
  StrengthOfOne = 136,
  Bleeding = 137,
  Rage = 138,
  BoonOfLathander = 139,
  StormShield = 140,
  Enraged = 141,
  StunningBlow = 142,
  QuiveringPalm = 143,
  Entangled = 144,
  Grease = 145,
  Smite = 146,
  Hardiness = 147,
  PowerAttack = 148,
  WhirlwindAttack = 149,
  GreaterWhirlwindAttack = 150,
  MagicFlute = 151,
  CriticalStrike = 152,
  GreaterDeathblow = 153,
  Deathblow = 154,
  AvoidDeath = 155,
  Assassination = 156,
  Evasion = 157,
  GreaterEvasion = 158,
  ImprovedAlacrity = 159,
  AuraOfFlamingDeath = 160,
  GlobeOfBlades = 161,
  ImprovedChaosShield = 162,
  ChaosShield = 163,
  FireElementalTransformation = 164,
  EarthElementalTransformation = 165,
  EnchantedWeapon = 188,
  SpiritWard = 189,
  EtherGate = 190,
  ShamanicDance = 191,
  ChaosOfBattle = 192,
  Unknown = 193,
  Repulsion = 194,
  IncreasedMovementRate = 195,
  ImmunityAbjuration = 196,
  ImmunityConjuration = 197,
  ImmunityDivination = 198,
  ImmunityEnchantment = 199,
  ImmunityIllusion = 200,
  ImmunityEvocation = 201,
  ImmunityNecromancy = 202,
  ImmunityAlteration = 203,
  FlamingFists = 204,
  FrozenFist = 205,
  ArmorOfFaith = 206,
}

export enum PoisonTypeEnum {
  OneDamagePerSecond = 0,
  OneDamagePerSecondBis = 1,
  AmountDamagePerSecond = 2,
  OneDamagePerAmountSecond = 3,
  // Amount1DamagePerAmount2Second = 4
}

export enum RemoveEffectsByResourceTypeEnum {
  Default = 0,
  EquippedEffectsListOnly = 1,
  TimedEffectsListOnly = 2,
}

export enum SetAnimationSequenceEnum {
  Attack = 0,
  Awake = 1,
  Cast = 2,
  Conjure = 3,
  Damage = 4,
  Die = 5,
  TurnHead = 6,
  Ready = 7,
  Shoot = 8,
  Twitch = 9,
  Walk = 10,
  AttackSlash = 11,
  AttackBackslash = 12,
  AttackJab = 13,
  Emerge = 14,
  Hide = 15,
  Sleep = 16,
}

export enum WingBuffetDirectionEnum {
  AwayFromTargetPoint = 1,
  AwayFromSource = 2,
  TowardsTargetPoint = 3,
  TowardsSource = 4,
}

export type PnPPoisonType =
  | "A"
  | "B"
  | "C"
  | "D"
  | "E"
  | "F"
  | "G"
  | "H"
  | "I"
  | "J"
  | "K"
  | "L"
  | "M"
  | "N"
  | "O"
  | "P"
  | "Q"
  | "R"
  | "S";

export enum CriticalHitEffectConditionEnum {
  Always = 0,
  ThisWeaponOnly = 1,
}

export enum CriticalHitEffectAttackTypeEnum {
  Any = 0,
  Melee = 1,
  Ranged = 2,
  Magical = 3,
}
