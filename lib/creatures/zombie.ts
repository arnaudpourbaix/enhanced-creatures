import { NEW_CREATURES } from "../config/creatures";
import { SPELLS } from "../config/spells/spell-database";
import { CommonTargetLists } from "../config/target/common";
import { CommonProjectileFiles } from "../spells/projectiles";
import effectFactory from "../src/factories/effect.factory";
import triggerFactory from "../src/factories/trigger.factory";
import { ScriptTarget } from "../src/model/constants";
import { Variant } from "../src/model/creature/variant";
import { Durations } from "../src/model/game-data/durations";
import { Triggers } from "../src/model/script/triggers";
import { BaseEffect, CastSpellEffect, DiseaseEffect, Effect } from "../src/model/spell-item/effect";
import {
  DiseaseTypeEnum,
  EffectBonusToEnum,
  EffectCastSpellTypeEnum,
  EffectColorLocationEnum,
  EffectDispelResistanceEnum,
  EffectStatisticModifierEnum,
  EffectTimingEnum,
  ItemAbilityCastingAnimationEnum,
  ItemAbilityLocationEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  KillTargetDeathTypeEnum,
  PortraitIconEnum,
  SaveTypeEnum,
  SpellTypeEnum,
  SummonCreatureModeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { PartialSpellHeader } from "../src/model/spell-item/spell-item";
import targetService from "../src/services/baf/target.service";
import { MonsterEnum } from "./monster";
import { Creature } from "../src/model/creature/creature";
import type { CreatureEntry } from "../src/model/creature/entry";
import { EntryEnum } from "./entry";
import { SimpleEntry } from "../src/model/creature/simple-entry";
import { createClaws } from "./types/undead";

enum Ids {
  ZombieDisease,
  ZombieOdorOfDeath,
  ZombieStenchOfDecay,
  ZombieAnimateDead,
}

function zombieDisease(cre: Creature) {
  const duration = Durations.day;
  return cre.addSpell({
    name: "monster.zombie.ability.disease.name",
    description: "monster.zombie.ability.disease.description",
    id: Ids.ZombieDisease,
    secondaryType: "Disease",
    keywords: ["disease"],
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
            stringRef: "monster.zombie.ability.disease.diseased",
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
          },
          {
            opcode: EffectTypeEnum.DisplayPortraitIcon,
            icon: PortraitIconEnum.Diseased,
            timing: EffectTimingEnum.InstantLimited,
            duration,
          },
          {
            opcode: EffectTypeEnum.ArmorClassBonus,
            bonusTo: EffectBonusToEnum.AllWeapons,
            value: -2,
            timing: EffectTimingEnum.InstantLimited,
            duration,
          },
          {
            opcode: EffectTypeEnum.Thac0Bonus,
            type: EffectStatisticModifierEnum.Increment,
            value: -2,
            timing: EffectTimingEnum.InstantLimited,
            duration,
          },
          {
            opcode: EffectTypeEnum.ProtectionFromSpell,
            timing: EffectTimingEnum.InstantLimited,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            duration,
          },
        ],
      },
    ],
  });
}

function createAnimateDead(cre: Creature) {
  const base: BaseEffect = {
    dispelResistance: EffectDispelResistanceEnum.DispelNotBypassResistance,
    saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
    power: 5,
  };
  const levels = [6, 7, 8, 9, 10, 11, 12];
  const headers: PartialSpellHeader[] = levels.map((level) => ({
    type: ItemAbilityTypeEnum.Melee,
    range: 10,
    speed: Durations.round,
    effects: [
      {
        opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
        type: "DEATH_IMMUNITY",
      },
      // Any living creature with fewer Hit Dice than the zombie lord can be attacked in this manner.
      {
        opcode: EffectTypeEnum.KillTarget,
        type: KillTargetDeathTypeEnum.Normal,
        displayText: true,
        timing: EffectTimingEnum.InstantPermanent,
        maxLevel: level - 1,
        ...base,
      },
      // In 2 rounds, the slain creature rises as a zombie under the zombie lord's command.
      // For some reason, delaying summon doesn't work
      {
        opcode: EffectTypeEnum.SummonCreature,
        mode: SummonCreatureModeEnum.PositionEffectAllegianceTargetOpposite,
        resource: NEW_CREATURES.Zombie,
        timing: EffectTimingEnum.InstantLimited,
        duration: 8 * Durations.hour,
        maxLevel: level - 1,
        ...base,
      },
    ],
  }));
  return cre.addSpell({
    name: "monster.zombie.ability.animateDead.name",
    description: "monster.zombie.ability.animateDead.description",
    id: Ids.ZombieAnimateDead,
    memorizedCount: 1,
    keywords: ["death", "magicResistance"],
    castingSound: "CAS_P07",
    icon: SPELLS.Priest.AnimateDead.file,
    type: SpellTypeEnum.Wizard,
    level: 5,
    castingAnimation: ItemAbilityCastingAnimationEnum.Necromancy,
    ability: {
      targets: targetService.combineListWithTriggers(CommonTargetLists.Enemies, [
        // Target level < caster level, i.e. for each k: target >= k implies caster > k.
        // Matches the header picked from the caster level, which kills up to level - 1.
        triggerFactory.levelLt(levels[levels.length - 1]),
        ...levels.slice(0, -1).map((k): Triggers.Trigger => ({
          name: "Or",
          triggers: [
            triggerFactory.levelLt(k),
            { name: "LevelGT", params: [ScriptTarget.myself, k] },
          ],
        })),
        { name: "General", params: [ScriptTarget.token, "UNDEAD"], negation: true },
      ]),
      spell: {},
    },
    headers,
  });
}

