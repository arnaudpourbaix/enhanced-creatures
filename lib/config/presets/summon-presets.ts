import triggerFactory from "../../src/factories/trigger.factory";
import { Durations } from "../../src/model/game-data/durations";
import { AbilityPreset } from "../../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY, SUMMON_TARGET_LISTS } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-names";
import { SpellReference, SPELLS } from "../spells/spell-names";

const summoningTrigger = (rounds = 2) => ({ name: "Summoning", value: rounds * Durations.round });

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
        triggers: weakerSpells.length ? triggerFactory.haveSpell(weakerSpells, true) : [],
        timer: summoningTrigger(),
        requireVocal: true,
        probability: DEFAULT_SPELL_PROBABILITY,
      },
    };
    weakerSpells.push(spell);
    return preset;
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
    SPELLS.Priest.SummonDeathKnight,
    SPELLS.Priest.AnimalSummoning7,
    SPELLS.Priest.AnimateSkeletonWarrior,
    FNP_SPELLS.Priest.Shades,
    SPELLS.Wizard.Shades,
    FNP_SPELLS.Priest.SummonShadows,
    SPELLS.Priest.AerialServant,
    SPELLS.Priest.AnimalSummoning6,
    SPELLS.Priest.AnimalSummoning5,
    FNP_SPELLS.Priest.DemiShadowMonsters,
    SPELLS.Priest.CallWoodlandBeeings,
    SPELLS.Priest.AnimalSummoning4,
    FNP_SPELLS.Priest.AnimateDead,
    SPELLS.Priest.AnimateDead,
    FNP_SPELLS.Priest.ShadowMonsters,
    SPELLS.Priest.AnimalSummoning3,
    SPELLS.Priest.AnimalSummoning2,
    SPELLS.Priest.AnimalSummoning1,
  ]),
];
