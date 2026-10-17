import { CreatureKin } from "../src/model/creature/kin";
import { createBearKin } from "./bear/kin";
import { createCatKin } from "./cat/kin";
import { createConstructKin } from "./construct/kin";
import { createDogKin } from "./dog/kin";
import { createFeyKin } from "./fey/kin";
import { createGolemKin } from "./golem/kin";
import { createOgreKin } from "./ogre/kin";
import { createOozeKin } from "./ooze/kin";
import { createSpiderKin } from "./spider/kin";
import { createWolfKin } from "./wolf/kin";

/** Kin factories, in install order (every kin installs before the entries). */
export const kinFactories: (() => CreatureKin)[] = [
  createBearKin,
  createCatKin,
  createConstructKin,
  createDogKin,
  createFeyKin,
  createGolemKin,
  createOgreKin,
  createOozeKin,
  createSpiderKin,
  createWolfKin,
];
