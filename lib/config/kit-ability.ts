import { ScriptTarget } from "../src/model/constants";
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
        ability: {
          name: "spell.BerserkerRage.name",
          spell: { selfTarget: true },
          triggers: [
            {
              name: "CheckSpellState",
              params: [ScriptTarget.myself, "STATE_ENRAGED"],
              negation: true,
            },
          ],
        },
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
        ability: {
          name: "spell.BarbarianRage.name",
          spell: { selfTarget: true },
          triggers: [
            {
              name: "CheckSpellState",
              params: [ScriptTarget.myself, "STATE_ENRAGED"],
              negation: true,
            },
          ],
        },
      },
    ],
  },
];
