import { MonsterEnum } from "./monster";
import { Creature } from "../src/model/creature/creature";
import type { CreatureEntry } from "../src/model/creature/entry";

// Not registered (no entry yet), as in the former Undead entry.
export function deathShade(entry: CreatureEntry<Creature>): Creature {
  const shade = entry.create({
    monster: MonsterEnum.DeathShade,
    name: "monster.deathShade.name",
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
      size: { value: "Medium", tall: true, long: false },
      movement: 18,
      immunities: ["undead"],
      items: {
        remove: ["ring95", "bdbonbat"],
      },
    },
  });
  shade.addTrait({});
  shade.setBehavior({
    restHeal: true,
  });
  return shade;
}
