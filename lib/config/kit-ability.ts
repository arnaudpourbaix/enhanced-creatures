import { KitConfig } from "../src/model/creature/kit";
import { SPELLS } from "./spells/spell-names";

export const KITS: KitConfig[] = [
  {
    name: "BERSERKER",
    immunities: () => [],
    movement: () => 0,
    abilities: [
      {
        resource: SPELLS.Class.BerserkerRage.file,
        count: (level) => 1 + Math.floor((level - 1) / 4),
      },
    ],
  },
  {
    name: "BARBARIAN",
    immunities: () => ["backstab"],
    movement: () => 2,
    abilities: [
      {
        resource: SPELLS.Class.BarbarianRage.file,
        count: (level) => 1 + Math.floor((level - 1) / 4),
      },
    ],
  },
];
