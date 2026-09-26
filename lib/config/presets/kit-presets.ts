import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { RawCreatureAbility } from "../../src/model/creature/ability";
import { AbilityPreset } from "../../src/model/misc";
import { SPELLS } from "../spells/spell-database";

const defaults: RawCreatureAbility = {
  spell: {
    castOnSelf: true,
  },
  triggers: [{ name: "See", params: ["NearestEnemyOf"] }],
  requireVocal: false,
  probability: 90,
};

export const KIT_PRESETS: AbilityPreset[] = [
  ...presetFactory.createSpell(SPELLS.Class.BerserkerRage, {
    ...defaults,
    triggers: [triggerFactory.checkSpellState("BERSERKER_RAGE", true)],
  }),
  ...presetFactory.createSpell(SPELLS.Class.BarbarianRage, {
    ...defaults,
    triggers: [triggerFactory.checkSpellState("BARBARIAN_RAGE", true)],
  }),
  ...presetFactory.createSpell(SPELLS.Class.PoisonWeapon, {
    ...defaults,
    triggers: [triggerFactory.hasPoisonWeapon(true)],
  }),
];
