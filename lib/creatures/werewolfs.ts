// import { RawCreature } from "../src/model/raw/creature";
// import { file } from "../src/services/misc.func";
// import { MonsterEnum } from "./monster";

// // Creature Id
// const id = MonsterEnum.Wolf;
// // Items
// const mainWeapon = file(1, id);
// export const WEREWOLF: RawCreature = {
//   name: "WereWolf",
//   tpaFile: "lib/pnp-monster/werewolf/were",
//   tracking: true,
//   combatWalk: true,
//   data: {
//     level1: 3,
//     bonusHp: 0,
//     strength: 12,
//     dexterity: 15,
//     constitution: 12,
//     intelligence: 4,
//     wisdom: 12,
//     charisma: 6,
//     movement: 18,
//     ac: 7,
//     apr: 1,
//     xpv: 65,
//     alignment: "NEUTRAL",
//     morale: 10,
//     moraleBreak: 4,
//     moraleRecovery: 15,
//     general: "ANIMAL",
//     race: "WOLF",
//     class: "WOLF",
//     gender: "MALE",
//     size: "Small",
//   },
//   data: { removeItems: ["P1-6"] },
//   items: [
//     {
//       file: mainWeapon,
//       equippedSlot: "WEAPON1",
//       type: "Melee",
//       diceThrown: 1,
//       diceSize: 4,
//       damageBonus: 1,
//       damageType: "Piercing",
//       speed: 3,
//       abilityFlags: ["AddStrengthBonus"],
//     },
//   ],
//   files: [
//     "GATEKE", // Gatekeeper
//     "MEMNIS", // Meym
//     "WOLFW2", // Kryla
//     "WOLFW3", // Palin
//   ],
//   adjustments: [{ files: ["WOLFSU"], summon: true }],
// };
