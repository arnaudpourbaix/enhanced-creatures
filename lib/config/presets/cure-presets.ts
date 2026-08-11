import { ScriptTarget } from "../../src/model/constants";
import { AbilityPreset } from "../../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY } from "../common";
import { SPELLS } from "../spells/spell-names";

export const CURE_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Priest.CureLightWounds.file,
    ability: {
      name: SPELLS.Priest.CureLightWounds.name,
      // selfTarget: without it, parseAbilitySpell() defaults an untargeted spell's cast target
      // to ScriptTarget.lastSeen - wrong for a HPPercentLT(myself, ...)-triggered self-heal,
      // which should always be cast on the caster.
      spell: { selfTarget: true },
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
      triggers: [{ name: "HPPercentLT", params: [ScriptTarget.myself, 75] }],
    },
  },
];
