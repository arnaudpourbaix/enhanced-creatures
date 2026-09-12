import { SpellBookName } from "../../../config/spellbooks/spellbook-name";
import { SpellReference } from "../../../config/spells/spell-names";

export interface SpellBookSpells {
  level: number;
  base: SpellReference[];
  additionnals: SpellReference[];
  repeat: SpellReference[];
}

export interface SpellBook {
  name: SpellBookName;
  spells: SpellBookSpells[];
}
