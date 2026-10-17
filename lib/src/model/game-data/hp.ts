import { MonsterEnum } from "../../../creatures/monster";
import { ImmunityName } from "../final/immunity";
import { CreatureSize } from "./sizes";

/**
 * Per-monster hit dice, overriding the type-driven die. The type dice (fey d6, undead d12, dragon
 * d12, ooze d10, construct d10, magical beast d10) are the `hitDie` of the type modules
 * (`lib/creatures/types/`); with neither, a creature has d8.
 */
export const HitDiceTable: {
  monsterId: MonsterEnum;
  hd: number;
}[] = [
  //   { monsterId: MonsterEnum.DeathKnight, hd: 10 },
];

export const SizeBonusHitPointTable: {
  type: ImmunityName;
  size: CreatureSize;
  hp: number;
}[] = [
  { type: "construct", size: "Tiny", hp: 0 },
  { type: "construct", size: "Small", hp: 10 },
  { type: "construct", size: "Medium", hp: 20 },
  { type: "construct", size: "Large", hp: 30 },
  { type: "construct", size: "Huge", hp: 40 },
  { type: "construct", size: "Gargantuan", hp: 60 },
  { type: "construct", size: "Colossal", hp: 80 },
];
