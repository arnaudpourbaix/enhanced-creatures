import effectFactory from "../src/factories/effect.factory";
import { Variant } from "../src/model/creature/variant";
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

function wraithTouch(cre: Creature) {
  return cre.addSpell({
    name: "monster.undead.ability.wraithTouch.name",
    description: "monster.undead.ability.wraithTouch.description",
    id: Ids.WraithTouch,
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

export function wraith(family: CreatureEntry<Creature>): Creature {
  const wraith = family.create({
    monster: MonsterEnum.Wraith,
    name: "monster.undead.name.wraith",
    files: [],
    data: {
      level1: 5,
      bonusHp: 3,
      strength: 6,
      dexterity: 16,
      constitution: 9,
      intelligence: 12,
      wisdom: 14,
      charisma: 15,
      ac: 4,
      apr: 1,
      xpv: 2000,
      alignment: "LAWFUL_EVIL",
      morale: 15,
      general: "UNDEAD",
      race: "WRAITH",
      class: "WRAITH",
      gender: "NIETHER",
      animation: "SHADOW",
      size: { value: "Medium", tall: true, long: false },
      movement: 24, // 12, FI 24 (B)
      immunities: ["undead"],
      items: {
        remove: ["wraith1", "ring95", "immune1", "immchs", "s1-8", "undtype", "dvwraith"],
      },
    },
  });
  wraith.addTrait({
    immunities: ["cold", "nonSilverNonMagicalWeapons"],
  });
  wraithTouch(wraith);
  createClaws(wraith, {
    diceThrown: 1,
    diceSize: 6,
    castSpell: {
      spell: family.spell(Ids.WraithTouch).file,
    },
  });
  wraith.setAdjustments([
    {
      files: ["AC#FPWRA"],
      data: {
        script: {
          location: "None",
        },
      },
    },
  ]);
  greaterWraithVariant(wraith);
  return wraith;
}

function greaterWraithVariant(base: Creature): Variant {
  return base.variant("Greater Wraith", {
    data: {
      level1: 9,
      ac: 2,
      xpv: 3000,
    },
    files: ["AC#DT30W", "FIRWRA01"],
    adjust: [],
  });
}

export const createWraithEntry = () => new UndeadEntry(EntryEnum.Wraith, [wraith]);
