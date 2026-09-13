/**
 * Mummies: mummy, greater mummy.
 *
 * Shared weapon primitives live on `Undead` (undead-creature.ts); ability ids in ids.ts.
 */
import effectFactory from "../../src/factories/effect.factory";
import { FNP_SPELLS } from "../../config/spells/fnp-spell-names";
import { SPELLS } from "../../config/spells/spell-names";
import { CommonProjectileFiles } from "../../spells/projectiles";
import { StringReference } from "../../src/model/final/stringref";
import { Durations } from "../../src/model/game-data/durations";
import { Effect } from "../../src/model/spell-item/effect";
import {
  DiseaseTypeEnum,
  EffectCastSpellTypeEnum,
  EffectColorLocationEnum,
  EffectDispelResistanceEnum,
  EffectIDSFileEnum,
  EffectStatisticModifierEnum,
  EffectTimingEnum,
  ItemAbilityLocationEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  KillTargetDeathTypeEnum,
  PortraitIconEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { PartialSpell } from "../../src/model/spell-item/spell-item";
import { MonsterEnum } from "../monster";
import { Ids } from "./ids";
import type { UndeadFamily } from "./family";
import { Undead } from "./undead-creature";
import responseFactory from "../../src/factories/response.factory";
import triggerFactory from "../../src/factories/trigger.factory";
import spellService from "../../src/services/spell.service";

function mummyRottingDisease(cre: Undead, greater: boolean) {
  // Mummy: PnP is 1-6 months, replaced by 6 days in the game
  // Greater Mummy: PnP is 1-6 days, replaced by 48 hours in the game
  const count = 6;
  const interval = greater ? Durations.eightHours : Durations.day;
  const description: StringReference = greater
    ? "monster.undead.ability.mummyRottingDisease.greaterDescription"
    : "monster.undead.ability.mummyRottingDisease.description";
  const disease: { type: DiseaseTypeEnum; amount: number }[] = [
    { type: DiseaseTypeEnum.ReduceCharismaByAmount, amount: 2 },
  ];
  if (greater) {
    disease.push(
      { type: DiseaseTypeEnum.ReduceStrengthByAmount, amount: 1 },
      { type: DiseaseTypeEnum.ReduceConstitutionByAmount, amount: 1 },
    );
  }
  const diseaseEffects: Effect[] = Array.from(Array(count), (_e, i) =>
    disease.map(
      (e) =>
        ({
          opcode: EffectTypeEnum.Disease,
          type: e.type,
          amount: e.amount,
          icon: PortraitIconEnum.Diseased,
          timing: EffectTimingEnum.DelayPermanent,
          duration: (i + 1) * interval,
          dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
        }) as Effect,
    ),
  ).flat();
  return cre.addSpell({
    description,
    name: "monster.undead.ability.mummyRottingDisease.name",
    id: greater ? Ids.GreaterMummyRottingDisease : Ids.MummyRottingDisease,
    secondaryType: "Disease",
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        range: 5,
        effects: [
          {
            opcode: EffectTypeEnum.CharacterColorPulse,
            color: { red: 43, green: 79, blue: 0 },
            cycleSpeed: 0,
            location: EffectColorLocationEnum.ArmorGreyBeltAmulet,
            timing: EffectTimingEnum.InstantLimited,
            duration: 2,
          },
          {
            opcode: EffectTypeEnum.DisplayString,
            stringRef: "monster.undead.ability.mummyRottingDisease.diseased",
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
          },
          {
            opcode: EffectTypeEnum.DisplayPortraitIcon,
            icon: PortraitIconEnum.Diseased,
            timing: EffectTimingEnum.InstantLimited,
            duration: count * interval,
          },
          ...diseaseEffects,
          {
            opcode: EffectTypeEnum.DisplayString,
            stringRef: "monster.undead.ability.mummyRottingDisease.warning",
            timing: EffectTimingEnum.DelayPermanent,
            duration: (count - 1) * interval,
          },
          {
            opcode: EffectTypeEnum.DisplayString,
            stringRef: "monster.undead.ability.mummyRottingDisease.death",
            timing: EffectTimingEnum.DelayPermanent,
            duration: count * interval - 1,
          },
          {
            opcode: EffectTypeEnum.KillTarget,
            type: KillTargetDeathTypeEnum.Normal,
            displayText: true,
            timing: EffectTimingEnum.DelayPermanent,
            duration: count * interval,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
          },
          {
            opcode: EffectTypeEnum.ProtectionFromSpell,
            timing: EffectTimingEnum.InstantLimited,
            duration: count * interval,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
          },
        ],
        immunityEffect: {
          names: ["cureWoundSpells"],
          duration: count * interval,
          dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
        },
      },
    ],
  });
}

