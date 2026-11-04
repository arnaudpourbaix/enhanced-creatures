import { SpellTypeEnum } from "../../src/model/spell-item/effect.enums";
import { SpellRole, SpellTier } from "./spell-role";
import { NEW_SPELLS } from "./spells";

/** What the cast order rules need of a spell this mod creates and casters memorize (NEW_SPELLS). */
export interface NewSpellProfile {
  level: number;
  type: SpellTypeEnum;
  role: SpellRole;
  secondaryRoles?: SpellRole[];
  tier?: SpellTier;
  castingTime: number;
}

/** One per NEW_SPELLS file, as defined in lib/spells (MainService.checkSpellProfiles checks it). */
export const NEW_SPELL_PROFILES: Record<string, NewSpellProfile> = {
  // lib/spells/symbol_pain.ts
  [NEW_SPELLS.WizardSymbolOfPain]: {
    level: 8,
    type: SpellTypeEnum.Wizard,
    role: "disable",
    castingTime: 3,
  },
};
