import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { RawCreatureAbility } from "../../src/model/creature/ability";
import { AbilityPreset } from "../../src/model/misc";
import { SPELLS } from "../spells/spell-database";

const defaults: RawCreatureAbility = {
  triggers: [{ name: "See", params: ["NearestEnemyOf"] }],
  requireVocal: false,
  probability: 90,
};

export const KIT_PRESETS: AbilityPreset[] = [
  ...presetFactory.createSpell(SPELLS.Class.BerserkerRage, {
    ...defaults,
  }),
  ...presetFactory.createSpell(SPELLS.Class.BarbarianRage, {
    ...defaults,
  }),
  ...presetFactory.createSpell(SPELLS.Class.PoisonWeapon, {
    ...defaults,
    triggers: [triggerFactory.hasPoisonWeapon(true)],
  }),
];
