import { RawCreatureAbility } from "./creature/ability";

export interface BuilderOptions {
  summon: boolean;
}

export interface CodeLine {
  tab: number;
  code: string;
}

export interface AbilityPreset {
  preset: string;
  ability: RawCreatureAbility;
}