function createStenchOfDecay(cre: Creature) {
  const duration = 5 * Durations.round;
  const saveTypes = [SaveTypeEnum.ParalyzePoisonDeath];
  const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
  return cre.addSpell({
    name: "monster.zombie.ability.stenchOfDecay.name",
    description: "monster.zombie.ability.stenchOfDecay.description",
    id: Ids.ZombieStenchOfDecay,
    memorizedCount: 1,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    icon: SPELLS.Priest.CauseDisease.file,
    options: {
      renew: 1,
    },
    keywords: [],
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.LivingActor,
        range: 20,
        projectile: CommonProjectileFiles.AreaOfSightNonParty,
        speed: 1,
        effects: [
          {
            opcode: EffectTypeEnum.DisplayPortraitIcon,
            icon: PortraitIconEnum.Diseased,
            timing: EffectTimingEnum.InstantLimited,
            dispelResistance,
            duration,
            saveTypes,
          },
          {
            opcode: EffectTypeEnum.Thac0Bonus,
            type: EffectStatisticModifierEnum.Increment,
            value: -1,
            timing: EffectTimingEnum.InstantLimited,
            dispelResistance,
            duration,
            saveTypes,
          },
          {
            opcode: EffectTypeEnum.ArmorClassBonus,
            bonusTo: EffectBonusToEnum.AllWeapons,
            value: -1,
            timing: EffectTimingEnum.InstantLimited,
            dispelResistance,
            duration,
            saveTypes,
          },
          {
            opcode: EffectTypeEnum.ProtectionFromSpell,
            timing: EffectTimingEnum.InstantLimited,
            duration,
            dispelResistance,
          },
        ],
      },
    ],
    ability: {
      targets: [{ name: "NearestEnemies", limit: 1 }],
      spell: {
        type: "reallyForce",
        castOnSelf: true,
      },
      noRoundTimer: true,
      timer: { name: "StenchOfDecay", value: 6 },
    },
  });
}

function createOdorOfDeath(cre: Creature) {
  const base: CastSpellEffect = {
    opcode: EffectTypeEnum.CastSpell,
    type: EffectCastSpellTypeEnum.CastInstantlyAtCasterLevel,
    timing: EffectTimingEnum.InstantPermanent,
    saveTypes: [SaveTypeEnum.ParalyzePoisonDeath],
    dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
  };
  const weakness = createOdorOfDeathWeakness(cre);
  const strDisease = createOdorOfDeathStrDisease(cre);
  const conDisease = createOdorOfDeathConDisease(cre);
  const contagion = createOdorOfDeathContagion(cre);
  const nausea = createOdorOfDeathNausea(cre);
  const death = createOdorOfDeathDeath(cre);
  const effects = [
    weakness.file,
    strDisease.file,
    conDisease.file,
    contagion.file,
    nausea.file,
    death.file,
  ].map((resource): Effect => {
    return {
      ...base,
      resource,
    };
  });
  return cre.addSpell({
    name: "monster.zombie.ability.odorOfDeath.name",
    description: "monster.zombie.ability.odorOfDeath.description",
    id: Ids.ZombieOdorOfDeath,
    memorizedCount: 1,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    icon: SPELLS.Priest.CauseDisease.file,
    options: {
      renew: 1,
    },
    keywords: [],
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.LivingActor,
        range: 20,
        projectile: CommonProjectileFiles.AreaOfSightNonParty,
        speed: 1,
        effects: [
          ...effectFactory.splitProbabilities(effects),
          {
            opcode: EffectTypeEnum.ProtectionFromSpell,
            timing: EffectTimingEnum.InstantLimited,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            duration: Durations.hour,
          },
        ],
      },
    ],
    ability: {
      targets: [{ name: "NearestEnemies", limit: 1 }],
      spell: {
        type: "reallyForce",
        castOnSelf: true,
      },
      noRoundTimer: true,
      timer: { name: "OdorOfDeath", value: 6 },
    },
  });
}

