import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { Durations } from "../../src/model/game-data/durations";
import { AbilityPreset } from "../../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY, SUMMON_TARGET_LISTS } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-names";
import { SpellReference, SPELLS } from "../spells/spell-names";

const summoningTrigger = (rounds = 2) => ({ name: "Summoning", value: rounds * Durations.round });

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
        triggers: triggerFactory.haveSpellRES(weakerSpells, true),
        timer: summoningTrigger(),
        requireVocal: true,
        probability: DEFAULT_SPELL_PROBABILITY,
      },
    };
  });
}

export const SUMMON_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Wizard.DancingLights.file,
    ability: {
      name: SPELLS.Wizard.DancingLights.name,
      targets: SUMMON_TARGET_LISTS,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  ...factory([
    SPELLS.Priest.AnimalSummoning1,
    SPELLS.Priest.AnimalSummoning2,
    SPELLS.Priest.AnimalSummoning3,
    FNP_SPELLS.Priest.ShadowMonsters,
    SPELLS.Priest.AnimateDead,
    FNP_SPELLS.Priest.AnimateDead,
    SPELLS.Priest.AnimalSummoning4,
    SPELLS.Priest.CallWoodlandBeeings,
    FNP_SPELLS.Priest.DemiShadowMonsters,
    SPELLS.Priest.AnimalSummoning5,
    SPELLS.Priest.AnimalSummoning6,
    SPELLS.Priest.AerialServant,
    FNP_SPELLS.Priest.SummonShadows,
    SPELLS.Wizard.Shades,
    FNP_SPELLS.Priest.Shades,
    SPELLS.Priest.AnimateSkeletonWarrior,
    SPELLS.Priest.AnimalSummoning7,
    SPELLS.Priest.SummonDeathKnight,
  ]),
];
