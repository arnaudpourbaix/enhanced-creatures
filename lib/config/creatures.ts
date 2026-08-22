import { ClassIdentifier } from "../src/model/ids/class";
import { GeneralIdentifier } from "../src/model/ids/general";
import { RaceIdentifier } from "../src/model/ids/race";
import { EffectIDSFileEnum } from "../src/model/spell-item/effect.enums";

export const ATWEAKS_CREATURES = {
  Treant5hd: "jatrea1",
  Treant7hd: "jatrea2",
  Treant9hd: "jatrea3",
  Treant11hd: "jatrea4",
  DryadSummon: "jadryad",
  HamadryadSummon: "jahama",
  SplitMustardJelly: "jajelmu",
  SplitBlackPudding: "jablpud",
  SplitWhitePudding: "jawhpud",
};

export const VAPOR_IMMUNE_CREATURES: [
  EffectIDSFileEnum,
  ClassIdentifier | RaceIdentifier | GeneralIdentifier,
][] = [
  [EffectIDSFileEnum.RACE, "SLIME"],
  [EffectIDSFileEnum.RACE, "ELEMENTAL"],
  [EffectIDSFileEnum.RACE, "GOLEM"],
  [EffectIDSFileEnum.GENERAL, "UNDEAD"],
];

export const EARTH_CREATURES: [EffectIDSFileEnum, ClassIdentifier | RaceIdentifier][] = [
  [EffectIDSFileEnum.CLASS, "ELEMENTAL_EARTH"],
];

export const AIR_CREATURES: [EffectIDSFileEnum, ClassIdentifier | RaceIdentifier][] = [
  [EffectIDSFileEnum.RACE, "WYVERN"],
  [EffectIDSFileEnum.RACE, "BEHOLDER"],
  [EffectIDSFileEnum.RACE, "MIST"],
  [EffectIDSFileEnum.RACE, "MEPHIT"],
  [EffectIDSFileEnum.RACE, "DRAGON"],
  [EffectIDSFileEnum.RACE, "SOLAR"],
  [EffectIDSFileEnum.RACE, "ANTISOLAR"],
  [EffectIDSFileEnum.RACE, "PLANATAR"],
  [EffectIDSFileEnum.RACE, "DARKPLANATAR"],
  [EffectIDSFileEnum.CLASS, "ELEMENTAL_AIR"],
  [EffectIDSFileEnum.CLASS, "GENIE_DJINNI"],
  [EffectIDSFileEnum.CLASS, "GENIE_NOBLE_DJINNI"],
];

export const WATER_CREATURES: [EffectIDSFileEnum, ClassIdentifier | RaceIdentifier][] = [
  [EffectIDSFileEnum.RACE, "SAHUAGIN"],
  [EffectIDSFileEnum.RACE, "KUO-TOA"],
  [EffectIDSFileEnum.CLASS, "ELEMENTAL_WATER"],
  [EffectIDSFileEnum.CLASS, "FAIRY_NEREID"],
];

export const FLYING_CREATURES: [EffectIDSFileEnum, ClassIdentifier | RaceIdentifier][] = [
  [EffectIDSFileEnum.RACE, "WILL-O-WISP"],
  [EffectIDSFileEnum.RACE, "WYVERN"],
];

export const INCORPOREAL_CREATURES: [EffectIDSFileEnum, ClassIdentifier | RaceIdentifier][] = [
  [EffectIDSFileEnum.RACE, "MIST"],
  [EffectIDSFileEnum.RACE, "SHADOW"],
  [EffectIDSFileEnum.RACE, "SPECTRAL_UNDEAD"],
  [EffectIDSFileEnum.RACE, "SPECTRE"],
  [EffectIDSFileEnum.RACE, "WILL-O-WISP"],
  [EffectIDSFileEnum.RACE, "WRAITH"],
  [EffectIDSFileEnum.CLASS, "SPECTRAL_TROLL"],
  [EffectIDSFileEnum.CLASS, "SPIDER_WRAITH"],
];

export const GARGANTUAN_CREATURES: [EffectIDSFileEnum, ClassIdentifier | RaceIdentifier][] = [
  [EffectIDSFileEnum.RACE, "DRAGON"],
  [EffectIDSFileEnum.CLASS, "NEOTHELID"],
];

export const GRAB_IMMUNE_CREATURES: [EffectIDSFileEnum, ClassIdentifier | RaceIdentifier][] = [
  [EffectIDSFileEnum.RACE, "MIMIC"],
  [EffectIDSFileEnum.RACE, "SLIME"],
  ...FLYING_CREATURES,
  ...INCORPOREAL_CREATURES,
  ...GARGANTUAN_CREATURES,
];

export const HUGE_CREATURES: [EffectIDSFileEnum, ClassIdentifier | RaceIdentifier][] = [
  [EffectIDSFileEnum.RACE, "ANKHEG"],
  [EffectIDSFileEnum.RACE, "ELEMENTAL"],
  [EffectIDSFileEnum.RACE, "ETTIN"],
  [EffectIDSFileEnum.RACE, "GIANT"],
  [EffectIDSFileEnum.RACE, "LIZARDMAN"],
  [EffectIDSFileEnum.RACE, "TREANT"],
  [EffectIDSFileEnum.CLASS, "BEAR_CAVE"],
  [EffectIDSFileEnum.CLASS, "BEAR_POLAR"],
  [EffectIDSFileEnum.CLASS, "SPIDER_PHASE"],
  [EffectIDSFileEnum.CLASS, "SPIDER_SWORD"],
];

export const LARGE_CREATURES: [EffectIDSFileEnum, ClassIdentifier | RaceIdentifier][] = [
  [EffectIDSFileEnum.RACE, "BUGBEAR"],
  [EffectIDSFileEnum.RACE, "CARRIONCRAWLER"],
  [EffectIDSFileEnum.RACE, "CHIMERA"],
  [EffectIDSFileEnum.RACE, "DARKPLANATAR"],
  [EffectIDSFileEnum.RACE, "GENIE"],
  [EffectIDSFileEnum.RACE, "GNOLL"],
  [EffectIDSFileEnum.RACE, "GOLEM"],
  [EffectIDSFileEnum.RACE, "HOOK_HORROR"],
  [EffectIDSFileEnum.RACE, "MINOTAUR"],
  [EffectIDSFileEnum.RACE, "MYCONID"],
  [EffectIDSFileEnum.RACE, "OGRE"],
  [EffectIDSFileEnum.RACE, "OTYUGH"],
  [EffectIDSFileEnum.RACE, "PLANATAR"],
  [EffectIDSFileEnum.RACE, "SALAMANDER"],
  [EffectIDSFileEnum.RACE, "SHAMBLING_MOUND"],
  [EffectIDSFileEnum.RACE, "SOLAR"],
  [EffectIDSFileEnum.RACE, "TROLL"],
  [EffectIDSFileEnum.RACE, "UMBERHULK"],
  [EffectIDSFileEnum.RACE, "YETI"],
  [EffectIDSFileEnum.CLASS, "BASILISK_GREATER"],
  [EffectIDSFileEnum.CLASS, "BEAR_BROWN"],
  [EffectIDSFileEnum.CLASS, "SPIDER_GIANT"],
  [EffectIDSFileEnum.CLASS, "WOLF_DIRE"],
  [EffectIDSFileEnum.CLASS, "WOLF_WINTER"],
];
