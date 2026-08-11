import { ImmunityName } from "../final/immunity";
import { KitIdentifier } from "../ids/kit";
import { RawCreatureAbility } from "./ability";

export interface KitConfig {
  name: KitIdentifier;
  immunities: (level: number) => ImmunityName[];
  abilities: KitAbility[];
  movement: (level: number) => number;
}

export interface KitAbility {
  ability: RawCreatureAbility;
  count: (level: number) => number;
  resource: string;
}
