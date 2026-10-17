import { Creature } from "../src/model/creature/creature";
import { CreatureEntry } from "../src/model/creature/entry";
import { CreatureKin } from "../src/model/creature/kin";
import { KinEnum } from "./kin";

/**
 * Entry factories, in install order. Each receives the built kins, to hand its own kin to the
 * entry (`kins.get(KinEnum.Fey)`).
 */
export const entryFactories: ((kins: Map<KinEnum, CreatureKin>) => CreatureEntry<Creature>)[] = [];
