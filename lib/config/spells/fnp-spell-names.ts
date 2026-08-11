import { SpellTypeEnum } from "../../src/model/spell-item/effect.enums";
import { BaseSpell } from "../../src/model/spell-item/spell-item";

/**
 * Faiths and Powers
 */
const FNP_PRIEST_SPELLS = {
  AnimateDead: {
    file: "D5P1301",
    level: 4,
    type: SpellTypeEnum.Priest,
    name: "spell.AnimateDead.name",
  },
  CauseDisease: {
    file: "D5P1329",
    level: 1,
    type: SpellTypeEnum.Priest,
    name: "spell.CauseDisease.name",
  },
  CauseCriticalWounds: {
    file: "SPPR414",
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
    file: "SPPR322",
    level: 3,
    type: SpellTypeEnum.Priest,
    name: "spell.CauseSeriousWounds.name",
  },
  CircleOfBones: {
    file: "SPPR332",
    level: 3,
    type: SpellTypeEnum.Priest,
    name: "spell.CircleOfBones.name",
  },
  CloakOfFear: {
    file: "D5P1416",
    level: 3,
    type: SpellTypeEnum.Priest,
    name: "spell.CloakOfFear.name",
  },
  DemiShadowMonsters: {
    file: "D5P2527",
    level: 4,
    type: SpellTypeEnum.Priest,
    name: "spell.DemiShadowMonsters.name",
  },
  Doom: { file: "SPPR113", level: 1, type: SpellTypeEnum.Priest, name: "spell.Doom.name" },
  Emotion: { file: "D5P2411", level: 4, type: SpellTypeEnum.Priest, name: "spell.Emotion.name" },
  GreaterMalison: {
    file: "D5P2412",
    level: 4,
    type: SpellTypeEnum.Priest,
    name: "spell.GreaterMalison.name",
  },
  Forbiddance: {
    file: "B_C201",
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
    file: "D5P1310",
    level: 2,
    type: SpellTypeEnum.Priest,
    name: "spell.MiscastMagic.name",
  },
  Poison: { file: "D5P1411", level: 4, type: SpellTypeEnum.Priest, name: "spell.Poison.name" },
  RigidThinking: {
    file: "D5P1311",
    level: 2,
    type: SpellTypeEnum.Priest,
    name: "spell.RigidThinking.name",
  },
  Shatter: {
    file: "B_PR201",
    level: 2,
    type: SpellTypeEnum.Priest,
    name: "spell.Shatter.name",
  },
  Shield: { file: "D5P2114", level: 2, type: SpellTypeEnum.Priest, name: "spell.Shield.name" },
  ShadowMonsters: {
    file: "D5P2433",
    level: 3,
    type: SpellTypeEnum.Priest,
    name: "spell.ShadowMonsters.name",
  },
  WavesOfFatigue: {
    file: "D5P2508",
    level: 4,
    type: SpellTypeEnum.Priest,
    name: "spell.WavesOfFatigue.name",
  },
  Chaos: { file: "D5P1709", level: 5, type: SpellTypeEnum.Priest, name: "spell.Chaos.name" },
  CloudOfPestilence: {
    file: "D5P1424",
    level: 5,
    type: SpellTypeEnum.Priest,
    name: "spell.CloudOfPestilence.name",
  },
  GreaterCommand: {
    file: "D5P1512",
    level: 5,
    type: SpellTypeEnum.Priest,
    name: "spell.GreaterCommand.name",
  },
  MassCauseLightWounds: {
    file: "D5P1530",
    level: 5,
    type: SpellTypeEnum.Priest,
    name: "spell.MassCauseLightWounds.name",
  },
  Shades: {
    file: "D5P2632",
    level: 5,
    type: SpellTypeEnum.Priest,
    name: "spell.Shades.name",
  },
  SlayLiving: {
    file: "D5P1511",
    level: 5,
    type: SpellTypeEnum.Priest,
    name: "spell.SlayLiving.name",
  },
  WavesOfAgony: {
    file: "D5P1533",
    level: 5,
    type: SpellTypeEnum.Priest,
    name: "spell.WavesOfAgony.name",
  },
  DolorousDecay: {
    file: "D5F1610",
    level: 6,
    type: SpellTypeEnum.Priest,
    name: "spell.DolorousDecay.name",
  },
  Harm: { file: "D5F1608", level: 6, type: SpellTypeEnum.Priest, name: "spell.Harm.name" },
  MagicResistance: {
    file: "D5F1509",
    level: 6,
    type: SpellTypeEnum.Priest,
    name: "spell.MagicResistance.name",
  },
  SummonShadows: {
    file: "D5PP422",
    level: 6,
    type: SpellTypeEnum.Priest,
    name: "spell.SummonShadows.name",
  },
  TrueSeeing: {
    file: "D5F1505",
    level: 6,
    type: SpellTypeEnum.Priest,
    name: "spell.TrueSeeing.name",
  },
  FingerOfDeath: {
    file: "D5F1708",
    level: 7,
    type: SpellTypeEnum.Priest,
    name: "spell.FingerOfDeath.name",
  },
  Wither: { file: "D5F1740", level: 7, type: SpellTypeEnum.Priest, name: "spell.Wither.name" },
} satisfies Record<string, BaseSpell>;

export const FNP_SPELLS = {
  Priest: FNP_PRIEST_SPELLS,
};

function flattenSpells(spells: Record<string, BaseSpell>): (BaseSpell & { key: string })[] {
  return Object.entries(spells).map(([key, spell]) => ({ key, ...spell }));
}

export function getAllFnpSpells() {
  return [...flattenSpells(FNP_PRIEST_SPELLS)];
}
