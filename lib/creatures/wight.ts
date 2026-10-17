import effectFactory from "../src/factories/effect.factory";
import {
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { MonsterEnum } from "./monster";
import { Ids } from "./undead/ids";
import { Creature } from "../src/model/creature/creature";
import type { CreatureEntry } from "../src/model/creature/entry";
import { EntryEnum } from "./entry";
import { UndeadEntry } from "./undead/undead-entry";
import { createClaws } from "./types/undead";

function wightTouch(cre: Creature) {
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

export function wight(family: CreatureEntry<Creature>): Creature {
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
      immunities: ["undead"],
      items: {
        remove: ["wight", "bdwight", "ring95", "immune1"],
      },
    },
  });
  wightTouch(wight);
  createClaws(wight, {
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

export const createWightEntry = () => new UndeadEntry(EntryEnum.Wight, [wight]);
