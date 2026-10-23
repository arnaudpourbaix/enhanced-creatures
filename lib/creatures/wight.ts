import effectFactory from "../src/factories/effect.factory";
import {
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { MonsterEnum } from "./monster";
import { Creature } from "../src/model/creature/creature";
import type { CreatureEntry } from "../src/model/creature/entry";
import { EntryEnum } from "./entry";
import { SimpleEntry } from "../src/model/creature/simple-entry";
import { createClaws } from "./types/undead";

enum Ids {
  WightTouch,
}

function wightTouch(cre: Creature) {
  return cre.addSpell({
    name: "monster.wight.ability.touch.name",
    description: "monster.wight.ability.touch.description",
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

export function wight(entry: CreatureEntry<Creature>): Creature {
  const wight = entry.create({
    monster: MonsterEnum.Wight,
    name: "monster.wight.name",
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
      spell: entry.spell(Ids.WightTouch).file,
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

export const createWightEntry = () => new SimpleEntry(EntryEnum.Wight, [wight]);