function mummyFearAura(cre: Undead, greater: boolean) {
  const humanBonus = greater ? -1 : 2;
  const othersBonus = greater ? -3 : 0;
  const description: StringReference = greater
    ? "monster.undead.ability.mummyFearAura.greaterDescription"
    : "monster.undead.ability.mummyFearAura.description";
  const humans = mummyFearAuraTechnical(cre, humanBonus, false);
  const others = mummyFearAuraTechnical(cre, othersBonus, true);
  return cre.addSpell({
    description,
    name: "monster.undead.ability.mummyFearAura.name",
    id: greater ? Ids.GreaterMummyFearAura : Ids.MummyFearAura,
    memorizedCount: 1,
    icon: SPELLS.Priest.CloakOfFear.file,
    options: { renew: 2 },
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.AnyPointWithinRange,
        speed: 1,
        projectile: CommonProjectileFiles.AreaOfSightNonParty,
        range: 30,
        effects: [
          {
            opcode: EffectTypeEnum.CastSpell,
            type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
            resource: others.file,
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
          },
          {
            opcode: EffectTypeEnum.UseEFFFile,
            idsFile: EffectIDSFileEnum.RACE,
            idsEntry: "HUMAN",
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
          },
        ],
      },
    ],
    effectFiles: [
      {
        opcode: EffectTypeEnum.CastSpell,
        type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
        resource: humans.file,
        timing: EffectTimingEnum.InstantPermanentUntilDeath,
      },
    ],
    ability: {
      preset: SPELLS.Priest.CloakOfFear.file,
      spell: {
        type: "force",
        remove: true,
      },
    },
  });
}

function mummyFearAuraTechnical(cre: Undead, saveBonus: number, excludeHumans: boolean) {
  const duration = 3 * Durations.round;
  const saveType = SaveTypeEnum.Spell;
  const effects: Effect[] = [
    ...effectFactory.paralyze({
      duration,
      saveType,
      saveBonus,
      pulse: {
        red: 128,
        green: 64,
        blue: 0,
        speed: 20,
      },
    }),
    ...effectFactory.fear({
      duration,
      saveType,
      saveBonus,
      startSound: "",
      endSound: "",
    }),
    {
      opcode: EffectTypeEnum.DisplayString,
      stringRef: "monster.undead.ability.mummyFearAura.frightened",
      timing: EffectTimingEnum.InstantPermanentUntilDeath,
      saveTypes: [saveType],
      saveBonus,
    },
    {
      opcode: EffectTypeEnum.ProtectionFromSpell,
      timing: EffectTimingEnum.InstantLimited,
      duration: Durations.turn,
    },
  ];
  const spell: PartialSpell = {
    name: "monster.undead.ability.mummyFearAura.name",
    secondaryType: "Fear",
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Spell,
        target: ItemAbilityTargetEnum.LivingActor,
        effects,
      },
    ],
    effectFiles: [],
  };
  if (excludeHumans) {
    effects.unshift({
      opcode: EffectTypeEnum.UseEFFFile,
      idsFile: EffectIDSFileEnum.RACE,
      idsEntry: "HUMAN",
      timing: EffectTimingEnum.InstantLimited,
      duration: 1,
    });
  }
  return cre.addSpell(spell);
}

