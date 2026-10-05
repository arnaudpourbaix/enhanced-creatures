/**
 * Lesser corporeal undead: wight, wraith, zombie, juju zombie, sea zombie.
 *
 * Shared weapon primitives live on `Undead` (undead-creature.ts).
 */
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
  ]);
  return wight;
}

export function wraith(family: UndeadFamily): Undead {
  const wraith = family.create({
    monster: MonsterEnum.Wraith,
    name: "monster.undead.name.wraith",
    files: [],
    data: {
      level1: 3,
      bonusHp: 2,
      strength: 17,
      dexterity: 15,
      constitution: 9,
      intelligence: 10,
      wisdom: 10,
      charisma: 1,
      ac: 5,
      apr: 1,
      xpv: 1400,
      alignment: "LAWFUL_EVIL",
      morale: 15,
      general: "MONSTER",
      race: "SPIDER",
      class: "SPIDER_WRAITH",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
    },
  });
  wraith.addTrait({
    immunities: ["cold", "nonSilverNonMagicalWeapons"],
    effects: [
      {
        opcode: EffectTypeEnum.MagicResistanceModifier,
        value: 15,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
  });
  wraith.setBehavior({
    dialog: ["C#Q04009", "ttspid"],
  });
  return wraith;
}

export function zombie(family: UndeadFamily): Undead {
  const zombie = family.create({
    monster: MonsterEnum.Zombie,
    name: "monster.undead.name.zombie",
    files: [],
    data: {
      level1: 3,
      bonusHp: 2,
      strength: 17,
      dexterity: 15,
      constitution: 9,
      intelligence: 10,
      wisdom: 10,
      charisma: 1,
      ac: 5,
      apr: 1,
      xpv: 1400,
      alignment: "LAWFUL_EVIL",
      morale: 15,
      general: "MONSTER",
      race: "SPIDER",
      class: "SPIDER_WRAITH",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
    },
  });
  zombie.addTrait({
    immunities: ["cold", "nonSilverNonMagicalWeapons"],
    effects: [
      {
        opcode: EffectTypeEnum.MagicResistanceModifier,
        value: 15,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
  });
  zombie.setBehavior({
    dialog: ["C#Q04009", "ttspid"],
  });
  return zombie;
}

export function zombieJuju(family: UndeadFamily): Undead {
  const wraith = family.create({
    monster: MonsterEnum.ZombieJuju,
    name: "monster.undead.name.zombieJuju",
    files: [],
    data: {
      level1: 3,
      bonusHp: 2,
      strength: 17,
      dexterity: 15,
      constitution: 9,
      intelligence: 10,
      wisdom: 10,
      charisma: 1,
      ac: 5,
      apr: 1,
      xpv: 1400,
      alignment: "LAWFUL_EVIL",
      morale: 15,
      general: "MONSTER",
      race: "SPIDER",
      class: "SPIDER_WRAITH",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
    },
  });
  wraith.addTrait({
    immunities: ["cold", "nonSilverNonMagicalWeapons"],
    effects: [
      {
        opcode: EffectTypeEnum.MagicResistanceModifier,
        value: 15,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
  });
  wraith.setBehavior({
    dialog: ["C#Q04009", "ttspid"],
  });
  return wraith;
}

export function zombieSea(family: UndeadFamily): Undead {
  const wraith = family.create({
    monster: MonsterEnum.ZombieSea,
    name: "monster.undead.name.zombieSea",
    files: [],
    data: {
      level1: 3,
      bonusHp: 2,
      strength: 17,
      dexterity: 15,
      constitution: 9,
      intelligence: 10,
      wisdom: 10,
      charisma: 1,
      ac: 5,
      apr: 1,
      xpv: 1400,
      alignment: "LAWFUL_EVIL",
      morale: 15,
      general: "MONSTER",
      race: "SPIDER",
      class: "SPIDER_WRAITH",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
    },
  });
  wraith.addTrait({
    immunities: ["cold", "nonSilverNonMagicalWeapons"],
    effects: [
      {
        opcode: EffectTypeEnum.MagicResistanceModifier,
        value: 15,
        type: EffectStatisticModifierEnum.Set,
      },
    ],
  });
  wraith.setBehavior({
    dialog: ["C#Q04009", "ttspid"],
  });
  return wraith;
}
