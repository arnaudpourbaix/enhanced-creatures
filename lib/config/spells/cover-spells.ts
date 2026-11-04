import { spellFiles } from "../../src/model/spell-item/spell-reference";
import { SPELLS } from "./spell-database";

/**
 * Spells covering their caster until it attacks or casts an offensive spell: under them, it first
 * protects and buffs itself (see CastOrderService.coveredPlan and the covered phase's statements).
 */
export const COVER_SPELLS: string[] = [
  SPELLS.Priest.Sanctuary,
  SPELLS.Wizard.Invisibility,
  SPELLS.Wizard.InvisibilitySphere,
].flatMap((spell) => spellFiles(spell).map((file) => file.toUpperCase()));
