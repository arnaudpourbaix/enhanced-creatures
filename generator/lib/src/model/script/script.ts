import { CreatureAbility, RawCreatureAbility } from "../creature/ability";
import { Actions } from "./actions";
import { Triggers } from "./triggers";
import { PartialBy } from "../utility-types";
import { TargetList } from "./target";

export type Statements = ConditionalStatement[];

export interface ConditionalStatement {
  comment?: string;
  target?: TargetList;
  triggers: Triggers.Trigger[];
  responses: Response[];
}

export interface Response {
  weight: number;
  actions: Actions.Action[];
}

export interface CustomCode {
  location: CustomCodeLocation;
  type: CustomCodeType;
  statements: ConditionalStatement[];
  abilities: CreatureAbility[];
}

export type PartialCustomCode = Omit<
  PartialBy<CustomCode, "statements">,
  "abilities"
> & { abilities?: RawCreatureAbility[] };

export interface AdditionalCode {
  location: CustomCodeLocation;
  triggers: Triggers.Trigger[];
  actions: Actions.Action[];
}

export type PartialAdditionalCode = PartialBy<
  AdditionalCode,
  "triggers" | "actions"
>;

export type CustomCodeLocation =
  | "attack"
  | "creatureAbilities"
  | "destroyUponDeath"
  | "detectCombat"
  | "dialog"
  | "followSummoner"
  | "handlePanic"
  | "init"
  | "kitAbilities"
  | "noActionOutsideOfCombat"
  | "potions"
  | "precastLongDurationSpells"
  | "precastMidDurationSpells"
  | "randomWalkNoCombat"
  | "randomWalkCombat"
  | "rest"
  | "shouts"
  | "thievesAbilities"
  | "trackTargets"
  | "turnHostile";

export type CustomCodeType = "insertBefore" | "insertAfter" | "replace";
