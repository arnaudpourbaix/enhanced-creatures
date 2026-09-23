import { KitConfig } from "../src/model/creature/kit";
import { EffectStatisticModifierEnum } from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { SPELLS } from "./spells/spell-database";

export const KITS: KitConfig[] = [
  {
    name: "BERSERKER",
    immunities: () => [],
    effects: () => [],
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
    effects: () => [],
    movement: () => 2,
    abilities: [
      {
        resource: SPELLS.Class.BarbarianRage.file,
        count: (level) => 1 + Math.floor((level - 1) / 4),
      },
    ],
  },
  {
    name: "ASSASIN",
    immunities: () => [],
    effects: (_level) => {
      const opcodes = [
        [EffectTypeEnum.Thac0Bonus, 1],
        [EffectTypeEnum.AttackDamageBonus, 1],
      ];
      // These ones are already active:
      // if (level >= 20) opcodes.push([EffectTypeEnum.BackstabBonus, 2]);
      // else if (level >= 17) opcodes.push([EffectTypeEnum.BackstabBonus, 1]);
      return opcodes.map((e) => ({
        opcode: e[0],
        type: EffectStatisticModifierEnum.Increment,
        value: e[1],
      }));
    },
    movement: () => 0,
    abilities: [
      {
        resource: SPELLS.Class.PoisonWeapon.file,
        count: (level) => 1 + Math.floor((level - 1) / 4),
      },
    ],
  },
];
