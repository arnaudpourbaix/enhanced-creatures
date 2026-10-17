import { ImmunityName } from "../final/immunity";
import { CreatureSize } from "./sizes";

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
