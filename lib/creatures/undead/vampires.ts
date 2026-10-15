import effectFactory from "../../src/factories/effect.factory";
import { MonsterEnum } from "../monster";
import type { UndeadFamily } from "./family";
import { Undead } from "./undead-creature";

export function fledglingVampire(family: UndeadFamily): Undead {
  const fledgling = family.create({
    monster: MonsterEnum.VampireFledgling,
    name: "monster.undead.name.fledglingVampire",
    files: [],
    data: {
      level1: 8,
      bonusHp: 3,
      strength: 18,
      exceptionalStrength: 76,
      dexterity: 16,
      constitution: 9,
      intelligence: 16,
      wisdom: 15,
      charisma: 14,
      ac: 1,
      apr: 1,
      xpv: 8000,
      alignment: "CHAOTIC_EVIL",
      morale: 16,
      general: "UNDEAD",
      race: "VAMPIRE",
      class: "VAMPIRE",
      size: { value: "Medium", tall: true, long: false },
      movement: 12, // Fl 18 in mist form
      immunities: ["undead"],
      moveSilent: 100,
      items: {
        remove: ["ring95", "immune1", "immune2", "vamp", "vampreg"],
      },
    },
  });
  fledgling.createClaws({
    diceThrown: 1,
    diceSize: 6,
    effects: effectFactory.levelDrain({ levels: 2 }),
  });
  fledgling.addTrait({
    immunities: ["nonMagicalWeapons", "coldResistance", "lightningResistance"],
    effects: [effectFactory.regeneration(3)],
  });
  // The gaze of a vampire is one of its most powerful and dangerous weapons.
  // Any person who allows the vampire to look into his eyes will be affected as if by a charm person spell.
  // Due to the power of this enchantment, a -2 is applied to the victim’s saving throw vs. spell.
  // In this manner, vampires are often able to pass posted sentries and surprise their chosen victims.
  // Duration : 8 rounds ?
  fledgling.setAdjustments([]);
  return fledgling;
}

export function matureVampire(family: UndeadFamily): Undead {
  const mature = family.createFrom({
    name: "monster.undead.name.matureVampire",
    monster: MonsterEnum.VampireMature,
    from: family.creature(MonsterEnum.VampireFledgling),
  });
  mature.setData({
    level1: 9,
    exceptionalStrength: 91,
    dexterity: 17,
    charisma: 15,
    movement: 15,
  });
  mature.addTrait({
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
  mature.createClaws({
    diceThrown: 3,
    diceSize: 4,
  });
  mature.setAdjustments([
    {
      files: ["ZOMBJU01", "NEVM5", "BHGHOUL5", "D9MBJU01"],
      stringRef: "monster.undead.name.zombieJuju",
    },
    {
      files: ["L#RVZDOE"],
      data: {
        level1: 9,
        apr: 2,
      },
    },
    { files: ["ESXSERM"], data: { level1: 15, apr: 3, ac: -2, xpv: 2250 } },
  ]);
  return mature;
}
