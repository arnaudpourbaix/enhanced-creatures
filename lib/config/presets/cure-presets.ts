import { ScriptTarget } from "../../src/model/constants";
import { AbilityPreset } from "../../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY } from "../common";
import { SPELLS } from "../spells/spell-names";

export const CURE_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Priest.CureLightWounds.file,
    ability: {
      name: SPELLS.Priest.CureLightWounds.name,
      targets: [{ name: "NearestAllies" }],
      spell: {},
      triggers: [{ name: "HPPercentLT", params: [ScriptTarget.lastSeen, 75] }],
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Innate.HealingLick.file,
    ability: {
      name: SPELLS.Innate.HealingLick.name,
      targets: [{ name: "NearestAllies" }],
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
      triggers: [
        {
          name: "Or",
          triggers: [
            { name: "HPPercentLT", params: [ScriptTarget.lastSeen, 75] },
            { name: "StateCheck", params: [ScriptTarget.lastSeen, "STATE_DISEASED"] },
          ],
        },
      ],
    },
  },
];