function createOdorOfDeathWeakness(cre: Creature) {
  const duration = Durations.turn * 6;
  const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
  return cre.addSpell({
    name: "monster.zombie.ability.odorOfDeath.weakness",
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.LivingActor,
        // This spell creates a temporary palsy of feebleness that reduces the creature touched to a Strength of 3.
        // For humanoid creatures, this results in an attack penalty of -3 and a damage penalty of -1 with handheld or thrown weapons.
        // Monsters instead suffer an attack penalty of -3 and reduce each die of damage inflicted by 1 point.
        effects: [
          {
            opcode: EffectTypeEnum.DisplayPortraitIcon,
            icon: PortraitIconEnum.AbilityScoreDrained,
            timing: EffectTimingEnum.InstantLimited,
            duration,
            dispelResistance,
          },
          {
            opcode: EffectTypeEnum.StrengthBonus,
            type: EffectStatisticModifierEnum.Increment,
            value: -3,
            timing: EffectTimingEnum.InstantLimited,
            duration,
            dispelResistance,
          },
          {
            opcode: EffectTypeEnum.Thac0Bonus,
            type: EffectStatisticModifierEnum.Increment,
            value: -3,
            duration,
            dispelResistance,
          },
          {
            opcode: EffectTypeEnum.AttackDamageBonus,
            type: EffectStatisticModifierEnum.Increment,
            value: -1,
            duration,
            dispelResistance,
          },
          {
            opcode: EffectTypeEnum.ProtectionFromSpell,
            timing: EffectTimingEnum.InstantLimited,
            duration,
            dispelResistance,
          },
        ],
      },
    ],
  });
}

function createOdorOfDeathStrDisease(cre: Creature) {
  const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
  const iterations = 17;
  const initialDelay = 3 * Durations.turn;
  const base: DiseaseEffect = {
    opcode: EffectTypeEnum.Disease,
    type: DiseaseTypeEnum.ReduceStrengthByAmount,
    amount: 1,
    icon: PortraitIconEnum.AbilityScoreDrained,
    timing: EffectTimingEnum.DelayPermanent,
    dispelResistance,
  };
  const diseaseEffects: Effect[] = Array.from(Array(iterations), (_e, i) => ({
    ...base,
    timing: EffectTimingEnum.DelayPermanent,
    duration: (i + 1) * Durations.hour,
  }));
  diseaseEffects.unshift({
    ...base,
    timing: EffectTimingEnum.DelayPermanent,
    duration: initialDelay,
  });
  return cre.addSpell({
    name: "monster.zombie.ability.odorOfDeath.strengthDisease",
    secondaryType: "Disease",
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.LivingActor,
        effects: [
          {
            opcode: EffectTypeEnum.DisplayPortraitIcon,
            icon: PortraitIconEnum.Diseased,
            timing: EffectTimingEnum.InstantPermanentUntilDeath,
            dispelResistance,
          },
          ...diseaseEffects,
          {
            opcode: EffectTypeEnum.ProtectionFromSpell,
            timing: EffectTimingEnum.InstantLimited,
            duration: initialDelay + Durations.hour * iterations,
            dispelResistance,
          },
        ],
      },
    ],
  });
}

function createOdorOfDeathConDisease(cre: Creature) {
  const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
  return cre.addSpell({
    name: "monster.zombie.ability.odorOfDeath.constitutionDisease",
    secondaryType: "Disease",
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.LivingActor,
        effects: [
          {
            opcode: EffectTypeEnum.Disease,
            type: DiseaseTypeEnum.ReduceConstitutionByAmount,
            amount: 1,
            icon: PortraitIconEnum.Diseased,
            timing: EffectTimingEnum.InstantPermanent,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
          },
          {
            opcode: EffectTypeEnum.ProtectionFromSpell,
            timing: EffectTimingEnum.InstantLimited,
            duration: Durations.day,
            dispelResistance,
          },
        ],
      },
    ],
  });
}

