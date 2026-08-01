import { AbilityPreset } from "../src/model/misc";
import { BUFF_PRESETS } from "./presets/buff-presets";
import { CHARM_PRESETS } from "./presets/charm-presets";
import { CONFUSION_PRESETS } from "./presets/confusion-presets";
import { CURE_PRESETS } from "./presets/cure-presets";
import { DAMAGE_AOE_PRESETS } from "./presets/damage-aoe-presets";
import { DAMAGE_PRESETS } from "./presets/damage-presets";
import { DEATH_PRESETS } from "./presets/death-presets";
import { DEBUFF_PRESETS } from "./presets/debuff-presets";
import { DISABLING_PRESETS } from "./presets/disabling-presets";
import { DISPEL_PRESETS } from "./presets/dispel-presets";
import { FEAR_PRESETS } from "./presets/fear-presets";
import { HOLD_PRESETS } from "./presets/hold-presets";
import { SLEEP_PRESETS } from "./presets/sleep-presets";
import { SUMMON_PRESETS } from "./presets/summon-presets";

export const ABILITY_PRESETS: AbilityPreset[] = [
  ...BUFF_PRESETS,
  ...CHARM_PRESETS,
  ...CONFUSION_PRESETS,
  ...CURE_PRESETS,
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
];