export function mummy(family: UndeadFamily): Undead {
  const mummy = family.create({
    monster: MonsterEnum.Mummy,
    name: "monster.undead.name.mummy",
    files: [],
    data: {
      level1: 6,
      bonusHp: 3,
      strength: 16,
      dexterity: 8,
      constitution: 9,
      intelligence: 7,
      wisdom: 10,
      charisma: 12,
      ac: 3,
      apr: 1,
      xpv: 3000,
      alignment: "LAWFUL_EVIL",
      morale: 15,
      general: "UNDEAD",
      race: "GHOUL",
      class: "GHOUL_REVEANT",
      animation: "MUMMY",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 6,
      immunities: ["undead"],
      items: {
        remove: ["ring95", "immune1", "bdmumm01", "mummyw", "AC#FPMMY", "B1-8"],
      },
      script: {
        remove: ["bdmumm01", "d0mummy"],
      },
    },
  });
  mummy.addTrait({
    immunities: ["physicalDamageResistance", "cold", "nonMagicalWeapons"],
    effects: effectFactory.fireResistance(-33),
  });
  mummyFearAura(mummy, false);
  mummyRottingDisease(mummy, false);
  mummy.createClaws({
    diceThrown: 1,
    diceSize: 12,
    castSpell: {
      spell: family.spell(Ids.MummyRottingDisease).file,
    },
  });
  mummy.setBehavior({
    restHeal: true,
    abilities: [family.ability(Ids.MummyFearAura)],
  });
  mummy.setAdjustments([
    { files: ["BDMUMMY"], data: { level1: 9, strength: 18, exceptionalStrength: 100 } },
  ]);
  return mummy;
}

export function greaterMummy(family: UndeadFamily): Undead {
  // Age: 400-499
  const greater = family.create({
    monster: MonsterEnum.GreaterMummy,
    name: "monster.undead.name.greaterMummy",
    files: [],
    data: {
      level1: { pnpValue: 12, value: 20, type: "caster" },
      bonusHp: 3,
      strength: 15,
      dexterity: 16,
      constitution: 9,
      intelligence: 18,
      wisdom: 22,
      charisma: 20,
      ac: -2,
      apr: 1,
      xpv: 16000,
      alignment: "LAWFUL_EVIL",
      morale: 18,
      general: "UNDEAD",
      race: "GHOUL",
      class: "CLERIC",
      animation: "MUMMY",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 9,
      immunities: ["undead"],
      items: {
        remove: [
          "ring95",
          "immune1",
          "immune2",
          "immune3",
          "mumgrew",
          "ohhgmum1",
          "reghp1",
          "B1-8",
        ],
      },
      script: {
        remove: ["bdmumm01", "d0mummy", "mummy01", "ohhgmum", "dx#mummc"],
      },
      spells: {
        spellbooks: spellService.createSpellbooks({
          name: "EvilUndeadCleric",
          casterLevel: 20,
          type: "cleric",
          wisdom: 22,
        }),
      },
    },
  });
  greater.addTrait({
    immunities: ["physicalDamageResistance", "cold", "plusTwoWeapons"],
    effects: [
      {
        opcode: EffectTypeEnum.MagicResistanceModifier,
        type: EffectStatisticModifierEnum.Set,
        value: 20,
      },
      {
        opcode: EffectTypeEnum.FireResistanceModifier,
        type: EffectStatisticModifierEnum.Set,
        value: 100,
      },
      {
        opcode: EffectTypeEnum.ElectricityResistanceModifier,
        type: EffectStatisticModifierEnum.Set,
        value: -50,
      },
    ],
  });
  mummyFearAura(greater, true);
  mummyRottingDisease(greater, true);
  greater.createClaws({
    diceThrown: 3,
    diceSize: 6,
    castSpell: {
      spell: family.spell(Ids.GreaterMummyRottingDisease).file,
    },
  });
  greater.setBehavior({
    restHeal: true,
    abilities: {
      entries: [{ abilityId: Ids.GreaterMummyFearAura, insertFirst: true }],
    },
    dialog: ["mumgre01"],
    customCodes: [
      {
        location: "init",
        type: "insertBefore",
        statements: [
          {
            triggers: [
              {
                name: "Or",
                triggers: [
                  {
                    name: "HPLT",
                    params: ["dx#dalid", 10],
                  },
                  {
                    name: "Dead",
                    params: ["dx#dalid"],
                  },
                ],
              },
            ],
            responses: responseFactory.response([
              { name: "Shout", params: ["ATTACK89"] },
              { name: "Enemy" },
            ]),
          },
        ],
      },
    ],
  });
  greater.setAdjustments([
    {
      files: ["OHHKUNG"],
      data: { strength: 20 },
    },
  ]);
  return greater;
}
