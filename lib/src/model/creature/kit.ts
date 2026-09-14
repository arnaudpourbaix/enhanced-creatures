import { ImmunityName } from "../final/immunity";
import { KitIdentifier } from "../ids/kit";
import { Effect } from "../spell-item/effect";

export interface KitConfig {
  name: KitIdentifier;
  immunities: (level: number) => ImmunityName[];
  effects: (level: number) => Effect[];
  abilities: KitAbility[];
  movement: (level: number) => number;
}

export interface KitAbility {
  count: (level: number) => number;
  resource: string;
}
