import { SpellBookName } from "../../../config/spellbooks/spellbook-name";
import { SpellbookModName } from "../../../config/spells/spellbook-mod-name";
import { SpellReference } from "../../../config/spells/spell-names";

export interface SpellBookSpells {
  level: number;
  base: SpellReference[];
  additionnals: SpellReference[];
  repeat: SpellReference[];
}

/**
 * One mod's spell set for a SpellBook - lets the same named spellbook (e.g. "EvilUndeadCleric")
 * define a different set of spells per installed mod. createSpellbook picks the first entry,
 * while createSpellbooks returns one generated SpellbookVariant per entry.
 */
export interface SpellBookModVariant {
  mod: SpellbookModName;
  values: SpellBookSpells[];
}

export interface SpellBook {
  name: SpellBookName;
  spells: SpellBookModVariant[];
}
