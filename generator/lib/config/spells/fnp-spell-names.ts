import { SpellTypeEnum } from "../../src/model/spell-item/effect.enums";
import { BaseSpell } from "../../src/model/spell-item/spell-item";

/**
 * Faiths and Powers
 */
const FNP_PRIEST_SPELLS = {
  AnimateDead: {
    file: "d5p1301",
    level: 4,
    type: SpellTypeEnum.Priest,
    name: "spell.AnimateDead.name",
  },
  CauseDisease: {
    file: "d5p1329",
    level: 1,
    type: SpellTypeEnum.Priest,
    name: "spell.CauseDisease.name",
  },
  CauseCriticalWounds: {
    file: "sppr414",
    level: 4,
    type: SpellTypeEnum.Priest,
    name: "spell.CauseCriticalWounds.name",
  },
  CauseLightWounds: {
    file: "SPPR121",
    level: 1,
    type: SpellTypeEnum.Priest,
    name: "spell.CauseLightWounds.name",
  },
  CauseModerateWounds: {
    file: "SPPR220",
    level: 2,
    type: SpellTypeEnum.Priest,
    name: "spell.CauseModerateWounds.name",
  },
  CauseSeriousWounds: {
    file: "sppr322",
    level: 3,
    type: SpellTypeEnum.Priest,
    name: "spell.CauseSeriousWounds.name",
  },
  CircleOfBones: {
    file: "sppr332",
    level: 3,
    type: SpellTypeEnum.Priest,
    name: "spell.CircleOfBones.name",
  },
  CloakOfFear: {
    file: "d5p1416",
    level: 3,
    type: SpellTypeEnum.Priest,
    name: "spell.CloakOfFear.name",
  },
  DemiShadowMonsters: {
    file: "d5p2527",
    level: 4,
    type: SpellTypeEnum.Priest,
    name: "spell.DemiShadowMonsters.name",
  },
  Doom: { file: "SPPR113", level: 1, type: SpellTypeEnum.Priest, name: "spell.Doom.name" },
  Emotion: { file: "d5p2411", level: 4, type: SpellTypeEnum.Priest, name: "spell.Emotion.name" },
  GreaterMalison: {
    file: "d5p2412",
    level: 4,
    type: SpellTypeEnum.Priest,
    name: "spell.GreaterMalison.name",
  },
  Forbiddance: {
    file: "b_c201",
    level: 2,
    type: SpellTypeEnum.Priest,
    name: "spell.Forbiddance.name",
  },
  FrostFingers: {
    file: "B_PR101",
    level: 1,
    type: SpellTypeEnum.Priest,
    name: "spell.FrostFingers.name",
  },
  MiscastMagic: {
    file: "d5p1310",
    level: 2,
    type: SpellTypeEnum.Priest,
    name: "spell.MiscastMagic.name",
  },
  Poison: { file: "d5p1411", level: 4, type: SpellTypeEnum.Priest, name: "spell.Poison.name" },
  RigidThinking: {
    file: "d5p1311",
    level: 2,
    type: SpellTypeEnum.Priest,
    name: "spell.RigidThinking.name",
  },
  Shatter: {
    file: "b_pr201",
    level: 2,
    type: SpellTypeEnum.Priest,
    name: "spell.Shatter.name",
  },
  Shield: { file: "d5p2114", level: 2, type: SpellTypeEnum.Priest, name: "spell.Shield.name" },
  ShadowMonsters: {
    file: "d5p2433",
    level: 3,
    type: SpellTypeEnum.Priest,
    name: "spell.ShadowMonsters.name",
  },
  WavesOfFatigue: {
    file: "d5p2508",
    level: 4,
    type: SpellTypeEnum.Priest,
    name: "spell.WavesOfFatigue.name",
  },
  Chaos: { file: "d5p1709", level: 5, type: SpellTypeEnum.Priest, name: "spell.Chaos.name" },
  CloudOfPestilence: {
    file: "d5p1424",
    level: 5,
    type: SpellTypeEnum.Priest,
    name: "spell.CloudOfPestilence.name",
  },
  GreaterCommand: {
    file: "d5p1512",
    level: 5,
    type: SpellTypeEnum.Priest,
    name: "spell.GreaterCommand.name",
  },
  MassCauseLightWounds: {
    file: "d5p1530",
    level: 5,
    type: SpellTypeEnum.Priest,
    name: "spell.MassCauseLightWounds.name",
  },
  Shades: {
    file: "d5p2632",
    level: 5,
    type: SpellTypeEnum.Priest,
    name: "spell.Shades.name",
  },
  SlayLiving: {
    file: "d5p1511",
    level: 5,
    type: SpellTypeEnum.Priest,
    name: "spell.SlayLiving.name",
  },
  WavesOfAgony: {
    file: "d5p1533",
    level: 5,
    type: SpellTypeEnum.Priest,
    name: "spell.WavesOfAgony.name",
  },
  DolorousDecay: {
    file: "d5f1610",
    level: 6,
    type: SpellTypeEnum.Priest,
    name: "spell.DolorousDecay.name",
  },
  Harm: { file: "d5f1608", level: 6, type: SpellTypeEnum.Priest, name: "spell.Harm.name" },
  MagicResistance: {
    file: "d5f1509",
    level: 6,
    type: SpellTypeEnum.Priest,
    name: "spell.MagicResistance.name",
  },
  SummonShadows: {
    file: "d5pp422",
    level: 6,
    type: SpellTypeEnum.Priest,
    name: "spell.SummonShadows.name",
  },
  TrueSeeing: {
    file: "d5f1505",
    level: 6,
    type: SpellTypeEnum.Priest,
    name: "spell.TrueSeeing.name",
  },
  FingerOfDeath: {
    file: "d5f1708",
    level: 7,
    type: SpellTypeEnum.Priest,
    name: "spell.FingerOfDeath.name",
  },
  Wither: { file: "d5f1740", level: 7, type: SpellTypeEnum.Priest, name: "spell.Wither.name" },
} satisfies Record<string, BaseSpell>;

export const FNP_SPELLS = {
  Priest: FNP_PRIEST_SPELLS,
};

export function getAllFnpSpells() {
  return { ...FNP_PRIEST_SPELLS };
}
