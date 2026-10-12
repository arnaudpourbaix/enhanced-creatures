import { SPELLS } from "../../config/spells/spell-database";
import { CommonProjectileFiles } from "../../spells/projectiles";
import effectFactory from "../../src/factories/effect.factory";
import { Variant } from "../../src/model/creature/variant";
import { Durations } from "../../src/model/game-data/durations";
import { BaseEffect, CastSpellEffect, Effect } from "../../src/model/spell-item/effect";
import {
  DiseaseTypeEnum,
  EffectBonusToEnum,
  EffectCastSpellTypeEnum,
  EffectColorLocationEnum,
  EffectDispelResistanceEnum,
  EffectStatisticModifierEnum,
  EffectTargetEnum,
  EffectTimingEnum,
  EffectVisualEffectLocationEnum,
  ItemAbilityLocationEnum,
  ItemAbilityPrimaryTypeEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTargetEnum,
  ItemAbilityTypeEnum,
  KillTargetDeathTypeEnum,
  PortraitIconEnum,
  SaveTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum } from "../monster";
import type { UndeadFamily } from "./family";
import { Ids } from "./ids";
import { Undead } from "./undead-creature";

function zombieDisease(cre: Undead) {
  const duration = Durations.day;
  return cre.addSpell({
    description: "monster.undead.ability.zombieDisease.name",
    name: "monster.undead.ability.zombieDisease.name",
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
            stringRef: "monster.undead.ability.zombieDisease.description",
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
            duration,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
          },
        ],
      },
    ],
  });
}

