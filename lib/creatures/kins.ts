import { CreatureKin } from "../src/model/creature/kin";
import { createBearKin } from "./bear/kin";
import { createCatKin } from "./cat/kin";
import { createDogKin } from "./dog/kin";
import { createWolfKin } from "./wolf/kin";

/** Kin factories, in install order (every kin installs before the entries). */
export const kinFactories: (() => CreatureKin)[] = [
  createBearKin,
  createCatKin,
  createDogKin,
  createWolfKin,
];
