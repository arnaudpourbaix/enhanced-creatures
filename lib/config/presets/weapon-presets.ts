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
  const weakerSpells: SpellReference[] = [];
  return spells.map((spell) => {
    const preset: AbilityPreset = {
      preset: spell.file,
      ability: {
        name: spell.name,
        spell: {
          selfTarget: true,
        },
        triggers: [...WEAPON_ITEM_TRIGGERS, ...triggerFactory.haveSpell(weakerSpells, true)],
        requireVocal: true,
        probability: DEFAULT_SPELL_PROBABILITY,
      },
    };
    weakerSpells.push(spell);
    return preset;
  });
}

export const WEAPON_PRESETS: AbilityPreset[] = [
  ...factory([
    SPELLS.Priest.Harm,
    SPELLS.Priest.SlayLiving,
    SPELLS.Priest.CauseSeriousWounds,
    SPELLS.Priest.SpiritualHammer,
    SPELLS.Priest.CauseModerateWounds,
    SPELLS.Priest.CauseLightWounds,
  ]),
];
