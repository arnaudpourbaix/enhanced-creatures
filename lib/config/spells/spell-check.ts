import { ScriptTarget } from "../../src/model/constants";
import { Triggers } from "../../src/model/script/triggers";
import { SpellKeyword } from "./keyword";

/**
 * How to test each SpellCheckKeyword against the current target. A keyword can expand to one or
 * several triggers (e.g. a protection covered by both an old-style stat and a newer spell state).
 */
export const SPELL_CHECK_TRIGGERS: Record<SpellKeyword, Triggers.Trigger[]> = {
  acid: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTACID"] }],
  blind: [],
  castOnSelf: [],
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
  elf: [{ name: "Race", params: [ScriptTarget.token, "ELF"], negation: true }],
  fear: [
    { name: "CheckStatGT", params: [ScriptTarget.token, 0, "WIZARD_RESIST_FEAR"], negation: true },
  ],
  fire: [{ name: "CheckStatLT", params: [ScriptTarget.token, 50, "RESISTFIRE"] }],
  friendly: [],
  halfElf: [{ name: "Race", params: [ScriptTarget.token, "HALF_ELF"], negation: true }],
  hold: [
    { name: "CheckSpellState", params: [ScriptTarget.token, "CHAOTIC_COMMANDS"], negation: true },
    { name: "CheckStatGT", params: [ScriptTarget.token, 0, "CLERIC_FREE_ACTION"], negation: true },
  ],
  levelDrain: [
    {
      name: "CheckStatGT",
      params: [ScriptTarget.token, 0, "LEVEL_DRAIN_IMMUNITY"],
      negation: true,
    },
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
    // {
    //   name: "CheckStatGT",
    //   params: [ScriptTarget.token, 0, "SHIELDGLOBE"],
    //   negation: true,
    // },
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
