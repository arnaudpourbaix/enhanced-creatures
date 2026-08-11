import { GenericScriptData } from "./model/script/data";
import { ImmunityConfig } from "./model/final/immunity";
import { Creature } from "./model/creature/creature";
import { Item, Spell } from "./model/spell-item/spell-item";

export const State = {
  actions: [] as GenericScriptData[],
  triggers: [] as GenericScriptData[],
  immunities: [] as ImmunityConfig[],
  modFolder: "" as string,
  creatures: [] as Creature[],
  spells: [] as Spell[],
  items: [] as Item[],
};
