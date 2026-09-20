import { Triggers } from "../../src/model/script/triggers";
import { ScriptTarget } from "../../src/model/constants";
import { SpellCheckKeyword } from "./spell-check-keyword";

/**
 * How to test each SpellCheckKeyword against the current target. A keyword can expand to one or
 * several triggers (e.g. a protection covered by both an old-style stat and a newer spell state).
 */
export const SPELL_CHECK_TRIGGERS: Record<SpellCheckKeyword, Triggers.Trigger[]> = {
  fire: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTFIRE"] }],
  cold: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTCOLD"] }],
  electrical: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTELECTRICITY"] }],
  acid: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTACID"] }],
  poison: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTPOISON"] }],
  magicResistance: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTMAGIC"] }],
  missile: [
    { name: "CheckSpellState", params: [ScriptTarget.token, "PROTECTION_FROM_NORMAL_MISSILES"] },
  ],
  fear: [
    { name: "CheckStatGT", params: [ScriptTarget.token, 0, "WIZARD_RESIST_FEAR"], negation: true },
  ],
  hold: [
    { name: "CheckStatGT", params: [ScriptTarget.token, 0, "CLERIC_FREE_ACTION"], negation: true },
  ],
};
