import { SpellBook } from "../../src/model/spell-item/spellbook";
import { EvilUndeadClericSpellbook } from "./evil-undead-cleric";
import { EvilUndeadMageNoFFSpellbook, EvilUndeadMageSpellbook } from "./evil-undead-mage";

export const Spellbooks: SpellBook[] = [
  EvilUndeadClericSpellbook,
  EvilUndeadMageSpellbook,
  EvilUndeadMageNoFFSpellbook,
];
