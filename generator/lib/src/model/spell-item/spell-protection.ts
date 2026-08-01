import { SpellProtectionName } from "../../../config/spells/spell-protection";
import { AlignIdentifier } from "../ids/align";
import { AllegianceIdentifier } from "../ids/allegiance";
import { ClassIdentifier } from "../ids/class";
import { GenderIdentifier } from "../ids/gender";
import { GeneralIdentifier } from "../ids/general";
import { AreaTypeValue } from "../ids/misc";
import { RaceIdentifier } from "../ids/race";
import { SpecificIdentifier } from "../ids/specific";
import { SplStateIdentifier } from "../ids/splstate";
import { StateIdentifier } from "../ids/state";
import { StatsIdentifier } from "../ids/stats";

export type SpellProtection =
  | SpellProtectionStats
  | SpellProtectionAreatype
  | SpellProtectionEa
  | SpellProtectionGeneral
  | SpellProtectionRace
  | SpellProtectionClass
  | SpellProtectionSpecific
  | SpellProtectionGender
  | SpellProtectionAlign
  | SpellProtectionState
  | SpellProtectionSplstate
  | SpellProtectionNumber;
// | SpellProtectionRow1OrRow2
// | SpellProtectionNotRow1AndNotRow2;

export interface SpellProtectionRow1OrRow2 {
  stat: SpellProtectionStat.Row1OrRow2;
  row1: number;
  row2: number;
}

export interface SpellProtectionNotRow1AndNotRow2 {
  stat: SpellProtectionStat.NotRow1AndNotRow2;
  row1: number;
  row2: number;
}

export interface SpellProtectionStats extends BaseSpellProtection {
  stat: StatsIdentifier;
  value?: number;
}

export interface SpellProtectionAreatype extends BaseSpellProtection {
  stat: SpellProtectionStat.Areatype;
  value?: AreaTypeValue;
}

export interface SpellProtectionEa extends BaseSpellProtection {
  stat: SpellProtectionStat.Ea;
  value?: AllegianceIdentifier;
}

export interface SpellProtectionGeneral extends BaseSpellProtection {
  stat: SpellProtectionStat.General;
  value?: GeneralIdentifier;
}

export interface SpellProtectionRace extends BaseSpellProtection {
  stat: SpellProtectionStat.Race;
  value?: RaceIdentifier;
}

export interface SpellProtectionClass extends BaseSpellProtection {
  stat: SpellProtectionStat.Class;
  value?: ClassIdentifier;
}

export interface SpellProtectionSpecific extends BaseSpellProtection {
  stat: SpellProtectionStat.Specific;
  value?: SpecificIdentifier;
}

export interface SpellProtectionGender extends BaseSpellProtection {
  stat: SpellProtectionStat.Gender;
  value?: GenderIdentifier;
}

export interface SpellProtectionAlign extends BaseSpellProtection {
  stat: SpellProtectionStat.Align;
  value?: AlignIdentifier;
}

export interface SpellProtectionState extends BaseSpellProtection {
  stat: SpellProtectionStat.State;
  value?: StateIdentifier;
}

export interface SpellProtectionSplstate extends BaseSpellProtection {
  stat: SpellProtectionStat.Splstate;
  value?: SplStateIdentifier;
}

export type SpellProtectionNumberStat =
  | SpellProtectionStat.SourceEqualsTarget
  | SpellProtectionStat.SourceIsNotTarget
  | SpellProtectionStat.CircleSize
  | SpellProtectionStat.SourceAndTargetMoraleMatch
  | SpellProtectionStat.SourceAndTargetAllies
  | SpellProtectionStat.SourceAndTargetEnemies
  | SpellProtectionStat.SummonCreatureLimit
  | SpellProtectionStat.ChapterCheck;

export interface SpellProtectionNumber extends BaseSpellProtection {
  stat: SpellProtectionNumberStat;
  value?: number;
}

export interface BaseSpellProtection {
  name?: SpellProtectionName;
  relation: SpellProtectionRelation;
}

export enum SpellProtectionStat {
  SourceEqualsTarget = "0x100",
  SourceIsNotTarget = "0x101",
  CircleSize = "0x102",
  Row1OrRow2 = "0x103",
  NotRow1AndNotRow2 = "0x104",
  SourceAndTargetMoraleMatch = "0x105",
  Areatype = "0x106",
  Ea = "0x10a",
  General = "0x10b",
  Race = "0x10c",
  Class = "0x10d",
  Specific = "0x10e",
  Gender = "0x10f",
  Align = "0x110",
  State = "0x111",
  Splstate = "0x112",
  SourceAndTargetAllies = "0x113",
  SourceAndTargetEnemies = "0x114",
  SummonCreatureLimit = "0x115",
  ChapterCheck = "0x116",
  Stat = "9999",
}

/**
 * 6 ⟶ binary less or equal (stat doesn't contain extra bits not in value)
 * 7 ⟶ binary more or equal (stat contains all bits of value)
 * 8 ⟶ binary match (at least one bit is common)
 * 9 ⟶ binary not match (none of the bits are common)
 * 10 ⟶ binary more (stat contains at least one bit not in value)
 * 11 ⟶ binary less (stat doesn't contain all the bits of value)
 */
export enum SpellProtectionRelation {
  LessOrEqual = 0,
  Equal = 1,
  Less = 2,
  Greater = 3,
  GreaterOrEqual = 4,
  NotEqual = 5,
  BinaryLessOrEqual = 6,
  BinaryMoreOrEqual = 7,
  BinaryMatch = 8,
  BinaryNotMatch = 9,
  BinaryMore = 10,
  BinaryLess = 11,
}
