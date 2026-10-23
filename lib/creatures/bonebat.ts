import effectFactory from "../src/factories/effect.factory";
import { Durations } from "../src/model/game-data/durations";
import {
  ItemAbilitySecondaryTypeEnum,
  ItemAbilityTypeEnum,
  SaveTypeEnum,
} from "../src/model/spell-item/effect.enums";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import {
  SpellProtectionRelation,
  SpellProtectionStat,
} from "../src/model/spell-item/spell-protection";
import { MonsterEnum } from "./monster";
import { Creature } from "../src/model/creature/creature";
import type { CreatureEntry } from "../src/model/creature/entry";
import { EntryEnum } from "./entry";
import { SimpleEntry } from "../src/model/creature/simple-entry";
import { createJaws } from "./types/undead";

enum Ids {
  BonebatTouch,
}

function bonebatTouch(cre: Creature) {
  return cre.addSpell({
    name: "monster.bonebat.ability.touch.name",
    description: "monster.bonebat.ability.touch.description",
    id: Ids.BonebatTouch,
    secondaryType: ItemAbilitySecondaryTypeEnum.Disabling,
    keywords: ["hold"],
    headers: [
      {
        type: ItemAbilityTypeEnum.Melee,
        range: 5,
        effects: [
          {
            opcode: EffectTypeEnum.ProtectionFromResourceAndMessage,
            type: {
              stat: SpellProtectionStat.Race,
              relation: SpellProtectionRelation.Equal,
            },
            value: "ELF",
          },
          ...effectFactory.paralyze({
            duration: 6 * Durations.round,
            saveType: SaveTypeEnum.ParalyzePoisonDeath,
          }),
        ],
      },
    ],
  });
}

export function bonebat(entry: CreatureEntry<Creature>): Creature {
  const bonebat = entry.create({
    monster: MonsterEnum.Bonebat,
    name: "monster.bonebat.name",
    files: [],
    data: {
      level1: 4,
      strength: 12,
      dexterity: 13,
      constitution: 9,
      intelligence: 7,
      wisdom: 10,
      charisma: 14,
      ac: 7,
      apr: 1,
      xpv: 975,
      alignment: "NEUTRAL_EVIL",
      morale: 12,
      general: "UNDEAD",
      race: "SKELETON",
      class: "SKELETON",
      gender: "NIETHER",
      size: { value: "Medium", tall: false, long: true },
      movement: 18,
      immunities: ["undead"],
      items: {
        remove: ["ring95", "bdbonbat"],
      },
    },
  });
  bonebat.addTrait({
    immunities: ["skeletal"],
  });
  bonebatTouch(bonebat);
  createJaws(
    bonebat,
    2,
    4,
    [
      {
        spell: entry.spell(Ids.BonebatTouch).file,
      },
    ],
    "WEAPON1",
  );
  bonebat.setBehavior({
    restHeal: true,
  });
  return bonebat;
}

export const createBonebatEntry = () => new SimpleEntry(EntryEnum.Bonebat, [bonebat]);
