import { Triggers } from "../../src/model/script/triggers";
import { ScriptTarget } from "../../src/model/constants";
import { SpellCheckKeyword } from "./spell-check-keyword";
import triggerFactory from "../../src/factories/trigger.factory";

/**
 * How to test each SpellCheckKeyword against the current target. A keyword can expand to one or
 * several triggers (e.g. a protection covered by both an old-style stat and a newer spell state).
 */
export const SPELL_CHECK_TRIGGERS: Record<SpellCheckKeyword, Triggers.Trigger[]> = {
  acid: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTACID"] }],
  blind: [],
  causeWounds: [],
  cloud: [],
  charm: [
    { name: "CheckSpellState", params: [ScriptTarget.token, "CHAOTIC_COMMANDS"], negation: true },
  ],
  cold: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTCOLD"] }],
  confusion: [
    { name: "CheckSpellState", params: [ScriptTarget.token, "CHAOTIC_COMMANDS"], negation: true },
  ],
  death: [{ name: "CheckSpellState", params: [ScriptTarget.token, "DEATH_WARD"], negation: true }],
  disease: [],
  electrical: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTELECTRICITY"] }],
  fear: [
    { name: "CheckStatGT", params: [ScriptTarget.token, 0, "WIZARD_RESIST_FEAR"], negation: true },
  ],
  fire: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTFIRE"] }],
  hold: [
    { name: "CheckSpellState", params: [ScriptTarget.token, "CHAOTIC_COMMANDS"], negation: true },
    { name: "CheckStatGT", params: [ScriptTarget.token, 0, "CLERIC_FREE_ACTION"], negation: true },
  ],
  levelDrain: [
    { name: "CheckStat", params: [ScriptTarget.token, 1, "SCRIPTINGSTATE3"], negation: true },
  ],
  magicDamage: [
    {
      name: "CheckStatGT",
      params: [ScriptTarget.token, 0, "WIZARD_PROTECTION_FROM_MAGIC_ENERGY"],
      negation: true,
    },
  ],
  magicResistance: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTMAGIC"] }],
  maze: [],
  miscast: [],
  missile: [
    {
      name: "CheckSpellState",
      params: [ScriptTarget.token, "PROTECTION_FROM_NORMAL_MISSILES"],
      negation: true,
    },
  ],
  movement: [
    { name: "CheckStatGT", params: [ScriptTarget.token, 0, "CLERIC_FREE_ACTION"], negation: true },
  ],
  petrify: [],
  poison: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTPOISON"] }],
  polymorph: [],
  shield: [
    { name: "CheckStat", params: [ScriptTarget.token, 2, "SCRIPTINGSTATE5"], negation: true },
  ],
  silence: [],
  sleep: [
    { name: "CheckSpellState", params: [ScriptTarget.token, "CHAOTIC_COMMANDS"], negation: true },
  ],
  slow: [],
  stun: [
    { name: "CheckSpellState", params: [ScriptTarget.token, "CHAOTIC_COMMANDS"], negation: true },
  ],
};
