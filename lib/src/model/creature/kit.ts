import { ImmunityName } from "../final/immunity";
import { KitIdentifier } from "../ids/kit";

export interface KitConfig {
  name: KitIdentifier;
  immunities: (level: number) => ImmunityName[];
  abilities: KitAbility[];
  movement: (level: number) => number;
}

export interface KitAbility {
  count: (level: number) => number;
  resource: string;
}
