import triggerFactory from "../../src/factories/trigger.factory";
import { AbilityPreset } from "../../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY } from "../common";
import { SpellReference, SPELLS } from "../spells/spell-names";

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

function factory(spells: SpellReference[]): AbilityPreset[] {
  const weakerSpells: string[] = [];
  return spells.map((spell) => {
    weakerSpells.push(spell.file);
    return {
      preset: spell.file,
      ability: {
        name: spell.name,
        spell: {
          selfTarget: true,
        },
        triggers: [...WEAPON_ITEM_TRIGGERS, ...triggerFactory.haveSpellRES(weakerSpells, true)],
        requireVocal: true,
        probability: DEFAULT_SPELL_PROBABILITY,
      },
    };
  });
}

export const WEAPON_PRESETS: AbilityPreset[] = [
  ...factory([
    SPELLS.Priest.CauseLightWounds,
    SPELLS.Priest.CauseModerateWounds,
    SPELLS.Priest.CauseSeriousWounds,
    SPELLS.Priest.Harm,
    SPELLS.Priest.SlayLiving,
    SPELLS.Priest.SpiritualHammer,
  ]),
];
