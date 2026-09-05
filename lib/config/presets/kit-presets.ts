import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import { SPELLS } from "../spells/spell-names";

export const KIT_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Class.BerserkerRage.file,
    ability: {
      name: SPELLS.Class.BerserkerRage.name,
      spell: {
        selfTarget: true,
      },
      triggers: [
        { name: "See", params: ["NearestEnemyOf"] },
        triggerFactory.checkSpellState("BERSERKER_RAGE", true),
      ],
      probability: 90,
    },
  },
  {
    preset: SPELLS.Class.BarbarianRage.file,
    ability: {
      name: SPELLS.Class.BarbarianRage.name,
      spell: {
        selfTarget: true,
      },
      triggers: [
        { name: "See", params: ["NearestEnemyOf"] },
        triggerFactory.checkSpellState("BARBARIAN_RAGE", true),
      ],
      probability: 90,
    },
  },
];
