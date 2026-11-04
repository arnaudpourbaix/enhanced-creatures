import type { CreatureTypeModule } from "../../src/services/creature-type-hooks.service";
import { constructType } from "./construct";
import { dragonType } from "./dragon";
import { feyType } from "./fey";
import { magicalBeastType } from "./magical-beast";
import { oozeType } from "./ooze";
import { undeadType } from "./undead";

/** Every type with a behavior, one module per type (the registry runs them in TYPE_TRAITS order). */
export const TYPE_MODULES: readonly CreatureTypeModule[] = [
  constructType,
  dragonType,
  feyType,
  magicalBeastType,
  oozeType,
  undeadType,
];
