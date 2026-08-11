import { MonsterEnum, MonsterFamilyEnum } from "../../../creatures/monster";
import { ImmunityName } from "../final/immunity";
import { CreatureSize } from "./sizes";

/**
 * If no match in this table, default value is 8hd
 */
export const HitDiceTable: {
  monsterId?: MonsterEnum;
  familyId?: MonsterFamilyEnum;
  type?: ImmunityName;
  hd: number;
}[] = [
  //   { monsterId: MonsterEnum.DeathKnight, hd: 10 },
  { familyId: MonsterFamilyEnum.Fey, hd: 6 },
  { familyId: MonsterFamilyEnum.Undead, hd: 12 },
  { familyId: MonsterFamilyEnum.Dragon, hd: 12 },
  { familyId: MonsterFamilyEnum.Ooze, hd: 10 },
  { type: "construct", hd: 10 },
  { type: "magicalBeast", hd: 10 },
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