function createStenchOfDecay(cre: Undead) {
  const duration = 5 * Durations.round;
  const saveTypes = [SaveTypeEnum.ParalyzePoisonDeath];
  const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
  return cre.addSpell({
    name: "monster.undead.ability.zombieStenchOfDecay.name",
    description: "monster.undead.ability.zombieStenchOfDecay.description",
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

function createOdorOfDeath(cre: Undead) {
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
  const resources = [
    weakness.file,
    strDisease.file,
    conDisease.file,
    contagion.file,
    nausea.file,
    death.file,
  ];
  return cre.addSpell({
    name: "monster.undead.ability.zombieOdorOfDeath.name",
    description: "monster.undead.ability.zombieOdorOfDeath.description",
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
          {
            ...base,
            resource: weakness.file,
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

function createOdorOfDeathWeakness(cre: Undead) {
  const duration = Durations.turn * 6;
  const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
  return cre.addSpell({
    name: "monster.undead.ability.zombieOdorOfDeath.weakness",
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

function createOdorOfDeathStrDisease(cre: Undead) {
  const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
  const diseaseEffects: Effect[] = Array.from(Array(17), (_e, i) => ({
    opcode: EffectTypeEnum.Disease,
    type: DiseaseTypeEnum.ReduceStrengthByAmount,
    amount: 1,
    icon: PortraitIconEnum.Diseased,
    timing: EffectTimingEnum.DelayPermanent,
    duration: (i + 1) * Durations.hour,
    dispelResistance,
  }));
  return cre.addSpell({
    name: "monster.undead.ability.zombieOdorOfDeath.strengthDisease",
    secondaryType: "Disease",
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.LivingActor,
        effects: [
          ...diseaseEffects,
          {
            opcode: EffectTypeEnum.ProtectionFromSpell,
            timing: EffectTimingEnum.InstantLimited,
            duration: Durations.hour * 17,
            dispelResistance,
          },
        ],
      },
    ],
  });
}

function createOdorOfDeathConDisease(cre: Undead) {
  const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
  return cre.addSpell({
    name: "monster.undead.ability.zombieOdorOfDeath.constitutionDisease",
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

function createOdorOfDeathContagion(cre: Undead) {
  const base: BaseEffect = {
    timing: EffectTimingEnum.InstantPermanent,
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
    icon: PortraitIconEnum.Diseased,
    ...base,
  }));
  return cre.addSpell({
    name: "monster.undead.ability.zombieOdorOfDeath.contagion",
    secondaryType: "Disease",
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.LivingActor,
        effects: [
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

function createOdorOfDeathNausea(cre: Undead) {
  const duration = Durations.round * 2;
  const dispelResistance = EffectDispelResistanceEnum.NaturalNonMagical;
  return cre.addSpell({
    name: "monster.undead.ability.zombieOdorOfDeath.nausea",
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.LivingActor,
        effects: [
          // Character unable to act for 1d4 rounds due to nausea and vomiting.
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

function createOdorOfDeathDeath(cre: Undead) {
  return cre.addSpell({
    name: "monster.undead.ability.zombieOdorOfDeath.death",
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        location: ItemAbilityLocationEnum.Ability,
        target: ItemAbilityTargetEnum.LivingActor,
        effects: [
          // Character dies instantly and becomes a zombie under control of the zombie lord.
          {
            opcode: EffectTypeEnum.KillTarget,
            type: KillTargetDeathTypeEnum.Normal,
            displayText: true,
            timing: EffectTimingEnum.InstantPermanent,
            dispelResistance: EffectDispelResistanceEnum.NaturalNonMagical,
          },
        ],
      },
    ],
  });
}

function wightTouch(cre: Undead) {
  return cre.addSpell({
    name: "monster.undead.ability.wightTouch.name",
    description: "monster.undead.ability.wightTouch.description",
    id: Ids.WightTouch,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    keywords: ["levelDrain"],
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        range: 5,
        effects: [
          ...effectFactory.levelDrain({
            levels: 1,
          }),
        ],
      },
    ],
  });
}

export function wight(family: UndeadFamily): Undead {
  const wight = family.create({
    monster: MonsterEnum.Wight,
    name: "monster.undead.name.wight",
    files: [],
    data: {
      level1: 4,
      bonusHp: 3,
      strength: 15,
      dexterity: 14,
      constitution: 9,
      intelligence: 9,
      wisdom: 13,
      charisma: 15,
      ac: 5,
      apr: 1,
      xpv: 1400,
      alignment: "LAWFUL_EVIL",
      morale: 14,
      general: "UNDEAD",
      race: "ZOMBIE",
      class: "WIGHT",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
      items: {
        remove: ["wight", "bdwight", "ring95", "immune1"],
      },
    },
  });
  wightTouch(wight);
  wight.createClaws({
    diceThrown: 1,
    diceSize: 4,
    castSpell: {
      spell: family.spell(Ids.WightTouch).file,
    },
  });
  wight.addTrait({
    immunities: ["cold", "nonSilverNonMagicalWeapons"],
  });
  wight.setAdjustments([
    {
      files: ["BDWIGHT3"],
      data: {
        level1: 7,
      },
      noWeapon: true,
    },
    {
      files: ["NEVM1"],
      data: {
        animation: "WIGHT_GRAY",
      },
    },
  ]);
  return wight;
}

export function zombie(family: UndeadFamily): Undead {
  const zombie = family.create({
    monster: MonsterEnum.Zombie,
    name: "monster.undead.name.zombie",
    files: [],
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
      items: {
        remove: ["ring94", "ring95", "b1-8", "immune1", "b3-12", "ghast1"],
      },
    },
  });
  zombie.addTrait({
    immunities: ["cold"],
  });
  zombie.createClaws({
    diceThrown: 1,
    diceSize: 8,
  });
  zombie.setAdjustments([{ files: ["L#DEERZO"], data: { apr: 2 } }]);
  return zombie;
}

export function jujuZombie(family: UndeadFamily): Undead {
  const juju = family.createFrom({
    name: "monster.undead.name.zombieJuju",
    monster: MonsterEnum.ZombieJuju,
    from: family.creature(MonsterEnum.Zombie),
  });
  juju.setData({
    level1: { pnpValue: 3, value: 7, type: "turn" },
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
  juju.createClaws({
    diceThrown: 3,
    diceSize: 4,
  });
  juju.setAdjustments([
    {
      files: ["ZOMBJU01", "NEVM5", "BHGHOUL5", "D9MBJU01"],
      stringRef: "monster.undead.name.zombieJuju",
    },
  ]);
  return juju;
}

export function zombieLord(family: UndeadFamily): Undead {
  const lord = family.createFrom({
    name: "monster.undead.name.zombieLord",
    monster: MonsterEnum.ZombieLord,
    from: family.creature(MonsterEnum.Zombie),
  });
  lord.setData({
    level1: { pnpValue: 6, value: 8, type: "turn" },
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
  lord.createClaws({
    diceThrown: 2,
    diceSize: 4,
  });
  // Once per day, the zombie lord can animate dead to transform dead creatures into zombies.
  // This works as described in the Player's Handbook except that it can be used on the living.
  // Any living creature with fewer Hit Dice than the zombie lord can be attacked in this manner.
  // A target who fails a saving throw vs. death is slain.
  // In 1d4 rounds, the slain creature rises as a zombie under the zombie lord's command.
  lord.setBehavior({
    abilities: [family.ability(Ids.ZombieOdorOfDeath)],
  });
  return lord;
}

export function seaZombie(family: UndeadFamily): Undead {
  const sea = family.createFrom({
    name: "monster.undead.name.zombieSea",
    monster: MonsterEnum.ZombieSea,
    from: family.creature(MonsterEnum.Zombie),
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
      remove: ["zomsea"],
    },
    size: { value: "Large", tall: true, long: false },
  });
  sea.addTrait({
    immunities: ["fireResistance", "turnUndead"],
    effects: [...effectFactory.coldResistance(-100), ...effectFactory.lightningResistance(-100)],
  });
  zombieDisease(sea);
  createStenchOfDecay(sea);
  sea.createClaws({
    diceThrown: 1,
    diceSize: 10,
    castSpell: {
      probability1: 10,
      spell: family.spell(Ids.ZombieDisease).file,
    },
  });
  sea.setBehavior({
    abilities: [family.ability(Ids.ZombieOdorOfDeath), family.ability(Ids.ZombieStenchOfDecay)],
  });
  // There is a 50% chance that each drowned one encountered is a priest of level 1d4. These creatures are granted their spells directly from Nerull (or similar deity), receiving only baneful spells.
  seaZombieLordVariant(sea);
  return sea;
}

function seaZombieLordVariant(base: Undead): Variant {
  const seaLord = base.variant("Sea Zombie Lord", {
    data: {
      level1: { pnpValue: 6, value: 8, type: "turn" },
      intelligence: 9,
      ac: 6,
      apr: 2,
    },
    files: ["SAHZOM01"],
    adjust: [{ files: ["SAHZOM01"], data: { level1: 12, ac: -3, xpv: 2000, apr: 3 } }],
  });
  return seaLord;
}

export function zombieMonster(family: UndeadFamily): Undead {
  const monster = family.createFrom({
    name: "monster.undead.name.zombieMonster",
    monster: MonsterEnum.ZombieMonster,
    from: family.creature(MonsterEnum.Zombie),
  });
  monster.setData({
    level1: 6,
    movement: 9,
    ac: 6,
    xpv: 650,
    size: { value: "Large", tall: true, long: false },
  });
  monster.createClaws({
    diceThrown: 4,
    diceSize: 4,
  });
  return monster;
}
