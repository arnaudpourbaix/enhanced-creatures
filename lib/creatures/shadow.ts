import { EXISTING_ITEMS } from "../config/item";
import { JEWEL_SLOTS } from "../src/model/creature/item";
import { EffectTypeEnum } from "../src/model/spell-item/effect.type";
import { MonsterEnum } from "./monster";
import { Creature } from "../src/model/creature/creature";
import type { CreatureEntry } from "../src/model/creature/entry";
import { EntryEnum } from "./entry";
import { SimpleEntry } from "../src/model/creature/simple-entry";
import { createShadowWeapon } from "./types/undead";

export function shadow(entry: CreatureEntry<Creature>): Creature {
  const shadow = entry.create({
    monster: MonsterEnum.Shadow,
    name: "monster.undead.name.shadow",
    files: [],
    data: {
      level1: 3,
      bonusHp: 3,
      strength: 6,
      dexterity: 14,
      constitution: 9,
      intelligence: 7,
      wisdom: 10,
      charisma: 8,
      ac: 7,
      apr: 1,
      xpv: 420,
      alignment: "CHAOTIC_EVIL",
      morale: 20,
      general: "MONSTER",
      race: "SHADOW",
      class: "SHADOW",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
      immunities: ["undead"],
      items: {
        remove: [
          "immune1",
          "undtype",
          "ring95",
          "shadowwp",
          "s1-8",
          "s1-12m2",
          "ac#fpmds",
          "shadowsu",
        ],
      },
      script: {
        remove: ["SEWSHA03", "attack"],
      },
    },
  });
  shadow.addTrait({ immunities: ["cold", "incorporeal"] });
  createShadowWeapon(shadow, {
    diceThrown: 1,
    diceSize: 4,
    damageBonus: 1,
    opcode: EffectTypeEnum.StrengthBonus,
    drainValue: -1,
  });
  const mindWeapon = createShadowWeapon(shadow, {
    diceThrown: 1,
    diceSize: 4,
    damageBonus: 1,
    opcode: EffectTypeEnum.WisdomBonus,
    drainValue: -2,
    equipped: false,
  });
  shadow.setAdjustments([
    {
      files: ["va#shdgl"],
      data: {
        script: { location: "None" },
      },
    },
    {
      files: ["AC#FPMDS"],
      data: {
        items: { equipped: [{ file: mindWeapon.file, slot: "WEAPON1" }] },
      },
    },
    {
      files: ["BDSHAD02", "L#GNOAL", "L#GNOEN"],
      data: { level1: 5, xpv: 650, strength: 18 },
    },
  ]);
  shadow.setBehavior({
    restHeal: true,
  });
  return shadow;
}

export function greaterShadow(entry: CreatureEntry<Creature>): Creature {
  // The largest greater shadow, composed of eight undead shadows,
  // has 8+8 HD and THAC0 11.
  // Regardless of its size, the creature has AC 7.
  // It receives a number of attacks per round equal to; the number of incorporated shadows.
  const greaterShadow = entry.createFrom({
    name: "monster.undead.name.greaterShadow",
    monster: MonsterEnum.GreaterShadow,
    from: entry.creature(MonsterEnum.Shadow),
  });
  greaterShadow.setData({
    level1: 8,
    bonusHp: 8,
    apr: 8,
    xpv: 3000,
    animation: "SHADOW_LARGE",
    items: {
      remove: ["BDSHADGR", "BDSPECTQ", "BDSHADGA"],
      equipped: [{ file: EXISTING_ITEMS.InvisibilityRing, slot: JEWEL_SLOTS }],
    },
  });
  greaterShadow.setAdjustments([]);
  return greaterShadow;
}

export function greaterShadow5e(entry: CreatureEntry<Creature>): Creature {
  const greaterShadow = entry.create({
    monster: MonsterEnum.GreaterShadow,
    name: "monster.undead.name.greaterShadow",
    files: [],
    data: {
      level1: 8,
      bonusHp: 8,
      strength: 10,
      dexterity: 16,
      constitution: 9,
      intelligence: 11,
      wisdom: 14,
      charisma: 12,
      ac: 7,
      apr: 1,
      xpv: 3000,
      alignment: "CHAOTIC_EVIL",
      morale: 20,
      general: "MONSTER",
      race: "SHADOW",
      class: "SHADOW",
      gender: "NIETHER",
      size: { value: "Medium", tall: true, long: false },
      movement: 12,
      immunities: ["undead"],
      items: {
        remove: ["BDSHADGR", "immune1", "ring95", "BDSHADGA"],
      },
      script: {
        location: "None",
      },
    },
  });
  greaterShadow.addTrait({ immunities: ["cold", "incorporeal"] });
  createShadowWeapon(greaterShadow, {
    diceThrown: 2,
    diceSize: 6,
    damageBonus: 2,
    opcode: EffectTypeEnum.StrengthBonus,
    drainValue: -3,
  });
  greaterShadow.setBehavior({
    restHeal: true,
  });
  greaterShadow.setAdjustments([]);
  return greaterShadow;
}

export const createShadowEntry = () => new SimpleEntry(EntryEnum.Shadow, [shadow, greaterShadow]);
