import presetFactory from "../../src/factories/preset.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import { Durations } from "../../src/model/game-data/durations";
import { AbilityPreset } from "../../src/model/misc";
import { DEFAULT_SPELL_PROBABILITY } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-names";
import { SPELLS } from "../spells/spell-names";

const summoningTrigger = (rounds = 2) => ({ name: "Summoning", value: rounds * Durations.round });

export const SUMMON_PRESETS: AbilityPreset[] = [
  {
    preset: FNP_SPELLS.Priest.ShadowMonsters.file,
    ability: {
      name: FNP_SPELLS.Priest.ShadowMonsters.name,
      spell: {
        selfTarget: true,
      },
      triggers: triggerFactory.haveSpellRES(
        [
          FNP_SPELLS.Priest.DemiShadowMonsters.file,
          FNP_SPELLS.Priest.AnimateDead.file,
          FNP_SPELLS.Priest.SummonShadows.file,
          FNP_SPELLS.Priest.Shades.file,
        ],
        true,
      ),
      timer: summoningTrigger(),
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.CallWoodlandBeeings.file,
    ability: {
      name: SPELLS.Priest.CallWoodlandBeeings.name,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
      triggers: [
        {
          name: "AreaType",
          params: ["OUTDOOR"],
        },
      ],
      timer: summoningTrigger(),
    },
  },
  {
    preset: FNP_SPELLS.Priest.DemiShadowMonsters.file,
    ability: {
      name: FNP_SPELLS.Priest.DemiShadowMonsters.name,
      spell: {
        selfTarget: true,
      },
      triggers: triggerFactory.haveSpellRES(
        [FNP_SPELLS.Priest.SummonShadows.file, FNP_SPELLS.Priest.Shades.file],
        true,
      ),
      timer: summoningTrigger(),
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.AnimalSummoning4.file,
    ability: {
      name: SPELLS.Priest.AnimalSummoning4.name,
      targets: [
        {
          name: "PCsPreferringWeak",
          randomOrder: true,
        },
      ],
      spell: {},
      timer: summoningTrigger(),
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  ...presetFactory.create([SPELLS.Priest.AnimateDead.file, FNP_SPELLS.Priest.AnimateDead.file], {
    name: SPELLS.Priest.AnimateDead.name,
    spell: {
      selfTarget: true,
    },
    triggers: triggerFactory.haveSpellRES(
      [FNP_SPELLS.Priest.SummonShadows.file, FNP_SPELLS.Priest.Shades.file],
      true,
    ),
    timer: summoningTrigger(),
    requireVocal: true,
    probability: DEFAULT_SPELL_PROBABILITY,
  }),
  {
    preset: FNP_SPELLS.Priest.SummonShadows.file,
    ability: {
      name: FNP_SPELLS.Priest.SummonShadows.name,
      spell: {
        selfTarget: true,
      },
      triggers: triggerFactory.haveSpellRES([FNP_SPELLS.Priest.Shades.file], true),
      timer: summoningTrigger(),
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: FNP_SPELLS.Priest.Shades.file,
    ability: {
      name: FNP_SPELLS.Priest.Shades.name,
      spell: {
        selfTarget: true,
      },
      timer: summoningTrigger(),
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  {
    preset: SPELLS.Priest.AerialServant.file,
    ability: {
      name: SPELLS.Priest.AerialServant.name,
      spell: {
        selfTarget: true,
      },
      timer: summoningTrigger(),
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
];
