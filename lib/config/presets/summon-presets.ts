import presetFactory from "../../src/factories/preset.factory";
import { Durations } from "../../src/model/game-data/durations";
import { AbilityPreset } from "../../src/model/misc";
import { TargetList } from "../../src/model/script/target";
import { DEFAULT_SPELL_PROBABILITY } from "../common";
import { FNP_SPELLS } from "../spells/fnp-spell-database";
import { SPELLS } from "../spells/spell-database";
import { CommonTargetLists, ExcludeUnwantedTargetsTriggers } from "../target/common";

const SUMMON_SPELLS_TARGET_LISTS: TargetList[] = [
  {
    name: "PreferringWeak",
    includeStatus: ["Able"],
    triggers: ExcludeUnwantedTargetsTriggers,
    randomOrder: true,
  },
  {
    name: "NearestEnemies",
    includeStatus: ["Able"],
    triggers: ExcludeUnwantedTargetsTriggers,
    randomOrder: true,
  },
  ...CommonTargetLists.MyselfOrAllies,
];

export const SUMMON_PRESETS: AbilityPreset[] = [
  {
    preset: SPELLS.Wizard.DancingLights.file,
    ability: {
      name: SPELLS.Wizard.DancingLights.name,
      targets: SUMMON_SPELLS_TARGET_LISTS,
      spell: {},
      requireVocal: true,
      probability: DEFAULT_SPELL_PROBABILITY,
    },
  },
  ...presetFactory.createSpells(
    [
      SPELLS.Wizard.MonsterSummoning8,
      SPELLS.Priest.Gate,
      SPELLS.Wizard.SummonFiend,
      SPELLS.Priest.SummonDeathKnight,
      SPELLS.Wizard.SummonDeathKnight,
      SPELLS.Priest.AnimalSummoning7,
      SPELLS.Wizard.MonsterSummoning7,
      SPELLS.Priest.AnimateSkeletonWarrior,
      SPELLS.Wizard.AnimateSkeletonWarrior,
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
      SPELLS.Wizard.ConjureAirElemental,
      SPELLS.Wizard.ConjureEarthElemental,
      SPELLS.Wizard.ConjureFireElemental,
      SPELLS.Wizard.ConjureLesserAirElemental,
      SPELLS.Wizard.ConjureLesserEarthElemental,
      SPELLS.Wizard.ConjureLesserFireElemental,
      SPELLS.Wizard.ConjureLesserWaterElemental,
      SPELLS.Wizard.ConjureWaterElemental,
      SPELLS.Wizard.CreateBoneguard,
      SPELLS.Wizard.DemiShadowMonsters,
      SPELLS.Wizard.Gate,
      SPELLS.Wizard.InvisibleStalker,
      SPELLS.Wizard.MordenkainensSword,
      SPELLS.Wizard.SummonDarkPlanetar,
      SPELLS.Wizard.SummonDjinni,
      SPELLS.Wizard.SummonEfreeti,
      SPELLS.Wizard.SummonNishruu,
      SPELLS.Wizard.SummonNishruuSPWI719,
      SPELLS.Wizard.SummonPlanetar,
      SPELLS.Wizard.WyvernCall,
      SPELLS.Priest.ConjureAirElemental,
      SPELLS.Priest.ConjureAnimals,
      SPELLS.Priest.ConjureEarthElemental,
      SPELLS.Priest.ConjureFireElemental,
      SPELLS.Priest.ElementalPrinceCall,
      SPELLS.Priest.ElementalSwarm,
      SPELLS.Priest.GiantInsect,
      SPELLS.Priest.Stalker,
      SPELLS.Priest.SummonDeva,
      SPELLS.Priest.SummonFallenDeva,
    ],
    {
      timer: { name: "Summoning", value: 2 * Durations.round },
    },
  ),

  ...presetFactory.createSpell(SPELLS.Wizard.SoulEater, {
    targets: CommonTargetLists.Enemies,
    timer: { name: "Summoning", value: 2 * Durations.round },
  }),
];
