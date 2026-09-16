import { AbilityPreset } from "../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY } from "./common";
import { BUFF_PRESETS } from "./presets/buff-presets";
import { CHARM_PRESETS } from "./presets/charm-presets";
import { CONFUSION_PRESETS } from "./presets/confusion-presets";
import { DAMAGE_AOE_PRESETS } from "./presets/damage-aoe-presets";
import { DAMAGE_PRESETS } from "./presets/damage-presets";
import { DEATH_PRESETS } from "./presets/death-presets";
import { DEBUFF_PRESETS } from "./presets/debuff-presets";
import { DISABLING_PRESETS } from "./presets/disabling-presets";
import { DISPEL_PRESETS } from "./presets/dispel-presets";
import { FEAR_PRESETS } from "./presets/fear-presets";
import { HEAL_PRESETS } from "./presets/heal-presets";
import { HOLD_PRESETS } from "./presets/hold-presets";
import { KIT_PRESETS } from "./presets/kit-presets";
import { SLEEP_PRESETS } from "./presets/sleep-presets";
import { SUMMON_PRESETS } from "./presets/summon-presets";
import { WEAPON_PRESETS } from "./presets/weapon-presets";
import { SPELLS } from "./spells/spell-names";

// Spells from SPELLS with no preset defined yet.
// TODO: fill in targets/triggers/spell for each, then move it to the appropriate presets/*.ts
// file and delete it here.
const NEW_PRESETS: AbilityPreset[] = [
  // Wizard
  {
    preset: SPELLS.Wizard.PolymorphSelf.file,
    ability: {
      name: SPELLS.Wizard.PolymorphSelf.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Wizard.ShapeshiftMustardJelly.file,
    ability: {
      name: SPELLS.Wizard.ShapeshiftMustardJelly.name,
      spell: {},
      triggers: [],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];

export const ABILITY_PRESETS: AbilityPreset[] = [
  ...BUFF_PRESETS,
  ...HEAL_PRESETS,
  ...KIT_PRESETS,
  ...CHARM_PRESETS,
  ...CONFUSION_PRESETS,
  ...DAMAGE_PRESETS,
  ...DAMAGE_AOE_PRESETS,
  ...DEATH_PRESETS,
  ...DEBUFF_PRESETS,
  ...DISABLING_PRESETS,
  ...DISPEL_PRESETS,
  ...FEAR_PRESETS,
  ...HOLD_PRESETS,
  ...SLEEP_PRESETS,
  ...SUMMON_PRESETS,
  ...WEAPON_PRESETS,
  ...NEW_PRESETS,
];
