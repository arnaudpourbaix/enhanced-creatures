import { SpellBook } from "../../src/model/spell-item/spellbook";
import { UndeadClericSpellbook as UndeadClericSpellbook } from "./undead-cleric";
import { UndeadNecromancerSpellbook as UndeadNecromancerSpellbook } from "./undead-necromancer";
import { VampireNecromancerSpellbook } from "./vampire-necromancer";

export const Spellbooks: SpellBook[] = [
  UndeadClericSpellbook,
  UndeadNecromancerSpellbook,
  VampireNecromancerSpellbook,
];
