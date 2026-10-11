import effectFactory from "../../src/factories/effect.factory";
import {
  EffectStatisticModifierEnum,
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTypeEnum,
} from "../../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../../src/model/spell-item/effect.type";
import { MonsterEnum } from "../monster";
import type { UndeadFamily } from "./family";
import { Ids } from "./ids";
import { Undead } from "./undead-creature";

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
        remove: ["ring94", "b1-8", "immune1", "b3-12"],
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
  return zombie;
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

export function zombieJuju(family: UndeadFamily): Undead {
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
  juju.setAdjustments([{ files: ["ZOMBJU01"], stringRef: "monster.undead.name.zombieJuju" }]);
  return juju;
}

export function zombieSea(family: UndeadFamily): Undead {
  const sea = family.createFrom({
    name: "monster.undead.name.zombieSea",
    monster: MonsterEnum.ZombieSea,
    from: family.creature(MonsterEnum.Zombie),
  });
  sea.setData({
    level1: 5,
    intelligence: 6,
    alignment: "CHAOTIC_EVIL",
    ac: 7,
    xpv: 420,
    morale: 19,
    size: { value: "Large", tall: true, long: false },
  });
  sea.addTrait({
    immunities: ["fireResistance", "turnUndead"],
    effects: [...effectFactory.coldResistance(-100), ...effectFactory.lightningResistance(-100)],
  });
  sea.createClaws({
    diceThrown: 1,
    diceSize: 10,
    // 10% chance of causing a severe disease in the victim
  });
  //Their visage and the stench of decay surrounding them are so disgusting that anyone seeing a drowned one or coming within 20 feet of one must roll a saving throw vs. poison. A failed saving throw indicates that the character is nauseated, suffering a -1 penalty to his attack roll and a +1 penalty to his AC for 2d4 rounds
  //
  // There is a 50% chance that each drowned one encountered is a priest of level 1d4. These creatures are granted their spells directly from Nerull (or similar deity), receiving only baneful spells.
  return sea;
}