function createOdorOfDeathContagion(cre: Creature) {
  const base: BaseEffect = {
    timing: EffectTimingEnum.InstantPermanentUntilDeath,
    dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
  };
  const diseaseEffects: Effect[] = [
    DiseaseTypeEnum.ReduceStrengthByAmount,
    DiseaseTypeEnum.ReduceDexterityByAmount,
    DiseaseTypeEnum.ReduceCharismaByAmount,
  ].map((type) => ({
    opcode: EffectTypeEnum.Disease,
    type,
    amount: 2,
    icon: PortraitIconEnum.AbilityScoreDrained,
    ...base,
  }));
  return cre.addSpell({
    name: "monster.zombie.ability.odorOfDeath.contagion",
    secondaryType: "Disease",
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.LivingActor,
        effects: [
          {
            opcode: EffectTypeEnum.DisplayPortraitIcon,
            icon: PortraitIconEnum.Diseased,
            ...base,
          },
          ...diseaseEffects,
          {
            opcode: EffectTypeEnum.Thac0Bonus,
            type: EffectStatisticModifierEnum.Increment,
            value: -2,
            ...base,
          },
          {
            opcode: EffectTypeEnum.ProtectionFromSpell,
            ...base,
          },
        ],
      },
    ],
  });
}

function createOdorOfDeathNausea(cre: Creature) {
  // Character unable to act for 1d4 rounds due to nausea and vomiting.
  const duration = Durations.round * 2;
  const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
  return cre.addSpell({
    name: "monster.zombie.ability.odorOfDeath.nausea",
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.LivingActor,
        effects: [
          {
            opcode: EffectTypeEnum.Stun,
            timing: EffectTimingEnum.InstantLimited,
            duration,
            dispelResistance,
          },
          {
            opcode: EffectTypeEnum.ProtectionFromSpell,
            timing: EffectTimingEnum.InstantLimited,
            duration,
            dispelResistance,
          },
        ],
      },
    ],
  });
}

function createOdorOfDeathDeath(cre: Creature) {
  return cre.addSpell({
    name: "monster.zombie.ability.odorOfDeath.death",
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.LivingActor,
        effects: [
          {
            opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
            type: "DEATH_IMMUNITY",
          },
          // Character dies instantly and becomes a zombie under control of the zombie lord.
          {
            opcode: EffectTypeEnum.KillTarget,
            type: KillTargetDeathTypeEnum.Normal,
            displayText: true,
            timing: EffectTimingEnum.InstantPermanent,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
          },
          {
            opcode: EffectTypeEnum.SummonCreature,
            mode: SummonCreatureModeEnum.PositionEffectAllegianceTargetOpposite,
            timing: EffectTimingEnum.InstantPermanent,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
            resource: NEW_CREATURES.Zombie,
          },
        ],
      },
    ],
  });
}

export function zombie(entry: CreatureEntry<Creature>): Creature {
  const zombie = entry.create({
    monster: MonsterEnum.Zombie,
    name: "monster.zombie.name.zombie",
    files: [NEW_CREATURES.Zombie],
    newFiles: [
      {
        files: [NEW_CREATURES.Zombie],
        copyFrom: NEW_CREATURES.Zombie,
        stringRef: "monster.zombie.name.zombie",
      },
    ],
    data: {
      level1: 2,
      bonusHp: 0,
      strength: 13,
      dexterity: 6,
      constitution: 9,
      intelligence: 1,
      wisdom: 6,
      charisma: 5,
      ac: 8,
      apr: 1,
      xpv: 65,
      alignment: "NEUTRAL",
      morale: 15,
      general: "UNDEAD",
      race: "ZOMBIE",
      class: "ZOMBIE_NORMAL",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 6,
      immunities: ["undead"],
      items: {
        remove: ["ring94", "ring95", "b1-8", "immune1", "b3-12", "ghast1"],
      },
    },
  });
  zombie.addTrait({
    immunities: ["cold"],
  });
  createClaws(zombie, {
    diceThrown: 1,
    diceSize: 8,
  });
  zombie.setAdjustments([{ files: ["L#DEERZO"], data: { apr: 2 } }]);
  return zombie;
}

export function jujuZombie(entry: CreatureEntry<Creature>): Creature {
  const juju = entry.createFrom({
    name: "monster.zombie.name.juju",
    monster: MonsterEnum.ZombieJuju,
    from: entry.creature(MonsterEnum.Zombie),
  });
  juju.setData({
    level1: 3,
    bonusHp: 12,
    thac0: 15,
    intelligence: 6,
    strength: 20,
    dexterity: 16,
    movement: 9,
    ac: 6,
    xpv: 975,
    alignment: "NEUTRAL_EVIL",
  });
  juju.addTrait({
    immunities: [
      "cold",
      "nonMagicalWeapons",
      "crushingDamageResistance",
      "piercingDamageResistance",
      "missileDamageResistance",
      "fireResistance",
      "lightning",
      "magicMissile",
    ],
  });
  createClaws(juju, {
    diceThrown: 3,
    diceSize: 4,
  });
  juju.setAdjustments([
    {
      files: ["ZOMBJU01", "NEVM5", "BHGHOUL5", "D9MBJU01"],
      stringRef: "monster.zombie.name.juju",
    },
    {
      files: ["L#RVZDOE"],
      data: {
        level1: 9,
        apr: 2,
      },
    },
    { files: ["ESXSERM"], data: { level1: 15, apr: 3, ac: -2, xpv: 2250 } },
  ]);
  juju.turnAs = "spectre";
  return juju;
}

