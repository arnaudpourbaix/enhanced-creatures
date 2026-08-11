import { SpellGroupName } from "../../../config/spells/spell-group-name";
import { SpellIdentifier } from "../ids/spell";

export interface SpellGroup {
  name: SpellGroupName;
  idsSpells?: {
    id: SpellIdentifier | (string & {});
    /**
     * Resource will be defined without and for each suffix
     */
    suffixes?: string[];
  }[];
  spells?: string[];
}
