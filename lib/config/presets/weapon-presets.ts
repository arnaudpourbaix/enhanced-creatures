import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import { SPELLS } from "../spells/spell-database";

const WEAPON_ITEM_TRIGGERS = triggerFactory.hasItem(
  [
    "LIGHT",
    "SERIOUS",
    "CRITICAL",
    "HARM",
    "SLAYLIVE",
    "SHAMMR",
    "SHAMMR2",
    "SHAMMR3",
    "SHAMMR4",
    "SHAMMR5",
    "FBLADE1",
    "FBLADE2",
    "FBLADE3",
    "MOONBLA",
    "PHANBLA",
    "MELFMET",
    "BLAKBLAD",
  ],
  true,
);

export const WEAPON_PRESETS: AbilityPreset[] = presetFactory.createOrderedSpells(
  [
    SPELLS.Priest.Harm,
    SPELLS.Priest.SlayLiving,
    SPELLS.Priest.CauseCriticalWounds,
    SPELLS.Priest.CauseSeriousWounds,
    SPELLS.Priest.SpiritualHammer,
    SPELLS.Priest.CauseModerateWounds,
    SPELLS.Priest.CauseLightWounds,
  ],
  {
    triggers: [...WEAPON_ITEM_TRIGGERS],
    spell: {
      castOnSelf: true,
    },
  },
);
