import { Creature } from "../src/model/creature/creature";
import { CreatureEntry } from "../src/model/creature/entry";
import { CreatureKin } from "../src/model/creature/kin";
import { KinEnum } from "./kin";
import { createAnkhegEntry } from "./ankheg";
import { createBasiliskEntry } from "./basilisk";
import { createCarrionCrawlerEntry } from "./carrion-crawler";
import { createEttercapEntry } from "./ettercap";
import { createEttinEntry } from "./ettin";
import { createMinotaurEntry } from "./minotaur";
import { createTreantEntry } from "./treant";
import { createGiantPoisonousSnakeEntry } from "./giant-poisonous-snake";
import { createWyvernEntry } from "./wyvern";
import { createBlackBearEntry } from "./bear/black-bear";
import { createBrownBearEntry } from "./bear/brown-bear";
import { createCaveBearEntry } from "./bear/cave-bear";
import { createGrizzlyBearEntry } from "./bear/grizzly-bear";
import { createPolarBearEntry } from "./bear/polar-bear";
import { createCheetahEntry } from "./cat/cheetah";
import { createGiantLynxEntry } from "./cat/giant-lynx";
import { createJaguarEntry } from "./cat/jaguar";
import { createLeopardEntry } from "./cat/leopard";
import { createLionEntry } from "./cat/lion";
import { createMountainLionEntry } from "./cat/mountain-lion";
import { createSpottedLionEntry } from "./cat/spotted-lion";
import { createWildTigerEntry } from "./cat/wild-tiger";
import { createHellcatEntry } from "./cat/hellcat";
import { createDisplacerBeastEntry } from "./cat/displacer-beast";
import { createWildDogEntry } from "./dog/wild-dog";
import { createWarDogEntry } from "./dog/war-dog";
import { createBlinkDogEntry } from "./dog/blink-dog";
import { createSpectralHoundEntry } from "./dog/spectral-hound";
import { createMoonDogEntry } from "./dog/moon-dog";
import { createHellHoundEntry } from "./dog/hell-hound";
import { createWolfEntry } from "./wolf/wolf";
import { createDireWolfEntry } from "./wolf/dire-wolf";
import { createDreadWolfEntry } from "./wolf/dread-wolf";
import { createVampiricWolfEntry } from "./wolf/vampiric-wolf";
import { createWinterWolfEntry } from "./wolf/winter-wolf";
import { createWorgEntry } from "./wolf/worg";

/**
 * Entry factories, in install order. Each receives the built kins, to hand its own kin to the
 * entry (`kins.get(KinEnum.Fey)`).
 */
export const entryFactories: ((kins: Map<KinEnum, CreatureKin>) => CreatureEntry<Creature>)[] = [
  createAnkhegEntry,
  createBasiliskEntry,
  createCarrionCrawlerEntry,
  createEttercapEntry,
  createEttinEntry,
  createMinotaurEntry,
  createTreantEntry,
  createGiantPoisonousSnakeEntry,
  createWyvernEntry,
  createBlackBearEntry,
  createBrownBearEntry,
  createCaveBearEntry,
  createGrizzlyBearEntry,
  createPolarBearEntry,
  createCheetahEntry,
  createGiantLynxEntry,
  createJaguarEntry,
  createLeopardEntry,
  createLionEntry,
  createMountainLionEntry,
  createSpottedLionEntry,
  createWildTigerEntry,
  createHellcatEntry,
  createDisplacerBeastEntry,
  createWildDogEntry,
  createWarDogEntry,
  createBlinkDogEntry,
  createSpectralHoundEntry,
  createMoonDogEntry,
  createHellHoundEntry,
  createWolfEntry,
  createDireWolfEntry,
  createDreadWolfEntry,
  createVampiricWolfEntry,
  createWinterWolfEntry,
  createWorgEntry,
];