export function zombieLord(entry: CreatureEntry<Creature>): Creature {
  const lord = entry.createFrom({
    name: "monster.zombie.name.lord",
    monster: MonsterEnum.ZombieLord,
    from: entry.creature(MonsterEnum.Zombie),
  });
  lord.setData({
    level1: 6,
    strength: 16,
    dexterity: 14,
    intelligence: 9,
    alignment: "NEUTRAL_EVIL",
    ac: 6,
    xpv: 650,
    morale: 9,
    apr: 2,
  });
  createOdorOfDeath(lord);
  createAnimateDead(lord);
  createClaws(lord, {
    diceThrown: 2,
    diceSize: 4,
  });
  lord.setBehavior({
    abilities: [entry.ability(Ids.ZombieOdorOfDeath), entry.ability(Ids.ZombieAnimateDead)],
  });
  lord.turnAs = "vampire";
  return lord;
}

export function seaZombie(entry: CreatureEntry<Creature>): Creature {
  const sea = entry.createFrom({
    name: "monster.zombie.name.sea",
    monster: MonsterEnum.ZombieSea,
    from: entry.creature(MonsterEnum.Zombie),
  });
  sea.setData({
    level1: 5,
    strength: 14,
    intelligence: 6,
    alignment: "CHAOTIC_EVIL",
    ac: 7,
    xpv: 420,
    morale: 19,
    items: {
      remove: ["zomsea", "SAHZOM01"],
    },
    size: { value: "Large", tall: true, long: false },
  });
  sea.addTrait({
    immunities: ["fireResistance", "turnUndead"],
    effects: [...effectFactory.coldResistance(-100), ...effectFactory.lightningResistance(-100)],
  });
  zombieDisease(sea);
  createStenchOfDecay(sea);
  createClaws(sea, {
    diceThrown: 1,
    diceSize: 10,
    castSpell: {
      probability1: 10,
      spell: entry.spell(Ids.ZombieDisease).file,
    },
  });
  sea.setBehavior({
    abilities: [
      entry.ability(Ids.ZombieOdorOfDeath),
      entry.ability(Ids.ZombieStenchOfDecay),
      entry.ability(Ids.ZombieAnimateDead),
    ],
  });
  // There is a 50% chance that each drowned one encountered is a priest of level 1d4. These creatures are granted their spells directly from Nerull (or similar deity), receiving only baneful spells.
  seaZombieLordVariant(sea, entry);
  sea.setAdjustments([
    { files: ["VA#ZOM01", "VA#ZOM02", "VA#ZOM03", "VA#ZOMGL"], data: { level1: 7 } },
  ]);
  return sea;
}

function seaZombieLordVariant(base: Creature, entry: CreatureEntry<Creature>): Variant {
  return base.variant("Sea Zombie Lord", {
    data: {
      level1: 6,
      intelligence: 9,
      ac: 6,
      apr: 2,
      spells: {
        memorized: [
          { file: entry.spell(Ids.ZombieAnimateDead).file, memorizedCount: 1 },
          { file: entry.spell(Ids.ZombieOdorOfDeath).file, memorizedCount: 1 },
        ],
      },
    },
    files: ["SAHZOM01"],
    adjust: [{ files: ["SAHZOM01"], data: { level1: 12, ac: -3, xpv: 2000, apr: 3 } }],
  });
}

export function zombieMonster(entry: CreatureEntry<Creature>): Creature {
  const monster = entry.createFrom({
    name: "monster.zombie.name.monster",
    monster: MonsterEnum.ZombieMonster,
    from: entry.creature(MonsterEnum.Zombie),
  });
  monster.setData({
    level1: 6,
    movement: 9,
    ac: 6,
    xpv: 650,
    size: { value: "Large", tall: true, long: false },
  });
  createClaws(monster, {
    diceThrown: 4,
    diceSize: 4,
  });
  return monster;
}

export const createZombieEntry = () =>
  new SimpleEntry(EntryEnum.Zombie, [zombie, zombieLord, jujuZombie, seaZombie]);
