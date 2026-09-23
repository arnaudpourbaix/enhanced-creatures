import triggerFactory from "../../src/factories/trigger.factory";
import { Durations } from "../../src/model/game-data/durations";
import { AbilityPreset } from "../../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY, SUMMON_TARGET_LISTS } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";
import { SpellReference } from "../../src/model/spell-item/spell-reference";

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
    SPELLS.Wizard.MonsterSummoning8,
    SPELLS.Priest.Gate,
    SPELLS.Priest.SummonDeathKnight,
    SPELLS.Priest.AnimalSummoning7,
    SPELLS.Wizard.MonsterSummoning7,
    SPELLS.Priest.AnimateSkeletonWarrior,
    FNP_SPELLS.Priest.Shades,
    SPELLS.Wizard.Shades,
    FNP_SPELLS.Priest.SummonShadows,
    SPELLS.Priest.AerialServant,
    SPELLS.Priest.AnimalSummoning6,
    SPELLS.Wizard.MonsterSummoning6,
    SPELLS.Priest.AnimalSummoning5,
    SPELLS.Wizard.MonsterSummoning5,
    FNP_SPELLS.Priest.DemiShadowMonsters,
    SPELLS.Wizard.SummonShadow,
    SPELLS.Priest.CallWoodlandBeeings,
    SPELLS.Priest.AnimalSummoning4,
    SPELLS.Wizard.MonsterSummoning4,
    FNP_SPELLS.Priest.AnimateDead,
    SPELLS.Priest.AnimateDead,
    FNP_SPELLS.Priest.ShadowMonsters,
    SPELLS.Wizard.ShadowMonsters,
    SPELLS.Priest.AnimalSummoning3,
    SPELLS.Wizard.MonsterSummoning3,
    SPELLS.Priest.AnimalSummoning2,
    SPELLS.Wizard.MonsterSummoning2,
    SPELLS.Priest.AnimalSummoning1,
    SPELLS.Wizard.MonsterSummoning1,
  ]),
];
