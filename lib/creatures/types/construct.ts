import type { CreatureTypeModule } from "../../src/services/creature-type-hooks.service";

/** Construct type: d10 Hit Dice, no constitution bonus (not alive; size bonus instead). */
export const constructType: CreatureTypeModule = {
  type: "construct",
  hitDie: 10,
  noConstitutionHp: true,
};
