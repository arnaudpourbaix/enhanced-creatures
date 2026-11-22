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
  SpecterTouch,
}

function specterTouch(cre: Creature) {
  return cre.addSpell({
    name: "monster.spectre.ability.touch.name",
    description: "monster.spectre.ability.touch.description",
    id: Ids.SpecterTouch,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    keywords: ["levelDrain"],
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        range: 5,
        effects: [
          ...effectFactory.levelDrain({
            levels: 2,
          }),
        ],
      },
    ],
  });
}

export function spectre(entry: CreatureEntry<Creature>): Creature {
  const spectre = entry.create({
    monster: MonsterEnum.Spectre,
    name: "monster.spectre.name",
    files: [],
    data: {
      level1: 7,
      bonusHp: 3,
      strength: 1,
      dexterity: 14,
      constitution: 9,
      intelligence: 14,
      wisdom: 10,
      charisma: 11,
      ac: 2,
      apr: 1,
      xpv2e: 3000,
      alignment: "LAWFUL_EVIL",
      morale: 15,
      general: "UNDEAD",
      race: "SPECTRE",
      class: "SPECTRE",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 30, // 15, FI 30 (B)
      immunities: ["undead"],
      items: {
        remove: ["RING95", "immune1", "SPECTR", "bdspirit", "GHOST"],
      },
      script: {
        // MAGE20C: CtB's crown-made spectre (CBMALR6B) carries the vanilla level 20 mage script
        remove: ["DAO01", "MAGE20C"],
      },
    },
  });
  spectre.addTrait({
    immunities: ["cold", "incorporeal"],
  });
  specterTouch(spectre);
  createClaws(spectre, {
    diceThrown: 1,
    diceSize: 8,
    castSpell: {
      spell: entry.spell(Ids.SpecterTouch).file,
    },
  });
  spectre.setAdjustments([
    {
      files: ["SARSPIR", "SAHSPC01", "L0MERCH", "L0SUMM5", "SPECTR01", "CBMALR6B"],
      data: { level1: 10 },
    },
  ]);
  return spectre;
}

export const createSpectreEntry = () => new SimpleEntry(EntryEnum.Spectre, [spectre]);
