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
];
