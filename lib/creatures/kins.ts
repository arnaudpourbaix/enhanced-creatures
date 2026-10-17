import { CreatureKin } from "../src/model/creature/kin";

/** Kin factories, in install order (every kin installs before the entries). */
export const kinFactories: (() => CreatureKin)[] = [];
